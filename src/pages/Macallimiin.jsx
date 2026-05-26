// Macallimiin.jsx - Complete Teacher Salary Management Page
// Includes: Year/Month filter, salary payment with debt logic, history tracking

import { useState, useEffect } from "react";

// ====================================================
// CONSTANTS
// ====================================================
const YEARS = Array.from({ length: 12 }, (_, i) => 2024 + i); // 2024-2035
const MONTHS = [
  { value: 1, label: "Janaayo" },
  { value: 2, label: "Febraayo" },
  { value: 3, label: "Maarso" },
  { value: 4, label: "Abriil" },
  { value: 5, label: "Maajo" },
  { value: 6, label: "Juun" },
  { value: 7, label: "Luuliyo" },
  { value: 8, label: "Ogosto" },
  { value: 9, label: "Sebtembar" },
  { value: 10, label: "Oktoobar" },
  { value: 11, label: "Nofembar" },
  { value: 12, label: "Diseembar" },
];

// ====================================================
// DATABASE HELPERS (localStorage as DB simulation)
// Real app: replace with your Supabase/Firebase calls
// ====================================================

function getSalaryKey(teacherId, year, month) {
  return `salary_${teacherId}_${year}_${month}`;
}

function getSalaryRecord(teacherId, year, month) {
  const key = getSalaryKey(teacherId, year, month);
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function saveSalaryRecord(record) {
  const key = getSalaryKey(record.teacher_id, record.year, record.month);
  localStorage.setItem(key, JSON.stringify(record));
}

function createSalaryRecord(teacher, year, month) {
  return {
    id: `${teacher.id}_${year}_${month}`,
    teacher_id: teacher.id,
    teacher_name: teacher.name,
    year,
    month,
    total_salary: teacher.salary, // Mushaharka lagu heshiiyay
    amount_paid: 0,
    payment_date: null,
    created_at: new Date().toISOString(),
  };
}

function getOrCreateRecord(teacher, year, month) {
  let record = getSalaryRecord(teacher.id, year, month);
  if (!record) {
    record = createSalaryRecord(teacher, year, month);
  }
  return record;
}

function calculateStatus(record) {
  const debt = record.total_salary - record.amount_paid;
  if (debt <= 0) return { label: "Dhammaystiran ✓", type: "paid", debt: 0 };
  if (record.amount_paid > 0) return { label: `Qayb bixisay`, type: "partial", debt };
  return { label: `Mushaharka lama bixin`, type: "pending", debt };
}

// Get all teachers from localStorage (your existing data)
function getTeachers() {
  const data = localStorage.getItem("teachers");
  return data ? JSON.parse(data) : [];
}

// ====================================================
// SUB-COMPONENTS
// ====================================================

function StatusBadge({ status }) {
  const styles = {
    paid: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
    partial: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
    pending: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
  };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        ...styles[status.type],
      }}
    >
      {status.label}
    </span>
  );
}

function PaymentModal({ teacher, record, year, month, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const remaining = record.total_salary - record.amount_paid;
  const monthName = MONTHS.find((m) => m.value === month)?.label;

  function handlePay() {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Fadlan geli lacag saxsan");
      return;
    }
    if (val > remaining + 0.01) {
      setError(`Lacagta aad gelisay ($${val}) waxay ka badan tahay deynta ($${remaining.toFixed(2)})`);
      return;
    }
    const updated = {
      ...record,
      amount_paid: record.amount_paid + val,
      payment_date: new Date().toISOString(),
    };
    saveSalaryRecord(updated);
    onSave(updated);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          width: 420,
          maxWidth: "90vw",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#1a1a1a" }}>
          💰 Lacag Bixi
        </h2>
        <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>
          {teacher.name} — {monthName} {year}
        </p>

        {/* Summary row */}
        <div
          style={{
            background: "#f8f9fa",
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>MUSHAHAR</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>
              ${record.total_salary}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>LA BIXIYAY</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#059669" }}>
              ${record.amount_paid.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>DEYN</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: remaining > 0 ? "#dc2626" : "#059669" }}>
              ${remaining.toFixed(2)}
            </div>
          </div>
        </div>

        {remaining <= 0 ? (
          <div
            style={{
              background: "#d1fae5",
              borderRadius: 10,
              padding: 16,
              textAlign: "center",
              color: "#065f46",
              fontWeight: 600,
            }}
          >
            ✅ Mushaharka bishaan si buuxda ayaa loo bixiyay
          </div>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, color: "#333" }}>
              Lacagta aad bixinayso ($)
            </label>
            <input
              type="number"
              min="1"
              max={remaining}
              step="0.01"
              placeholder={`Max: $${remaining.toFixed(2)}`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: error ? "2px solid #dc2626" : "2px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 16,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 8,
              }}
              autoFocus
            />
            {/* Quick amount buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[25, 50, 75, 100].map((pct) => {
                const val = ((remaining * pct) / 100).toFixed(2);
                return (
                  <button
                    key={pct}
                    onClick={() => { setAmount(val); setError(""); }}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                      color: "#475569",
                    }}
                  >
                    {pct}% (${val})
                  </button>
                );
              })}
            </div>
            {error && (
              <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px",
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            Jooji
          </button>
          {remaining > 0 && (
            <button
              onClick={handlePay}
              style={{
                flex: 1,
                padding: "11px",
                background: "#065f46",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                cursor: "pointer",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              💸 Bixi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryModal({ teacher, onClose }) {
  const records = [];
  for (const year of YEARS) {
    for (const month of MONTHS) {
      const rec = getSalaryRecord(teacher.id, year, month.value);
      if (rec) {
        records.push({ ...rec, monthName: month.label });
      }
    }
  }
  records.sort((a, b) => b.year - a.year || b.month - a.month);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: 560,
          maxWidth: "95vw",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>📋 Taariikhda Mushaharada — {teacher.name}</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#666" }}
          >
            ✕
          </button>
        </div>
        {records.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: 32 }}>
            Wali xog mushahar ah lama keydin
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>Bil / Sanad</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "2px solid #e2e8f0" }}>Mushahar</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "2px solid #e2e8f0" }}>La bixiyay</th>
                <th style={{ padding: "10px 12px", textAlign: "right", borderBottom: "2px solid #e2e8f0" }}>Deyn</th>
                <th style={{ padding: "10px 12px", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>Xaaladda</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const status = calculateStatus(rec);
                return (
                  <tr key={rec.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                      {rec.monthName} {rec.year}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>${rec.total_salary}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#059669" }}>
                      ${rec.amount_paid.toFixed(2)}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: status.debt > 0 ? "#dc2626" : "#059669", fontWeight: 600 }}>
                      {status.debt > 0 ? `-$${status.debt.toFixed(2)}` : "$0"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <StatusBadge status={status} />
                    </td>
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

function TeacherCard({ teacher, record, onPayClick, onHistoryClick }) {
  const status = calculateStatus(record);
  const initial = teacher.name.charAt(0).toUpperCase();
  const bgColors = ["#1a7a4a", "#1e5fa0", "#7c3aed", "#b45309", "#be185d"];
  const bg = bgColors[teacher.name.charCodeAt(0) % bgColors.length];

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid",
        borderColor: status.type === "paid" ? "#6ee7b7" : status.type === "partial" ? "#fcd34d" : "#e2e8f0",
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {teacher.name}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>{teacher.subject || "Maadada lama gelin"}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Salary info */}
      <div
        style={{
          background: "#f8f9fa",
          borderRadius: 8,
          padding: "10px 14px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>MUSHAHAR</div>
          <div style={{ fontWeight: 700, color: "#1a1a1a" }}>${record.total_salary}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>BIXIYAY</div>
          <div style={{ fontWeight: 700, color: "#059669" }}>${record.amount_paid.toFixed(2)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>DEYN</div>
          <div style={{ fontWeight: 700, color: status.debt > 0 ? "#dc2626" : "#059669" }}>
            {status.debt > 0 ? `-$${status.debt.toFixed(2)}` : "✓ $0"}
          </div>
        </div>
      </div>

      {/* Phone */}
      {teacher.phone && (
        <div style={{ fontSize: 13, color: "#555" }}>
          📞 {teacher.phone}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onPayClick(teacher, record)}
          style={{
            flex: 2,
            padding: "9px",
            background: status.type === "paid" ? "#d1fae5" : "#065f46",
            color: status.type === "paid" ? "#065f46" : "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {status.type === "paid" ? "✅ Dhammaystiran" : "💸 Lacag Bixi"}
        </button>
        <button
          onClick={() => onHistoryClick(teacher)}
          style={{
            flex: 1,
            padding: "9px",
            background: "#f1f5f9",
            color: "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          📋 Taariikh
        </button>
      </div>
    </div>
  );
}

// ====================================================
// MAIN PAGE COMPONENT
// ====================================================
export default function Macallimiin() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [teachers, setTeachers] = useState([]);
  const [records, setRecords] = useState({});
  const [payModal, setPayModal] = useState(null); // { teacher, record }
  const [historyModal, setHistoryModal] = useState(null); // teacher
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", phone: "", subject: "", salary: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  // Load teachers
  useEffect(() => {
    const stored = getTeachers();
    setTeachers(stored);
  }, [refreshKey]);

  // Load/compute salary records whenever year/month/teachers change
  useEffect(() => {
    const recs = {};
    teachers.forEach((t) => {
      recs[t.id] = getOrCreateRecord(t, selectedYear, selectedMonth);
    });
    setRecords(recs);
  }, [teachers, selectedYear, selectedMonth]);

  function handleSaveRecord(updated) {
    setRecords((prev) => ({ ...prev, [updated.teacher_id]: updated }));
  }

  function handleAddTeacher() {
    if (!newTeacher.name.trim()) return;
    const teacher = {
      id: `t_${Date.now()}`,
      name: newTeacher.name.trim(),
      phone: newTeacher.phone,
      subject: newTeacher.subject,
      salary: parseFloat(newTeacher.salary) || 0,
    };
    const list = [...teachers, teacher];
    localStorage.setItem("teachers", JSON.stringify(list));
    setNewTeacher({ name: "", phone: "", subject: "", salary: 0 });
    setShowAddModal(false);
    setRefreshKey((k) => k + 1);
  }

  function handleDeleteTeacher(id) {
    if (!window.confirm("Miyaad hubtaa inaad tirtirto macallimkan?")) return;
    const list = teachers.filter((t) => t.id !== id);
    localStorage.setItem("teachers", JSON.stringify(list));
    setRefreshKey((k) => k + 1);
  }

  // Stats for selected period
  const totalSalary = Object.values(records).reduce((s, r) => s + r.total_salary, 0);
  const totalPaid = Object.values(records).reduce((s, r) => s + r.amount_paid, 0);
  const totalDebt = totalSalary - totalPaid;
  const paidCount = Object.values(records).filter((r) => r.total_salary - r.amount_paid <= 0).length;

  const monthName = MONTHS.find((m) => m.value === selectedMonth)?.label;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: "#1a1a1a" }}>👨‍🏫 Macallimiin</h1>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 14 }}>
            {teachers.length} macalin
          </p>
        </div>

        {/* Year/Month Selector */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              padding: "8px 14px",
              border: "2px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: "#fff",
              cursor: "pointer",
              color: "#1a1a1a",
            }}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: "8px 14px",
              border: "2px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: "#fff",
              cursor: "pointer",
              color: "#1a1a1a",
            }}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "9px 18px",
              background: "#065f46",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Macalin Ku Dar
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Stats bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            { label: `Mushahar ${monthName} ${selectedYear}`, value: `$${totalSalary.toFixed(2)}`, color: "#1a1a1a", bg: "#fff" },
            { label: "La Bixiyay", value: `$${totalPaid.toFixed(2)}`, color: "#059669", bg: "#d1fae5" },
            { label: "Deyn Jirta", value: `$${totalDebt.toFixed(2)}`, color: "#dc2626", bg: "#fee2e2" },
            { label: "Si Buuxda Bixiyay", value: `${paidCount} / ${teachers.length}`, color: "#1e5fa0", bg: "#dbeafe" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                borderRadius: 12,
                padding: "14px 18px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Teachers grid */}
        {teachers.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#888",
              background: "#fff",
              borderRadius: 14,
              border: "2px dashed #e2e8f0",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍🏫</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Wali macalin lama darin
            </div>
            <div style={{ fontSize: 14 }}>
              Guji "Macalin Ku Dar" si aad u bilowdo
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                record={records[teacher.id] || createSalaryRecord(teacher, selectedYear, selectedMonth)}
                onPayClick={(t, r) => setPayModal({ teacher: t, record: r })}
                onHistoryClick={(t) => setHistoryModal(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payModal && (
        <PaymentModal
          teacher={payModal.teacher}
          record={payModal.record}
          year={selectedYear}
          month={selectedMonth}
          onClose={() => setPayModal(null)}
          onSave={handleSaveRecord}
        />
      )}

      {/* History Modal */}
      {historyModal && (
        <HistoryModal
          teacher={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              width: 420,
              maxWidth: "90vw",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ margin: "0 0 24px", fontSize: 22 }}>+ Macalin Cusub</h2>
            {[
              { label: "Magaca Macalin *", key: "name", type: "text", placeholder: "Magaca buuxa" },
              { label: "Telefoon", key: "phone", type: "text", placeholder: "06X-XXX-XXXX" },
              { label: "Maadada", key: "subject", type: "text", placeholder: "Xisaab, Af Somali..." },
              { label: "Mushaharka ($)", key: "salary", type: "number", placeholder: "0" },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#333" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={newTeacher[field.key]}
                  onChange={(e) => setNewTeacher((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "2px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: 11,
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Jooji
              </button>
              <button
                onClick={handleAddTeacher}
                style={{
                  flex: 1,
                  padding: 11,
                  background: "#065f46",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  cursor: "pointer",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Kaydi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
