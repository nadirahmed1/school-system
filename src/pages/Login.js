import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

// Default admin credentials - can be changed in Settings
const DEFAULT_ADMIN = { email: 'admin@dugsi.so', password: 'Admin@2024' }

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check admin
      const savedAdmin = JSON.parse(localStorage.getItem('admin_credentials') || JSON.stringify(DEFAULT_ADMIN))
      if (email === savedAdmin.email && password === savedAdmin.password) {
        onLogin({ magaca: 'Admin', role: 'admin', email, dugsi_magac: localStorage.getItem('dugsi_magac') || 'Nidaamka Dugsiga' })
        return
      }

      // Check teacher from Supabase
      const { data, error: dbError } = await supabase
        .from('macallimiin')
        .select('*')
        .eq('email', email)
        .single()

      if (dbError || !data) {
        setError('Email ama Password khalad ah')
        return
      }

      if (data.password_hash !== password) {
        setError('Email ama Password khalad ah')
        return
      }

      onLogin({ magaca: data.magaca, role: 'macalin', email, id: data.id, dugsi_magac: localStorage.getItem('dugsi_magac') || 'Dugsigeena' })
    } catch (err) {
      setError('Khalad ayaa dhacay. Internet hubi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 50%, #1a5276 100%)',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      {/* Background pattern */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            background: 'rgba(52,152,219,0.08)',
            width: `${200 + i * 100}px`, height: `${200 + i * 100}px`,
            top: `${-50 + i * 30}%`, left: `${-20 + i * 20}%`,
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '420px', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
          padding: '2.5rem', boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏫</div>
            <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.6rem', fontWeight: '800' }}>
              {localStorage.getItem('dugsi_magac') || 'Nidaamka Dugsiga'}
            </h1>
            <p style={{ color: '#7f8c8d', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
              Fadlan gal si aad u sii waddo
            </p>
          </div>


          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                📧 Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@dugsi.so" required
                style={{
                  width: '100%', padding: '0.8rem 1rem', border: '2px solid #e8ecf0',
                  borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                  transition: 'border 0.2s', boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
                onFocus={e => e.target.style.borderColor = '#3498db'}
                onBlur={e => e.target.style.borderColor = '#e8ecf0'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                🔑 Furaha Sirta
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: '100%', padding: '0.8rem 1rem', border: '2px solid #e8ecf0',
                  borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                  transition: 'border 0.2s', boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
                onFocus={e => e.target.style.borderColor = '#3498db'}
                onBlur={e => e.target.style.borderColor = '#e8ecf0'}
              />
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem', background: '#ffeaea', border: '1px solid #f5c6c6',
                borderRadius: '8px', color: '#e74c3c', fontSize: '0.85rem', marginBottom: '1rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '0.9rem', background: loading ? '#95a5a6' : 'linear-gradient(135deg, #1a3a5c, #3498db)',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(52,152,219,0.4)', transition: 'all 0.2s'
            }}>
              {loading ? '⏳ Sugaya...' : '🚀 Gal'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}
