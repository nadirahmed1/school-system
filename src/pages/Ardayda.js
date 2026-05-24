import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FASALKA = ['Fasal 1', 'Fasal 2', 'Fasal 3', 'Fasal 4', 'Fasal 5', 'Fasal 6', 'Fasal 7', 'Fasal 8']
const empty = { magaca: '', aabaha_magac: '', telefoon: '', fasalka: 'Fasal 1', taariikhda_diiwaangelinta: '' }

export default function Ardayda() {
  const [ardayda, setArdayda] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchArdayda() }, [])

  const fetchArdayda = async () => {
    setLoading(true)
    const { data } = await supabase.from('ardayda').select('*').order('created_at', { ascending: false })
    setArdayda(data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.magaca.trim()) return setMsg('Magaca arday qor!')
    setSaving(true)
    if (editId) {
      await supabase.from('ardayda').update(form).eq('id', editId)
      setMsg('✅ Waa la beddelay!')
    } else {
      await supabase.from('ardayda').insert([form])
      setMsg('✅ Arday cusub la daray!')
    }
    setSaving(false)
    setShowForm(false)
    setForm(empty)
    setEditId(null)
    fetchArdayda()
    setTimeout(() => setMsg(''), 3000)
  }

  const del = async (id, magaca) => {
    if (!window.confirm(`${magaca} ma tirtirtaa?`)) return
    await supabase.from('ardayda').delete().eq('id', id)
    setMsg('🗑️ La tirtiray!')
    fetchArdayda()
    setTimeout(() => setMsg(''), 3000)
  }

  const edit = (a) => {
    setForm({ magaca: a.magaca, aabaha_magac: a.aabaha_magac || '', telefoon: a.telefoon || '', fasalka: a.fasalka || 'Fasal 1', taariikhda_diiwaangelinta: a.taariikhda_diiwaangelinta || '' })
    setEditId(a.id)
    setShowForm(true)
  }

  const filtered = ardayda.filter(a => a.magaca?.toLowerCase().includes(search.toLowerCase()) || a.fasalka?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>🎓 Ardayda</h1>
          <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>{ardayda.length} arday oo diiwaangashan</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(empty); setEditId(null) }} style={{
          padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #3498db)',
          color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
        }}>
          ➕ Arday Ku Dar
        </button>
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '8px', color: '#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>}

      {/* Search */}
      <div style={{ marginBottom: '1.2rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Raadi arday..."
          style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #e8ecf0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>{editId ? '✏️ Wax Ka Beddel' : '➕ Arday Cusub'}</h2>
            {[
              { label: 'Magaca Arday *', key: 'magaca', placeholder: 'Magaca buuxa' },
              { label: 'Magaca Aabaha', key: 'aabaha_magac', placeholder: 'Magaca aabaha' },
              { label: 'Telefoon', key: 'telefoon', placeholder: '06X-XXX-XXXX' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Fasalka</label>
              <select value={form.fasalka} onChange={e => setForm({ ...form, fasalka: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                {FASALKA.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Taariikhda Diiwaangelinta</label>
              <input type="date" value={form.taariikhda_diiwaangelinta} onChange={e => setForm({ ...form, taariikhda_diiwaangelinta: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #1a3a5c, #3498db)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, padding: '0.8rem', background: '#f8fafc', color: '#5d6d7e', border: '2px solid #e8ecf0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Jooji
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>⏳ Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>Arday lama helin</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['#', 'Magaca', 'Aabaha', 'Telefoon', 'Fasalka', 'Ficilka'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', color: '#5d6d7e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f4f8', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.9rem 1rem', color: '#95a5a6', fontSize: '0.85rem' }}>{i + 1}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#2c3e50' }}>{a.magaca}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{a.aabaha_magac || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{a.telefoon || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: '#ebf5fb', color: '#3498db', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{a.fasalka}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => edit(a)} style={{ padding: '0.4rem 0.9rem', background: '#ebf5fb', color: '#3498db', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>✏️ Wax Ka Beddel</button>
                      <button onClick={() => del(a.id, a.magaca)} style={{ padding: '0.4rem 0.9rem', background: '#fdedec', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>🗑️ Tirtir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
