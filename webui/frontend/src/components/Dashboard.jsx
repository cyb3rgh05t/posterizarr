import React, { useState, useEffect } from "react";
import {
  Play,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = "http://localhost:8000/api";

function Dashboard() {
  const [status, setStatus] = useState({
    running: false,
    last_logs: [],
    script_exists: false,
    config_exists: false,
    pid: null,
    already_running_detected: false,
    running_file_exists: false,
  });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const runScript = async (mode) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/run/${mode}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Script started in ${mode} mode!`, {
          duration: 4000,
          position: "top-right",
        });
        fetchStatus();
      } else {
        toast.error(`Error: ${data.message}`, {
          duration: 5000,
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
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
        toast.success(data.message, {
          duration: 3000,
          position: "top-right",
        });
      } else {
        toast.error(data.message, {
          duration: 4000,
          position: "top-right",
        });
      }
      fetchStatus();
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const forceKillScript = async () => {
    if (
      !confirm(
        "Force kill the script? This will terminate it immediately without cleanup."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/force-kill`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Script force killed", {
          duration: 3000,
          position: "top-right",
        });
      } else {
        toast.error(data.message, {
          duration: 4000,
          position: "top-right",
        });
      }
      fetchStatus();
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRunningFile = async () => {
    try {
      const response = await fetch(`${API_URL}/running-file`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Running file deleted!", {
          duration: 4000,
          position: "top-right",
        });
        fetchStatus();
      } else {
        toast.error(data.message, {
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        duration: 5000,
        position: "top-right",
      });
    }
  };

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

  // Render log level with EXPLICIT classes (no dynamic strings!)
  const LogLevel = ({ level }) => {
    const levelLower = level.toLowerCase();

    if (levelLower === "error") {
      return <span className="font-bold text-red-400">[{level}]</span>;
    }
    if (levelLower === "warning" || levelLower === "warn") {
      return <span className="font-bold text-yellow-400">[{level}]</span>;
    }
    if (levelLower === "info") {
      return <span className="font-bold text-cyan-400">[{level}]</span>;
    }
    if (levelLower === "success") {
      return <span className="font-bold text-green-400">[{level}]</span>;
    }
    if (levelLower === "debug") {
      return <span className="font-bold text-purple-400">[{level}]</span>;
    }
    return <span className="font-bold text-gray-400">[{level}]</span>;
  };

  return (
    <div className="px-4 py-6">
      <Toaster />

      <h1 className="text-3xl font-bold mb-8 text-purple-400">Dashboard</h1>

      {status.already_running_detected && (
        <div className="mb-6 bg-yellow-900/30 border-2 border-yellow-600/50 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                Another Posterizarr Instance Already Running
              </h3>
              <p className="text-yellow-200 text-sm mb-3">
                The script detected another instance. If this is a false
                positive, delete the running file.
              </p>
              <button
                onClick={deleteRunningFile}
                className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Running File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Script Status</p>
              <p
                className={`text-2xl font-bold ${
                  status.running ? "text-green-400" : "text-gray-300"
                }`}
              >
                {status.running ? "Running" : "Stopped"}
              </p>
              {status.running && status.pid && (
                <p className="text-sm text-gray-500 mt-1">PID: {status.pid}</p>
              )}
            </div>
            {status.running ? (
              <CheckCircle className="h-12 w-12 text-green-400" />
            ) : (
              <Clock className="h-12 w-12 text-gray-500" />
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Script File</p>
              <p
                className={`text-2xl font-bold ${
                  status.script_exists ? "text-green-400" : "text-red-400"
                }`}
              >
                {status.script_exists ? "Found" : "Missing"}
              </p>
            </div>
            {status.script_exists ? (
              <CheckCircle className="h-12 w-12 text-green-400" />
            ) : (
              <AlertCircle className="h-12 w-12 text-red-400" />
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Config File</p>
              <p
                className={`text-2xl font-bold ${
                  status.config_exists ? "text-green-400" : "text-red-400"
                }`}
              >
                {status.config_exists ? "Found" : "Missing"}
              </p>
            </div>
            {status.config_exists ? (
              <CheckCircle className="h-12 w-12 text-green-400" />
            ) : (
              <AlertCircle className="h-12 w-12 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Compact Log Viewer - Terminal Style */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-purple-400">
            Last 10 Log Entries
          </h2>
          <button
            onClick={fetchStatus}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black rounded overflow-hidden border border-gray-900">
          {status.last_logs && status.last_logs.length > 0 ? (
            <div className="font-mono text-[10px] leading-tight tracking-tighter">
              {status.last_logs.map((line, index) => {
                const parsed = parseLogLine(line);

                if (parsed.raw) {
                  return (
                    <div
                      key={index}
                      className="px-2 py-0.5 hover:bg-gray-900/50 text-gray-400"
                    >
                      {parsed.raw}
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className="px-2 py-0.5 hover:bg-gray-900/50 flex items-center gap-2"
                  >
                    <span className="text-gray-500">[{parsed.timestamp}]</span>
                    <LogLevel level={parsed.level} />
                    <span className="text-gray-600">|L.{parsed.lineNum}</span>
                    <span className="text-gray-300">| {parsed.message}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-gray-600 text-xs">
              No logs - start a script to see output
            </div>
          )}
        </div>

        <div className="mt-2 text-[10px] text-gray-600 flex justify-between">
          <span>Auto-refresh: 3s</span>
          <span>Last 10 entries</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-purple-400">
          Script Controls
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => runScript("normal")}
            disabled={loading || status.running}
            className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Run Normal
          </button>

          <button
            onClick={() => runScript("testing")}
            disabled={loading || status.running}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Testing Mode
          </button>

          <button
            onClick={() => runScript("manual")}
            disabled={loading || status.running}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Settings className="w-5 h-5 mr-2" />
            Manual Mode
          </button>

          <button
            onClick={() => runScript("backup")}
            disabled={loading || status.running}
            className="flex items-center justify-center px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            Backup
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={stopScript}
            disabled={loading || !status.running}
            className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop Script
          </button>

          <button
            onClick={forceKillScript}
            disabled={loading || !status.running}
            className="flex items-center justify-center px-4 py-3 bg-red-800 hover:bg-red-900 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors border border-red-600"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Force Kill
          </button>

          <button
            onClick={deleteRunningFile}
            disabled={loading}
            className="flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete Running File
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
