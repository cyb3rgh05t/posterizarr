import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Save,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Settings,
  Database,
  Palette,
  Type,
  Bell,
  Check,
  X,
  List,
  Lock,
  Hash,
  Loader2,
  Search,
  HelpCircle,
  Upload,
  Image,
  Eye,
  ExternalLink,
  Github,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ValidateButton from "./ValidateButton";
import Notification from "./Notification";
import LanguageOrderSelector from "./LanguageOrderSelector";
import LibraryExclusionSelector from "./LibraryExclusionSelector";
import { useToast } from "../context/ToastContext";
import README_LINKS from "../config/readmeLinks";
import getConfigTooltips from "../config/configTooltips";

const API_URL = "/api";

// Helper function to remove redundant prefixes from setting keys for display
const getCleanSettingKey = (key) => {
  // FIX: Exclude the main feature toggles from prefix removal
  const keysToExclude = [
    "Posters",
    "SeasonPosters",
    "BackgroundPosters",
    "TitleCards",
  ];

  if (keysToExclude.includes(key)) {
    return key;
  }

  const prefixes = [
    "CollectionTitle",
    "CollectionPoster",
    "SeasonPoster",
    "TitleCardTitle",
    "TitleCardEP",
    "TitleCard",
    "ShowTitle",
    "Background",
    "Poster",
  ];

  for (const prefix of prefixes) {
    if (key.startsWith(prefix)) {
      const remainder = key.slice(prefix.length);
      // Only remove prefix if there's something left after it
      // The original logic is fine for fields *within* groups (e.g., PosterAddBorder -> AddBorder)
      if (remainder) {
        return remainder;
      }
    }
  }

  return key;
};

function ConfigEditor() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { showSuccess, showError, showInfo } = useToast();
  const CONFIG_TOOLTIPS = getConfigTooltips(i18n.language);
  const [config, setConfig] = useState(null);
  const [uiGroups, setUiGroups] = useState(null);
  const [displayNames, setDisplayNames] = useState({});
  const [usingFlatStructure, setUsingFlatStructure] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); // Error state for display
  const [searchQuery, setSearchQuery] = useState("");
  const [overlayFiles, setOverlayFiles] = useState([]);
  const [uploadingOverlay, setUploadingOverlay] = useState(false);
  const [previewOverlay, setPreviewOverlay] = useState(null); // For preview modal
  const [fontFiles, setFontFiles] = useState([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [previewFont, setPreviewFont] = useState(null); // For font preview modal
  const initialAuthStatus = useRef(null); // Track initial auth status when config is loaded

  // Sub-tabs state - track active group per main tab
  const [activeSubTabs, setActiveSubTabs] = useState({});

  // Auto-save state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const lastSavedConfigRef = useRef(null);

  // UI-only state for Sync toggles (not saved to config)
  const [useJellySync, setUseJellySync] = useState(false);
  const [useEmbySync, setUseEmbySync] = useState(false);

  // Validation state for min/max pairs
  const [validationErrors, setValidationErrors] = useState({});

  // Define min/max field pairs that need validation
  const MIN_MAX_PAIRS = [
    { min: "PosterMinPointSize", max: "PosterMaxPointSize" },
    { min: "SeasonPosterMinPointSize", max: "SeasonPosterMaxPointSize" },
    { min: "BackgroundMinPointSize", max: "BackgroundMaxPointSize" },
    { min: "TitleCardTitleMinPointSize", max: "TitleCardTitleMaxPointSize" },
    { min: "TitleCardEPMinPointSize", max: "TitleCardEPMaxPointSize" },
    { min: "ShowTitleMinPointSize", max: "ShowTitleMaxPointSize" },
    { min: "CollectionTitleMinPointSize", max: "CollectionTitleMaxPointSize" },
    {
      min: "CollectionPosterMinPointSize",
      max: "CollectionPosterMaxPointSize",
    },
  ];

  // Define parent-child dimension constraints
  // Text max width/height cannot exceed parent poster/background min width/height
  const PARENT_CHILD_CONSTRAINTS = [
    // Poster-based constraints (use PosterMinWidth/PosterMinHeight as parent)
    { parent: "PosterMinWidth", child: "PosterMaxWidth", type: "width" },
    { parent: "PosterMinHeight", child: "PosterMaxHeight", type: "height" },
    { parent: "PosterMinWidth", child: "SeasonPosterMaxWidth", type: "width" },
    {
      parent: "PosterMinHeight",
      child: "SeasonPosterMaxHeight",
      type: "height",
    },
    {
      parent: "PosterMinWidth",
      child: "CollectionPosterMaxWidth",
      type: "width",
    },
    {
      parent: "PosterMinHeight",
      child: "CollectionPosterMaxHeight",
      type: "height",
    },
    {
      parent: "PosterMinWidth",
      child: "CollectionTitleMaxWidth",
      type: "width",
    },
    {
      parent: "PosterMinHeight",
      child: "CollectionTitleMaxHeight",
      type: "height",
    },

    // Background/TitleCard-based constraints (use BgTcMinWidth/BgTcMinHeight as parent)
    { parent: "BgTcMinWidth", child: "BackgroundMaxWidth", type: "width" },
    { parent: "BgTcMinHeight", child: "BackgroundMaxHeight", type: "height" },
    { parent: "BgTcMinWidth", child: "TitleCardTitleMaxWidth", type: "width" },
    {
      parent: "BgTcMinHeight",
      child: "TitleCardTitleMaxHeight",
      type: "height",
    },
    { parent: "BgTcMinWidth", child: "TitleCardEPMaxWidth", type: "width" },
    { parent: "BgTcMinHeight", child: "TitleCardEPMaxHeight", type: "height" },
    { parent: "BgTcMinWidth", child: "ShowTitleMaxWidth", type: "width" },
    { parent: "BgTcMinHeight", child: "ShowTitleMaxHeight", type: "height" },
  ];

  // Dropdown states - using object to handle multiple instances per field type
  const [openDropdowns, setOpenDropdowns] = useState({});
  const dropdownRefs = useRef({});

  // Helper to calculate dropdown position (above or below button)
  const getDropdownPosition = (buttonRef) => {
    if (!buttonRef) return { top: 0, openUpward: false };

    const rect = buttonRef.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 248; // max-h-60 = 15rem = 240px + padding

    // Open upward if not enough space below AND more space above
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    if (openUpward) {
      return {
        bottom: window.innerHeight - rect.top + 8,
        openUpward: true,
      };
    } else {
      return {
        top: rect.bottom + 8,
        openUpward: false,
      };
    }
  };

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const closeDropdown = (key) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: false,
    }));
  };

  const isDropdownOpen = (key) => openDropdowns[key] || false;

  // Legacy single dropdown states for non-repeating fields
  const [favProviderDropdownOpen, setFavProviderDropdownOpen] = useState(false);
  const [tmdbSortingDropdownOpen, setTmdbSortingDropdownOpen] = useState(false);
  const [logLevelDropdownOpen, setLogLevelDropdownOpen] = useState(false);
  const [webuiLogLevelDropdownOpen, setWebuiLogLevelDropdownOpen] =
    useState(false);

  const favProviderDropdownRef = useRef(null);
  const tmdbSortingDropdownRef = useRef(null);
  const logLevelDropdownRef = useRef(null);
  const webuiLogLevelDropdownRef = useRef(null);

  // WebUI Log Level state
  const [webuiLogLevel, setWebuiLogLevel] = useState("INFO");

  // List of overlay file fields
  const OVERLAY_FILE_FIELDS = [
    "overlayfile",
    "seasonoverlayfile",
    "backgroundoverlayfile",
    "titlecardoverlayfile",
    "collectionoverlayfile",
    "poster4k",
    "Poster1080p",
    "Background4k",
    "Background1080p",
    "TC4k",
    "TC1080p",
    "4KDoVi",
    "4KHDR10",
    "4KDoViHDR10",
    "4KDoViBackground",
    "4KHDR10Background",
    "4KDoViHDR10Background",
    "4KDoViTC",
    "4KHDR10TC",
    "4KDoViHDR10TC",
  ];

  // List of font file fields
  const FONT_FILE_FIELDS = [
    "font",
    "RTLFont",
    "backgroundfont",
    "titlecardfont",
    "collectionfont",
  ];

  // Map URL path to tab name
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes("/config/webui")) return "WebUI";
    if (path.includes("/config/general")) return "General";
    if (path.includes("/config/services")) return "Media Servers";
    if (path.includes("/config/api")) return "Service APIs";
    if (path.includes("/config/languages")) return "Languages";
    if (path.includes("/config/visuals")) return "Visuals";
    if (path.includes("/config/overlays")) return "Overlays";
    if (path.includes("/config/collections")) return "Collections";
    if (path.includes("/config/notifications")) return "Notifications";
    return "General"; // Default
  };

  const activeTab = getActiveTabFromPath();

  // Auto-resize textarea function
  const autoResize = (textarea) => {
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  // Tab organization
  const tabs = {
    WebUI: {
      groups: ["WebUI Settings"],
      icon: Lock,
    },
    General: {
      groups: ["General Settings", "PrerequisitePart"],
      icon: Settings,
    },
    "Media Servers": {
      groups: [
        "Plex Settings",
        "Jellyfin Settings",
        "Emby Settings",
        "PlexPart",
        "JellyfinPart",
        "EmbyPart",
      ],
      icon: Database,
    },
    "Service APIs": {
      groups: ["API Keys & Tokens", "ApiPart"],
      icon: Settings,
    },
    Languages: {
      groups: ["Language & Preferences"],
      icon: Type,
    },
    Visuals: {
      groups: [
        "Image Processing",
        "Image Filters",
        "Overlay Files",
        "Resolution Overlays",
        "Fonts",
        "Text Formatting",
        "OverlayPart",
      ],
      icon: Palette,
    },
    Overlays: {
      groups: [
        "Poster Settings",
        "Season Poster Settings",
        "Background Settings",
        "Title Card Overlay",
        "Title Card Title Text",
        "Title Card Episode Text",
        "Show Title on Season",
        "PosterOverlayPart",
        "SeasonPosterOverlayPart",
        "BackgroundOverlayPart",
        "TitleCardOverlayPart",
        "TitleCardTitleTextPart",
        "TitleCardEPTextPart",
        "ShowTitleOnSeasonPosterPart",
      ],
      icon: Palette,
    },
    Collections: {
      groups: [
        "Collection Title",
        "Collection Poster",
        "CollectionTitlePosterPart",
        "CollectionPosterOverlayPart",
      ],
      icon: Type,
    },
    Notifications: {
      groups: ["Notifications", "Notification"],
      icon: Bell,
    },
  };

  useEffect(() => {
    fetchConfig();
    fetchOverlayFiles();
    fetchFontFiles();
    fetchWebuiLogLevel();
  }, []);

  // Add keyboard shortcut for saving (Ctrl+Enter or Cmd+Enter)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Save on Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!saving) {
          saveConfig();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [saving, config]);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Initialize sub-tab when main tab changes
  useEffect(() => {
    if (activeTab && config) {
      const groups = getGroupsByTab(activeTab);
      if (groups.length > 0 && !activeSubTabs[activeTab]) {
        setActiveSubTabs((prev) => ({ ...prev, [activeTab]: groups[0] }));
      }
    }
  }, [activeTab, config]);

  // Close WebUI Log Level dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        webuiLogLevelDropdownOpen &&
        webuiLogLevelDropdownRef.current &&
        !webuiLogLevelDropdownRef.current.contains(event.target)
      ) {
        setWebuiLogLevelDropdownOpen(false);
      }
    };

    if (webuiLogLevelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [webuiLogLevelDropdownOpen]);

  // Close Log Level dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        logLevelDropdownOpen &&
        logLevelDropdownRef.current &&
        !logLevelDropdownRef.current.contains(event.target)
      ) {
        setLogLevelDropdownOpen(false);
      }
    };

    if (logLevelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [logLevelDropdownOpen]);

  // Close FavProvider dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        favProviderDropdownOpen &&
        favProviderDropdownRef.current &&
        !favProviderDropdownRef.current.contains(event.target)
      ) {
        setFavProviderDropdownOpen(false);
      }
    };

    if (favProviderDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [favProviderDropdownOpen]);

  // Close TMDB Sorting dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tmdbSortingDropdownOpen &&
        tmdbSortingDropdownRef.current &&
        !tmdbSortingDropdownRef.current.contains(event.target)
      ) {
        setTmdbSortingDropdownOpen(false);
      }
    };

    if (tmdbSortingDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [tmdbSortingDropdownOpen]);

  // Close generic dropdowns (overlay files, fonts, etc.) when clicking outside OR scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Get all currently open dropdowns
      const openKeys = Object.keys(openDropdowns).filter(
        (key) => openDropdowns[key]
      );

      if (openKeys.length === 0) return;

      // Check if click is outside all dropdown refs
      openKeys.forEach((key) => {
        const ref = dropdownRefs.current[key];
        if (ref && !ref.contains(event.target)) {
          closeDropdown(key);
        }
      });
    };

    const handleScroll = (event) => {
      // Check if scroll is happening inside a dropdown - if so, don't close
      const scrollTarget = event.target;

      // Check if scrolling inside any dropdown content (they all have overflow-y-auto class)
      if (
        scrollTarget.classList &&
        scrollTarget.classList.contains("overflow-y-auto")
      ) {
        return; // Don't close if scrolling inside dropdown
      }

      // Check if scroll target is inside any dropdown ref
      const isInsideDropdown = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(scrollTarget)
      );

      if (isInsideDropdown) {
        return; // Don't close if scrolling inside dropdown
      }

      // Close all dropdowns on page scroll (not dropdown scroll)
      const openKeys = Object.keys(openDropdowns).filter(
        (key) => openDropdowns[key]
      );
      openKeys.forEach((key) => closeDropdown(key));

      // Also close legacy dropdowns
      if (favProviderDropdownOpen) setFavProviderDropdownOpen(false);
      if (tmdbSortingDropdownOpen) setTmdbSortingDropdownOpen(false);
      if (logLevelDropdownOpen) setLogLevelDropdownOpen(false);
      if (webuiLogLevelDropdownOpen) setWebuiLogLevelDropdownOpen(false);
    };

    const hasOpenDropdowns =
      Object.values(openDropdowns).some((isOpen) => isOpen) ||
      favProviderDropdownOpen ||
      tmdbSortingDropdownOpen ||
      logLevelDropdownOpen ||
      webuiLogLevelDropdownOpen;

    if (hasOpenDropdowns) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true); // true = capture phase to catch all scrolls
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [
    openDropdowns,
    favProviderDropdownOpen,
    tmdbSortingDropdownOpen,
    logLevelDropdownOpen,
    webuiLogLevelDropdownOpen,
  ]);

  // Auto-save when config changes (with 5 second debounce)
  useEffect(() => {
    if (!config || !autoSaveEnabled || !lastSavedConfigRef.current) return;

    const currentConfigStr = JSON.stringify(config);
    const hasChanges = currentConfigStr !== lastSavedConfigRef.current;

    if (hasChanges) {
      setHasUnsavedChanges(true);

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save after 5 seconds of inactivity
      autoSaveTimerRef.current = setTimeout(() => {
        console.log("Auto-saving config after 5 seconds of inactivity...");
        saveConfig(true); // true = auto-save
      }, 5000);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [config, autoSaveEnabled]);

  // Click-outside detection for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check dynamic dropdowns (overlay, font, gravity, color)
      Object.keys(dropdownRefs.current).forEach((key) => {
        const ref = dropdownRefs.current[key];
        if (ref && !ref.contains(event.target)) {
          closeDropdown(key);
        }
      });

      // Check static dropdowns
      if (
        favProviderDropdownRef.current &&
        !favProviderDropdownRef.current.contains(event.target)
      ) {
        setFavProviderDropdownOpen(false);
      }
      if (
        tmdbSortingDropdownRef.current &&
        !tmdbSortingDropdownRef.current.contains(event.target)
      ) {
        setTmdbSortingDropdownOpen(false);
      }
      if (
        logLevelDropdownRef.current &&
        !logLevelDropdownRef.current.contains(event.target)
      ) {
        setLogLevelDropdownOpen(false);
      }
      if (
        webuiLogLevelDropdownRef.current &&
        !webuiLogLevelDropdownRef.current.contains(event.target)
      ) {
        setWebuiLogLevelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      const response = await fetch(`${API_URL}/config`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        setUiGroups(data.ui_groups || null);
        setDisplayNames(data.display_names || {});
        setUsingFlatStructure(data.using_flat_structure || false);

        // Store config for change detection
        lastSavedConfigRef.current = JSON.stringify(data.config);
        setHasUnsavedChanges(false);

        // Store initial auth status when config is first loaded
        if (initialAuthStatus.current === null) {
          const authEnabled = data.using_flat_structure
            ? data.config?.basicAuthEnabled
            : data.config?.WebUI?.basicAuthEnabled;
          initialAuthStatus.current = Boolean(authEnabled);
          console.log("Initial auth status saved:", initialAuthStatus.current);
        }

        // Validate min/max pairs on initial load
        validateMinMaxPairs(data.config);

        console.log(
          "Config structure:",
          data.using_flat_structure ? "FLAT" : "GROUPED"
        );
        console.log(
          "Display names loaded:",
          Object.keys(data.display_names || {}).length
        );
      } else {
        const errorMsg = "Failed to load config";
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = `Failed to load configuration: ${err.message}`;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverlayFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/overlayfiles`);
      const data = await response.json();

      if (data.success) {
        // Filter only image files (not fonts)
        const imageFiles = (data.files || []).filter(
          (file) => file.type === "image"
        );
        setOverlayFiles(imageFiles);
        console.log(`Loaded ${imageFiles.length} overlay files`);
      }
    } catch (err) {
      console.error("Failed to load overlay files:", err);
    }
  };

  const handleOverlayFileUpload = async (file) => {
    if (!file) return;

    setUploadingOverlay(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/overlayfiles/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`File "${data.filename}" uploaded successfully!`);
        // Refresh overlay files list
        await fetchOverlayFiles();
      } else {
        showError(data.detail || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showError("Failed to upload file");
    } finally {
      setUploadingOverlay(false);
    }
  };

  const fetchFontFiles = async () => {
    try {
      const response = await fetch(`${API_URL}/fonts`);
      const data = await response.json();

      if (data.success) {
        setFontFiles(data.files || []);
        console.log(`Loaded ${data.files.length} font files`);
      }
    } catch (err) {
      console.error("Failed to load font files:", err);
    }
  };

  // Fetch WebUI backend log level
  const fetchWebuiLogLevel = async () => {
    try {
      const response = await fetch(`${API_URL}/webui-settings`);
      const data = await response.json();

      if (data.success && data.settings.log_level) {
        setWebuiLogLevel(data.settings.log_level);
        console.log(`WebUI Log Level loaded: ${data.settings.log_level}`);
      }
    } catch (err) {
      console.error("Failed to load WebUI log level:", err);
    }
  };

  // Update WebUI backend log level
  const updateWebuiLogLevel = async (level) => {
    try {
      const response = await fetch(`${API_URL}/webui-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            log_level: level,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWebuiLogLevel(level);
        showSuccess(`WebUI Backend Log Level set to ${level}`);
        console.log(`WebUI Log Level updated to: ${level}`);
      } else {
        showError(data.detail || "Failed to update log level");
      }
    } catch (err) {
      console.error("Failed to update WebUI log level:", err);
      showError("Failed to update log level");
    }
  };

  const handleFontFileUpload = async (file) => {
    if (!file) return;

    setUploadingFont(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/fonts/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`Font "${data.filename}" uploaded successfully!`);
        // Refresh font files list
        await fetchFontFiles();
      } else {
        showError(data.detail || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showError("Failed to upload file");
    } finally {
      setUploadingFont(false);
    }
  };

  const saveConfig = async (isAutoSave = false) => {
    // Validate min/max pairs before saving
    const isValid = validateMinMaxPairs(config);

    if (!isValid) {
      const errorCount = Object.keys(validationErrors).length;
      showError(
        `Cannot save: ${errorCount} validation ${
          errorCount === 1 ? "error" : "errors"
        } found. Please fix value conflicts.`
      );
      return;
    }

    setSaving(true);
    setError(null);

    //  Get the ORIGINAL auth status from when config was loaded
    const oldAuthEnabled = initialAuthStatus.current;

    //  Get CURRENT auth status from the config being saved
    const newAuthEnabled = usingFlatStructure
      ? config?.basicAuthEnabled
      : config?.WebUI?.basicAuthEnabled;

    // Check if auth status is changing
    const authChanging = oldAuthEnabled !== Boolean(newAuthEnabled);

    if (!isAutoSave) {
      console.log("Auth status check:", {
        oldAuthEnabled,
        newAuthEnabled: Boolean(newAuthEnabled),
        authChanging,
      });
    }

    try {
      const response = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }), // Send flat config directly
      });

      const data = await response.json();

      if (data.success) {
        // Update saved config reference
        lastSavedConfigRef.current = JSON.stringify(config);
        setHasUnsavedChanges(false);

        // If Auth status is changing, immediately reload without showing messages
        if (authChanging) {
          console.log("Auth status changed - reloading page...");

          // Clear any existing auth credentials from session storage
          sessionStorage.removeItem("auth_credentials");

          // Immediately force a full page reload
          // Use replace to prevent back button issues
          window.location.replace(window.location.href);
          return; // This prevents any further execution
        }

        // Normal save without auth change - update initial auth status
        initialAuthStatus.current = Boolean(newAuthEnabled);

        // Show success message
        if (isAutoSave) {
          console.log(`Auto-saved config (${data.changes_count || 0} changes)`);
          showInfo(
            t("configEditor.autoSaved", { count: data.changes_count || 0 })
          );
        } else {
          showSuccess(
            t("configEditor.savedSuccessfully", {
              count: data.changes_count || 0,
            })
          );
        }
      } else {
        showError("Failed to save configuration");
      }
    } catch (err) {
      if (!isAutoSave) {
        showError(`Error: ${err.message}`);
      } else {
        console.error("Auto-save error:", err.message);
      }
    } finally {
      // Only reset saving state if not reloading
      if (!authChanging) {
        setSaving(false);
      }
    }
  };

  // Validate min/max pairs in the config
  const validateMinMaxPairs = (configToValidate) => {
    const errors = {};

    // Validate standard min/max pairs (e.g., MinPointSize vs MaxPointSize)
    MIN_MAX_PAIRS.forEach(({ min, max }) => {
      let minValue, maxValue;

      // Get values from flat or nested structure
      if (usingFlatStructure) {
        minValue = configToValidate[min];
        maxValue = configToValidate[max];
      } else {
        // Try to find the values in the nested structure
        for (const section of Object.keys(configToValidate || {})) {
          if (configToValidate[section]?.[min] !== undefined) {
            minValue = configToValidate[section][min];
          }
          if (configToValidate[section]?.[max] !== undefined) {
            maxValue = configToValidate[section][max];
          }
        }
      }

      // Convert to numbers for comparison
      const minNum = parseFloat(minValue);
      const maxNum = parseFloat(maxValue);

      // Only validate if both values exist and are valid numbers
      if (!isNaN(minNum) && !isNaN(maxNum)) {
        if (minNum > maxNum) {
          errors[
            min
          ] = `Minimum value (${minNum}) cannot be greater than maximum value (${maxNum})`;
          errors[
            max
          ] = `Maximum value (${maxNum}) cannot be less than minimum value (${minNum})`;
        }
      }
    });

    // Validate parent-child dimension constraints
    // Text max width/height cannot exceed parent poster/background min width/height
    PARENT_CHILD_CONSTRAINTS.forEach(({ parent, child, type }) => {
      let parentValue, childValue;

      // Get values from flat or nested structure
      if (usingFlatStructure) {
        parentValue = configToValidate[parent];
        childValue = configToValidate[child];
      } else {
        // Try to find the values in the nested structure
        for (const section of Object.keys(configToValidate || {})) {
          if (configToValidate[section]?.[parent] !== undefined) {
            parentValue = configToValidate[section][parent];
          }
          if (configToValidate[section]?.[child] !== undefined) {
            childValue = configToValidate[section][child];
          }
        }
      }

      // Convert to numbers for comparison
      const parentNum = parseFloat(parentValue);
      const childNum = parseFloat(childValue);

      // Only validate if both values exist and are valid numbers
      if (!isNaN(parentNum) && !isNaN(childNum)) {
        if (childNum > parentNum) {
          const dimension = type === "width" ? "width" : "height";
          errors[
            child
          ] = `Text ${dimension} (${childNum}) cannot be greater than parent image ${dimension} (${parentNum})`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateValue = (key, value) => {
    let updatedConfig;

    if (usingFlatStructure) {
      updatedConfig = {
        ...config,
        [key]: value,
      };
      setConfig(updatedConfig);
    } else {
      const [section, field] = key.includes(".") ? key.split(".") : [null, key];
      if (section) {
        updatedConfig = {
          ...config,
          [section]: {
            ...config[section],
            [field]: value,
          },
        };
        setConfig(updatedConfig);
      }
    }

    // Check if this field is part of a min/max pair OR parent-child constraint and trigger validation
    const isMinMaxField = MIN_MAX_PAIRS.some(
      ({ min, max }) =>
        key === min ||
        key === max ||
        key.endsWith(`.${min}`) ||
        key.endsWith(`.${max}`)
    );

    const isParentChildField = PARENT_CHILD_CONSTRAINTS.some(
      ({ parent, child }) =>
        key === parent ||
        key === child ||
        key.endsWith(`.${parent}`) ||
        key.endsWith(`.${child}`)
    );

    if ((isMinMaxField || isParentChildField) && updatedConfig) {
      // Use setTimeout to ensure state has updated before validating
      setTimeout(() => validateMinMaxPairs(updatedConfig), 0);
    }
  };

  const getDisplayName = (key) => {
    if (displayNames[key]) {
      return displayNames[key];
    }
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  const getGroupsByTab = (tabName) => {
    if (!config) return [];

    const tabGroups = tabs[tabName]?.groups || [];

    if (usingFlatStructure && uiGroups) {
      return tabGroups.filter((groupName) => {
        const groupKeys = uiGroups[groupName] || [];
        return groupKeys.some((key) => key in config);
      });
    } else {
      return tabGroups.filter((groupName) => config[groupName]);
    }
  };

  const getFieldsForGroup = (groupName) => {
    if (!config) return [];

    if (usingFlatStructure && uiGroups) {
      const groupKeys = uiGroups[groupName] || [];
      return groupKeys.filter((key) => key in config);
    } else {
      return Object.keys(config[groupName] || {});
    }
  };

  const formatGroupName = (groupName) => {
    if (groupName.includes(" ")) {
      return groupName;
    }
    return groupName
      .replace(/Part$/, "")
      .replace(/([A-Z])/g, " $1")
      .trim();
  };

  const getGroupIcon = (groupName) => {
    if (
      groupName.includes("Plex") ||
      groupName.includes("Jellyfin") ||
      groupName.includes("Emby") ||
      groupName.includes("Server") ||
      groupName.includes("Settings")
    )
      return Database;
    if (groupName.includes("Overlay") || groupName.includes("Visual"))
      return Palette;
    if (
      groupName.includes("Text") ||
      groupName.includes("Font") ||
      groupName.includes("Collection")
    )
      return Type;
    if (groupName.includes("Notification")) return Bell;
    return Settings;
  };

  const getInputIcon = (key, value) => {
    const keyLower = key.toLowerCase();

    if (typeof value === "boolean" || value === "true" || value === "false")
      return Check;
    if (Array.isArray(value)) return List;
    if (
      keyLower.includes("password") ||
      keyLower.includes("token") ||
      keyLower.includes("key") ||
      keyLower.includes("secret")
    )
      return Lock;
    if (typeof value === "number") return Hash;
    return Type;
  };

  // Filter functions for search
  const matchesSearch = (text) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const getFilteredFieldsForGroup = (groupName) => {
    const allFields = getFieldsForGroup(groupName);
    if (!searchQuery.trim()) return allFields;

    return allFields.filter((key) => {
      const displayName = getDisplayName(key);
      const value = usingFlatStructure ? config[key] : config[groupName]?.[key];
      const stringValue =
        value === null || value === undefined ? "" : String(value);

      // Search in key name, display name, and value
      return (
        matchesSearch(key) ||
        matchesSearch(displayName) ||
        matchesSearch(stringValue)
      );
    });
  };

  const getFilteredGroupsByTab = (tabName) => {
    const groups = getGroupsByTab(tabName);
    if (!searchQuery.trim()) return groups;

    return groups.filter((groupName) => {
      // Check if group name matches
      if (
        matchesSearch(groupName) ||
        matchesSearch(formatGroupName(groupName))
      ) {
        return true;
      }

      // Check if any field in the group matches
      const fieldsInGroup = getFilteredFieldsForGroup(groupName);
      return fieldsInGroup.length > 0;
    });
  };

  // Tooltip Component
  const Tooltip = ({ text, children }) => {
    if (!text) return children;

    return (
      <div className="group relative inline-flex items-center">
        {children}
        <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 w-80">
          <div className="bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-xl border border-gray-700">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
            {text}
          </div>
        </div>
      </div>
    );
  };

  const getGroupIconForDisplay = (groupName) => {
    const tabIcon = tabs[activeTab]?.icon;
    if (tabIcon) {
      return tabIcon;
    }
    // Fallback auf die alte Logik
    return getGroupIcon(groupName);
  };

  // Get README link for a group
  const getReadmeLink = (groupName) => {
    return README_LINKS[groupName] || null;
  };

  // Helper function to check if a media server field should be disabled
  const isFieldDisabled = (key, groupName) => {
    if (!config) return false;

    const getValue = (fieldKey) => {
      const val = usingFlatStructure
        ? config[fieldKey]
        : config[fieldKey.split(".")[0]]?.[fieldKey.split(".")[1]];
      return val === "true" || val === true;
    };

    // Mapping between UI display group names and their prefixes in flat config
    const groupPrefixMap = {
      "Poster Settings": "Poster",
      "Season Poster Settings": "SeasonPoster",
      "Background Settings": "Background",
      "Title Card Overlay": "TitleCard",
      "Title Card Title Text": "TitleCardTitle",
      "Title Card Episode Text": "TitleCardEP",
      "Show Title on Season": "ShowTitle",
      "Collection Title": "CollectionTitle",
      "Collection Poster": "CollectionPoster",
    };

    const getGroupValue = (group, field) => {
      if (usingFlatStructure) {
        // In flat structure, fields are prefixed with group prefix
        const prefix = groupPrefixMap[group] || "";
        const flatKey = prefix + field;
        const val = config[flatKey];

        // Convert string booleans to actual booleans
        const boolVal = val === "true" || val === true;

        // Debug logging
        console.log(
          `Checking ${group}.${field} -> ${flatKey} = ${val} (converted to: ${boolVal})`
        );

        return boolVal;
      }
      const val = config[group]?.[field];
      const boolVal = val === "true" || val === true;
      console.log(
        `Checking ${group}.${field} (nested) = ${val} (converted to: ${boolVal})`
      );
      return boolVal;
    };

    // Check media server status
    const plexEnabled = getValue("UsePlex");
    const jellyfinEnabled = getValue("UseJellyfin");
    const embyEnabled = getValue("UseEmby");

    // === PLEX FIELDS ===
    // All Plex fields are disabled if Plex is not enabled
    const plexFields = [
      "PlexUrl",
      "PlexToken",
      "PlexLibstoExclude",
      "PlexUploadExistingAssets",
      "PlexUpload",
    ];
    if (plexFields.includes(key) && !plexEnabled) {
      return true;
    }

    // === JELLYFIN FIELDS ===
    // Connection fields (URL, API, Libs) are enabled if Jellyfin OR JellySync is enabled
    const jellyfinConnectionFields = [
      "JellyfinUrl",
      "JellyfinAPIKey",
      "JellyfinLibstoExclude",
    ];
    if (
      jellyfinConnectionFields.includes(key) &&
      !jellyfinEnabled &&
      !useJellySync
    ) {
      return true;
    }

    // Upload/Replace fields ONLY depend on UseJellyfin (NOT on Sync)
    const jellyfinUploadFields = [
      "JellyfinUploadExistingAssets",
      "JellyfinReplaceThumbwithBackdrop",
    ];
    if (jellyfinUploadFields.includes(key) && !jellyfinEnabled) {
      return true;
    }

    // === EMBY FIELDS ===
    // Connection fields (URL, API, Libs) are enabled if Emby OR EmbySync is enabled
    const embyConnectionFields = ["EmbyUrl", "EmbyAPIKey", "EmbyLibstoExclude"];
    if (embyConnectionFields.includes(key) && !embyEnabled && !useEmbySync) {
      return true;
    }

    // Upload/Replace fields ONLY depend on UseEmby (NOT on Sync)
    const embyUploadFields = [
      "EmbyUploadExistingAssets",
      "EmbyReplaceThumbwithBackdrop",
    ];
    if (embyUploadFields.includes(key) && !embyEnabled) {
      return true;
    }

    // === TEXT FORMATTING CONDITIONAL DISABLING ===
    // SymbolsToKeepOnNewLine is only enabled when NewLineOnSpecificSymbols is true
    if (key === "SymbolsToKeepOnNewLine") {
      const newLineOnSpecificSymbols = getValue("NewLineOnSpecificSymbols");
      if (!newLineOnSpecificSymbols) return true;
    }

    // NewLineSymbols is only enabled when NewLineOnSpecificSymbols is true
    if (key === "NewLineSymbols") {
      const newLineOnSpecificSymbols = getValue("NewLineOnSpecificSymbols");
      if (!newLineOnSpecificSymbols) return true;
    }

    // === OVERLAY AND TEXT CONDITIONAL DISABLING ===
    const keyLower = key.toLowerCase();

    console.log(
      `isFieldDisabled called: key="${key}", groupName="${groupName}", keyLower="${keyLower}"`
    );

    // Groups where AddBorder affects bordercolor and borderwidth
    const borderGroups = [
      "Collection Poster",
      "Background Settings",
      "Season Poster Settings",
      "Poster Settings",
      "Title Card Overlay",
    ];

    // Groups where AddText affects text-related fields
    const textGroups = [
      "Collection Poster",
      "Background Settings",
      "Season Poster Settings",
      "Poster Settings",
    ];

    // Groups where AddTextStroke affects stroke fields
    const strokeGroups = [
      "Collection Poster",
      "Background Settings",
      "Season Poster Settings",
      "Poster Settings",
      "Show Title on Season",
      "Title Card Title Text",
      "Title Card Episode Text",
      "Collection Title",
    ];

    // Border-related fields
    if (
      borderGroups.includes(groupName) &&
      (keyLower.includes("bordercolor") || keyLower.includes("borderwidth"))
    ) {
      console.log(`🔶 Border field detected in ${groupName}`);
      const addBorder = getGroupValue(groupName, "AddBorder");
      console.log(`   AddBorder = ${addBorder}, returning ${!addBorder}`);
      if (!addBorder) return true;
    }

    // Text-related fields (when AddText is false)
    const textFieldSuffixes = [
      "addtextstroke",
      "strokecolor",
      "strokewidth",
      "minpointsize",
      "maxpointsize",
      "maxwidth",
      "maxheight",
      "text_offset",
      "textoffset", // Flat structure uses CamelCase without underscore
      "linespacing",
      "textgravity",
      "fontallcaps",
      "fontcolor",
    ];

    if (
      textGroups.includes(groupName) &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`Text field detected: ${keyLower} in ${groupName}`);
      const addText = getGroupValue(groupName, "AddText");
      console.log(`   AddText = ${addText}, returning ${!addText}`);
      if (!addText) return true;
    }

    // Stroke-related fields (when AddTextStroke is false)
    const strokeFieldSuffixes = ["strokecolor", "strokewidth"];

    if (
      strokeGroups.includes(groupName) &&
      strokeFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`Stroke field detected: ${keyLower} in ${groupName}`);
      const addTextStroke = getGroupValue(groupName, "AddTextStroke");
      console.log(
        `   AddTextStroke = ${addTextStroke}, returning ${!addTextStroke}`
      );
      if (!addTextStroke) return true;
    }

    // Show Title on Season - when AddShowTitletoSeason is false
    if (
      groupName === "Show Title on Season" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`📺 Show Title field detected: ${keyLower}`);
      const addShowTitle = getGroupValue(groupName, "AddShowTitletoSeason");
      console.log(
        `   AddShowTitletoSeason = ${addShowTitle}, returning ${!addShowTitle}`
      );
      if (!addShowTitle) return true;
    }

    // Title Card Title Text - when AddEPTitleText is false
    if (
      groupName === "Title Card Title Text" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`🎬 Title Card Title field detected: ${keyLower}`);
      const addEPTitleText = getGroupValue(groupName, "AddEPTitleText");
      console.log(
        `   AddEPTitleText = ${addEPTitleText}, returning ${!addEPTitleText}`
      );
      if (!addEPTitleText) return true;
    }

    // Title Card Episode Text - when AddEPText is false
    if (
      groupName === "Title Card Episode Text" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`🎞️ Title Card Episode field detected: ${keyLower}`);
      const addEPText = getGroupValue(groupName, "AddEPText");
      console.log(`   AddEPText = ${addEPText}, returning ${!addEPText}`);
      if (!addEPText) return true;
    }

    // Collection Title - when AddCollectionTitle is false
    if (
      groupName === "Collection Title" &&
      textFieldSuffixes.some((suffix) => keyLower.endsWith(suffix))
    ) {
      console.log(`Collection Title field detected: ${keyLower}`);
      const addCollectionTitle = getGroupValue(groupName, "AddCollectionTitle");
      console.log(
        `   AddCollectionTitle = ${addCollectionTitle}, returning ${!addCollectionTitle}`
      );
      if (!addCollectionTitle) return true;
    }

    return false;
  };

  const renderInput = (groupName, key, value) => {
    const Icon = getInputIcon(key, value);
    const fieldKey = usingFlatStructure ? key : `${groupName}.${key}`;
    const displayName = getDisplayName(key);

    // ============ OVERLAY FILE DROPDOWN WITH UPLOAD ============
    if (OVERLAY_FILE_FIELDS.includes(key)) {
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      const dropdownKey = `overlay-${fieldKey}`;

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {/* Dropdown */}
            <div
              className="relative flex-1"
              ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
            >
              <button
                onClick={() => toggleDropdown(dropdownKey)}
                className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span
                  className={
                    stringValue ? "text-theme-text" : "text-theme-muted"
                  }
                >
                  {stringValue || "-- Select Overlay File --"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-theme-muted transition-transform ${
                    isDropdownOpen(dropdownKey) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen(dropdownKey) && (
                <div
                  className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                  style={{
                    left: dropdownRefs.current[
                      dropdownKey
                    ]?.getBoundingClientRect().left,
                    width: dropdownRefs.current[dropdownKey]?.offsetWidth,
                    ...(getDropdownPosition(dropdownRefs.current[dropdownKey])
                      .openUpward
                      ? {
                          bottom: getDropdownPosition(
                            dropdownRefs.current[dropdownKey]
                          ).bottom,
                        }
                      : {
                          top: getDropdownPosition(
                            dropdownRefs.current[dropdownKey]
                          ).top,
                        }),
                  }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Overlay File
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        closeDropdown(dropdownKey);
                        updateValue(fieldKey, "");
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        !stringValue
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      -- Select Overlay File --
                    </button>
                    {overlayFiles.map((file) => (
                      <button
                        key={file.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(dropdownKey);
                          updateValue(fieldKey, file.name);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          stringValue === file.name
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <label
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer ${
                uploadingOverlay ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleOverlayFileUpload(file);
                    e.target.value = ""; // Reset input
                  }
                }}
                className="hidden"
                disabled={uploadingOverlay}
              />
              {uploadingOverlay ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload</span>
            </label>

            {/* Preview Button */}
            {stringValue && (
              <button
                onClick={() => setPreviewOverlay(stringValue)}
                className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                title="Preview overlay image"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
          </div>

          {/* Current file display */}
          {stringValue && (
            <p className="text-xs text-theme-muted">
              Current:{" "}
              <span className="font-mono text-theme-primary">
                {stringValue}
              </span>
            </p>
          )}

          {/* Help text */}
          <p className="text-xs text-theme-muted">
            Upload PNG, JPG, or JPEG files to the Overlayfiles directory
          </p>
        </div>
      );
    }

    // ============ FONT FILE DROPDOWN WITH UPLOAD ============
    if (FONT_FILE_FIELDS.includes(key)) {
      const stringValue =
        value === null || value === undefined ? "" : String(value);
      const dropdownKey = `font-${fieldKey}`;

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {/* Dropdown */}
            <div
              className="relative flex-1"
              ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
            >
              <button
                onClick={() => toggleDropdown(dropdownKey)}
                className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
              >
                <span
                  className={
                    stringValue ? "text-theme-text" : "text-theme-muted"
                  }
                >
                  {stringValue || "-- Select Font File --"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-theme-muted transition-transform ${
                    isDropdownOpen(dropdownKey) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen(dropdownKey) && (
                <div
                  className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                  style={{
                    left: dropdownRefs.current[
                      dropdownKey
                    ]?.getBoundingClientRect().left,
                    width: dropdownRefs.current[dropdownKey]?.offsetWidth,
                    ...(getDropdownPosition(dropdownRefs.current[dropdownKey])
                      .openUpward
                      ? {
                          bottom: getDropdownPosition(
                            dropdownRefs.current[dropdownKey]
                          ).bottom,
                        }
                      : {
                          top: getDropdownPosition(
                            dropdownRefs.current[dropdownKey]
                          ).top,
                        }),
                  }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Font File
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        closeDropdown(dropdownKey);
                        updateValue(fieldKey, "");
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        !stringValue
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      -- Select Font File --
                    </button>
                    {fontFiles.map((file) => (
                      <button
                        key={file}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(dropdownKey);
                          updateValue(fieldKey, file);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                          stringValue === file
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        {file}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <label
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer ${
                uploadingFont ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFontFileUpload(file);
                    e.target.value = ""; // Reset input
                  }
                }}
                className="hidden"
                disabled={uploadingFont}
              />
              {uploadingFont ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload</span>
            </label>

            {/* Preview Button */}
            {stringValue && (
              <button
                onClick={() => setPreviewFont(stringValue)}
                className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                title="Preview font"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
          </div>

          {/* Current file display */}
          {stringValue && (
            <p className="text-xs text-theme-muted">
              Current:{" "}
              <span className="font-mono text-theme-primary">
                {stringValue}
              </span>
            </p>
          )}

          {/* Help text */}
          <p className="text-xs text-theme-muted">
            Upload TTF, OTF, WOFF, or WOFF2 font files to the Overlayfiles
            directory
          </p>
        </div>
      );
    }

    // ============ LANGUAGE ORDER SELECTOR ============
    if (
      key === "PreferredLanguageOrder" ||
      key === "PreferredSeasonLanguageOrder" ||
      key === "PreferredBackgroundLanguageOrder" ||
      key === "PreferredTCLanguageOrder"
    ) {
      return (
        <LanguageOrderSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          label={displayName}
          helpText={CONFIG_TOOLTIPS[key]}
        />
      );
    }

    // ============ LIBRARY EXCLUSION SELECTOR ============
    if (key === "PlexLibstoExclude") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <LibraryExclusionSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          helpText={CONFIG_TOOLTIPS[key]}
          mediaServerType="plex"
          config={config}
          disabled={disabled}
          showIncluded={true}
        />
      );
    }

    if (key === "JellyfinLibstoExclude") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <LibraryExclusionSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          helpText={CONFIG_TOOLTIPS[key]}
          mediaServerType="jellyfin"
          config={config}
          disabled={disabled}
          showIncluded={true}
        />
      );
    }

    if (key === "EmbyLibstoExclude") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <LibraryExclusionSelector
          value={Array.isArray(value) ? value : []}
          onChange={(newValue) => updateValue(fieldKey, newValue)}
          helpText={CONFIG_TOOLTIPS[key]}
          mediaServerType="emby"
          config={config}
          disabled={disabled}
          showIncluded={true}
        />
      );
    }

    // Handle arrays with pill-style tags
    if (Array.isArray(value)) {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-3">
          <textarea
            defaultValue={value.join(", ")}
            onBlur={(e) => {
              const arrayValue = e.target.value
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== "");
              updateValue(fieldKey, arrayValue);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            rows={1}
            disabled={disabled}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Enter comma-separated values"
          />
          {value.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-theme-bg rounded-lg border border-theme">
              {value.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-theme-primary/20 text-theme-primary rounded-full text-sm border border-theme-primary/30"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    const type = typeof value;
    const keyLower = key.toLowerCase();
    const stringValue =
      value === null || value === undefined ? "" : String(value);

    // List of fields stored as real booleans (true/false)
    const booleanFields = ["basicAuthEnabled"];

    // List of fields stored as string "true"/"false" (lowercase)
    const lowercaseStringBooleanFields = [
      "UsePlex",
      "UseJellyfin",
      "UseEmby",
      "WidthHeightFilter",
      "PlexUploadExistingAssets",
      "JellyfinUploadExistingAssets",
      "JellyfinReplaceThumbwithBackdrop",
      "EmbyUploadExistingAssets",
      "EmbyReplaceThumbwithBackdrop",
      "show_skipped",
      "AssetCleanup",
      "FollowSymlink",
      "SkipTBA",
      "SkipJapTitle",
      "SkipAddText",
      "SkipAddTextAndOverlay",
      "DisableOnlineAssetFetch",
      "AutoUpdateIM",
      "AutoUpdatePosterizarr",
      "ForceRunningDeletion",
      "DisableHashValidation",
      "ImageProcessing",
      "NewLineOnSpecificSymbols",
      "Posters",
      "SeasonPosters",
      "BackgroundPosters",
      "TitleCards",
      "LibraryFolders",
      "PlexUpload",
      "PosterFontAllCaps",
      "PosterAddBorder",
      "PosterAddText",
      "PosterAddOverlay",
      "PosterAddTextStroke",
      "BackgroundFontAllCaps",
      "BackgroundAddOverlay",
      "BackgroundAddBorder",
      "BackgroundAddText",
      "BackgroundAddTextStroke",
      "TitleCardUseBackgroundAsTitleCard",
      "TitleCardAddOverlay",
      "TitleCardAddBorder",
      "TitleCardBackgroundFallback",
      "TitleCardTitleFontAllCaps",
      "TitleCardTitleAddEPTitleText",
      "TitleCardTitleAddTextStroke",
      "TitleCardEPFontAllCaps",
      "TitleCardEPAddEPText",
      "TitleCardEPAddTextStroke",
      "SeasonPosterFontAllCaps",
      "SeasonPosterAddBorder",
      "SeasonPosterAddText",
      "SeasonPosterAddOverlay",
      "SeasonPosterAddTextStroke",
      "SeasonPosterShowFallback",
      "ShowTitleAddShowTitletoSeason",
      "ShowTitleFontAllCaps",
      "ShowTitleAddTextStroke",
      "CollectionTitleAddCollectionTitle",
      "CollectionTitleFontAllCaps",
      "CollectionTitleAddTextStroke",
      "CollectionPosterFontAllCaps",
      "CollectionPosterAddBorder",
      "CollectionPosterAddText",
      "CollectionPosterAddTextStroke",
      "CollectionPosterAddOverlay",
      "UsePosterResolutionOverlays",
      "UseBackgroundResolutionOverlays",
      "UseTCResolutionOverlays",
    ];

    // List of fields stored as string "True"/"False" (CAPITAL)
    const capitalizedStringBooleanFields = [
      "SendNotification",
      "UseUptimeKuma",
    ];

    // Enhanced boolean toggle switch - supports 3 types: Boolean, "true"/"false", "True"/"False"
    if (
      type === "boolean" ||
      value === "true" ||
      value === "false" ||
      value === "True" ||
      value === "False" ||
      lowercaseStringBooleanFields.includes(key) ||
      capitalizedStringBooleanFields.includes(key)
    ) {
      // Determine which type to use
      const isBoolean = booleanFields.includes(key);
      const isCapitalizedString = capitalizedStringBooleanFields.includes(key);
      const isLowercaseString = lowercaseStringBooleanFields.includes(key);

      // Determine current state (enabled/disabled)
      const isEnabled =
        value === "true" || value === true || value === "True" || value === 1;

      // Special handling for Media Server toggles (only one can be active)
      const isMediaServerToggle = [
        "UsePlex",
        "UseJellyfin",
        "UseEmby",
      ].includes(key);

      // Check if this field should be disabled
      const disabled = isFieldDisabled(key, groupName);

      // Determine the reason for being disabled
      const getDisabledReason = () => {
        if (!disabled) return null;

        // Check for media server dependencies
        if (key.includes("Plex")) return "Plex to be enabled";
        if (key.includes("Jellyfin")) return "Jellyfin to be enabled";
        if (key.includes("Emby")) return "Emby to be enabled";

        // Check for overlay/text dependencies based on field type
        const keyLower = key.toLowerCase();

        // Border fields
        if (
          keyLower.includes("bordercolor") ||
          keyLower.includes("borderwidth")
        ) {
          return "Add Border to be enabled";
        }

        // Text stroke fields
        if (
          keyLower.includes("strokecolor") ||
          keyLower.includes("strokewidth")
        ) {
          return "Add Text Stroke to be enabled";
        }

        // General text fields
        if (
          keyLower.includes("fontallcaps") ||
          keyLower.includes("fontcolor") ||
          keyLower.includes("minpointsize") ||
          keyLower.includes("maxpointsize") ||
          keyLower.includes("maxwidth") ||
          keyLower.includes("maxheight") ||
          keyLower.includes("linespacing") ||
          keyLower.includes("textgravity") ||
          keyLower.includes("addtextstroke") ||
          keyLower.includes("textoffset")
        ) {
          return "Add Text to be enabled";
        }

        return "required settings to be enabled";
      };

      return (
        <div
          className={`flex items-center justify-between h-[42px] px-4 bg-theme-bg rounded-lg border border-theme transition-all ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-theme-primary/30"
          }`}
        >
          <div className="text-sm font-medium text-theme-text">
            {displayName}
            {disabled && (
              <span className="text-xs text-theme-muted ml-2">
                (Requires {getDisabledReason()})
              </span>
            )}
          </div>
          <label
            className={`relative inline-flex items-center ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={isEnabled}
              disabled={disabled}
              onChange={(e) => {
                // Decide based on field type which value to save
                let newValue;

                if (isBoolean) {
                  // Real booleans for Auth
                  newValue = e.target.checked;
                } else if (isCapitalizedString) {
                  // String with capital letters for Notifications
                  newValue = e.target.checked ? "True" : "False";
                } else {
                  // String with lowercase letters for everything else (default)
                  newValue = e.target.checked ? "true" : "false";
                }

                // Special handling for Media Server toggles - Radio button behavior
                if (isMediaServerToggle && e.target.checked) {
                  // When turning ON a media server, turn OFF the others
                  // We need to batch all updates together to avoid race conditions
                  let batchedConfig;

                  if (usingFlatStructure) {
                    batchedConfig = {
                      ...config,
                      UsePlex: key === "UsePlex" ? newValue : "false",
                      UseJellyfin: key === "UseJellyfin" ? newValue : "false",
                      UseEmby: key === "UseEmby" ? newValue : "false",
                    };
                  } else {
                    batchedConfig = {
                      ...config,
                      PlexPart: {
                        ...config.PlexPart,
                        UsePlex: key === "UsePlex" ? newValue : "false",
                      },
                      JellyfinPart: {
                        ...config.JellyfinPart,
                        UseJellyfin: key === "UseJellyfin" ? newValue : "false",
                      },
                      EmbyPart: {
                        ...config.EmbyPart,
                        UseEmby: key === "UseEmby" ? newValue : "false",
                      },
                    };
                  }

                  setConfig(batchedConfig);
                } else {
                  updateValue(fieldKey, newValue);
                }
              }}
              className="sr-only peer"
              id={`${groupName}-${key}`}
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-theme-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
          </label>
        </div>
      );
    }

    // ============ DROPDOWN FOR FAVPROVIDER ============
    if (key === "FavProvider") {
      const providerOptions = ["tmdb", "tvdb", "fanart"];

      return (
        <div className="space-y-2">
          <div className="relative" ref={favProviderDropdownRef}>
            <button
              onClick={() =>
                setFavProviderDropdownOpen(!favProviderDropdownOpen)
              }
              className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
            >
              <span>{stringValue.toUpperCase()}</span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  favProviderDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {favProviderDropdownOpen && (
              <div
                className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg"
                style={{
                  left: favProviderDropdownRef.current?.getBoundingClientRect()
                    .left,
                  width: favProviderDropdownRef.current?.offsetWidth,
                  ...(getDropdownPosition(favProviderDropdownRef.current)
                    .openUpward
                    ? {
                        bottom: getDropdownPosition(
                          favProviderDropdownRef.current
                        ).bottom,
                      }
                    : {
                        top: getDropdownPosition(favProviderDropdownRef.current)
                          .top,
                      }),
                }}
              >
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Select Provider
                  </div>
                  {providerOptions.map((option) => (
                    <button
                      key={option}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setFavProviderDropdownOpen(false);
                        updateValue(fieldKey, option);
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        stringValue.toLowerCase() === option
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      {option.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Select your preferred metadata provider (recommended: TMDB)
          </p>
        </div>
      );
    }

    // ============ DROPDOWN FOR TMDB_VOTE_SORTING ============
    if (key === "tmdb_vote_sorting") {
      const sortingOptions = [
        { value: "vote_average", label: "Vote Average" },
        { value: "vote_count", label: "Vote Count" },
        { value: "primary", label: "Primary (Default TMDB View)" },
      ];

      return (
        <div className="space-y-2">
          <div className="relative" ref={tmdbSortingDropdownRef}>
            <button
              onClick={() =>
                setTmdbSortingDropdownOpen(!tmdbSortingDropdownOpen)
              }
              className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
            >
              <span>
                {sortingOptions.find((opt) => opt.value === stringValue)
                  ?.label || "Select sorting"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  tmdbSortingDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {tmdbSortingDropdownOpen && (
              <div
                className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg"
                style={{
                  left: tmdbSortingDropdownRef.current?.getBoundingClientRect()
                    .left,
                  width: tmdbSortingDropdownRef.current?.offsetWidth,
                  ...(getDropdownPosition(tmdbSortingDropdownRef.current)
                    .openUpward
                    ? {
                        bottom: getDropdownPosition(
                          tmdbSortingDropdownRef.current
                        ).bottom,
                      }
                    : {
                        top: getDropdownPosition(tmdbSortingDropdownRef.current)
                          .top,
                      }),
                }}
              >
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Select Sorting
                  </div>
                  {sortingOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setTmdbSortingDropdownOpen(false);
                        updateValue(fieldKey, option.value);
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        stringValue === option.value
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Picture sorting method via TMDB API
          </p>
        </div>
      );
    }

    // ============ SERVICES MIT VALIDATE-BUTTONS ============

    // Plex Token mit Validate-Button
    if (key === "PlexToken") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                disabled={disabled}
                className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={
                  disabled ? "Enable Plex first" : "Enter Plex token"
                }
              />
              <Lock
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted ${
                  disabled ? "opacity-50" : ""
                }`}
              />
            </div>
            <ValidateButton
              type="plex"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is only available when Plex is selected as your media server"
              : "Your Plex authentication token"}
          </p>
        </div>
      );
    }

    // Jellyfin API Key mit Validate-Button
    if (key === "JellyfinAPIKey") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                disabled={disabled}
                className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={
                  disabled
                    ? "Enable Jellyfin or JellySync first"
                    : "Enter Jellyfin API key"
                }
              />
              <Lock
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted ${
                  disabled ? "opacity-50" : ""
                }`}
              />
            </div>
            <ValidateButton
              type="jellyfin"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Jellyfin is selected as your media server OR when JellySync is enabled"
              : "Create API key in Jellyfin at Settings → Advanced → API Keys"}
          </p>
        </div>
      );
    }

    // Emby API Key mit Validate-Button
    if (key === "EmbyAPIKey") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                disabled={disabled}
                className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                placeholder={
                  disabled
                    ? "Enable Emby or EmbySync first"
                    : "Enter Emby API key"
                }
              />
              <Lock
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted ${
                  disabled ? "opacity-50" : ""
                }`}
              />
            </div>
            <ValidateButton
              type="emby"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Emby is selected as your media server OR when EmbySync is enabled"
              : "Create API key in Emby at Settings → Advanced → API Keys"}
          </p>
        </div>
      );
    }

    // ============ MEDIA SERVER URL FIELDS ============

    // Plex URL
    if (key === "PlexUrl") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={
              disabled ? "Enable Plex first" : "http://192.168.1.1:32400"
            }
          />
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is only available when Plex is selected as your media server"
              : "Your Plex server URL (e.g., http://192.168.1.1:32400)"}
          </p>
        </div>
      );
    }

    // Jellyfin URL
    if (key === "JellyfinUrl") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={
              disabled
                ? "Enable Jellyfin or JellySync first"
                : "http://192.168.1.1:8096"
            }
          />
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Jellyfin is selected as your media server OR when JellySync is enabled"
              : "Your Jellyfin server URL (e.g., http://192.168.1.1:8096)"}
          </p>
        </div>
      );
    }

    // Emby URL
    if (key === "EmbyUrl") {
      const disabled = isFieldDisabled(key, groupName);

      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder={
              disabled
                ? "Enable Emby or EmbySync first"
                : "http://192.168.1.1:8096/emby"
            }
          />
          <p className="text-xs text-theme-muted">
            {disabled
              ? "This field is available when Emby is selected as your media server OR when EmbySync is enabled"
              : "Your Emby server URL (e.g., http://192.168.1.1:8096/emby)"}
          </p>
        </div>
      );
    }

    // ============ API KEYS MIT VALIDATE-BUTTONS ============

    // TMDB Token mit Validate-Button
    if (key === "tmdbtoken") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
                placeholder="Enter TMDB Read Access Token"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>
            <ValidateButton
              type="tmdb"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Your TMDB API Read Access Token (the really long one)
          </p>
        </div>
      );
    }

    // TVDB API Key mit Validate-Button
    if (key === "tvdbapi") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
                placeholder="Enter TVDB API Key (optionally with #PIN)"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>
            <ValidateButton
              type="tvdb"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Format: YourApiKey or YourApiKey#YourPin (for subscribers)
          </p>
        </div>
      );
    }

    // Fanart.tv API Key mit Validate-Button
    if (key === "FanartTvAPIKey") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={stringValue}
                onChange={(e) => updateValue(fieldKey, e.target.value)}
                className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
                placeholder="Enter Fanart.tv Personal API Key"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            </div>
            <ValidateButton
              type="fanart"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Your Fanart.tv Personal API Key
          </p>
        </div>
      );
    }

    // ============ NOTIFICATIONS with VALIDATE-BUTTONS ============

    // Discord Webhook mit Validate-Button
    if (key === "Discord") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={stringValue}
              onChange={(e) => {
                updateValue(fieldKey, e.target.value);
                autoResize(e.target);
              }}
              onInput={(e) => autoResize(e.target)}
              ref={(textarea) => textarea && autoResize(textarea)}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px]"
              placeholder="https://discord.com/api/webhooks/..."
            />
            <ValidateButton
              type="discord"
              config={config}
              label="Test"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Discord webhook URL (sends a test message when validated)
          </p>
        </div>
      );
    }

    // Apprise URL mit Validate-Button
    if (key === "AppriseUrl") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={stringValue}
              onChange={(e) => {
                updateValue(fieldKey, e.target.value);
                autoResize(e.target);
              }}
              onInput={(e) => autoResize(e.target)}
              ref={(textarea) => textarea && autoResize(textarea)}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px]"
              placeholder="discord://... or telegram://... etc."
            />
            <ValidateButton
              type="apprise"
              config={config}
              label="Validate"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Apprise notification URL (format check only)
          </p>
        </div>
      );
    }

    // Uptime Kuma URL mit Validate-Button
    if (key === "UptimeKumaUrl") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={stringValue}
              onChange={(e) => {
                updateValue(fieldKey, e.target.value);
                autoResize(e.target);
              }}
              onInput={(e) => autoResize(e.target)}
              ref={(textarea) => textarea && autoResize(textarea)}
              rows={1}
              className="flex-1 px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px]"
              placeholder="https://uptime-kuma.domain.com/api/push/..."
            />
            <ValidateButton
              type="uptimekuma"
              config={config}
              label="Test"
              onSuccess={showSuccess}
              onError={showError}
            />
          </div>
          <p className="text-xs text-theme-muted">
            Uptime Kuma push monitor URL (sends test ping when validated)
          </p>
        </div>
      );
    }

    // Handle text_offset specially with enhanced number input
    if (keyLower.includes("offset") || keyLower === "text_offset") {
      const disabled = isFieldDisabled(key, groupName);

      // Parse the current value - keep the sign!
      let parsedValue = 0;
      if (stringValue) {
        // Remove + if present, keep - if present
        const cleanValue = stringValue.replace(/^\+/, "");
        parsedValue = parseInt(cleanValue, 10) || 0;
      }

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={parsedValue}
              disabled={disabled}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || val === "-") {
                  updateValue(fieldKey, "");
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    // Format with explicit + or - sign
                    const formattedValue = num >= 0 ? `+${num}` : `${num}`;
                    updateValue(fieldKey, formattedValue);
                  }
                }
              }}
              onBlur={(e) => {
                // Ensure proper formatting on blur
                const val = e.target.value;
                if (val === "" || val === "-" || val === "+") {
                  updateValue(fieldKey, "+0");
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    const formattedValue = num >= 0 ? `+${num}` : `${num}`;
                    updateValue(fieldKey, formattedValue);
                  }
                }
              }}
              className={`flex-1 h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="0"
            />
            <div className="flex items-center gap-1 px-3 py-2 bg-theme-bg border border-theme rounded-lg text-theme-muted text-sm font-mono min-w-[60px] justify-center">
              <span
                className={`font-bold ${
                  parsedValue >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {parsedValue >= 0 ? "+" : "-"}
              </span>
              <span>{Math.abs(parsedValue)}</span>
            </div>
          </div>
          <p className="text-xs text-theme-muted">
            Offset from bottom of image. Positive (+) moves up, negative (-)
            moves down
          </p>
        </div>
      );
    }

    // ============ LOG LEVEL (1, 2, or 3) ============
    if (key === "logLevel") {
      const numValue = String(stringValue || "2");
      const logLevelOptions = [
        { value: "1", label: "1 - Warning/Error messages only" },
        { value: "2", label: "2 - Info/Warning/Error messages (Default)" },
        { value: "3", label: "3 - Info/Warning/Error/Debug (Most verbose)" },
      ];

      return (
        <div className="space-y-2">
          <div className="relative" ref={logLevelDropdownRef}>
            <button
              ref={logLevelDropdownRef}
              onClick={() => setLogLevelDropdownOpen(!logLevelDropdownOpen)}
              className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
            >
              <span>
                {logLevelOptions.find((opt) => opt.value === numValue)?.label ||
                  "Select log level"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  logLevelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {logLevelDropdownOpen && (
              <div
                className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg overflow-hidden"
                style={{
                  left: logLevelDropdownRef.current?.getBoundingClientRect()
                    .left,
                  width: logLevelDropdownRef.current?.offsetWidth,
                  ...(getDropdownPosition(logLevelDropdownRef.current)
                    .openUpward
                    ? {
                        bottom: getDropdownPosition(logLevelDropdownRef.current)
                          .bottom,
                      }
                    : {
                        top: getDropdownPosition(logLevelDropdownRef.current)
                          .top,
                      }),
                }}
              >
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Select Log Level
                  </div>
                  {logLevelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setLogLevelDropdownOpen(false);
                        updateValue(fieldKey, option.value);
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        numValue === option.value
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Logging verbosity: 1 = Warning/Error, 2 = Info/Warning/Error
            (default), 3 = Info/Warning/Error/Debug
          </p>
        </div>
      );
    }

    // ============ TEXT GRAVITY (Alignment) ============
    if (keyLower.includes("gravity") || keyLower.endsWith("textgravity")) {
      const gravityValue = String(stringValue || "South");
      const disabled = isFieldDisabled(key, groupName);
      const gravityOptions = [
        { value: "NorthWest", label: "NorthWest (Top Left)" },
        { value: "North", label: "North (Top Center)" },
        { value: "NorthEast", label: "NorthEast (Top Right)" },
        { value: "West", label: "West (Middle Left)" },
        { value: "Center", label: "Center (Middle Center)" },
        { value: "East", label: "East (Middle Right)" },
        { value: "SouthWest", label: "SouthWest (Bottom Left)" },
        { value: "South", label: "South (Bottom Center)" },
        { value: "SouthEast", label: "SouthEast (Bottom Right)" },
      ];

      const dropdownKey = `gravity-${fieldKey}`;

      return (
        <div className="space-y-2">
          <div
            className="relative"
            ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
          >
            <button
              onClick={() => !disabled && toggleDropdown(dropdownKey)}
              disabled={disabled}
              className={`w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                disabled
                  ? "opacity-50 cursor-not-allowed hover:bg-theme-bg hover:border-theme"
                  : ""
              }`}
            >
              <span>
                {gravityOptions.find((opt) => opt.value === gravityValue)
                  ?.label || gravityValue}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-theme-muted transition-transform ${
                  isDropdownOpen(dropdownKey) ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen(dropdownKey) && !disabled && (
              <div
                className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                style={{
                  left: dropdownRefs.current[
                    dropdownKey
                  ]?.getBoundingClientRect().left,
                  width: dropdownRefs.current[dropdownKey]?.offsetWidth,
                  ...(getDropdownPosition(dropdownRefs.current[dropdownKey])
                    .openUpward
                    ? {
                        bottom: getDropdownPosition(
                          dropdownRefs.current[dropdownKey]
                        ).bottom,
                      }
                    : {
                        top: getDropdownPosition(
                          dropdownRefs.current[dropdownKey]
                        ).top,
                      }),
                }}
              >
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                    Select Alignment
                  </div>
                  {gravityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        closeDropdown(dropdownKey);
                        updateValue(fieldKey, option.value);
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        gravityValue === option.value
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-theme-muted">
            Text alignment position within the text box
          </p>
        </div>
      );
    }

    // ============ OUTPUT QUALITY (1-100%) ============
    if (key === "outputQuality") {
      // Parse the value - handle both "92" and "92%" formats for display
      // Strip % for input display, but save WITH % to config
      let displayValue = String(stringValue || "").trim();
      if (displayValue.endsWith("%")) {
        displayValue = displayValue.slice(0, -1).trim();
      }

      const numValue = displayValue === "" ? "" : Number(displayValue);
      const isInvalid =
        displayValue !== "" &&
        (numValue < 1 || numValue > 100 || isNaN(numValue));

      return (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={displayValue}
              onChange={(e) => {
                const val = e.target.value.trim();
                // Allow empty or valid integers between 1-100
                // Store WITH % symbol for backend compatibility
                if (val === "") {
                  updateValue(fieldKey, "");
                } else {
                  const numVal = Number(val);
                  if (
                    !isNaN(numVal) &&
                    numVal >= 1 &&
                    numVal <= 100 &&
                    Number.isInteger(numVal)
                  ) {
                    // Save with % symbol (integers only)
                    updateValue(fieldKey, val + "%");
                  }
                }
              }}
              onBlur={(e) => {
                // Enforce bounds on blur and round to integer
                let val = e.target.value.trim();
                if (val !== "") {
                  const numVal = Number(val);
                  if (!isNaN(numVal)) {
                    const intVal = Math.round(numVal);
                    if (intVal < 1) {
                      updateValue(fieldKey, "1%");
                    } else if (intVal > 100) {
                      updateValue(fieldKey, "100%");
                    } else {
                      // Save with % symbol (integers only)
                      updateValue(fieldKey, String(intVal) + "%");
                    }
                  }
                }
              }}
              className={`w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border ${
                isInvalid ? "border-red-500" : "border-theme"
              } rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all`}
              placeholder="1-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted text-sm font-medium pointer-events-none">
              %
            </span>
          </div>
          <p className="text-xs text-theme-muted">
            Image quality percentage (1-100). Default: 92%. Setting to 100%
            doubles file size
          </p>
          {isInvalid && (
            <p className="text-xs text-red-400">
              Value must be between 1 and 100
            </p>
          )}
        </div>
      );
    }

    // ============ COLOR FIELDS (WITH COLOR PICKER) ============
    if (
      keyLower.includes("color") ||
      keyLower.includes("fontcolor") ||
      keyLower.includes("bordercolor") ||
      keyLower.includes("strokecolor")
    ) {
      const disabled = isFieldDisabled(key, groupName);

      // Determine if current value is hex or color name
      const isHexColor = stringValue.match(/^#[0-9A-Fa-f]{6}$/);
      const currentInputType = isHexColor ? "hex" : "name";

      // Common CSS color names supported by ImageMagick
      const colorNames = [
        "white",
        "black",
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        "gray",
        "grey",
        "silver",
        "maroon",
        "olive",
        "lime",
        "aqua",
        "teal",
        "navy",
        "fuchsia",
        "purple",
        "orange",
        "brown",
        "pink",
        "gold",
        "violet",
        "indigo",
        "turquoise",
        "tan",
        "khaki",
        "coral",
        "salmon",
        "crimson",
        "lavender",
        "plum",
        "orchid",
        "chocolate",
        "sienna",
      ].sort();

      // Convert hex to RGB for preview contrast calculation
      const hexToRgb = (hex) => {
        if (!hex || !hex.startsWith("#")) return null;
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : null;
      };

      const rgb = isHexColor ? hexToRgb(stringValue) : null;

      return (
        <div className="space-y-2">
          {/* Input Type Toggle */}
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                if (currentInputType === "hex" && !disabled) {
                  // Switch to name, default to white
                  updateValue(fieldKey, "white");
                }
              }}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm ${
                currentInputType === "name"
                  ? "bg-theme-primary text-white border-theme-primary"
                  : ""
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Color Name
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentInputType === "name" && !disabled) {
                  // Switch to hex, default to white
                  updateValue(fieldKey, "#FFFFFF");
                }
              }}
              disabled={disabled}
              className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm ${
                currentInputType === "hex"
                  ? "bg-theme-primary text-white border-theme-primary"
                  : ""
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Hex Code
            </button>
          </div>

          {currentInputType === "name" ? (
            // Color Name Dropdown
            <div
              className="relative"
              ref={(el) => (dropdownRefs.current[`color-${fieldKey}`] = el)}
            >
              <button
                onClick={() => !disabled && toggleDropdown(`color-${fieldKey}`)}
                disabled={disabled}
                className={`w-full h-[42px] pl-12 pr-10 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                  disabled
                    ? "opacity-50 cursor-not-allowed hover:bg-theme-bg hover:border-theme"
                    : ""
                }`}
              >
                <span
                  className={
                    stringValue ? "text-theme-text" : "text-theme-muted"
                  }
                >
                  {stringValue
                    ? stringValue.charAt(0).toUpperCase() + stringValue.slice(1)
                    : "-- Select Color --"}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-theme-muted transition-transform ${
                    isDropdownOpen(`color-${fieldKey}`) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {stringValue && (
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-gray-400 shadow-sm pointer-events-none z-10"
                  style={{ backgroundColor: stringValue }}
                  title={stringValue}
                />
              )}

              {isDropdownOpen(`color-${fieldKey}`) && !disabled && (
                <div
                  className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg max-h-60 overflow-y-auto"
                  style={{
                    left: dropdownRefs.current[
                      `color-${fieldKey}`
                    ]?.getBoundingClientRect().left,
                    width:
                      dropdownRefs.current[`color-${fieldKey}`]?.offsetWidth,
                    ...(getDropdownPosition(
                      dropdownRefs.current[`color-${fieldKey}`]
                    ).openUpward
                      ? {
                          bottom: getDropdownPosition(
                            dropdownRefs.current[`color-${fieldKey}`]
                          ).bottom,
                        }
                      : {
                          top: getDropdownPosition(
                            dropdownRefs.current[`color-${fieldKey}`]
                          ).top,
                        }),
                  }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      Select Color
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        closeDropdown(`color-${fieldKey}`);
                        updateValue(fieldKey, "");
                      }}
                      className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                        !stringValue
                          ? "bg-theme-primary text-white"
                          : "text-gray-300 hover:bg-theme-hover"
                      }`}
                    >
                      -- Select Color --
                    </button>
                    {colorNames.map((color) => (
                      <button
                        key={color}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          closeDropdown(`color-${fieldKey}`);
                          updateValue(fieldKey, color);
                        }}
                        className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left flex items-center gap-2 ${
                          stringValue.toLowerCase() === color
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded border border-gray-400"
                          style={{ backgroundColor: color }}
                        />
                        {color.charAt(0).toUpperCase() + color.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Hex Color Picker
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={stringValue}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    // Allow empty or partial hex while typing
                    if (
                      val === "" ||
                      val === "#" ||
                      /^#[0-9A-F]{0,6}$/.test(val)
                    ) {
                      updateValue(fieldKey, val);
                    }
                  }}
                  onBlur={(e) => {
                    // Validate and fix on blur
                    let val = e.target.value.toUpperCase();
                    if (!val.startsWith("#")) {
                      val = "#" + val;
                    }
                    // Pad with zeros if incomplete
                    if (val.length < 7) {
                      val = val.padEnd(7, "0");
                    }
                    // Validate hex format
                    if (/^#[0-9A-F]{6}$/.test(val)) {
                      updateValue(fieldKey, val);
                    } else {
                      // Fallback to white if invalid
                      updateValue(fieldKey, "#FFFFFF");
                    }
                  }}
                  disabled={disabled}
                  className={`w-full h-[42px] px-12 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  placeholder="#FFFFFF"
                  maxLength={7}
                />
                {/* Color preview swatch on the left */}
                <div
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: stringValue || "#FFFFFF" }}
                  title={stringValue}
                />
              </div>
              {/* Native color picker */}
              <input
                type="color"
                value={
                  stringValue && /^#[0-9A-Fa-f]{6}$/.test(stringValue)
                    ? stringValue
                    : "#FFFFFF"
                }
                onChange={(e) =>
                  updateValue(fieldKey, e.target.value.toUpperCase())
                }
                disabled={disabled}
                className={`h-[42px] w-[42px] bg-theme-bg border border-theme rounded-lg cursor-pointer ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title="Pick color"
              />
            </div>
          )}

          {/* Preview and current value */}
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <div
              className="w-full h-8 rounded border border-theme flex items-center justify-center font-mono text-sm"
              style={{
                backgroundColor: stringValue || "#FFFFFF",
                color:
                  rgb && rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114 > 128
                    ? "#000000"
                    : "#FFFFFF",
              }}
            >
              {stringValue || "No color"}
            </div>
          </div>
          <p className="text-xs text-theme-muted">
            Choose a color name or hex code (e.g., #FFFFFF)
          </p>
        </div>
      );
    }

    // ============ NUMERIC FIELDS (WITH VALIDATION) ============
    if (
      type === "number" ||
      keyLower.includes("port") ||
      keyLower.includes("size") ||
      keyLower.includes("width") ||
      keyLower.includes("height") ||
      keyLower.includes("pointsize") ||
      keyLower.includes("borderwidth") ||
      keyLower.includes("strokewidth") ||
      keyLower.includes("spacing") ||
      keyLower === "maxlogs"
    ) {
      const disabled = isFieldDisabled(key, groupName);
      const hasError = validationErrors[key];

      return (
        <div className="space-y-2">
          <input
            type="number"
            min="0"
            step="1"
            value={stringValue}
            onChange={(e) => {
              const val = e.target.value;
              // Only allow empty string or valid non-negative numbers
              if (val === "" || (!isNaN(val) && Number(val) >= 0)) {
                updateValue(fieldKey, val);
              }
            }}
            onKeyDown={(e) => {
              // Prevent minus sign, 'e', '+', and other non-numeric keys
              if (
                e.key === "-" ||
                e.key === "e" ||
                e.key === "E" ||
                e.key === "+"
              ) {
                e.preventDefault();
              }
            }}
            disabled={disabled}
            className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border ${
              hasError ? "border-red-500" : "border-theme"
            } rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 ${
              hasError
                ? "focus:ring-red-500 focus:border-red-500"
                : "focus:ring-theme-primary focus:border-theme-primary"
            } transition-all ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Enter number"
          />
          {hasError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {hasError}
            </p>
          )}
        </div>
      );
    }

    // Generic password/token/key/secret handling (WITHOUT Validate button for other fields)
    if (
      keyLower.includes("password") ||
      keyLower.includes("token") ||
      keyLower.includes("key") ||
      keyLower.includes("secret")
    ) {
      return (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={stringValue}
              onChange={(e) => updateValue(fieldKey, e.target.value)}
              className="w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono pr-10"
              placeholder="Enter secure value"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          </div>
        </div>
      );
    }

    // Check if field should be disabled
    const disabled = isFieldDisabled(key, groupName);

    if (
      stringValue.length > 100 ||
      keyLower.includes("path") ||
      keyLower.includes("url")
    ) {
      return (
        <div className="space-y-2">
          <textarea
            value={stringValue}
            onChange={(e) => {
              updateValue(fieldKey, e.target.value);
              autoResize(e.target);
            }}
            onInput={(e) => autoResize(e.target)}
            ref={(textarea) => textarea && autoResize(textarea)}
            rows={1}
            disabled={disabled}
            className={`w-full px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all font-mono text-sm resize-none overflow-hidden min-h-[42px] ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <input
          type="text"
          value={stringValue}
          onChange={(e) => updateValue(fieldKey, e.target.value)}
          disabled={disabled}
          className={`w-full h-[42px] px-4 py-2.5 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-theme-primary mx-auto mb-4" />
          <p className="text-theme-muted">{t("configEditor.loadingConfig")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 rounded-xl p-6 border-2 border-red-600/50 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 text-lg font-semibold mb-2">
          {t("configEditor.errorLoadingConfig")}
        </p>
        <p className="text-red-200 mb-4">{error}</p>
        <button
          onClick={fetchConfig}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all shadow-lg hover:scale-105"
        >
          <RefreshCw className="w-5 h-5 inline mr-2" />
          {t("configEditor.retry")}
        </button>
      </div>
    );
  }

  const TabIcon = tabs[activeTab]?.icon || Settings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Left side - Unsaved changes indicator */}
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-xs text-yellow-500">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Unsaved changes
            </span>
          )}
          {Object.keys(validationErrors).length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              {Object.keys(validationErrors).length} validation{" "}
              {Object.keys(validationErrors).length === 1 ? "error" : "errors"}
            </span>
          )}
        </div>

        {/* Right side - Buttons */}
        <div className="flex gap-3">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 text-theme-primary ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className="text-theme-text">{t("configEditor.reload")}</span>
          </button>
          <button
            onClick={() => saveConfig(false)}
            disabled={saving || Object.keys(validationErrors).length > 0}
            className={`flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border ${
              Object.keys(validationErrors).length > 0
                ? "border-red-500"
                : hasUnsavedChanges
                ? "border-yellow-500 animate-pulse"
                : "border-theme"
            } hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              Object.keys(validationErrors).length > 0
                ? "Fix validation errors before saving"
                : t("configEditor.saveConfigTitle")
            }
          >
            {saving ? (
              <Loader2 className="w-4 h-4 text-theme-primary animate-spin" />
            ) : (
              <Save
                className={`w-4 h-4 ${
                  Object.keys(validationErrors).length > 0
                    ? "text-red-500"
                    : hasUnsavedChanges
                    ? "text-yellow-500"
                    : "text-theme-primary"
                }`}
              />
            )}
            <span className="text-theme-text">
              {saving
                ? t("configEditor.saving")
                : t("configEditor.saveChanges")}
            </span>
            {!saving && (
              <span className="hidden sm:inline text-xs opacity-70 ml-1">
                (Ctrl+↵)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Auto-Save Toggle */}
      <div className="bg-theme-card rounded-xl p-4 border border-theme shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-theme-primary/10">
              <Save className="w-5 h-5 text-theme-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-theme-text">
                {t("configEditor.autoSave")}
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                {t("configEditor.autoSaveDescription")}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-theme-bg ${
              autoSaveEnabled ? "bg-theme-primary" : "bg-gray-600"
            }`}
            aria-label={t("configEditor.autoSave")}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSaveEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-theme-card rounded-xl p-4 border border-theme shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("configEditor.searchPlaceholder")}
            className="w-full pl-12 pr-4 py-3 bg-theme-bg border border-theme rounded-lg text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-theme-muted mt-2">
            {t("configEditor.filteringSettings", { query: searchQuery })}
          </p>
        )}
      </div>

      {/* Expand/Collapse All Controls */}
      <div className="bg-theme-card rounded-xl p-4 border border-theme shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-theme-text">
            <span className="font-medium">
              {t("configEditor.section", {
                count: getFilteredGroupsByTab(activeTab).filter(
                  (groupName) => getFilteredFieldsForGroup(groupName).length > 0
                ).length,
              })}
            </span>
            {searchQuery && (
              <span className="ml-2 text-theme-muted text-sm">
                ({t("configEditor.filtered")})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tabs for Groups (if multiple groups exist) */}
      {(() => {
        const groups = getFilteredGroupsByTab(activeTab).filter(
          (groupName) => getFilteredFieldsForGroup(groupName).length > 0
        );

        // Get active sub-tab for current main tab, default to first group
        const activeSubTab = activeSubTabs[activeTab] || groups[0];

        // Show sub-tabs only if there are multiple groups
        if (groups.length > 1) {
          return (
            <div className="bg-theme-card rounded-xl border border-theme overflow-hidden shadow-sm">
              <div className="flex gap-1 overflow-x-auto p-2">
                {groups.map((groupName) => {
                  const GroupIcon = getGroupIconForDisplay(groupName);
                  const isActive = activeSubTab === groupName;
                  const settingsCount =
                    getFilteredFieldsForGroup(groupName).length;

                  return (
                    <button
                      key={groupName}
                      onClick={() =>
                        setActiveSubTabs((prev) => ({
                          ...prev,
                          [activeTab]: groupName,
                        }))
                      }
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-theme-primary text-white shadow-md"
                          : "bg-theme-bg text-theme-muted hover:text-theme-text hover:bg-theme-hover"
                      }`}
                    >
                      <GroupIcon className="w-4 h-4" />
                      <span className="font-medium">
                        {formatGroupName(groupName)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          isActive ? "bg-white/20" : "bg-theme-card"
                        }`}
                      >
                        {settingsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Settings Groups */}
      <div className="space-y-4">
        {(() => {
          const groups = getFilteredGroupsByTab(activeTab).filter(
            (groupName) => getFilteredFieldsForGroup(groupName).length > 0
          );

          // If multiple groups, show only active sub-tab
          const groupsToRender =
            groups.length > 1
              ? [activeSubTabs[activeTab] || groups[0]]
              : groups;

          return groupsToRender.map((groupName) => {
            const GroupIcon = getGroupIconForDisplay(groupName);
            const fields = getFilteredFieldsForGroup(groupName);
            const settingsCount = fields.length;
            const readmeLink = getReadmeLink(groupName);

            // Don't show groups with no matching fields when searching
            if (searchQuery && settingsCount === 0) return null;

            // Special rendering for groups with dropdowns - no overflow-hidden to avoid z-index issues
            const isWebUISettings = groupName === "WebUI Settings";
            const isAPIKeysTokens =
              groupName === "API Keys & Tokens" || groupName === "ApiPart";
            const isLanguagePreferences =
              groupName === "Language & Preferences";
            const isOverlayFiles = groupName === "Overlay Files";
            const isResolutionOverlays = groupName === "Resolution Overlays";
            const isFonts = groupName === "Fonts";
            const isOverlayPart = groupName === "OverlayPart";
            const needsNoOverflow =
              isWebUISettings ||
              isAPIKeysTokens ||
              isLanguagePreferences ||
              isOverlayFiles ||
              isResolutionOverlays ||
              isFonts ||
              isOverlayPart;

            return (
              <div key={groupName}>
                {/* Separate Header Card */}
                <div className="bg-theme-card rounded-xl border border-theme hover:border-theme-primary/50 transition-all shadow-sm mb-4">
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-theme-primary/10">
                        <GroupIcon className="w-6 h-6 text-theme-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold text-theme-primary">
                          {formatGroupName(groupName)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-theme-muted">
                            {settingsCount} setting
                            {settingsCount !== 1 ? "s" : ""}
                            {searchQuery && " (filtered)"}
                          </p>
                          {readmeLink && (
                            <a
                              href={readmeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 text-theme-text rounded-lg transition-all shadow-sm hover:scale-105"
                              title="Open settings documentation in GitHub README"
                            >
                              <Github className="w-3.5 h-3.5 text-theme-primary" />
                              <span>SETTINGS WIKI</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content - Different styling for WebUI Settings */}
                <div
                  className={
                    needsNoOverflow
                      ? "bg-theme-card rounded-xl border border-theme hover:border-theme-primary/50 transition-all shadow-sm"
                      : "bg-theme-card rounded-xl border border-theme overflow-hidden hover:border-theme-primary/50 transition-all shadow-sm"
                  }
                >
                  <div className="px-6 pb-6 bg-theme-bg/30 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {fields.map((key, index) => {
                        const value = usingFlatStructure
                          ? config[key]
                          : config[groupName]?.[key];

                        const displayName = getDisplayName(key);

                        // Create array to hold the field(s) to render
                        const fieldsToRender = [];

                        // Special styling for toggles to span both columns
                        const isFullWidthToggle =
                          (key === "NewLineOnSpecificSymbols" &&
                            groupName === "Text Formatting") ||
                          (key === "UsePosterResolutionOverlays" &&
                            groupName === "Resolution Overlays") ||
                          (key === "UseBackgroundResolutionOverlays" &&
                            groupName === "Resolution Overlays") ||
                          (key === "UseTCResolutionOverlays" &&
                            groupName === "Resolution Overlays");

                        // Special styling for Library Exclusion Selectors to span both columns
                        const isFullWidthLibrarySelector =
                          key === "PlexLibstoExclude" ||
                          key === "JellyfinLibstoExclude" ||
                          key === "EmbyLibstoExclude";

                        // Main field
                        fieldsToRender.push(
                          <div
                            key={key}
                            className={`space-y-3 ${
                              isFullWidthToggle || isFullWidthLibrarySelector
                                ? "lg:col-span-2"
                                : ""
                            }`}
                          >
                            <label className="block">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-theme-primary">
                                    {displayName}
                                  </span>
                                  {CONFIG_TOOLTIPS[key] && (
                                    <Tooltip text={CONFIG_TOOLTIPS[key]}>
                                      <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                    </Tooltip>
                                  )}
                                </div>
                                {key !== displayName && (
                                  <span className="text-xs text-theme-muted font-mono bg-theme-bg px-2 py-1 rounded">
                                    {getCleanSettingKey(key)}
                                  </span>
                                )}
                              </div>
                              {renderInput(groupName, key, value)}
                            </label>
                          </div>
                        );

                        // Insert WebUI Log Level dropdown after basicAuthPassword in WebUI Settings
                        if (
                          key === "basicAuthPassword" &&
                          groupName === "WebUI Settings"
                        ) {
                          fieldsToRender.push(
                            <div key="webuiLogLevel-ui" className="space-y-3">
                              <label className="block">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-theme-primary">
                                      WebUI Backend Log Level
                                    </span>
                                    {CONFIG_TOOLTIPS["webuiLogLevel"] && (
                                      <Tooltip
                                        text={CONFIG_TOOLTIPS["webuiLogLevel"]}
                                      >
                                        <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>

                                {/* WebUI Log Level Dropdown */}
                                <div
                                  className="relative"
                                  ref={webuiLogLevelDropdownRef}
                                >
                                  <button
                                    onClick={() =>
                                      setWebuiLogLevelDropdownOpen(
                                        !webuiLogLevelDropdownOpen
                                      )
                                    }
                                    className="w-full h-[42px] px-4 py-2.5 pr-10 bg-theme-bg border border-theme rounded-lg text-theme-text hover:bg-theme-hover hover:border-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-primary focus:border-theme-primary transition-all cursor-pointer shadow-sm flex items-center justify-between"
                                  >
                                    <span className="text-theme-text">
                                      {webuiLogLevel}
                                    </span>
                                    <ChevronDown
                                      className={`w-5 h-5 text-theme-muted transition-transform ${
                                        webuiLogLevelDropdownOpen
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    />
                                  </button>

                                  {webuiLogLevelDropdownOpen && (
                                    <div
                                      className="fixed z-50 rounded-lg bg-theme-card border border-theme shadow-lg"
                                      style={{
                                        left: webuiLogLevelDropdownRef.current?.getBoundingClientRect()
                                          .left,
                                        width:
                                          webuiLogLevelDropdownRef.current
                                            ?.offsetWidth,
                                        ...(getDropdownPosition(
                                          webuiLogLevelDropdownRef.current
                                        ).openUpward
                                          ? {
                                              bottom: getDropdownPosition(
                                                webuiLogLevelDropdownRef.current
                                              ).bottom,
                                            }
                                          : {
                                              top: getDropdownPosition(
                                                webuiLogLevelDropdownRef.current
                                              ).top,
                                            }),
                                      }}
                                    >
                                      <div className="p-2">
                                        <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                                          Select Log Level
                                        </div>
                                        {[
                                          "DEBUG",
                                          "INFO",
                                          "WARNING",
                                          "ERROR",
                                          "CRITICAL",
                                        ].map((level) => (
                                          <button
                                            key={level}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              setWebuiLogLevelDropdownOpen(
                                                false
                                              );
                                              updateWebuiLogLevel(level);
                                            }}
                                            className={`w-full px-3 py-2 rounded-md text-sm transition-colors text-left ${
                                              webuiLogLevel === level
                                                ? "bg-theme-primary text-white"
                                                : "text-gray-300 hover:bg-theme-hover"
                                            }`}
                                          >
                                            {level}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </label>
                            </div>
                          );
                        }

                        // Insert UseJellySync after UseJellyfin
                        if (
                          key === "UseJellyfin" &&
                          (groupName === "JellyfinPart" ||
                            groupName === "Jellyfin Settings")
                        ) {
                          // Check if UseJellyfin is enabled - if yes, disable the Sync toggle
                          const jellyfinEnabled = usingFlatStructure
                            ? config["UseJellyfin"] === "true" ||
                              config["UseJellyfin"] === true
                            : config["JellyfinPart"]?.UseJellyfin === "true" ||
                              config["JellyfinPart"]?.UseJellyfin === true;

                          fieldsToRender.push(
                            <div key="UseJellySync-ui" className="space-y-3">
                              <label className="block">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-theme-primary">
                                      Use JellySync
                                    </span>
                                    {CONFIG_TOOLTIPS["UseJellySync"] && (
                                      <Tooltip
                                        text={CONFIG_TOOLTIPS["UseJellySync"]}
                                      >
                                        <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                      </Tooltip>
                                    )}
                                  </div>
                                  <span className="text-xs text-theme-muted font-mono bg-theme-bg px-2 py-1 rounded">
                                    UI Only
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center justify-between h-[42px] px-4 bg-theme-bg rounded-lg border border-theme transition-all ${
                                    jellyfinEnabled
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:border-theme-primary/30"
                                  }`}
                                >
                                  <div className="text-sm font-medium text-theme-text">
                                    Use JellySync
                                    {jellyfinEnabled && (
                                      <span className="text-xs text-theme-muted ml-2">
                                        (Disabled when Jellyfin is active)
                                      </span>
                                    )}
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={useJellySync}
                                      onChange={(e) =>
                                        setUseJellySync(e.target.checked)
                                      }
                                      disabled={jellyfinEnabled}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-theme-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                  </label>
                                </div>
                              </label>
                            </div>
                          );
                        }

                        // Insert UseEmbySync after UseEmby
                        if (
                          key === "UseEmby" &&
                          (groupName === "EmbyPart" ||
                            groupName === "Emby Settings")
                        ) {
                          // Check if UseEmby is enabled - if yes, disable the Sync toggle
                          const embyEnabled = usingFlatStructure
                            ? config["UseEmby"] === "true" ||
                              config["UseEmby"] === true
                            : config["EmbyPart"]?.UseEmby === "true" ||
                              config["EmbyPart"]?.UseEmby === true;

                          fieldsToRender.push(
                            <div key="UseEmbySync-ui" className="space-y-3">
                              <label className="block">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-theme-primary">
                                      Use EmbySync
                                    </span>
                                    {CONFIG_TOOLTIPS["UseEmbySync"] && (
                                      <Tooltip
                                        text={CONFIG_TOOLTIPS["UseEmbySync"]}
                                      >
                                        <HelpCircle className="w-4 h-4 text-theme-muted hover:text-theme-primary cursor-help transition-colors" />
                                      </Tooltip>
                                    )}
                                  </div>
                                  <span className="text-xs text-theme-muted font-mono bg-theme-bg px-2 py-1 rounded">
                                    UI Only
                                  </span>
                                </div>
                                <div
                                  className={`flex items-center justify-between h-[42px] px-4 bg-theme-bg rounded-lg border border-theme transition-all ${
                                    embyEnabled
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:border-theme-primary/30"
                                  }`}
                                >
                                  <div className="text-sm font-medium text-theme-text">
                                    Use EmbySync
                                    {embyEnabled && (
                                      <span className="text-xs text-theme-muted ml-2">
                                        (Disabled when Emby is active)
                                      </span>
                                    )}
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={useEmbySync}
                                      onChange={(e) =>
                                        setUseEmbySync(e.target.checked)
                                      }
                                      disabled={embyEnabled}
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-theme-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                                  </label>
                                </div>
                              </label>
                            </div>
                          );
                        }

                        return fieldsToRender;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          });
        })()}

        {/* No Results Message */}
        {searchQuery && getFilteredGroupsByTab(activeTab).length === 0 && (
          <div className="bg-theme-card rounded-xl p-12 border border-theme text-center">
            <Search className="w-12 h-12 text-theme-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-theme-text mb-2">
              {t("configEditor.noSettingsFound")}
            </h3>
            <p className="text-theme-muted mb-4">
              {t("configEditor.noSettingsMatch", {
                query: searchQuery,
                tab: activeTab,
              })}
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-theme-text font-medium transition-all shadow-sm"
            >
              {t("configEditor.clearSearch")}
            </button>
          </div>
        )}
      </div>

      {/* Overlay Preview Modal */}
      {previewOverlay && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setPreviewOverlay(null)}
        >
          <div
            className="bg-theme-card rounded-xl border border-theme shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-theme sticky top-0 bg-theme-card z-10">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-theme-primary" />
                <h3 className="text-lg font-semibold text-theme-text">
                  {t("configEditor.overlayPreview")}
                </h3>
              </div>
              <button
                onClick={() => setPreviewOverlay(null)}
                className="p-2 hover:bg-theme-hover rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-theme-text" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-theme-muted mb-1">
                  {t("configEditor.filename")}:
                </p>
                <p className="text-theme-text font-mono bg-theme-bg px-3 py-2 rounded-lg border border-theme">
                  {previewOverlay}
                </p>
              </div>

              {/* Image Preview with Checkered Background */}
              <div className="relative bg-theme-bg rounded-lg border border-theme p-4 flex items-center justify-center overflow-hidden">
                {/* Checkered background for transparency */}
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #3a3a3a 25%, transparent 25%),
                      linear-gradient(-45deg, #3a3a3a 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #3a3a3a 75%),
                      linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)
                    `,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                ></div>
                <img
                  src={`${API_URL}/overlayfiles/preview/${encodeURIComponent(
                    previewOverlay
                  )}`}
                  alt={previewOverlay}
                  className="relative z-10 max-w-full h-auto object-contain rounded-lg shadow-lg"
                  style={{ maxHeight: "55vh" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div
                  className="hidden flex-col items-center gap-3 text-theme-muted relative z-10"
                  style={{ display: "none" }}
                >
                  <AlertCircle className="w-12 h-12" />
                  <p>{t("configEditor.failedLoadImage")}</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewOverlay(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Font Preview Modal */}
      {previewFont && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setPreviewFont(null)}
        >
          <div
            className="bg-theme-card rounded-xl border border-theme shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-theme sticky top-0 bg-theme-card z-10">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-theme-primary" />
                <h3 className="text-lg font-semibold text-theme-text">
                  {t("configEditor.fontPreview")}
                </h3>
              </div>
              <button
                onClick={() => setPreviewFont(null)}
                className="p-2 hover:bg-theme-hover rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-theme-text" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-theme-muted mb-1">
                  {t("configEditor.filename")}:
                </p>
                <p className="text-theme-text font-mono bg-theme-bg px-3 py-2 rounded-lg border border-theme">
                  {previewFont}
                </p>
              </div>

              {/* Font Preview Samples */}
              <div className="space-y-3">
                <div className="bg-theme-bg rounded-lg border border-theme p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.uppercase")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=ABCDEFGHIJKLMNOPQRSTUVWXYZ`}
                        alt="Uppercase letters"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.lowercase")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=abcdefghijklmnopqrstuvwxyz`}
                        alt="Lowercase letters"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.numbers")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=0123456789`}
                        alt="Numbers"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-theme-muted mb-1">
                        {t("configEditor.sample")}:
                      </p>
                      <img
                        src={`${API_URL}/fonts/preview/${encodeURIComponent(
                          previewFont
                        )}?text=The Quick Brown Fox Jumps Over The Lazy Dog`}
                        alt="Sample text"
                        className="w-full h-auto object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setPreviewFont(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-theme-card hover:bg-theme-hover border border-theme hover:border-theme-primary/50 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigEditor;
