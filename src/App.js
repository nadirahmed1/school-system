import React, { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Ardayda from './pages/Ardayda'
import Macallimiin from './pages/Macallimiin'
import Lacagta from './pages/Lacagta'
import Settings from './pages/Settings'
import Sidebar from './components/Sidebar'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('xarunta')

  useEffect(() => {
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
        {page === 'xarunta' && <Dashboard user={user} />}
        {page === 'ardayda' && <Ardayda user={user} />}
        {page === 'macallimiin' && user.role === 'admin' && <Macallimiin />}
        {page === 'macallimiin' && user.role !== 'admin' && (
          <div style={{ padding: '2rem', background: '#fff', borderRadius: '12px' }}>
            <h2 style={{ color: '#e74c3c' }}>⛔ Fasax la'aan — Admin kaliya</h2>
          </div>
        )}
        {page === 'lacagta' && <Lacagta user={user} />}
        {page === 'settings' && user.role === 'admin' && <Settings user={user} />}
      </main>
    </div>
  )
}
