import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Clock, RefreshCw, Loader2, Image, AlertTriangle, Database,
  BarChart2, List as ListIcon, ChevronDown, X, Globe,
  PieChart, HardDrive, Cpu, Layers, FileType, FileImage, ExternalLink,
  ChevronRight, Folder, File, Box
} from "lucide-react";

const API_URL = "/api";

// --- THEME CONSTANTS ---
const THEME = {
  orange: '#E5A00D',       // Primary / Focus
  green: '#96C83C',        // Success
  red: '#F06464',          // Errors
  blue: '#19A0D7',         // Info
  white: '#FFFFFF',

  // Custom Provider Colors
  tvdb: '#6cd591',
  tmdb: '#03b4e3',
  fanart: '#22b6e0',

  // UI Colors
  tableHeader: '#212121',
};

// --- HELPERS ---
const getSafeValue = (data, key) => {
    if (!data) return 0;
    return data[key] || data[key.toLowerCase()] || data[key.toUpperCase()] || 0;
};

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
};

// --- CHART COMPONENTS ---

const Tooltip = ({ x, y, data }) => (
  <div
    className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
    style={{
        left: x,
        top: y,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        padding: '6px 10px',
        borderRadius: '4px',
        fontSize: '11px',
        border: `1px solid #444`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
        fontFamily: 'sans-serif'
    }}
  >
    <div className="font-bold mb-1 border-b border-gray-600 pb-1">{data.label}</div>
    {data.items.map((item, i) => (
      <div key={i} className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || '#fff' }}></span>
            <span className="text-gray-300">{item.label}:</span>
        </div>
        <span className="font-mono font-bold">{item.value}</span>
      </div>
    ))}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#444]"></div>
  </div>
);

const InteractiveBarChart = ({ data, onBarClick, color = THEME.orange, valueKey = "value", label }) => {
  const { t } = useTranslation();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return <div className="text-theme-muted text-xs text-center flex flex-col items-center justify-center h-full italic">{t('runtime_history.charts.no_data')}</div>;

  const maxVal = Math.max(...data.map(d => d[valueKey]), 1);

  return (
    <div className="w-full h-full relative select-none font-sans" onMouseLeave={() => setHoveredIndex(null)}>
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pl-8 pb-6">
             {[...Array(5)].map((_, i) => (
                 <div key={i} className="w-full border-b border-theme/10 relative">
                     {i % 2 === 0 && <span className="absolute -left-8 -top-2 text-[9px] text-theme-muted w-6 text-right">{Math.round(maxVal - (maxVal * (i/4)))}</span>}
                 </div>
             ))}
        </div>
        <div className="flex items-end gap-[1px] w-full h-full pb-6 pl-8 pt-2">
            {data.map((d, i) => {
            const heightPct = (d[valueKey] / maxVal) * 100;
            const isHovered = hoveredIndex === i;
            const opacity = hoveredIndex !== null && !isHovered ? 0.3 : 1;
            return (
                <div key={i} className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer transition-all duration-200" style={{ opacity }} onMouseEnter={() => setHoveredIndex(i)} onClick={() => onBarClick && onBarClick(d.originalData)}>
                <div className="w-full h-full flex items-end relative">
                    <div className="w-full transition-all min-h-[1px] rounded-t-[1px]" style={{ height: `${Math.max(heightPct, 0.5)}%`, backgroundColor: color }}></div>
                    <div className="absolute inset-0 bg-transparent z-10"></div>
                </div>
                {hoveredIndex === i && <Tooltip x="50%" y="10%" data={{ label: d.fullLabel, items: [{ label: label || "Value", value: d[valueKey], color: color }] }} />}
                </div>
            );
            })}
        </div>
        <div className="absolute bottom-1 left-8 right-0 flex justify-between text-[9px] text-theme-muted px-1">
             <span>{data[0]?.shortLabel}</span>
             <span>{data[Math.floor(data.length/2)]?.shortLabel}</span>
             <span>{data[data.length-1]?.shortLabel}</span>
        </div>
    </div>
  );
};

const ProviderStackChart = ({ data }) => {
    const { t } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    if (!data || data.length === 0) return <div className="text-theme-muted text-xs text-center flex flex-col items-center justify-center h-full italic">{t('runtime_history.charts.no_provider_data')}</div>;

    const maxTotal = Math.max(...data.map(d => (getSafeValue(d, "TMDB") + getSafeValue(d, "TVDB") + getSafeValue(d, "Fanart") + getSafeValue(d, "Other"))), 1);
    const colors = { TMDB: THEME.tmdb, TVDB: THEME.tvdb, Fanart: THEME.fanart, Other: THEME.white };

    return (
        <div className="w-full h-full relative select-none" onMouseLeave={() => setHoveredIndex(null)}>
             <div className="absolute right-0 -top-6 flex gap-3 text-[10px]">
                {Object.entries(colors).map(([name, col]) => (
                    <div key={name} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: col }}></div><span className="text-theme-muted">{name}</span></div>
                ))}
            </div>
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pl-8 pb-6">
                {[...Array(5)].map((_, i) => <div key={i} className="w-full border-b border-theme/10 relative">{i % 2 === 0 && <span className="absolute -left-8 -top-2 text-[9px] text-theme-muted w-6 text-right">{Math.round(maxTotal - (maxTotal * (i/4)))}</span>}</div>)}
            </div>
            <div className="flex items-end gap-[1px] w-full h-full pb-6 pl-8 pt-2">
                {data.map((d, i) => {
                    const valTmdb = getSafeValue(d, "TMDB"); const valTvdb = getSafeValue(d, "TVDB"); const valFanart = getSafeValue(d, "Fanart"); const valOther = getSafeValue(d, "Other"); const total = valTmdb + valTvdb + valFanart + valOther;
                    const opacity = hoveredIndex !== null && hoveredIndex !== i ? 0.3 : 1;
                    return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end group relative transition-opacity duration-200" style={{ opacity }} onMouseEnter={() => setHoveredIndex(i)}>
                            <div className="w-full h-full flex flex-col-reverse relative z-10">
                                {valTmdb > 0 && <div style={{ height: `${(valTmdb / maxTotal) * 100}%`, backgroundColor: colors.TMDB }} className="w-full"></div>}
                                {valTvdb > 0 && <div style={{ height: `${(valTvdb / maxTotal) * 100}%`, backgroundColor: colors.TVDB }} className="w-full"></div>}
                                {valFanart > 0 && <div style={{ height: `${(valFanart / maxTotal) * 100}%`, backgroundColor: colors.Fanart }} className="w-full"></div>}
                                {valOther > 0 && <div style={{ height: `${(valOther / maxTotal) * 100}%`, backgroundColor: colors.Other }} className="w-full"></div>}
                            </div>
                            {hoveredIndex === i && total > 0 && (
                                <Tooltip x="50%" y="10%" data={{ label: d.date, items: [ { label: "TMDB", value: valTmdb, color: colors.TMDB }, { label: "TVDB", value: valTvdb, color: colors.TVDB }, { label: "Fanart", value: valFanart, color: colors.Fanart }, { label: "Other", value: valOther, color: colors.Other }, { label: "Total", value: total, color: '#ccc' } ] }} />
                            )}
                        </div>
                    );
                })}
            </div>
             <div className="absolute bottom-1 left-8 right-0 flex justify-between text-[9px] text-theme-muted px-1"><span>{data[0]?.date}</span><span>{data[data.length-1]?.date}</span></div>
        </div>
    );
};

const SimpleBarChart = ({ data, colorMap, valueKey = "value", labelKey = "label", height = 200 }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-xs text-theme-muted italic">No Data</div>;
    const maxVal = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="w-full relative select-none" style={{ height }}>
             <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pl-0 pb-6">{[...Array(5)].map((_, i) => <div key={i} className="w-full border-b border-theme/10 relative h-full"></div>)}</div>
            <div className="flex items-end gap-4 w-full h-full pb-6 pt-2">
                {data.map((d, i) => {
                    const barColor = colorMap ? colorMap[d[labelKey]] : THEME.orange;
                    return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                            <div className="w-full flex justify-center mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 text-[10px] font-bold text-theme-text">{d[valueKey]}</div>
                            <div className="w-full h-full flex items-end relative">
                                <div className="w-full transition-all min-h-[1px] rounded-t-sm" style={{ height: `${Math.max((d[valueKey] / maxVal) * 100, 1)}%`, backgroundColor: barColor, opacity: 0.8 }}></div>
                            </div>
                            <div className="text-center mt-2 text-[10px] text-theme-muted truncate w-full uppercase tracking-wider">{d[labelKey]}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const HorizontalBarChart = ({ data, color = THEME.blue }) => {
    if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-xs text-theme-muted italic">No Data</div>;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex flex-col gap-3 w-full">
            {data.map((d, i) => (
                <div key={i} className="w-full">
                    <div className="flex justify-between text-[11px] mb-1 text-theme-text"><span className="font-semibold">{d.label}</span><span className="font-mono text-theme-muted">{d.displayValue}</span></div>
                    <div className="w-full h-2 bg-theme-bg rounded-full overflow-hidden border border-theme/20"><div className="h-full rounded-full" style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: color }}></div></div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---

function RuntimeHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State
  const [history, setHistory] = useState([]);
  const [providerStats, setProviderStats] = useState([]);
  const [assetOverview, setAssetOverview] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [exportStats, setExportStats] = useState(null);
  const [overlayStats, setOverlayStats] = useState([]);

  // UI State
  const [viewMode, setViewMode] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(20);
  const [graphDays, setGraphDays] = useState(7);

  // Modal State
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // --- DATA FETCHING ---
  const fetchAllData = async (silent = false) => {
    if (!silent) setRefreshing(true);
    setLoading(true);

    const fetchLimit = viewMode === "analytics" ? 365 : limit;
    const offset = viewMode === "analytics" ? 0 : currentPage * limit;

    try {
        const configRes = await fetch(`${API_URL}/config`);
        const configData = await configRes.json();
        const usePlex = configData.success && configData.config?.UsePlex === "true";

        const requests = [
            fetch(`${API_URL}/runtime-history?limit=${fetchLimit}&offset=${offset}`).then(res => res.json()),
            viewMode === "analytics" ? fetch(`${API_URL}/analytics/providers?days=${graphDays}`).then(res => res.json()) : null,
            viewMode === "analytics" ? fetch(`${API_URL}/assets/overview`).then(res => res.json()) : null,
            viewMode === "analytics" ? fetch(`${API_URL}/assets/stats`).then(res => res.json()) : null,
            viewMode === "analytics" ? fetch(`${API_URL}/overlayfiles`).then(res => res.json()) : null,
            viewMode === "analytics" ? fetch(usePlex ? `${API_URL}/plex-export/statistics` : `${API_URL}/other-media-export/statistics`).then(res => res.json()) : null
        ];

        const [histData, provData, overData, statsData, overlayData, expData] = await Promise.all(requests);

        if (histData?.success) setHistory(histData.history);
        if (provData?.success) setProviderStats(provData.stats);
        if (overData) setAssetOverview(overData);
        if (statsData?.success) setAssetStats(statsData);

        if (overlayData?.success) {
            const fonts = overlayData.files.filter(f => f.type === 'font');
            const images = overlayData.files.filter(f => f.type === 'image');
            setOverlayStats([
                { label: 'Fonts', value: fonts.length, size: fonts.reduce((acc, f) => acc + f.size, 0) },
                { label: 'Overlays', value: images.length, size: images.reduce((acc, f) => acc + f.size, 0) }
            ]);
        }

        if (expData?.success) setExportStats(expData.statistics);

    } catch (error) {
        console.error("Failed to fetch dashboard data", error);
    } finally {
        setLoading(false);
        if (!silent) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchAllData(false);
  }, [currentPage, viewMode, graphDays]);

  // --- MODAL HANDLING (SIMPLE) ---
  const handleOpenDetail = (entry) => {
      setSelectedEntry(entry);
      setShowDetailModal(true);
  };

  // --- DATA PREP ---
  const analyticsData = useMemo(() => {
      if (!history.length) return { duration: [], assets: [], errors: [] };
      let chronoHistory = [...history].reverse();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - graphDays);
      chronoHistory = chronoHistory.filter(h => new Date(h.start_time || h.timestamp) >= cutoffDate);
      const formatShort = (d) => new Date(d).toLocaleDateString(undefined, {month:'short', day:'numeric'});
      const formatFull = (d) => new Date(d).toDateString();

      return {
          duration: chronoHistory.map(h => ({ shortLabel: formatShort(h.start_time || h.timestamp), fullLabel: formatFull(h.start_time || h.timestamp), value: h.runtime_seconds || 0, originalData: h })),
          assets: chronoHistory.map(h => ({ shortLabel: formatShort(h.start_time || h.timestamp), fullLabel: formatFull(h.start_time || h.timestamp), value: h.total_images || 0, originalData: h })),
          errors: chronoHistory.map(h => ({ shortLabel: formatShort(h.start_time || h.timestamp), fullLabel: formatFull(h.start_time || h.timestamp), value: h.errors || 0, originalData: h }))
      };
  }, [history, graphDays]);

  const healthData = assetOverview ? [
      { label: "Resolved", value: assetOverview.categories?.resolved?.count || 0 },
      { label: "Missing", value: assetOverview.categories?.missing_assets?.count || 0 },
      { label: "Non-Primary", value: assetOverview.categories?.non_primary_lang?.count || 0 },
  ] : [];
  const healthColors = { "Resolved": THEME.green, "Missing": THEME.red, "Non-Primary": THEME.orange };

  const typesData = assetStats?.stats ? [
      { label: "Posters", value: assetStats.stats.posters || 0 },
      { label: "Title Cards", value: assetStats.stats.titlecards || 0 },
      { label: "Seasons", value: assetStats.stats.seasons || 0 },
      { label: "Backgrounds", value: assetStats.stats.backgrounds || 0 },
  ] : [];
  const typesColors = { "Posters": THEME.blue, "Title Cards": THEME.green, "Seasons": THEME.orange, "Backgrounds": '#aaa' };

  // Calculate folder data with ITEM COUNT included, sorted by size, NO LIMIT
  const folderData = assetStats?.stats?.folders ? assetStats.stats.folders.sort((a, b) => b.size - a.size).map(f => ({
      label: f.name,
      value: f.size,
      displayValue: `${formatBytes(f.size)} (${f.files} items)`
  })) : [];

  if (loading && !refreshing && history.length === 0) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10" style={{ color: THEME.orange }} /></div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 border-b border-theme/30">
          <div className="flex items-center gap-2">
             <h2 className="text-xl font-light flex items-center gap-2" style={{ color: THEME.orange }}>
                 {viewMode === "analytics" ? <BarChart2 size={24}/> : <ListIcon size={24}/>}
                 {t('runtime_history.title', 'Runtime History')}
             </h2>
          </div>
          <div className="flex items-center gap-3">
              {viewMode === "analytics" && (
                <div className="flex items-center">
                    <span className="text-theme-muted text-sm mr-2 bg-theme-bg px-2 py-1.5 rounded-l border border-r-0 border-theme/30">Last</span>
                    <input
                        type="number"
                        min="1"
                        value={graphDays}
                        onChange={(e) => setGraphDays(Number(e.target.value))}
                        className="bg-theme-bg text-theme-text text-sm font-bold pl-3 pr-2 py-1.5 border border-theme/30 rounded-r outline-none w-16 text-center hover:bg-theme-hover transition-colors"
                    />
                    <span className="text-theme-muted text-sm ml-2">days</span>
                </div>
              )}
              <div className="flex bg-theme-bg rounded p-0.5 border border-theme/30">
                  <button onClick={() => setViewMode("analytics")} className={`px-4 py-1.5 text-sm rounded-sm transition-all ${viewMode === "analytics" ? "bg-theme-hover text-theme-text shadow" : "text-theme-muted hover:text-theme-text"}`}>Graphs</button>
                  <button onClick={() => setViewMode("list")} className={`px-4 py-1.5 text-sm rounded-sm transition-all ${viewMode === "list" ? "bg-theme-hover text-theme-text shadow" : "text-theme-muted hover:text-theme-text"}`}>History List</button>
              </div>
              <button onClick={() => fetchAllData()} disabled={refreshing} className="p-2 text-theme-muted hover:text-theme-text transition-colors"><RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} /></button>
          </div>
      </div>

      {/* ANALYTICS VIEW */}
      {viewMode === "analytics" && (
          <div className="space-y-6">

              {/* SECTION 1: ASSET & EXPORT STATS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Asset Overview (Clickable) */}
                  <div
                    className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm cursor-pointer group hover:bg-theme-hover/20 transition-colors flex flex-col justify-between"
                    style={{ borderTopColor: THEME.green }}
                    onClick={() => navigate("/asset-overview")}
                  >
                      <div>
                          <h3 className="text-lg font-light text-theme-text mb-2 flex items-center gap-2 group-hover:text-white transition-colors">
                              <PieChart size={18} /> Asset Overview
                              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </h3>
                          <p className="text-xs text-theme-muted mb-4 italic">Distribution of assets by status.</p>
                      </div>
                      <div className="h-40 mt-auto"><SimpleBarChart data={healthData} colorMap={healthColors} height={160} /></div>
                  </div>

                  {/* Export Stats (Auto height, aligned) */}
                  <div className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm flex flex-col min-h-[16rem]" style={{ borderTopColor: THEME.orange }}>
                      <h3 className="text-lg font-light text-theme-text mb-2 flex items-center gap-2"><Database size={18} /> Export Statistics</h3>
                      <p className="text-xs text-theme-muted mb-4 italic">Latest export run details.</p>
                      {exportStats ? (
                          <div className="grid grid-cols-2 gap-4 flex-1 content-center">
                              <StatBox label="Total Runs" value={exportStats.total_runs} color={THEME.orange} />
                              <StatBox label="Records" value={exportStats.total_library_records} color={THEME.blue} />
                              <StatBox label="Episodes" value={exportStats.total_episode_records} color={THEME.green} />
                              <div className="flex flex-col justify-end">
                                  <div className="bg-theme-bg p-3 rounded border border-theme/20 h-full flex flex-col justify-center text-right">
                                      <span className="text-[10px] text-theme-muted uppercase mb-1">Latest Run</span>
                                      <span className="text-xs font-mono text-theme-text">{new Date(exportStats.latest_run).toLocaleDateString()}</span>
                                      <span className="text-[10px] text-theme-muted">{new Date(exportStats.latest_run).toLocaleTimeString()}</span>
                                  </div>
                              </div>
                          </div>
                      ) : <div className="text-center text-xs text-theme-muted py-10 my-auto">No Export Data</div>}
                  </div>
              </div>

              {/* SECTION 2: RUN HISTORY */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm" style={{ borderTopColor: THEME.orange }}>
                      <h3 className="text-lg font-light text-theme-text mb-1 flex items-center gap-2"><Clock size={18} /> {t('runtime_history.charts.execution_time')}</h3>
                      <p className="text-xs text-theme-muted mb-6 italic">Total duration per run.</p>
                      <div className="h-64"><InteractiveBarChart data={analyticsData.duration} color={THEME.orange} label="Seconds" onBarClick={handleOpenDetail} /></div>
                  </div>
                  <div className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm" style={{ borderTopColor: THEME.green }}>
                      <h3 className="text-lg font-light text-theme-text mb-1 flex items-center gap-2"><Image size={18} /> {t('runtime_history.charts.assets_created')}</h3>
                      <p className="text-xs text-theme-muted mb-6 italic">Total images generated.</p>
                      <div className="h-64"><InteractiveBarChart data={analyticsData.assets} color={THEME.green} label="Images" onBarClick={handleOpenDetail} /></div>
                  </div>
                  <div className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm" style={{ borderTopColor: THEME.red }}>
                      <h3 className="text-lg font-light text-theme-text mb-1 flex items-center gap-2"><AlertTriangle size={18} /> {t('runtime_history.charts.errors_per_run')}</h3>
                      <p className="text-xs text-theme-muted mb-6 italic">Errors encountered.</p>
                      <div className="h-64"><InteractiveBarChart data={analyticsData.errors} color={THEME.red} label="Errors" onBarClick={handleOpenDetail} /></div>
                  </div>
                   <div className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm" style={{ borderTopColor: THEME.blue }}>
                      <h3 className="text-lg font-light text-theme-text mb-1 flex items-center gap-2"><Globe size={18} /> {t('runtime_history.charts.source_distribution')}</h3>
                      <p className="text-xs text-theme-muted mb-6 italic">Metadata requests by provider.</p>
                      <div className="h-64"><ProviderStackChart data={providerStats} /></div>
                  </div>
              </div>

              {/* SECTION 3: LIBRARY & OVERLAYS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Asset Types (Clickable) */}
                  <div
                    className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm cursor-pointer group hover:bg-theme-hover/20 transition-colors"
                    style={{ borderTopColor: THEME.blue }}
                    onClick={() => navigate("/gallery")}
                  >
                      <h3 className="text-lg font-light text-theme-text mb-2 flex items-center gap-2 group-hover:text-white transition-colors">
                          <Layers size={18} /> Asset Types Chart
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </h3>
                      <p className="text-xs text-theme-muted mb-4 italic">Total counts per image type.</p>
                      <div className="h-48"><SimpleBarChart data={typesData} colorMap={typesColors} height={190} /></div>
                  </div>

                  {/* Library Storage (Enhanced) */}
                  <div className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm" style={{ borderTopColor: '#aaa' }}>
                      <h3 className="text-lg font-light text-theme-text mb-2 flex items-center gap-2"><HardDrive size={18} /> Library Storage</h3>
                      <p className="text-xs text-theme-muted mb-4 italic">Disk usage per library.</p>

                      {/* INTEGRATED: Total Assets and Storage stats */}
                      {assetStats && (
                        <div className="flex gap-4 mb-4 p-3 bg-theme-bg/30 rounded-lg border border-theme/20">
                             <div className="flex-1 text-center border-r border-theme/20">
                                 <div className="text-2xl font-light text-theme-text">{assetStats.stats.posters + assetStats.stats.seasons + assetStats.stats.titlecards + assetStats.stats.backgrounds}</div>
                                 <div className="text-[10px] text-theme-muted uppercase tracking-wider">Total Assets</div>
                             </div>
                             <div className="flex-1 text-center">
                                 <div className="text-2xl font-light text-theme-text">{formatBytes(assetStats.stats.total_size)}</div>
                                 <div className="text-[10px] text-theme-muted uppercase tracking-wider">Total Storage</div>
                             </div>
                        </div>
                      )}

                      <div className="h-48 overflow-y-auto pr-2 custom-scrollbar"><HorizontalBarChart data={folderData} color={THEME.blue} /></div>
                  </div>

                  {/* Overlays (Clickable) */}
                  <div
                    className="bg-theme-card p-5 rounded-lg border-t-4 shadow-sm cursor-pointer group hover:bg-theme-hover/20 transition-colors col-span-1 lg:col-span-2"
                    style={{ borderTopColor: THEME.orange }}
                    onClick={() => navigate("/assets-manager")}
                  >
                      <h3 className="text-lg font-light text-theme-text mb-2 flex items-center gap-2 group-hover:text-white transition-colors">
                          <FileType size={18} /> Overlay Resources
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </h3>
                      <p className="text-xs text-theme-muted mb-4 italic">Installed fonts and overlay images.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {overlayStats.map((stat, i) => (
                              <div key={i} className="flex items-center justify-between bg-theme-bg p-3 rounded border border-theme/20">
                                  <div className="flex items-center gap-3">
                                      {stat.label === 'Fonts' ? <FileType size={20} className="text-theme-muted"/> : <FileImage size={20} className="text-theme-muted"/>}
                                      <div>
                                          <div className="text-sm font-bold text-theme-text">{stat.label}</div>
                                          <div className="text-[10px] text-theme-muted">{formatBytes(stat.size)}</div>
                                      </div>
                                  </div>
                                  <div className="text-xl font-mono text-theme-text">{stat.value}</div>
                              </div>
                          ))}
                          {overlayStats.length === 0 && <div className="text-center text-xs text-theme-muted py-4 w-full">No Overlays Found</div>}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="bg-theme-card rounded-lg shadow overflow-hidden border border-theme/30">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#212121] border-b border-theme/30">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider">{t('runtime_history.table.start_time')}</th>
                            <th className="px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider">{t('runtime_history.table.mode')}</th>
                            <th className="px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider">{t('runtime_history.table.duration')}</th>
                            <th className="px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider text-right">{t('runtime_history.table.created')}</th>
                            <th className="px-4 py-3 font-semibold text-gray-400 uppercase tracking-wider text-right">{t('runtime_history.table.errors')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((entry, index) => {
                            const isEven = index % 2 !== 0;
                            const bgClass = isEven ? 'bg-theme-text/[0.035]' : 'bg-transparent';
                            return (
                                <tr key={entry.id} onClick={() => handleOpenDetail(entry)} className={`${bgClass} cursor-pointer transition-colors hover:bg-theme-text/[0.075] border-t border-theme/10 group`}>
                                    <td className="px-4 py-2.5 text-theme-text whitespace-nowrap">{new Date(entry.start_time || entry.timestamp).toLocaleString("sv-SE").replace("T", " ")}</td>
                                    <td className="px-4 py-2.5 text-theme-text"><span className="px-1.5 py-0.5 rounded border border-theme/30 text-[10px] bg-theme-bg uppercase">{entry.mode}</span></td>
                                    <td className="px-4 py-2.5 text-theme-text font-mono text-[11px]">{entry.runtime_formatted}</td>
                                    <td className="px-4 py-2.5 text-right font-bold transition-colors" style={{ color: entry.total_images > 0 ? THEME.green : 'inherit' }}>{entry.total_images}</td>
                                    <td className="px-4 py-2.5 text-right font-bold transition-colors" style={{ color: entry.errors > 0 ? THEME.red : 'inherit' }}>{entry.errors}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
             <div className="p-3 bg-theme-bg border-t border-theme/30 flex justify-between items-center text-xs text-theme-muted">
                <span>Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, history.length + (currentPage * limit))} entries</span>
                <div className="flex gap-1"><button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 bg-theme-card border border-theme/30 rounded hover:bg-theme-hover disabled:opacity-50">Previous</button><button disabled={history.length < limit} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-theme-card border border-theme/30 rounded hover:bg-theme-hover disabled:opacity-50">Next</button></div>
            </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
            <div className="bg-theme-card border border-theme rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-theme/30 flex justify-between items-center rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-light" style={{ color: THEME.orange }}>Run Details</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] px-1.5 py-0.5 bg-theme-bg border border-theme/30 rounded uppercase text-theme-muted">{selectedEntry.mode}</span>
                            <span className="text-xs text-theme-muted font-mono">{new Date(selectedEntry.start_time || selectedEntry.timestamp).toLocaleString()}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowDetailModal(false)}><X className="text-theme-muted hover:text-theme-text transition-colors" /></button>
                </div>

                <div className="p-6 overflow-y-auto bg-theme-bg/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatBox label="Runtime" value={selectedEntry.runtime_formatted} color={THEME.orange} icon={Clock} />
                        <StatBox label="Images Created" value={selectedEntry.total_images} color={THEME.green} icon={Image} />
                        <StatBox label="Total Errors" value={selectedEntry.errors} color={selectedEntry.errors > 0 ? THEME.red : 'gray'} icon={AlertTriangle} />
                        <StatBox label="Space Saved" value={selectedEntry.space_saved || "0 KB"} color={THEME.blue} icon={Database} />
                    </div>

                    <h4 className="text-xs font-bold text-theme-muted uppercase border-b border-theme/20 pb-2 mb-4">Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        {['Posters', 'Backgrounds', 'Seasons', 'Title Cards', 'Collections'].map((type, i) => {
                             const key = type.toLowerCase().replace(' ', '');
                             const val = selectedEntry[key === 'titlecards' ? 'titlecards' : key] || 0;
                             return (<div key={i} className="bg-theme-card p-3 rounded border border-theme/30 text-center"><div className="text-xl font-bold text-theme-text">{val}</div><div className="text-[10px] text-theme-muted uppercase tracking-wider">{type}</div></div>)
                        })}
                    </div>

                    <div className="bg-theme-card border border-theme/30 rounded p-4">
                        <h4 className="text-xs font-bold text-theme-muted uppercase mb-2">System Info</h4>
                        <div className="text-xs font-mono text-theme-text grid grid-cols-1 gap-1">
                            <div><span className="text-theme-muted uppercase mr-2 w-24 inline-block">Log File:</span> {selectedEntry.log_file}</div>
                            <div><span className="text-theme-muted uppercase mr-2 w-24 inline-block">Version:</span> {selectedEntry.script_version || "Unknown"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// UI Components
const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="bg-theme-card p-4 rounded border-t-[4px] border-theme/20 shadow flex flex-col justify-between h-24 relative overflow-hidden" style={{ borderTopColor: color }}>
        <div className="flex justify-between items-start z-10 relative">
            <span className="text-[11px] font-bold text-theme-muted uppercase tracking-wide">{label}</span>
            {Icon && <Icon size={16} style={{ color }} />}
        </div>
        <div className="text-2xl font-light text-theme-text mt-auto z-10 relative">{value}</div>
        {Icon && <Icon size={64} className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none" style={{ color }} />}
    </div>
);

const CompactStat = ({ label, value }) => (
    <div className="bg-theme-bg/30 p-2 rounded border border-theme/20 text-center">
        <div className="text-lg font-bold text-theme-text">{value}</div>
        <div className="text-[10px] text-theme-muted uppercase">{label}</div>
    </div>
);

export default RuntimeHistory;