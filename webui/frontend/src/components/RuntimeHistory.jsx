import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock, RefreshCw, Loader2, Image, AlertTriangle, Film, Tv,
  ChevronLeft, ChevronRight, Database, TrendingUp, ChevronDown, X,
  Info, ImageOff, Type, Scissors, FileText, Globe, BarChart2, List as ListIcon, Calendar
} from "lucide-react";

const API_URL = "/api";

// 1. Clean Helper Logic (Matches FolderView.jsx)
const getImageUrl = (path) => {
    if (!path) return null;
    return `${API_URL}/image?path=${encodeURIComponent(path)}`;
};

// Helper to safely get values regardless of casing
const getSafeValue = (data, key) => {
    if (!data) return 0;
    return data[key] || data[key.toLowerCase()] || data[key.toUpperCase()] || 0;
};

// Interactive Chart Components
const Tooltip = ({ x, y, data }) => (
  <div
    className="absolute z-20 bg-gray-900 text-white text-xs rounded py-2 px-3 border border-gray-700 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
    style={{ left: x, top: y }}
  >
    <div className="font-bold border-b border-gray-700 pb-1 mb-1">{data.label}</div>
    {data.items.map((item, i) => (
      <div key={i} className="flex justify-between gap-3 text-[11px]">
        <span className="text-gray-400">{item.label}:</span>
        <span className="font-mono font-medium">{item.value}</span>
      </div>
    ))}
    {/* Arrow */}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45"></div>
  </div>
);

const InteractiveBarChart = ({ data, height = 250, onBarClick, color = "bg-theme-primary", valueKey = "value" }) => {
  const { t } = useTranslation();

  if (!data || data.length === 0) return <div className="text-theme-muted text-sm text-center py-20 flex flex-col items-center justify-center h-full">{t('runtime_history.charts.no_data')}</div>;

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const maxVal = Math.max(...data.map(d => d[valueKey]), 5);

  return (
    <div className="w-full h-full relative select-none" onMouseLeave={() => setHoveredIndex(null)}>
        <div className="flex items-end gap-[1px] w-full h-full pb-8 pt-4 px-2">
            {data.map((d, i) => {
            const heightPct = (d[valueKey] / maxVal) * 100;
            const showLabel = data.length <= 15 || i % Math.ceil(data.length / 12) === 0;

            return (
                <div
                key={i}
                className="flex-1 h-full flex flex-col justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onClick={() => onBarClick && onBarClick(d.originalData)}
                >
                <div className="w-full h-full flex items-end relative">
                    <div
                    className={`w-full ${color} opacity-80 group-hover:opacity-100 transition-all rounded-t-sm`}
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    ></div>
                    <div className="absolute inset-0 bg-transparent z-10"></div>
                </div>

                {showLabel && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 text-[10px] text-theme-muted mt-2 whitespace-nowrap">
                    {d.shortLabel}
                    </div>
                )}

                {hoveredIndex === i && (
                    <Tooltip
                    x="50%"
                    y="0%"
                    data={{
                        label: d.fullLabel,
                        items: [{ label: "Value", value: d[valueKey] }]
                    }}
                    />
                )}
                </div>
            );
            })}
        </div>
        <div className="absolute inset-0 pointer-events-none">
            <div className="border-b border-theme/20 absolute w-full top-0"></div>
            <div className="border-b border-theme/20 absolute w-full top-1/2"></div>
            <div className="border-b border-theme text-[10px] text-theme-muted absolute w-full bottom-8">0</div>
            <div className="absolute right-0 top-0 text-[10px] text-theme-muted bg-theme-card/80 px-1 rounded">{Math.round(maxVal)}</div>
        </div>
    </div>
  );
};

const ProviderStackChart = ({ data, height = 250 }) => {
    const { t } = useTranslation();
    if (!data || data.length === 0) return <div className="text-theme-muted text-sm text-center py-20">{t('runtime_history.charts.no_provider_data')}</div>;

    const [hoveredIndex, setHoveredIndex] = useState(null);

    const maxTotal = Math.max(...data.map(d => (
        getSafeValue(d, "TMDB") +
        getSafeValue(d, "TVDB") +
        getSafeValue(d, "Fanart") +
        getSafeValue(d, "Other")
    )), 5);

    const colors = {
        TMDB: "bg-blue-500",
        TVDB: "bg-green-500",
        Fanart: "bg-orange-500",
        Other: "bg-gray-500"
    };

    return (
        <div className="w-full h-full relative select-none" onMouseLeave={() => setHoveredIndex(null)}>
            <div className="flex items-end gap-[1px] w-full h-full pb-8 pt-4 px-2">
                {data.map((d, i) => {
                    const valTmdb = getSafeValue(d, "TMDB");
                    const valTvdb = getSafeValue(d, "TVDB");
                    const valFanart = getSafeValue(d, "Fanart");
                    const valOther = getSafeValue(d, "Other");
                    const total = valTmdb + valTvdb + valFanart + valOther;

                    const hTmdb = (valTmdb / maxTotal) * 100;
                    const hTvdb = (valTvdb / maxTotal) * 100;
                    const hFanart = (valFanart / maxTotal) * 100;
                    const hOther = (valOther / maxTotal) * 100;

                    const showLabel = data.length <= 15 || i % Math.ceil(data.length / 12) === 0;

                    return (
                        <div
                            key={i}
                            className="flex-1 h-full flex flex-col justify-end group relative"
                            onMouseEnter={() => setHoveredIndex(i)}
                        >
                            <div className="w-full h-full flex flex-col-reverse relative hover:brightness-110 transition-all z-10">
                                {valTmdb > 0 && <div style={{ height: `${hTmdb}%` }} className={`${colors.TMDB} w-full`}></div>}
                                {valTvdb > 0 && <div style={{ height: `${hTvdb}%` }} className={`${colors.TVDB} w-full`}></div>}
                                {valFanart > 0 && <div style={{ height: `${hFanart}%` }} className={`${colors.Fanart} w-full`}></div>}
                                {valOther > 0 && <div style={{ height: `${hOther}%` }} className={`${colors.Other} w-full rounded-t-sm`}></div>}
                                {total === 0 && <div className="h-px w-full bg-theme-muted/10"></div>}
                            </div>

                            {showLabel && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 text-[10px] text-theme-muted mt-2 whitespace-nowrap">
                                    {d.date.substring(5)}
                                </div>
                            )}

                            {hoveredIndex === i && total > 0 && (
                                <Tooltip
                                    x="50%"
                                    y="0%"
                                    data={{
                                    label: d.date,
                                    items: [
                                        { label: "TMDB", value: valTmdb },
                                        { label: "TVDB", value: valTvdb },
                                        { label: "Fanart", value: valFanart },
                                        { label: "Other", value: valOther },
                                        { label: "Total", value: total }
                                    ]
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
             <div className="absolute left-0 top-0 flex gap-3 text-[10px] bg-theme-card/90 p-1.5 rounded backdrop-blur-sm border border-theme/20 z-10 ml-2">
                {Object.entries(colors).map(([name, cls]) => (
                    <div key={name} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${cls}`}></div>
                        <span className="text-theme-muted">{name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Main Component

function RuntimeHistory() {
  const { t } = useTranslation();

  const [history, setHistory] = useState([]);
  const [providerStats, setProviderStats] = useState([]);
  const [summary, setSummary] = useState(null);
  const [migrationStatus, setMigrationStatus] = useState(null);

  const [viewMode, setViewMode] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(20);
  const [modeFilter, setModeFilter] = useState(null);
  const [graphDays, setGraphDays] = useState(7);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createdItems, setCreatedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [detailTab, setDetailTab] = useState("stats");

  const [modeFilterDropdownOpen, setModeFilterDropdownOpen] = useState(false);
  const modeFilterDropdownRef = useRef(null);

  // Data Fetching

  const fetchHistory = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const fetchLimit = viewMode === "analytics" ? 365 : limit;
      const offset = viewMode === "analytics" ? 0 : currentPage * limit;

      const modeParam = modeFilter ? `&mode=${modeFilter}` : "";
      const response = await fetch(`${API_URL}/runtime-history?limit=${fetchLimit}&offset=${offset}${modeParam}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setHistory(data.history);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      if (!silent) setTimeout(() => setRefreshing(false), 500);
    }
  };

  const fetchProviderStats = async () => {
      try {
          const response = await fetch(`${API_URL}/analytics/providers?days=${graphDays}`);
          if (response.ok) {
              const data = await response.json();
              if (data.success) setProviderStats(data.stats);
          }
      } catch (e) { console.error("Provider stats error", e); }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/runtime-summary?days=30`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) setSummary(data.summary);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMigrationStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/runtime-history/migration-status`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) setMigrationStatus(data);
        }
    } catch (e) {}
  };

  const fetchRunItems = async (runId) => {
      if (!runId) return;

      setLoadingItems(true);
      setCreatedItems([]);
      try {
          const response = await fetch(`${API_URL}/runtime-history/${runId}/items`);
          if (response.ok) {
              const data = await response.json();
              if (data.success) {
                  setCreatedItems(Array.isArray(data.items) ? data.items : []);
              }
          }
      } catch (e) {
          console.error("Error fetching run items:", e);
      } finally {
          setLoadingItems(false);
      }
  };

  useEffect(() => {
    fetchHistory(true);
    fetchSummary();
    fetchMigrationStatus();
    if (viewMode === "analytics") {
        fetchProviderStats();
    }
  }, [currentPage, modeFilter, viewMode, graphDays]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeFilterDropdownRef.current && !modeFilterDropdownRef.current.contains(event.target)) {
        setModeFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenDetail = (entry) => {
      setSelectedEntry(entry);
      setDetailTab("stats");
      setCreatedItems([]);
      setShowDetailModal(true);
      if (entry.total_images > 0 && entry.id) {
          fetchRunItems(entry.id);
      }
  };

  const analyticsData = useMemo(() => {
      if (!history.length) return { duration: [], assets: [], errors: [] };

      let chronoHistory = [...history].reverse();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - graphDays);

      chronoHistory = chronoHistory.filter(h => {
          const runDate = new Date(h.start_time || h.timestamp);
          return runDate >= cutoffDate;
      });

      return {
          duration: chronoHistory.map(h => ({
              shortLabel: new Date(h.start_time || h.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
              fullLabel: new Date(h.start_time || h.timestamp).toLocaleString(),
              value: h.runtime_seconds || 0,
              originalData: h
          })),
          assets: chronoHistory.map(h => ({
              shortLabel: new Date(h.start_time || h.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
              fullLabel: new Date(h.start_time || h.timestamp).toLocaleString(),
              value: h.total_images || 0,
              originalData: h
          })),
          errors: chronoHistory.map(h => ({
              shortLabel: new Date(h.start_time || h.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
              fullLabel: new Date(h.start_time || h.timestamp).toLocaleString(),
              value: h.errors || 0,
              originalData: h
          }))
      };
  }, [history, graphDays]);

  const getModeColor = (mode) => {
    const colors = {
      normal: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      testing: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      manual: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      scheduled: "bg-green-500/10 text-green-400 border-green-500/30",
    };
    return colors[mode] || "bg-gray-500/10 text-gray-400 border-gray-500/30";
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-theme-primary" /></div>;

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-theme-card p-4 rounded-xl border border-theme">
          <div className="flex items-center gap-4">
              <div className="flex bg-theme-bg p-1 rounded-lg border border-theme">
                  <button onClick={() => setViewMode("analytics")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "analytics" ? "bg-theme-primary text-white shadow-sm" : "text-theme-muted hover:text-theme-text"}`}>
                      <BarChart2 className="w-4 h-4" /> {t('runtime_history.analytics')}
                  </button>
                  <button onClick={() => setViewMode("list")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "list" ? "bg-theme-primary text-white shadow-sm" : "text-theme-muted hover:text-theme-text"}`}>
                      <ListIcon className="w-4 h-4" /> {t('runtime_history.history_list')}
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-3">
             {viewMode === "analytics" && (
                <div className="flex items-center gap-2 bg-theme-bg px-3 py-2 rounded-lg border border-theme">
                    <Calendar className="w-4 h-4 text-theme-muted" />
                    <select
                        value={graphDays}
                        onChange={(e) => setGraphDays(Number(e.target.value))}
                        className="bg-transparent text-sm text-theme-text outline-none cursor-pointer"
                    >
                        <option value={7}>{t('runtime_history.periods.last_7_days')}</option>
                        <option value={30}>{t('runtime_history.periods.last_30_days')}</option>
                        <option value={90}>{t('runtime_history.periods.last_3_months')}</option>
                        <option value={365}>{t('runtime_history.periods.last_year')}</option>
                    </select>
                </div>
             )}

             <button onClick={() => { fetchHistory(); if (viewMode==="analytics") fetchProviderStats(); }} disabled={refreshing} className="p-2 bg-theme-bg border border-theme rounded-lg text-theme-primary hover:bg-theme-hover">
                 <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
             </button>
          </div>
      </div>

      {viewMode === "analytics" && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-theme-card p-6 rounded-xl border border-theme hover:border-theme-primary/30 transition-all">
                      <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-400" /> {t('runtime_history.charts.execution_time')}
                      </h3>
                      <div className="h-64">
                          <InteractiveBarChart
                            data={analyticsData.duration}
                            color="bg-blue-500"
                            onBarClick={handleOpenDetail}
                          />
                      </div>
                  </div>

                  <div className="bg-theme-card p-6 rounded-xl border border-theme hover:border-theme-primary/30 transition-all">
                      <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                          <Image className="w-5 h-5 text-green-400" /> {t('runtime_history.charts.assets_created')}
                      </h3>
                      <div className="h-64">
                          <InteractiveBarChart
                            data={analyticsData.assets}
                            color="bg-green-500"
                            onBarClick={handleOpenDetail}
                          />
                      </div>
                  </div>

                  <div className="bg-theme-card p-6 rounded-xl border border-theme hover:border-theme-primary/30 transition-all">
                      <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" /> {t('runtime_history.charts.errors_per_run')}
                      </h3>
                      <div className="h-64">
                          <InteractiveBarChart
                            data={analyticsData.errors}
                            color="bg-red-500"
                            onBarClick={handleOpenDetail}
                          />
                      </div>
                  </div>

                  <div className="bg-theme-card p-6 rounded-xl border border-theme hover:border-theme-primary/30 transition-all">
                      <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
                          <Globe className="w-5 h-5 text-orange-400" /> {t('runtime_history.charts.source_distribution')}
                      </h3>
                      <div className="h-64">
                          <ProviderStackChart data={providerStats} />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {viewMode === "list" && (
        <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-theme-hover text-theme-muted font-medium border-b border-theme">
                        <tr>
                            <th className="px-6 py-4">{t('runtime_history.table.start_time')}</th>
                            <th className="px-6 py-4">{t('runtime_history.table.mode')}</th>
                            <th className="px-6 py-4">{t('runtime_history.table.duration')}</th>
                            <th className="px-6 py-4 text-right">{t('runtime_history.table.created')}</th>
                            <th className="px-6 py-4 text-right">{t('runtime_history.table.errors')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                        {history.map((entry) => (
                            <tr key={entry.id} onClick={() => handleOpenDetail(entry)} className="hover:bg-theme-hover/50 cursor-pointer transition-colors">
                                <td className="px-6 py-4 font-mono text-theme-text">
                                    {new Date(entry.start_time || entry.timestamp).toLocaleString("sv-SE").replace("T", " ")}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border capitalize ${getModeColor(entry.mode)}`}>
                                        {entry.mode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-theme-text font-mono">{entry.runtime_formatted}</td>
                                <td className="px-6 py-4 text-right font-bold text-theme-primary">{entry.total_images}</td>
                                <td className={`px-6 py-4 text-right font-bold ${entry.errors > 0 ? "text-red-400" : "text-green-500"}`}>{entry.errors}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="p-4 border-t border-theme flex justify-between items-center text-sm text-theme-muted">
                <span>{t('runtime_history.table.page')} {currentPage + 1}</span>
                <div className="flex gap-2">
                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="p-1 rounded bg-theme-bg border border-theme disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                    <button disabled={history.length < limit} onClick={() => setCurrentPage(p => p + 1)} className="p-1 rounded bg-theme-bg border border-theme disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-theme-card border border-theme rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

                <div className="p-6 border-b border-theme bg-theme-card flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-theme-text flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded border capitalize ${getModeColor(selectedEntry.mode)}`}>{selectedEntry.mode}</span>
                            {t('runtime_history.details.title')}
                        </h2>
                        <p className="text-theme-muted text-sm mt-1">{new Date(selectedEntry.start_time || selectedEntry.timestamp).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setShowDetailModal(false)}><X className="w-6 h-6 text-theme-muted hover:text-theme-text" /></button>
                </div>

                <div className="flex border-b border-theme bg-theme-bg/50">
                    <button
                        onClick={() => setDetailTab("stats")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${detailTab === "stats" ? "border-theme-primary text-theme-primary bg-theme-primary/5" : "border-transparent text-theme-muted hover:text-theme-text"}`}
                    >
                        {t('runtime_history.details.tab_stats')}
                    </button>
                    <button
                        onClick={() => setDetailTab("items")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${detailTab === "items" ? "border-theme-primary text-theme-primary bg-theme-primary/5" : "border-transparent text-theme-muted hover:text-theme-text"}`}
                    >
                        {t('runtime_history.details.tab_items')} ({selectedEntry.total_images})
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-theme-bg/20 h-full">
                    {detailTab === "stats" ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatBox label={t('runtime_history.details.runtime')} value={selectedEntry.runtime_formatted} icon={Clock} color="text-blue-400" />
                                <StatBox label={t('runtime_history.details.total_images')} value={selectedEntry.total_images} icon={Image} color="text-theme-primary" />
                                <StatBox label={t('runtime_history.table.errors')} value={selectedEntry.errors} icon={AlertTriangle} color={selectedEntry.errors > 0 ? "text-red-400" : "text-green-500"} />
                                <StatBox label={t('runtime_history.details.space_saved')} value={selectedEntry.space_saved || "0 KB"} icon={Database} color="text-green-400" />
                            </div>

                            <h4 className="text-sm font-bold text-theme-muted uppercase tracking-wider mt-2">{t('runtime_history.details.breakdown')}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                <MiniStat label={t('runtime_history.types.posters')} value={selectedEntry.posters} />
                                <MiniStat label={t('runtime_history.types.backgrounds')} value={selectedEntry.backgrounds} />
                                <MiniStat label={t('runtime_history.types.seasons')} value={selectedEntry.seasons} />
                                <MiniStat label={t('runtime_history.types.title_cards')} value={selectedEntry.titlecards} />
                                <MiniStat label={t('runtime_history.types.collections')} value={selectedEntry.collections} />
                            </div>

                            <div className="p-4 bg-theme-bg rounded-lg border border-theme mt-4">
                                <h4 className="text-sm font-bold text-theme-text mb-2">{t('runtime_history.details.logs')}</h4>
                                <div className="text-xs font-mono text-theme-muted bg-black/30 p-3 rounded overflow-x-auto">
                                    {t('runtime_history.details.log_file')}: {selectedEntry.log_file} <br/>
                                    {t('runtime_history.details.script_version')}: {selectedEntry.script_version || "N/A"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loadingItems ? (
                                <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-theme-primary" /><p className="mt-2 text-theme-muted">{t('runtime_history.items.loading')}</p></div>
                            ) : createdItems.length === 0 ? (
                                <div className="text-center py-20 text-theme-muted">
                                    <p className="font-medium text-lg text-theme-text mb-2">{t('runtime_history.items.none_found')}</p>
                                    <p className="text-sm">
                                        {selectedEntry.total_images > 0
                                            ? t('runtime_history.items.assets_no_records', { count: selectedEntry.total_images })
                                            : t('runtime_history.items.no_new_assets')}
                                    </p>
                                    <p className="text-xs mt-4 opacity-70 bg-theme-bg p-2 rounded border border-theme inline-block">
                                        {t('runtime_history.items.timestamp_warning', { id: selectedEntry.id })}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {createdItems.map((item, idx) => {
                                        // 2. Safe Path Extraction
                                        // Try common keys for path. If keys are missing, we fall back to null.
                                        const assetPath = item.Path || item.OutputPath || item.path || item.output_path || item.Rootfolder || item.poster_path;
                                        const imageUrl = getImageUrl(assetPath) || item.poster_url;

                                        return (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-theme-card border border-theme rounded-lg hover:border-theme-primary/50 transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-14 bg-theme-bg rounded overflow-hidden flex-shrink-0 border border-theme relative">
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    {/* Fallback Icon */}
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-500/10 text-gray-400" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                                        {item.Type === "Poster" ? <Film className="w-4 h-4"/> : <Image className="w-4 h-4"/>}
                                                    </div>
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="font-medium text-theme-text truncate">{item.Title}</div>
                                                    <div className="text-xs text-theme-muted truncate">{item.LibraryName} • {item.Rootfolder}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                 <span className="text-xs font-mono bg-theme-bg px-2 py-0.5 rounded border border-theme">{item.Type}</span>
                                                 {item.DownloadSource && <span className="text-[10px] text-theme-muted max-w-[150px] truncate" title={item.DownloadSource}>{item.DownloadSource}</span>}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// UI Helpers
const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="bg-theme-card p-4 rounded-lg border border-theme flex flex-col justify-between">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-theme-muted font-bold uppercase">{label}</span>
            {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
);

const MiniStat = ({ label, value }) => (
    <div className="bg-theme-bg/50 p-3 rounded-lg border border-theme text-center">
        <div className="text-xl font-bold text-theme-text">{value}</div>
        <div className="text-[10px] text-theme-muted uppercase">{label}</div>
    </div>
);

export default RuntimeHistory;