import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, Play, Image, Settings, Clock, FileText, Info, Menu, X,
  ChevronDown, ChevronRight, Film, Layers, Tv, Database, Server,
  Palette, Bell, Lock, User, FileImage, Lightbulb, AlertTriangle,
  TrendingUp, Zap, FolderKanban, GripVertical, TestTube,
} from "lucide-react";
import VersionBadge from "./VersionBadge";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { theme, setTheme, themes } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAssetsExpanded, setIsAssetsExpanded] = useState(false);
  const [isMediaServerExpanded, setIsMediaServerExpanded] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [missingAssetsCount, setMissingAssetsCount] = useState(0);
  const [manualAssetsCount, setManualAssetsCount] = useState(0);
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("gallery-view-mode") || "grid";
  });

  // Counts Fetching Logic
  React.useEffect(() => {
    const fetchMissingAssetsCount = async () => {
      try {
        const response = await fetch("/api/assets/overview");
        if (response.ok) {
          const data = await response.json();
          setMissingAssetsCount(data.categories.assets_with_issues.count);
        }
      } catch (error) { console.error("Failed to fetch missing assets count:", error); }
    };
    fetchMissingAssetsCount();
    const handleAssetReplaced = () => fetchMissingAssetsCount();
    window.addEventListener("assetReplaced", handleAssetReplaced);
    const interval = setInterval(fetchMissingAssetsCount, 60000);
    return () => { clearInterval(interval); window.removeEventListener("assetReplaced", handleAssetReplaced); };
  }, []);

  React.useEffect(() => {
    const fetchManualAssetsCount = async () => {
      try {
        const response = await fetch("/api/manual-assets-gallery");
        if (response.ok) {
          const data = await response.json();
          setManualAssetsCount(data.total_assets || 0);
        }
      } catch (error) { console.error("Failed to fetch manual assets count:", error); }
    };
    fetchManualAssetsCount();
    const handleAssetReplaced = () => fetchManualAssetsCount();
    window.addEventListener("assetReplaced", handleAssetReplaced);
    const interval = setInterval(fetchManualAssetsCount, 600000);
    return () => { clearInterval(interval); window.removeEventListener("assetReplaced", handleAssetReplaced); };
  }, []);

  React.useEffect(() => {
    const handleStorageChange = () => { setViewMode(localStorage.getItem("gallery-view-mode") || "grid"); };
    window.addEventListener("viewModeChanged", handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);
    return () => { window.removeEventListener("viewModeChanged", handleStorageChange); clearInterval(interval); };
  }, []);

  const themeArray = Object.entries(themes).map(([id, config]) => ({
    id, name: config.name, color: config.variables["--theme-primary"],
  }));

  const defaultNavItems = [
    { id: "dashboard", path: "/", label: t("nav.dashboard"), icon: Activity },
    { id: "runModes", path: "/run-modes", label: t("nav.runModes"), icon: Play },
    { id: "scheduler", path: "/scheduler", label: t("nav.scheduler"), icon: Clock },
    {
      id: "mediaServerExport",
      path: "/media-server-export",
      label: t("nav.mediaServerExport", "Media Server Export"),
      icon: Server,
      hasSubItems: true,
      subItems: [
        { path: "/media-server-export/plex", label: t("mediaServerExport.plex", "Plex"), icon: Database },
        { path: "/media-server-export/jellyfin-emby", label: t("mediaServerExport.jellyfinEmby", "Jellyfin / Emby"), icon: Server },
      ],
    },
    {
      id: "gallery",
      path: "/gallery",
      label: t("nav.assets"),
      icon: Image,
      hasSubItems: true,
      subItems: viewMode === "folder"
        ? [
            { path: "/gallery/posters", label: t("assets.assetsFolders"), icon: FolderKanban },
            { path: "/manual-assets", label: "Manual Assets", icon: FileImage, badge: manualAssetsCount, badgeColor: "green" },
            { path: "/asset-overview", label: t("nav.assetOverview"), icon: AlertTriangle, badge: missingAssetsCount, badgeColor: "red" },
            { path: "/assets-manager", label: t("nav.assetsManager", "Assets Manager"), icon: Layers },
            { path: "/test-gallery", label: t("nav.testGallery", "Test Gallery"), icon: TestTube },
          ]
        : [
            { path: "/gallery/posters", label: t("assets.posters"), icon: Image },
            { path: "/gallery/backgrounds", label: t("assets.backgrounds"), icon: Layers },
            { path: "/gallery/seasons", label: t("assets.seasons"), icon: Film },
            { path: "/gallery/titlecards", label: t("assets.titleCards"), icon: Tv },
            { path: "/manual-assets", label: "Manual Assets", icon: FileImage, badge: manualAssetsCount, badgeColor: "green" },
            { path: "/asset-overview", label: t("nav.assetOverview"), icon: AlertTriangle, badge: missingAssetsCount, badgeColor: "red" },
            { path: "/assets-manager", label: t("nav.assetsManager", "Assets Manager"), icon: Layers },
            { path: "/test-gallery", label: t("nav.testGallery", "Test Gallery"), icon: TestTube },
          ],
    },
    { id: "autoTriggers", path: "/auto-triggers", label: t("nav.autoTriggers"), icon: Zap },

    // CONFIGURATION (Single Link)
    {
      id: "config",
      path: "/config/webui",
      label: t("nav.config"),
      icon: Settings,
      hasSubItems: false // Removed sub-tree
    },
    //--------------------------------

    { id: "runtimeHistory", path: "/runtime-history", label: t("nav.runtimeHistory"), icon: TrendingUp },
    { id: "logs", path: "/logs", label: t("nav.logs"), icon: FileText },
    { id: "howItWorks", path: "/how-it-works", label: t("nav.howItWorks"), icon: Lightbulb },
    { id: "about", path: "/about", label: t("nav.about"), icon: Info },
  ];

  const [navOrder, setNavOrder] = React.useState(() => {
    const saved = localStorage.getItem("sidebar_nav_order");
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved);
        const defaultIds = defaultNavItems.map((item) => item.id);
        const missingIds = defaultIds.filter((id) => !savedOrder.includes(id));
        const validSavedOrder = savedOrder.filter(id => defaultIds.includes(id));
        return [...validSavedOrder, ...missingIds];
      } catch (e) { return defaultNavItems.map((item) => item.id); }
    }
    return defaultNavItems.map((item) => item.id);
  });

  const navItems = React.useMemo(() => navOrder.map((id) => defaultNavItems.find((item) => item.id === id)).filter(Boolean), [navOrder, viewMode, missingAssetsCount, manualAssetsCount]);

  const saveNavOrder = (order) => { setNavOrder(order); localStorage.setItem("sidebar_nav_order", JSON.stringify(order)); };
  const handleDragStart = (e, index) => { setDraggedItem(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, index) => { e.preventDefault(); if (draggedItem === null || draggedItem === index) return; const newOrder = [...navOrder]; const draggedId = newOrder[draggedItem]; newOrder.splice(draggedItem, 1); newOrder.splice(index, 0, draggedId); setDraggedItem(index); setNavOrder(newOrder); };
  const handleDragEnd = () => { if (draggedItem !== null) saveNavOrder(navOrder); setDraggedItem(null); };

  // Helper to check active sections
  const isInAssetsSection = location.pathname.startsWith("/gallery") || location.pathname.startsWith("/manual-assets") || location.pathname.startsWith("/asset-overview") || location.pathname.startsWith("/assets-manager") || location.pathname.startsWith("/test-gallery");
  const isInMediaServerSection = location.pathname.startsWith("/media-server-export");
  const isInConfigSection = location.pathname.startsWith("/config"); // Highlights config for any sub-route

  return (
    <>
      <div className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-theme-card border-r border-theme transition-all duration-300 z-50 ${isCollapsed ? "w-20" : "w-80"}`}>
        <div className="flex items-center p-4 h-20">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg hover:bg-theme-hover transition-colors text-theme-text"><Menu className="w-5 h-5" /></button>
          {!isCollapsed && <div className="ml-3 flex items-center"><img src="/logo.png" alt="Posterizarr Logo" className="h-12 w-auto object-contain" /></div>}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              // Check active status (Config handles sub-routes)
              const isActive = item.id === "config" ? isInConfigSection : location.pathname === item.path;
              const isDragging = draggedItem === index;

              if (item.hasSubItems) {
                const isAssetsItem = item.path === "/gallery";
                const isExpanded = isAssetsItem ? isAssetsExpanded : isMediaServerExpanded;
                const isInSection = isAssetsItem ? isInAssetsSection : isInMediaServerSection;
                const toggleExpanded = isAssetsItem ? () => setIsAssetsExpanded(!isAssetsExpanded) : () => setIsMediaServerExpanded(!isMediaServerExpanded);

                return (
                  <div key={item.id} draggable={!isCollapsed} onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} onMouseEnter={() => setHoveredItem(index)} onMouseLeave={() => setHoveredItem(null)} className={`relative ${isDragging ? "opacity-50" : ""}`}>
                    <button onClick={toggleExpanded} className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between px-3"} py-3 rounded-lg text-sm font-medium transition-all group ${isInSection ? "bg-theme-primary/20 text-theme-primary" : "text-theme-muted hover:bg-theme-hover hover:text-theme-text"}`} title={isCollapsed ? item.label : ""}>
                      <div className="flex items-center"><Icon className="w-5 h-5 flex-shrink-0" />{!isCollapsed && <span className="ml-3">{item.label}</span>}</div>
                      <div className="flex items-center gap-1">{!isCollapsed && (<>{hoveredItem === index && <GripVertical className="w-4 h-4 text-theme-muted opacity-60 cursor-grab active:cursor-grabbing" />}{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</>)}</div>
                    </button>
                    {isExpanded && !isCollapsed && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <Link key={subItem.path} to={subItem.path} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${isSubActive ? "bg-theme-primary text-white shadow-lg" : "text-theme-muted hover:bg-theme-hover hover:text-theme-text"}`}>
                              <div className="flex items-center"><SubIcon className="w-4 h-4 flex-shrink-0" /><span className="ml-3">{subItem.label}</span></div>
                              {subItem.badge !== undefined && subItem.badge > 0 && <span className={`${subItem.badgeColor === "green" ? "bg-green-500" : "bg-red-500"} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center`}>{subItem.badge}</span>}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={item.id} draggable={!isCollapsed} onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} onMouseEnter={() => setHoveredItem(index)} onMouseLeave={() => setHoveredItem(null)} className={`relative ${isDragging ? "opacity-50" : ""}`}>
                  <Link to={item.path} className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between px-3"} py-3 rounded-lg text-sm font-medium transition-all group ${isActive ? "bg-theme-primary text-white shadow-lg" : "text-theme-muted hover:bg-theme-hover hover:text-theme-text"}`} title={isCollapsed ? item.label : ""}>
                    <div className="flex items-center"><Icon className="w-5 h-5 flex-shrink-0" />{!isCollapsed && <span className="ml-3">{item.label}</span>}</div>
                    <div className="flex items-center gap-2">{!isCollapsed && hoveredItem === index && <GripVertical className="w-4 h-4 text-theme-muted opacity-60 cursor-grab active:cursor-grabbing" />}{!isCollapsed && item.badge !== undefined && item.badge > 0 && <span className={`${item.badgeColor === "green" ? "bg-green-500" : "bg-red-500"} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center`}>{item.badge}</span>}</div>
                  </Link>
                </div>
              );
            })}
          </div>
        </nav>
        <div className="p-4">{!isCollapsed ? <VersionBadge /> : <div className="flex justify-center items-center"><div className="text-xs text-theme-muted font-semibold">v2.0</div></div>}</div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-theme-card border-b border-theme z-50 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg hover:bg-theme-hover transition-colors text-theme-text">{isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            <span className="ml-3 text-xl font-bold text-theme-primary">Posterizarr</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)} className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-theme-hover transition-colors text-theme-text"><Palette className="w-5 h-5" /></button>
              {isThemeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThemeDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-theme-card border border-theme shadow-lg z-50">
                    <div className="p-2">{themeArray.map((t) => (<button key={t.id} onClick={() => { setTheme(t.id); setIsThemeDropdownOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${theme === t.id ? "bg-theme-primary text-white" : "text-gray-300 hover:bg-theme-hover"}`}><span>{t.name}</span><div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} /></button>))}</div>
                  </div>
                </>
              )}
            </div>
            <button className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-theme-hover transition-colors text-theme-text"><User className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-40 top-16" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="md:hidden fixed left-0 top-16 bottom-0 w-64 bg-theme-card border-r border-theme z-40 flex flex-col">
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="space-y-1 px-3">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = item.id === "config" ? isInConfigSection : location.pathname === item.path;
                  if (item.hasSubItems) {
                    const isAssetsItem = item.path === "/gallery";
                    const isExpanded = isAssetsItem ? isAssetsExpanded : isMediaServerExpanded;
                    const toggleExpanded = isAssetsItem ? () => setIsAssetsExpanded(!isAssetsExpanded) : () => setIsMediaServerExpanded(!isMediaServerExpanded);
                    return (<div key={item.id}><button onClick={toggleExpanded} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-theme-muted hover:bg-theme-hover"><div className="flex items-center"><Icon className="w-5 h-5 mr-3" /><span>{item.label}</span></div>{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>{isExpanded && (<div className="ml-4 mt-1 space-y-1">{item.subItems.map(sub => (<Link key={sub.path} to={sub.path} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-theme-muted hover:bg-theme-hover"><sub.icon className="w-4 h-4 mr-3" />{sub.label}</Link>))}</div>)}</div>)
                  }
                  return (<Link key={item.id} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium ${isActive ? "bg-theme-primary text-white" : "text-theme-muted hover:bg-theme-hover"}`}><Icon className="w-5 h-5 mr-3" /><span>{item.label}</span></Link>);
                })}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;