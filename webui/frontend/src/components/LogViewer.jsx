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

  const parseLogLine = (line) => {
    const logPattern = /^\[([^\]]+)\]\s*\[([^\]]+)\]\s*\|L\.(\d+)\s*\|\s*(.*)$/;
    const match = line.match(logPattern);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2].trim(),
        lineNum: match[3],
        message: match[4],
      };
    }
    return { raw: line };
  };

  const getLevelColor = (level) => {
    if (!level) return null;
    const l = level.toLowerCase();
    if (l === "error") return { color: "#f87171" };
    if (l === "warning" || l === "warn") return { color: "#fbbf24" };
    if (l === "info") return { color: "#22d3ee" };
    if (l === "success") return { color: "#4ade80" };
    if (l === "debug") return { color: "#c084fc" };
    return { color: "#9ca3af" };
  };

  const fetchAvailableLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();
      setAvailableLogs(data.logs);
    } catch (error) {
      console.error("Error fetching log files:", error);
    }
  };

  const fetchLogFile = async (logName) => {
    try {
      const response = await fetch(`${API_URL}/logs/${logName}?tail=500`);
      const data = await response.json();
      setLogs(data.content);
    } catch (error) {
      console.error("Error fetching log:", error);
    }
  };

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
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          {availableLogs.map((log) => (
            <option key={log.name} value={log.name}>
              {log.name} ({(log.size / 1024).toFixed(2)} KB)
            </option>
          ))}
        </select>
      </div>

      {/* Compact Terminal-Style Log Container */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div
          ref={logContainerRef}
          className="h-[700px] overflow-y-auto bg-black p-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {logs.length === 0 ? (
            <div className="text-gray-600 text-center py-12 text-xs">
              No logs to display
            </div>
          ) : (
            <div className="font-mono text-[10px] leading-tight tracking-tighter">
              {logs.map((line, index) => {
                const parsed = parseLogLine(line);

                if (parsed.raw) {
                  return (
                    <div
                      key={index}
                      className="px-1 py-0.5 text-gray-400 hover:bg-gray-900/50"
                    >
                      {parsed.raw}
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className="px-1 py-0.5 hover:bg-gray-900/50 flex items-center gap-2"
                  >
                    <span className="text-gray-600">[{parsed.timestamp}]</span>
                    <span
                      className="font-bold"
                      style={getLevelColor(parsed.level)}
                    >
                      [{parsed.level}]
                    </span>
                    <span className="text-gray-700">|L.{parsed.lineNum}</span>
                    <span className="text-gray-300">| {parsed.message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-[10px] text-gray-500 flex justify-between">
        <span>{logs.length} log entries</span>
        <span>Last 500 lines loaded</span>
      </div>
    </div>
  );
}

export default LogViewer;
