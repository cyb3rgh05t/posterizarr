import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import { X, RefreshCw, Loader2, AlertCircle, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const LibraryExclusionSelector = ({
  value = [],
  onChange,
  label,
  helpText,
  mediaServerType, // 'plex', 'jellyfin', or 'emby'
  config, // Full config object to get connection details
  disabled = false, // New prop for disabled state
  showIncluded = false, // New prop to show included libraries section
}) => {
  const { t } = useTranslation();

  // --- All useState hooks must come first ---
  const [excludedLibraries, setExcludedLibraries] = useState([]);
  const [availableLibraries, setAvailableLibraries] = useState([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);
  const [error, setError] = useState(null);
  const [librariesFetched, setLibrariesFetched] = useState(false);

  // Separate state for DB-cached data (shown in boxes)
  const [cachedLibraries, setCachedLibraries] = useState([]);
  const [cachedExclusions, setCachedExclusions] = useState([]);

  // --- THEN, the useMemo hooks that depend on state ---
  // Create a Set of all valid library names from the server list
  const validLibraryNames = React.useMemo(() => {
    return new Set(cachedLibraries.map((lib) => lib.name));
  }, [cachedLibraries]);

  // Create a *filtered* list of exclusions
  // This list only contains libraries that are BOTH in the exclusion list AND on the server
  const validExclusions = React.useMemo(() => {
    // We use cachedExclusions as it's the source for the summary boxes
    return cachedExclusions.filter((name) => validLibraryNames.has(name));
  }, [cachedExclusions, validLibraryNames]);

  // Create the *filtered* list of included libraries
  const validIncluded = React.useMemo(() => {
    const exclusionSet = new Set(validExclusions);
    return cachedLibraries.filter((lib) => !exclusionSet.has(lib.name));
  }, [cachedLibraries, validExclusions]);

  // --- FINALLY, the variables that depend on the useMemo hooks ---
  const excludedCount = validExclusions.length;
  const includedCount = validIncluded.length;

  // --- The rest of your code (useEffect, functions, return) ---

  // Initialize from value prop
  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      setExcludedLibraries(value);
    }
  }, [value]);

  // Load ONLY exclusion/inclusion info from DB (not for fetching)
  useEffect(() => {
    if (!disabled) {
      loadCachedExclusionsForDisplay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run only once on mount

  // THIS IS THE CORRECTED loadCachedExclusionsForDisplay
  const loadCachedExclusionsForDisplay = async () => {
    try {
      const response = await fetch(`/api/libraries/${mediaServerType}/cached`);
      const data = await response.json();

      if (data.success) {
        // Store cached libraries for display
        if (data.libraries && data.libraries.length > 0) {
          setCachedLibraries(data.libraries);
        }

        // --- NEW LOGIC ---
        // Trust the 'value' prop (from the main config) as the source of truth
        const exclusions =
          Array.isArray(value) && value.length > 0
            ? value
            : data.excluded || []; // Fallback to DB cache if 'value' is empty

        setCachedExclusions(exclusions);
        setExcludedLibraries(exclusions);

        // Only call onChange if the DB/value is different from current state
        if (JSON.stringify(exclusions) !== JSON.stringify(value)) {
          onChange(exclusions);
        }
        // --- END NEW LOGIC ---
      }
    } catch (err) {
      console.log("No cached data in database, using config 'value'");
      // If DB query fails, just use the 'value' prop from the config
      if (Array.isArray(value)) {
        setCachedExclusions(value);
      }
    }
  };

  const getMediaServerConfig = () => {
    if (!config) return null;

    if (mediaServerType === "plex") {
      return {
        url: config.PlexPart?.PlexUrl || config.PlexUrl,
        token: config.ApiPart?.PlexToken || config.PlexToken,
      };
    } else if (mediaServerType === "jellyfin") {
      return {
        url: config.JellyfinPart?.JellyfinUrl || config.JellyfinUrl,
        api_key: config.ApiPart?.JellyfinAPIKey || config.JellyfinAPIKey,
      };
    } else if (mediaServerType === "emby") {
      return {
        url: config.EmbyPart?.EmbyUrl || config.EmbyUrl,
        api_key: config.ApiPart?.EmbyAPIKey || config.EmbyAPIKey,
      };
    }
    return null;
  };

  // THIS IS THE CORRECTED fetchLibraries
  const fetchLibraries = async () => {
    setLoadingLibraries(true);
    setError(null);

    const serverConfig = getMediaServerConfig();
    if (!serverConfig) {
      setError(t("libraryExclusion.configNotFound"));
      setLoadingLibraries(false);
      return;
    }

    try {
      // Get the current stale list *from state*. (e.g., your 14 libraries)
      // This state was populated on load by loadCachedExclusionsForDisplay
      const staleExclusions = cachedExclusions;

      // Then fetch fresh libraries from server
      const endpoint = `/api/libraries/${mediaServerType}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverConfig),
      });

      const data = await response.json();

      if (data.success && data.libraries) {
        const allFetchedLibraries = data.libraries; // Full list (e.g., 12 libs)

        // --- PRUNING LOGIC ---
        // Prune the stale list (14 items) against the fresh list (12 items)
        const freshLibraryNames = new Set(allFetchedLibraries.map(lib => lib.name));
        // This creates the list of 10 valid exclusions
        const validExclusions = staleExclusions.filter(name => freshLibraryNames.has(name));
        // --- END PRUNING LOGIC ---

        // Set the UI list to show ALL fetched libraries
        setAvailableLibraries(allFetchedLibraries);
        setLibrariesFetched(true);
        setError(null);

        // Set the exclusion state to the *pruned, valid* list (10 items)
        setExcludedLibraries(validExclusions);
        // Send the pruned list back to the config
        onChange(validExclusions);

        // Update the summary boxes
        setCachedLibraries(allFetchedLibraries); // Full list (12)
        setCachedExclusions(validExclusions); // Pruned list (10)

      } else {
        setError(data.error || t("libraryExclusion.fetchFailed"));
        setAvailableLibraries([]);
      }
    } catch (err) {
      setError(t("libraryExclusion.fetchError", { message: err.message }));
      setAvailableLibraries([]);
    } finally {
      setLoadingLibraries(false);
    }
  };

  // THIS IS THE CORRECTED toggleLibrary
  const toggleLibrary = (libraryName) => {
    // Removed 'async'
    let newExcluded;
    if (excludedLibraries.includes(libraryName)) {
      // Remove from excluded (include it)
      newExcluded = excludedLibraries.filter((name) => name !== libraryName);
    } else {
      // Add to excluded
      newExcluded = [...excludedLibraries, libraryName];
    }
    setExcludedLibraries(newExcluded);
    setCachedExclusions(newExcluded); // Update cached state for summary boxes
    onChange(newExcluded); // Update the main config
  };

  // THIS FUNCTION CAN BE DELETED, but is left for safety. It is not called.
  const updateExclusionsInDB = async (excluded) => {
    try {
      await fetch(`/api/libraries/${mediaServerType}/exclusions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ excluded_libraries: excluded }),
      });

      // Reload cached data for display boxes
      await loadCachedExclusionsForDisplay();
    } catch (err) {
      console.error("Failed to update exclusions in database:", err);
    }
  };

  // THIS IS THE CORRECTED clearAll
  const clearAll = () => {
    // Removed 'async'
    setExcludedLibraries([]);
    setCachedExclusions([]);
    onChange([]);
  };

  // THIS IS THE CORRECTED excludeAll
  const excludeAll = () => {
    // Removed 'async'
    const allLibraryNames = availableLibraries.map((lib) => lib.name);
    setExcludedLibraries(allLibraryNames);
    setCachedExclusions(allLibraryNames);
    onChange(allLibraryNames);
  };

  // THIS IS THE CORRECTED getLibraryTypeIcon
  const getLibraryTypeIcon = (type) => {
    if (type === "movie" || type === "movies") {
      return "🎬"; // Movie
    } else if (type === "show" || type === "tvshows") {
      return "📺"; // TV Show
    } else if (type === "music") {
      return "🎵"; // Music
    } else if (type === "photo" || type === "photos") {
      return "📸"; // Photo
    } else if (type === "audiobook" || type === "audiobooks") {
      return "🎧"; // Audiobook
    } else if (type === "book" || type === "books") {
      return "📖"; // Book
    }
    // Plex uses 'artist' for music/audiobooks, but the backend is filtering them.
    // If the backend ever sends them, this will try to show an icon.
    else if (type === "artist") {
      return "🎤"; // Artist (fallback for music/audiobooks)
    }
    return "📁"; // Fallback for any other type
  };

  return (
    <div
      className={`space-y-3 ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {label && (
        <label className="block text-sm font-medium text-theme-text">
          {label}
        </label>
      )}

      {/* Disabled Message */}
      {disabled && (
        <div className="flex items-start gap-3 px-4 py-3 bg-theme-muted/10 border border-theme rounded-lg">
          <AlertCircle className="w-5 h-5 text-theme-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-theme-muted font-medium">
              {t("libraryExclusion.disabled")}
            </p>
            <p className="text-xs text-theme-muted/80 mt-1">
              {t("libraryExclusion.disabledHint", {
                server:
                  mediaServerType.charAt(0).toUpperCase() +
                  mediaServerType.slice(1),
              })}
            </p>
          </div>
        </div>
      )}

      {/* Fetch Libraries Button */}
      <div className="flex gap-2">
        <button
          onClick={fetchLibraries}
          disabled={loadingLibraries || disabled}
          className={`flex items-center gap-2 px-4 py-2.5 bg-theme-primary/20 hover:bg-theme-primary/30 border border-theme-primary/30 rounded-lg font-medium transition-all ${
            loadingLibraries || disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loadingLibraries ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="text-sm">
            {librariesFetched
              ? t("libraryExclusion.refreshLibraries")
              : t("libraryExclusion.fetchLibraries")}
          </span>
        </button>

        {librariesFetched && availableLibraries.length > 0 && !disabled && (
          <>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-theme-bg hover:bg-theme-hover border border-theme rounded-lg font-medium transition-all text-sm"
            >
              <Check className="w-4 h-4" />
              {t("libraryExclusion.includeAll")}
            </button>
            <button
              onClick={excludeAll}
              className="flex items-center gap-2 px-4 py-2 bg-theme-bg hover:bg-theme-hover border border-theme rounded-lg font-medium transition-all text-sm"
            >
              <X className="w-4 h-4" />
              {t("libraryExclusion.excludeAll")}
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400 font-medium">
              {t("libraryExclusion.errorTitle")}
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingLibraries && (
        <div className="flex items-center justify-center py-8 bg-theme-bg/50 border border-theme rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-theme-primary mx-auto mb-2" />
            <p className="text-sm text-theme-muted">
              {t("libraryExclusion.fetching", {
                server: mediaServerType,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Libraries List */}
      {!loadingLibraries &&
        librariesFetched &&
        availableLibraries.length > 0 && (
          <div className="space-y-2">
            <p
              className="text-sm text-theme-muted"
              dangerouslySetInnerHTML={{
                __html: t("libraryExclusion.selectToExclude"),
              }}
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableLibraries.map((library) => {
                const isExcluded = excludedLibraries.includes(library.name);
                return (
                  <div
                    key={library.name}
                    onClick={() => toggleLibrary(library.name)}
                    className={`flex items-center gap-3 px-4 py-3 border rounded-lg cursor-pointer transition-all ${
                      isExcluded
                        ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                        : "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
                    }`}
                  >
                    {/* Icon */}
                    <span className="text-2xl flex-shrink-0">
                      {getLibraryTypeIcon(library.type)}
                    </span>

                    {/* Library Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-theme-text">
                          {library.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-theme-bg rounded-full text-theme-muted">
                          {library.type}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExcluded ? (
                        <div className="flex items-center gap-1.5 text-red-400 text-sm font-medium">
                          <X className="w-4 h-4" />
                          <span>{t("libraryExclusion.excluded")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          <span>{t("libraryExclusion.included")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Empty State - No Libraries Fetched */}
      {!loadingLibraries && !librariesFetched && (
        <div className="px-4 py-8 bg-theme-bg/50 border-2 border-dashed border-theme rounded-lg text-center">
          <p className="text-sm text-theme-muted">
            {t("libraryExclusion.clickToFetch", {
              server:
                mediaServerType.charAt(0).toUpperCase() +
                mediaServerType.slice(1),
            })}
          </p>
        </div>
      )}

      {/* Empty State - No Libraries Found */}
      {!loadingLibraries &&
        librariesFetched &&
        availableLibraries.length === 0 &&
        !error && (
          <div className="px-4 py-8 bg-theme-bg/50 border border-theme rounded-lg text-center">
            <p className="text-sm text-theme-muted">
              {t("libraryExclusion.noLibraries")}
            </p>
          </div>
        )}

      {/* Separator between Fetch section and Status Boxes */}
      <div className="border-t border-theme-border/30 my-4"></div>

      {/* Excluded and Included Libraries - THIS IS THE CORRECTED MATH */}
      <div>
        <div className="grid grid-cols-2 gap-6">
          {/* Excluded Libraries */}
          <div className="px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400/80 font-medium mb-2">
              {t("libraryExclusion.excludedCount", {
                count: excludedCount, // <<< USES NEW COUNT
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {validExclusions.length > 0 ? ( // <<< USES NEW LIST
                validExclusions.map((libName) => ( // <<< USES NEW LIST
                  <span
                    key={libName}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30 flex items-center gap-1.5"
                  >
                    <X className="w-3 h-3" />
                    {libName}
                  </span>
                ))
              ) : (
                <span className="text-xs text-theme-muted italic">
                  {t("libraryExclusion.noneExcluded")}
                </span>
              )}
            </div>
          </div>

          {/* Included Libraries */}
          <div className="px-4 py-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <p className="text-xs text-green-400/80 font-medium mb-2">
              {t("libraryExclusion.includedCount", {
                count: includedCount, // <<< USES NEW COUNT
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {includedCount > 0 ? ( // <<< USES NEW COUNT
                validIncluded.map((lib) => ( // <<< USES NEW LIST
                  <span
                    key={lib.name}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30 flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    {lib.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-theme-muted italic">
                  {cachedLibraries.length === 0
                    ? t("libraryExclusion.noneExcluded")
                    : t("libraryExclusion.allExcluded")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      {helpText && <p className="text-xs text-theme-muted">{helpText}</p>}
    </div>
  );
};

export default LibraryExclusionSelector;