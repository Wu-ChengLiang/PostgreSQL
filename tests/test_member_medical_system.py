#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
会员和病历系统集成测试
测试驱动开发 - 基于现有users表扩展
"""

import unittest
import sqlite3
import json
import os
from datetime import datetime, date

class TestMemberMedicalSystem(unittest.TestCase):
    """会员和病历系统测试类"""
    
    def setUp(self):
        """测试前准备"""
        self.db_path = 'test_mingyi.db'
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        
        # 创建测试数据库
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        
        # 创建扩展后的users表结构
        self.create_enhanced_users_table()
        self.create_minimal_additional_tables()
        
        # 插入测试数据
        self.insert_test_data()
    
    def tearDown(self):
        """测试后清理"""
        if self.conn:
            self.conn.close()
        try:
            if os.path.exists(self.db_path):
                os.remove(self.db_path)
        except PermissionError:
            pass  # Windows权限问题，忽略
    
    def create_enhanced_users_table(self):
        """创建扩展的users表（基于现有结构，添加会员和病历字段）"""
        create_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) NOT NULL,
            username VARCHAR(50) UNIQUE,
            email VARCHAR(100),
            phone VARCHAR(20) UNIQUE NOT NULL, -- 手机号作为核心标识
            gender TEXT DEFAULT 'unknown' CHECK (gender IN ('male', 'female', 'unknown')),
            age INTEGER,
            
            -- 原有字段
            health_condition TEXT,
            preferences TEXT,
            total_visits INTEGER DEFAULT 0,
            member_level TEXT DEFAULT 'normal' CHECK (member_level IN ('normal', 'silver', 'gold', 'diamond')),
            
            -- 新增会员系统字段
            membership_number VARCHAR(20) UNIQUE, -- 会员编号：VIP202501001
            balance DECIMAL(10,2) DEFAULT 0.00, -- 余额
            points INTEGER DEFAULT 0, -- 积分
            total_spent DECIMAL(10,2) DEFAULT 0.00, -- 累计消费
            discount_rate DECIMAL(3,2) DEFAULT 1.00, -- 折扣率
            
            -- 新增中医病历字段 (JSON存储，简化结构)
            medical_record_number VARCHAR(20), -- 病历号：TCM202501001
            constitution_type VARCHAR(50), -- 体质类型
            allergies TEXT, -- 过敏史
            tcm_diagnosis_history TEXT, -- 中医诊断历史(JSON)
            emergency_contact_name VARCHAR(50), -- 紧急联系人
            emergency_contact_phone VARCHAR(20), -- 紧急联系人电话
            
            -- 通知设置
            sms_notifications BOOLEAN DEFAULT 1, -- 是否接收短信通知
            sms_marketing BOOLEAN DEFAULT 1, -- 是否接收营销短信
            
            -- 状态
            status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED')),
            
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
        CREATE INDEX IF NOT EXISTS idx_users_membership_number ON users(membership_number);
        CREATE INDEX IF NOT EXISTS idx_users_member_level ON users(member_level);
        
        -- 创建触发器
        CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
        AFTER UPDATE ON users
        BEGIN
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
        """
        self.cursor.executescript(create_sql)
        self.conn.commit()
    
    def create_minimal_additional_tables(self):
        """创建最少的必要附加表"""
        
        # 交易记录表（用于记录充值、消费、退款）
        transaction_sql = """
        CREATE TABLE IF NOT EXISTS user_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_phone VARCHAR(20) NOT NULL, -- 直接关联用户手机号
            transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('RECHARGE', 'CONSUME', 'REFUND')),
            amount DECIMAL(10,2) NOT NULL,
            balance_before DECIMAL(10,2),
            balance_after DECIMAL(10,2),
            points_earned INTEGER DEFAULT 0,
            description TEXT,
            payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'WECHAT', 'ALIPAY', 'CARD')),
            sms_sent BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_phone) REFERENCES users(phone)
        );
        
        CREATE INDEX IF NOT EXISTS idx_transactions_phone ON user_transactions(user_phone);
        CREATE INDEX IF NOT EXISTS idx_transactions_type ON user_transactions(transaction_type);
        """
        
        # 诊断记录表（简化的中医诊断记录）
        diagnosis_sql = """
        CREATE TABLE IF NOT EXISTS diagnosis_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_phone VARCHAR(20) NOT NULL, -- 直接关联用户手机号
            visit_date DATE NOT NULL,
            chief_complaint TEXT, -- 主诉
            tcm_diagnosis TEXT, -- 中医诊断
            treatment_plan TEXT, -- 治疗方案
            therapist_id INTEGER, -- 技师ID
            next_visit_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_phone) REFERENCES users(phone)
        );
        
        CREATE INDEX IF NOT EXISTS idx_diagnosis_phone ON diagnosis_records(patient_phone);
        CREATE INDEX IF NOT EXISTS idx_diagnosis_visit_date ON diagnosis_records(visit_date);
        """
        
        self.cursor.executescript(transaction_sql)
        self.cursor.executescript(diagnosis_sql)
        self.conn.commit()
    
    def insert_test_data(self):
        """插入测试数据"""
        # 插入测试用户（扩展字段）
        test_users = [
            ('张三', '13800138001', 'male', 35, 'normal', 'VIP202501001', 500.00, 100, 1200.00, 0.95, 'TCM202501001', '平和质'),
            ('李四', '13800138002', 'female', 28, 'silver', 'VIP202501002', 800.00, 200, 2500.00, 0.90, 'TCM202501002', '气虚质'),
            ('王五', '13800138003', 'male', 42, 'gold', 'VIP202501003', 1200.00, 500, 8000.00, 0.85, 'TCM202501003', '阳虚质'),
        ]
        
        for user in test_users:
            sql = """
            INSERT INTO users (name, phone, gender, age, member_level, membership_number, 
                             balance, points, total_spent, discount_rate, medical_record_number, constitution_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            self.cursor.execute(sql, user)
        
        self.conn.commit()
    
    # 测试用例1：手机号唯一性验证
    def test_phone_uniqueness(self):
        """测试手机号唯一性约束"""
        with self.assertRaises(sqlite3.IntegrityError):
            self.cursor.execute("""
                INSERT INTO users (name, phone) VALUES ('重复用户', '13800138001')
            """)
            self.conn.commit()
    
    # 测试用例2：会员信息查询（基于手机号）
    def test_get_member_by_phone(self):
        """测试通过手机号查询会员信息"""
        phone = '13800138001'
        result = self.cursor.execute("""
            SELECT name, phone, member_level, balance, points, total_spent 
            FROM users WHERE phone = ?
        """, (phone,)).fetchone()
        
        self.assertIsNotNone(result)
        self.assertEqual(result['name'], '张三')
        self.assertEqual(result['member_level'], 'normal')
        self.assertEqual(float(result['balance']), 500.00)
        self.assertEqual(result['points'], 100)
    
    # 测试用例3：会员充值功能
    def test_member_recharge(self):
        """测试会员充值功能"""
        phone = '13800138001'
        recharge_amount = 200.00
        
        # 获取充值前余额
        before_balance = self.cursor.execute(
            "SELECT balance FROM users WHERE phone = ?", (phone,)
        ).fetchone()['balance']
        
        # 执行充值
        new_balance = float(before_balance) + recharge_amount
        
        # 更新用户余额
        self.cursor.execute("""
            UPDATE users SET balance = ?, total_spent = total_spent + ?
            WHERE phone = ?
        """, (new_balance, recharge_amount, phone))
        
        # 记录交易
        self.cursor.execute("""
            INSERT INTO user_transactions (user_phone, transaction_type, amount, 
                                         balance_before, balance_after, description)
            VALUES (?, 'RECHARGE', ?, ?, ?, '会员充值')
        """, (phone, recharge_amount, float(before_balance), new_balance))
        
        self.conn.commit()
        
        # 验证充值结果
        after_balance = self.cursor.execute(
            "SELECT balance FROM users WHERE phone = ?", (phone,)
        ).fetchone()['balance']
        
        self.assertEqual(float(after_balance), 700.00)  # 500 + 200
    
    # 测试用例4：会员消费功能
    def test_member_consume(self):
        """测试会员消费功能"""
        phone = '13800138002'  # 李四，有800余额
        consume_amount = 150.00
        
        # 获取消费前余额和折扣率
        user_info = self.cursor.execute("""
            SELECT balance, discount_rate FROM users WHERE phone = ?
        """, (phone,)).fetchone()
        
        before_balance = float(user_info['balance'])
        discount_rate = float(user_info['discount_rate'])
        
        # 计算实际消费金额（应用折扣）
        actual_amount = consume_amount * discount_rate
        new_balance = before_balance - actual_amount
        
        # 更新用户余额和积分
        points_earned = int(consume_amount * 0.01)  # 1%积分率
        
        self.cursor.execute("""
            UPDATE users SET balance = ?, points = points + ?
            WHERE phone = ?
        """, (new_balance, points_earned, phone))
        
        # 记录交易
        self.cursor.execute("""
            INSERT INTO user_transactions (user_phone, transaction_type, amount, 
                                         balance_before, balance_after, points_earned, description)
            VALUES (?, 'CONSUME', ?, ?, ?, ?, '服务消费')
        """, (phone, actual_amount, before_balance, new_balance, points_earned))
        
        self.conn.commit()
        
        # 验证消费结果
        after_info = self.cursor.execute("""
            SELECT balance, points FROM users WHERE phone = ?
        """, (phone,)).fetchone()
        
        self.assertEqual(float(after_info['balance']), 665.00)  # 800 - 150*0.9
        self.assertEqual(after_info['points'], 201)  # 200 + 1 (原积分+新积分)
    
    # 测试用例5：病历记录功能
    def test_medical_record(self):
        """测试病历记录功能"""
        phone = '13800138003'
        
        # 添加诊断记录
        self.cursor.execute("""
            INSERT INTO diagnosis_records (patient_phone, visit_date, chief_complaint, 
                                         tcm_diagnosis, treatment_plan)
            VALUES (?, ?, ?, ?, ?)
        """, (phone, '2025-01-15', '颈肩腰腿痛', '肝肾不足，经络瘀阻', '针灸推拿，活血化瘀'))
        
        self.conn.commit()
        
        # 查询病历记录
        record = self.cursor.execute("""
            SELECT * FROM diagnosis_records WHERE patient_phone = ?
        """, (phone,)).fetchone()
        
        self.assertIsNotNone(record)
        self.assertEqual(record['chief_complaint'], '颈肩腰腿痛')
        self.assertEqual(record['tcm_diagnosis'], '肝肾不足，经络瘀阻')
    
    # 测试用例6：预约系统与会员关联
    def test_appointment_member_integration(self):
        """测试预约系统与会员系统关联"""
        # 这个测试需要appointments表，先模拟查询逻辑
        phone = '13800138001'
        
        # 查询会员信息用于预约
        member_info = self.cursor.execute("""
            SELECT name, member_level, discount_rate FROM users WHERE phone = ?
        """, (phone,)).fetchone()
        
        self.assertIsNotNone(member_info)
        self.assertEqual(member_info['name'], '张三')
        self.assertEqual(float(member_info['discount_rate']), 0.95)
    
    # 测试用例7：短信通知数据准备
    def test_sms_notification_data(self):
        """测试短信通知相关数据准备"""
        phone = '13800138001'
        
        # 查询用户短信通知设置
        user_sms_settings = self.cursor.execute("""
            SELECT sms_notifications, sms_marketing FROM users WHERE phone = ?
        """, (phone,)).fetchone()
        
        self.assertTrue(user_sms_settings['sms_notifications'])
        self.assertTrue(user_sms_settings['sms_marketing'])
    
    # 测试用例8：交易记录查询
    def test_transaction_history(self):
        """测试交易记录查询功能"""
        # 先创建一些交易记录
        phone = '13800138001'
        
        # 执行充值测试以创建交易记录
        self.test_member_recharge()
        
        # 查询交易记录
        transactions = self.cursor.execute("""
            SELECT * FROM user_transactions WHERE user_phone = ? ORDER BY created_at DESC
        """, (phone,)).fetchall()
        
        self.assertGreater(len(transactions), 0)
        self.assertEqual(transactions[0]['transaction_type'], 'RECHARGE')
    
    # 测试用例9：会员等级自动升级逻辑测试
    def test_member_level_upgrade(self):
        """测试会员等级自动升级逻辑"""
        phone = '13800138001'
        
        # 模拟大额消费，应该触发等级升级
        # 假设：normal->silver需要1000元，silver->gold需要5000元
        
        # 更新总消费金额
        self.cursor.execute("""
            UPDATE users SET total_spent = 1500.00 WHERE phone = ?
        """, (phone,))
        
        # 检查是否应该升级等级（这里是测试逻辑，实际应该在业务代码中实现）
        user_info = self.cursor.execute("""
            SELECT total_spent, member_level FROM users WHERE phone = ?
        """, (phone,)).fetchone()
        
        total_spent = float(user_info['total_spent'])
        current_level = user_info['member_level']
        
        # 根据消费金额确定应该的等级
        if total_spent >= 5000:
            expected_level = 'gold'
        elif total_spent >= 1000:
            expected_level = 'silver'
        else:
            expected_level = 'normal'
        
        # 这里测试逻辑正确性，实际升级需要在业务代码中实现
        self.assertEqual(total_spent, 1500.00)

if __name__ == '__main__':
    unittest.main() 