-- 名医堂数据平台2.0数据库结构
-- SQLite数据库，专为中医按摩预约管理设计

-- 门店表
CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200),
    phone VARCHAR(20),
    business_hours VARCHAR(50) DEFAULT '09:00-21:00',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    manager_name VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 服务项目表
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL,
    duration INTEGER DEFAULT 60,
    price DECIMAL(8,2),
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 技师表
CREATE TABLE IF NOT EXISTS therapists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    experience_years INTEGER NOT NULL,
    specialties TEXT NOT NULL,
    phone VARCHAR(20),
    honors VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(200),
    rating DECIMAL(3,2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'leave')),
    work_schedule TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    gender TEXT DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
    age INTEGER,
    health_condition TEXT,
    preferences TEXT,
    total_visits INTEGER DEFAULT 0,
    member_level TEXT DEFAULT 'normal' CHECK (member_level IN ('normal', 'silver', 'gold', 'diamond')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预约表
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    therapist_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    service_id INTEGER,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    health_notes TEXT,
    price DECIMAL(8,2),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    therapist_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (therapist_id) REFERENCES therapists(id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    store_id INTEGER,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id)
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_therapists_store_id ON therapists(store_id);
CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(status);
CREATE INDEX IF NOT EXISTS idx_therapists_specialties ON therapists(specialties);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_date ON appointments(therapist_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 创建触发器更新updated_at字段
CREATE TRIGGER IF NOT EXISTS update_stores_timestamp 
AFTER UPDATE ON stores
BEGIN
    UPDATE stores SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_therapists_timestamp 
AFTER UPDATE ON therapists
BEGIN
    UPDATE therapists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_appointments_timestamp 
AFTER UPDATE ON appointments
BEGIN
    UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;