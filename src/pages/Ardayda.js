import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

const FASALKA = ['Fasal 1', 'Fasal 2', 'Fasal 3', 'Fasal 4', 'Fasal 5', 'Fasal 6', 'Fasal 7', 'Fasal 8']
const empty = { magaca: '', hooyo_magac: '', telefoon: '', fasalka: 'Fasal 1', taariikhda_diiwaangelinta: '' }

export default function Ardayda() {
  const [ardayda, setArdayda] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)

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
    try {
      if (editId) {
        await supabase.from('ardayda').update(form).eq('id', editId)
        setMsg('✅ Waa la beddelay!')
      } else {
        await supabase.from('ardayda').insert([form])
        setMsg('✅ Arday cusub la daray!')
      }
      setShowForm(false)
      setForm(empty)
      setEditId(null)
      fetchArdayda()
    } catch(e) {
      setMsg('❌ Khalad ayaa dhacay!')
    }
    setSaving(false)
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
    setForm({ 
      magaca: a.magaca, 
      hooyo_magac: a.hooyo_magac || a.aabaha_magac || '', 
      telefoon: a.telefoon || '', 
      fasalka: a.fasalka || 'Fasal 1', 
      taariikhda_diiwaangelinta: a.taariikhda_diiwaangelinta || '' 
    })
    setEditId(a.id)
    setShowForm(true)
  }

  // Excel Upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setMsg('⏳ Excel-ka la akhriyaa...')

    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        const workbook = XLSX.read(evt.target.result, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet)

        const ardaydaNew = rows.map(row => ({
          magaca: row['Magaca'] || row['magaca'] || row['Name'] || '',
          hooyo_magac: row['Magaca Hooyada'] || row['hooyo_magac'] || row['Mother'] || '',
          telefoon: String(row['Telefoon'] || row['telefoon'] || row['Phone'] || ''),
          fasalka: row['Fasalka'] || row['fasalka'] || row['Class'] || 'Fasal 1',
          taariikhda_diiwaangelinta: new Date().toISOString().split('T')[0]
        })).filter(a => a.magaca)

        if (ardaydaNew.length === 0) {
          setMsg('❌ Excel-ka ma laha xog sax ah! Tiirarka hubi.')
          setUploading(false)
          return
        }

        const { error } = await supabase.from('ardayda').insert(ardaydaNew)
        if (error) {
          setMsg('❌ Upload khalad: ' + error.message)
        } else {
          setMsg(`✅ ${ardaydaNew.length} arday la daray!`)
          fetchArdayda()
        }
        setUploading(false)
        setTimeout(() => setMsg(''), 4000)
      }
      reader.readAsBinaryString(file)
    } catch(e) {
      setMsg('❌ Khalad ayaa dhacay!')
      setUploading(false)
    }
    e.target.value = ''
  }

  // Download Excel template
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Magaca', 'Magaca Hooyada', 'Telefoon', 'Fasalka'],
      ['Axmed Cali', 'Faadumo Xasan', '0612345678', 'Fasal 1'],
      ['Xaliimo Maxamed', 'Caasha Ciise', '0698765432', 'Fasal 2'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ardayda')
    XLSX.writeFile(wb, 'ardayda-template.xlsx')
  }

  const filtered = ardayda.filter(a => 
    a.magaca?.toLowerCase().includes(search.toLowerCase()) || 
    a.fasalka?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>🎓 Ardayda</h1>
          <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>{ardayda.length} arday oo diiwaangashan</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Excel Upload */}
          <label style={{
            padding: '0.75rem 1.2rem', background: 'linear-gradient(135deg, #27ae60, #1e8449)',
            color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            📊 Excel Upload
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={downloadTemplate} style={{
            padding: '0.75rem 1.2rem', background: '#fff', color: '#27ae60',
            border: '2px solid #27ae60', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem'
          }}>
            📥 Template
          </button>
          <button onClick={() => { setShowForm(true); setForm(empty); setEditId(null) }} style={{
            padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #3498db)',
            color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem'
          }}>
            ➕ Arday Ku Dar
          </button>
        </div>
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '8px', color: '#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>}

      {/* Excel format info */}
      <div style={{ padding: '0.75rem 1rem', background: '#ebf5fb', border: '1px solid #aed6f1', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem', color: '#2471a3' }}>
        📊 <strong>Excel Upload:</strong> Tiirarka: <strong>Magaca | Magaca Hooyada | Telefoon | Fasalka</strong> — Template soo daji tusaale ahaan
      </div>

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
              { label: 'Magaca Hooyada', key: 'hooyo_magac', placeholder: 'Magaca hooyada' },
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
                {['#', 'Magaca', 'Hooyada', 'Telefoon', 'Fasalka', 'Ficilka'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', color: '#5d6d7e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.9rem 1rem', color: '#95a5a6', fontSize: '0.85rem' }}>{i + 1}</td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#2c3e50' }}>{a.magaca}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{a.hooyo_magac || a.aabaha_magac || '—'}</td>
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
