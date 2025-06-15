-- 数据库表结构修复脚本
-- 请在PostgreSQL中执行此脚本

-- 检查当前appointments表结构
\d appointments

-- 如果appointments表不存在username字段，添加它
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'username'
    ) THEN
        ALTER TABLE appointments ADD COLUMN username VARCHAR(255);
        COMMENT ON COLUMN appointments.username IS '用户名，用于公开预约系统';
        
        -- 为现有记录设置默认用户名（如果有的话）
        UPDATE appointments SET username = 'LEGACY_' || id::text WHERE username IS NULL;
        
        RAISE NOTICE '已添加username字段到appointments表';
    ELSE
        RAISE NOTICE 'username字段已存在';
    END IF;
END $$;

-- 检查其他必要的字段
DO $$
BEGIN
    -- 检查status字段的约束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%appointments_status_check%'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
        ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
            CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
        RAISE NOTICE '已更新status字段约束';
    END IF;
    
    -- 确保created_at和updated_at字段存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '已添加created_at字段';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '已添加updated_at字段';
    END IF;
END $$;

-- 创建或更新updated_at触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为appointments表创建updated_at触发器
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建有用的索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_appointments_username ON appointments(username);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_therapist_date ON appointments(therapist_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- 插入一些测试数据（如果表为空）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM appointments LIMIT 1) THEN
        -- 确保有一些基础的门店和技师数据
        INSERT INTO stores (name, address) VALUES 
        ('测试门店', '上海市测试区测试路123号')
        ON CONFLICT (name) DO NOTHING;
        
        INSERT INTO therapists (store_id, name, gender, title, status) VALUES 
        ((SELECT id FROM stores WHERE name = '测试门店' LIMIT 1), '测试技师', '女', '调理师', 'active')
        ON CONFLICT (store_id, name) DO NOTHING;
        
        RAISE NOTICE '已插入测试数据';
    END IF;
END $$;

-- 显示最终的表结构
\d appointments

-- 显示一些统计信息
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT username) as unique_users,
    COUNT(DISTINCT therapist_id) as unique_therapists
FROM appointments;

-- 显示近期预约
SELECT 
    id, username, customer_name, therapist_id, 
    appointment_date, appointment_time, status,
    created_at
FROM appointments 
ORDER BY created_at DESC, id DESC 
LIMIT 10;

-- 测试插入语句
EXPLAIN (ANALYZE, BUFFERS) 
INSERT INTO appointments 
(username, customer_name, customer_phone, store_id, therapist_id, 
 appointment_date, appointment_time, service_type, notes, status)
VALUES ('TEST_USER', '测试客户', '13800000000', 1, 1,
        CURRENT_DATE + INTERVAL '1 day', '14:00', '测试服务', '测试备注', 'confirmed');

-- 回滚测试插入
ROLLBACK;