import React, { useState } from "react";
import { Palette, User, LogOut } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const TopNavbar = () => {
  const { t } = useTranslation();
  const { theme, setTheme, themes } = useTheme();
  const { isAuthEnabled, logout } = useAuth();
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const themeArray = Object.entries(themes).map(([id, config]) => ({
    id,
    name: config.name,
    color: config.variables["--theme-primary"],
  }));

  return (
    <div className="hidden md:block fixed top-0 left-0 right-0 bg-theme-card border-b border-theme z-40 h-16 md:pl-64 shadow-lg">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center"></div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher compact={true} />

          {/* Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-theme-hover transition-colors text-theme-text"
              title={t("topNavbar.changeTheme")}
            >
              <Palette className="w-5 h-5" />
            </button>

            {/* Theme Dropdown */}
            {isThemeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsThemeDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-theme-card border border-theme shadow-lg z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                      {t("topNavbar.selectTheme")}
                    </div>
                    {themeArray.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setIsThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          theme === t.id
                            ? "bg-theme-primary text-white"
                            : "text-gray-300 hover:bg-theme-hover"
                        }`}
                      >
                        <span>{t.name}</span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Icon with Dropdown (only if auth is enabled) */}
          {isAuthEnabled ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-theme-hover transition-colors text-theme-text"
                title={t("topNavbar.userMenu")}
              >
                <User className="w-5 h-5" />
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-theme-card border border-theme shadow-lg z-50">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t("topNavbar.signOut")}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-theme-hover transition-colors text-theme-text"
              title={t("topNavbar.userProfile")}
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
