import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ ardayda: 0, macallimiin: 0, lacagBixiyay: 0, lacagMaBixin: 0 })
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [ardaydaRes, macallimiinRes, lacagtaRes] = await Promise.all([
        supabase.from('ardayda').select('id', { count: 'exact' }),
        supabase.from('macallimiin').select('id', { count: 'exact' }),
        supabase.from('lacagta').select('*').order('created_at', { ascending: false }).limit(5)
      ])

      const lacagta = lacagtaRes.data || []
      const bixiyay = lacagta.filter(l => l.bixiyay).reduce((s, l) => s + Number(l.xaddiga), 0)
      const maBixin = lacagta.filter(l => !l.bixiyay).reduce((s, l) => s + Number(l.xaddiga), 0)

      setStats({
        ardayda: ardaydaRes.count || 0,
        macallimiin: macallimiinRes.count || 0,
        lacagBixiyay: bixiyay,
        lacagMaBixin: maBixin
      })
      setPayments(lacagta)
    } catch (e) { }
    setLoading(false)
  }

  const cards = [
    { label: 'Ardayda Guud', value: stats.ardayda, icon: '🎓', color: '#3498db', bg: '#ebf5fb' },
    { label: 'Macallimiin', value: stats.macallimiin, icon: '👨‍🏫', color: '#27ae60', bg: '#eafaf1' },
    { label: 'Lacag Bixiyay', value: `$${stats.lacagBixiyay.toLocaleString()}`, icon: '✅', color: '#27ae60', bg: '#eafaf1' },
    { label: 'Lacag Ma Bixin', value: `$${stats.lacagMaBixin.toLocaleString()}`, icon: '⚠️', color: '#e74c3c', bg: '#fdedec' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>
          🏠 Xarunta
        </h1>
        <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>
          Ku soo dhawoow, {user.magaca}! — {new Date().toLocaleDateString('so-SO')}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '16px', padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: `4px solid ${card.color}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {card.label}
                </p>
                <h2 style={{ margin: '0.4rem 0 0', color: card.color, fontSize: '2rem', fontWeight: '800' }}>
                  {loading ? '...' : card.value}
                </h2>
              </div>
              <div style={{ fontSize: '2.5rem', background: card.bg, padding: '0.6rem', borderRadius: '12px' }}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Payments */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <h3 style={{ margin: '0 0 1.2rem', color: '#1a3a5c', fontSize: '1.1rem', fontWeight: '700' }}>
          💳 Lacagaha Dambe
        </h3>
        {payments.length === 0 ? (
          <p style={{ color: '#95a5a6', textAlign: 'center', padding: '2rem' }}>Wax lacag ah ma jiraan weli</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f4f8' }}>
                {['Arday', 'Bisha', 'Xaddiga', 'Xaaladda'].map(h => (
                  <th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#7f8c8d', fontSize: '0.8rem', fontWeight: '600' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '0.7rem' }}>{p.arday_id?.slice(0,8)}...</td>
                  <td style={{ padding: '0.7rem', color: '#5d6d7e' }}>{p.bisha} {p.sannadka}</td>
                  <td style={{ padding: '0.7rem', fontWeight: '600', color: '#27ae60' }}>${p.xaddiga}</td>
                  <td style={{ padding: '0.7rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                      background: p.bixiyay ? '#eafaf1' : '#fdedec',
                      color: p.bixiyay ? '#27ae60' : '#e74c3c'
                    }}>
                      {p.bixiyay ? '✅ Bixiyay' : '❌ Ma Bixin'}
                    </span>
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
