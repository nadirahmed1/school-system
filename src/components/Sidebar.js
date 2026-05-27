import React from 'react'
import { useSchoolSettings } from '../pages/useSchoolSettings'

const menuItems = [
  { id: 'xarunta',     label: 'Xarunta',     icon: '🏠' },
  { id: 'ardayda',     label: 'Ardayda',     icon: '🎓' },
  { id: 'macallimiin', label: 'Macallimiin', icon: '👨‍🏫' },
  { id: 'lacagta',     label: 'Lacagta',     icon: '💰' },
  { id: 'settings',    label: 'Settings',    icon: '⚙️' },
]

export default function Sidebar({ page, setPage, user, onLogout }) {
  const settings = useSchoolSettings()

  // Magaca dugsigu
  const dugsiMagac =
    settings.schoolName ||
    user?.dugsi_magac ||
    'Nidaamka Dugsiga'

  const sidebarBg = settings.sidebarColor || '#1a3a5c'
  const activeColor = settings.accentColor || '#3498db'

  return (
    <div style={{
      width: '240px',
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${sidebarBg} 0%, ${sidebarBg}dd 100%)`,
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
      transition: 'background 0.4s',
    }}>

      {/* ── Logo + Magaca ── */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="School Logo"
            style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, marginBottom: 6 }}
          />
        ) : (
          <div style={{ fontSize: '2rem' }}>🏫</div>
        )}
        <h2 style={{ color: '#fff', margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: '700' }}>
          {dugsiMagac}
        </h2>
      </div>

      {/* ── User info ── */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: user?.role === 'admin' ? '#e74c3c' : '#27ae60',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: '700', fontSize: '1rem',
          }}>
            {user?.magaca?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ color: '#fff', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{user?.magaca}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.7rem' }}>
              {user?.role === 'admin' ? '👑 Admin' : '📚 Macalin'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Menu ── */}
      <nav style={{ flex: 1, padding: '1rem 0' }}>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              background: page === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              borderLeft: page === item.id ? `4px solid ${activeColor}` : '4px solid transparent',
              color: page === item.id ? '#fff' : 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              cursor: 'pointer', fontSize: '0.9rem',
              fontWeight: page === item.id ? '600' : '400',
              transition: 'all 0.2s', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '0.75rem',
            background: 'rgba(231,76,60,0.2)',
            border: '1px solid rgba(231,76,60,0.4)',
            borderRadius: '8px', color: '#e74c3c',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
          }}
        >
          🚪 Ka Bax
        </button>
      </div>
    </div>
  )
}
