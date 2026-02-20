import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import {
  Clock, RefreshCw, Loader2, Image, AlertTriangle, Database,
  BarChart2, List as ListIcon, Globe, PieChart, HardDrive, 
  Layers, FileType, FileImage, ChevronRight, X, Box
} from "lucide-react";

const API_URL = "/api";

const THEME = {
  orange: 'hsl(38, 92%, 50%)',
  green: 'hsl(142, 76%, 36%)',
  red: 'hsl(346, 77%, 50%)',
  blue: 'hsl(221, 83%, 53%)',
  tmdb: '#03b4e3',
  tvdb: '#6cd591',
  fanart: '#22b6e0',
};

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + ['Bytes', 'KB', 'MB', 'GB', 'TB'][i];
};

function RuntimeHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // STATE
  const [history, setHistory] = useState([]);
  const [providerStats, setProviderStats] = useState([]);
  const [assetOverview, setAssetOverview] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [exportStats, setExportStats] = useState(null);
  const [overlayStats, setOverlayStats] = useState([]);
  const [viewMode, setViewMode] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(20);
  const [graphDays, setGraphDays] = useState(7);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
            fetch(`${API_URL}/analytics/providers?days=${graphDays}`).then(res => res.json()),
            fetch(`${API_URL}/assets/overview`).then(res => res.json()),
            fetch(`${API_URL}/assets/stats`).then(res => res.json()),
            fetch(`${API_URL}/overlayfiles`).then(res => res.json()),
            fetch(usePlex ? `${API_URL}/plex-export/statistics` : `${API_URL}/other-media-export/statistics`).then(res => res.json())
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
    } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAllData(false); }, [currentPage, viewMode, graphDays]);

  // CHART CONFIG GENERATORS
  const chartOptions = useMemo(() => {
    const chrono = [...history].reverse().filter(h => {
        const d = new Date(h.start_time || h.timestamp);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - graphDays);
        return d >= cutoff;
    });

    const categories = chrono.map(h => new Date(h.start_time || h.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'}));

    const baseArea = (name, data, color) => ({
      chart: { type: 'area', backgroundColor: 'transparent', height: 250, style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      xAxis: { categories, labels: { style: { color: 'hsl(var(--muted-foreground))' } }, lineColor: 'hsl(var(--border))' },
      yAxis: { title: { text: undefined }, gridLineColor: 'hsl(var(--border) / 0.5)', labels: { style: { color: 'hsl(var(--muted-foreground))' } } },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: { shared: true, backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', style: { color: 'hsl(var(--popover-foreground))' } },
      plotOptions: {
        area: {
          fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, `${color}4D`], [1, `${color}0D`]] },
          marker: { enabled: false },
          lineWidth: 2,
          lineColor: color
        }
      },
      series: [{ name, data }]
    });

    return {
      duration: baseArea('Seconds', chrono.map(h => h.runtime_seconds || 0), THEME.orange),
      assets: baseArea('Images', chrono.map(h => h.total_images || 0), THEME.green),
      errors: baseArea('Errors', chrono.map(h => h.errors || 0), THEME.red)
    };
  }, [history, graphDays]);

  if (loading && !refreshing && history.length === 0) return <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="space-y-6 p-6 bg-background text-foreground">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-xl"><BarChart2 className="text-primary" /></div>
             <h2 className="text-2xl font-bold tracking-tight">{t('runtime_history.title')}</h2>
          </div>
          <div className="flex items-center gap-3">
              {viewMode === "analytics" && (
                <div className="flex items-center bg-muted rounded-lg px-2 border">
                    <span className="text-xs text-muted-foreground mr-2">Last</span>
                    <input type="number" value={graphDays} onChange={(e) => setGraphDays(Number(e.target.value))} className="bg-transparent w-12 text-center text-sm font-bold py-1 outline-none" />
                    <span className="text-xs text-muted-foreground ml-2">days</span>
                </div>
              )}
              <div className="flex bg-muted p-1 rounded-lg border">
                  <button onClick={() => setViewMode("analytics")} className={`px-4 py-1 text-sm rounded-md transition-all ${viewMode === "analytics" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>Graphs</button>
                  <button onClick={() => setViewMode("list")} className={`px-4 py-1 text-sm rounded-md transition-all ${viewMode === "list" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>History</button>
              </div>
              <button onClick={() => fetchAllData()} className="p-2 hover:bg-muted rounded-full transition-colors"><RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /></button>
          </div>
      </div>

      {viewMode === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ASSET OVERVIEW BOX */}
              <div className="bg-card rounded-2xl border p-6 shadow-sm cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => navigate("/asset-overview")}>
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><PieChart size={18} className="text-primary"/> Asset Overview</h3>
                      <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      <CompactStat label="Resolved" value={assetOverview?.categories?.resolved?.count || 0} color={THEME.green} />
                      <CompactStat label="Missing" value={assetOverview?.categories?.missing_assets?.count || 0} color={THEME.red} />
                      <CompactStat label="Non-Primary" value={assetOverview?.categories?.non_primary_lang?.count || 0} color={THEME.orange} />
                  </div>
              </div>

              {/* EXPORT STATS BOX */}
              <div className="bg-card rounded-2xl border p-6 shadow-sm">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Database size={18} className="text-primary"/> Export Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/50 rounded-xl border">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Runs</p>
                          <p className="text-xl font-bold">{exportStats?.total_runs || 0}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-xl border text-right">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Latest Run</p>
                          <p className="text-xs font-mono">{exportStats?.latest_run ? new Date(exportStats.latest_run).toLocaleDateString() : 'N/A'}</p>
                      </div>
                  </div>
              </div>

              {/* ANALYTICS CHARTS */}
              <ChartCard title={t('runtime_history.charts.execution_time')} icon={<Clock size={18}/>} options={chartOptions.duration} />
              <ChartCard title={t('runtime_history.charts.assets_created')} icon={<Image size={18}/>} options={chartOptions.assets} />
              <ChartCard title={t('runtime_history.charts.errors_per_run')} icon={<AlertTriangle size={18}/>} options={chartOptions.errors} />

              {/* STORAGE BOX */}
              <div className="bg-card rounded-2xl border p-6 shadow-sm lg:col-span-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><HardDrive size={18} className="text-primary"/> Library Storage</h3>
                  <div className="flex gap-4 mb-6">
                      <div className="flex-1 bg-muted/30 p-4 rounded-2xl border text-center">
                          <p className="text-3xl font-bold">{formatBytes(assetStats?.stats?.total_size)}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest">Total Usage</p>
                      </div>
                  </div>
                  <div className="space-y-3">
                      {assetStats?.stats?.folders?.sort((a,b) => b.size - a.size).map((f, i) => (
                          <div key={i} className="flex items-center justify-between group">
                              <span className="text-sm font-medium">{f.name}</span>
                              <div className="flex items-center gap-4 flex-1 mx-6">
                                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-primary rounded-full" style={{ width: `${(f.size / assetStats.stats.total_size) * 100}%` }}></div>
                                  </div>
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">{formatBytes(f.size)}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[10px] tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4">Start Time</th>
                            <th className="px-6 py-4">Mode</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4 text-right">Created</th>
                            <th className="px-6 py-4 text-right">Errors</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {history.map((entry) => (
                            <tr key={entry.id} onClick={() => {setSelectedEntry(entry); setShowDetailModal(true);}} className="hover:bg-accent/5 transition-colors cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{new Date(entry.start_time || entry.timestamp).toLocaleString("sv-SE").replace("T", " ")}</td>
                                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">{entry.mode}</span></td>
                                <td className="px-6 py-4 text-muted-foreground">{entry.runtime_formatted}</td>
                                <td className="px-6 py-4 text-right font-bold text-success">{entry.total_images}</td>
                                <td className="px-6 py-4 text-right font-bold text-destructive">{entry.errors}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
}

const ChartCard = ({ title, icon, options }) => (
    <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-6">{icon} {title}</h3>
        <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
);

const CompactStat = ({ label, value, color }) => (
    <div className="text-center p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border transition-colors">
        <div className="text-xl font-bold" style={{ color }}>{value}</div>
        <div className="text-[10px] uppercase text-muted-foreground font-semibold">{label}</div>
    </div>
);

export default RuntimeHistory;