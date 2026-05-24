import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BISHOOYINKA = ['Janvier','Febraayo','Maarso','Abril','Maayo','Juun','Luuliyo','Agoosto','Sebteembar','Oktoobar','Nofembar','Disembar']
const empty = { arday_id: '', xaddiga: '', bisha: BISHOOYINKA[new Date().getMonth()], sannadka: new Date().getFullYear(), bixiyay: false, taariikhda_bixinta: '' }

export default function Lacagta({ user }) {
  const [lacagta, setLacagta] = useState([])
  const [ardayda, setArdayda] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [lacRes, ardRes] = await Promise.all([
      supabase.from('lacagta').select('*, ardayda(magaca, fasalka)').order('created_at', { ascending: false }),
      supabase.from('ardayda').select('id, magaca, fasalka').order('magaca')
    ])
    setLacagta(lacRes.data || [])
    setArdayda(ardRes.data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.arday_id) return setMsg('Arday dooro!')
    if (!form.xaddiga) return setMsg('Xaddiga lacagta qor!')
    setSaving(true)
    await supabase.from('lacagta').insert([{ ...form, xaddiga: Number(form.xaddiga), sannadka: Number(form.sannadka) }])
    setMsg('✅ Lacag la diiwangeliyay!')
    setSaving(false)
    setShowForm(false)
    setForm(empty)
    fetchAll()
    setTimeout(() => setMsg(''), 3000)
  }

  const togglePaid = async (id, current) => {
    await supabase.from('lacagta').update({ bixiyay: !current, taariikhda_bixinta: !current ? new Date().toISOString().split('T')[0] : null }).eq('id', id)
    fetchAll()
  }

  const del = async (id) => {
    if (!window.confirm('Lacagtan ma tirtirtaa?')) return
    await supabase.from('lacagta').delete().eq('id', id)
    fetchAll()
  }

  const filtered = lacagta.filter(l => filter === 'all' ? true : filter === 'bixiyay' ? l.bixiyay : !l.bixiyay)
  const totalBixiyay = lacagta.filter(l => l.bixiyay).reduce((s, l) => s + Number(l.xaddiga), 0)
  const totalMaBixin = lacagta.filter(l => !l.bixiyay).reduce((s, l) => s + Number(l.xaddiga), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>💰 Lacagta Dugsiga</h1>
          <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>{lacagta.length} diiwaан</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => { setShowForm(true); setForm(empty) }} style={{
            padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #f39c12)',
            color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
          }}>
            ➕ Lacag Diiwaangeli
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Wadarta Bixiyay', value: `$${totalBixiyay.toLocaleString()}`, color: '#27ae60', bg: '#eafaf1', icon: '✅' },
          { label: 'Wadarta Ma Bixin', value: `$${totalMaBixin.toLocaleString()}`, color: '#e74c3c', bg: '#fdedec', icon: '⚠️' },
          { label: 'Wadarta Guud', value: `$${(totalBixiyay + totalMaBixin).toLocaleString()}`, color: '#3498db', bg: '#ebf5fb', icon: '💰' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}` }}>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>{s.icon} {s.label}</p>
            <h2 style={{ margin: '0.3rem 0 0', color: s.color, fontSize: '1.6rem', fontWeight: '800' }}>{s.value}</h2>
          </div>
        ))}
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '8px', color: '#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {[['all', '📋 Dhammaan'], ['bixiyay', '✅ Bixiyay'], ['mabixin', '❌ Ma Bixin']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '0.5rem 1.2rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
            background: filter === val ? '#1a3a5c' : '#fff', color: filter === val ? '#fff' : '#5d6d7e',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>{label}</button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>➕ Lacag Diiwaangeli</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Arday *</label>
              <select value={form.arday_id} onChange={e => setForm({ ...form, arday_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                <option value="">— Arday dooro —</option>
                {ardayda.map(a => <option key={a.id} value={a.id}>{a.magaca} ({a.fasalka})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Xaddiga ($) *</label>
              <input type="number" value={form.xaddiga} onChange={e => setForm({ ...form, xaddiga: e.target.value })} placeholder="0"
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Bisha</label>
                <select value={form.bisha} onChange={e => setForm({ ...form, bisha: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                  {BISHOOYINKA.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Sannadka</label>
                <input type="number" value={form.sannadka} onChange={e => setForm({ ...form, sannadka: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="bixiyay" checked={form.bixiyay} onChange={e => setForm({ ...form, bixiyay: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="bixiyay" style={{ color: '#2c3e50', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>✅ Lacagta waa la bixiyay</label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #1a3a5c, #f39c12)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '0.8rem', background: '#f8fafc', color: '#5d6d7e', border: '2px solid #e8ecf0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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
          <p style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>Lacag lama helin</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Arday', 'Fasalka', 'Bisha', 'Xaddiga', 'Xaaladda', 'Ficilka'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', color: '#5d6d7e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f0f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#2c3e50' }}>{l.ardayda?.magaca || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{l.ardayda?.fasalka || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{l.bisha} {l.sannadka}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '700', color: '#27ae60', fontSize: '1rem' }}>${Number(l.xaddiga).toLocaleString()}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <button onClick={() => user.role === 'admin' && togglePaid(l.id, l.bixiyay)} style={{
                      padding: '0.3rem 0.9rem', borderRadius: '20px', border: 'none',
                      background: l.bixiyay ? '#eafaf1' : '#fdedec', color: l.bixiyay ? '#27ae60' : '#e74c3c',
                      fontWeight: '600', fontSize: '0.8rem', cursor: user.role === 'admin' ? 'pointer' : 'default'
                    }}>
                      {l.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                    </button>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    {user.role === 'admin' && (
                      <button onClick={() => del(l.id)} style={{ padding: '0.4rem 0.9rem', background: '#fdedec', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}>🗑️ Tirtir</button>
                    )}
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
