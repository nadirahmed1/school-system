import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

const FASALKA = ['Fasal 1', 'Fasal 2', 'Fasal 3', 'Fasal 4', 'Fasal 5', 'Fasal 6', 'Fasal 7', 'Fasal 8']
const empty = { magaca: '', aabaha_magac: '', telefoon: '', fasalka: 'Fasal 1', arday_id_gaar: '', taariikhda_diiwaangelinta: new Date().toISOString().split('T')[0] }

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
    const { data, error } = await supabase.from('ardayda').select('*').order('created_at', { ascending: false })
    if (error) {
      setMsg('❌ Khalad: ' + error.message)
    }
    setArdayda(data || [])
    setLoading(false)
  }

  // Generate student ID like ARD-001
  const generateId = (list) => {
    const maxNum = list.reduce((max, a) => {
      const match = (a.arday_id_gaar || '').match(/ARD-(\d+)/)
      return match ? Math.max(max, parseInt(match[1])) : max
    }, 0)
    return `ARD-${(maxNum + 1).toString().padStart(3, '0')}`
  }

  const save = async () => {
    if (!form.magaca.trim()) return setMsg('⚠️ Magaca arday qor!')
    setSaving(true)
    try {
      const idGaar = form.arday_id_gaar.trim() || generateId(ardayda)
      const saveData = { ...form, arday_id_gaar: idGaar }
      let error
      if (editId) {
        const res = await supabase.from('ardayda').update(saveData).eq('id', editId)
        error = res.error
        if (!error) setMsg('✅ Waa la beddelay!')
      } else {
        const res = await supabase.from('ardayda').insert([saveData])
        error = res.error
        if (!error) { setMsg('✅ Arday cusub la daray!'); // otomaatig lacag ma-bixin u samee
        const newId = (await supabase.from('ardayda').select('id').eq('arday_id_gaar', idGaar).single()).data?.id
        if (newId) {
          const bishan = ["Janwaari","Febraayo","Maarso","Abriil","Maayo","Juun","Luuliyo","Agoosto","Sebteembar","Oktoobar","Nofembar","Disembar"][new Date().getMonth()]
          await supabase.from('lacagta').insert([{ arday_id: newId, xaddiga: 0, bisha: bishan, sannadka: new Date().getFullYear(), bixiyay: false, taariikhda_bixinta: null }])
        }
      }
      }
      if (error) {
        setMsg('❌ Khalad: ' + error.message)
      } else {
        setShowForm(false)
        setForm(empty)
        setEditId(null)
        fetchArdayda()
      }
    } catch(e) {
      setMsg('❌ Khalad: ' + e.message)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const del = async (id, magaca) => {
    if (!window.confirm(`${magaca} ma tirtirtaa?`)) return
    const { error } = await supabase.from('ardayda').delete().eq('id', id)
    if (error) {
      setMsg('❌ Tirtirka khalad: ' + error.message)
    } else {
      setMsg('🗑️ La tirtiray!')
      fetchArdayda()
    }
    setTimeout(() => setMsg(''), 3000)
  }

  const edit = (a) => {
    setForm({ 
      magaca: a.magaca || '', 
      aabaha_magac: a.aabaha_magac || '', 
      telefoon: a.telefoon || '', 
      fasalka: a.fasalka || 'Fasal 1', 
      arday_id_gaar: a.arday_id_gaar || '',
      taariikhda_diiwaangelinta: a.taariikhda_diiwaangelinta || new Date().toISOString().split('T')[0]
    })
    setEditId(a.id)
    setShowForm(true)
  }

  // Excel Upload — fixed: handle errors properly, validate columns
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setMsg('⏳ Excel-ka la akhriyaa...')
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const workbook = XLSX.read(evt.target.result, { type: 'array' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
          
          if (rows.length === 0) {
            setMsg('❌ Excel-ka madhan yahay!')
            return
          }

          // Get current ardayda fresh for ID generation
          const { data: currentList } = await supabase.from('ardayda').select('arday_id_gaar')
          const existingList = currentList || []

          const ardaydaNew = rows.map((row, i) => {
            const magaca = String(row['Magaca'] || row['magaca'] || '').trim()
            const hooyo = String(row['Magaca Hooyada'] || row['aabaha_magac'] || '').trim()
            const tel = String(row['Telefoon'] || row['telefoon'] || '').trim()
            const fasal = String(row['Fasalka'] || row['fasalka'] || 'Fasal 1').trim()
            const id = String(row['ID'] || row['arday_id_gaar'] || '').trim()
            
            const idFinal = id || `ARD-${(existingList.length + i + 1).toString().padStart(3,'0')}`
            
            return magaca ? {
              magaca,
              aabaha_magac: hooyo,
              telefoon: tel,
              fasalka: FASALKA.includes(fasal) ? fasal : 'Fasal 1',
              arday_id_gaar: idFinal,
              taariikhda_diiwaangelinta: new Date().toISOString().split('T')[0]
            } : null
          }).filter(Boolean)

          if (ardaydaNew.length === 0) {
            setMsg('❌ Excel-ka xog lama helin! Tiirarka hubi: ID | Magaca | Magaca Hooyada | Telefoon | Fasalka')
            return
          }

          const { error } = await supabase.from('ardayda').insert(ardaydaNew)
          if (error) {
            setMsg('❌ Upload khalad: ' + error.message)
          } else {
            setMsg(`✅ ${ardaydaNew.length} arday la daray!`)
            fetchArdayda()
          }
        } catch(parseErr) {
          setMsg('❌ Fayl-ka akhriyi kari waayay: ' + parseErr.message)
        }
        setTimeout(() => setMsg(''), 5000)
      }
      reader.onerror = () => setMsg('❌ Fayl-ka la furri kari waayay!')
      reader.readAsArrayBuffer(file)  // Use ArrayBuffer — more reliable than BinaryString
    } catch(e) { 
      setMsg('❌ Khalad: ' + e.message) 
    }
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['ID', 'Magaca', 'Magaca Hooyada', 'Telefoon', 'Fasalka'],
      ['ARD-001', 'Axmed Cali', 'Faadumo Xasan', '0612345678', 'Fasal 1'],
      ['ARD-002', 'Xaliimo Maxamed', 'Caasha Ciise', '0698765432', 'Fasal 2'],
      ['ARD-003', 'Cabdi Warsame', 'Hodan Maxamed', '0677654321', 'Fasal 3'],
    ])
    ws['!cols'] = [10,20,20,15,10].map(w => ({wch:w}))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ardayda')
    XLSX.writeFile(wb, 'ardayda-template.xlsx')
  }

  // Print Student ID Card
  const printIdCard = (a) => {
    const idNum = a.arday_id_gaar || 'ARD-???'
    const taariikhDiiwaangelin = a.taariikhda_diiwaangelinta 
      ? new Date(a.taariikhda_diiwaangelinta).toLocaleDateString('so-SO')
      : new Date().toLocaleDateString('so-SO')

    // Generate simple QR-like visual from ID
    const initials = (a.magaca || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
    
    const win = window.open('', '_blank', 'width=500,height=380')
    win.document.write(`
      <!DOCTYPE html>
      <html lang="so">
      <head>
        <meta charset="UTF-8">
        <title>ID Card — ${a.magaca}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: #f0f4f8; 
            display: flex; 
            justify-content: center; 
            align-items: center;
            min-height: 100vh;
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
          }
          .card-wrapper { display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .card {
            width: 340px;
            background: #fff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
          }
          .card-header {
            background: linear-gradient(135deg, #1a3a5c 0%, #3498db 100%);
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .school-info { color: #fff; }
          .school-name { font-size: 14px; font-weight: 800; letter-spacing: 0.5px; }
          .school-sub { font-size: 10px; opacity: 0.8; margin-top: 2px; }
          .card-type {
            background: rgba(255,255,255,0.2);
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .card-body {
            padding: 16px 18px;
            display: flex;
            gap: 16px;
            align-items: center;
          }
          .avatar {
            width: 72px;
            height: 72px;
            border-radius: 12px;
            background: linear-gradient(135deg, #1a3a5c, #27ae60);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: 800;
            color: #fff;
            flex-shrink: 0;
            letter-spacing: 1px;
          }
          .student-info { flex: 1; }
          .student-name { font-size: 17px; font-weight: 800; color: #1a3a5c; margin-bottom: 4px; }
          .info-line { font-size: 12px; color: #5d6d7e; margin-bottom: 3px; display: flex; align-items: center; gap: 4px; }
          .info-line span { font-weight: 600; color: #2c3e50; }
          .card-footer {
            background: #f8fafc;
            border-top: 2px solid #e8ecf0;
            padding: 10px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .id-badge {
            background: #1a3a5c;
            color: #fff;
            font-size: 15px;
            font-weight: 800;
            padding: 6px 14px;
            border-radius: 8px;
            letter-spacing: 1px;
          }
          .valid-info { text-align: right; }
          .valid-label { font-size: 10px; color: #95a5a6; text-transform: uppercase; }
          .valid-date { font-size: 12px; font-weight: 700; color: #2c3e50; }
          .barcode {
            display: flex;
            gap: 2px;
            align-items: flex-end;
            height: 28px;
          }
          .bar {
            background: #1a3a5c;
            width: 2px;
            border-radius: 1px;
          }
          .print-btn {
            background: linear-gradient(135deg, #1a3a5c, #3498db);
            color: #fff;
            border: none;
            padding: 10px 28px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          @media print {
            body { background: #fff; padding: 0; }
            .card { box-shadow: none; }
            .print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="card-wrapper">
          <div class="card">
            <div class="card-header">
              <div class="school-info">
                <div class="school-name">🏫 NIDAAMKA DUGSIGA</div>
                <div class="school-sub">Kaadhka Aqoonsiga Arday</div>
              </div>
              <div class="card-type">Student ID</div>
            </div>
            <div class="card-body">
              <div class="avatar">${initials}</div>
              <div class="student-info">
                <div class="student-name">${a.magaca || '—'}</div>
                <div class="info-line">📚 Fasalka: <span>${a.fasalka || '—'}</span></div>
                <div class="info-line">👩 Hooyada: <span>${a.aabaha_magac || '—'}</span></div>
                <div class="info-line">📞 Tel: <span>${a.telefoon || '—'}</span></div>
              </div>
            </div>
            <div class="card-footer">
              <div class="id-badge">${idNum}</div>
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="barcode">
                  ${Array.from({length: 18}, (_, i) => {
                    const heights = [18,12,24,16,20,14,22,10,18,24,12,20,16,22,10,18,14,20]
                    return `<div class="bar" style="height:${heights[i]}px; opacity:${0.6 + (i%3)*0.13}"></div>`
                  }).join('')}
                </div>
                <div class="valid-info">
                  <div class="valid-label">La Diiwaangeliyay</div>
                  <div class="valid-date">${taariikhDiiwaangelin}</div>
                </div>
              </div>
            </div>
          </div>
          <button class="print-btn" onclick="window.print()">🖨️ Daabac ID-ga</button>
        </div>
      </body>
      </html>
    `)
    win.document.close()
  }

  const filtered = ardayda.filter(a => 
    a.magaca?.toLowerCase().includes(search.toLowerCase()) || 
    a.fasalka?.toLowerCase().includes(search.toLowerCase()) ||
    a.arday_id_gaar?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1a3a5c', fontSize: '1.8rem', fontWeight: '800' }}>🎓 Ardayda</h1>
          <p style={{ color: '#7f8c8d', margin: '0.3rem 0 0' }}>{ardayda.length} arday oo diiwaangashan</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ padding: '0.75rem 1.2rem', background: 'linear-gradient(135deg, #27ae60, #1e8449)', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📊 Excel Upload
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={downloadTemplate} style={{ padding: '0.75rem 1.2rem', background: '#fff', color: '#27ae60', border: '2px solid #27ae60', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
            📥 Template
          </button>
          <button onClick={() => { setShowForm(true); setForm({...empty, arday_id_gaar: generateId(ardayda)}); setEditId(null) }} style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1a3a5c, #3498db)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>
            ➕ Arday Ku Dar
          </button>
        </div>
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', background: msg.includes('❌')||msg.includes('⚠️') ? '#fdedec':'#eafaf1', border: `1px solid ${msg.includes('❌')||msg.includes('⚠️')?'#f5c6c6':'#a9dfbf'}`, borderRadius: '8px', color: msg.includes('❌')||msg.includes('⚠️')?'#e74c3c':'#27ae60', marginBottom: '1rem', fontWeight: '600' }}>{msg}</div>}

      <div style={{ padding: '0.6rem 1rem', background: '#ebf5fb', border: '1px solid #aed6f1', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem', color: '#2471a3' }}>
        📊 <strong>Excel:</strong> Tiirarka — <strong>ID | Magaca | Magaca Hooyada | Telefoon | Fasalka</strong>
      </div>

      <div style={{ marginBottom: '1.2rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Raadi magaca, ID, ama fasalka..."
          style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #e8ecf0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#1a3a5c' }}>{editId ? '✏️ Wax Ka Beddel' : '➕ Arday Cusub'}</h2>
            {[
              { label: 'ID Arday', key: 'arday_id_gaar', placeholder: 'ARD-001 (auto-sameeya haddaan dhaafin)' },
              { label: 'Magaca Arday *', key: 'magaca', placeholder: 'Magaca buuxa' },
              { label: 'Magaca Hooyada', key: 'aabaha_magac', placeholder: 'Magaca hooyada' },
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
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '0.8rem', background: saving ? '#95a5a6' : 'linear-gradient(135deg, #1a3a5c, #3498db)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                {saving ? '⏳ Keydaya...' : '💾 Keydi'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, padding: '0.8rem', background: '#f8fafc', color: '#5d6d7e', border: '2px solid #e8ecf0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                Jooji
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>⏳ Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#95a5a6' }}>Arday lama helin</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['ID', 'Magaca', 'Hooyada', 'Telefoon', 'Fasalka', 'Ficilka'].map(h => (
                  <th key={h} style={{ padding: '1rem', textAlign: 'left', color: '#5d6d7e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e8ecf0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', background: '#1a3a5c', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {a.arday_id_gaar || `ARD-${(i+1).toString().padStart(3,'0')}`}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#2c3e50' }}>{a.magaca}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{a.aabaha_magac || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#5d6d7e' }}>{a.telefoon || '—'}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', background: '#ebf5fb', color: '#3498db', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>{a.fasalka}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => printIdCard(a)} style={{ padding: '0.4rem 0.8rem', background: 'linear-gradient(135deg, #8e44ad, #9b59b6)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem' }}>🪪 ID Card</button>
                      <button onClick={() => edit(a)} style={{ padding: '0.4rem 0.8rem', background: '#ebf5fb', color: '#3498db', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem' }}>✏️ Beddel</button>
                      <button onClick={() => del(a.id, a.magaca)} style={{ padding: '0.4rem 0.8rem', background: '#fdedec', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem' }}>🗑️</button>
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
