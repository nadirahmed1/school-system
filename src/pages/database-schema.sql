-- =====================================================
-- NIDAAMKA DUGSI v5 - Full Supabase Migration
-- localStorage → Supabase
-- =====================================================

-- =====================================================
-- 1. SCHOOL SETTINGS TABLE (was: localStorage "school_settings")
-- =====================================================
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL DEFAULT 'Nidaamka Dugsiga',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1a3a5c',
  accent_color TEXT DEFAULT '#065f46',
  sidebar_color TEXT DEFAULT '#1a3a5c',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Geli hal row marka hore (singleton pattern)
INSERT INTO school_settings (id, school_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Nidaamka Dugsiga')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. ADMIN CREDENTIALS TABLE (was: localStorage "admin_credentials")
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL DEFAULT 'admin@dugsi.so',
  password_hash TEXT NOT NULL DEFAULT 'Admin@2024',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Geli hal row marka hore
INSERT INTO admin_credentials (id, email, password_hash)
VALUES ('00000000-0000-0000-0000-000000000002', 'admin@dugsi.so', 'Admin@2024')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. TEACHERS TABLE (was: localStorage "teachers")
-- =====================================================
CREATE TABLE IF NOT EXISTS macallimiin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magaca TEXT NOT NULL,
  telefoon TEXT,
  maado TEXT,
  mushahar DECIMAL(10,2) NOT NULL DEFAULT 0,
  email TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. SALARY HISTORY TABLE (was: localStorage "salary_*")
-- =====================================================
CREATE TABLE IF NOT EXISTS mushahar_taarikh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  macalin_id UUID NOT NULL REFERENCES macallimiin(id) ON DELETE CASCADE,
  sanad SMALLINT NOT NULL CHECK (sanad BETWEEN 2024 AND 2035),
  bil SMALLINT NOT NULL CHECK (bil BETWEEN 1 AND 12),
  mushahar_wadarta DECIMAL(10,2) NOT NULL,
  lacag_bixisay DECIMAL(10,2) DEFAULT 0,
  taarikh_lacag DATE,
  xusuusnow TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(macalin_id, sanad, bil)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_mushahar_macalin ON mushahar_taarikh(macalin_id, sanad, bil);
CREATE INDEX IF NOT EXISTS idx_mushahar_sanad_bil ON mushahar_taarikh(sanad, bil);

-- =====================================================
-- RLS (Row Level Security) - Haddii Supabase anon key isticmaalayso
-- Haddii admin kaliya la isticmaalayo, waa optional
-- =====================================================
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE macallimiin ENABLE ROW LEVEL SECURITY;
ALTER TABLE mushahar_taarikh ENABLE ROW LEVEL SECURITY;

-- Allow all access (app handles auth itself)
CREATE POLICY "allow_all_school_settings" ON school_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_admin_creds"     ON admin_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_macallimiin"     ON macallimiin FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_mushahar"        ON mushahar_taarikh FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FUNCTION: Bixi lacag mushaharka
-- =====================================================
CREATE OR REPLACE FUNCTION bixi_mushahar(
  p_macalin_id UUID,
  p_sanad INT,
  p_bil INT,
  p_lacag DECIMAL
) RETURNS mushahar_taarikh AS $$
DECLARE
  v_mushahar DECIMAL;
  v_record mushahar_taarikh;
BEGIN
  SELECT mushahar INTO v_mushahar FROM macallimiin WHERE id = p_macalin_id;

  INSERT INTO mushahar_taarikh (macalin_id, sanad, bil, mushahar_wadarta, lacag_bixisay, taarikh_lacag)
  VALUES (p_macalin_id, p_sanad, p_bil, v_mushahar, LEAST(p_lacag, v_mushahar), CURRENT_DATE)
  ON CONFLICT (macalin_id, sanad, bil) DO UPDATE SET
    lacag_bixisay = LEAST(mushahar_taarikh.lacag_bixisay + p_lacag, mushahar_taarikh.mushahar_wadarta),
    taarikh_lacag = CURRENT_DATE,
    updated_at = now()
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$ LANGUAGE plpgsql;
