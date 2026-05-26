import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const empty = { magaca: '', telefoon: '', maado: '', mushaharka: '', email: '', password_hash: '' }

export default function Macallimiin() {
  const [macallimiin, setMacallimiin] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchMacallimiin() }, [])

  const fetchMacallimiin = async () => {
    setLoading(true)
    const { data } = await supabase.from('macallimiin').select('*').order('created_at', { ascending: false })
    setMacallimiin(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.magaca.trim()) return setMsg('Magaca macallin qor!')
    if (!form.email.trim()) return setMsg('Email qor!')
    if (!editId && !form.password_hash.trim()) return setMsg('Password qor!')
    setSaving(true)
    const data = { ...form, mushaharka: Number(form.mushaharka) || 0 }
    if (editId) {
      if (!data.password_hash) delete data.password_hash
      await supabase.from('macallimiin').update(data).eq('id', editId)
      setMsg('✅ Waa la beddelay!')
    } else {
      await supabase.from('macallimiin').insert([data])
      setMsg('✅ Macalin cusub la daray!')
    }
    setSaving(false)
    setShowForm(false)
    setForm(empty)
    setEditId(null)
    fetchMacallimiin()
    setTimeout(() => setMsg(''), 3000)
  }

  const del = async (id, magaca) => {
    if (!window.confirm(`${magaca} ma tirtirtaa?`)) return
    await supabase.from('macallimiin').delete().eq('id', id)
    setMsg('🗑️ La tirtiray!')
    fetchMacallimiin()
    setTimeout(() => setMsg(''), 3000)
  }

  const edit = (m) => {
    setForm({ magaca: m.magaca, telefoon: m.telefoon || '', maado: m.maado || '', mushaharka: m.mushaharka || '', email: m.email || '', password_hash: '' })
    setEditId(m.id)
    setShowForm(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>👨‍🏫 Macallimiin</h1>
          <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>{macallimiin.length} macalin</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(empty); setEditId(null) }} style={{
          padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #27ae60)',
          color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
        }}>
          ➕ Macalin Ku Dar
        </button>
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '8px', color: '#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>{editId ? '✏️ Wax Ka Beddel' : '➕ Macalin Cusub'}</h2>
            {[
              { label: 'Magaca Macalin *', key: 'magaca', placeholder: 'Magaca buuxa' },
              { label: 'Telefoon', key: 'telefoon', placeholder: '06X-XXX-XXXX' },
              { label: 'Maadada', key: 'maado', placeholder: 'Xisaab, Af Somali...' },
              { label: 'Mushaharka ($)', key: 'mushaharka', placeholder: '0', type: 'number' },
              { label: 'Email (Login) *', key: 'email', placeholder: 'macalin@dugsi.so', type: 'email' },
              { label: editId ? 'Password Cusub (Optional)' : 'Password *', key: 'password_hash', placeholder: '••••••••', type: 'password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #1a3a5c, #27ae60)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, padding: '0.8rem', background: '#f8fafc', color: '#5d6d7e', border: '2px solid #e8ecf0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Jooji
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' }}>
        {loading ? (
          <p style={{ color: '#95a5a6' }}>⏳ Loading...</p>
        ) : macallimiin.length === 0 ? (
          <p style={{ color: '#95a5a6' }}>Macalin lama diiwaangelinin weli</p>
        ) : macallimiin.map(m => (
          <div key={m.id} style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderTop: '4px solid #27ae60' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #1a3a5c, #27ae60)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1.2rem' }}>
                {m.magaca?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1rem', fontWeight: '700' }}>{m.magaca}</h3>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.8rem' }}>{m.maado || 'Maado la\'aan'}</p>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#5d6d7e', marginBottom: '0.4rem' }}>📞 {m.telefoon || '—'}</div>
            <div style={{ fontSize: '0.85rem', color: '#5d6d7e', marginBottom: '0.4rem' }}>📧 {m.email || '—'}</div>
            <div style={{ fontSize: '0.9rem', color: '#27ae60', fontWeight: '700', marginBottom: '1rem' }}>💰 ${Number(m.mushaharka || 0).toLocaleString()}/bil</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => edit(m)} style={{ flex: 1, padding: '0.5rem', background: '#ebf5fb', color: '#3498db', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>✏️ Wax Ka Beddel</button>
              <button onClick={() => del(m.id, m.magaca)} style={{ flex: 1, padding: '0.5rem', background: '#fdedec', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>🗑️ Tirtir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
