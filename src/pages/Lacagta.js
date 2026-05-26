import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const BISHOOYINKA = ['Janwaari','Febraayo','Maarso','Abriil','Maayo','Juun','Luuliyo','Agoosto','Sebteembar','Oktoobar','Nofembar','Disembar']
const SANADAHA = Array.from({length: 15}, (_, i) => 2024 + i)

const NOW_BISHA  = BISHOOYINKA[new Date().getMonth()]
const NOW_SANNAD = new Date().getFullYear()

const emptyForm = () => ({
  arday_id: '',
  xaddiga: '',
  bisha: NOW_BISHA,
  sannadka: NOW_SANNAD,
  bixiyay: false,
})

// ─── KEY: localStorage key lagu keydiyo bishii ugu dambeysay ee reset la sameeyay
const LAST_RESET_KEY = 'dugsi_last_monthly_reset'

export default function Lacagta({ user }) {
  const [lacagta,      setLacagta]      = useState([])   // xog bisha la doortay
  const [ardayda,      setArdayda]      = useState([])   // ardayda oo dhan
  const [ardaySearch,  setArdaySearch]  = useState('')
  const [loading,      setLoading]      = useState(true)
  const [resetting,    setResetting]    = useState(false)
  const [showForm,     setShowForm]     = useState(false)
  const [form,         setForm]         = useState(emptyForm())
  const [filter,       setFilter]       = useState('all') // 'all' | 'bixiyay' | 'mabixin'
  const [filterBisha,  setFilterBisha]  = useState(NOW_BISHA)
  const [filterSannad, setFilterSannad] = useState(NOW_SANNAD)
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState('')

  // ═══════════════════════════════════════════════════════════════
  // 1. FETCH — bisha la doortay kaliya soo qaado (efficient)
  // ═══════════════════════════════════════════════════════════════
  const fetchBisha = useCallback(async (bisha, sannad) => {
    setLoading(true)
    setFilter('all') // reset filter marka bisha la beddesho
    const { data, error } = await supabase
      .from('lacagta')
      .select('*, ardayda(magaca, fasalka, arday_id_gaar, telefoon)')
      .eq('bisha', bisha)
      .eq('sannadka', sannad)
      .order('created_at', { ascending: false })
    if (error) setMsg('❌ Khalad: ' + error.message)
    setLacagta(data || [])
    setLoading(false)
  }, [])

  const fetchArdayda = useCallback(async () => {
    const { data } = await supabase
      .from('ardayda')
      .select('id, magaca, fasalka, arday_id_gaar')
      .order('magaca')
    setArdayda(data || [])
  }, [])

  // Marka bisha/sannadka la beddesho, dib u soo qaado
  useEffect(() => {
    fetchBisha(filterBisha, filterSannad)
  }, [filterBisha, filterSannad, fetchBisha])

  useEffect(() => {
    fetchArdayda()
    checkMonthlyReset()
  }, [fetchArdayda])

  // ═══════════════════════════════════════════════════════════════
  // 2. AUTOMATIC MONTHLY RESET
  //    Marka app-ka la furo, hubi haddii bishaan cusub diiwaanka
  //    lacagta ardayda oo dhami ay ku jiraan. Haddayan jirin, u samee.
  // ═══════════════════════════════════════════════════════════════
  const checkMonthlyReset = async () => {
    const lastReset = localStorage.getItem(LAST_RESET_KEY)
    const thisMonth = `${NOW_SANNAD}-${NOW_BISHA}`
    if (lastReset === thisMonth) return // horay loo sameeyay

    setResetting(true)
    try {
      // Hel ardayda oo dhan
      const { data: allArday } = await supabase
        .from('ardayda')
        .select('id')

      if (!allArday || allArday.length === 0) { setResetting(false); return }

      // Hel ardayda oo hore bishaan lacag u leh (si aan duplicate u samayn)
      const { data: existing } = await supabase
        .from('lacagta')
        .select('arday_id')
        .eq('bisha', NOW_BISHA)
        .eq('sannadka', NOW_SANNAD)

      const existingIds = new Set((existing || []).map(e => e.arday_id))

      // Ardayda aan hore bishaan lacag u lahayn
      const newRows = allArday
        .filter(a => !existingIds.has(a.id))
        .map(a => ({
          arday_id:             a.id,
          xaddiga:              0,
          bisha:                NOW_BISHA,
          sannadka:             NOW_SANNAD,
          bixiyay:              false,
          taariikhda_bixinta:   null,
        }))

      if (newRows.length > 0) {
        await supabase.from('lacagta').insert(newRows)
      }

      // Keydi in reset la sameeyay
      localStorage.setItem(LAST_RESET_KEY, thisMonth)
    } catch(e) {
      console.error('Monthly reset error:', e)
    }
    setResetting(false)
    // Dib u soo qaad haddii bisha la doortay ay tahay bishaan
    if (filterBisha === NOW_BISHA && filterSannad === NOW_SANNAD) {
      fetchBisha(NOW_BISHA, NOW_SANNAD)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. TOGGLE PAID — isla markaas UI-ga ku celi (instant)
  // ═══════════════════════════════════════════════════════════════
  const togglePaid = async (id, current) => {
    const newVal = !current
    const taariikhda = newVal ? new Date().toISOString().split('T')[0] : null

    // UI instant update — ha sug DB
    setLacagta(prev => prev.map(l =>
      l.id === id ? { ...l, bixiyay: newVal, taariikhda_bixinta: taariikhda } : l
    ))

    const { error } = await supabase
      .from('lacagta')
      .update({ bixiyay: newVal, taariikhda_bixinta: taariikhda })
      .eq('id', id)

    if (error) {
      // Haddii khalad, dib u celi
      setLacagta(prev => prev.map(l =>
        l.id === id ? { ...l, bixiyay: current, taariikhda_bixinta: current ? l.taariikhda_bixinta : null } : l
      ))
      setMsg('❌ Khalad: ' + error.message)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. SAVE (lacag cusub diiwaangeli)
  // ═══════════════════════════════════════════════════════════════
  const save = async () => {
    if (!form.arday_id)                         return setMsg('⚠️ Arday dooro!')
    if (form.xaddiga === '' || Number(form.xaddiga) < 0) return setMsg('⚠️ Xaddiga lacagta qor!')
    setSaving(true)
    const insertData = {
      arday_id:           form.arday_id,
      xaddiga:            Number(form.xaddiga),
      bisha:              form.bisha,
      sannadka:           Number(form.sannadka),
      bixiyay:            form.bixiyay,
      taariikhda_bixinta: form.bixiyay ? new Date().toISOString().split('T')[0] : null,
    }
    const { error } = await supabase.from('lacagta').insert([insertData])
    if (error) {
      setMsg('❌ Khalad: ' + error.message)
    } else {
      setMsg('✅ Lacag la diiwaangeliyay!')
      setShowForm(false)
      setForm(emptyForm())
      setArdaySearch('')
      // Haddii bisha form-ka la doorto iyo bisha filter-ka isku mid yihiin, dib u soo qaad
      if (form.bisha === filterBisha && Number(form.sannadka) === filterSannad) {
        fetchBisha(filterBisha, filterSannad)
      }
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const del = async (id) => {
    if (!window.confirm('Lacagtan ma tirtirtaa?')) return
    await supabase.from('lacagta').delete().eq('id', id)
    fetchBisha(filterBisha, filterSannad)
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. COMPUTED — bisha la doortay
  // ═══════════════════════════════════════════════════════════════
  const bixiyayList  = lacagta.filter(l => l.bixiyay)
  const mabixinList  = lacagta.filter(l => !l.bixiyay)

  const wadartaBixiyay = bixiyayList.reduce((s, l) => s + Number(l.xaddiga), 0)
  const wadartaMaBixin = mabixinList.reduce((s, l) => s + Number(l.xaddiga), 0)

  // Ma Bixin tirada dhabta = Ardayda Guud - Bixiyay bisha (siduu Dashboard u xisaabiyaa)
  const ardaydaGuud        = ardayda.length
  const tiradaMaBixinDhabta = Math.max(0, ardaydaGuud - bixiyayList.length)

  // Table rows — filter button-ka raac
  const filtered =
    filter === 'bixiyay' ? bixiyayList :
    filter === 'mabixin' ? mabixinList :
    lacagta

  // ═══════════════════════════════════════════════════════════════
  // 6. RECEIPT PRINT
  // ═══════════════════════════════════════════════════════════════
  const printReceipt = (lacag) => {
    const arday = lacag.ardayda
    const dugsiMagac = localStorage.getItem('dugsi_magac') || 'Nidaamka Dugsiga'
    const taariikhPrint  = new Date().toLocaleDateString('so-SO', { year:'numeric', month:'long', day:'numeric' })
    const taariikhBixin  = lacag.taariikhda_bixinta
      ? new Date(lacag.taariikhda_bixinta).toLocaleDateString('so-SO', { year:'numeric', month:'long', day:'numeric' })
      : taariikhPrint
    const win = window.open('', '_blank', 'width=420,height=620')
    win.document.write(`<!DOCTYPE html><html lang="so"><head><meta charset="UTF-8"><title>Rasiidh - ${dugsiMagac}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#2c3e50}
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
<div class="school-name">${dugsiMagac.toUpperCase()}</div>
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

  // ═══════════════════════════════════════════════════════════════
  // 7. RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ margin:0, color:'#1a3a5c', fontSize:'1.8rem', fontWeight:'800' }}>💰 Lacagta Dugsiga</h1>
          <p style={{ color:'#7f8c8d', margin:'0.3rem 0 0', fontSize:'0.85rem' }}>
            {resetting ? '🔄 Bishaan cusub otomaatig u diiwaangelinaya...' : `${lacagta.length} diiwaан — ${filterBisha} ${filterSannad}`}
          </p>
        </div>
        {(!user || user.role === 'admin') && (
          <button onClick={() => { setShowForm(true); setForm(emptyForm()); setArdaySearch('') }} style={{
            padding:'0.75rem 1.5rem', background:'linear-gradient(135deg,#1a3a5c,#f39c12)',
            color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700'
          }}>➕ Lacag Diiwaangeli</button>
        )}
      </div>

      {/* ── BISHA + SANNADKA SELECTOR ── */}
      <div style={{ background:'#fff', borderRadius:'14px', padding:'1.2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
        <p style={{ margin:'0 0 0.75rem', color:'#5d6d7e', fontWeight:'700', fontSize:'0.82rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>
          📅 Bisha iyo Sannadka dooro — stats iyo liiska wuu beddelma
        </p>
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
            {BISHOOYINKA.map((b, i) => (
              <button key={i} onClick={() => setFilterBisha(b)} style={{
                padding:'0.35rem 0.75rem', borderRadius:'20px', border:'none', cursor:'pointer', fontSize:'0.78rem', fontWeight:'600',
                background: filterBisha === b ? '#1a3a5c' : '#f0f4f8',
                color:      filterBisha === b ? '#fff'    : '#5d6d7e',
                transition: 'all 0.15s'
              }}>{b}</button>
            ))}
          </div>
          <select value={filterSannad} onChange={e => setFilterSannad(Number(e.target.value))}
            style={{ padding:'0.5rem 1rem', border:'2px solid #e8ecf0', borderRadius:'8px', fontSize:'0.9rem', outline:'none', fontWeight:'600', color:'#1a3a5c' }}>
            {SANADAHA.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* ── STATS CARDS — bisha la doortay ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          {
            label:     '✅ Bixiyay',
            value:     `$${wadartaBixiyay.toLocaleString()}`,
            sub:       `${bixiyayList.length} arday`,
            color:     '#27ae60',
            filterVal: 'bixiyay',
            bg:        '#eafaf1',
          },
          {
            label:     '❌ Ma Bixin',
            value:     `$${wadartaMaBixin.toLocaleString()}`,
            sub:       `${mabixinList.length} arday`,
            color:     '#e74c3c',
            filterVal: 'mabixin',
            bg:        '#fdedec',
          },
          {
            label:     '📋 Wadarta',
            value:     `$${(wadartaBixiyay + wadartaMaBixin).toLocaleString()}`,
            sub:       `${lacagta.length} diiwaан`,
            color:     '#3498db',
            filterVal: 'all',
            bg:        '#ebf5fb',
          },
        ].map((s) => (
          <div key={s.filterVal} onClick={() => setFilter(s.filterVal)} style={{
            background:  '#fff',
            borderRadius:'14px',
            padding:     '1.2rem',
            boxShadow:   '0 4px 20px rgba(0,0,0,0.06)',
            borderLeft:  `5px solid ${s.color}`,
            cursor:      'pointer',
            outline:     filter === s.filterVal ? `2.5px solid ${s.color}` : 'none',
            transform:   filter === s.filterVal ? 'scale(1.02)' : 'scale(1)',
            transition:  'all 0.18s',
          }}>
            <p style={{ margin:0, color:'#7f8c8d', fontSize:'0.72rem', fontWeight:'700', textTransform:'uppercase' }}>{s.label}</p>
            <p style={{ margin:'0.1rem 0 0', color:'#aaa', fontSize:'0.68rem' }}>{filterBisha} {filterSannad}</p>
            <h2 style={{ margin:'0.4rem 0 0.2rem', color:s.color, fontSize:'1.6rem', fontWeight:'800' }}>{s.value}</h2>
            <p style={{ margin:0, color:'#95a5a6', fontSize:'0.78rem' }}>{s.sub}</p>
            {filter === s.filterVal && (
              <p style={{ margin:'0.4rem 0 0', fontSize:'0.7rem', color:s.color, fontWeight:'700' }}>▶ Hadda soo bandhigaya</p>
            )}
          </div>
        ))}
      </div>

      {msg && (
        <div style={{
          padding:'0.75rem 1rem', marginBottom:'1rem', borderRadius:'8px', fontWeight:'600',
          background: msg.includes('❌')||msg.includes('⚠️') ? '#fdedec' : '#eafaf1',
          color:      msg.includes('❌')||msg.includes('⚠️') ? '#e74c3c' : '#27ae60',
          border:     `1px solid ${msg.includes('❌')||msg.includes('⚠️') ? '#f5c6c6' : '#a9dfbf'}`
        }}>{msg}</div>
      )}

      {/* ── FILTER BUTTONS ── */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.2rem', flexWrap:'wrap' }}>
        {[['all','📋 Dhammaan'], ['bixiyay','✅ Bixiyay'], ['mabixin','❌ Ma Bixin']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'0.5rem 1.2rem', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem',
            background: filter === val ? '#1a3a5c' : '#fff',
            color:      filter === val ? '#fff'    : '#5d6d7e',
            boxShadow:  '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.15s'
          }}>
            {label}
            <span style={{
              marginLeft:'0.4rem', fontSize:'0.75rem', fontWeight:'800',
              color: filter === val ? 'rgba(255,255,255,0.8)' : '#95a5a6'
            }}>
              ({val === 'bixiyay' ? bixiyayList.length : val === 'mabixin' ? mabixinList.length : lacagta.length})
            </span>
          </button>
        ))}
      </div>

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem', width:'100%', maxWidth:'460px', boxShadow:'0 25px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ margin:'0 0 1.5rem', color:'#1a3a5c' }}>➕ Lacag Diiwaangeli</h2>

            {/* Arday search */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', color:'#2c3e50', fontWeight:'600', marginBottom:'0.3rem', fontSize:'0.85rem' }}>Arday *</label>
              <input
                value={ardaySearch}
                onChange={e => { setArdaySearch(e.target.value); setForm({ ...form, arday_id: '' }) }}
                placeholder="🔍 ID ama magac qor... (ARD-001 ama Axmed)"
                style={{ width:'100%', padding:'0.75rem', border:'2px solid #3498db', borderRadius:'8px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box', marginBottom:'0.4rem' }}
              />
              {ardaySearch.trim().length > 0 && !form.arday_id && (() => {
                const hits = ardayda.filter(a =>
                  a.magaca?.toLowerCase().includes(ardaySearch.toLowerCase()) ||
                  a.arday_id_gaar?.toLowerCase().includes(ardaySearch.toLowerCase())
                )
                return (
                  <div style={{ border:'2px solid #e8ecf0', borderRadius:'8px', maxHeight:'180px', overflowY:'auto', background:'#fff' }}>
                    {hits.length === 0
                      ? <p style={{ padding:'0.75rem', color:'#95a5a6', fontSize:'0.85rem', margin:0 }}>Arday lama helin</p>
                      : hits.map(a => (
                          <div key={a.id}
                            onClick={() => { setForm({ ...form, arday_id: a.id }); setArdaySearch(`[${a.arday_id_gaar}] ${a.magaca}`) }}
                            style={{ padding:'0.6rem 0.9rem', cursor:'pointer', borderBottom:'1px solid #f0f4f8', fontSize:'0.88rem' }}
                            onMouseEnter={e => e.currentTarget.style.background='#ebf5fb'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <span style={{ background:'#1a3a5c', color:'#fff', borderRadius:'4px', padding:'0.1rem 0.4rem', fontSize:'0.75rem', fontWeight:'700', marginRight:'0.5rem' }}>{a.arday_id_gaar}</span>
                            <span style={{ fontWeight:'600', color:'#2c3e50' }}>{a.magaca}</span>
                            <span style={{ color:'#95a5a6', fontSize:'0.8rem', marginLeft:'0.4rem' }}>({a.fasalka})</span>
                          </div>
                        ))
                    }
                  </div>
                )
              })()}
              {form.arday_id && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', background:'#eafaf1', borderRadius:'8px', border:'1px solid #a9dfbf' }}>
                  <span style={{ color:'#27ae60', fontWeight:'700', fontSize:'0.85rem' }}>✅ {ardaySearch}</span>
                  <button onClick={() => { setForm({ ...form, arday_id:'' }); setArdaySearch('') }}
                    style={{ marginLeft:'auto', background:'none', border:'none', color:'#e74c3c', cursor:'pointer', fontWeight:'700', fontSize:'0.85rem' }}>✕</button>
                </div>
              )}
            </div>

            {/* Xaddiga */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', color:'#2c3e50', fontWeight:'600', marginBottom:'0.3rem', fontSize:'0.85rem' }}>Xaddiga ($) *</label>
              <input type="number" value={form.xaddiga} onChange={e => setForm({ ...form, xaddiga: e.target.value })} placeholder="Tusaale: 50" min="0"
                style={{ width:'100%', padding:'0.75rem', border:'2px solid #e8ecf0', borderRadius:'8px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
            </div>

            {/* Bisha + Sannadka */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
              <div>
                <label style={{ display:'block', color:'#2c3e50', fontWeight:'600', marginBottom:'0.3rem', fontSize:'0.85rem' }}>Bisha</label>
                <select value={form.bisha} onChange={e => setForm({ ...form, bisha: e.target.value })}
                  style={{ width:'100%', padding:'0.75rem', border:'2px solid #e8ecf0', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }}>
                  {BISHOOYINKA.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', color:'#2c3e50', fontWeight:'600', marginBottom:'0.3rem', fontSize:'0.85rem' }}>Sannadka</label>
                <select value={form.sannadka} onChange={e => setForm({ ...form, sannadka: Number(e.target.value) })}
                  style={{ width:'100%', padding:'0.75rem', border:'2px solid #e8ecf0', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }}>
                  {SANADAHA.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Bixiyay checkbox */}
            <div style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'#f8fafc', borderRadius:'8px' }}>
              <input type="checkbox" id="bixiyay" checked={form.bixiyay} onChange={e => setForm({ ...form, bixiyay: e.target.checked })} style={{ width:'18px', height:'18px', cursor:'pointer' }} />
              <label htmlFor="bixiyay" style={{ color:'#2c3e50', fontWeight:'600', fontSize:'0.9rem', cursor:'pointer' }}>✅ Lacagta waa la bixiyay</label>
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'0.8rem', background: saving?'#95a5a6':'linear-gradient(135deg,#1a3a5c,#f39c12)', color:'#fff', border:'none', borderRadius:'8px', cursor: saving?'not-allowed':'pointer', fontWeight:'700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi'}
              </button>
              <button onClick={() => { setShowForm(false); setMsg(''); setArdaySearch('') }} style={{ flex:1, padding:'0.8rem', background:'#f8fafc', color:'#5d6d7e', border:'2px solid #e8ecf0', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                Jooji
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE ── */}
      <div style={{ background:'#fff', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        {loading ? (
          <p style={{ textAlign:'center', padding:'3rem', color:'#95a5a6' }}>⏳ Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>
              {filter === 'bixiyay' ? '✅' : filter === 'mabixin' ? '❌' : '📋'}
            </p>
            <p style={{ color:'#95a5a6', fontWeight:'600' }}>
              {filter === 'bixiyay' ? 'Lacag bixiyay lama helin' : filter === 'mabixin' ? 'Lacag ma bixin lama helin' : 'Xog lama helin'} — {filterBisha} {filterSannad}
            </p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ background:'#f8fafc' }}>
              <tr>
                {['ID','Magaca Arday','Fasalka','Bisha','Xaddiga','Xaaladda','Ficilka'].map(h => (
                  <th key={h} style={{ padding:'0.9rem 0.8rem', textAlign:'left', color:'#5d6d7e', fontSize:'0.78rem', fontWeight:'700', textTransform:'uppercase', borderBottom:'2px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} style={{ borderBottom:'1px solid #f0f4f8', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'0.8rem' }}>
                    <span style={{ padding:'0.2rem 0.5rem', background:'#1a3a5c', color:'#fff', borderRadius:'4px', fontSize:'0.72rem', fontWeight:'700' }}>
                      {l.ardayda?.arday_id_gaar || '—'}
                    </span>
                  </td>
                  <td style={{ padding:'0.8rem', fontWeight:'600', color:'#2c3e50' }}>{l.ardayda?.magaca || '—'}</td>
                  <td style={{ padding:'0.8rem', color:'#5d6d7e', fontSize:'0.85rem' }}>{l.ardayda?.fasalka || '—'}</td>
                  <td style={{ padding:'0.8rem', color:'#5d6d7e', fontSize:'0.85rem' }}>{l.bisha} {l.sannadka}</td>
                  <td style={{ padding:'0.8rem', fontWeight:'700', color: l.xaddiga > 0 ? '#27ae60' : '#95a5a6' }}>
                    {l.xaddiga > 0 ? `$${Number(l.xaddiga).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding:'0.8rem' }}>
                    <button
                      onClick={() => (!user || user.role === 'admin') ? togglePaid(l.id, l.bixiyay) : null}
                      title={l.bixiyay ? 'Guji si aad uga beddesho: Ma Bixin' : 'Guji si aad uga beddesho: Bixiyay'}
                      style={{
                        padding:'0.3rem 0.8rem', borderRadius:'20px', border:'none',
                        background: l.bixiyay ? '#eafaf1' : '#fdedec',
                        color:      l.bixiyay ? '#27ae60' : '#e74c3c',
                        fontWeight:'600', fontSize:'0.78rem',
                        cursor: (!user || user.role === 'admin') ? 'pointer' : 'default',
                        transition:'all 0.15s'
                      }}>
                      {l.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                    </button>
                  </td>
                  <td style={{ padding:'0.8rem' }}>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      <button onClick={() => printReceipt(l)} style={{ padding:'0.35rem 0.7rem', background:'#ebf5fb', color:'#3498db', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'0.75rem' }}>🖨️ Rasiidh</button>
                      {(!user || user.role === 'admin') && (
                        <button onClick={() => del(l.id)} style={{ padding:'0.35rem 0.7rem', background:'#fdedec', color:'#e74c3c', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'0.75rem' }}>🗑️</button>
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
