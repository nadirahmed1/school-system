import React, { useState } from 'react'

export default function Settings({ user }) {
  const [tab, setTab] = useState('password')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newPass2, setNewPass2] = useState('')
  const [dugsiMagac, setDugsiMagac] = useState(localStorage.getItem('dugsi_magac') || '')
  const [msg, setMsg] = useState('')
  const [msgColor, setMsgColor] = useState('green')

  const showMsg = (text, color='green') => {
    setMsg(text); setMsgColor(color)
    setTimeout(() => setMsg(''), 3500)
  }

  const changePassword = () => {
    const defaultCreds = { email: 'admin@dugsi.so', password: 'Admin@2024' }
    const saved = JSON.parse(localStorage.getItem('admin_credentials') || JSON.stringify(defaultCreds))
    
    if (!oldPass) return showMsg('⚠️ Password-kii hore geli!', 'orange')
    if (oldPass !== saved.password) return showMsg('❌ Password-kii hore khalad!', 'red')
    if (!newPass) return showMsg('⚠️ Password cusub geli!', 'orange')
    if (newPass.length < 6) return showMsg('⚠️ Password-ka cusub ugu yaraan 6 xaraf!', 'orange')
    if (newPass !== newPass2) return showMsg('❌ Password-ka cusub isku mid maaha!', 'red')
    
    const updated = { ...saved, password: newPass }
    localStorage.setItem('admin_credentials', JSON.stringify(updated))
    setOldPass(''); setNewPass(''); setNewPass2('')
    showMsg('✅ Password-ka waa la beddelay si guul leh!')
  }

  const saveDugsiMagac = () => {
    if (!dugsiMagac.trim()) return showMsg('⚠️ Magaca dugsiga qor!', 'orange')
    localStorage.setItem('dugsi_magac', dugsiMagac.trim())
    showMsg('✅ Magaca dugsiga waa la keydiiyay!')
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>⚙️ Settings</h1>
        <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>Nidaamka dejinta</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[['password','🔑 Password Beddel'], ['dugsi','🏫 Magaca Dugsiga']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontWeight: '700', fontSize: '0.9rem',
            background: tab === t ? '#1a3a5c' : '#fff',
            color: tab === t ? '#fff' : '#5d6d7e',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>{label}</button>
        ))}
      </div>

      {msg && (
        <div style={{
          padding: '0.75rem 1rem',
          background: msgColor==='green' ? '#eafaf1' : msgColor==='red' ? '#fdedec' : '#fef9e7',
          border: '1px solid #ddd', borderRadius: '8px',
          color: msgColor==='green' ? '#27ae60' : msgColor==='red' ? '#e74c3c' : '#f39c12',
          marginBottom: '1rem', fontWeight: '600'
        }}>{msg}</div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '450px' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>🔑 Password Beddel</h3>
          {[
            { label: 'Password-kii Hore *', val: oldPass, set: setOldPass },
            { label: 'Password Cusub *', val: newPass, set: setNewPass },
            { label: 'Password Cusub Xaqiiji *', val: newPass2, set: setNewPass2 },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>{f.label}</label>
              <input
                type="password" value={f.val} onChange={e => f.set(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#3498db'}
                onBlur={e => e.target.style.borderColor = '#e8ecf0'}
              />
            </div>
          ))}
          <div style={{ padding: '0.75rem', background: '#fef9e7', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#856404' }}>
            ⚠️ Password-ka cusub ugu yaraan 6 xaraf ahaan
          </div>
          <button onClick={changePassword} style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #1a3a5c, #3498db)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
            🔑 Password Beddel
          </button>
        </div>
      )}

      {/* Dugsi Magac Tab */}
      {tab === 'dugsi' && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', maxWidth: '450px' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>🏫 Magaca Dugsiga</h3>
          
          {/* Show current saved name */}
          {localStorage.getItem('dugsi_magac') && (
            <div style={{ padding: '0.75rem', background: '#ebf5fb', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#1a5276' }}>
              📌 Magaca hadda: <strong>{localStorage.getItem('dugsi_magac')}</strong>
            </div>
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Magaca Cusub ee Dugsiga</label>
            <input
              value={dugsiMagac} onChange={e => setDugsiMagac(e.target.value)}
              placeholder="Tusaale: Dugsi Hoose Xoriyo"
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#27ae60'}
              onBlur={e => e.target.style.borderColor = '#e8ecf0'}
            />
          </div>
          <div style={{ padding: '0.75rem', background: '#ebf5fb', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#2471a3' }}>
            ℹ️ Magaca dugsiga sidebar-ka, login page-ka, iyo rasiidhka ayuu ku muuqanayaa
          </div>
          <button onClick={saveDugsiMagac} style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #1a3a5c, #27ae60)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
            💾 Keydi Magaca Dugsiga
          </button>
        </div>
      )}
    </div>
  )
}
