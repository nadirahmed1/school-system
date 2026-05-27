import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchSchoolSettings } from './useSchoolSettings'

const DEFAULT_ADMIN = { email: 'admin@dugsi.so', password: 'Admin@2024' }

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [schoolName, setSchoolName] = useState('Nidaamka Dugsiga')

  useEffect(() => {
    // Load school name from DB for display
    fetchSchoolSettings().then(s => {
      if (s?.school_name) setSchoolName(s.school_name)
    })
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // ── ADMIN CHECK: Database ka soo qaad credentials ──
      // Single source of truth - password beddelka Settings-ku
      // database ku keydiya, halkan ayaan ka helnaa
      const settings = await fetchSchoolSettings(true) // force fresh
      const adminEmail = settings?.admin_email    || DEFAULT_ADMIN.email
      const adminPass  = settings?.admin_password || DEFAULT_ADMIN.password

      if (email.trim() === adminEmail && password === adminPass) {
        onLogin({
          magaca: 'Admin',
          role:   'admin',
          email,
          dugsi_magac: settings?.school_name || 'Nidaamka Dugsiga'
        })
        return
      }

      // ── TEACHER CHECK: Supabase macallimiin table ──
      const { data, error: dbError } = await supabase
        .from('macallimiin')
        .select('*')
        .eq('email', email.trim())
        .single()

      if (dbError || !data) {
        setError('Email ama Password khalad ah')
        return
      }

      if (data.password_hash !== password) {
        setError('Email ama Password khalad ah')
        return
      }

      onLogin({
        magaca: data.magaca,
        role:   'macalin',
        email,
        id:     data.id,
        dugsi_magac: settings?.school_name || 'Dugsigeena'
      })
    } catch (err) {
      console.error('Login error:', err)
      // Fallback: localStorage haddii network dhibaato
      const ls = (() => {
        try { return JSON.parse(localStorage.getItem('admin_credentials') || '{}') } catch { return {} }
      })()
      const fbEmail = ls.email    || DEFAULT_ADMIN.email
      const fbPass  = ls.password || DEFAULT_ADMIN.password
      if (email.trim() === fbEmail && password === fbPass) {
        onLogin({ magaca: 'Admin', role: 'admin', email, dugsi_magac: localStorage.getItem('dugsi_magac') || 'Nidaamka Dugsiga' })
        return
      }
      setError('Khalad ayaa dhacay. Internet hubi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #0f2744 0%, #1a3a5c 50%, #1a5276 100%)', fontFamily:"'Segoe UI', sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'420px', padding:'0 1.5rem', position:'relative', zIndex:1 }}>
        <div style={{ background:'rgba(255,255,255,0.97)', borderRadius:'20px', padding:'2.5rem', boxShadow:'0 25px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem' }}>🏫</div>
            <h1 style={{ margin:0, color:'#1a3a5c', fontSize:'1.6rem', fontWeight:'800' }}>{schoolName}</h1>
            <p style={{ color:'#7f8c8d', margin:'0.5rem 0 0', fontSize:'0.9rem' }}>Fadlan gal si aad u sii waddo</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:'1.2rem' }}>
              <label style={{ display:'block', color:'#2c3e50', fontWeight:'600', marginBottom:'0.4rem', fontSize:'0.85rem' }}>📧 Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@dugsi.so" required
                style={{ width:'100%', padding:'0.8rem 1rem', border:'2px solid #e8ecf0', borderRadius:'10px', fontSize:'0.95rem', outline:'none', boxSizing:'border-box', background:'#f8fafc' }} />
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'block', color:'#2c3e50', fontWeight:'600', marginBottom:'0.4rem', fontSize:'0.85rem' }}>🔑 Furaha Sirta</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width:'100%', padding:'0.8rem 1rem', border:'2px solid #e8ecf0', borderRadius:'10px', fontSize:'0.95rem', outline:'none', boxSizing:'border-box', background:'#f8fafc' }} />
            </div>
            {error && (
              <div style={{ padding:'0.75rem 1rem', background:'#ffeaea', border:'1px solid #f5c6c6', borderRadius:'8px', color:'#e74c3c', fontSize:'0.85rem', marginBottom:'1rem' }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'0.9rem', background:loading?'#95a5a6':'linear-gradient(135deg, #1a3a5c, #3498db)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'1rem', fontWeight:'700', cursor:loading?'not-allowed':'pointer', boxShadow:'0 4px 15px rgba(52,152,219,0.4)' }}>
              {loading ? '⏳ Sugaya...' : '🚀 Gal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
