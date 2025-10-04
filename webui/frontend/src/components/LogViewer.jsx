import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws/logs';

function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [availableLogs, setAvailableLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState('Scriptlog.log');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connected, setConnected] = useState(false);
  const logContainerRef = useRef(null);
  const wsRef = useRef(null);

  // Fetch available log files
  const fetchAvailableLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/logs`);
      const data = await response.json();
      setAvailableLogs(data.logs);
    } catch (error) {
      console.error('Error fetching log files:', error);
    }
  };

  // Fetch specific log file
  const fetchLogFile = async (logName) => {
    try {
      const response = await fetch(`${API_URL}/logs/${logName}?tail=100`);
      const data = await response.json();
      setLogs(data.content);
    } catch (error) {
      console.error('Error fetching log:', error);
    }
  };

  // Connect to WebSocket for live logs
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'log') {
        setLogs((prev) => [...prev, data.content]);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    fetchAvailableLogs();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLog}_${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogColor = (line) => {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('error') || lowerLine.includes('failed')) {
      return 'text-red-400';
    }
    if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
      return 'text-yellow-400';
    }
    if (lowerLine.includes('success') || lowerLine.includes('completed')) {
      return 'text-green-400';
    }
    if (lowerLine.includes('info')) {
      return 'text-blue-400';
    }
    return 'text-gray-300';
  };

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-purple-400">Logs</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className="text-sm text-gray-400">
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Auto-scroll</span>
          </label>

          <button
            onClick={() => fetchAvailableLogs()}
            className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>

          <button
            onClick={downloadLogs}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Log file selector */}
      <div className="mb-4">
        <select
          value={selectedLog}
          onChange={(e) => {
            setSelectedLog(e.target.value);
            fetchLogFile(e.target.value);
          }}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {availableLogs.map((log) => (
            <option key={log.name} value={log.name}>
              {log.name} ({(log.size / 1024).toFixed(2)} KB)
            </option>
          ))}
        </select>
      </div>

      {/* Log container */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div
          ref={logContainerRef}
          className="h-[600px] overflow-y-auto p-4 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs to display. Waiting for log entries...
            </div>
          ) : (
            logs.map((line, index) => (
              <div key={index} className={`py-0.5 ${getLogColor(line)}`}>
                <span className="text-gray-600 mr-2">{index + 1}</span>
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Showing {logs.length} log entries
      </div>
    </div>
  );
}

export default LogViewer;
