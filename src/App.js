import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { applyCSSVariables } from './pages/useSchoolSettings'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ardayda from './pages/Ardayda'
import Macallimiin from './pages/Macallimiin'
import Lacagta from './pages/Lacagta'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'


// Init: soo qaad CSS colors Supabase-ka
async function initSchoolSettings() {
  try {
    const { data } = await supabase
      .from('school_settings')
      .select('primary_color, accent_color, sidebar_color')
      .limit(1)
      .single()

    if (data) {
      applyCSSVariables({
        primaryColor: data.primary_color,
        accentColor:  data.accent_color,
        sidebarColor: data.sidebar_color,
      })
    }
  } catch {}
}

export default function App() {
  const [user, setUser]   = useState(null)
  const [page, setPage]   = useState('xarunta')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Hubi session-ka si user uu u sii jiro browser refresh-ka
    const saved = sessionStorage.getItem('school_user')
    if (saved) setUser(JSON.parse(saved))
    initSchoolSettings().finally(() => setReady(true))
  }, [])

  const login = (userData) => {
    sessionStorage.setItem('school_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    sessionStorage.removeItem('school_user')
    setUser(null)
    setPage('xarunta')
  }

  if (!ready) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', fontSize: 20, color: '#888' }}>
      ⏳ Waxaa soo raraya...
    </div>
  )

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
