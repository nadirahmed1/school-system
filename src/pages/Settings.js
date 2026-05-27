// ============================================================
// Settings.js  —  Supabase version (localStorage waa la bedeshay)
// Dhig: src/pages/Settings.js  (beddel kan hore)
// ============================================================
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { saveSchoolSettings } from "./useSchoolSettings";

// ============================================================
// CSS Variables helper
// ============================================================
function applyCSSVariables(settings) {
  const root = document.documentElement;
  if (settings.primaryColor) root.style.setProperty("--primary", settings.primaryColor);
  if (settings.accentColor)  root.style.setProperty("--accent",  settings.accentColor);
  if (settings.sidebarColor) root.style.setProperty("--sidebar", settings.sidebarColor);
}

// ============================================================
// PASSWORD HELPERS  —  Supabase (admin_credentials table)
// ============================================================
async function getAdminCreds() {
  const { data, error } = await supabase
    .from("admin_credentials")
    .select("email, password_hash")
    .single();

  if (error || !data) {
    return { email: "admin@dugsi.so", password: "Admin@2024" };
  }
  return { email: data.email, password: data.password_hash };
}

async function setAdminCreds(email, newPassword) {
  const { error } = await supabase
    .from("admin_credentials")
    .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
    .eq("email", email);

  if (error) throw new Error(error.message);
}

// ============================================================
// PASSWORD FIELD COMPONENT
// ============================================================
function PasswordField({ label, fieldKey, value, showPw, onToggle, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#333" }}>
        {label} *
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showPw ? "text" : "password"}
          value={value}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          style={{
            width: "100%", padding: "10px 44px 10px 14px",
            border: "2px solid #e2e8f0", borderRadius: 8,
            fontSize: 15, outline: "none", boxSizing: "border-box", background: "#fff",
          }}
        />
        <button type="button" onClick={() => onToggle(fieldKey)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888", padding: 0 }}>
          {showPw ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PASSWORD CHANGE  —  Supabase
// ============================================================
function PasswordChange() {
  const [form, setForm]       = useState({ old: "", new_: "", confirm: "" });
  const [show, setShow]       = useState({ old: false, new_: false, confirm: false });
  const [msg,  setMsg]        = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(key, val) { setForm((p) => ({ ...p, [key]: val })); }
  function handleToggle(key)      { setShow((p) => ({ ...p, [key]: !p[key] })); }

  async function handleSubmit() {
    setMsg("");

    // Xaqiiji
    if (!form.old.trim())          { setMsg("❌ Geli password-kii hore.");            return; }
    if (!form.new_.trim())         { setMsg("❌ Geli password cusub.");               return; }
    if (form.new_.length < 6)      { setMsg("❌ Password cusub ugu yaraan 6 xaraf."); return; }
    if (form.new_ !== form.confirm){ setMsg("❌ Password cusub kuma xidna.");          return; }

    setLoading(true);
    try {
      // Supabase-ka ka hel password-ka hadda jira
      const creds = await getAdminCreds();

      if (form.old !== creds.password) {
        setMsg("❌ Password-kii hore waa khalad.");
        return;
      }
      if (form.new_ === creds.password) {
        setMsg("❌ Password cusub isku mid baa ahan kan hore.");
        return;
      }

      // Supabase-ka ku kaydi password cusub
      await setAdminCreds(creds.email, form.new_);
      setMsg("✅ Password si guul leh ayaa loo bedelay!");
      setForm({ old: "", new_: "", confirm: "" });
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      setMsg("❌ Khalad: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>🔑 Password Beddel</h3>

      {/* Honeypot */}
      <div style={{ display: "none" }}>
        <input type="text" readOnly />
        <input type="password" readOnly />
      </div>

      <PasswordField label="Password-kii Hore"      fieldKey="old"     value={form.old}     showPw={show.old}     onToggle={handleToggle} onChange={handleChange} />
      <PasswordField label="Password Cusub"          fieldKey="new_"    value={form.new_}    showPw={show.new_}    onToggle={handleToggle} onChange={handleChange} />
      <PasswordField label="Password Cusub Xaqiiji"  fieldKey="confirm" value={form.confirm} showPw={show.confirm} onToggle={handleToggle} onChange={handleChange} />

      <div style={{ padding: "10px 14px", background: "#fef9c3", borderRadius: 8, fontSize: 13, color: "#854d0e", marginBottom: 12 }}>
        ⚠️ Password cusub ugu yaraan 6 xaraf.
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14,
          background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
          color:      msg.startsWith("✅") ? "#065f46" : "#dc2626" }}>
          {msg}
        </div>
      )}

      <button type="button" onClick={handleSubmit} disabled={loading}
        style={{ width: "100%", padding: 11, background: loading ? "#94a3b8" : "#1e5fa0", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "⏳ Sugaya..." : "🔑 Password Beddel"}
      </button>
    </div>
  );
}

// ============================================================
// LOGO UPLOAD  —  Supabase
// ============================================================
function LogoUpload({ settings, onSave }) {
  const fileRef = useRef();
  const [preview, setPreview]   = useState(settings.logoUrl);
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg]           = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => { setPreview(settings.logoUrl); }, [settings.logoUrl]);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("❌ Fadlan dooro sawir (PNG, JPG, SVG)"); return; }
    if (file.size > 2 * 1024 * 1024)    { setMsg("❌ Sawirku waa inuu ka yar yahay 2MB");  return; }

    setSaving(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      const updated = { ...settings, logoUrl: base64 };

      const result = await saveSchoolSettings(updated);
      if (result.success) {
        onSave(updated);
        setMsg("✅ Logo si guul leh ayaa loo keydiniyay!");
      } else {
        setMsg("❌ Khalad: " + result.error);
      }
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    };
    reader.readAsDataURL(file);
  }

  async function removeLogo() {
    setSaving(true);
    const updated = { ...settings, logoUrl: null };
    const result = await saveSchoolSettings(updated);
    if (result.success) {
      setPreview(null);
      onSave(updated);
      setMsg("🗑️ Logo-ga la tirtirray");
    } else {
      setMsg("❌ Khalad: " + result.error);
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  }

  function handleDrop(e) { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>🏫 Logo-ga Dugsigu</h3>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 120, height: 120, border: "2px dashed #e2e8f0", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", flexShrink: 0, overflow: "hidden" }}>
          {preview ? <img src={preview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} /> : <span style={{ fontSize: 40 }}>🏫</span>}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !saving && fileRef.current.click()}
            style={{ border: `2px dashed ${dragging ? "#065f46" : "#e2e8f0"}`, borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: saving ? "not-allowed" : "pointer", background: dragging ? "#f0fdf4" : "#fafafa", transition: "all 0.2s", marginBottom: 10 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📤</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#333", marginBottom: 4 }}>Sawir halkan dhig ama guji</div>
            <div style={{ fontSize: 12, color: "#888" }}>PNG, JPG, SVG — max 2MB</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => fileRef.current.click()} disabled={saving}
              style={{ flex: 1, padding: "9px", background: saving ? "#94a3b8" : "#065f46", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "⏳ Keydaya..." : "📁 Sawir Dooro"}
            </button>
            {preview && (
              <button type="button" onClick={removeLogo} disabled={saving}
                style={{ padding: "9px 14px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
                🗑️ Tirtir
              </button>
            )}
          </div>
          {msg && (
            <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13,
              background: msg.startsWith("✅") ? "#d1fae5" : msg.startsWith("🗑️") ? "#f1f5f9" : "#fee2e2",
              color: msg.startsWith("✅") ? "#065f46" : msg.startsWith("🗑️") ? "#475569" : "#dc2626" }}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COLOR CUSTOMIZER  —  Supabase
// ============================================================
const COLOR_PRESETS = [
  { name: "Cagaar (Default)", primary: "#1a3a5c", accent: "#065f46", sidebar: "#1a3a5c" },
  { name: "Buluug Mugdi",     primary: "#1e3a5f", accent: "#1e5fa0", sidebar: "#1e3a5f" },
  { name: "Guduud",           primary: "#7f1d1d", accent: "#991b1b", sidebar: "#7f1d1d" },
  { name: "Guduud-Bunni",     primary: "#431407", accent: "#c2410c", sidebar: "#431407" },
  { name: "Madow Casri",      primary: "#111827", accent: "#374151", sidebar: "#111827" },
  { name: "Damson",           primary: "#3b0764", accent: "#7c3aed", sidebar: "#3b0764" },
];

function ColorCustomizer({ settings, onSave }) {
  const [local, setLocal] = useState({
    primaryColor: settings.primaryColor,
    accentColor:  settings.accentColor,
    sidebarColor: settings.sidebarColor,
  });
  const [status, setStatus] = useState(""); // "", "saving", "saved", "error"

  function applyPreset(p) {
    setLocal({ primaryColor: p.primary, accentColor: p.accent, sidebarColor: p.sidebar });
  }

  async function handleSave() {
    setStatus("saving");
    const updated = { ...settings, ...local };
    const result = await saveSchoolSettings(updated);
    if (result.success) {
      onSave(updated);
      setStatus("saved");
      setTimeout(() => setStatus(""), 2500);
    } else {
      setStatus("error");
      setTimeout(() => setStatus(""), 3000);
    }
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>🎨 Midabada Nidaamka</h3>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 10, fontWeight: 600 }}>Xulashooyin Diyaar ah:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLOR_PRESETS.map((p) => (
            <button key={p.name} type="button" onClick={() => applyPreset(p)}
              style={{ padding: "6px 12px", border: "2px solid #e2e8f0", borderRadius: 20, fontSize: 12, cursor: "pointer", background: "#fff", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, color: "#333" }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: p.accent, display: "inline-block" }} />{p.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        {[["Midabka Sidebar-ka", "sidebarColor"], ["Midabka Buttons/Links", "accentColor"], ["Midabka Header", "primaryColor"]].map(([label, key_]) => (
          <div key={key_} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <input type="color" value={local[key_]} onChange={(e) => setLocal((p) => ({ ...p, [key_]: e.target.value }))}
              style={{ width: 44, height: 36, border: "none", borderRadius: 8, cursor: "pointer", padding: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>{local[key_]}</div>
            </div>
            <div style={{ width: 60, height: 28, borderRadius: 6, background: local[key_] }} />
          </div>
        ))}
      </div>
      {/* Preview */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: 16 }}>
        <div style={{ background: local.sidebarColor, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: local.accentColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>A</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Preview Sidebar</span>
        </div>
        <div style={{ background: "#fff", padding: "12px 16px", display: "flex", gap: 10 }}>
          <button type="button" style={{ padding: "7px 16px", background: local.accentColor, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600 }}>Button Preview</button>
          <span style={{ color: local.accentColor, fontSize: 14, alignSelf: "center", fontWeight: 600 }}>Link Preview</span>
        </div>
      </div>
      <button type="button" onClick={handleSave} disabled={status === "saving"}
        style={{ width: "100%", padding: "11px", fontWeight: 700, fontSize: 15,
          background: status === "saved" ? "#d1fae5" : status === "error" ? "#fee2e2" : status === "saving" ? "#94a3b8" : local.accentColor,
          color:      status === "saved" ? "#065f46" : status === "error" ? "#dc2626" : "#fff",
          border: "none", borderRadius: 9, cursor: status === "saving" ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
        {status === "saved" ? "✅ Midabada La Keydiniyay!" : status === "saving" ? "⏳ Keydaya..." : status === "error" ? "❌ Khalad dhacay" : "💾 Midabada Kaydi"}
      </button>
    </div>
  );
}

// ============================================================
// SCHOOL NAME EDITOR  —  Supabase
// ============================================================
function SchoolNameEditor({ settings, onSave }) {
  const [name, setName]     = useState(settings.schoolName);
  const [status, setStatus] = useState(""); // "", "saving", "saved", "error"

  async function handleSave() {
    setStatus("saving");
    const updated = { ...settings, schoolName: name };
    const result = await saveSchoolSettings(updated);
    if (result.success) {
      onSave(updated);
      setStatus("saved");
      setTimeout(() => setStatus(""), 2500);
    } else {
      setStatus("error");
      setTimeout(() => setStatus(""), 3000);
    }
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>🏫 Magaca Dugsigu</h3>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
      <button type="button" onClick={handleSave} disabled={status === "saving"}
        style={{ width: "100%", padding: 11,
          background: status === "saved" ? "#d1fae5" : status === "error" ? "#fee2e2" : status === "saving" ? "#94a3b8" : "#065f46",
          color: status === "saved" ? "#065f46" : status === "error" ? "#dc2626" : "#fff",
          border: "none", borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: status === "saving" ? "not-allowed" : "pointer", transition: "all 0.3s" }}>
        {status === "saved" ? "✅ La Keydiniyay!" : status === "saving" ? "⏳ Keydaya..." : status === "error" ? "❌ Khalad dhacay" : "💾 Kaydi"}
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
  const [tab, setTab]           = useState("password");
  const [settings, setSettings] = useState({
    schoolName:   "TIJAABO SCHOOL",
    logoUrl:      null,
    primaryColor: "#1a3a5c",
    accentColor:  "#065f46",
    sidebarColor: "#1a3a5c",
  });
  const [loading, setLoading] = useState(true);

  // Supabase-ka ka soo jiid settings-ka
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("school_settings")
        .select("*")
        .eq("school_id", "default")
        .single();

      if (!error && data) {
        const loaded = {
          schoolName:   data.school_name   ?? "TIJAABO SCHOOL",
          logoUrl:      data.logo_url      ?? null,
          primaryColor: data.primary_color ?? "#1a3a5c",
          accentColor:  data.accent_color  ?? "#065f46",
          sidebarColor: data.sidebar_color ?? "#1a3a5c",
        };
        setSettings(loaded);
        applyCSSVariables(loaded);
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
          <div>Settings soo raraya...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#1a1a1a" }}>⚙️ Settings</h1>
        <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>Nidaamka dejinta</p>
      </div>
      <div style={{ padding: "24px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{ padding: "9px 16px", border: "2px solid", borderColor: tab === t.id ? settings.accentColor : "#e2e8f0", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", background: tab === t.id ? settings.accentColor : "#fff", color: tab === t.id ? "#fff" : "#475569", transition: "all 0.2s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          {tab === "password" && <PasswordChange />}
          {tab === "school"   && <SchoolNameEditor settings={settings} onSave={setSettings} />}
          {tab === "logo"     && <LogoUpload       settings={settings} onSave={setSettings} />}
          {tab === "colors"   && <ColorCustomizer  settings={settings} onSave={setSettings} />}
        </div>
      </div>
    </div>
  );
}
