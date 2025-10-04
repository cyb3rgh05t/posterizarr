import React, { useState, useEffect } from "react";
import { Save, RefreshCw, AlertCircle } from "lucide-react";

const API_URL = "http://localhost:8000/api";

function ConfigEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/config`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        // Expand first section by default
        const firstSection = Object.keys(data.config)[0];
        setExpandedSections({ [firstSection]: true });
      } else {
        setError("Failed to load config");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Configuration saved successfully!");
      } else {
        setError("Failed to save config");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateValue = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const renderInput = (section, key, value) => {
    const type = typeof value;
    const keyLower = key.toLowerCase();

    // Ensure value is always a string for text inputs
    const stringValue =
      value === null || value === undefined ? "" : String(value);

    if (type === "boolean") {
      return (
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={value === "true" || value === true}
            onChange={(e) =>
              updateValue(section, key, e.target.checked ? "true" : "false")
            }
            className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
          />
          <span
            className={
              value === "true" || value === true
                ? "text-green-400"
                : "text-gray-400"
            }
          >
            {value === "true" || value === true ? "Enabled" : "Disabled"}
          </span>
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <input
          type="text"
          value={value.join(", ")}
          onChange={(e) =>
            updateValue(
              section,
              key,
              e.target.value.split(",").map((v) => v.trim())
            )
          }
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Comma-separated values"
        />
      );
    }

    // Determine if this should be a number input
    // Only treat as number if it's actually a number OR if it's a numeric string
    // in a field that should be numeric (like width, height, size, etc.)
    const isNumericField =
      type === "number" ||
      (type === "string" &&
        !isNaN(value) &&
        value !== "" &&
        // Only treat as number if key name suggests it should be numeric
        (keyLower.includes("width") ||
          keyLower.includes("height") ||
          keyLower.includes("size") ||
          keyLower.includes("point") ||
          keyLower.includes("offset") ||
          keyLower.includes("spacing") ||
          keyLower.includes("border") ||
          keyLower.includes("max") ||
          keyLower.includes("min") ||
          keyLower === "loglevel"));

    if (isNumericField) {
      return (
        <input
          type="number"
          value={stringValue}
          onChange={(e) => updateValue(section, key, e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      );
    }

    // Determine if this should be a textarea (based on field name for paths/files)
    const isPathOrFileField =
      keyLower.includes("path") ||
      keyLower.includes("file") ||
      keyLower.includes("font") ||
      keyLower.includes("overlay") ||
      stringValue.includes("\\") ||
      stringValue.includes("/") ||
      stringValue.length > 80;

    if (isPathOrFileField) {
      return (
        <textarea
          value={stringValue}
          onChange={(e) => updateValue(section, key, e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-y"
        />
      );
    }

    // Regular string
    return (
      <input
        type="text"
        value={stringValue}
        onChange={(e) => updateValue(section, key, e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder={
          keyLower.includes("color") ? "e.g., white, black, #FF0000" : ""
        }
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
          <div>
            <h3 className="font-semibold text-red-400">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-purple-400">Configuration</h1>
        <div className="flex space-x-3">
          <button
            onClick={fetchConfig}
            className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {config &&
          Object.entries(config).map(([section, values]) => (
            <div
              key={section}
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
              >
                <h2 className="text-xl font-semibold text-purple-400">
                  {section}
                </h2>
                <span className="text-gray-400">
                  {expandedSections[section] ? "−" : "+"}
                </span>
              </button>

              {expandedSections[section] && (
                <div className="px-6 py-4 border-t border-gray-700 space-y-4">
                  {typeof values === "object" && !Array.isArray(values) ? (
                    Object.entries(values).map(([key, value]) => (
                      <div
                        key={key}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start"
                      >
                        <label className="text-sm font-medium text-gray-300 md:col-span-1 pt-2">
                          {key}
                        </label>
                        <div className="md:col-span-2">
                          {renderInput(section, key, value)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">
                      {JSON.stringify(values)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default ConfigEditor;
