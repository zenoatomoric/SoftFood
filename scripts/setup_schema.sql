-- ==========================================
-- 0. เตรียมความพร้อม (ลบของเก่าเพื่อเริ่มใหม่)
-- ==========================================
DROP TABLE IF EXISTS menu_photos CASCADE;
DROP TABLE IF EXISTS menu_steps CASCADE;
DROP TABLE IF EXISTS menu_ingredients CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS master_ingredients CASCADE;
DROP TABLE IF EXISTS informants CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP SEQUENCE IF EXISTS informants_friendly_id_seq CASCADE;

-- ==========================================
-- 1. สร้างตัวนับเลข (Sequence) สำหรับรหัสปราชญ์ (INFO-001)
-- ==========================================
CREATE SEQUENCE informants_friendly_id_seq START 1;

-- ==========================================
-- 2. สร้างตารางหลัก (Master Tables)
-- ==========================================
CREATE TABLE users (
    sv_code TEXT PRIMARY KEY, 
    password_hash TEXT NOT NULL, 
    collector_name TEXT NOT NULL,
    faculty TEXT,
    major TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('user', 'admin', 'director')) DEFAULT 'user',
    supervisor_sv_code TEXT REFERENCES users(sv_code) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE informants (
    info_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canal_zone TEXT CHECK (canal_zone IN ('บางเขน', 'เปรมประชากร', 'ลาดพร้าว')),
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('ชาย', 'หญิง', 'อื่นๆ')),
    age INTEGER,
    occupation TEXT,
    income NUMERIC,
    address_full TEXT,
    residency_years INTEGER,
    residency_months INTEGER,
    residency_days INTEGER,
    phone TEXT,
    social_media JSONB, 
    gps_lat DOUBLE PRECISION, 
    gps_long DOUBLE PRECISION, 
    gps_alt DOUBLE PRECISION DEFAULT 0.00, 
    consent_status BOOLEAN DEFAULT FALSE,
    consent_document_url TEXT, 
    friendly_id TEXT DEFAULT 'INFO-' || lpad(nextval('informants_friendly_id_seq')::text, 3, '0'),
    ref_sv_code TEXT REFERENCES users(sv_code),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE master_ingredients (
    ing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ing_name TEXT UNIQUE NOT NULL, 
    ingredient_category TEXT CHECK (ingredient_category IN ('วัตถุดิบ', 'เครื่องปรุง/สมุนไพร')),
    is_verified BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. สร้างตารางเมนู (เชื่อมกับตารางหลัก)
-- ==========================================
CREATE TABLE menus (
    menu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_info_id UUID REFERENCES informants(info_id) ON DELETE CASCADE,
    ref_sv_code TEXT REFERENCES users(sv_code),
    menu_name TEXT NOT NULL,
    local_name TEXT,
    other_name TEXT,
    category TEXT CHECK (category IN ('อาหารคาว', 'อาหารหวาน', 'อาหารว่าง', 'อาหารว่าง/เครื่องดื่ม')),
    story TEXT, 
    nutrition JSONB, 
    social_value JSONB, 
    popularity JSONB, 
    rituals JSONB, 
    seasonality JSONB, 
    ingredient_sources JSONB, 
    health_benefits JSONB, 
    consumption_freq JSONB, 
    complexity JSONB, 
    taste_appeal JSONB, 
    other_popularity TEXT,
    other_rituals TEXT,
    other_seasonality TEXT,
    other_ingredient_sources TEXT,
    other_health_benefits TEXT,
    other_consumption_freq TEXT,
    other_complexity TEXT,
    other_taste_appeal TEXT,
    secret_tips TEXT, 
    heritage_status TEXT,
    awards_references TEXT, 
    selection_status TEXT[] DEFAULT '{}', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. สร้างตารางส่วนประกอบย่อยของเมนู
-- ==========================================
CREATE TABLE menu_ingredients (
    map_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
    ref_ing_id UUID REFERENCES master_ingredients(ing_id),
    ingredient_type TEXT CHECK (ingredient_type IN ('วัตถุดิบ', 'เครื่องปรุง/สมุนไพร')),
    is_main_ingredient BOOLEAN DEFAULT FALSE,
    quantity TEXT, 
    unit TEXT, 
    note TEXT 
);

CREATE TABLE menu_steps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
    step_type TEXT CHECK (step_type IN ('เตรียม', 'ปรุง')),
    step_order INTEGER, 
    instruction TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menu_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL, 
    caption TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);
