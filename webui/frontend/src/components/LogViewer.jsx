import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  RefreshCw,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  Wifi,
  WifiOff,
  ChevronDown,
  Activity,
  Square,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Notification from "./Notification";
import { useToast } from "../context/ToastContext";

const API_URL = "/api";
const isDev = import.meta.env.DEV;

const getWebSocketURL = (logFile) => {
  const baseURL = isDev
    ? `ws://localhost:3000/ws/logs`
    : `ws://${window.location.host}/ws/logs`;

  // Add log_file as query parameter
  return `${baseURL}?log_file=${encodeURIComponent(logFile)}`;
};

function LogViewer() {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useToast();
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [availableLogs, setAvailableLogs] = useState([]);

  const initialLogFile = location.state?.logFile || "Scriptlog.log";
  const [selectedLog, setSelectedLog] = useState(initialLogFile);

  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("All log levels");
  const [linesPerPage, setLinesPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const [status, setStatus] = useState({
    running: false,
    current_mode: null,
  });

  const logContainerRef = useRef(null);
  const wsRef = useRef(null);
  const dropdownRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const currentLogFileRef = useRef(initialLogFile); // Initialize with passed log file

  const parseLogLine = (line) => {
    const cleanedLine = line.replace(/\x00/g, "").trim();

    if (!cleanedLine) {
      return { raw: null };
    }

    const logPattern = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\|L\.(\d+)\s*\|\s*(.*)$/;
    const match = cleanedLine.match(logPattern);

    if (match) {
      return {
        timestamp: match[1],
        level: match[2].trim(),
        lineNum: match[3],
        message: match[4],
      };
    }
    return { raw: cleanedLine };
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      setStatus({
        running: data.running || false,
        current_mode: data.current_mode || null,
      });
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const stopScript = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/stop`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        showSuccess(t("logViewer.scriptStopped"));
        fetchStatus(); // Refresh status
      } else {
        showError(t("logViewer.error", { message: data.message }));
      }
    } catch (error) {
      showError(t("logViewer.error", { message: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const LogLevel = ({ level }) => {
    const levelLower = (level || "").toLowerCase().trim();

    const colors = {
      error: "#f87171",
      warning: "#fbbf24",
      warn: "#fbbf24",
      info: "#42A5F5",
      success: "#4ade80",
      debug: "#c084fc",
      default: "#9ca3af",
    };

    const color = colors[levelLower] || colors.default;

    return <span style={{ color: color, fontWeight: "bold" }}>[{level}]</span>;
  };

  const getLogColor = (level) => {
    const levelLower = (level || "").toLowerCase().trim();

    const colors = {
      error: "#f87171",
      warning: "#fbbf24",
      warn: "#fbbf24",
      info: "#42A5F5",
      success: "#4ade80",
      debug: "#c084fc",
      default: "#d1d5db",
    };

    return colors[levelLower] || colors.default;
  };

  const fetchAvailableLogs = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();
      setAvailableLogs(data.logs);

      if (showToast) {
        showSuccess(t("logViewer.logsRefreshed"));
      }
    } catch (error) {
      console.error("Error fetching log files:", error);
      if (showToast) {
        showError(t("logViewer.refreshFailed"));
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const fetchLogFile = async (logName) => {
    try {
      const response = await fetch(`${API_URL}/logs/${logName}?tail=1000`);
      const data = await response.json();
      const strippedContent = data.content.map((line) => line.trim());
      setLogs(strippedContent);
    } catch (error) {
      console.error("Error fetching log:", error);
      showError(t("logViewer.loadFailed", { name: logName }));
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;

      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setConnected(false);
    setIsReconnecting(false);
  };

  const connectWebSocket = (logFile = selectedLog) => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      // If already connected to the correct log file, don't reconnect
      if (currentLogFileRef.current === logFile) {
        console.log(`Already connected to ${logFile}`);
        return;
      }
    }

    disconnectWebSocket();

    try {
      const wsURL = getWebSocketURL(logFile);
      console.log(`Connecting to WebSocket: ${wsURL}`);

      const ws = new WebSocket(wsURL);
      currentLogFileRef.current = logFile; // Track which log we're watching

      ws.onopen = () => {
        console.log(`WebSocket connected to ${logFile}`);
        setConnected(true);
        setIsReconnecting(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "log") {
            setLogs((prev) => [...prev, data.content]);
          } else if (data.type === "log_file_changed") {
            // Only accept this if we're NOT manually viewing a specific log
            console.log(`Backend wants to switch to: ${data.log_file}`);

            // Update selectedLog only if user hasn't manually selected a different one
            // This prevents the backend from overriding user's manual selection
            if (selectedLog === currentLogFileRef.current) {
              console.log(`Accepting backend log switch to: ${data.log_file}`);
              setSelectedLog(data.log_file);
              currentLogFileRef.current = data.log_file;
              showInfo(t("logViewer.switchedTo", { file: data.log_file }));
            } else {
              console.log(
                `Ignoring backend log switch - user manually selected ${selectedLog}`
              );
            }
          } else if (data.type === "error") {
            console.error("WebSocket error message:", data.message);
            showError(data.message);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.warn("WebSocket error:", error);
        setConnected(false);
      };

      ws.onclose = (event) => {
        console.log(" WebSocket closed:", event.code);
        setConnected(false);

        if (!event.wasClean) {
          setIsReconnecting(true);

          showError(t("logViewer.disconnected"));

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting to ${currentLogFileRef.current}...`);
            connectWebSocket(currentLogFileRef.current); // Reconnect to the same log file
          }, 2000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setConnected(false);
      setIsReconnecting(true);

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket(logFile);
      }, 3000);
    }
  };

  useEffect(() => {
    fetchAvailableLogs();
    fetchLogFile(selectedLog);
    connectWebSocket(selectedLog);

    return () => {
      disconnectWebSocket();
    };
  }, []);

  useEffect(() => {
    fetchStatus(); // Initial fetch
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.state?.logFile && location.state.logFile !== selectedLog) {
      console.log(
        ` LogViewer received log file from navigation: ${location.state.logFile}`
      );
      setSelectedLog(location.state.logFile);

      showSuccess(t("logViewer.switchedTo", { file: location.state.logFile }));
    }
  }, [location.state?.logFile]);

  useEffect(() => {
    console.log(`Selected log changed to: ${selectedLog}`);
    fetchLogFile(selectedLog);

    // Always reconnect when user manually changes log file
    if (wsRef.current) {
      disconnectWebSocket();
      setTimeout(() => {
        connectWebSocket(selectedLog);
      }, 300);
    }
  }, [selectedLog]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
    showSuccess(t("logViewer.logsCleared"));
  };

  const downloadLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/logs/${selectedLog}?tail=0`);
      const data = await response.json();

      const logText = data.content.join("\n");
      const blob = new Blob([logText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const logNameWithoutExt = selectedLog.replace(/\.[^/.]+$/, "");
      a.download = `${logNameWithoutExt}_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.log`;

      a.click();
      URL.revokeObjectURL(url);

      showSuccess(t("logViewer.downloaded"));
    } catch (error) {
      console.error("Error downloading complete log file:", error);
      showError(t("logViewer.downloadFailed"));
    }
  };

  const getDisplayStatus = () => {
    if (connected) {
      return {
        color: "bg-green-400",
        icon: Wifi,
        text: t("logViewer.status.live"),
        ringColor: "ring-green-400/30",
      };
    } else if (isReconnecting) {
      return {
        color: "bg-yellow-400",
        icon: Wifi,
        text: t("logViewer.status.reconnecting"),
        ringColor: "ring-yellow-400/30",
      };
    } else {
      return {
        color: "bg-red-400",
        icon: WifiOff,
        text: t("logViewer.status.disconnected"),
        ringColor: "ring-red-400/30",
      };
    }
  };

  const displayStatus = getDisplayStatus();
  const StatusIcon = displayStatus.icon;

  // Filter and paginate logs
  const filteredLogs = logs.slice().filter((line) => {
    const parsed = parseLogLine(line);
    if (parsed.raw === null) return false;

    // Apply level filter
    if (levelFilter !== "All log levels") {
      if (parsed.raw) return false;
      if (parsed.level?.toLowerCase() !== levelFilter.toLowerCase())
        return false;
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (parsed.raw) {
        return parsed.raw.toLowerCase().includes(searchLower);
      }
      return (
        parsed.message?.toLowerCase().includes(searchLower) ||
        parsed.level?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / linesPerPage);
  const startIndex = (currentPage - 1) * linesPerPage;
  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + linesPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, levelFilter, linesPerPage]);

  return (
    <div className="space-y-6">
      {/* Script Running Alert */}
      {status.running && (
        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Activity className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-theme-text">
                  {t("logViewer.scriptRunning")}
                </p>
                <p className="text-sm text-theme-muted">
                  {status.current_mode && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400 mr-2">
                      {t("logViewer.mode")}: {status.current_mode}
                    </span>
                  )}
                  {t("logViewer.stopBeforeRunning")}
                </p>
              </div>
            </div>
            <button
              onClick={stopScript}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-theme-muted disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-medium transition-all shadow-sm text-white"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {t("logViewer.stopScript")}
            </button>
          </div>
        </div>
      )}

      {/* Log File Tabs Card */}
      <div className="bg-theme-card rounded-lg shadow-md">
        <div className="flex gap-2 p-2">
          {availableLogs.map((log) => (
            <button
              key={log.name}
              onClick={() => {
                console.log(`User selected log tab: ${log.name}`);
                setSelectedLog(log.name);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                selectedLog === log.name
                  ? "bg-theme-primary text-white scale-105"
                  : "bg-theme-hover hover:bg-theme-primary/70 border border-theme text-theme-text"
              }`}
            >
              <FileText className="w-4 h-4" />
              {log.name.replace(".log", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-theme-card rounded-lg shadow-md p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                connected
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : isReconnecting
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-red-500/50 bg-red-500/10 text-red-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${displayStatus.color} ${
                  connected || isReconnecting ? "animate-pulse" : ""
                }`}
              ></div>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{displayStatus.text}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAvailableLogs(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 text-theme-primary ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              <span className="text-theme-text">{t("logViewer.refresh")}</span>
            </button>

            <button
              onClick={downloadLogs}
              className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-theme-primary" />
              <span className="text-theme-text">{t("logViewer.download")}</span>
            </button>

            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Trash2 className="w-4 h-4 text-theme-primary" />
              <span className="text-theme-text">{t("logViewer.clear")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-theme-card rounded-lg shadow-md overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="bg-theme-card border-b border-theme p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                type="text"
                placeholder="Type to filter logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-theme-hover border border-theme rounded-lg text-sm text-theme-text placeholder-theme-muted focus:outline-none focus:border-theme-primary"
              />
            </div>

            {/* Filter by Level */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-theme-muted whitespace-nowrap">
                Filter by Level
              </span>
              <div className="flex items-center gap-2 bg-theme-hover border border-theme rounded-lg p-1">
                <button
                  onClick={() => setLevelFilter("All log levels")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    levelFilter === "All log levels"
                      ? "bg-theme-primary text-white"
                      : "text-theme-text hover:bg-theme-card"
                  }`}
                >
                  All Levels
                </button>
                <button
                  onClick={() => setLevelFilter("DEBUG")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    levelFilter === "DEBUG"
                      ? "bg-purple-500 text-white"
                      : "text-purple-400 hover:bg-theme-card"
                  }`}
                >
                  [DEBUG]
                </button>
                <button
                  onClick={() => setLevelFilter("INFO")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    levelFilter === "INFO"
                      ? "bg-blue-500 text-white"
                      : "text-blue-400 hover:bg-theme-card"
                  }`}
                >
                  [INFO]
                </button>
                <button
                  onClick={() => setLevelFilter("WARNING")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    levelFilter === "WARNING"
                      ? "bg-yellow-500 text-white"
                      : "text-yellow-400 hover:bg-theme-card"
                  }`}
                >
                  [WARNING]
                </button>
                <button
                  onClick={() => setLevelFilter("ERROR")}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    levelFilter === "ERROR"
                      ? "bg-red-500 text-white"
                      : "text-red-400 hover:bg-theme-card"
                  }`}
                >
                  [ERROR]
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-theme">
                <th className="text-left py-3 px-4 text-theme-muted text-sm font-medium w-48">
                  Timestamp
                </th>
                <th className="text-left py-3 px-4 text-theme-muted text-sm font-medium w-32">
                  Level
                </th>
                <th className="text-left py-3 px-4 text-theme-muted text-sm font-medium">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FileText className="w-12 h-12 text-theme-muted/50 mb-3" />
                      <p className="text-theme-muted font-medium">
                        {searchTerm || levelFilter !== "All log levels"
                          ? t(
                              "logViewer.noMatchingLogs",
                              "No matching logs found"
                            )
                          : t("logViewer.noLogs")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((line, index) => {
                  const parsed = parseLogLine(line);
                  const uniqueKey = `${startIndex + index}-${
                    parsed.timestamp || index
                  }`;

                  if (parsed.raw === null) {
                    return null;
                  }

                  if (parsed.raw) {
                    return (
                      <tr
                        key={uniqueKey}
                        className="hover:bg-theme-hover transition-colors"
                      >
                        <td
                          colSpan="3"
                          className="px-4 py-2 text-xs text-theme-muted font-mono"
                        >
                          {parsed.raw}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={uniqueKey}
                      className="hover:bg-theme-hover transition-colors"
                    >
                      <td className="px-4 py-2 text-xs text-theme-muted font-mono whitespace-nowrap">
                        {parsed.timestamp}
                      </td>
                      <td className="px-4 py-2 text-xs whitespace-nowrap">
                        <LogLevel level={parsed.level} />
                      </td>
                      <td className="px-4 py-2 text-xs text-theme-text font-mono break-all">
                        <span className="text-theme-muted mr-2">
                          L.{parsed.lineNum}
                        </span>
                        {parsed.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-theme-card border-t border-theme px-4 py-3">
          <div className="flex items-center justify-between text-sm flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Lines per page */}
              <div className="flex items-center gap-2">
                <span className="text-theme-muted text-xs">Show</span>
                <select
                  value={linesPerPage}
                  onChange={(e) => setLinesPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-theme-hover border border-theme rounded text-xs text-theme-text focus:outline-none focus:border-theme-primary"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-theme-muted text-xs">lines per page</span>
              </div>

              <div className="text-theme-muted text-xs">
                Showing {paginatedLogs.length > 0 ? startIndex + 1 : 0} to{" "}
                {Math.min(startIndex + linesPerPage, filteredLogs.length)} of{" "}
                {filteredLogs.length} entries
                {searchTerm || levelFilter !== "All log levels"
                  ? ` (filtered from ${logs.length} total)`
                  : ""}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-theme hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all text-theme-text"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-theme-text font-medium px-2 text-xs">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-theme hover:bg-theme-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all text-theme-text"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogViewer;
