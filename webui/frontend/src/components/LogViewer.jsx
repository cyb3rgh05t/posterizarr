import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Terminal, Search, FileText, ChevronDown, RefreshCw, 
  Trash2, Download, AlertCircle, CheckCircle2, 
  Settings, Filter, ArrowDown, Maximize2, Minimize2,
  Clock, Activity, Shield, HardDrive, List, Info,
  ExternalLink, Copy, ChevronRight, Folder, Hash,
  Layout, Eye, EyeOff, Monitor, History, LifeBuoy, Square, Loader2
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useToast } from "../context/ToastContext";
import { useLocation } from "react-router-dom";

const API_URL = "/api";
const isDev = import.meta.env.DEV;

// --- Sub-Component: LogStat ---
const LogStat = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 group hover:border-theme-primary/30 transition-all duration-300">
    <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] text-theme-muted uppercase tracking-wider font-bold">{label}</span>
      <span className="text-sm font-mono font-bold text-theme-text">{value}</span>
    </div>
  </div>
);

// --- Sub-Component: AnsiLine ---
const AnsiLine = React.memo(({ line }) => {
  if (!line) return null;
  
  const parseAnsi = (text) => {
    const parts = [];
    let currentPart = { text: '', color: '', bg: '', bold: false };
    const ansiRegex = /\x1b\[(([0-9]+;?)*)m/g;
    let lastIndex = 0;
    let match;

    while ((match = ansiRegex.exec(text)) !== null) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) parts.push({ ...currentPart, text: plainText });

      const codes = match[1].split(';');
      codes.forEach(code => {
        if (code === '0') currentPart = { text: '', color: '', bg: '', bold: false };
        else if (code === '1') currentPart.bold = true;
        else if (code.startsWith('3')) {
          const colors = ['text-zinc-400', 'text-red-400', 'text-green-400', 'text-yellow-400', 'text-blue-400', 'text-magenta-400', 'text-cyan-400', 'text-white'];
          currentPart.color = colors[parseInt(code[1])] || '';
        }
      });
      lastIndex = ansiRegex.lastIndex;
    }
    
    const remainingText = text.substring(lastIndex);
    if (remainingText) parts.push({ ...currentPart, text: remainingText });
    
    if (parts.length === 0) {
      const lower = text.toLowerCase();
      let color = 'text-theme-text/80';
      if (lower.includes('error')) color = 'text-red-400 font-bold';
      else if (lower.includes('warn')) color = 'text-yellow-400';
      else if (lower.includes('info')) color = 'text-blue-400';
      return <span className={color}>{text}</span>;
    }

    return parts.map((p, i) => (
      <span key={i} className={`${p.color} ${p.bold ? 'font-bold' : ''}`}>{p.text}</span>
    ));
  };

  return (
    <div className="flex gap-4 px-4 py-0.5 hover:bg-white/5 transition-colors group border-l-2 border-transparent hover:border-theme-primary/40">
      <span className="text-xs leading-relaxed break-all whitespace-pre-wrap font-medium">
        {parseAnsi(line)}
      </span>
    </div>
  );
});

// --- Sub-Component: LogTreeItem ---
const LogTreeItem = ({ item, onSelect, selectedLog, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isSelected = selectedLog === item.path;

  if (item.type === "directory") {
    return (
      <div className="flex flex-col">
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="w-full px-4 py-2 text-left text-[10px] hover:bg-white/5 flex items-center gap-2 text-theme-muted font-bold tracking-widest border-b border-white/5 transition-all"
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
          <Folder className="w-3 h-3 text-theme-primary opacity-60" />
          <span className="uppercase">{item.name}</span>
        </button>
        <div className={`overflow-hidden transition-all ${isOpen ? 'h-auto opacity-100' : 'max-h-0 opacity-0'}`}>
          {item.children?.map(child => (
            <LogTreeItem key={child.path} item={child} onSelect={onSelect} selectedLog={selectedLog} level={level + 1} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(item.path)}
      className={`w-full px-4 py-2 text-left text-sm transition-all flex items-center justify-between border-b border-white/5 group ${
        isSelected ? "bg-theme-primary/20 text-theme-primary border-l-2 border-l-theme-primary" : "text-theme-text hover:bg-white/10"
      }`}
      style={{ paddingLeft: `${level * 16 + 28}px` }}
    >
      <div className="flex items-center gap-2 text-xs">
        <FileText className={`w-3.5 h-3.5 ${isSelected ? "text-theme-primary" : "text-theme-muted group-hover:text-theme-primary"}`} />
        <span className="truncate">{item.name}</span>
      </div>
      <span className="text-[9px] opacity-40 tabular-nums">{(item.size / 1024).toFixed(1)} KB</span>
    </button>
  );
};

const LogViewer = () => {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useToast();
  const location = useLocation();
  
  const [logs, setLogs] = useState([]);
  const [availableLogs, setAvailableLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGatheringSupportZip, setIsGatheringSupportZip] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [logFilter, setLogFilter] = useState("");   
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [scriptStatus, setScriptStatus] = useState({ running: false, current_mode: null });
  const [maxLines, setMaxLines] = useState(1000);
  const [wrapText, setWrapText] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const scrollRef = useRef(null);
  const ws = useRef(null);
  const currentLogFileRef = useRef(null);

  // --- Helpers ---
  const getWebSocketURL = (logFile) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseURL = isDev
      ? `ws://localhost:3000/ws/logs`
      : `${protocol}//${window.location.host}/ws/logs`;
    return `${baseURL}?log_file=${encodeURIComponent(logFile)}`;
  };

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      setScriptStatus({ running: data.running || false, current_mode: data.current_mode || null });
    } catch (error) { console.error("Error fetching status:", error); }
  }, []);

  const stopScript = async () => {
    setIsStopping(true);
    try {
      const response = await fetch(`${API_URL}/stop`, { method: "POST" });
      const data = await response.json();
      if (data.success) {
        showSuccess(t("logViewer.scriptStopped"));
        fetchStatus();
      } else showError(t("logViewer.error", { message: data.message }));
    } catch (error) { showError(t("logViewer.error", { message: error.message })); }
    finally { setIsStopping(false); }
  };

  const gatherSupportZip = async () => {
    setIsGatheringSupportZip(true);
    showInfo(t("logViewer.gatheringSupport", "Gathering support files..."));
    try {
      const response = await fetch(`${API_URL}/admin/support-zip`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to generate zip");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "posterizarr_support.zip";
      a.click();
      showSuccess(t("logViewer.gatheringSupportSuccess"));
    } catch (error) { showError(t("logViewer.gatheringSupportFailed", { message: error.message })); }
    finally { setIsGatheringSupportZip(false); }
  };

  const fetchAvailableLogs = useCallback(async (isManual = false) => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      setAvailableLogs(data.logs || []);
      if (isManual) showSuccess(t("logViewer.logsRefreshed"));
      return data.logs || [];
    } catch (err) { 
        console.error("Failed to fetch logs:", err);
        if (isManual) showError(t("logViewer.refreshFailed"));
        return [];
    }
  }, [t, showSuccess, showError]);

  const fetchFullLogFile = async (filename) => {
    if (!filename) return;
    setIsLoading(true);
    showInfo(t("logViewer.loadingFullLog", { name: filename }));
    try {
      const response = await fetch(`/api/logs/${encodeURIComponent(filename)}?tail=0`);
      if (!response.ok) throw new Error('Failed to fetch log file');
      const data = await response.json();
      const content = Array.isArray(data.content) ? data.content : data.content.split('\n');
      setLogs(content);
      showSuccess(t("logViewer.loadedFullLog", { count: content.length, name: filename }));
    } catch (err) { showError(t("logViewer.loadFailed", { name: filename })); }
    finally { setIsLoading(false); }
  };

  // --- Initial Mount ---
  useEffect(() => {
    const initialize = async () => {
        const logsData = await fetchAvailableLogs();
        const requestedLogFile = location.state?.logFile || "Scriptlog.log";
        
        // Flatten available logs for existence check
        const findLog = (items) => {
            for (const item of items) {
                if (item.type === 'file' && item.path === requestedLogFile) return item;
                if (item.children) {
                    const found = findLog(item.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const logExists = findLog(logsData);
        let logToLoad = logExists ? requestedLogFile : (logsData[0]?.path || "");
        
        if (logToLoad) setSelectedLog(logToLoad);
    };

    initialize();
    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 3000);
    return () => clearInterval(statusInterval);
  }, [fetchAvailableLogs, fetchStatus, location.state]);

  // --- WebSocket Connection ---
  useEffect(() => {
    if (!selectedLog) return;
    
    // Cleanup previous
    if (ws.current) ws.current.close();
    setLogs([]); 
    
    const wsUrl = getWebSocketURL(selectedLog);
    ws.current = new WebSocket(wsUrl);
    currentLogFileRef.current = selectedLog;

    ws.current.onopen = () => setStatus('connected');
    ws.current.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            if (data.type === 'log') {
                setLogs(prev => [...prev, data.content].slice(-maxLines));
            } else if (data.type === "log_file_changed") {
                if (selectedLog === currentLogFileRef.current) {
                    setSelectedLog(data.log_file);
                    showInfo(t("logViewer.switchedTo", { file: data.log_file }));
                }
            }
        } catch {
            setLogs(prev => [...prev, e.data].slice(-maxLines));
        }
    };
    ws.current.onerror = () => setStatus('error');
    ws.current.onclose = () => setStatus('disconnected');

    return () => ws.current?.close();
  }, [selectedLog, maxLines, t, showInfo]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return availableLogs;
    const filterItems = (items) => {
      return items.reduce((acc, item) => {
        if (item.type === "directory") {
          const filteredChildren = filterItems(item.children || []);
          if (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || filteredChildren.length > 0) {
            acc.push({ ...item, children: filteredChildren });
          }
        } else if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) acc.push(item);
        return acc;
      }, []);
    };
    return filterItems(availableLogs);
  }, [availableLogs, searchTerm]);

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0b] text-theme-text font-mono relative overflow-hidden transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[100]' : ''}`}>
      
      {/* Header Area */}
      <div className="flex flex-col gap-6 px-8 py-6 bg-theme-card border-b border-theme-primary/20 shadow-2xl z-20 backdrop-blur-md">
        
        {/* Top Bar: Script Status & Support Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-4">
                {scriptStatus.running && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl animate-pulse">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">{t("logViewer.scriptRunning")}: {scriptStatus.current_mode}</span>
                        <button onClick={stopScript} disabled={isStopping} className="ml-2 p-1 bg-red-500 hover:bg-red-600 rounded text-white transition-colors">
                            {isStopping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                        </button>
                    </div>
                )}
            </div>
            <button onClick={gatherSupportZip} disabled={isGatheringSupportZip} className="flex items-center gap-2 px-4 py-2 bg-theme-primary/10 hover:bg-theme-primary/20 border border-theme-primary/30 rounded-xl text-theme-primary text-xs font-bold transition-all">
                {isGatheringSupportZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <LifeBuoy className="w-4 h-4" />}
                {t("logViewer.gatherSupport", "GATHER SUPPORT LOGS")}
            </button>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 focus-within:border-theme-primary/50 w-full lg:w-72">
              <Search className="w-4 h-4 text-theme-primary" />
              <input type="text" placeholder={t("logViewer.searchPlaceholder", "Search folders/files...")} className="bg-transparent border-none outline-none text-xs w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="relative flex-1 w-full lg:max-w-md">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full flex items-center justify-between px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 hover:border-theme-primary/50 group">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${selectedLog ? 'bg-theme-primary/20 text-theme-primary' : 'bg-white/10 text-theme-muted'}`}><FileText className="w-4 h-4" /></div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-theme-muted uppercase tracking-tighter font-black opacity-50">{t("logViewer.activeStream", "Active Stream")}</span>
                    <span className="text-sm font-bold truncate max-w-[200px]">{selectedLog ? selectedLog.split('/').pop() : t("logViewer.selectLogFile", 'Select Log Sequence')}</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-theme-primary transition-transform duration-500 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-4 bg-theme-card/95 border border-theme-primary/30 rounded-3xl shadow-2xl max-h-[500px] overflow-y-auto py-3 backdrop-blur-xl custom-scrollbar">
                  {filteredTree.map(item => <LogTreeItem key={item.path} item={item} selectedLog={selectedLog} onSelect={(p) => { setSelectedLog(p); setDropdownOpen(false); }} />)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
             <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 focus-within:border-theme-primary/50 w-full lg:w-64">
              <Filter className="w-4 h-4 text-theme-primary" />
              <input type="text" placeholder={t("logViewer.filterPlaceholder", "Filter logs...")} className="bg-transparent border-none outline-none text-xs w-full" value={logFilter} onChange={(e) => setLogFilter(e.target.value)} />
            </div>
            <button onClick={() => fetchAvailableLogs(true)} className="p-3 bg-white/5 hover:bg-theme-primary/20 rounded-2xl border border-white/10 text-theme-primary transition-all">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={() => fetchFullLogFile(selectedLog)} disabled={isLoading} className="p-3 bg-white/5 hover:bg-theme-primary/20 rounded-2xl border border-white/10 text-theme-primary transition-all">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            </button>
            <button onClick={() => {
                const filteredLogs = logs.filter(l => l.toLowerCase().includes(logFilter.toLowerCase()));
                const blob = new Blob([filteredLogs.join('\n')], {type: 'text/plain'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedLog.split('/').pop() || 'log'}_filtered.log`;
                a.click();
                showSuccess(t("logViewer.downloaded", { count: filteredLogs.length }));
            }} className="p-3 bg-white/5 hover:bg-theme-primary/20 rounded-2xl border border-white/10 text-theme-primary transition-all">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={() => { setLogs([]); showSuccess(t("logViewer.logsCleared")); }} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-2xl border border-white/10 text-red-400 transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <LogStat icon={Activity} label={t("logViewer.status.label", "Stream Status")} value={status.toUpperCase()} color={status === 'connected' ? 'green' : 'red'} />
          <LogStat icon={Hash} label={t("logViewer.entries", "Lines")} value={logs.length} color="blue" />
          <LogStat icon={Clock} label={t("logViewer.bufferLimit", "Buffer Limit")} value={`${maxLines} L`} color="purple" />
          {selectedLog && (
            <div className="flex items-center gap-2 px-4 py-2 bg-theme-primary/10 rounded-xl border border-theme-primary/20">
              <History className="w-4 h-4 text-theme-primary" />
              <span className="text-[10px] text-theme-primary font-bold tracking-widest uppercase">Path: {selectedLog}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex flex-col min-h-0">
        <div ref={scrollRef} className={`flex-1 overflow-auto p-8 custom-scrollbar ${wrapText ? '' : 'whitespace-nowrap'}`}>
          {logs.length > 0 ? (
            <div className="space-y-0.5 min-w-full inline-block">
              {logs.filter(l => l.toLowerCase().includes(logFilter.toLowerCase())).map((line, i) => (
                <AnsiLine key={i} line={line} />
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-theme-muted/20">
              <Terminal className="w-32 h-32 mb-6 animate-pulse" />
              <p className="text-xl font-black tracking-[0.4em] uppercase opacity-50">{t("logViewer.noLogs", "System Idle")}</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-10 right-12 flex flex-col gap-4">
          <button onClick={() => setAutoScroll(!autoScroll)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black tracking-widest transition-all duration-500 shadow-2xl border ${autoScroll ? 'bg-theme-primary text-white border-theme-primary scale-105' : 'bg-theme-card text-theme-muted border-white/10 grayscale'}`}>
            <ArrowDown className={`w-4 h-4 ${autoScroll ? 'animate-bounce' : ''}`} />
            {autoScroll ? t("logViewer.on", 'AUTO-SCROLL ON') : t("logViewer.off", 'SCROLL LOCKED')}
          </button>
          <div className="flex gap-3">
            <button onClick={() => setWrapText(!wrapText)} className="p-4 bg-theme-card/80 backdrop-blur-xl border border-white/10 rounded-2xl text-theme-muted hover:text-theme-primary transition-all"><Layout className="w-5 h-5" /></button>
            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-4 bg-theme-card/80 backdrop-blur-xl border border-white/10 rounded-2xl text-theme-muted hover:text-theme-primary transition-all">{isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}</button>
          </div>
        </div>
      </div>
      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--color-primary-rgb), 0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default LogViewer;