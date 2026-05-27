// ============================================================
// useSchoolSettings.js  —  Supabase version (localStorage waa la bedeshay)
// Dhig: src/pages/useSchoolSettings.js  (beddel kan hore)
// ============================================================
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_SETTINGS = {
  schoolName:   "TIJAABO SCHOOL",
  logoUrl:      null,
  primaryColor: "#1a3a5c",
  accentColor:  "#065f46",
  sidebarColor: "#1a3a5c",
};

// CSS variables apply (UI-ga si degdeg ah u cusboonaysii)
function applyCSSVariables(settings) {
  const root = document.documentElement;
  if (settings.primaryColor) root.style.setProperty("--primary", settings.primaryColor);
  if (settings.accentColor)  root.style.setProperty("--accent",  settings.accentColor);
  if (settings.sidebarColor) root.style.setProperty("--sidebar", settings.sidebarColor);
}

// DB row → app settings (magacyada bidix=DB, midig=App)
function rowToSettings(row) {
  if (!row) return DEFAULT_SETTINGS;
  return {
    schoolName:   row.school_name   ?? DEFAULT_SETTINGS.schoolName,
    logoUrl:      row.logo_url      ?? null,
    primaryColor: row.primary_color ?? DEFAULT_SETTINGS.primaryColor,
    accentColor:  row.accent_color  ?? DEFAULT_SETTINGS.accentColor,
    sidebarColor: row.sidebar_color ?? DEFAULT_SETTINGS.sidebarColor,
  };
}

// App settings → DB row
function settingsToRow(settings) {
  return {
    school_name:   settings.schoolName,
    logo_url:      settings.logoUrl,
    primary_color: settings.primaryColor,
    accent_color:  settings.accentColor,
    sidebar_color: settings.sidebarColor,
    updated_at:    new Date().toISOString(),
  };
}

// ============================================================
// Hook: useSchoolSettings
// Isticmaal: const settings = useSchoolSettings();
// ============================================================
export function useSchoolSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // Xogta soo jiid Supabase-ka
    async function fetchSettings() {
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .eq("school_id", "default")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Settings load error:", error.message);
        return;
      }

      const loaded = rowToSettings(data);
      setSettings(loaded);
      applyCSSVariables(loaded);
    }

    fetchSettings();

    // Realtime: haddii aalad kale ay beddeshay, si toos ah u cusboonaysii
    const channel = supabase
      .channel("school_settings_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "school_settings" },
        (payload) => {
          const updated = rowToSettings(payload.new);
          setSettings(updated);
          applyCSSVariables(updated);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return settings;
}

// ============================================================
// Helper: saveSchoolSettings  —  Supabase-ka ku keydi
// Settings.js wuxuu isticmaalaa tani
// ============================================================
export async function saveSchoolSettings(settings) {
  const { error } = await supabase
    .from("school_settings")
    .upsert(
      { school_id: "default", ...settingsToRow(settings) },
      { onConflict: "school_id" }
    );

  if (error) {
    console.error("Settings save error:", error.message);
    return { success: false, error: error.message };
  }

  // CSS-ga si toos ah u cusboonaysii browser-ka hadda
  applyCSSVariables(settings);

  // Event shid (si components kale u ogaadaan)
  window.dispatchEvent(
    new CustomEvent("school_settings_changed", { detail: settings })
  );

  return { success: true };
}
