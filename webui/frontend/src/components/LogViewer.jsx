import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Download, Trash2 } from "lucide-react";

const API_URL = "http://localhost:8000/api";
const WS_URL = "ws://localhost:8000/ws/logs";

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [availableLogs, setAvailableLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState("Scriptlog.log");
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const logContainerRef = useRef(null);
  const wsRef = useRef(null);

  // Parse log line
  const parseLogLine = (line) => {
    // [2025-10-04 13:06:27] [INFO] |L.228 | message
    const logPattern = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\|L\.(\d+)\s*\|\s*(.*)$/;
    const match = line.match(logPattern);

    if (match) {
      return {
        timestamp: match[1].split(" ")[1], // Just time
        date: match[1].split(" ")[0], // Just date
        level: match[2].trim(),
        lineNum: match[3],
        message: match[4],
      };
    }

    return { raw: line };
  };

  // Get level styling
  const getLevelStyle = (level) => {
    if (!level) return { text: "text-gray-400", bg: "bg-gray-700" };
    const l = level.toLowerCase();

    if (l === "error")
      return {
        text: "text-red-300",
        bg: "bg-red-950",
        border: "border-l-red-500",
      };
    if (l === "warning" || l === "warn")
      return {
        text: "text-yellow-300",
        bg: "bg-yellow-950",
        border: "border-l-yellow-500",
      };
    if (l === "info")
      return {
        text: "text-blue-300",
        bg: "bg-blue-950",
        border: "border-l-blue-500",
      };
    if (l === "success")
      return {
        text: "text-green-300",
        bg: "bg-green-950",
        border: "border-l-green-500",
      };

    return {
      text: "text-gray-400",
      bg: "bg-gray-800",
      border: "border-l-gray-600",
    };
  };

  // Fetch log files
  const fetchAvailableLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();
      setAvailableLogs(data.logs);
    } catch (error) {
      console.error("Error fetching log files:", error);
    }
  };

  // Fetch specific log
  const fetchLogFile = async (logName) => {
    try {
      const response = await fetch(`${API_URL}/logs/${logName}?tail=100`);
      const data = await response.json();
      setLogs(data.content);
    } catch (error) {
      console.error("Error fetching log:", error);
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "log") {
        setLogs((prev) => [...prev, data.content]);
      }
    };

    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);

    wsRef.current = ws;
  };

  useEffect(() => {
    fetchAvailableLogs();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const logText = logs.join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedLog}_${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-purple-400">Logs</h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-400 animate-pulse" : "bg-red-400"
              }`}
            ></span>
            <span className="text-sm text-gray-400">
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            />
            <span className="text-sm text-gray-300">Auto-scroll</span>
          </label>

          <button
            onClick={fetchAvailableLogs}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={downloadLogs}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            onClick={clearLogs}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Log selector */}
      <div className="mb-4">
        <select
          value={selectedLog}
          onChange={(e) => {
            setSelectedLog(e.target.value);
            fetchLogFile(e.target.value);
          }}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white"
        >
          {availableLogs.map((log) => (
            <option key={log.name} value={log.name}>
              {log.name} ({(log.size / 1024).toFixed(2)} KB)
            </option>
          ))}
        </select>
      </div>

      {/* Log container - SIMPLE & READABLE */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div ref={logContainerRef} className="h-[650px] overflow-y-auto p-3">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              No logs to display
            </div>
          ) : (
            logs.map((line, index) => {
              const parsed = parseLogLine(line);

              // Unparsed line - simple display
              if (parsed.raw) {
                return (
                  <div
                    key={index}
                    className="mb-1 p-2 bg-gray-800/50 rounded text-gray-300 font-mono text-sm hover:bg-gray-700/50"
                  >
                    {parsed.raw}
                  </div>
                );
              }

              // Parsed line - clean, readable format
              const style = getLevelStyle(parsed.level);

              return (
                <div
                  key={index}
                  className={`mb-1.5 p-2 rounded border-l-4 ${style.border} ${style.bg} hover:brightness-110 transition-all`}
                >
                  <div className="flex items-start gap-3 font-mono">
                    {/* Time */}
                    <span className="text-gray-500 text-xs font-semibold min-w-[70px]">
                      {parsed.timestamp}
                    </span>

                    {/* Level badge */}
                    <span
                      className={`${style.text} font-bold text-xs uppercase px-2 py-0.5 rounded min-w-[65px] text-center`}
                    >
                      {parsed.level}
                    </span>

                    {/* Line number */}
                    <span className="text-gray-600 text-xs min-w-[45px]">
                      L.{parsed.lineNum}
                    </span>

                    {/* Message */}
                    <span className="flex-1 text-gray-200 text-sm leading-relaxed">
                      {parsed.message}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400 text-right">
        {logs.length} log entries
      </div>
    </div>
  );
}

export default LogViewer;
