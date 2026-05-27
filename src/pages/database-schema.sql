-- =====================================================
-- NIDAAMKA DUGSI - Database Schema (Full)
-- =====================================================

-- ── Ardayda ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ardayda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arday_id_gaar TEXT UNIQUE,
  magaca TEXT NOT NULL,
  aabaha_magac TEXT,
  telefoon TEXT,
  fasalka TEXT,
  taariikhda_diiwaangelinta DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Lacagta ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lacagta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arday_id UUID REFERENCES ardayda(id) ON DELETE CASCADE,
  xaddiga DECIMAL(10,2) NOT NULL,
  bisha TEXT NOT NULL,
  sannadka INT NOT NULL,
  xaaladda TEXT DEFAULT 'bixiyay',
  taariikhda_bixinta DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Macallimiin ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS macallimiin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  magaca TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  telefoon TEXT,
  xirfadda TEXT,
  mushaharka DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── School Settings (NEW - replaces localStorage) ───
-- Hal row keliya waxay keydisaa dhammaan settings-ka
-- Single row design: id = 1 (always upsert)
CREATE TABLE IF NOT EXISTS school_settings (
  id INT PRIMARY KEY DEFAULT 1,          -- Kaliya hal row
  school_name TEXT DEFAULT 'Nidaamka Dugsiga',
  logo_url TEXT,                          -- Base64 ama URL
  primary_color TEXT DEFAULT '#1a3a5c',
  accent_color TEXT DEFAULT '#065f46',
  sidebar_color TEXT DEFAULT '#1a3a5c',
  admin_email TEXT DEFAULT 'admin@dugsi.so',
  admin_password TEXT DEFAULT 'Admin@2024',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ku dar default row haddii aan jirin
INSERT INTO school_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── RLS Policies ─────────────────────────────────────
-- School settings: qof kasta akhrisan karo, admin uun beddeli karo
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON school_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update" ON school_settings
  FOR UPDATE USING (true);

-- ── Indexes ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lacagta_arday ON lacagta(arday_id);
CREATE INDEX IF NOT EXISTS idx_lacagta_bisha ON lacagta(bisha, sannadka);
