/**
 * Settings.js — UPDATED
 * Dhammaan settings waxay database Supabase ku keydiyaan
 * LocalStorage waa backup keliya (offline)
 */
import { useState, useEffect, useRef } from 'react'
import { saveSchoolSettings, fetchSchoolSettings } from './useSchoolSettings'
import { supabase } from '../lib/supabase'

// ── Password Field (dibadda component si focus uusan u lumin) ──
function PasswordField({ label, fieldKey, value, showPw, onToggle, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#333' }}>
        {label} *
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={showPw ? 'text' : 'password'}
          value={value}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          style={{ width: '100%', padding: '10px 44px 10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
        />
        <button type="button" onClick={() => onToggle(fieldKey)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888', padding: 0 }}>
          {showPw ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}

// ── Password Change — Database ku keyd ──────────────
function PasswordChange({ settings, onSaved }) {
  const [form, setForm] = useState({ old: '', new_: '', confirm: '' })
  const [show, setShow] = useState({ old: false, new_: false, confirm: false })
  const [msg,  setMsg]  = useState('')
  const [busy, setBusy] = useState(false)

  function handleChange(key, val) { setForm(p => ({ ...p, [key]: val })) }
  function handleToggle(key)      { setShow(p => ({ ...p, [key]: !p[key] })) }

  async function handleSubmit() {
    setMsg('')
    if (!form.old.trim())       { setMsg('❌ Geli password-kii hore.');            return }
    if (!form.new_.trim())      { setMsg('❌ Geli password cusub.');               return }
    if (form.new_.length < 6)   { setMsg('❌ Password cusub ugu yaraan 6 xaraf.'); return }
    if (form.new_ !== form.confirm) { setMsg('❌ Password cusub kuma xidna.');     return }

    // Hel password-ka hadda jira - DATABASE ka (single source of truth)
    const currentPw = settings?.admin_password || 'Admin@2024'

    if (form.old !== currentPw)   { setMsg('❌ Password-kii hore waa khalad.');   return }
    if (form.new_ === currentPw)  { setMsg('❌ Password cusub isku mid baa ahan.'); return }

    setBusy(true)
    // Keyd DATABASE ku (dhammaan device-yada ayay ka muuqan doontaa)
    const { error, offline } = await saveSchoolSettings({
      admin_email:    settings?.admin_email || 'admin@dugsi.so',
      admin_password: form.new_,
    })

    if (error) {
      setMsg('⚠️ Database khalad — localStorage ku keydiyay. Internet hubi.')
    } else {
      setMsg(offline
        ? '⚠️ Offline — localStorage ku keydiyay. Internet markuu yimaado database ku keydiya.'
        : '✅ Password si guul leh ayaa loo bedelay! (Database)')
      setForm({ old: '', new_: '', confirm: '' })
      onSaved && onSaved()
    }
    setBusy(false)
    setTimeout(() => setMsg(''), 5000)
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>🔑 Password Beddel</h3>
      <div style={{ padding: '10px 14px', background: '#e0f2fe', borderRadius: 8, fontSize: 13, color: '#0369a1', marginBottom: 16 }}>
        ℹ️ Password-ka database-ka ayaa lagu keydiyaa — meel kasta ayuu ka shaqeeyaa
      </div>
      <div style={{ display: 'none' }}>
        <input type="text" readOnly /><input type="password" readOnly />
      </div>
      <PasswordField label="Password-kii Hore"     fieldKey="old"     value={form.old}     showPw={show.old}     onToggle={handleToggle} onChange={handleChange} />
      <PasswordField label="Password Cusub"         fieldKey="new_"    value={form.new_}    showPw={show.new_}    onToggle={handleToggle} onChange={handleChange} />
      <PasswordField label="Password Cusub Xaqiiji" fieldKey="confirm" value={form.confirm} showPw={show.confirm} onToggle={handleToggle} onChange={handleChange} />
      <div style={{ padding: '10px 14px', background: '#fef9c3', borderRadius: 8, fontSize: 13, color: '#854d0e', marginBottom: 12 }}>
        ⚠️ Default: <strong>Admin@2024</strong> — hadda: <strong>{settings?.admin_password || 'Admin@2024'}</strong>
      </div>
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14,
          background: msg.startsWith('✅') ? '#d1fae5' : msg.startsWith('⚠️') ? '#fef9c3' : '#fee2e2',
          color:      msg.startsWith('✅') ? '#065f46' : msg.startsWith('⚠️') ? '#854d0e' : '#dc2626' }}>
          {msg}
        </div>
      )}
      <button type="button" onClick={handleSubmit} disabled={busy}
        style={{ width: '100%', padding: 11, background: busy ? '#94a3b8' : '#1e5fa0', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
        {busy ? '⏳ La keydiyaa...' : '🔑 Password Beddel'}
      </button>
    </div>
  )
}

// ── Logo Upload ──────────────────────────────────────
function LogoUpload({ settings, onSaved }) {
  const fileRef = useRef()
  const [preview,  setPreview]  = useState(settings?.logo_url)
  const [dragging, setDragging] = useState(false)
  const [msg,      setMsg]      = useState('')
  const [busy,     setBusy]     = useState(false)

  useEffect(() => { setPreview(settings?.logo_url) }, [settings?.logo_url])

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setMsg('❌ Fadlan dooro sawir (PNG, JPG, SVG)'); return }
    if (file.size > 2 * 1024 * 1024)    { setMsg('❌ Sawirku waa inuu ka yar yahay 2MB');  return }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result
      setPreview(base64)
      setBusy(true)
      const { error, offline } = await saveSchoolSettings({ logo_url: base64 })
      setBusy(false)
      if (error) {
        setMsg('❌ Keydinta waa fashilantay. Internet hubi.')
      } else {
        setMsg(offline ? '⚠️ Offline — localStorage ku keydiyay' : '✅ Logo database ku keydiyay! Meel kasta ayuu ka muuqdaa.')
        onSaved && onSaved()
      }
      setTimeout(() => setMsg(''), 4000)
    }
    reader.readAsDataURL(file)
  }

  async function removeLogo() {
    setPreview(null)
    setBusy(true)
    await saveSchoolSettings({ logo_url: null })
    setBusy(false)
    setMsg('🗑️ Logo-ga la tirtirray')
    onSaved && onSaved()
    setTimeout(() => setMsg(''), 2000)
  }

  function handleDrop(e) { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>🏫 Logo-ga Dugsigu</h3>
      <div style={{ padding: '10px 14px', background: '#e0f2fe', borderRadius: 8, fontSize: 13, color: '#0369a1', marginBottom: 16 }}>
        ℹ️ Logo database ayaa lagu keydiyaa — taleefan iyo laptop labadaba ayay ka muuqdaa
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 120, height: 120, border: '2px dashed #e2e8f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', flexShrink: 0, overflow: 'hidden' }}>
          {preview ? <img src={preview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} /> : <span style={{ fontSize: 40 }}>🏫</span>}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${dragging ? '#065f46' : '#e2e8f0'}`, borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#f0fdf4' : '#fafafa', transition: 'all 0.2s', marginBottom: 10 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📤</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#333', marginBottom: 4 }}>Sawir halkan dhig ama guji</div>
            <div style={{ fontSize: 12, color: '#888' }}>PNG, JPG, SVG — max 2MB</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => fileRef.current.click()} disabled={busy}
              style={{ flex: 1, padding: '9px', background: busy ? '#94a3b8' : '#065f46', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
              {busy ? '⏳ La keydiyaa...' : '📁 Sawir Dooro'}
            </button>
            {preview && (
              <button type="button" onClick={removeLogo}
                style={{ padding: '9px 14px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                🗑️ Tirtir
              </button>
            )}
          </div>
          {msg && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13,
              background: msg.startsWith('✅') ? '#d1fae5' : msg.startsWith('⚠️') ? '#fef9c3' : msg.startsWith('🗑️') ? '#f1f5f9' : '#fee2e2',
              color: msg.startsWith('✅') ? '#065f46' : msg.startsWith('⚠️') ? '#854d0e' : msg.startsWith('🗑️') ? '#475569' : '#dc2626' }}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Color Customizer ─────────────────────────────────
const COLOR_PRESETS = [
  { name: 'Cagaar (Default)', primary: '#1a3a5c', accent: '#065f46', sidebar: '#1a3a5c' },
  { name: 'Buluug',           primary: '#1e3a5f', accent: '#1e5fa0', sidebar: '#1e3a5f' },
  { name: 'Guduud',           primary: '#7f1d1d', accent: '#991b1b', sidebar: '#7f1d1d' },
  { name: 'Guduud-Bunni',     primary: '#431407', accent: '#c2410c', sidebar: '#431407' },
  { name: 'Madow Casri',      primary: '#111827', accent: '#374151', sidebar: '#111827' },
  { name: 'Damson',           primary: '#3b0764', accent: '#7c3aed', sidebar: '#3b0764' },
]

function ColorCustomizer({ settings, onSaved }) {
  const [local, setLocal] = useState({
    primary_color: settings?.primary_color || '#1a3a5c',
    accent_color:  settings?.accent_color  || '#065f46',
    sidebar_color: settings?.sidebar_color || '#1a3a5c',
  })
  const [saved, setSaved] = useState(false)
  const [busy,  setBusy]  = useState(false)

  useEffect(() => {
    setLocal({
      primary_color: settings?.primary_color || '#1a3a5c',
      accent_color:  settings?.accent_color  || '#065f46',
      sidebar_color: settings?.sidebar_color || '#1a3a5c',
    })
  }, [settings])

  async function handleSave() {
    setBusy(true)
    await saveSchoolSettings(local)
    setBusy(false)
    setSaved(true)
    onSaved && onSaved()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>🎨 Midabada Nidaamka</h3>
      <div style={{ padding: '10px 14px', background: '#e0f2fe', borderRadius: 8, fontSize: 13, color: '#0369a1', marginBottom: 16 }}>
        ℹ️ Midabada database ayaa lagu keydiyaa — meel kasta isku mid
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 10, fontWeight: 600 }}>Xulashooyin:</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLOR_PRESETS.map(p => (
            <button key={p.name} type="button"
              onClick={() => setLocal({ primary_color: p.primary, accent_color: p.accent, sidebar_color: p.sidebar })}
              style={{ padding: '6px 12px', border: '2px solid #e2e8f0', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: '#333' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.accent, display: 'inline-block' }} />{p.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        {[['Midabka Sidebar-ka', 'sidebar_color'], ['Midabka Buttons/Links', 'accent_color'], ['Midabka Header', 'primary_color']].map(([label, key_]) => (
          <div key={key_} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <input type="color" value={local[key_]} onChange={(e) => setLocal(p => ({ ...p, [key_]: e.target.value }))}
              style={{ width: 44, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{label}</div>
              <div style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{local[key_]}</div>
            </div>
            <div style={{ width: 60, height: 28, borderRadius: 6, background: local[key_] }} />
          </div>
        ))}
      </div>
      <button type="button" onClick={handleSave} disabled={busy}
        style={{ width: '100%', padding: 11, fontWeight: 700, fontSize: 15, background: saved ? '#d1fae5' : busy ? '#94a3b8' : local.accent_color, color: saved ? '#065f46' : '#fff', border: 'none', borderRadius: 9, cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
        {saved ? '✅ La Keydiniyay! (Database)' : busy ? '⏳ La keydiyaa...' : '💾 Midabada Kaydi'}
      </button>
    </div>
  )
}

// ── School Name Editor ───────────────────────────────
function SchoolNameEditor({ settings, onSaved }) {
  const [name, setName] = useState(settings?.school_name || '')
  const [saved, setSaved] = useState(false)
  const [busy,  setBusy]  = useState(false)

  useEffect(() => { setName(settings?.school_name || '') }, [settings?.school_name])

  async function handleSave() {
    if (!name.trim()) return
    setBusy(true)
    await saveSchoolSettings({ school_name: name.trim() })
    setBusy(false)
    setSaved(true)
    onSaved && onSaved()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>🏫 Magaca Dugsigu</h3>
      <div style={{ padding: '10px 14px', background: '#e0f2fe', borderRadius: 8, fontSize: 13, color: '#0369a1', marginBottom: 16 }}>
        ℹ️ Magaca database ayaa lagu keydiyaa — meel kasta isku mid
      </div>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
      <button type="button" onClick={handleSave} disabled={busy}
        style={{ width: '100%', padding: 11, background: saved ? '#d1fae5' : busy ? '#94a3b8' : '#065f46', color: saved ? '#065f46' : '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}>
        {saved ? '✅ La Keydiniyay! (Database)' : busy ? '⏳ La keydiyaa...' : '💾 Kaydi'}
      </button>
    </div>
  )
}

// ── MAIN SETTINGS PAGE ───────────────────────────────
const TABS = [
  { id: 'password', label: '🔑 Password Beddel' },
  { id: 'school',   label: '🏫 Dugsigu' },
  { id: 'logo',     label: '🖼️ Logo' },
  { id: 'colors',   label: '🎨 Midabada' },
]

export default function Settings() {
  const [tab,      setTab]      = useState('password')
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [syncMsg,  setSyncMsg]  = useState('')

  async function loadSettings(force = false) {
    setLoading(true)
    const s = await fetchSchoolSettings(force)
    setSettings(s)
    setLoading(false)
  }

  useEffect(() => { loadSettings() }, [])

  async function handleSaved() {
    await loadSettings(true) // Force refresh from DB
    setSyncMsg('✅ Database ku keydiyay!')
    setTimeout(() => setSyncMsg(''), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1a1a1a' }}>⚙️ Settings</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>Nidaamka dejinta — Database (Supabase)</p>
        </div>
        <button type="button" onClick={() => loadSettings(true)}
          style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
          🔄 Cusboonaysii
        </button>
      </div>

      {syncMsg && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>
          {syncMsg}
        </div>
      )}

      <div style={{ padding: '24px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={{ padding: '9px 16px', border: '2px solid', borderColor: tab === t.id ? (settings?.accent_color || '#065f46') : '#e2e8f0', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: tab === t.id ? (settings?.accent_color || '#065f46') : '#fff', color: tab === t.id ? '#fff' : '#475569', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 40, textAlign: 'center', color: '#888' }}>
            ⏳ Database ka soo jeediyaa...
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {tab === 'password' && <PasswordChange  settings={settings} onSaved={handleSaved} />}
            {tab === 'school'   && <SchoolNameEditor settings={settings} onSaved={handleSaved} />}
            {tab === 'logo'     && <LogoUpload       settings={settings} onSaved={handleSaved} />}
            {tab === 'colors'   && <ColorCustomizer  settings={settings} onSaved={handleSaved} />}
          </div>
        )}
      </div>
    </div>
  )
}
