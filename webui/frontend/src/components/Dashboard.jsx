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
} from "lucide-react";

const API_URL = "http://localhost:8000/api";

function Dashboard() {
  const [status, setStatus] = useState({
    running: false,
    last_log: "",
    script_exists: false,
    config_exists: false,
    pid: null,
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
        alert(`Script started in ${mode} mode!`);
        fetchStatus();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
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
      alert(data.message);
      fetchStatus();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold mb-8 text-purple-400">Dashboard</h1>

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

      {/* Last Log Entry */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-400">
          Last Log Entry
        </h2>
        <div className="bg-gray-900 rounded p-4 font-mono text-sm text-gray-300 overflow-x-auto break-words whitespace-pre-wrap">
          {status.last_log ||
            "No logs available - start a script to see output here"}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Auto-refreshes every 3 seconds
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

        <button
          onClick={stopScript}
          disabled={loading || !status.running}
          className="w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop Script
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
