// Sidebar.js - SNIPPET
// Sidebar-kaaga hore ku dar 2 shay:
// 1) import useSchoolSettings
// 2) Logo iyo magaca beddel si dynamic ah

import { useSchoolSettings } from "./useSchoolSettings";
// ... imports kale

export default function Sidebar() {
  const settings = useSchoolSettings();
  // ... code kale ee hore

  return (
    <div style={{
      width: 220,
      minHeight: "100vh",
      background: settings.sidebarColor,  // ← dynamic midab
      // ... styles kale
    }}>

      {/* LOGO SECTION - ku beddel wixii hore */}
      <div style={{ padding: "20px 16px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="School Logo"
            style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 8 }}
          />
        ) : (
          <span style={{ fontSize: 40 }}>🏫</span>
        )}
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 6 }}>
          {settings.schoolName}
        </div>
      </div>

      {/* ... nav items kale */}
    </div>
  );
}
