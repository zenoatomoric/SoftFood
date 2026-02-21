-- 1. สร้าง Sequence สำหรับรหัสปราชญ์ (Person ID)
CREATE SEQUENCE IF NOT EXISTS informants_friendly_id_seq START 1;

-- 2. ตารางผู้เก็บข้อมูล (Surveyors)
CREATE TABLE IF NOT EXISTS users (
    sv_code TEXT PRIMARY KEY, 
    password_hash TEXT NOT NULL, 
    collector_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'admin', 'director')) DEFAULT 'user',
    faculty TEXT,
    major TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางข้อมูลปราชญ์ (Informants) - ครอบคลุมส่วนที่ 1
CREATE TABLE IF NOT EXISTS informants (
    info_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    friendly_id TEXT DEFAULT 'INFO-' || lpad(nextval('informants_friendly_id_seq')::text, 3, '0') UNIQUE,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('ชาย', 'หญิง', 'อื่นๆ')),
    age INTEGER,
    occupation TEXT,
    income NUMERIC,
    address_full TEXT,
    canal_zone TEXT CHECK (canal_zone IN ('บางเขน', 'เปรมประชากร', 'ลาดพร้าว')),
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางเมนูอาหาร (Menus) - ครอบคลุมส่วนที่ 2, 3, 4 และ 7
CREATE TABLE IF NOT EXISTS menus (
    menu_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_info_id UUID REFERENCES informants(info_id) ON DELETE CASCADE,
    ref_sv_code TEXT REFERENCES users(sv_code),
    
    -- ข้อมูลอัตลักษณ์ (ส่วนที่ 2)
    menu_name TEXT NOT NULL,
    local_name TEXT,
    other_name TEXT,
    category TEXT CHECK (category IN ('อาหารคาว', 'อาหารหวาน', 'อาหารว่าง', 'อาหารว่าง/เครื่องดื่ม')),
    
    -- แบบสำรวจเจาะลึก (ส่วนที่ 3)
    popularity TEXT, 
    rituals JSONB, 
    seasonality TEXT, 
    ingredient_sources JSONB, 
    health_benefits JSONB, 
    consumption_freq TEXT, 
    complexity TEXT, 
    taste_appeal TEXT, 
    
    -- เรื่องราวและสถานะ (ส่วนที่ 4)
    story TEXT, 
    heritage_status TEXT, 
    
    -- เคล็ดลับ และ ข้อมูลสนับสนุน (ส่วนที่ 5, 7)
    secret_tips TEXT, 
    awards_references TEXT, 

    -- การจัดการระบบหลังบ้าน
    selection_status TEXT[] DEFAULT '{}', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางคลังวัตถุดิบกลาง (Master Ingredients)
CREATE TABLE IF NOT EXISTS master_ingredients (
    ing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ing_name TEXT UNIQUE NOT NULL, 
    is_verified BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางเชื่อมโยงวัตถุดิบ (Menu Ingredients) - ครอบคลุมส่วนที่ 5
CREATE TABLE IF NOT EXISTS menu_ingredients (
    map_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
    ref_ing_id UUID REFERENCES master_ingredients(ing_id),
    ingredient_type TEXT CHECK (ingredient_type IN ('วัตถุดิบ', 'เครื่องปรุง/สมุนไพร')),
    is_main_ingredient BOOLEAN DEFAULT FALSE,
    quantity TEXT, 
    unit TEXT, 
    note TEXT 
);

-- 7. ตารางขั้นตอนการทำ (Menu Steps) - ครอบคลุมส่วนที่ 5
CREATE TABLE IF NOT EXISTS menu_steps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
    step_type TEXT CHECK (step_type IN ('เตรียม', 'ปรุง')),
    step_order INTEGER, 
    instruction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางรูปภาพประกอบเมนู (Menu Photos) - ครอบคลุมส่วนที่ 6
CREATE TABLE IF NOT EXISTS menu_photos (
    photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_menu_id UUID REFERENCES menus(menu_id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL, 
    caption TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);
