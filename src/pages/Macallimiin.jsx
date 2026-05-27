// Macallimiin.jsx - Supabase version (was: localStorage)
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i);
const MONTHS = [
  { value: 1,  label: "Janaayo"   },
  { value: 2,  label: "Febraayo"  },
  { value: 3,  label: "Maarso"    },
  { value: 4,  label: "Abriil"    },
  { value: 5,  label: "Maajo"     },
  { value: 6,  label: "Juun"      },
  { value: 7,  label: "Luuliyo"   },
  { value: 8,  label: "Ogosto"    },
  { value: 9,  label: "Sebtembar" },
  { value: 10, label: "Oktoobar"  },
  { value: 11, label: "Nofembar"  },
  { value: 12, label: "Diseembar" },
];

// ====================================================
// SUPABASE HELPERS
// ====================================================

async function dbGetTeachers() {
  const { data, error } = await supabase
    .from("macallimiin")
    .select("id, magaca, telefoon, maado, mushahar, email")
    .order("magaca");
  if (error) { console.error(error); return []; }
  return (data || []).map(r => ({
    id:      r.id,
    name:    r.magaca,
    phone:   r.telefoon,
    subject: r.maado,
    salary:  parseFloat(r.mushahar) || 0,
    email:   r.email,
  }));
}

async function dbAddTeacher(teacher) {
  const { data, error } = await supabase
    .from("macallimiin")
    .insert({ magaca: teacher.name, telefoon: teacher.phone, maado: teacher.subject, mushahar: teacher.salary })
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return { id: data.id, name: data.magaca, phone: data.telefoon, subject: data.maado, salary: parseFloat(data.mushahar) };
}

async function dbDeleteTeacher(id) {
  const { error } = await supabase.from("macallimiin").delete().eq("id", id);
  if (error) console.error(error);
}

async function dbGetSalaryRecords(year, month) {
  const { data, error } = await supabase
    .from("mushahar_taarikh")
    .select("*")
    .eq("sanad", year)
    .eq("bil", month);
  if (error) { console.error(error); return []; }
  return data || [];
}

async function dbPaySalary(teacherId, year, month, currentRecord, addAmount) {
  const newPaid = Math.min(
    (parseFloat(currentRecord?.lacag_bixisay) || 0) + addAmount,
    parseFloat(currentRecord?.mushahar_wadarta) || 0
  );

  if (currentRecord?.id) {
    const { data, error } = await supabase
      .from("mushahar_taarikh")
      .update({ lacag_bixisay: newPaid, taarikh_lacag: new Date().toISOString().slice(0,10), updated_at: new Date().toISOString() })
      .eq("id", currentRecord.id)
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return data;
  } else {
    const { data: teacher } = await supabase.from("macallimiin").select("mushahar").eq("id", teacherId).single();
    const wadarta = parseFloat(teacher?.mushahar) || 0;
    const { data, error } = await supabase
      .from("mushahar_taarikh")
      .insert({ macalin_id: teacherId, sanad: year, bil: month, mushahar_wadarta: wadarta, lacag_bixisay: Math.min(addAmount, wadarta), taarikh_lacag: new Date().toISOString().slice(0,10) })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return data;
  }
}

async function dbGetTeacherHistory(teacherId) {
  const { data, error } = await supabase
    .from("mushahar_taarikh")
    .select("*")
    .eq("macalin_id", teacherId)
    .order("sanad", { ascending: false })
    .order("bil", { ascending: false });
  if (error) { console.error(error); return []; }
  return data || [];
}

// Map DB row → local record shape
function dbRowToRecord(row, teacher) {
  return {
    id:           row.id,
    teacher_id:   row.macalin_id,
    year:         row.sanad,
    month:        row.bil,
    total_salary: parseFloat(row.mushahar_wadarta) || teacher?.salary || 0,
    amount_paid:  parseFloat(row.lacag_bixisay) || 0,
    payment_date: row.taarikh_lacag,
    _raw:         row,
  };
}

function makeEmptyRecord(teacher, year, month) {
  return {
    id:           null,
    teacher_id:   teacher.id,
    year,
    month,
    total_salary: teacher.salary,
    amount_paid:  0,
    payment_date: null,
    _raw:         null,
  };
}

function calculateStatus(record) {
  const debt = record.total_salary - record.amount_paid;
  if (debt <= 0)             return { label: "Dhammaystiran ✓", type: "paid",    debt: 0 };
  if (record.amount_paid > 0) return { label: "Qayb bixisay",   type: "partial", debt };
  return                            { label: "Mushaharka lama bixin", type: "pending", debt };
}

// ====================================================
// SUB-COMPONENTS
// ====================================================

function StatusBadge({ status }) {
  const styles = {
    paid:    { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
    partial: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
    pending: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
  };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, ...styles[status.type] }}>
      {status.label}
    </span>
  );
}

function PaymentModal({ teacher, record, year, month, onClose, onSave }) {
  const [amount, setAmount]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const remaining = record.total_salary - record.amount_paid;
  const monthName = MONTHS.find((m) => m.value === month)?.label;

  async function handlePay() {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { setError("Fadlan geli lacag saxsan"); return; }
    if (val > remaining + 0.01) { setError(`Max: $${remaining.toFixed(2)}`); return; }

    setLoading(true);
    const updated = await dbPaySalary(teacher.id, year, month, record._raw, val);
    setLoading(false);
    if (!updated) { setError("Khalad Supabase. Internet hubi."); return; }
    onSave(dbRowToRecord(updated, teacher));
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#1a1a1a" }}>💰 Lacag Bixi</h2>
        <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>{teacher.name} — {monthName} {year}</p>

        <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>MUSHAHAR</div><div style={{ fontSize: 18, fontWeight: 700 }}>${record.total_salary}</div></div>
          <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>LA BIXIYAY</div><div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>${record.amount_paid.toFixed(2)}</div></div>
          <div><div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>DEYN</div><div style={{ fontSize: 18, fontWeight: 700, color: remaining > 0 ? "#dc2626" : "#059669" }}>${remaining.toFixed(2)}</div></div>
        </div>

        {remaining <= 0 ? (
          <div style={{ background: "#d1fae5", borderRadius: 10, padding: 16, textAlign: "center", color: "#065f46", fontWeight: 600 }}>
            ✅ Mushaharka bishaan si buuxda ayaa loo bixiyay
          </div>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>Lacagta aad bixinayso ($)</label>
            <input type="number" min="1" max={remaining} step="0.01" placeholder={`Max: $${remaining.toFixed(2)}`} value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              style={{ width: "100%", padding: "10px 14px", border: error ? "2px solid #dc2626" : "2px solid #e2e8f0", borderRadius: 8, fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8 }} autoFocus />
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[25,50,75,100].map((pct) => {
                const val = ((remaining * pct) / 100).toFixed(2);
                return (
                  <button key={pct} onClick={() => { setAmount(val); setError(""); }}
                    style={{ flex: 1, padding: "6px 4px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#475569" }}>
                    {pct}% (${val})
                  </button>
                );
              })}
            </div>
            {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", color: "#475569" }}>Jooji</button>
          {remaining > 0 && (
            <button onClick={handlePay} disabled={loading}
              style={{ flex: 1, padding: "11px", background: loading ? "#94a3b8" : "#065f46", border: "none", borderRadius: 8, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", color: "#fff", fontWeight: 600 }}>
              {loading ? "⏳..." : "💸 Bixi"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ teacher, onClose }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbGetTeacherHistory(teacher.id).then((data) => {
      const mapped = data.map((row) => ({
        ...dbRowToRecord(row, teacher),
        monthName: MONTHS.find((m) => m.value === row.bil)?.label || row.bil,
      }));
      setRows(mapped);
      setLoading(false);
    });
  }, [teacher.id]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 560, maxWidth: "95vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>📋 Taariikhda Mushaharada — {teacher.name}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666" }}>✕</button>
        </div>
        {loading ? (
          <p style={{ textAlign: "center", color: "#888", padding: 32 }}>⏳ Soo raraya...</p>
        ) : rows.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: 32 }}>Wali xog mushahar ah lama keydin</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                {["Bil / Sanad","Mushahar","La bixiyay","Deyn","Xaaladda"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: h === "Bil / Sanad" ? "left" : h === "Xaaladda" ? "center" : "right", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((rec) => {
                const status = calculateStatus(rec);
                return (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{rec.monthName} {rec.year}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>${rec.total_salary}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#059669" }}>${rec.amount_paid.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: status.debt > 0 ? "#dc2626" : "#059669", fontWeight: 600 }}>
                      {status.debt > 0 ? `-$${status.debt.toFixed(2)}` : "$0"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}><StatusBadge status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TeacherCard({ teacher, record, onPayClick, onHistoryClick, onDeleteClick }) {
  const status = calculateStatus(record);
  const initial = teacher.name.charAt(0).toUpperCase();
  const bgColors = ["#1a7a4a","#1e5fa0","#7c3aed","#b45309","#be185d"];
  const bg = bgColors[teacher.name.charCodeAt(0) % bgColors.length];

  return (
    <div style={{ background: "#fff", border: "1.5px solid", borderColor: status.type === "paid" ? "#6ee7b7" : status.type === "partial" ? "#fcd34d" : "#e2e8f0", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{teacher.name}</div>
          <div style={{ fontSize: 13, color: "#888" }}>{teacher.subject || "Maadada lama gelin"}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
        <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>MUSHAHAR</div><div style={{ fontWeight: 700, color: "#1a1a1a" }}>${record.total_salary}</div></div>
        <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>BIXIYAY</div><div style={{ fontWeight: 700, color: "#059669" }}>${record.amount_paid.toFixed(2)}</div></div>
        <div><div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>DEYN</div><div style={{ fontWeight: 700, color: status.debt > 0 ? "#dc2626" : "#059669" }}>{status.debt > 0 ? `-$${status.debt.toFixed(2)}` : "✓ $0"}</div></div>
      </div>

      {teacher.phone && <div style={{ fontSize: 13, color: "#555" }}>📞 {teacher.phone}</div>}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onPayClick(teacher, record)}
          style={{ flex: 2, padding: "9px", background: status.type === "paid" ? "#d1fae5" : "#065f46", color: status.type === "paid" ? "#065f46" : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {status.type === "paid" ? "✅ Dhammaystiran" : "💸 Lacag Bixi"}
        </button>
        <button onClick={() => onHistoryClick(teacher)}
          style={{ flex: 1, padding: "9px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
          📋 Taariikh
        </button>
        <button onClick={() => onDeleteClick(teacher.id)}
          style={{ padding: "9px 12px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
          🗑️
        </button>
      </div>
    </div>
  );
}

// ====================================================
// MAIN PAGE
// ====================================================
export default function MacallimiiPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [teachers, setTeachers]           = useState([]);
  const [records, setRecords]             = useState({});
  const [payModal, setPayModal]           = useState(null);
  const [historyModal, setHistoryModal]   = useState(null);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [newTeacher, setNewTeacher]       = useState({ name: "", phone: "", subject: "", salary: 0 });
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingRecords, setLoadingRecords]   = useState(false);
  const [savingTeacher, setSavingTeacher]     = useState(false);

  // Load teachers
  useEffect(() => {
    setLoadingTeachers(true);
    dbGetTeachers().then((list) => {
      setTeachers(list);
      setLoadingTeachers(false);
    });
  }, []);

  // Load salary records when year/month/teachers change
  useEffect(() => {
    if (teachers.length === 0) { setRecords({}); return; }
    setLoadingRecords(true);
    dbGetSalaryRecords(selectedYear, selectedMonth).then((rows) => {
      const recs = {};
      teachers.forEach((t) => {
        const row = rows.find((r) => r.macalin_id === t.id);
        recs[t.id] = row ? dbRowToRecord(row, t) : makeEmptyRecord(t, selectedYear, selectedMonth);
      });
      setRecords(recs);
      setLoadingRecords(false);
    });
  }, [teachers, selectedYear, selectedMonth]);

  function handleSaveRecord(updated) {
    setRecords((prev) => ({ ...prev, [updated.teacher_id]: updated }));
  }

  async function handleAddTeacher() {
    if (!newTeacher.name.trim()) return;
    setSavingTeacher(true);
    const added = await dbAddTeacher(newTeacher);
    setSavingTeacher(false);
    if (!added) return;
    setTeachers((prev) => [...prev, added]);
    setNewTeacher({ name: "", phone: "", subject: "", salary: 0 });
    setShowAddModal(false);
  }

  async function handleDeleteTeacher(id) {
    if (!window.confirm("Miyaad hubtaa inaad tirtirto macallimkan?")) return;
    await dbDeleteTeacher(id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setRecords((prev) => { const r = { ...prev }; delete r[id]; return r; });
  }

  const totalSalary = Object.values(records).reduce((s, r) => s + r.total_salary, 0);
  const totalPaid   = Object.values(records).reduce((s, r) => s + r.amount_paid,  0);
  const totalDebt   = totalSalary - totalPaid;
  const paidCount   = Object.values(records).filter((r) => r.total_salary - r.amount_paid <= 0).length;
  const monthName   = MONTHS.find((m) => m.value === selectedMonth)?.label;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#1a1a1a" }}>👨‍🏫 Macallimiin</h1>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>{teachers.length} macalin</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)}
            style={{ padding: "8px 12px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", cursor: "pointer" }}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(+e.target.value)}
            style={{ padding: "8px 12px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", cursor: "pointer" }}>
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button onClick={() => setShowAddModal(true)}
            style={{ padding: "9px 18px", background: "#065f46", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            + Macalin Cusub
          </button>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Stats */}
        {!loadingRecords && teachers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Mushahar Wadarta", value: `$${totalSalary.toFixed(2)}`, color: "#1a1a1a", bg: "#fff" },
              { label: "La Bixiyay",       value: `$${totalPaid.toFixed(2)}`,   color: "#059669", bg: "#f0fdf4" },
              { label: "Wadarta Deynta",   value: `$${totalDebt.toFixed(2)}`,   color: totalDebt > 0 ? "#dc2626" : "#059669", bg: totalDebt > 0 ? "#fff5f5" : "#f0fdf4" },
              { label: "Dhammaystiran",    value: `${paidCount}/${teachers.length}`, color: "#1e5fa0", bg: "#eff6ff" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{monthName} {selectedYear}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading states */}
        {loadingTeachers && <div style={{ textAlign: "center", padding: 60, color: "#888", fontSize: 18 }}>⏳ Macallimiinta soo raraya...</div>}
        {!loadingTeachers && teachers.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🏫</div>
            <h3 style={{ margin: "0 0 8px", color: "#1a1a1a" }}>Wali macalin lama gelin</h3>
            <button onClick={() => setShowAddModal(true)}
              style={{ marginTop: 16, padding: "10px 24px", background: "#065f46", color: "#fff", border: "none", borderRadius: 9, fontSize: 15, cursor: "pointer", fontWeight: 600 }}>
              + Macalin Cusub Kudar
            </button>
          </div>
        )}

        {/* Teacher cards */}
        {!loadingTeachers && teachers.length > 0 && (
          <div style={{ position: "relative" }}>
            {loadingRecords && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(245,247,250,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, borderRadius: 12 }}>
                <span style={{ fontSize: 18, color: "#888" }}>⏳ Xogta mushaharada soo raraya...</span>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  record={records[teacher.id] || makeEmptyRecord(teacher, selectedYear, selectedMonth)}
                  onPayClick={(t, r) => setPayModal({ teacher: t, record: r })}
                  onHistoryClick={(t) => setHistoryModal(t)}
                  onDeleteClick={handleDeleteTeacher}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {payModal && (
        <PaymentModal
          teacher={payModal.teacher}
          record={payModal.record}
          year={selectedYear}
          month={selectedMonth}
          onClose={() => setPayModal(null)}
          onSave={(updated) => { handleSaveRecord(updated); setPayModal(null); }}
        />
      )}

      {/* History Modal */}
      {historyModal && <HistoryModal teacher={historyModal} onClose={() => setHistoryModal(null)} />}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 420, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 22 }}>👨‍🏫 Macalin Cusub</h2>
            {[
              { label: "Magaca *", key: "name", type: "text", placeholder: "Macallimka magaciis" },
              { label: "Telefoon", key: "phone", type: "tel", placeholder: "+252..." },
              { label: "Maadada", key: "subject", type: "text", placeholder: "Xisaab, Af Soomaali..." },
              { label: "Mushahar ($)", key: "salary", type: "number", placeholder: "0" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#333" }}>{label}</label>
                <input type={type} placeholder={placeholder} value={newTeacher[key]}
                  onChange={(e) => setNewTeacher((p) => ({ ...p, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setShowAddModal(false)}
                style={{ flex: 1, padding: "11px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", color: "#475569" }}>
                Jooji
              </button>
              <button onClick={handleAddTeacher} disabled={savingTeacher}
                style={{ flex: 1, padding: "11px", background: savingTeacher ? "#94a3b8" : "#065f46", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: savingTeacher ? "not-allowed" : "pointer" }}>
                {savingTeacher ? "⏳ Kaydaya..." : "✅ Kaydi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
