import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BISHOOYINKA = ['Janwaari','Febraayo','Maarso','Abriil','Maayo','Juun','Luuliyo','Agoosto','Sebteembar','Oktoobar','Nofembar','Disembar']
const SANADAHA = Array.from({length: 12}, (_, i) => 2024 + i) // 2024-2035

const emptyForm = () => ({
  arday_id: '',
  xaddiga: '',
  bisha: BISHOOYINKA[new Date().getMonth()],
  sannadka: new Date().getFullYear(),
  bixiyay: false,
  taariikhda_bixinta: ''
})

export default function Lacagta({ user }) {
  const [lacagta, setLacagta] = useState([])
  const [ardayda, setArdayda] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [filter, setFilter] = useState('all')
  const [filterBisha, setFilterBisha] = useState(BISHOOYINKA[new Date().getMonth()])
  const [filterSannad, setFilterSannad] = useState(new Date().getFullYear())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showReceipt, setShowReceipt] = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [lacRes, ardRes] = await Promise.all([
      supabase.from('lacagta').select('*, ardayda(magaca, fasalka, arday_id_gaar, telefoon)').order('created_at', { ascending: false }),
      supabase.from('ardayda').select('id, magaca, fasalka, arday_id_gaar').order('magaca')
    ])
    setLacagta(lacRes.data || [])
    setArdayda(ardRes.data || [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.arday_id) return setMsg('⚠️ Arday dooro!')
    if (!form.xaddiga || Number(form.xaddiga) <= 0) return setMsg('⚠️ Xaddiga lacagta qor!')
    setSaving(true)
    try {
      const insertData = {
        arday_id: form.arday_id,
        xaddiga: Number(form.xaddiga),
        bisha: form.bisha,
        sannadka: Number(form.sannadka),
        bixiyay: form.bixiyay,
        taariikhda_bixinta: form.bixiyay ? new Date().toISOString().split('T')[0] : null
      }
      const { error } = await supabase.from('lacagta').insert([insertData])
      if (error) {
        setMsg('❌ Khalad: ' + error.message)
      } else {
        setMsg('✅ Lacag la diiwaangeliyay!')
        setShowForm(false)
        setForm(emptyForm())
        fetchAll()
      }
    } catch(e) {
      setMsg('❌ Khalad ayaa dhacay!')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const togglePaid = async (id, current) => {
    await supabase.from('lacagta').update({
      bixiyay: !current,
      taariikhda_bixinta: !current ? new Date().toISOString().split('T')[0] : null
    }).eq('id', id)
    fetchAll()
  }

  const del = async (id) => {
    if (!window.confirm('Lacagtan ma tirtirtaa?')) return
    await supabase.from('lacagta').delete().eq('id', id)
    fetchAll()
  }

  // Filter by bisha + sannadka
  const bishaFiltered = lacagta.filter(l => l.bisha === filterBisha && l.sannadka === filterSannad)
  const tiradaBixiyay = bishaFiltered.filter(l => l.bixiyay).length
  const tiradaMaBixin = bishaFiltered.filter(l => !l.bixiyay).length
  const wadartaBixiyay = bishaFiltered.filter(l => l.bixiyay).reduce((s,l) => s + Number(l.xaddiga), 0)
  const wadartaMaBixin = bishaFiltered.filter(l => !l.bixiyay).reduce((s,l) => s + Number(l.xaddiga), 0)

  const filtered = bishaFiltered.filter(l =>
    filter === 'all' ? true : filter === 'bixiyay' ? l.bixiyay : !l.bixiyay
  )

  // Print Receipt
  const printReceipt = (lacag) => {
    const arday = lacag.ardayda
    const win = window.open('', '_blank', 'width=400,height=500')
    win.document.write(`
      <html><head><title>Rasiidh</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 350px; margin: 0 auto; }
        h2 { text-align: center; color: #1a3a5c; border-bottom: 2px solid #1a3a5c; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 13px; }
        .value { font-weight: bold; font-size: 13px; }
        .amount { font-size: 24px; font-weight: bold; color: #27ae60; text-align: center; padding: 15px; background: #eafaf1; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; color: #999; font-size: 11px; margin-top: 20px; }
        .status { text-align: center; padding: 8px; border-radius: 6px; font-weight: bold; background: ${lacag.bixiyay ? '#eafaf1' : '#fdedec'}; color: ${lacag.bixiyay ? '#27ae60' : '#e74c3c'}; }
      </style></head>
      <body>
        <h2>🏫 Rasiidh Lacag</h2>
        <div class="row"><span class="label">Arday</span><span class="value">${arday?.magaca || '—'}</span></div>
        <div class="row"><span class="label">ID</span><span class="value">${arday?.arday_id_gaar || '—'}</span></div>
        <div class="row"><span class="label">Fasalka</span><span class="value">${arday?.fasalka || '—'}</span></div>
        <div class="row"><span class="label">Bisha</span><span class="value">${lacag.bisha} ${lacag.sannadka}</span></div>
        <div class="row"><span class="label">Taariikhda</span><span class="value">${lacag.taariikhda_bixinta || new Date().toLocaleDateString()}</span></div>
        <div class="amount">$${Number(lacag.xaddiga).toLocaleString()}</div>
        <div class="status">${lacag.bixiyay ? '✅ Lacagta Waa La Bixiyay' : '❌ Lacagta Ma La Bixin'}</div>
        <div class="footer">
          <p>Nidaamka Maamulka Dugsiga</p>
          <p>Taariikhda Daabacaadda: ${new Date().toLocaleDateString()}</p>
        </div>
        <script>window.onload = function(){ window.print(); }</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>💰 Lacagta Dugsiga</h1>
          <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>{lacagta.length} diiwaан guud</p>
        </div>
        {user.role === 'admin' && (
          <button onClick={() => { setShowForm(true); setForm(emptyForm()) }} style={{
            padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #f39c12)',
            color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700'
          }}>➕ Lacag Diiwaangeli</button>
        )}
      </div>

      {/* Bisha + Sannadka Selector */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <p style={{ margin: '0 0 0.75rem', color: '#5d6d7e', fontWeight: '600', fontSize: '0.85rem' }}>📅 BISHA IYO SANNADKA DOORO:</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {BISHOOYINKA.map((b, i) => (
              <button key={i} onClick={() => setFilterBisha(b)} style={{
                padding: '0.35rem 0.75rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600',
                background: filterBisha === b ? '#1a3a5c' : '#f0f4f8',
                color: filterBisha === b ? '#fff' : '#5d6d7e'
              }}>{b}</button>
            ))}
          </div>
          <select value={filterSannad} onChange={e => setFilterSannad(Number(e.target.value))}
            style={{ padding: '0.5rem 1rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontWeight: '600', color: '#1a3a5c' }}>
            {SANADAHA.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Stats for selected month */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: `Bixiyay — ${filterBisha}`, value: `$${wadartaBixiyay.toLocaleString()}`, sub: `${tiradaBixiyay} arday`, color: '#27ae60', icon: '✅' },
          { label: `Ma Bixin — ${filterBisha}`, value: `$${wadartaMaBixin.toLocaleString()}`, sub: `${tiradaMaBixin} arday`, color: '#e74c3c', icon: '📋' },
          { label: 'Wadarta Guud', value: `$${(wadartaBixiyay + wadartaMaBixin).toLocaleString()}`, sub: `${bishaFiltered.length} diiwaан`, color: '#3498db', icon: '💰' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}` }}>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase' }}>{s.icon} {s.label}</p>
            <h2 style={{ margin: '0.3rem 0 0', color: s.color, fontSize: '1.5rem', fontWeight: '800' }}>{s.value}</h2>
            <p style={{ margin: '0.1rem 0 0', color: '#95a5a6', fontSize: '0.78rem' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msg.includes('❌')||msg.includes('⚠️') ? '#fdedec':'#eafaf1', border: `1px solid ${msg.includes('❌')||msg.includes('⚠️')?'#f5c6c6':'#a9dfbf'}`, borderRadius: '8px', color: msg.includes('❌')||msg.includes('⚠️')?'#e74c3c':'#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>
      )}

      {/* Filter Buttons */}
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
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>➕ Lacag Diiwaangeli</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Arday *</label>
              <select value={form.arday_id} onChange={e => setForm({ ...form, arday_id: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                <option value="">— Arday dooro —</option>
                {ardayda.map(a => <option key={a.id} value={a.id}>{a.arday_id_gaar ? `[${a.arday_id_gaar}] ` : ''}{a.magaca} ({a.fasalka})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#2c3e50', fontWeight: '600', marginBottom: '0.3rem', fontSize: '0.85rem' }}>Xaddiga ($) *</label>
              <input type="number" value={form.xaddiga} onChange={e => setForm({ ...form, xaddiga: e.target.value })} placeholder="Tusaale: 50" min="1"
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
                <select value={form.sannadka} onChange={e => setForm({ ...form, sannadka: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}>
                  {SANADAHA.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <input type="checkbox" id="bixiyay" checked={form.bixiyay} onChange={e => setForm({ ...form, bixiyay: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="bixiyay" style={{ color: '#2c3e50', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>✅ Lacagta waa la bixiyay</label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '0.8rem', background: saving ? '#95a5a6' : 'linear-gradient(135deg, #1a3a5c, #f39c12)', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi'}
              </button>
              <button onClick={() => { setShowForm(false); setMsg('') }} style={{ flex: 1, padding: '0.8rem', background: '#f8fafc', color: '#5d6d7e', border: '2px solid #e8ecf0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
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
          <p style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>
            {filterBisha} {filterSannad} — lacag lama helin
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['ID', 'Arday', 'Fasalka', 'Bisha', 'Xaddiga', 'Xaaladda', 'Ficilka'].map(h => (
                  <th key={h} style={{ padding: '0.9rem 0.8rem', textAlign: 'left', color: '#5d6d7e', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f0f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.8rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: '#1a3a5c', color: '#fff', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700' }}>
                      {l.ardayda?.arday_id_gaar || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '0.8rem', fontWeight: '600', color: '#2c3e50' }}>{l.ardayda?.magaca || '—'}</td>
                  <td style={{ padding: '0.8rem', color: '#5d6d7e', fontSize: '0.85rem' }}>{l.ardayda?.fasalka || '—'}</td>
                  <td style={{ padding: '0.8rem', color: '#5d6d7e', fontSize: '0.85rem' }}>{l.bisha} {l.sannadka}</td>
                  <td style={{ padding: '0.8rem', fontWeight: '700', color: '#27ae60' }}>${Number(l.xaddiga).toLocaleString()}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <button onClick={() => user.role === 'admin' && togglePaid(l.id, l.bixiyay)} style={{
                      padding: '0.3rem 0.8rem', borderRadius: '20px', border: 'none',
                      background: l.bixiyay ? '#eafaf1' : '#fdedec',
                      color: l.bixiyay ? '#27ae60' : '#e74c3c',
                      fontWeight: '600', fontSize: '0.78rem', cursor: user.role === 'admin' ? 'pointer' : 'default'
                    }}>
                      {l.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                    </button>
                  </td>
                  <td style={{ padding: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => printReceipt(l)} style={{ padding: '0.35rem 0.7rem', background: '#ebf5fb', color: '#3498db', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}>🖨️ Rasiidh</button>
                      {user.role === 'admin' && (
                        <button onClick={() => del(l.id)} style={{ padding: '0.35rem 0.7rem', background: '#fdedec', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}>🗑️</button>
                      )}
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
