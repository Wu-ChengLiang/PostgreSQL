-- 删除现有数据和表
DROP VIEW IF EXISTS appointment_details CASCADE;
DROP FUNCTION IF EXISTS check_therapist_availability CASCADE;
DROP PROCEDURE IF EXISTS generate_weekly_schedule CASCADE;

DROP TABLE IF EXISTS therapist_specialties CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS therapists CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- 重新创建分店表
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

-- 重新创建技师表（增加性别字段）
CREATE TABLE IF NOT EXISTS therapists (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('男', '女')),
    title VARCHAR(100), -- 职称：调理师、推拿师、健康师、艾灸师等
    phone VARCHAR(20),
    years_of_experience INTEGER,
    rating_count INTEGER DEFAULT 0,
    service_count INTEGER DEFAULT 0, -- 服务次数
    is_recommended BOOLEAN DEFAULT FALSE, -- 商家推荐
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, name)
);

-- 技师专长表
CREATE TABLE IF NOT EXISTS therapist_specialties (
    id SERIAL PRIMARY KEY,
    therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
    specialty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技师固定排班表（每周固定排班）
CREATE TABLE IF NOT EXISTS weekly_schedules (
    id SERIAL PRIMARY KEY,
    therapist_id INTEGER REFERENCES therapists(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=周日, 1=周一, ..., 6=周六
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(therapist_id, day_of_week)
);

-- 预约表（优化查询）
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

-- 创建优化查询的索引
CREATE INDEX idx_therapists_store_id ON therapists(store_id);
CREATE INDEX idx_therapists_name ON therapists(name);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_therapist_date ON appointments(therapist_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_weekly_schedules_therapist ON weekly_schedules(therapist_id);

-- 创建触发器
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapists_updated_at BEFORE UPDATE ON therapists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_schedules_updated_at BEFORE UPDATE ON weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入所有分店数据
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
INSERT INTO therapists (store_id, name, gender, title, years_of_experience, rating_count, is_recommended) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '陈老师', '女', '调理师', 18, 55, TRUE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '孟老师', '男', '调理师', 23, 108, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '于老师', '女', '调理师', 12, 78, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '赵老师', '男', '调理师', 24, 30, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '李想', '男', '调理师', 22, 34, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '刘老师', '女', '健康师', 20, 5, FALSE),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）'), '朱老师', '女', '艾灸师', 18, 3, FALSE);

-- 插入示例技师数据（静安寺店）
INSERT INTO therapists (store_id, name, gender, title, years_of_experience, rating_count, service_count) VALUES
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '吴老师', '男', '推拿师', 14, 99, 0),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '万老师', '男', '调理师', 13, 34, 0),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '冯老师', '男', '资深推拿师', 17, 15, 162),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '李老师', '女', '调理师', 14, 31, 0),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '赵老师', '男', '调理师', 18, 0, 0),
((SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）'), '王老师', '女', '调理师', 10, 45, 0);

-- 插入技师专长数据
INSERT INTO therapist_specialties (therapist_id, specialty) VALUES
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '妇科调理'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '陈老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '按摩'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '经络疏通'),
((SELECT id FROM therapists WHERE name = '孟老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（东方路店）')), '艾灸'),
((SELECT id FROM therapists WHERE name = '吴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）')), '推拿正骨'),
((SELECT id FROM therapists WHERE name = '吴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）')), '颈肩腰腿痛调理'),
((SELECT id FROM therapists WHERE name = '吴老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）')), '拔罐'),
((SELECT id FROM therapists WHERE name = '万老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）')), '八纲辩证'),
((SELECT id FROM therapists WHERE name = '万老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）')), '脏腑调理'),
((SELECT id FROM therapists WHERE name = '万老师' AND store_id = (SELECT id FROM stores WHERE name = '名医堂·颈肩腰腿特色调理（静安寺店）')), '艾灸');

-- 为所有技师插入默认排班（周一到周日，9:00-21:00）
INSERT INTO weekly_schedules (therapist_id, day_of_week, start_time, end_time)
SELECT id, day_num, '09:00'::TIME, '21:00'::TIME
FROM therapists
CROSS JOIN generate_series(0, 6) AS day_num;

-- 创建获取技师今日和明日预约的函数
CREATE OR REPLACE FUNCTION get_therapist_appointments(
    p_therapist_name VARCHAR DEFAULT NULL,
    p_store_name VARCHAR DEFAULT NULL
) RETURNS TABLE (
    therapist_id INTEGER,
    therapist_name VARCHAR,
    therapist_gender VARCHAR,
    therapist_title VARCHAR,
    therapist_phone VARCHAR,
    store_name VARCHAR,
    today_appointments JSON,
    tomorrow_appointments JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.gender,
        t.title,
        t.phone,
        s.name,
        COALESCE(
            json_agg(
                json_build_object(
                    'time', a1.appointment_time,
                    'customer_name', a1.customer_name,
                    'customer_phone', a1.customer_phone
                ) ORDER BY a1.appointment_time
            ) FILTER (WHERE a1.appointment_date = CURRENT_DATE AND a1.status != 'cancelled'),
            '[]'::json
        ) as today_appointments,
        COALESCE(
            json_agg(
                json_build_object(
                    'time', a2.appointment_time,
                    'customer_name', a2.customer_name,
                    'customer_phone', a2.customer_phone
                ) ORDER BY a2.appointment_time
            ) FILTER (WHERE a2.appointment_date = CURRENT_DATE + INTERVAL '1 day' AND a2.status != 'cancelled'),
            '[]'::json
        ) as tomorrow_appointments
    FROM therapists t
    JOIN stores s ON t.store_id = s.id
    LEFT JOIN appointments a1 ON t.id = a1.therapist_id AND a1.appointment_date = CURRENT_DATE
    LEFT JOIN appointments a2 ON t.id = a2.therapist_id AND a2.appointment_date = CURRENT_DATE + INTERVAL '1 day'
    WHERE t.status = 'active'
        AND (p_therapist_name IS NULL OR t.name ILIKE '%' || p_therapist_name || '%')
        AND (p_store_name IS NULL OR s.name ILIKE '%' || p_store_name || '%')
    GROUP BY t.id, t.name, t.gender, t.title, t.phone, s.name;
END;
$$ LANGUAGE plpgsql;

-- 创建检查技师可用性的函数
CREATE OR REPLACE FUNCTION check_availability(
    p_store_name VARCHAR,
    p_therapist_name VARCHAR,
    p_date DATE,
    p_time TIME
) RETURNS TABLE (
    is_available BOOLEAN,
    therapist_info JSON,
    conflict_reason TEXT
) AS $$
DECLARE
    v_therapist_id INTEGER;
    v_day_of_week INTEGER;
    v_is_working BOOLEAN;
    v_start_time TIME;
    v_end_time TIME;
    v_has_appointment BOOLEAN;
BEGIN
    -- 获取星期几 (0=周日, 1=周一, ..., 6=周六)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- 查找技师
    SELECT t.id INTO v_therapist_id
    FROM therapists t
    JOIN stores s ON t.store_id = s.id
    WHERE s.name = p_store_name
        AND t.name = p_therapist_name
        AND t.status = 'active';
    
    IF v_therapist_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::JSON, '未找到该技师或技师不在该门店';
        RETURN;
    END IF;
    
    -- 检查该天是否工作
    SELECT is_working, start_time, end_time 
    INTO v_is_working, v_start_time, v_end_time
    FROM weekly_schedules
    WHERE therapist_id = v_therapist_id
        AND day_of_week = v_day_of_week;
    
    IF NOT v_is_working OR v_start_time IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::JSON, '技师该天不工作';
        RETURN;
    END IF;
    
    -- 检查时间是否在工作时间内
    IF p_time < v_start_time OR p_time > v_end_time THEN
        RETURN QUERY SELECT FALSE, NULL::JSON, '预约时间不在技师工作时间内';
        RETURN;
    END IF;
    
    -- 检查是否已有预约
    SELECT EXISTS(
        SELECT 1 FROM appointments
        WHERE therapist_id = v_therapist_id
            AND appointment_date = p_date
            AND appointment_time = p_time
            AND status != 'cancelled'
    ) INTO v_has_appointment;
    
    IF v_has_appointment THEN
        RETURN QUERY SELECT FALSE, NULL::JSON, '该时间段技师已有预约';
        RETURN;
    END IF;
    
    -- 返回可用信息
    RETURN QUERY 
    SELECT 
        TRUE,
        json_build_object(
            'therapist_id', t.id,
            'therapist_name', t.name,
            'therapist_gender', t.gender,
            'therapist_title', t.title,
            'store_id', s.id,
            'store_name', s.name
        ),
        NULL::TEXT
    FROM therapists t
    JOIN stores s ON t.store_id = s.id
    WHERE t.id = v_therapist_id;
END;
$$ LANGUAGE plpgsql;

-- 创建预约创建函数
CREATE OR REPLACE FUNCTION create_appointment(
    p_store_name VARCHAR,
    p_therapist_name VARCHAR,
    p_customer_name VARCHAR,
    p_customer_phone VARCHAR,
    p_appointment_date DATE,
    p_appointment_time TIME,
    p_service_type VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    appointment_id INTEGER,
    message TEXT
) AS $$
DECLARE
    v_store_id INTEGER;
    v_therapist_id INTEGER;
    v_appointment_id INTEGER;
    v_is_available BOOLEAN;
    v_conflict_reason TEXT;
BEGIN
    -- 检查可用性
    SELECT ca.is_available, ca.conflict_reason 
    INTO v_is_available, v_conflict_reason
    FROM check_availability(p_store_name, p_therapist_name, p_appointment_date, p_appointment_time) ca;
    
    IF NOT v_is_available THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER, v_conflict_reason;
        RETURN;
    END IF;
    
    -- 获取店铺和技师ID
    SELECT s.id, t.id INTO v_store_id, v_therapist_id
    FROM stores s
    JOIN therapists t ON s.id = t.store_id
    WHERE s.name = p_store_name
        AND t.name = p_therapist_name;
    
    -- 创建预约
    INSERT INTO appointments (
        customer_name, customer_phone, store_id, therapist_id,
        appointment_date, appointment_time, service_type, notes, status
    ) VALUES (
        p_customer_name, p_customer_phone, v_store_id, v_therapist_id,
        p_appointment_date, p_appointment_time, p_service_type, p_notes, 'confirmed'
    ) RETURNING id INTO v_appointment_id;
    
    RETURN QUERY SELECT TRUE, v_appointment_id, '预约成功';
END;
$$ LANGUAGE plpgsql;