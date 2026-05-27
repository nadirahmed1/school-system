-- =====================================================
-- SCHEMA CUSUB: Settings + Admin Credentials
-- Ku dar Supabase-kaaga si xogta settings-ka ay
-- meel walba isku mid noqoto
-- =====================================================

-- SCHOOL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS school_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'Nidaamka Dugsiga',
  logo_url    TEXT,
  primary_color  TEXT DEFAULT '#1a3a5c',
  accent_color   TEXT DEFAULT '#065f46',
  sidebar_color  TEXT DEFAULT '#1a3a5c',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Ku dar hal row default ah (haddii madhan)
INSERT INTO school_settings (school_name)
VALUES ('Nidaamka Dugsiga')
ON CONFLICT DO NOTHING;

-- ADMIN CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS admin_credentials (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email    TEXT NOT NULL DEFAULT 'admin@dugsi.so',
  password TEXT NOT NULL DEFAULT 'Admin@2024',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ku dar hal row default ah
INSERT INTO admin_credentials (email, password)
VALUES ('admin@dugsi.so', 'Admin@2024')
ON CONFLICT DO NOTHING;

-- TEACHERS TABLE (haddaan horay jirin)
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID,
  name TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TEACHER SALARY HISTORY (haddaan horay jirin)
CREATE TABLE IF NOT EXISTS teacher_salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL,
  total_salary DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, year, month)
);

-- RLS: Fur si app-ka u geli karo (haddii RLS enabled tahay)
-- ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON school_settings FOR ALL USING (true);
-- ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON admin_credentials FOR ALL USING (true);
-- ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON teachers FOR ALL USING (true);
-- ALTER TABLE teacher_salary_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON teacher_salary_history FOR ALL USING (true);
