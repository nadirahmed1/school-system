// useSchoolSettings.js - Supabase version (was: localStorage)
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";


const DEFAULT_SETTINGS = {
  schoolName: "Nidaamka Dugsiga",
  logoUrl: null,
  primaryColor: "#1a3a5c",
  accentColor: "#065f46",
  sidebarColor: "#1a3a5c",
};

export function useSchoolSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();

    // Dhageyso isbedelka settings-ka meel kasta
    function onSettingsChange(e) {
      setSettings(e.detail);
    }
    window.addEventListener("school_settings_changed", onSettingsChange);
    return () => window.removeEventListener("school_settings_changed", onSettingsChange);
  }, []);

  async function loadSettings() {
    const { data, error } = await supabase
      .from("school_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .single();

    if (data && !error) {
      const s = {
        schoolName: data.school_name,
        logoUrl: data.logo_url,
        primaryColor: data.primary_color,
        accentColor: data.accent_color,
        sidebarColor: data.sidebar_color,
      };
      setSettings(s);
      applyCSSVariables(s);
    }
  }

  return settings;
}

export function applyCSSVariables(settings) {
  const root = document.documentElement;
  if (settings.primaryColor) root.style.setProperty("--primary", settings.primaryColor);
  if (settings.accentColor)  root.style.setProperty("--accent",  settings.accentColor);
  if (settings.sidebarColor) root.style.setProperty("--sidebar", settings.sidebarColor);
}
