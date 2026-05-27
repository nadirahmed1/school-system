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
})

export default function Lacagta({ user }) {
  // ── STATE ──────────────────────────────────────────────────────
  const [ardayda,      setArdayda]      = useState([])  // Dhammaan ardayda
  const [bixiyayList,  setBixiyayList]  = useState([])  // Ardayda bixisay bisha la doortay
  const [ardaySearch,  setArdaySearch]  = useState('')
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [form,         setForm]         = useState(emptyForm())
  const [filter,       setFilter]       = useState('all')
  const [filterBisha,  setFilterBisha]  = useState(NOW_BISHA)
  const [filterSannad, setFilterSannad] = useState(NOW_SANNAD)
  const [saving,       setSaving]       = useState(false)
  const [msg,          setMsg]          = useState('')

  // ═══════════════════════════════════════════════════════════════
  // 1. FETCH — hel ardayda oo dhan + ardayda bixisay bisha la doortay
  //    Ma Bixin = Ardayda Guud - Bixiyay (DYNAMIC QUERY, no DB rows needed)
  // ═══════════════════════════════════════════════════════════════
  const fetchArdayda = useCallback(async () => {
    const { data } = await supabase
      .from('ardayda')
      .select('id, magaca, fasalka, arday_id_gaar, telefoon')
      .order('magaca')
    setArdayda(data || [])
  }, [])

  const fetchBixiyay = useCallback(async (bisha, sannad) => {
    setLoading(true)
    setFilter('all')
    const { data, error } = await supabase
      .from('lacagta')
      .select('*, ardayda(magaca, fasalka, arday_id_gaar, telefoon)')
      .eq('bisha', bisha)
      .eq('sannadka', sannad)
      .eq('bixiyay', true)   // ← KALIYA ardayda bixisay ayaan DB-ga ka soo qaadanaa
      .order('taariikhda_bixinta', { ascending: false })
    if (error) setMsg('❌ Khalad: ' + error.message)
    setBixiyayList(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchArdayda() }, [fetchArdayda])
  useEffect(() => { fetchBixiyay(filterBisha, filterSannad) }, [filterBisha, filterSannad, fetchBixiyay])

  // ═══════════════════════════════════════════════════════════════
  // 2. DYNAMIC "Ma Bixin" LIST
  //    = Ardayda Guud - (Ardayda ku jirta bixiyayList bisha la doortay)
  //    Xogtan ma jirto DB-ga — waxay ka dhalantaa xisaabinta
  // ═══════════════════════════════════════════════════════════════
  const bixiyayIds = new Set(bixiyayList.map(l => l.arday_id))

  const mabixinList = ardayda
    .filter(a => !bixiyayIds.has(a.id))
    .map(a => ({
      // Shape-ka isku mid ah lacagta rows si table-ka uu si fudud u muujiyo
      _virtual:  true,       // calaamad: row-kan DB-ga kama imanin
      arday_id:  a.id,
      bixiyay:   false,
      xaddiga:   0,
      bisha:     filterBisha,
      sannadka:  filterSannad,
      ardayda:   { magaca: a.magaca, fasalka: a.fasalka, arday_id_gaar: a.arday_id_gaar, telefoon: a.telefoon },
    }))

  // ── Xisaabin guud ──────────────────────────────────────────────
  const wadartaBixiyay = bixiyayList.reduce((s, l) => s + Number(l.xaddiga), 0)

  // "Ma Bixin" wadarta: xaddiga la yaqaan kuma jirto DB-ga, waxaan tusi karnaa 0
  const wadartaMaBixin = 0  // Lacagta aan bixin wali lama oga xaddiga

  const allRows = filter === 'bixiyay'
    ? bixiyayList
    : filter === 'mabixin'
      ? mabixinList
      : [...bixiyayList, ...mabixinList]

  // ═══════════════════════════════════════════════════════════════
  // 3. DIIWAANGELI LACAG — kaliya marka ardaygu bixiyo
  //    Form-ka waxaa laga saaray checkbox "bixiyay" — markuu la soo
  //    galo nidaamka, taas macnaheedu waa BIXIYAY
  // ═══════════════════════════════════════════════════════════════
  const save = async () => {
    if (!form.arday_id) return setMsg('⚠️ Arday dooro!')
    if (form.xaddiga === '' || Number(form.xaddiga) <= 0) return setMsg('⚠️ Xaddiga lacagta qor! (0 ka weyn)')

    // Hubi in arday bishaan hore lacag u diiwaangeliyay
    const existing = bixiyayList.find(l => l.arday_id === form.arday_id)
    if (existing) return setMsg('⚠️ Ardaydan horuu bisha ' + filterBisha + ' lacag u bixiyay!')

    setSaving(true)
    const insertData = {
      arday_id:           form.arday_id,
      xaddiga:            Number(form.xaddiga),
      bisha:              form.bisha,
      sannadka:           Number(form.sannadka),
      bixiyay:            true,                                          // ← Always true
      taariikhda_bixinta: new Date().toISOString().split('T')[0],
    }
    const { error } = await supabase.from('lacagta').insert([insertData])
    if (error) {
      setMsg('❌ Khalad: ' + error.message)
    } else {
      setMsg('✅ Lacag la diiwaangeliyay!')
      setShowForm(false)
      setForm(emptyForm())
      setArdaySearch('')
      if (form.bisha === filterBisha && Number(form.sannadka) === filterSannad) {
        fetchBixiyay(filterBisha, filterSannad)
      }
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TIRTIR
  // ═══════════════════════════════════════════════════════════════
  const del = async (id) => {
    if (!window.confirm('Lacagtan ma tirtirtaa? (Arday "Ma Bixin" liiska ayuu ku laaban doonaa)')) return
    await supabase.from('lacagta').delete().eq('id', id)
    fetchBixiyay(filterBisha, filterSannad)
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. RECEIPT PRINT
  // ═══════════════════════════════════════════════════════════════
  const printReceipt = (lacag) => {
    if (lacag._virtual) return

    const arday = lacag.ardayda

    // FIX 1: Ka soo qaad school_settings (magaca + logo) - isku mid Settings.js
    let schoolName = 'Nidaamka Dugsiga'
    let logoUrl    = null
    try {
      const ss = JSON.parse(localStorage.getItem('school_settings') || '{}')
      if (ss.schoolName) schoolName = ss.schoolName
      if (ss.logoUrl)    logoUrl    = ss.logoUrl
    } catch {}
    // Fallback: haddii dugsi_magac key kale jiro
    if (schoolName === 'Nidaamka Dugsiga') {
      schoolName = localStorage.getItem('dugsi_magac') || schoolName
    }

    // Logo HTML - haddii base64/URL jiro, isticmaal; haddii kale emoji
    const logoHTML = logoUrl
      ? `<img src="${logoUrl}" alt="Logo" style="height:72px;width:72px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto">`
      : `<div style="font-size:52px;margin-bottom:8px">🏫</div>`

    const taariikhPrint = new Date().toLocaleDateString('so-SO', { year:'numeric', month:'long', day:'numeric' })
    const taariikhBixin = lacag.taariikhda_bixinta
      ? new Date(lacag.taariikhda_bixinta).toLocaleDateString('so-SO', { year:'numeric', month:'long', day:'numeric' })
      : taariikhPrint

    const win = window.open('', '_blank', 'width=460,height=680')
    win.document.write(`<!DOCTYPE html><html lang="so"><head>
<meta charset="UTF-8">
<title>Rasiidh - ${schoolName}</title>
<style>
/* ── Reset ── */
*{margin:0;padding:0;box-sizing:border-box}

/* ── Screen & Print base ── */
body{
  font-family:'Segoe UI',Arial,sans-serif;
  background:#fff;
  color:#000;          /* FIX 2: madow buuxda screen + print */
  font-size:14px;
}

.receipt{
  width:100%;
  max-width:400px;
  margin:0 auto;
  padding:28px 22px;
}

/* ── Header ── */
.header{
  text-align:center;
  border-bottom:3px double #1a3a5c;
  padding-bottom:18px;
  margin-bottom:18px;
}
.school-name{
  font-size:20px;
  font-weight:900;       /* FIX 2: aad u jilicsan */
  color:#1a3a5c;
  letter-spacing:1px;
}
.receipt-title{
  font-size:12px;
  color:#555;
  margin-top:5px;
  text-transform:uppercase;
  letter-spacing:2px;
  font-weight:600;
}

/* ── Info rows ── */
.info-section{
  border:1.5px solid #d0d7de;
  border-radius:10px;
  padding:4px 14px;
  margin-bottom:16px;
}
.info-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:9px 0;
  border-bottom:1px solid #e8ecf0;
  gap:12px;
}
.info-row:last-child{border-bottom:none}

/* FIX 2: label - madow, bold */
.info-label{
  color:#222;
  font-size:13px;
  font-weight:700;       /* bold */
  white-space:nowrap;
}
/* FIX 2: value - madow, aad u bold */
.info-value{
  font-weight:800;       /* extra bold */
  color:#000;
  text-align:right;
  font-size:14px;
}

/* ── Amount box ── */
.amount-box{
  text-align:center;
  background:linear-gradient(135deg,#1a3a5c,#2980b9);
  color:#fff;
  border-radius:12px;
  padding:20px 12px;
  margin:16px 0;
}
.amount-label{
  font-size:11px;
  text-transform:uppercase;
  letter-spacing:2px;
  opacity:.9;
  font-weight:600;
}
.amount-value{
  font-size:36px;
  font-weight:900;
  margin-top:6px;
}

/* ── Status ── */
.status-box{
  text-align:center;
  padding:11px;
  border-radius:8px;
  font-size:14px;
  font-weight:800;
  margin-bottom:16px;
  border:2px solid #27ae60;
  background:#eafaf1;
  color:#1a7a42;
}

/* ── Footer ── */
.footer{
  text-align:center;
  border-top:2px dashed #bbb;
  padding-top:16px;
  margin-top:14px;
}
.footer-text{
  font-size:12px;
  color:#444;
  font-weight:600;
  margin-bottom:4px;
}
.sig-line{
  border-top:1.5px solid #333;
  display:inline-block;
  width:140px;
  padding-top:6px;
  font-size:11px;
  color:#333;
  font-weight:700;
  text-align:center;
}

/* ── FIX 3: Print-specific — xaqiiji madow + bold ── */
@media print{
  body{
    print-color-adjust:exact;
    -webkit-print-color-adjust:exact;
    color:#000 !important;
  }
  .info-label{color:#000 !important; font-weight:700 !important;}
  .info-value{color:#000 !important; font-weight:800 !important;}
  .footer-text{color:#333 !important;}
  .school-name{color:#1a3a5c !important;}
  .receipt-title{color:#444 !important;}
}
</style>
</head>
<body>
<div class="receipt">

  <div class="header">
    ${logoHTML}
    <div class="school-name">${schoolName.toUpperCase()}</div>
    <div class="receipt-title">Rasiidh Lacag &mdash; Official Receipt</div>
  </div>

  <div class="info-section">
    <div class="info-row">
      <span class="info-label">🎓 Magaca Arday</span>
      <span class="info-value">${arday?.magaca || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">🪪 ID Arday</span>
      <span class="info-value">${arday?.arday_id_gaar || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">📚 Fasalka</span>
      <span class="info-value">${arday?.fasalka || '—'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">📅 Bisha</span>
      <span class="info-value">${lacag.bisha} ${lacag.sannadka}</span>
    </div>
    <div class="info-row">
      <span class="info-label">📆 Taariikhda Bixinta</span>
      <span class="info-value">${taariikhBixin}</span>
    </div>
  </div>

  <div class="amount-box">
    <div class="amount-label">Xaddiga Lacagta</div>
    <div class="amount-value">$${Number(lacag.xaddiga).toLocaleString()}</div>
  </div>

  <div class="status-box">✅ LACAGTA WAA LA BIXIYAY</div>

  <div class="footer">
    <p class="footer-text">Rasiidhan waa heshiis rasmi ah</p>
    <p class="footer-text">Taariikhda: ${taariikhPrint}</p>
    <div style="margin-top:28px;display:flex;justify-content:space-between;padding:0 8px">
      <span class="sig-line">Saxeexa Maamulka</span>
      <span class="sig-line">Saxeexa Waalidka</span>
    </div>
  </div>

</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`)
    win.document.close()
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ margin:0, color:'#1a3a5c', fontSize:'1.8rem', fontWeight:'800' }}>💰 Lacagta Dugsiga</h1>
          <p style={{ color:'#7f8c8d', margin:'0.3rem 0 0', fontSize:'0.85rem' }}>
            {bixiyayList.length} bixiyay · {mabixinList.length} ma bixin — {filterBisha} {filterSannad}
          </p>
        </div>
        {(!user || user.role === 'admin') && (
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm()); setArdaySearch('') }}
            style={{ padding:'0.75rem 1.5rem', background:'linear-gradient(135deg,#1a3a5c,#f39c12)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700' }}>
            ➕ Lacag Diiwaangeli
          </button>
        )}
      </div>

      {/* ── BISHA + SANNADKA ── */}
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

      {/* ── STATS CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          {
            label:     '✅ Bixiyay',
            value:     `$${wadartaBixiyay.toLocaleString()}`,
            sub:       `${bixiyayList.length} arday`,
            color:     '#27ae60',
            filterVal: 'bixiyay',
          },
          {
            label:     '❌ Ma Bixin',
            value:     `${mabixinList.length} arday`,
            sub:       `${filterBisha} ${filterSannad}`,
            color:     '#e74c3c',
            filterVal: 'mabixin',
          },
          {
            label:     '📋 Wadarta',
            value:     `$${wadartaBixiyay.toLocaleString()}`,
            sub:       `${ardayda.length} arday oo dhan`,
            color:     '#3498db',
            filterVal: 'all',
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
        {[
          ['all',      `📋 Dhammaan`,  bixiyayList.length + mabixinList.length],
          ['bixiyay',  `✅ Bixiyay`,   bixiyayList.length],
          ['mabixin',  `❌ Ma Bixin`,  mabixinList.length],
        ].map(([val, label, count]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'0.5rem 1.2rem', borderRadius:'20px', border:'none', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem',
            background: filter === val ? '#1a3a5c' : '#fff',
            color:      filter === val ? '#fff'    : '#5d6d7e',
            boxShadow:  '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.15s'
          }}>
            {label}
            <span style={{ marginLeft:'0.4rem', fontSize:'0.75rem', fontWeight:'800', color: filter === val ? 'rgba(255,255,255,0.8)' : '#95a5a6' }}>
              ({count})
            </span>
          </button>
        ))}
      </div>

      {/* ── FORM MODAL — kaliya "Bixiyay" in la galiyo ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem', width:'100%', maxWidth:'460px', boxShadow:'0 25px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ margin:'0 0 0.5rem', color:'#1a3a5c' }}>✅ Lacag Bixinta Diiwaangeli</h2>
            <p style={{ margin:'0 0 1.5rem', color:'#7f8c8d', fontSize:'0.82rem' }}>
              Kaliya ardayda lacagta bixisay ayaa la galiyo — "Ma Bixin" si otomaatig ah ayaa nidaamku xisaabiya.
            </p>

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
                      : hits.map(a => {
                          const alreadyPaid = bixiyayIds.has(a.id)
                          return (
                            <div key={a.id}
                              onClick={() => {
                                if (alreadyPaid) return
                                setForm({ ...form, arday_id: a.id })
                                setArdaySearch(`[${a.arday_id_gaar}] ${a.magaca}`)
                              }}
                              style={{
                                padding:'0.6rem 0.9rem', cursor: alreadyPaid ? 'not-allowed' : 'pointer',
                                borderBottom:'1px solid #f0f4f8', fontSize:'0.88rem',
                                opacity: alreadyPaid ? 0.45 : 1,
                                background: alreadyPaid ? '#f8fafc' : 'transparent'
                              }}
                              onMouseEnter={e => { if (!alreadyPaid) e.currentTarget.style.background='#ebf5fb' }}
                              onMouseLeave={e => { if (!alreadyPaid) e.currentTarget.style.background='transparent' }}>
                              <span style={{ background:'#1a3a5c', color:'#fff', borderRadius:'4px', padding:'0.1rem 0.4rem', fontSize:'0.75rem', fontWeight:'700', marginRight:'0.5rem' }}>{a.arday_id_gaar}</span>
                              <span style={{ fontWeight:'600', color:'#2c3e50' }}>{a.magaca}</span>
                              <span style={{ color:'#95a5a6', fontSize:'0.8rem', marginLeft:'0.4rem' }}>({a.fasalka})</span>
                              {alreadyPaid && <span style={{ marginLeft:'0.5rem', color:'#27ae60', fontSize:'0.75rem', fontWeight:'700' }}>✅ Bixiyay</span>}
                            </div>
                          )
                        })
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
              <input type="number" value={form.xaddiga} onChange={e => setForm({ ...form, xaddiga: e.target.value })} placeholder="Tusaale: 50" min="1"
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

            {/* Info box — no checkbox needed */}
            <div style={{ marginBottom:'1.5rem', padding:'0.75rem', background:'#eafaf1', borderRadius:'8px', border:'1px solid #a9dfbf', fontSize:'0.82rem', color:'#27ae60', fontWeight:'600' }}>
              ✅ Arday la galiyo = Lacag bixiyay. "Ma Bixin" si otomaatig ah ayaa nidaamku u soo bandhigaa.
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={save} disabled={saving} style={{ flex:1, padding:'0.8rem', background: saving?'#95a5a6':'linear-gradient(135deg,#1a3a5c,#f39c12)', color:'#fff', border:'none', borderRadius:'8px', cursor: saving?'not-allowed':'pointer', fontWeight:'700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi — Bixiyay'}
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
        ) : allRows.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>
              {filter === 'bixiyay' ? '✅' : filter === 'mabixin' ? '🎉' : '📋'}
            </p>
            <p style={{ color:'#95a5a6', fontWeight:'600' }}>
              {filter === 'bixiyay'
                ? `Lacag bixiyay lama helin — ${filterBisha} ${filterSannad}`
                : filter === 'mabixin'
                  ? `🎉 Dhammaan ardaydu lacagta way bixiyeen — ${filterBisha} ${filterSannad}`
                  : `Ardayda lama helin`}
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
              {allRows.map((l, idx) => (
                <tr key={l._virtual ? `v-${l.arday_id}` : l.id}
                  style={{ borderBottom:'1px solid #f0f4f8', transition:'background 0.1s', background: l._virtual ? '#fffaf9' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = l._virtual ? '#fff5f3' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = l._virtual ? '#fffaf9' : 'transparent'}>
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
                    <span style={{
                      padding:'0.3rem 0.8rem', borderRadius:'20px', border:'none', display:'inline-block',
                      background: l.bixiyay ? '#eafaf1' : '#fdedec',
                      color:      l.bixiyay ? '#27ae60' : '#e74c3c',
                      fontWeight:'600', fontSize:'0.78rem',
                    }}>
                      {l.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                    </span>
                  </td>
                  <td style={{ padding:'0.8rem' }}>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      {!l._virtual && (
                        <>
                          <button onClick={() => printReceipt(l)} style={{ padding:'0.35rem 0.7rem', background:'#ebf5fb', color:'#3498db', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'0.75rem' }}>🖨️ Rasiidh</button>
                          {(!user || user.role === 'admin') && (
                            <button onClick={() => del(l.id)} style={{ padding:'0.35rem 0.7rem', background:'#fdedec', color:'#e74c3c', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'0.75rem' }}>🗑️</button>
                          )}
                        </>
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
