import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BISHOOYINKA = ['Janvier','Febraayo','Maarso','Abril','Maayo','Juun','Luuliyo','Agoosto','Sebteembar','Oktoobar','Nofembar','Disembar']

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ ardayda: 0, macallimiin: 0, bixiyay: 0, mabixin: 0, tiradaBixiyay: 0, tiradaMaBixin: 0 })
  const [payments, setPayments] = useState([])
  const [monthlyIncome, setMonthlyIncome] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const [ardaydaRes, macallimiinRes, lacagtaRes] = await Promise.all([
        supabase.from('ardayda').select('id', { count: 'exact' }),
        supabase.from('macallimiin').select('id', { count: 'exact' }),
        supabase.from('lacagta').select('*, ardayda(magaca)').order('created_at', { ascending: false })
      ])

      const lacagta = lacagtaRes.data || []
      const bixiyayList = lacagta.filter(l => l.bixiyay)
      const mabixinList = lacagta.filter(l => !l.bixiyay)

      // Monthly breakdown
      const monthly = BISHOOYINKA.map((bisha, idx) => {
        const bishaLacag = lacagta.filter(l => l.bisha === bisha && l.sannadka === selectedYear)
        return {
          bisha,
          wadarta: bishaLacag.filter(l => l.bixiyay).reduce((s,l) => s + Number(l.xaddiga), 0),
          tirada: bishaLacag.filter(l => l.bixiyay).length
        }
      })

      setStats({
        ardayda: ardaydaRes.count || 0,
        macallimiin: macallimiinRes.count || 0,
        bixiyay: bixiyayList.reduce((s,l) => s + Number(l.xaddiga), 0),
        mabixin: mabixinList.reduce((s,l) => s + Number(l.xaddiga), 0),
        tiradaBixiyay: bixiyayList.length,
        tiradaMaBixin: mabixinList.length
      })
      setPayments(lacagta.slice(0, 6))
      setMonthlyIncome(monthly)
    } catch(e) {}
    setLoading(false)
  }

  const currentMonthIncome = monthlyIncome[selectedMonth]?.wadarta || 0

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>🏠 Xarunta</h1>
        <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>Ku soo dhawoow, {user.magaca}! — {new Date().toLocaleDateString('so-SO')}</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        {[
          { label: 'Ardayda Guud', value: stats.ardayda, icon: '🎓', color: '#3498db', bg: '#ebf5fb' },
          { label: 'Macallimiin', value: stats.macallimiin, icon: '👨‍🏫', color: '#27ae60', bg: '#eafaf1' },
          { 
            label: 'Lacag Bixiyay', 
            value: `$${stats.bixiyay.toLocaleString()}`, 
            sub: `${stats.tiradaBixiyay} arday`,
            icon: '✅', color: '#27ae60', bg: '#eafaf1' 
          },
          { 
            label: 'Lacag Ma Bixin', 
            value: `$${stats.mabixin.toLocaleString()}`, 
            sub: `${stats.tiradaMaBixin} arday`,
            icon: '📋', color: '#e74c3c', bg: '#fdedec' 
          },
        ].map((card, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</p>
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

      {/* Monthly Income Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Monthly Selector */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1a3a5c', fontSize: '1rem', fontWeight: '700' }}>📅 Lacagta Bisha</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {BISHOOYINKA.map((b, i) => (
              <button key={i} onClick={() => setSelectedMonth(i)} style={{
                padding: '0.35rem 0.7rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                background: selectedMonth === i ? '#1a3a5c' : '#f0f4f8',
                color: selectedMonth === i ? '#fff' : '#5d6d7e'
              }}>{b}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#eafaf1', borderRadius: '12px' }}>
            <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.85rem' }}>{BISHOOYINKA[selectedMonth]} {selectedYear}</p>
            <h2 style={{ margin: '0.3rem 0 0', color: '#27ae60', fontSize: '2rem', fontWeight: '800' }}>
              ${currentMonthIncome.toLocaleString()}
            </h2>
            <p style={{ margin: '0.2rem 0 0', color: '#95a5a6', fontSize: '0.8rem' }}>
              {monthlyIncome[selectedMonth]?.tirada || 0} lacag-bixin
            </p>
          </div>
        </div>

        {/* Recent Payments */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1a3a5c', fontSize: '1rem', fontWeight: '700' }}>💳 Lacagaha Dambe</h3>
          {payments.length === 0 ? (
            <p style={{ color: '#95a5a6', textAlign: 'center', padding: '1rem' }}>Wax lacag ah ma jiraan weli</p>
          ) : payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: i < payments.length-1 ? '1px solid #f0f4f8' : 'none' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#2c3e50', fontSize: '0.85rem' }}>{p.ardayda?.magaca || '—'}</p>
                <p style={{ margin: 0, color: '#95a5a6', fontSize: '0.75rem' }}>{p.bisha} {p.sannadka}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#27ae60', fontSize: '0.9rem' }}>${p.xaddiga}</p>
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600', background: p.bixiyay ? '#eafaf1' : '#fdedec', color: p.bixiyay ? '#27ae60' : '#e74c3c' }}>
                  {p.bixiyay ? '✅' : '❌'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
