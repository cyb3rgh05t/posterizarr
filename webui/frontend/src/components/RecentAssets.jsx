import React, { useState, useEffect, useRef } from "react";
import {
  FileImage,
  ExternalLink,
  RefreshCw,
  Loader2,
  ImageOff,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Folder,
  HardDrive,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardLoading } from "../context/DashboardLoadingContext";
import { useToast } from "../context/ToastContext";
import CompactImageSizeSlider from "./CompactImageSizeSlider";

const API_URL = "/api";

let cachedAssets = null;

function RecentAssets({ refreshTrigger = 0 }) {
  const { t } = useTranslation();
  const { showSuccess, showError, showInfo } = useToast();
  const { startLoading, finishLoading } = useDashboardLoading();
  const hasInitiallyLoaded = useRef(false);
  const [assets, setAssets] = useState(cachedAssets || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Tab filter state
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("recent-assets-tab");
    return saved || "All";
  });

  // Pagination offset state
  const [pageOffset, setPageOffset] = useState(() => {
    const saved = localStorage.getItem(`recent-assets-offset-${activeTab}`);
    return saved ? parseInt(saved) : 0;
  });

  // Asset count state
  const [assetCount, setAssetCount] = useState(() => {
    const saved = localStorage.getItem("recent-assets-count");
    const count = saved ? parseInt(saved) : 10;
    return Math.min(Math.max(count, 5), 10);
  });

  const fetchRecentAssets = async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
      startLoading("recent-assets");
    }
    setError(null);

    try {
      const response = await fetch(`${API_URL}/recent-assets`);
      const data = await response.json();

      if (data.success) {
        cachedAssets = data.assets;
        setAssets(data.assets);
        setError(null);

        if (!hasInitiallyLoaded.current) {
          hasInitiallyLoaded.current = true;
          finishLoading("recent-assets");
        }
      } else {
        const errorMsg = data.error || t("recentAssets.loadError");
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err.message || t("recentAssets.loadError");
      setError(errorMsg);
      showError(errorMsg);
      console.error("Error fetching recent assets:", err);
    } finally {
      setLoading(false);
      if (!silent) {
        setTimeout(() => {
          setRefreshing(false);
        }, 500);
      }
    }
  };

  useEffect(() => {
    startLoading("recent-assets");
    if (cachedAssets) {
      setAssets(cachedAssets);
      setLoading(false);
      if (!hasInitiallyLoaded.current) {
        hasInitiallyLoaded.current = true;
        finishLoading("recent-assets");
      }
    } else {
      fetchRecentAssets(true);
    }

    const interval = setInterval(() => {
      fetchRecentAssets(true);
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchRecentAssets(true);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const handleAssetReplaced = () => {
      fetchRecentAssets(true);
    };
    window.addEventListener("assetReplaced", handleAssetReplaced);
    return () => {
      window.removeEventListener("assetReplaced", handleAssetReplaced);
    };
  }, []);

  const handleAssetCountChange = (newCount) => {
    const validCount = Math.min(Math.max(newCount, 5), 10);
    setAssetCount(validCount);
    localStorage.setItem("recent-assets-count", validCount.toString());
    setPageOffset(0);
    localStorage.setItem(`recent-assets-offset-${activeTab}`, "0");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("recent-assets-tab", tab);
    const savedOffset = localStorage.getItem(`recent-assets-offset-${tab}`);
    setPageOffset(savedOffset ? parseInt(savedOffset) : 0);
  };

  const handlePageChange = (direction) => {
    const filteredAssets = filterAssetsByTab(assets);
    const maxOffset = Math.max(0, filteredAssets.length - assetCount);

    let newOffset = pageOffset;
    if (direction === "prev") {
      newOffset = Math.max(0, pageOffset - assetCount);
    } else if (direction === "next") {
      newOffset = Math.min(maxOffset, pageOffset + assetCount);
    }

    setPageOffset(newOffset);
    localStorage.setItem(
      `recent-assets-offset-${activeTab}`,
      newOffset.toString()
    );
  };

  const filterAssetsByTab = (assetList) => {
    if (activeTab === "All") {
      return assetList;
    }

    return assetList.filter((asset) => {
      const type = asset.type?.toLowerCase() || "";

      switch (activeTab) {
        case "Posters":
          return type === "movie" || type === "poster" || type === "show" || type === "collection";
        case "Collections":
          return type === "collection";
        case "Backgrounds":
          return type.includes("background");
        case "Seasons":
          return type === "season";
        case "TitleCards":
          return (
            type === "episode" || type === "titlecard" || type === "title_card"
          );
        default:
          return true;
      }
    });
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "movie":
      case "poster":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "collection":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "show":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "season":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "episode":
      case "titlecard":
      case "title_card":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "background":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case "titlecard":
      case "collection":
      case "title_card":
        return "Episode";
      default:
        return type;
    }
  };

  const getMediaTypeLabel = (asset) => {
    const type = asset.type?.toLowerCase() || "";

    switch (type) {
      case "movie":
      case "collection":
        return "collection";
      case "poster":
        return "Movie";
      case "show":
        return "Show";
      case "season":
        return "Season";
      case "episode":
      case "titlecard":
      case "title_card":
        return "Episode";
      case "background":
        return "Background";
      default:
        return "Asset";
    }
  };

  const isLandscapeAsset = (type) => {
    const typeStr = type?.toLowerCase() || "";
    const landscapeTypes = ["background", "episode", "titlecard", "title_card"];
    const isLandscape =
      landscapeTypes.some((t) => typeStr.includes(t)) ||
      typeStr.includes("background");
    return isLandscape;
  };

  const getLanguageColor = (language) => {
    if (language === "Textless") {
      return "bg-green-500/10 text-green-400 border-green-500/20";
    }
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  };

  const filteredAssets = filterAssetsByTab(assets);
  const displayedAssets = filteredAssets.slice(
    pageOffset,
    pageOffset + assetCount
  );

  const totalPages = Math.ceil(filteredAssets.length / assetCount);
  const currentPage = Math.floor(pageOffset / assetCount) + 1;
  const hasPrevPage = pageOffset > 0;
  const hasNextPage = pageOffset + assetCount < filteredAssets.length;

  const allTabs = [
    { id: "All", label: "All" },
    { id: "Posters", label: "Posters" },
    { id: "Collections", label: "Collections" },
    { id: "Backgrounds", label: "Backgrounds" },
    { id: "Seasons", label: "Seasons" },
    { id: "TitleCards", label: "TitleCards" },
  ];

  const tabs = allTabs.filter((tab) => {
    if (tab.id === "All") {
      return assets.length > 0;
    }
    const tabAssets = assets.filter((asset) => {
      const type = asset.type?.toLowerCase() || "";
      switch (tab.id) {
        case "Posters":
          return type === "movie" || type === "poster" || type === "show";
        case "Collections":
          return type === "collection";
        case "Backgrounds":
          return type.includes("background");
        case "Seasons":
          return type === "season";
        case "TitleCards":
          return (
            type === "episode" || type === "titlecard" || type === "title_card"
          );
        default:
          return false;
      }
    });
    return tabAssets.length > 0;
  });

  if (!loading && assets.length === 0) {
    return null;
  }

  return (
    <div className="bg-theme-card rounded-3xl p-6 border border-theme hover:border-theme-primary/30 transition-all shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold text-theme-text flex items-center gap-3">
          <div className="p-2 rounded-xl bg-theme-primary/10">
            <FileImage className="w-5 h-5 text-theme-primary" />
          </div>
          {t("dashboard.recentAssets")}
        </h2>

        <div className="flex items-center gap-3">
          <CompactImageSizeSlider
            value={assetCount}
            onChange={handleAssetCountChange}
            storageKey="recent-assets-count"
            min={5}
            max={10}
          />

          <button
            onClick={() => fetchRecentAssets()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-theme-hover border border-theme rounded-lg text-xs font-medium transition-all hover:bg-theme-hover/80"
            title={t("recentAssets.refreshTooltip")}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-theme-primary ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span>{t("common.refresh")}</span>
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
        {tabs.map((tab) => {
          const tabFilteredCount = filterAssetsByTab(assets).length;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs transition-all whitespace-nowrap
                ${
                  isActive
                    ? "bg-theme-primary text-white shadow-md shadow-theme-primary/20"
                    : "bg-theme-hover/50 text-theme-muted hover:text-theme-text hover:bg-theme-hover border border-theme/50"
                }
              `}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                  {tab.id === "All"
                    ? assets.length
                    : filterAssetsByTab(assets).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && assets.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
        </div>
      ) : error && assets.length === 0 ? (
        <div className="text-center py-8 text-red-400 bg-red-500/5 rounded-xl border border-red-500/10">
          <p className="text-sm font-medium">Error: {error}</p>
          <button
            onClick={() => fetchRecentAssets()}
            className="mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      ) : displayedAssets.length === 0 ? (
        <div className="text-center py-12 text-theme-muted bg-theme-hover/30 rounded-2xl border border-theme border-dashed">
          <FileImage className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("recentAssets.noAssets")}</p>
        </div>
      ) : (
        <>
          {/* Asset Grid */}
          <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-theme-border scrollbar-track-transparent">
            <div
              className="poster-grid"
              style={{
                "--poster-count": assetCount,
              }}
            >
              {displayedAssets.map((asset, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAsset(asset)}
                  // REMOVED "h-full" from className to allow bottom alignment to work naturally
                  className="bg-theme-card rounded-xl overflow-hidden border border-theme hover:border-theme-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                >
                  {/* Poster/Background Image */}
                  <div
                    className={`relative bg-black/40 flex-shrink-0 overflow-hidden ${
                      isLandscapeAsset(asset.type)
                        ? "aspect-[16/9]"
                        : "aspect-[2/3]"
                    }`}
                  >
                    {asset.has_poster ? (
                      <img
                        src={asset.poster_url}
                        alt={asset.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-theme-hover">
                              <svg class="w-8 h-8 text-theme-muted opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-8 h-8 text-theme-muted opacity-30" />
                      </div>
                    )}

                    {/* Hover Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {asset.provider_link && (
                      <a
                        href={asset.provider_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-md hover:bg-theme-primary text-white transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        title="View on provider"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between bg-theme-hover/10">
                    <h3
                      className="font-medium text-theme-text text-xs truncate mb-2 group-hover:text-theme-primary transition-colors"
                      title={asset.title}
                    >
                      {asset.title}
                    </h3>

                    <div className="flex flex-wrap gap-1 mt-auto">
                      {asset.type && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getTypeColor(
                            asset.type
                          )}`}
                        >
                          {getTypeLabel(asset.type)}
                        </span>
                      )}

                      {asset.library && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          {asset.library}
                        </span>
                      )}

                      {asset.is_manually_created && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Manual
                        </span>
                      )}

                      {!asset.is_manually_created &&
                        asset.language &&
                        asset.language !== "N/A" && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getLanguageColor(
                              asset.language
                            )}`}
                          >
                            {asset.language}
                          </span>
                        )}

                      {asset.fallback && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          FB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modern Footer */}
          <div className="mt-2 pt-4 border-t border-theme/50 flex items-center justify-between">
            <div className="text-xs text-theme-muted font-medium">
              Showing <span className="text-theme-text">{pageOffset + 1}-{Math.min(pageOffset + assetCount, filteredAssets.length)}</span> of{" "}
              <span className="text-theme-text">{filteredAssets.length}</span>{" "}
              {activeTab !== "All" && `${activeTab.toLowerCase()} `}
              {filteredAssets.length === 1 ? "asset" : "assets"}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange("prev")}
                  disabled={!hasPrevPage}
                  className="p-1.5 rounded-lg hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4 text-theme-text" />
                </button>

                <span className="text-xs text-theme-muted font-medium px-2">
                  Page <span className="text-theme-text">{currentPage}</span> / {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange("next")}
                  disabled={!hasNextPage}
                  className="p-1.5 rounded-lg hover:bg-theme-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4 text-theme-text" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Asset Details Modal */}
      {selectedAsset && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] bg-theme-card rounded-2xl overflow-hidden shadow-2xl border border-theme"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Image Side */}
              <div className="flex-1 flex items-center justify-center bg-[#050505] p-6 relative">
                {selectedAsset.has_poster ? (
                  <img
                    src={selectedAsset.poster_url}
                    alt={selectedAsset.title}
                    className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="text-center flex-col items-center justify-center"
                  style={{
                    display: selectedAsset.has_poster ? "none" : "flex",
                  }}
                >
                  <div className="p-6 rounded-full bg-theme-hover mb-4">
                    <ImageOff className="w-12 h-12 text-theme-muted" />
                  </div>
                  <p className="text-theme-text text-lg font-bold mb-1">
                    Preview Unavailable
                  </p>
                  <p className="text-theme-muted text-sm">
                    Image source could not be loaded
                  </p>
                </div>
              </div>

              {/* Info Side */}
              <div className="md:w-[400px] bg-theme-card border-l border-theme flex flex-col h-full">
                <div className="p-6 border-b border-theme bg-theme-hover/10">
                    <h3 className="text-xl font-bold text-theme-text leading-tight">
                    Asset Details
                    </h3>
                    <p className="text-xs text-theme-muted mt-1 uppercase tracking-wider font-semibold">Metadata & Properties</p>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  <div>
                    <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-2">
                      {t("common.mediaType")}
                    </label>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold uppercase ${getTypeColor(
                        selectedAsset.type
                      )}`}
                    >
                      {getTypeLabel(selectedAsset.type)}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">
                      {getMediaTypeLabel(selectedAsset) === "Episode"
                        ? "Episode Title"
                        : "Title"}
                    </label>
                    <p className="text-theme-text text-sm font-medium break-words leading-relaxed">
                      {selectedAsset.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {t("common.created")}
                        </label>
                        <p className="text-theme-text text-sm">
                          {selectedAsset.created
                            ? new Date(selectedAsset.created * 1000).toLocaleString("sv-SE").replace("T", " ")
                            : "Unknown"}
                        </p>
                      </div>

                      {selectedAsset.modified && (
                        <div>
                          <label className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {t("common.modified")}
                          </label>
                          <p className="text-theme-text text-sm">
                            {selectedAsset.modified
                              ? new Date(selectedAsset.modified * 1000).toLocaleString("sv-SE").replace("T", " ")
                              : "Unknown"}
                          </p>
                        </div>
                      )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {t("common.lastViewed")}
                    </label>
                    <p className="text-theme-text text-sm font-mono bg-theme-hover/50 px-2 py-1 rounded inline-block">
                      {new Date().toLocaleString("sv-SE").replace("T", " ")}
                    </p>
                  </div>

                  {selectedAsset.library && (
                    <div>
                      <label className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <Folder className="w-3.5 h-3.5" />
                        Library
                      </label>
                      <p className="text-theme-text text-sm">
                        {selectedAsset.library}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-theme-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <HardDrive className="w-3.5 h-3.5" />
                      {t("common.path")}
                    </label>
                    <p className="text-theme-text text-xs break-all font-mono bg-theme-bg p-3 rounded-lg border border-theme leading-relaxed">
                      {selectedAsset.rootfolder}
                    </p>
                  </div>

                  {selectedAsset.language && selectedAsset.language !== "N/A" && (
                      <div>
                        <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-2">
                          Language
                        </label>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-bold ${getLanguageColor(
                            selectedAsset.language
                          )}`}
                        >
                          {selectedAsset.language}
                        </span>
                      </div>
                  )}

                  {(selectedAsset.is_manually_created ||
                    selectedAsset.fallback ||
                    selectedAsset.text_truncated) && (
                    <div>
                      <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-2">
                        Properties
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedAsset.is_manually_created && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Manual
                          </span>
                        )}
                        {selectedAsset.fallback && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Fallback
                          </span>
                        )}
                        {selectedAsset.text_truncated && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Truncated
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedAsset.provider_link && (
                    <div className="p-6 border-t border-theme bg-theme-hover/5 mt-auto">
                      <a
                        href={selectedAsset.provider_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-theme-primary hover:bg-theme-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-theme-primary/20 hover:-translate-y-0.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Provider
                      </a>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid CSS */}
      <style jsx>{`
        .poster-grid {
          display: flex;
          gap: 1rem;
          align-items: flex-end; /* Changed from stretch to flex-end */
        }

        .poster-grid > div {
          display: flex;
          flex-direction: column;
          flex: 0 0 calc((100% - (var(--poster-count) - 1) * 1rem) / var(--poster-count));
          min-width: 0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .poster-grid > div {
            flex: 0 0 calc((100% - 3rem) / 4);
            min-width: 160px;
          }
        }

        @media (max-width: 640px) {
          .poster-grid > div {
            flex: 0 0 calc((100% - 1rem) / 2);
            min-width: 130px;
          }
        }
      `}</style>
    </div>
  );
}

export default RecentAssets;