import { useState, useEffect, useRef } from "react";

// ============================================================
// HELPERS - Logo & Theme persistence via localStorage
// ============================================================

function getSchoolSettings() {
  const d = localStorage.getItem("school_settings");
  return d ? JSON.parse(d) : {
    schoolName: "TIJAABO SCHOOL",
    logoUrl: null,
    primaryColor: "#1a3a5c",
    accentColor: "#065f46",
    sidebarColor: "#1a3a5c",
  };
}

function saveSchoolSettings(settings) {
  localStorage.setItem("school_settings", JSON.stringify(settings));
  applyCSSVariables(settings);
  window.dispatchEvent(new CustomEvent("school_settings_changed", { detail: settings }));
}

function applyCSSVariables(settings) {
  const root = document.documentElement;
  if (settings.primaryColor) root.style.setProperty("--primary", settings.primaryColor);
  if (settings.accentColor)  root.style.setProperty("--accent",  settings.accentColor);
  if (settings.sidebarColor) root.style.setProperty("--sidebar", settings.sidebarColor);
}

// ============================================================
// LOGO UPLOAD COMPONENT
// ============================================================
function LogoUpload({ settings, onSave }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(settings.logoUrl);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("❌ Fadlan dooro sawir (PNG, JPG, SVG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg("❌ Sawirku waa inuu ka yar yahay 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      const updated = { ...settings, logoUrl: base64 };
      saveSchoolSettings(updated);
      onSave(updated);
      setMsg("✅ Logo-ga si guul leh ayaa loo keydiniyay!");
      setTimeout(() => setMsg(""), 3000);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function removeLogo() {
    setPreview(null);
    const updated = { ...settings, logoUrl: null };
    saveSchoolSettings(updated);
    onSave(updated);
    setMsg("🗑️ Logo-ga la tirtirray");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>
        🏫 Logo-ga Dugsigu
      </h3>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Preview */}
        <div style={{
          width: 120, height: 120, border: "2px dashed #e2e8f0",
          borderRadius: 12, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#f8f9fa", flexShrink: 0, overflow: "hidden"
        }}>
          {preview
            ? <img src={preview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
            : <span style={{ fontSize: 40 }}>🏫</span>
          }
        </div>

        {/* Upload area */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? "#065f46" : "#e2e8f0"}`,
              borderRadius: 10, padding: "20px 16px", textAlign: "center",
              cursor: "pointer", background: dragging ? "#f0fdf4" : "#fafafa",
              transition: "all 0.2s", marginBottom: 10
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📤</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#333", marginBottom: 4 }}>
              Sawir halkan dhig ama guji
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>PNG, JPG, SVG — max 2MB</div>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => fileRef.current.click()}
              style={{
                flex: 1, padding: "9px", background: "#065f46", color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}
            >
              📁 Sawir Dooro
            </button>
            {preview && (
              <button
                onClick={removeLogo}
                style={{
                  padding: "9px 14px", background: "#fee2e2", color: "#dc2626",
                  border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, cursor: "pointer"
                }}
              >
                🗑️ Tirtir
              </button>
            )}
          </div>

          {msg && (
            <div style={{
              marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13,
              background: msg.startsWith("✅") ? "#d1fae5" : msg.startsWith("🗑️") ? "#f1f5f9" : "#fee2e2",
              color: msg.startsWith("✅") ? "#065f46" : msg.startsWith("🗑️") ? "#475569" : "#dc2626"
            }}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COLOR CUSTOMIZATION COMPONENT
// ============================================================
const COLOR_PRESETS = [
  { name: "Cagaar (Default)", primary: "#1a3a5c", accent: "#065f46", sidebar: "#1a3a5c" },
  { name: "Buluug Mugdi", primary: "#1e3a5f", accent: "#1e5fa0", sidebar: "#1e3a5f" },
  { name: "Guduud", primary: "#7f1d1d", accent: "#991b1b", sidebar: "#7f1d1d" },
  { name: "Guduud-Bunni", primary: "#431407", accent: "#c2410c", sidebar: "#431407" },
  { name: "Madow Casri", primary: "#111827", accent: "#374151", sidebar: "#111827" },
  { name: "Damson", primary: "#3b0764", accent: "#7c3aed", sidebar: "#3b0764" },
];

function ColorCustomizer({ settings, onSave }) {
  const [local, setLocal] = useState({
    primaryColor: settings.primaryColor,
    accentColor: settings.accentColor,
    sidebarColor: settings.sidebarColor,
  });
  const [saved, setSaved] = useState(false);

  function applyPreset(preset) {
    const updated = { ...local, primaryColor: preset.primary, accentColor: preset.accent, sidebarColor: preset.sidebar };
    setLocal(updated);
  }

  function handleSave() {
    const updated = { ...settings, ...local };
    saveSchoolSettings(updated);
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const ColorRow = ({ label, key_ }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <input
        type="color"
        value={local[key_]}
        onChange={(e) => setLocal((p) => ({ ...p, [key_]: e.target.value }))}
        style={{ width: 44, height: 36, border: "none", borderRadius: 8, cursor: "pointer", padding: 2 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{local[key_]}</div>
      </div>
      <div style={{ width: 60, height: 28, borderRadius: 6, background: local[key_] }} />
    </div>
  );

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>
        🎨 Midabada Nidaamka
      </h3>

      {/* Presets */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 10, fontWeight: 600 }}>Xulashooyin Diyaar ah:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              style={{
                padding: "6px 12px", border: "2px solid #e2e8f0",
                borderRadius: 20, fontSize: 12, cursor: "pointer",
                background: "#fff", display: "flex", alignItems: "center", gap: 6,
                fontWeight: 500, color: "#333"
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: p.accent, display: "inline-block" }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Manual pickers */}
      <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <ColorRow label="Midabka Sidebar-ka" key_="sidebarColor" />
        <ColorRow label="Midabka Aasaasiga (Buttons, Links)" key_="accentColor" />
        <ColorRow label="Midabka Madaxa (Header)" key_="primaryColor" />
      </div>

      {/* Live preview strip */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: 16 }}>
        <div style={{ background: local.sidebarColor, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: local.accentColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>A</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Preview Sidebar</span>
        </div>
        <div style={{ background: "#fff", padding: "12px 16px", display: "flex", gap: 10 }}>
          <button style={{ padding: "7px 16px", background: local.accentColor, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
            Button Preview
          </button>
          <span style={{ color: local.accentColor, fontSize: 14, alignSelf: "center", fontWeight: 600 }}>Link Preview</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: "100%", padding: "11px", fontWeight: 700, fontSize: 15,
          background: saved ? "#d1fae5" : local.accentColor,
          color: saved ? "#065f46" : "#fff",
          border: "none", borderRadius: 9, cursor: "pointer", transition: "all 0.3s"
        }}
      >
        {saved ? "✅ Midabada La Keydiniyay!" : "💾 Midabada Kaydi"}
      </button>
    </div>
  );
}

// ============================================================
// PASSWORD CHANGE COMPONENT - FIXED
// FIX 1: onKeyDown preventDefault si xarafka ugu dambeeya loogu darin form submit
// FIX 2: localStorage key "admin_credentials" si ula mid ah Login.js
// FIX 3: Xaqiiji inuu runtii bedelay ka hor inta aan la keydin
// ============================================================
function PasswordChange() {
  const [form, setForm] = useState({ old: "", new_: "", confirm: "" });
  const [show, setShow] = useState({ old: false, new_: false, confirm: false });
  const [msg, setMsg] = useState("");

  // FIX: Isticmaal "admin_credentials" key si ula mid ah Login.js
  const DEFAULT_CREDS = { email: "admin@dugsi.so", password: "Admin@2024" };

  function getCurrentPassword() {
    const stored = localStorage.getItem("admin_credentials");
    if (stored) {
      try {
        return JSON.parse(stored).password;
      } catch {
        return DEFAULT_CREDS.password;
      }
    }
    return DEFAULT_CREDS.password;
  }

  function handleSubmit() {
    // Xaqiiji goobaha
    if (!form.old.trim()) { setMsg("❌ Geli password-kii hore."); return; }
    if (!form.new_.trim()) { setMsg("❌ Geli password cusub."); return; }
    if (form.new_.length < 6) { setMsg("❌ Password-ka cusub ugu yaraan 6 xaraf ahaan."); return; }
    if (form.new_ !== form.confirm) { setMsg("❌ Password-yada cusub ma isu mid aha."); return; }

    // FIX: Hubi password-kii hore si sax ah
    const currentPassword = getCurrentPassword();
    if (form.old !== currentPassword) {
      setMsg("❌ Password-kii hore waa khalad.");
      return;
    }

    // FIX: Haddii cusub isku mid yahay kan hore, diid
    if (form.new_ === currentPassword) {
      setMsg("❌ Password-ka cusub waa inuu ka duwan yahay kan hore.");
      return;
    }

    // FIX: Keyd "admin_credentials" iyadoo email la ilaaliyo
    const existingCreds = localStorage.getItem("admin_credentials");
    let email = DEFAULT_CREDS.email;
    if (existingCreds) {
      try {
        email = JSON.parse(existingCreds).email || DEFAULT_CREDS.email;
      } catch {}
    }
    localStorage.setItem("admin_credentials", JSON.stringify({ email, password: form.new_ }));

    setMsg("✅ Password si guul leh ayaa loo bedelay!");
    setForm({ old: "", new_: "", confirm: "" });
    setTimeout(() => setMsg(""), 3000);
  }

  // FIX: onKeyDown - jooji Enter key si form submit looga fogaado
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  const Eye = ({ k }) => (
    <button
      type="button"
      onClick={() => setShow((p) => ({ ...p, [k]: !p[k] }))}
      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}
    >
      {show[k] ? "🙈" : "👁️"}
    </button>
  );

  const Field = ({ label, k }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#333" }}>{label} *</label>
      <div style={{ position: "relative" }}>
        <input
          type={show[k] ? "text" : "password"}
          value={form[k]}
          onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
          onKeyDown={handleKeyDown}
          style={{ width: "100%", padding: "10px 44px 10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }}
        />
        <Eye k={k} />
      </div>
    </div>
  );

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>🔑 Password Beddel</h3>
      <Field label="Password-kii Hore" k="old" />
      <Field label="Password Cusub" k="new_" />
      <Field label="Password Cusub Xaqiiji" k="confirm" />
      <div style={{ padding: "10px 14px", background: "#fef9c3", borderRadius: 8, fontSize: 13, color: "#854d0e", marginBottom: 16 }}>
        ⚠️ Password-ka cusub ugu yaraan 6 xaraf ahaan. Default: <strong>Admin@2024</strong>
      </div>
      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14,
          background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
          color: msg.startsWith("✅") ? "#065f46" : "#dc2626"
        }}>{msg}</div>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        style={{ width: "100%", padding: 11, background: "#1e5fa0", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
      >
        🔑 Password Beddel
      </button>
    </div>
  );
}

// ============================================================
// SCHOOL NAME COMPONENT
// ============================================================
function SchoolNameEditor({ settings, onSave }) {
  const [name, setName] = useState(settings.schoolName);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const updated = { ...settings, schoolName: name };
    saveSchoolSettings(updated);
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>🏫 Magaca Dugsigu</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
      />
      <button
        type="button"
        onClick={handleSave}
        style={{ width: "100%", padding: 11, background: saved ? "#d1fae5" : "#065f46", color: saved ? "#065f46" : "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}
      >
        {saved ? "✅ La Keydiniyay!" : "💾 Kaydi"}
      </button>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS PAGE
// ============================================================
const TABS = [
  { id: "password", label: "🔑 Password Beddel" },
  { id: "school",   label: "🏫 Dugsigu" },
  { id: "logo",     label: "🖼️ Logo" },
  { id: "colors",   label: "🎨 Midabada" },
];

export default function Settings() {
  const [tab, setTab] = useState("password");
  const [settings, setSettings] = useState(getSchoolSettings());

  useEffect(() => {
    applyCSSVariables(settings);
  }, []);

  function handleSave(updated) {
    setSettings(updated);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#1a1a1a" }}>⚙️ Settings</h1>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>Nidaamka dejinta</p>
      </div>

      <div style={{ padding: "24px", maxWidth: 640, margin: "0 auto" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "9px 16px", border: "2px solid",
                borderColor: tab === t.id ? settings.accentColor : "#e2e8f0",
                borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer",
                background: tab === t.id ? settings.accentColor : "#fff",
                color: tab === t.id ? "#fff" : "#475569",
                transition: "all 0.2s"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {tab === "password" && <PasswordChange />}
          {tab === "school"   && <SchoolNameEditor settings={settings} onSave={handleSave} />}
          {tab === "logo"     && <LogoUpload settings={settings} onSave={handleSave} />}
          {tab === "colors"   && <ColorCustomizer settings={settings} onSave={handleSave} />}
        </div>
      </div>
    </div>
  );
}
