import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ardayda from './pages/Ardayda'
import Macallimiin from './pages/Macallimiin'
import Lacagta from './pages/Lacagta'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'

// ============================================================
// INIT: Xaqiiji school_settings jiraan oo buuxa
// Migrate dugsi_magac → school_settings haddii cusub yahay
// ============================================================
function initSchoolSettings() {
  try {
    const raw = localStorage.getItem('school_settings')
    let ss = raw ? JSON.parse(raw) : {}

    // Haddii schoolName faaruq, ka soo qaad dugsi_magac ama default
    if (!ss.schoolName) {
      ss.schoolName = localStorage.getItem('dugsi_magac') || 'Nidaamka Dugsiga'
    }
    if (!ss.primaryColor) ss.primaryColor = '#1a3a5c'
    if (!ss.accentColor)  ss.accentColor  = '#065f46'
    if (!ss.sidebarColor) ss.sidebarColor = '#1a3a5c'
    // logoUrl - haddii jiro sii, haddii kale null

    localStorage.setItem('school_settings', JSON.stringify(ss))

    // CSS variables ku cusboonaysii isla markaas
    const root = document.documentElement
    root.style.setProperty('--primary', ss.primaryColor)
    root.style.setProperty('--accent',  ss.accentColor)
    root.style.setProperty('--sidebar', ss.sidebarColor)
  } catch {}
}

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('xarunta')

  useEffect(() => {
    // Bilawga hore: init school_settings + migrate
    initSchoolSettings()
    const saved = localStorage.getItem('school_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const login = (userData) => {
    localStorage.setItem('school_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('school_user')
    setUser(null)
    setPage('xarunta')
  }

  if (!user) return <Login onLogin={login} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar page={page} setPage={setPage} user={user} onLogout={logout} />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {page === 'xarunta'    && <Dashboard user={user} />}
        {page === 'ardayda'    && <Ardayda user={user} />}
        {page === 'macallimiin' && user.role === 'admin' && <Macallimiin />}
        {page === 'lacagta'    && <Lacagta user={user} />}
        {page === 'settings'   && user.role === 'admin' && <Settings user={user} />}
        {page === 'macallimiin' && user.role === 'macalin' && (
          <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px' }}>
            <h2 style={{ color: '#e74c3c' }}>Fasax la'aan — Admin kaliya</h2>
          </div>
        )}
      </main>
    </div>
  )
}
