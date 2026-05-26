import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BISHOOYINKA = ['Janwaari','Febraayo','Maarso','Abriil','Maayo','Juun','Luuliyo','Agoosto','Sebteembar','Oktoobar','Nofembar','Disembar']
const SANADAHA = Array.from({length: 12}, (_, i) => 2024 + i)

export default function Dashboard({ user }) {
  const [ardaydaCount,     setArdaydaCount]     = useState(0)
  const [macallimiinCount, setMacallimiinCount]  = useState(0)
  const [monthlyData,      setMonthlyData]       = useState([]) // 12 bisha sannadka
  const [payments,         setPayments]          = useState([]) // 6 lacag ugu dambeeyay
  const [selectedMonth,    setSelectedMonth]     = useState(new Date().getMonth())
  const [selectedYear,     setSelectedYear]      = useState(new Date().getFullYear())
  const [loading,          setLoading]           = useState(true)

  useEffect(() => { fetchAll() }, [selectedYear])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ardRes, macRes, lacRes, recentRes] = await Promise.all([
        supabase.from('ardayda').select('id', { count: 'exact' }),
        supabase.from('macallimiin').select('id', { count: 'exact' }),
        supabase.from('lacagta').select('xaddiga, bixiyay, bisha, sannadka').eq('sannadka', selectedYear),
        supabase.from('lacagta').select('*, ardayda(magaca)').order('created_at', { ascending: false }).limit(6)
      ])

      setArdaydaCount(ardRes.count || 0)
      setMacallimiinCount(macRes.count || 0)
      setPayments(recentRes.data || [])

      const lacagta = lacRes.data || []

      // Xisaabi stats bisha kasta sannadka
      const monthly = BISHOOYINKA.map((bisha) => {
        const rows = lacagta.filter(l => l.bisha === bisha)
        const bixiyay  = rows.filter(l => l.bixiyay)
        const mabixin  = rows.filter(l => !l.bixiyay)
        return {
          bisha,
          wadartaBixiyay: bixiyay.reduce((s, l) => s + Number(l.xaddiga), 0),
          tiradaBixiyay:  bixiyay.length,
          wadartaMaBixin: mabixin.reduce((s, l) => s + Number(l.xaddiga), 0),
          tiradaMaBixin:  mabixin.length,
        }
      })

      setMonthlyData(monthly)
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  // Stats bisha la doortay
  const bishaSelected = monthlyData[selectedMonth] || {
    wadartaBixiyay: 0, tiradaBixiyay: 0,
    wadartaMaBixin: 0, tiradaMaBixin: 0,
  }

  // Ma Bixin dhabta = Ardayda Guud (3) - Bixiyay bisha
  // Bisha kasta: haddii 1 bixiyay → 3-1=2 ma bixin, haddii 0 bixiyay → 3 ma bixin
  const tiradaMaBixinDhabta = Math.max(0, ardaydaCount - bishaSelected.tiradaBixiyay)

  const bishaLabel = `${BISHOOYINKA[selectedMonth]} ${selectedYear}`

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>🏠 Xarunta</h1>
        <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>
          Ku soo dhawoow, {user.magaca}! — {new Date().toLocaleDateString('so-SO')}
        </p>
      </div>

      {/* ── STATS CARDS — labada lacag waxay ku xidanyihiin bisha la doortay ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        {[
          {
            label: 'Ardayda Guud',
            value: ardaydaCount,
            sub:   'diiwaangashan guud',
            sublabel: null,
            icon: '🎓', color: '#3498db', bg: '#ebf5fb'
          },
          {
            label: 'Macallimiin',
            value: macallimiinCount,
            sub:   null,
            sublabel: null,
            icon: '👨‍🏫', color: '#27ae60', bg: '#eafaf1'
          },
          {
            label:    'Lacag Bixiyay',
            sublabel: bishaLabel,          // ← bisha la doortay
            value:    `$${bishaSelected.wadartaBixiyay.toLocaleString()}`,
            sub:      `${bishaSelected.tiradaBixiyay} arday`,
            icon: '✅', color: '#27ae60', bg: '#eafaf1'
          },
          {
            label:    'Lacag Ma Bixin',
            sublabel: bishaLabel,
            value:    `$${bishaSelected.wadartaMaBixin.toLocaleString()}`,
            sub:      `${tiradaMaBixinDhabta} arday`,
            icon: '📋', color: '#e74c3c', bg: '#fdedec'
          },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {card.label}
                </p>
                {card.sublabel && (
                  <p style={{ margin: '0.1rem 0 0', color: '#bbb', fontSize: '0.7rem', fontWeight: '600' }}>{card.sublabel}</p>
                )}
                <h2 style={{ margin: '0.4rem 0 0', color: card.color, fontSize: '1.8rem', fontWeight: '800' }}>
                  {loading ? '...' : card.value}
                </h2>
                {card.sub && <p style={{ margin: '0.2rem 0 0', color: '#95a5a6', fontSize: '0.8rem' }}>{card.sub}</p>}
              </div>
              <div style={{ fontSize: '2.2rem', background: card.bg, padding: '0.6rem', borderRadius: '12px' }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── LACAGTA BISHA + LACAGAHA DAMBE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Lacagta Bisha */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1a3a5c', fontSize: '1rem', fontWeight: '700' }}>📅 Lacagta Bisha</h3>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ padding: '0.4rem 0.8rem', border: '2px solid #e8ecf0', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', fontWeight: '700', color: '#1a3a5c' }}>
              {SANADAHA.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Bil dooro — marka la doorto cards-ka sare ayaa beddelma */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {BISHOOYINKA.map((b, i) => (
              <button key={i} onClick={() => setSelectedMonth(i)} style={{
                padding: '0.35rem 0.7rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                background: selectedMonth === i ? '#1a3a5c' : '#f0f4f8',
                color:      selectedMonth === i ? '#fff'    : '#5d6d7e',
                transition: 'all 0.15s'
              }}>{b}</button>
            ))}
          </div>

          {/* Bixiyay */}
          <div style={{ textAlign: 'center', padding: '0.9rem', background: '#eafaf1', borderRadius: '12px', marginBottom: '0.6rem' }}>
            <p style={{ margin: 0, color: '#27ae60', fontSize: '0.78rem', fontWeight: '700' }}>✅ LACAG BIXIYAY — {bishaLabel}</p>
            <h2 style={{ margin: '0.25rem 0 0', color: '#27ae60', fontSize: '1.8rem', fontWeight: '800' }}>
              ${bishaSelected.wadartaBixiyay.toLocaleString()}
            </h2>
            <p style={{ margin: '0.1rem 0 0', color: '#95a5a6', fontSize: '0.78rem' }}>
              {bishaSelected.tiradaBixiyay} arday
            </p>
          </div>

          {/* Ma Bixin */}
          <div style={{ textAlign: 'center', padding: '0.9rem', background: '#fdedec', borderRadius: '12px' }}>
            <p style={{ margin: 0, color: '#e74c3c', fontSize: '0.78rem', fontWeight: '700' }}>❌ LACAG MA BIXIN — {bishaLabel}</p>
            <h2 style={{ margin: '0.25rem 0 0', color: '#e74c3c', fontSize: '1.8rem', fontWeight: '800' }}>
              ${bishaSelected.wadartaMaBixin.toLocaleString()}
            </h2>
            <p style={{ margin: '0.1rem 0 0', color: '#95a5a6', fontSize: '0.78rem' }}>
              {tiradaMaBixinDhabta} arday
            </p>
          </div>
        </div>

        {/* Lacagaha Dambe */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1a3a5c', fontSize: '1rem', fontWeight: '700' }}>💳 Lacagaha Dambe</h3>
          {payments.length === 0 ? (
            <p style={{ color: '#95a5a6', textAlign: 'center', padding: '1rem' }}>Wax lacag ah ma jiraan weli</p>
          ) : payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: i < payments.length - 1 ? '1px solid #f0f4f8' : 'none' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#2c3e50', fontSize: '0.85rem' }}>{p.ardayda?.magaca || '—'}</p>
                <p style={{ margin: 0, color: '#95a5a6', fontSize: '0.75rem' }}>{p.bisha} {p.sannadka}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#27ae60', fontSize: '0.9rem' }}>${p.xaddiga}</p>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: p.bixiyay ? '#eafaf1' : '#fdedec', color: p.bixiyay ? '#27ae60' : '#e74c3c' }}>
                  {p.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
