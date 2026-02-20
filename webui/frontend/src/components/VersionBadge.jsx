import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const API_URL = "/api";
const REPO_URL = "https://github.com/fscorrupt/posterizarr/releases/latest";

let cachedVersionData = { version: null, isOutOfDate: false };

function VersionBadge() {
  const { t } = useTranslation();
  const [isOutOfDate, setIsOutOfDate] = useState(cachedVersionData.isOutOfDate);
  const [version, setVersion] = useState(cachedVersionData.version);

  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, 1 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkVersion = async () => {
    try {
      const response = await fetch(`${API_URL}/version`);
      const data = await response.json();
      if (data.local) {
        cachedVersionData = {
          version: data.local,
          isOutOfDate: data.is_update_available || false,
        };
        setVersion(data.local);
        setIsOutOfDate(data.is_update_available || false);
      }
    } catch (error) {
      console.error("Error checking version:", error);
    }
  };

  if (!version) return null;

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1 group transition-all"
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold tracking-widest text-theme-muted/60 group-hover:text-theme-text transition-colors">
          v{version}
        </span>
        {isOutOfDate && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
        )}
      </div>
      
      {isOutOfDate && (
        <span className="text-[10px] font-medium text-orange-400/80 group-hover:text-orange-400 transition-colors flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {t("versionBadge.updateAvailable")}
        </span>
      )}
    </a>
  );
}

export default VersionBadge;