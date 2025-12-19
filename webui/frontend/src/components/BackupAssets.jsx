import React, { useState, useEffect, useRef } from "react";
import {
  ImageIcon,
  Folder,
  Trash2,
  RefreshCw,
  Loader2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FolderOpen,
  Film,
  Layers,
  Tv,
  LayoutGrid,
  FolderTree,
  Home,
  CheckSquare,
  Square,
  Check,
  Calendar,
  HardDrive,
  Eye,
  X,
  ArrowUpDown,
  Download,
  Archive,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import CompactImageSizeSlider from "./CompactImageSizeSlider";
import { useToast } from "../context/ToastContext";
import ScrollToButtons from "./ScrollToButtons";

const API_URL = "/api";

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ PAGINATION COMPONENT
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > half + 2) pages.push("...");
      let start = Math.max(2, currentPage - half);
      let end = Math.min(totalPages - 1, currentPage + half);
      if (currentPage <= half + 2) end = maxPagesToShow - 1;
      if (currentPage >= totalPages - half - 1) start = totalPages - maxPagesToShow + 2;
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - half - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("pagination.previous")}
      </button>
      {getPageNumbers().map((page, index) =>
        typeof page === "number" ? (
          <button
            key={index}
            onClick={() => handlePageChange(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-all shadow-sm ${
              currentPage === page
                ? "bg-theme-primary text-white"
                : "bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 text-theme-text"
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-theme-muted">...</span>
        )
      )}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {t("pagination.next")}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++ MAIN BACKUP ASSETS COMPONENT
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function BackupAssets() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem("backup-assets-sort-order") || "name_asc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Helper to encode path segments but keep slashes
  const safeEncodePath = (path) => {
    return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
  };

  useEffect(() => localStorage.setItem("backup-assets-sort-order", sortOrder), [sortOrder]);

  // Click outside listener for sorting
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSortedAssets = (assetsToSort) => {
    const sorted = [...assetsToSort];
    sorted.sort((a, b) => {
      if (sortOrder === "name_asc") return a.name.localeCompare(b.name);
      if (sortOrder === "name_desc") return b.name.localeCompare(a.name);
      const dateA = a.modified || 0;
      const dateB = b.modified || 0;
      if (sortOrder === "date_newest") return dateB - dateA;
      if (sortOrder === "date_oldest") return dateA - dateB;
      return 0;
    });
    return sorted;
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem("backup-assets-items-per-page");
    return saved ? parseInt(saved) : 50;
  });

  // View Mode
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("backup-assets-view-mode") || "folder");
  const [activeLibrary, setActiveLibrary] = useState("all");

  // Navigation (Folder View)
  const [currentPath, setCurrentPath] = useState([]); // [libraryName, folderName]

  // Image Grid Size
  const [imageSize, setImageSize] = useState(() => {
    const saved = localStorage.getItem("backup-assets-grid-size");
    return saved ? parseInt(saved) : 5;
  });

  useEffect(() => localStorage.setItem("backup-assets-view-mode", viewMode), [viewMode]);
  useEffect(() => localStorage.setItem("backup-assets-grid-size", imageSize), [imageSize]);

  const getGridClass = (size) => {
    const classes = {
      2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-4 lg:grid-cols-5", 6: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
      7: "grid-cols-2 md:grid-cols-5 lg:grid-cols-7", 8: "grid-cols-2 md:grid-cols-5 lg:grid-cols-8",
      9: "grid-cols-2 md:grid-cols-6 lg:grid-cols-9", 10: "grid-cols-2 md:grid-cols-6 lg:grid-cols-10",
    };
    return classes[size] || classes[5];
  };

  const fetchAssets = async (showToast = false) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/backup-assets-gallery`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setLibraries(data.libraries || []);
      setTotalAssets(data.total_assets || 0);
      if (showToast && data.total_assets > 0) {
        showSuccess(t("backupAssets.loaded", { count: data.total_assets }));
      }
    } catch (error) {
      setError(error.message);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  // Selection Logic
  const toggleAssetSelection = (assetPath) => {
    setSelectedAssets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assetPath)) newSet.delete(assetPath); else newSet.add(assetPath);
      return newSet;
    });
  };

  const clearSelection = () => setSelectedAssets(new Set());

  // Delete Actions
  const deleteAsset = async (assetPath, assetName) => {
    if (!confirm(t("backupAssets.deleteConfirm", { name: assetName }))) return;
    try {
      // FIX: Use safeEncodePath instead of encodeURIComponent
      const response = await fetch(
        `${API_URL}/backup-assets/${safeEncodePath(assetPath)}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete asset");

      showSuccess(t("backupAssets.deleteSuccess", { name: assetName }));

      // Refresh logic
      const isLastItem = displayedGridAssets.length === 1 && currentPage > 1;
      await fetchAssets();
      if (isLastItem) setCurrentPage(p => p - 1);
    } catch (error) {
      showError(error.message);
    }
  };

  const bulkDeleteAssets = async () => {
    if (selectedAssets.size === 0) return;
    if (!confirm(t("backupAssets.bulkDeleteConfirm", { count: selectedAssets.size }))) return;
    try {
      const response = await fetch(`${API_URL}/backup-assets/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: Array.from(selectedAssets) }),
      });
      if (!response.ok) throw new Error("Failed to delete assets");

      showSuccess(t("backupAssets.bulkDeleteSuccess"));
      clearSelection();
      setBulkDeleteMode(false);
      fetchAssets();
      setCurrentPage(1);
    } catch (error) {
      showError(error.message);
    }
  };

  // Helpers
  const formatTimestamp = (ts) => {
    if (!ts) return "Unknown";
    return new Date(ts * 1000).toLocaleString();
  };

  const getAssetTypeIcon = (type) => {
    switch (type) {
      case "poster": return <ImageIcon className="w-4 h-4" />;
      case "background": return <Layers className="w-4 h-4" />;
      case "season": return <Film className="w-4 h-4" />;
      case "titlecard": return <Tv className="w-4 h-4" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  const getAssetAspectRatio = (type) => {
    if (type === "background" || type === "titlecard") return "aspect-[16/9]";
    return "aspect-[2/3]";
  };

  const matchesSearch = (asset, folder, library) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return asset.name.toLowerCase().includes(query) || folder.name.toLowerCase().includes(query);
  };

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [searchQuery, viewMode, activeLibrary, currentPath, itemsPerPage]);

  // Data Aggregation
  const getAllAssets = () => {
    const allAssets = [];
    libraries.forEach((library) => {
      library.folders.forEach((folder) => {
        folder.assets.forEach((asset) => {
          if (matchesSearch(asset, folder, library)) {
            if (activeLibrary === "all" || library.name === activeLibrary) {
              allAssets.push({ ...asset, libraryName: library.name, folderName: folder.name });
            }
          }
        });
      });
    });
    return getSortedAssets(allAssets);
  };

  // Navigation Logic
  const navigateHome = () => { setCurrentPath([]); setSearchQuery(""); };
  const navigateToLibrary = (lib) => { setCurrentPath([lib]); setSearchQuery(""); };
  const navigateToFolder = (lib, folder) => { setCurrentPath([lib, folder]); setSearchQuery(""); };

  const getCurrentViewData = () => {
    if (currentPath.length === 0) {
      // List Libraries
      return { type: "libraries", items: libraries.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())) };
    } else if (currentPath.length === 1) {
      // List Folders in Library
      const lib = libraries.find(l => l.name === currentPath[0]);
      return lib ? { type: "folders", items: lib.folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())) } : { type: "folders", items: [] };
    } else if (currentPath.length === 2) {
      // List Assets in Folder
      const lib = libraries.find(l => l.name === currentPath[0]);
      if (!lib) return { type: "assets", items: [] };
      const folder = lib.folders.find(f => f.name === currentPath[1]);
      return folder ? { type: "assets", items: getSortedAssets(folder.assets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))) } : { type: "assets", items: [] };
    }
    return { type: "libraries", items: [] };
  };

  const allGridAssets = viewMode === "grid" ? getAllAssets() : [];
  const displayedGridAssets = allGridAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Grid View Pagination Logic for FOLDER view ---
  // When in folder view, if we are at level 2 (assets), we might need pagination
  const toggleSelectAllGrid = () => {
    const viewData = getCurrentViewData();
    if (viewData.type === "assets") {
       const displayedAssets = viewData.items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
       if (selectedAssets.size === displayedAssets.length) {
         clearSelection();
       } else {
         setSelectedAssets(new Set(displayedAssets.map(a => a.path)));
       }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-10 h-10 text-theme-primary" /></div>;
  if (error) return <div className="text-red-500 p-6 border border-red-500/50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <ScrollToButtons />

      {/* 1. Header & View Mode Toggle */}
      <div className="bg-theme-card border border-theme-border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-theme-text">{t("backupAssets.viewMode")}</h3>
          <p className="text-sm text-theme-muted">{t("backupAssets.viewModeDesc")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode("grid")} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-theme-primary text-white" : "bg-theme-bg hover:bg-theme-hover border border-theme-border"}`}>
            <LayoutGrid className="w-4 h-4" /> {t("backupAssets.grid")}
          </button>
          <button onClick={() => setViewMode("folder")} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === "folder" ? "bg-theme-primary text-white" : "bg-theme-bg hover:bg-theme-hover border border-theme-border"}`}>
            <FolderTree className="w-4 h-4" /> {t("backupAssets.folder")}
          </button>
        </div>
      </div>

      {/* 2. GRID VIEW CONTENT */}
      {viewMode === "grid" && (
        <div className="bg-theme-card rounded-lg border border-theme-border p-4">

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <Archive className="w-5 h-5 text-theme-primary" />
                {t("backupAssets.filesTitle")}
            </h2>

            <div className="flex flex-wrap gap-2 items-center">
              <CompactImageSizeSlider value={imageSize} onChange={setImageSize} />

              <button
                onClick={() => { setBulkDeleteMode(!bulkDeleteMode); if(bulkDeleteMode) clearSelection(); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${bulkDeleteMode ? "bg-orange-600 text-white" : "bg-theme-primary text-white"}`}
              >
                {bulkDeleteMode ? t("backupAssets.cancel") : t("backupAssets.select")}
              </button>

              {/* Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="flex items-center gap-2 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg">
                  <ArrowUpDown className="w-4 h-4" /> {t("backupAssets.sort")}
                </button>
                {sortDropdownOpen && (
                  <div className="absolute z-50 right-0 top-full mt-2 w-48 bg-theme-card border border-theme-primary/50 rounded-lg shadow-xl overflow-hidden">
                    {["name_asc", "name_desc", "date_newest", "date_oldest"].map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSortOrder(opt); setSortDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm ${sortOrder === opt ? "bg-theme-primary/20 text-theme-primary" : "text-theme-text hover:bg-theme-hover"}`}
                      >
                        {t(`common.sorting.${opt.replace('_', '')}`) || opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => fetchAssets(true)} className="flex items-center gap-2 px-4 py-2 bg-theme-bg border border-theme-border rounded-lg"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Library Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setActiveLibrary("all")} className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeLibrary === "all" ? "bg-theme-primary text-white border-theme-primary" : "bg-theme-bg border-theme-border"}`}>
                {t("backupAssets.allLibraries")}
            </button>
            {libraries.map(lib => (
              <button key={lib.name} onClick={() => setActiveLibrary(lib.name)} className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeLibrary === lib.name ? "bg-theme-primary text-white border-theme-primary" : "bg-theme-bg border-theme-border"}`}>
                {lib.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
                type="text"
                placeholder={t("backupAssets.searchPlaceholder")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-theme-bg border border-theme-primary/50 rounded-lg focus:ring-2 focus:ring-theme-primary"
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-4 top-3"><X className="w-5 h-5" /></button>}
          </div>

          {/* Bulk Delete Bar */}
          {bulkDeleteMode && (
            <div className="flex gap-2 py-2 border-t border-theme-border mb-4 items-center animate-in fade-in slide-in-from-top-2">
              <button onClick={() => setSelectedAssets(new Set(displayedGridAssets.map(a => a.path)))} className="px-4 py-2 bg-theme-hover rounded-lg text-sm">{t("backupAssets.selectPage")}</button>
              <button onClick={clearSelection} className="px-4 py-2 bg-theme-hover rounded-lg text-sm">{t("backupAssets.clear")} ({selectedAssets.size})</button>
              {selectedAssets.size > 0 && (
                <button onClick={bulkDeleteAssets} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> {t("backupAssets.delete")} ({selectedAssets.size})
                </button>
              )}
            </div>
          )}

          {/* The Grid */}
          {displayedGridAssets.length === 0 ? (
            <div className="text-center py-12 text-theme-muted">{t("backupAssets.noBackups")}</div>
          ) : (
            <div className={`grid ${getGridClass(imageSize)} gap-4`}>
                {displayedGridAssets.map(asset => (
                <div key={asset.path} className={`relative group bg-theme-bg border rounded-lg overflow-hidden ${bulkDeleteMode && selectedAssets.has(asset.path) ? "ring-2 ring-theme-primary border-theme-primary" : "border-theme-border"}`}>
                    {bulkDeleteMode && (
                    <div className="absolute top-2 left-2 z-10">
                        <input
                            type="checkbox"
                            checked={selectedAssets.has(asset.path)}
                            onChange={() => toggleAssetSelection(asset.path)}
                            className="w-5 h-5 cursor-pointer accent-theme-primary"
                        />
                    </div>
                    )}

                    <div className={`${getAssetAspectRatio(asset.type)} relative cursor-pointer bg-black/20`} onClick={() => bulkDeleteMode ? toggleAssetSelection(asset.path) : setSelectedImage(asset)}>
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="p-2 text-xs">
                        <div className="flex justify-between mb-1">
                            <span className="bg-theme-primary/20 text-theme-primary px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] uppercase font-bold">
                                {getAssetTypeIcon(asset.type)} {asset.type}
                            </span>
                        </div>
                        <p className="truncate font-medium text-theme-text" title={asset.name}>{asset.name}</p>
                        <p className="text-theme-muted truncate text-[10px]">{asset.libraryName}/{asset.folderName}</p>

                        {!bulkDeleteMode && (
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedImage(asset)} className="flex-1 bg-theme-hover py-1 rounded hover:text-theme-primary">{t("backupAssets.view")}</button>
                            <button onClick={() => deleteAsset(asset.path, asset.name)} className="flex-1 bg-red-500/10 text-red-500 py-1 rounded hover:bg-red-500 hover:text-white transition-colors">{t("backupAssets.delete")}</button>
                            </div>
                        )}
                    </div>
                </div>
                ))}
            </div>
          )}

          {allGridAssets.length > itemsPerPage && (
             <PaginationControls currentPage={currentPage} totalPages={Math.ceil(allGridAssets.length / itemsPerPage)} onPageChange={setCurrentPage} />
          )}
        </div>
      )}

      {/* 3. FOLDER VIEW CONTENT */}
      {viewMode === "folder" && (
        <div className="bg-theme-card border border-theme-border rounded-lg p-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button onClick={navigateHome} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${currentPath.length === 0 ? "bg-theme-primary text-white" : "bg-theme-hover text-theme-text"}`}>
                <Home className="w-4 h-4" /> {t("backupAssets.title")}
            </button>
            {currentPath.map((part, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-4 h-4 text-theme-muted flex-shrink-0" />
                <button onClick={() => i === 0 ? navigateToLibrary(part) : null} className={`px-3 py-2 bg-theme-hover rounded-lg whitespace-nowrap ${i === currentPath.length -1 ? "font-semibold text-theme-primary" : ""}`}>
                    {part}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search & Controls Bar */}
          <div className="flex flex-wrap items-center gap-4 mb-4 border-b border-theme-border pb-4">
             {/* Search */}
             <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="text"
                    placeholder={t("backupAssets.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-theme-bg border border-theme-primary/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary text-sm text-theme-text"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-muted hover:text-theme-text">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
             </div>

             {/* Slider (only at asset level) */}
             {currentPath.length === 2 && (
                <CompactImageSizeSlider value={imageSize} onChange={setImageSize} />
             )}

             {/* Bulk Selection (only at asset level) */}
             {currentPath.length === 2 && (
                <>
                  <button onClick={() => setBulkDeleteMode(!bulkDeleteMode)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${bulkDeleteMode ? "bg-orange-600 text-white" : "bg-theme-primary text-white"}`}>
                     {bulkDeleteMode ? <Square className="w-4 h-4"/> : <CheckSquare className="w-4 h-4"/>}
                     {bulkDeleteMode ? t("backupAssets.cancelSelection") : t("backupAssets.selectMultiple")}
                  </button>
                  {bulkDeleteMode && selectedAssets.size > 0 && (
                      <button onClick={bulkDeleteAssets} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2">
                          <Trash2 className="w-4 h-4"/> {t("backupAssets.deleteSelected")} ({selectedAssets.size})
                      </button>
                  )}
                </>
             )}

             {/* Sorting (All levels) */}
             <div className="relative" ref={sortDropdownRef}>
                <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="flex items-center gap-1.5 px-3 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-theme-text text-sm font-medium">
                  <ArrowUpDown className="w-4 h-4 text-theme-primary" />
                  <span className="hidden sm:inline">{sortOrder.includes("date") ? t("common.date") : t("common.name")}</span>
                </button>
                {sortDropdownOpen && (
                  <div className="absolute z-50 right-0 top-full mt-2 w-48 bg-theme-card border border-theme-primary/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="py-1">
                      {["name_asc", "name_desc", "date_newest", "date_oldest"].map(opt => (
                        <button key={opt} onClick={() => { setSortOrder(opt); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm ${sortOrder === opt ? "bg-theme-primary/20 text-theme-primary" : "text-theme-text hover:bg-theme-hover"}`}>
                          {t(`common.sorting.${opt.replace('_', '')}`) || opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             {/* Refresh */}
             <button onClick={() => fetchAssets(true)} className="flex items-center gap-2 px-3 py-2 bg-theme-card hover:bg-theme-hover border border-theme-border hover:border-theme-primary/50 rounded-lg text-theme-text font-medium transition-all text-sm">
                <RefreshCw className="w-4 h-4 text-theme-primary" />
                <span className="hidden sm:inline">Refresh</span>
             </button>
          </div>

          {/* Bulk Selection Actions Row (when active) */}
          {bulkDeleteMode && currentPath.length === 2 && (
             <div className="flex items-center gap-2 mb-4">
                 <button onClick={toggleSelectAllGrid} className="flex items-center gap-2 px-4 py-2 bg-theme-hover hover:bg-theme-primary/70 border border-theme-border rounded-lg transition-all font-medium text-sm">
                     <CheckSquare className="w-4 h-4" />
                     Select Page
                 </button>
                 <button onClick={clearSelection} disabled={selectedAssets.size === 0} className="flex items-center gap-2 px-4 py-2 bg-theme-hover hover:bg-theme-primary/70 border border-theme-border rounded-lg transition-all font-medium text-sm disabled:opacity-50">
                     <Square className="w-4 h-4" />
                     Clear ({selectedAssets.size})
                 </button>
             </div>
          )}

          {(() => {
            const viewData = getCurrentViewData();

            if (viewData.type === "libraries") {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {viewData.items.map(lib => (
                    <button key={lib.name} onClick={() => navigateToLibrary(lib.name)} className="group relative bg-theme-card border border-theme-border rounded-lg p-4 transition-all text-left shadow-sm hover:shadow-md hover:border-theme-primary">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-theme-hover rounded-full group-hover:bg-theme-primary transition-colors"><Archive className="w-6 h-6 text-theme-muted group-hover:text-white" /></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-theme-text truncate mb-1 text-lg">{lib.name}</h3>
                          <div className="text-xs text-theme-muted space-y-1">
                            <div>Total: {lib.folders.reduce((sum, f) => sum + f.asset_count, 0)} assets</div>
                            <div>Posters: {lib.folders.reduce((sum, f) => sum + f.assets.filter(a => a.type === 'poster').length, 0)}</div>
                            <div>Backgrounds: {lib.folders.reduce((sum, f) => sum + f.assets.filter(a => a.type === 'background').length, 0)}</div>
                            <div>Seasons: {lib.folders.reduce((sum, f) => sum + f.assets.filter(a => a.type === 'season').length, 0)}</div>
                            <div>Episodes: {lib.folders.reduce((sum, f) => sum + f.assets.filter(a => a.type === 'titlecard').length, 0)}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {viewData.items.length === 0 && <div className="col-span-full text-center text-theme-muted py-8">{t("backupAssets.noBackups")}</div>}
                </div>
              );
            } else if (viewData.type === "folders") {
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {viewData.items.map(folder => (
                    <button key={folder.name} onClick={() => navigateToFolder(currentPath[0], folder.name)} className="group relative bg-theme-card border border-theme-border rounded-lg p-4 transition-all text-left shadow-sm hover:shadow-md hover:border-theme-primary">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-theme-hover rounded-full group-hover:bg-theme-primary transition-colors"><Folder className="w-6 h-6 text-theme-muted group-hover:text-white" /></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-theme-text truncate mb-1">{folder.name}</h3>
                          <p className="text-xs text-theme-muted">{folder.asset_count} assets</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {viewData.items.length === 0 && <div className="col-span-full text-center text-theme-muted py-8">{t("backupAssets.noBackups")}</div>}
                </div>
              );
            } else {
              // Assets in folder view
              const pagedAssets = viewData.items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
              return (
                <div>
                  <div className={`grid ${getGridClass(imageSize)} gap-4`}>
                    {pagedAssets.map(asset => (
                      <div key={asset.path} className={`relative group bg-theme-bg border rounded-lg overflow-hidden ${bulkDeleteMode && selectedAssets.has(asset.path) ? "ring-2 ring-theme-primary" : "border-theme-border hover:border-theme-primary/50"}`}>
                         {bulkDeleteMode && <div className="absolute top-2 left-2 z-10"><input type="checkbox" checked={selectedAssets.has(asset.path)} onChange={() => toggleAssetSelection(asset.path)} className="w-5 h-5 accent-theme-primary cursor-pointer" /></div>}

                         <div className={`${getAssetAspectRatio(asset.type)} relative cursor-pointer`} onClick={() => bulkDeleteMode ? toggleAssetSelection(asset.path) : setSelectedImage(asset)}>
                           <img src={asset.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" alt={asset.name} />
                           {!bulkDeleteMode && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye className="text-white"/></div>}
                         </div>

                         <div className="p-2 text-xs">
                           <p className="truncate font-medium">{asset.name}</p>
                           {!bulkDeleteMode && (
                                <button onClick={() => deleteAsset(asset.path, asset.name)} className="mt-2 w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-1 rounded transition-colors flex items-center justify-center gap-1">
                                    <Trash2 className="w-3 h-3"/> {t("backupAssets.delete")}
                                </button>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                  {pagedAssets.length === 0 && <div className="text-center py-8 text-theme-muted">{t("backupAssets.noBackups")}</div>}
                  <PaginationControls currentPage={currentPage} totalPages={Math.ceil(viewData.items.length / itemsPerPage)} onPageChange={setCurrentPage} />
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* 4. IMAGE PREVIEW MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-7xl w-full max-h-[90vh] bg-theme-card rounded-lg flex flex-col md:flex-row overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

            {/* Image Area */}
            <div className="flex-1 bg-black/50 flex items-center justify-center p-4 min-h-[50vh]">
              <img src={selectedImage.url} alt={selectedImage.name} className="max-h-full max-w-full object-contain shadow-lg" />
            </div>

            {/* Sidebar */}
            <div className="w-full md:w-80 bg-theme-card p-6 border-l border-theme-border overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold">{t("backupAssets.details")}</h3>
                <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-theme-hover rounded-full transition-colors"><X className="w-6 h-6"/></button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-theme-bg p-3 rounded-lg border border-theme-border">
                    <label className="text-theme-muted text-xs uppercase font-bold block mb-1">{t("backupAssets.nameLabel")}</label>
                    <p className="break-all font-medium">{selectedImage.name}</p>
                </div>

                <div>
                    <label className="text-theme-muted text-xs uppercase font-bold block mb-1">{t("backupAssets.pathLabel")}</label>
                    <p className="break-all font-mono text-xs bg-theme-bg p-2 rounded border border-theme-border text-theme-muted">{selectedImage.path}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-theme-bg p-2 rounded border border-theme-border">
                        <label className="text-theme-muted text-xs block">{t("backupAssets.sizeLabel")}</label>
                        <p className="font-mono">{(selectedImage.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className="bg-theme-bg p-2 rounded border border-theme-border">
                        <label className="text-theme-muted text-xs block">{t("backupAssets.modifiedLabel")}</label>
                        <p className="font-mono text-xs">{formatTimestamp(selectedImage.modified).split(',')[0]}</p>
                    </div>
                </div>

                <div className="pt-6 flex gap-3 flex-col mt-auto">
                  <a href={selectedImage.url} download className="flex items-center justify-center gap-2 btn bg-theme-primary text-white py-2.5 rounded-lg hover:bg-theme-primary/90 transition-colors">
                    <Download className="w-4 h-4" /> {t("backupAssets.download")}
                  </a>
                  <button onClick={() => { if(confirm(t("backupAssets.deleteConfirm", { name: selectedImage.name }))) { deleteAsset(selectedImage.path, selectedImage.name); setSelectedImage(null); }}} className="flex items-center justify-center gap-2 btn bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 py-2.5 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" /> {t("backupAssets.delete")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BackupAssets;