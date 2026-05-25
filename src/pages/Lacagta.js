import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BISHOOYINKA = ['Janwaari','Febraayo','Maarso','Abriil','Maayo','Juun','Luuliyo','Agoosto','Sebteembar','Oktoobar','Nofembar','Disembar']
const SANADAHA = Array.from({length: 15}, (_, i) => 2024 + i) // 2024-2038

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

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [lacRes, ardRes] = await Promise.all([
      supabase.from('lacagta').select('*, ardayda(magaca, fasalka, arday_id_gaar, telefoon)').order('created_at', { ascending: false }),
      supabase.from('ardayda').select('id, magaca, fasalka, arday_id_gaar').order('magaca')
    ])
    if (lacRes.error) setMsg('❌ Khalad: ' + lacRes.error.message)
    setLacagta(lacRes.data || [])
    setArdayda(ardRes.data || [])
    setLoading(false)
  }

  // Arday cusub marka la diiwaangeliyo, otomaatig lacag "ma bixin" u samee bishaan
  const diiwaangeliArdaydaLacag = async (ardayId) => {
    const bisha = BISHOOYINKA[new Date().getMonth()]
    const sannadka = new Date().getFullYear()
    // Hubi haddaan horay loo samayn bishaan
    const { data: existing } = await supabase
      .from('lacagta')
      .select('id')
      .eq('arday_id', ardayId)
      .eq('bisha', bisha)
      .eq('sannadka', sannadka)
    if (!existing || existing.length === 0) {
      await supabase.from('lacagta').insert([{
        arday_id: ardayId,
        xaddiga: 0,
        bisha,
        sannadka,
        bixiyay: false,
        taariikhda_bixinta: null
      }])
    }
  }

  const save = async () => {
    if (!form.arday_id) return setMsg('⚠️ Arday dooro!')
    if (!form.xaddiga || Number(form.xaddiga) < 0) return setMsg('⚠️ Xaddiga lacagta qor!')
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
    const newVal = !current
    const { error } = await supabase.from('lacagta').update({
      bixiyay: newVal,
      taariikhda_bixinta: newVal ? new Date().toISOString().split('T')[0] : null
    }).eq('id', id)
    if (!error) {
      setLacagta(prev => prev.map(l => l.id === id ? {
        ...l,
        bixiyay: newVal,
        taariikhda_bixinta: newVal ? new Date().toISOString().split('T')[0] : null
      } : l))
    }
  }

  const del = async (id) => {
    if (!window.confirm('Lacagtan ma tirtirtaa?')) return
    await supabase.from('lacagta').delete().eq('id', id)
    fetchAll()
  }

  // Filter — bisha + sannadka la doortay
  const bishaFiltered = lacagta.filter(l => l.bisha === filterBisha && Number(l.sannadka) === Number(filterSannad))
  
  // Stats — bisha la doortay
  const tiradaBixiyay = bishaFiltered.filter(l => l.bixiyay).length
  const tiradaMaBixin  = bishaFiltered.filter(l => !l.bixiyay).length
  const wadartaBixiyay = bishaFiltered.filter(l => l.bixiyay).reduce((s,l) => s + Number(l.xaddiga), 0)
  const wadartaMaBixin  = bishaFiltered.filter(l => !l.bixiyay).reduce((s,l) => s + Number(l.xaddiga), 0)

  // Table rows — filter button-ka raac
  const filtered = bishaFiltered.filter(l =>
    filter === 'all' ? true : filter === 'bixiyay' ? l.bixiyay : !l.bixiyay
  )

  const printReceipt = (lacag) => {
    const arday = lacag.ardayda
    const taariikhPrint = new Date().toLocaleDateString('so-SO', { year: 'numeric', month: 'long', day: 'numeric' })
    const taariikhBixin = lacag.taariikhda_bixinta
      ? new Date(lacag.taariikhda_bixinta).toLocaleDateString('so-SO', { year: 'numeric', month: 'long', day: 'numeric' })
      : taariikhPrint
    const win = window.open('', '_blank', 'width=420,height=600')
    win.document.write(`<!DOCTYPE html><html lang="so"><head><meta charset="UTF-8"><title>Rasiidh</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#2c3e50;padding:0}
    .receipt{width:100%;max-width:380px;margin:0 auto;padding:24px 20px}
    .header{text-align:center;border-bottom:3px double #1a3a5c;padding-bottom:16px;margin-bottom:16px}
    .school-name{font-size:18px;font-weight:800;color:#1a3a5c}
    .receipt-title{font-size:13px;color:#7f8c8d;margin-top:4px;text-transform:uppercase;letter-spacing:2px}
    .info-section{background:#f8fafc;border-radius:10px;padding:12px 14px;margin-bottom:14px}
    .info-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #e8ecf0;font-size:13px}
    .info-row:last-child{border-bottom:none}
    .info-label{color:#7f8c8d;font-size:12px}.info-value{font-weight:600;color:#2c3e50;text-align:right}
    .amount-box{text-align:center;background:linear-gradient(135deg,#1a3a5c,#3498db);color:#fff;border-radius:12px;padding:18px 12px;margin:16px 0}
    .amount-label{font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:.8}
    .amount-value{font-size:32px;font-weight:800;margin-top:4px}
    .status-box{text-align:center;padding:10px;border-radius:8px;font-size:14px;font-weight:700;margin-bottom:16px;border:2px solid}
    .status-paid{background:#eafaf1;color:#27ae60;border-color:#a9dfbf}
    .status-unpaid{background:#fdedec;color:#e74c3c;border-color:#f5c6c6}
    .footer{text-align:center;border-top:2px dashed #e8ecf0;padding-top:14px;margin-top:14px}
    .footer-text{font-size:11px;color:#95a5a6;margin-bottom:3px}
    @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head>
    <body><div class="receipt">
    <div class="header"><div style="font-size:36px;margin-bottom:6px">🏫</div>
    <div class="school-name">NIDAAMKA DUGSIGA</div>
    <div class="receipt-title">Rasiidh Lacag — Official Receipt</div></div>
    <div class="info-section">
    <div class="info-row"><span class="info-label">🎓 Magaca Arday</span><span class="info-value">${arday?.magaca||'—'}</span></div>
    <div class="info-row"><span class="info-label">🪪 ID Arday</span><span class="info-value">${arday?.arday_id_gaar||'—'}</span></div>
    <div class="info-row"><span class="info-label">📚 Fasalka</span><span class="info-value">${arday?.fasalka||'—'}</span></div>
    <div class="info-row"><span class="info-label">📅 Bisha</span><span class="info-value">${lacag.bisha} ${lacag.sannadka}</span></div>
    ${lacag.bixiyay?`<div class="info-row"><span class="info-label">📆 Taariikhda Bixinta</span><span class="info-value">${taariikhBixin}</span></div>`:''}
    </div>
    <div class="amount-box"><div class="amount-label">Xaddiga Lacagta</div><div class="amount-value">$${Number(lacag.xaddiga).toLocaleString()}</div></div>
    <div class="status-box ${lacag.bixiyay?'status-paid':'status-unpaid'}">${lacag.bixiyay?'✅ LACAGTA WAA LA BIXIYAY':'❌ LACAGTA MA LA BIXIN'}</div>
    <div class="footer"><p class="footer-text">Rasiidhan waa heshiis rasmi ah</p>
    <p class="footer-text">Taariikhda: ${taariikhPrint}</p>
    <div style="margin-top:24px;display:flex;justify-content:space-between;padding:0 10px">
    <span style="border-top:1px solid #2c3e50;display:inline-block;width:140px;padding-top:6px;font-size:11px;color:#7f8c8d;text-align:center">Saxeexa Maamulka</span>
    <span style="border-top:1px solid #2c3e50;display:inline-block;width:140px;padding-top:6px;font-size:11px;color:#7f8c8d;text-align:center">Saxeexa Waalidka</span>
    </div></div></div>
    <script>window.onload=function(){window.print()}</script></body></html>`)
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
        {(!user || user.role === 'admin') && (
          <button onClick={() => { setShowForm(true); setForm(emptyForm()) }} style={{
            padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #f39c12)',
            color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700'
          }}>➕ Lacag Diiwaangeli</button>
        )}
      </div>

      {/* Bisha + Sannadka selector */}
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

      {/* Stats — bisha la doortay */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: `✅ Bixiyay`, sublabel: `${filterBisha} ${filterSannad}`, value: `$${wadartaBixiyay.toLocaleString()}`, sub: `${tiradaBixiyay} arday`, color: '#27ae60', filterVal: 'bixiyay' },
          { label: `❌ Ma Bixin`, sublabel: `${filterBisha} ${filterSannad}`, value: `$${wadartaMaBixin.toLocaleString()}`, sub: `${tiradaMaBixin} arday`, color: '#e74c3c', filterVal: 'mabixin' },
          { label: '💰 Wadarta', sublabel: `${filterBisha} ${filterSannad}`, value: `$${(wadartaBixiyay + wadartaMaBixin).toLocaleString()}`, sub: `${bishaFiltered.length} diiwaан`, color: '#3498db', filterVal: 'all' },
        ].map((s, i) => (
          <div key={i} onClick={() => setFilter(s.filterVal)} style={{
            background: '#fff', borderRadius: '14px', padding: '1.2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${s.color}`,
            cursor: 'pointer',
            outline: filter === s.filterVal ? `2px solid ${s.color}` : 'none',
            transition: 'all 0.2s'
          }}>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</p>
            <p style={{ margin: '0.1rem 0 0', color: '#aaa', fontSize: '0.68rem' }}>{s.sublabel}</p>
            <h2 style={{ margin: '0.3rem 0 0', color: s.color, fontSize: '1.5rem', fontWeight: '800' }}>{s.value}</h2>
            <p style={{ margin: '0.1rem 0 0', color: '#95a5a6', fontSize: '0.78rem' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', background: msg.includes('❌')||msg.includes('⚠️') ? '#fdedec':'#eafaf1', border: `1px solid ${msg.includes('❌')||msg.includes('⚠️')?'#f5c6c6':'#a9dfbf'}`, borderRadius: '8px', color: msg.includes('❌')||msg.includes('⚠️')?'#e74c3c':'#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>
      )}

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {[['all', '📋 Dhammaan'], ['bixiyay', '✅ Bixiyay'], ['mabixin', '❌ Ma Bixin']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '0.5rem 1.2rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem',
            background: filter === val ? '#1a3a5c' : '#fff',
            color: filter === val ? '#fff' : '#5d6d7e',
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
              <input type="number" value={form.xaddiga} onChange={e => setForm({ ...form, xaddiga: e.target.value })} placeholder="Tusaale: 50" min="0"
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
            {filter === 'bixiyay' ? '✅ Bixiyay' : filter === 'mabixin' ? '❌ Ma Bixin' : ''} — {filterBisha} {filterSannad} lacag lama helin
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
                  <td style={{ padding: '0.8rem', fontWeight: '700', color: l.xaddiga > 0 ? '#27ae60' : '#95a5a6' }}>
                    {l.xaddiga > 0 ? `$${Number(l.xaddiga).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '0.8rem' }}>
                    <button
                      onClick={() => (!user || user.role === 'admin') ? togglePaid(l.id, l.bixiyay) : null}
                      style={{
                        padding: '0.3rem 0.8rem', borderRadius: '20px', border: 'none',
                        background: l.bixiyay ? '#eafaf1' : '#fdedec',
                        color: l.bixiyay ? '#27ae60' : '#e74c3c',
                        fontWeight: '600', fontSize: '0.78rem',
                        cursor: (!user || user.role === 'admin') ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}>
                      {l.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                    </button>
                  </td>
                  <td style={{ padding: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => printReceipt(l)} style={{ padding: '0.35rem 0.7rem', background: '#ebf5fb', color: '#3498db', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}>🖨️ Rasiidh</button>
                      {(!user || user.role === 'admin') && (
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
