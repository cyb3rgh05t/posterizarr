import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "en", name: "English", flag: "EN" },
    { code: "de", name: "Deutsch", flag: "DE" },
    { code: "fr", name: "Français", flag: "FR" },
    { code: "it", name: "Italiano", flag: "IT" },
    { code: "pt", name: "Português", flag: "PT" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          title={t("language.selectLanguage")}
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm font-medium">{currentLanguage.flag}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-theme-card border border-theme shadow-lg z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  {t("language.selectLanguage")}
                </div>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      i18n.language === lang.code
                        ? "bg-theme-primary text-white"
                        : "text-gray-300 hover:bg-theme-hover"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold ${
                          i18n.language === lang.code
                            ? "text-white"
                            : "text-theme-primary"
                        }`}
                      >
                        {lang.flag}
                      </span>
                      <span>{lang.name}</span>
                    </div>
                    {i18n.language === lang.code && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-[var(--color-text)]">
            {t("language.title")}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            {currentLanguage.flag} {currentLanguage.name}
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-2 rounded-lg bg-theme-card border border-theme shadow-lg z-50">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-theme-muted uppercase tracking-wider">
                {t("language.selectLanguage")}
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    i18n.language === lang.code
                      ? "bg-theme-primary text-white"
                      : "text-gray-300 hover:bg-theme-hover"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${
                        i18n.language === lang.code
                          ? "text-white"
                          : "text-theme-primary"
                      }`}
                    >
                      {lang.flag}
                    </span>
                    <span>{lang.name}</span>
                  </div>
                  {i18n.language === lang.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
