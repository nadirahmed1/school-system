-- =====================================================
-- NIDAAMKA DUGSI - Database Schema
-- Teacher Salary Management with Full History
-- =====================================================

-- TEACHERS TABLE (existing)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,  -- total_salary (mushaharka lagu heshiiyay)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SALARY HISTORY TABLE (cusub)
-- Kaydinaysa mushaharka bil kasta iyo sannad kasta
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL CHECK (year BETWEEN 2024 AND 2035),
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),

  -- Lacagta
  total_salary DECIMAL(10,2) NOT NULL,   -- Mushaharka lagu heshiiyay (ka xidna teachers.salary)
  amount_paid DECIMAL(10,2) DEFAULT 0,   -- Lacagta la bixiyay

  -- Xaaladda (computed via function or app logic)
  -- debt = total_salary - amount_paid
  -- status = 'paid' | 'partial' | 'pending'

  payment_date DATE,                      -- Taariikhda lacagta ugu dambayn
  notes TEXT,                             -- Xusuusnow kasta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Mid record bil kasta macalin walba
  UNIQUE(teacher_id, year, month)
);

-- =====================================================
-- SALARY PAYMENTS TABLE (optional: tracking each payment)
-- Haddaad rabto aad u aragto lacag bixiin kasta gaar
-- =====================================================
CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id UUID NOT NULL REFERENCES teacher_salary_history(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  paid_by TEXT,                          -- Admin magaciis
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES (xawaaraha query-ga)
-- =====================================================
CREATE INDEX idx_salary_teacher_period 
  ON teacher_salary_history(teacher_id, year, month);

CREATE INDEX idx_salary_year_month 
  ON teacher_salary_history(year, month);

CREATE INDEX idx_payments_history 
  ON salary_payments(history_id);

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View: Macallimiinta iyo xaaladda mushaharka bishaan
CREATE OR REPLACE VIEW v_current_month_salaries AS
SELECT 
  t.id as teacher_id,
  t.name,
  t.phone,
  t.subject,
  t.salary as contracted_salary,
  EXTRACT(YEAR FROM now()) as year,
  EXTRACT(MONTH FROM now()) as month,
  COALESCE(h.total_salary, t.salary) as total_salary,
  COALESCE(h.amount_paid, 0) as amount_paid,
  COALESCE(h.total_salary, t.salary) - COALESCE(h.amount_paid, 0) as debt,
  CASE 
    WHEN COALESCE(h.amount_paid, 0) >= COALESCE(h.total_salary, t.salary) THEN 'paid'
    WHEN COALESCE(h.amount_paid, 0) > 0 THEN 'partial'
    ELSE 'pending'
  END as status
FROM teachers t
LEFT JOIN teacher_salary_history h 
  ON t.id = h.teacher_id 
  AND h.year = EXTRACT(YEAR FROM now())
  AND h.month = EXTRACT(MONTH FROM now());

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- 1. Hel macallimiinta iyo xaaladda mushaharka bil gaar ah
SELECT 
  t.name,
  t.salary as total_salary,
  COALESCE(h.amount_paid, 0) as paid,
  t.salary - COALESCE(h.amount_paid, 0) as debt,
  CASE 
    WHEN COALESCE(h.amount_paid, 0) >= t.salary THEN 'Dhammaystiran'
    WHEN COALESCE(h.amount_paid, 0) > 0 THEN 'Qayb bixisay'
    ELSE 'Wali lama bixin'
  END as xaaladda
FROM teachers t
LEFT JOIN teacher_salary_history h 
  ON t.id = h.teacher_id AND h.year = 2026 AND h.month = 5
ORDER BY t.name;

-- 2. Mushaharka taariikhda macalin gaar ah
SELECT 
  year, month,
  total_salary,
  amount_paid,
  total_salary - amount_paid as debt
FROM teacher_salary_history
WHERE teacher_id = 'teacher-uuid-here'
ORDER BY year DESC, month DESC;

-- 3. Wadarta deynta guud ee sannad gaar ah
SELECT 
  SUM(total_salary) as total_expected,
  SUM(amount_paid) as total_paid,
  SUM(total_salary - amount_paid) as total_debt
FROM teacher_salary_history
WHERE year = 2026;

-- =====================================================
-- FUNCTION: Bixi lacag (upsert + payment logic)
-- =====================================================
CREATE OR REPLACE FUNCTION pay_teacher_salary(
  p_teacher_id UUID,
  p_year INT,
  p_month INT,
  p_amount DECIMAL
) RETURNS teacher_salary_history AS $$
DECLARE
  v_total DECIMAL;
  v_record teacher_salary_history;
BEGIN
  -- Hel mushaharka macallinka
  SELECT salary INTO v_total FROM teachers WHERE id = p_teacher_id;

  -- Haddii record jirin, samee mid cusub
  INSERT INTO teacher_salary_history (teacher_id, year, month, total_salary, amount_paid, payment_date)
  VALUES (p_teacher_id, p_year, p_month, v_total, LEAST(p_amount, v_total), CURRENT_DATE)
  ON CONFLICT (teacher_id, year, month) DO UPDATE SET
    amount_paid = LEAST(teacher_salary_history.amount_paid + p_amount, teacher_salary_history.total_salary),
    payment_date = CURRENT_DATE,
    updated_at = now()
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$ LANGUAGE plpgsql;

-- Isticmaal:
-- SELECT * FROM pay_teacher_salary('teacher-uuid', 2026, 5, 100.00);
