-- 分店表
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    business_hours VARCHAR(100) DEFAULT '09:00-21:00',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技师表
CREATE TABLE IF NOT EXISTS therapists (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100), -- 职称：调理师、推拿师、健康师、艾灸师等
    "position" VARCHAR(100), -- 职位：副店长、主管等
    years_of_experience INTEGER,
    rating_count INTEGER DEFAULT 0,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, name) -- 同一门店不能有重名技师
);

-- 技师专长表
CREATE TABLE IF NOT EXISTS therapist_specialties (
    id SERIAL PRIMARY KEY,
    therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL, -- 专长：推拿正骨、艾灸、经络疏通等
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技师排班表
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'holiday')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(therapist_id, date, start_time) -- 避免重复排班
);

-- 预约表
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    store_id INTEGER REFERENCES stores(id),
    therapist_id INTEGER REFERENCES therapists(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    service_type VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX idx_therapists_store_id ON therapists(store_id);
CREATE INDEX idx_therapists_name ON therapists(name);
CREATE INDEX idx_schedules_therapist_date ON schedules(therapist_id, date);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_therapist ON appointments(therapist_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- 创建更新时间戳的触发器
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据：分店
INSERT INTO stores (name, address) VALUES
('名医堂·肩颈腰腿特色调理（港汇店）', '上海市徐汇区港汇广场'),
('名医堂·颈肩腰腿特色调理（兰溪路店）', '上海市普陀区兰溪路'),
('名医堂·颈肩腰腿特色调理（莘庄店）', '上海市闵行区莘庄'),
('名医堂·颈肩腰腿特色调理（五角场万达店）', '上海市杨浦区五角场万达广场'),
('名医堂·颈肩腰腿特色调理（国顺店）', '上海市杨浦区国顺路'),
('名医堂·颈肩腰腿特色调理（漕东里店）', '上海市徐汇区漕东路'),
('名医堂·颈肩腰腿特色调理（高岛屋店）', '上海市长宁区虹桥路高岛屋'),
('名医堂·颈肩腰腿特色调理（春申路店）', '上海市闵行区春申路'),
('名医堂·颈肩腰腿特色调理（康桥店）', '上海市浦东新区康桥'),
('名医堂·颈肩腰腿特色调理（汇融天地店）', '上海市徐汇区汇融天地'),
('名医堂·颈肩腰腿特色调理（浦三路店）', '上海市浦东新区浦三路'),
('名医堂·颈肩腰腿特色调理（聚丰园路店）', '上海市浦东新区聚丰园路'),
('名医堂·颈肩腰腿特色调理（世纪公园店）', '上海市浦东新区世纪公园'),
('名医堂·颈肩腰腿特色调理（丰庄店）', '上海市宝山区丰庄'),
('名医堂·颈肩腰腿特色调理（仙霞路店）', '上海市长宁区仙霞路'),
('名医堂·颈肩腰腿特色调理（爱琴海店）', '上海市闵行区吴中路爱琴海'),
('名医堂·颈肩腰腿特色调理（浦东大道店）', '上海市浦东新区浦东大道'),
('名医堂·颈肩腰腿特色调理（东方路店）', '上海市浦东新区东方路'),
('名医堂·颈肩腰腿特色调理（宜山路店）', '上海市徐汇区宜山路'),
('名医堂·颈肩腰腿特色调理（关山路店）', '上海市浦东新区关山路'),
('名医堂·颈肩腰腿特色调理（巨峰路店）', '上海市浦东新区巨峰路'),
('名医堂·颈肩腰腿特色调理（隆昌路店）', '上海市杨浦区隆昌路'),
('名医堂·颈肩腰腿特色调理（长江西路店）', '上海市宝山区长江西路'),
('名医堂·颈肩腰腿特色调理（龙华路店）', '上海市徐汇区龙华路'),
('名医堂·颈肩腰腿特色调理（武宁南路店）', '上海市普陀区武宁南路'),
('名医堂·颈肩腰腿特色调理（静安寺店）', '上海市静安区南京西路'),
('名医堂·颈肩腰腿特色调理（豫园店）', '上海市黄浦区豫园'),
('名医堂·颈肩腰腿特色调理（斜土路店）', '上海市徐汇区斜土路'),
('名医堂妙康中医·推拿正骨·针灸·艾灸', '上海市'),
('名医堂永康中医·推拿正骨·针灸·艾灸', '上海市');

-- 插入示例技师数据（东方路店）
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '陈老师', '调理师', 18, 55),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '孟老师', '调理师', 23, 108),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '于老师', '调理师', 12, 78),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '赵老师', '调理师', 24, 30),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '李想', '调理师', 22, 34),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '刘老师', '健康师', 20, 5),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '朱老师', '艾灸师', 18, 3);

-- 插入示例技师数据（静安寺店）
INSERT INTO therapists (store_id, name, title, years_of_experience, rating_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '吴老师', '推拿师', 14, 99),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '万老师', '调理师', 13, 34),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '冯老师', '资深推拿师', 17, 15),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '李老师', '调理师', 14, 31),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '赵老师', '调理师', 18, 0);

-- 插入技师专长数据
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '妇科调理'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '艾灸');

-- 创建查询技师可用时间的函数
CREATE OR REPLACE FUNCTION check_therapist_availability(
    p_therapist_name VARCHAR,
    p_date DATE,
    p_time TIME
) RETURNS TABLE (
    therapist_id INTEGER,
    therapist_name VARCHAR,
    store_name VARCHAR,
    title VARCHAR,
    therapist_position VARCHAR,
    is_available BOOLEAN,
    schedule_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        s.name,
        t.title,
        t."position" as therapist_position,
        CASE 
            WHEN sch.status = 'available' AND 
                 p_time >= sch.start_time AND 
                 p_time <= sch.end_time AND
                 NOT EXISTS (
                     SELECT 1 FROM appointments a 
                     WHERE a.therapist_id = t.id 
                     AND a.appointment_date = p_date 
                     AND a.appointment_time = p_time
                     AND a.status != 'cancelled'
                 ) THEN TRUE
            ELSE FALSE
        END as is_available,
        sch.status
    FROM therapists t
    JOIN stores s ON t.store_id = s.id
    LEFT JOIN schedules sch ON t.id = sch.therapist_id 
        AND sch.date = p_date
    WHERE t.name LIKE '%' || p_therapist_name || '%'
        AND t.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 创建预约查询视图
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
    a.id as appointment_id,
    a.customer_name,
    a.customer_phone,
    a.appointment_date,
    a.appointment_time,
    a.duration_minutes,
    a.service_type,
    a.status as appointment_status,
    a.notes,
    t.name as therapist_name,
    t.title as therapist_title,
    t."position" as therapist_position,
    s.name as store_name,
    s.address as store_address,
    s.phone as store_phone
FROM appointments a
JOIN therapists t ON a.therapist_id = t.id
JOIN stores s ON a.store_id = s.id;

-- 创建生成每周排班的存储过程
CREATE OR REPLACE PROCEDURE generate_weekly_schedule(
    p_therapist_id INTEGER,
    p_start_date DATE,
    p_end_date DATE,
    p_start_time TIME DEFAULT '09:00',
    p_end_time TIME DEFAULT '21:00'
) AS $$
DECLARE
    curr_date DATE;
BEGIN
    curr_date := p_start_date;
    
    WHILE curr_date <= p_end_date LOOP
        -- 跳过已存在的排班
        IF NOT EXISTS (
            SELECT 1 FROM schedules 
            WHERE therapist_id = p_therapist_id 
            AND date = curr_date
        ) THEN
            INSERT INTO schedules (therapist_id, date, start_time, end_time, status)
            VALUES (p_therapist_id, curr_date, p_start_time, p_end_time, 'available');
        END IF;
        
        curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;