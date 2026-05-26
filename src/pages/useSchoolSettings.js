// useSchoolSettings.js
// Hook-kan ku dar components/useSchoolSettings.js
// Isticmaal Sidebar-ka iyo meel kasta oo logo/midab u baahan

import { useState, useEffect } from "react";

export function useSchoolSettings() {
  const [settings, setSettings] = useState(() => {
    const d = localStorage.getItem("school_settings");
    return d ? JSON.parse(d) : {
      schoolName: "TIJAABO SCHOOL",
      logoUrl: null,
      primaryColor: "#1a3a5c",
      accentColor: "#065f46",
      sidebarColor: "#1a3a5c",
    };
  });

  useEffect(() => {
    function onSettingsChange(e) {
      setSettings(e.detail);
    }
    window.addEventListener("school_settings_changed", onSettingsChange);
    return () => window.removeEventListener("school_settings_changed", onSettingsChange);
  }, []);

  return settings;
}
