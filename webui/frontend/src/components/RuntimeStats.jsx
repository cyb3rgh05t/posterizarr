import React, { useState, useEffect, useRef } from "react";
import { Clock, RefreshCw, Loader2, Image, AlertTriangle, Film, Tv, Globe, ImageOff, Type, Scissors, Database, HardDrive, Bell, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const API_URL = "/api";

function RuntimeStats({ refreshTrigger = 0 }) {
  const { t } = useTranslation();
  const [runtimeStats, setRuntimeStats] = useState({
      runtime: null, total_images: 0, posters: 0, seasons: 0, backgrounds: 0, titlecards: 0, 
      collections: 0, errors: 0, tba_skipped: 0, jap_chines_skipped: 0, notification_sent: false,
      uptime_kuma: null, images_cleared: 0, folders_cleared: 0, space_saved: null,
      script_version: null, im_version: null, start_time: null, end_time: null, mode: null,
      fallbacks: 0, textless: 0, truncated: 0, text: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchRuntimeStats = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/runtime-stats`);
      const data = await response.json();
      if (data.success) setRuntimeStats(data);
    } catch (error) { console.error(error); } finally { setRefreshing(false); }
  };

  useEffect(() => { fetchRuntimeStats(true); }, [refreshTrigger]);

  if (!runtimeStats.runtime) return null;

  return (
    <div className="space-y-6 bg-background p-1">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20"><Clock className="w-5 h-5 text-primary" /></div>
            <div>
                <h2 className="text-xl font-bold tracking-tight">{t("dashboard.runtimeStats")}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-bold text-primary uppercase">{runtimeStats.mode}</span>
                    <span>•</span>
                    <span>{new Date(runtimeStats.start_time).toLocaleString("sv-SE").replace("T", " ")}</span>
                </div>
            </div>
        </div>
        <button onClick={() => fetchRuntimeStats()} disabled={refreshing} className="p-2 hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border">
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* HIGHLIGHT KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HighlightCard label={t("runtimeStats.executionTime")} value={runtimeStats.runtime} icon={<Clock />} color="hsl(262, 83%, 58%)" />
          <HighlightCard label={t("runtimeStats.totalImages")} value={runtimeStats.total_images} icon={<Image />} color="hsl(221, 83%, 53%)" />
          <HighlightCard label={t("runtimeStats.spaceSaved")} value={runtimeStats.space_saved || "0 B"} icon={<Database />} color="hsl(142, 76%, 36%)" />
      </div>

      {/* DETAILED STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MiniStat label={t("assets.posters")} value={runtimeStats.posters} icon={<Film />} color="#10b981" />
        <MiniStat label={t("assets.seasons")} value={runtimeStats.seasons} icon={<Tv />} color="#f59e0b" />
        <MiniStat label={t("assets.backgrounds")} value={runtimeStats.backgrounds} icon={<Image />} color="#8b5cf6" />
        <MiniStat label={t("assets.titleCards")} value={runtimeStats.titlecards} icon={<Tv />} color="#06b6d4" />
        <MiniStat label={t("runtimeStats.fallbacks")} value={runtimeStats.fallbacks} icon={<ImageOff />} color="#f97316" />
        <MiniStat label="Errors" value={runtimeStats.errors} icon={<AlertTriangle />} color={runtimeStats.errors > 0 ? "#ef4444" : "#10b981"} />
        
        <MiniStat label="Textless" value={runtimeStats.textless} icon={<Image />} color="#6366f1" />
        <MiniStat label="Truncated" value={runtimeStats.truncated} icon={<Scissors />} color="#ec4899" />
        <MiniStat label="Text Overlay" value={runtimeStats.text} icon={<Type />} color="#14b8a6" />
        <MiniStat label="TBA Skipped" value={runtimeStats.tba_skipped} icon={<Film />} color="#64748b" />
        <MiniStat label="Foreign Skipped" value={runtimeStats.jap_chines_skipped} icon={<Globe />} color="#64748b" />
        <MiniStat label="Collections" value={runtimeStats.collections} icon={<Film />} color="#eab308" />
      </div>

      {/* SYSTEM & MAINTENANCE INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t("runtimeStats.additionalInfo")}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <BooleanStat label="Notify" active={runtimeStats.notification_sent} icon={<Bell />} />
                  <BooleanStat label="Uptime" active={runtimeStats.uptime_kuma} icon={<CheckCircle2 />} />
                  <InfoStat label="Images Cleared" value={runtimeStats.images_cleared} />
                  <InfoStat label="Folders Cleared" value={runtimeStats.folders_cleared} />
              </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm flex items-center justify-around">
              <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Script</p>
                  <p className="text-sm font-mono font-bold text-primary">{runtimeStats.script_version}</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Magick</p>
                  <p className="text-sm font-mono font-bold text-primary">{runtimeStats.im_version}</p>
              </div>
          </div>
      </div>
    </div>
  );
}

const HighlightCard = ({ label, value, icon, color }) => (
    <div className="relative overflow-hidden bg-card rounded-2xl border p-6 shadow-sm group hover:border-primary/40 transition-all">
        <div className="relative z-10 flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className="text-3xl font-bold tracking-tight" style={{ color }}>{value}</span>
        </div>
        <div className="absolute -bottom-2 -right-2 text-muted-foreground/5 group-hover:text-primary/10 transition-colors">
            {React.cloneElement(icon, { size: 90 })}
        </div>
    </div>
);

const MiniStat = ({ label, value, icon, color }) => (
    <div className="bg-muted/20 rounded-2xl p-3.5 border border-transparent hover:border-border transition-colors">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}1A`, color: color }}>
                {React.cloneElement(icon, { size: 14 })}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground truncate">{label}</span>
        </div>
        <div className="text-xl font-bold">{value}</div>
    </div>
);

const BooleanStat = ({ label, active, icon }) => (
    <div className="flex flex-col items-center gap-1">
        <div className={`p-2 rounded-full ${active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {React.cloneElement(icon, { size: 16 })}
        </div>
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
    </div>
);

const InfoStat = ({ label, value }) => (
    <div className="text-center">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] font-bold uppercase text-muted-foreground leading-tight">{label}</p>
    </div>
);

export default RuntimeStats;