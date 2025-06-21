#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库结构更新脚本
基于现有users表扩展，添加会员和病历功能
实现目标：手机号作为唯一绑定标志
"""

import sqlite3
import os
import json
from datetime import datetime

def backup_database(db_path):
    """备份数据库"""
    backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    if os.path.exists(db_path):
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ 数据库已备份至: {backup_path}")
    return backup_path

def update_users_table_structure(cursor):
    """扩展users表结构"""
    print("🔄 更新users表结构...")
    
    # 检查现有字段
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    print(f"📋 现有字段: {existing_columns}")
    
    # 需要添加的新字段 (不能直接添加UNIQUE约束)
    new_columns = {
        'membership_number': 'VARCHAR(20)',
        'balance': 'DECIMAL(10,2) DEFAULT 0.00',
        'points': 'INTEGER DEFAULT 0',
        'total_spent': 'DECIMAL(10,2) DEFAULT 0.00',
        'discount_rate': 'DECIMAL(3,2) DEFAULT 1.00',
        'medical_record_number': 'VARCHAR(20)',
        'constitution_type': 'VARCHAR(50)',
        'allergies': 'TEXT',
        'tcm_diagnosis_history': 'TEXT',
        'emergency_contact_name': 'VARCHAR(50)',
        'emergency_contact_phone': 'VARCHAR(20)',
        'sms_notifications': 'BOOLEAN DEFAULT 1',
        'sms_marketing': 'BOOLEAN DEFAULT 1',
        'status': 'VARCHAR(20) DEFAULT "ACTIVE"'
    }
    
    # 添加不存在的字段
    for column_name, column_definition in new_columns.items():
        if column_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_definition}")
                print(f"  ✅ 添加字段: {column_name}")
            except sqlite3.Error as e:
                print(f"  ⚠️  添加字段 {column_name} 失败: {e}")
    
    # 创建新索引（在字段添加后）
    def create_indexes():
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_membership_number ON users(membership_number)",
            "CREATE INDEX IF NOT EXISTS idx_users_member_level_new ON users(member_level)",
            "CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)",
            "CREATE INDEX IF NOT EXISTS idx_users_medical_record ON users(medical_record_number)"
        ]
        
        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
                print(f"  ✅ 创建索引成功")
            except sqlite3.Error as e:
                print(f"  ⚠️  创建索引失败: {e}")
    
    # 返回创建索引的函数，在初始化数据后执行
    return create_indexes

def create_additional_tables(cursor):
    """创建必要的附加表（最少表设计）"""
    print("🔄 创建附加表...")
    
    # 交易记录表
    transaction_table_sql = """
    CREATE TABLE IF NOT EXISTS user_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_phone VARCHAR(20) NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('RECHARGE', 'CONSUME', 'REFUND')),
        amount DECIMAL(10,2) NOT NULL,
        balance_before DECIMAL(10,2),
        balance_after DECIMAL(10,2),
        points_earned INTEGER DEFAULT 0,
        description TEXT,
        payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'WECHAT', 'ALIPAY', 'CARD')),
        sms_sent BOOLEAN DEFAULT 0,
        sms_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_phone) REFERENCES users(phone)
    );
    """
    
    # 诊断记录表
    diagnosis_table_sql = """
    CREATE TABLE IF NOT EXISTS diagnosis_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_phone VARCHAR(20) NOT NULL,
        visit_date DATE NOT NULL,
        chief_complaint TEXT,
        tcm_diagnosis TEXT,
        treatment_plan TEXT,
        therapist_id INTEGER,
        next_visit_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_phone) REFERENCES users(phone),
        FOREIGN KEY (therapist_id) REFERENCES therapists(id)
    );
    """
    
    tables = [
        ("user_transactions", transaction_table_sql),
        ("diagnosis_records", diagnosis_table_sql)
    ]
    
    for table_name, table_sql in tables:
        try:
            cursor.execute(table_sql)
            print(f"  ✅ 创建表: {table_name}")
        except sqlite3.Error as e:
            print(f"  ⚠️  创建表 {table_name} 失败: {e}")
    
    # 创建相关索引
    additional_indexes = [
        "CREATE INDEX IF NOT EXISTS idx_transactions_phone ON user_transactions(user_phone)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_type ON user_transactions(transaction_type)",
        "CREATE INDEX IF NOT EXISTS idx_transactions_date ON user_transactions(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_diagnosis_phone ON diagnosis_records(patient_phone)",
        "CREATE INDEX IF NOT EXISTS idx_diagnosis_visit_date ON diagnosis_records(visit_date)"
    ]
    
    for index_sql in additional_indexes:
        try:
            cursor.execute(index_sql)
        except sqlite3.Error as e:
            print(f"  ⚠️  创建索引失败: {e}")

def initialize_member_data(cursor):
    """初始化现有用户的会员数据"""
    print("🔄 初始化会员数据...")
    
    # 为现有用户生成会员编号和病历号
    cursor.execute("SELECT id, phone, name FROM users WHERE phone IS NOT NULL AND phone != ''")
    users = cursor.fetchall()
    
    for user in users:
        user_id, phone, name = user
        
        # 生成唯一编号
        membership_number = f"VIP{datetime.now().strftime('%Y%m')}{user_id:04d}"
        medical_record_number = f"TCM{datetime.now().strftime('%Y%m')}{user_id:04d}"
        
        try:
            cursor.execute("""
                UPDATE users SET 
                    membership_number = ?,
                    medical_record_number = ?,
                    constitution_type = '待辨识',
                    sms_notifications = 1,
                    sms_marketing = 1,
                    status = 'ACTIVE'
                WHERE id = ?
            """, (membership_number, medical_record_number, user_id))
            
            print(f"  ✅ 初始化用户: {name} ({phone}) - {membership_number}")
        except sqlite3.Error as e:
            print(f"  ⚠️  初始化用户 {name} 失败: {e}")

def update_appointments_table(cursor):
    """更新预约表，添加会员关联字段"""
    print("🔄 更新预约表结构...")
    
    # 检查appointments表是否存在
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='appointments'")
    if not cursor.fetchone():
        print("  ⚠️  appointments表不存在，跳过更新")
        return
    
    # 检查现有字段
    cursor.execute("PRAGMA table_info(appointments)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    # 添加会员关联字段
    new_appointment_columns = {
        'member_phone': 'VARCHAR(20)',
        'is_member_booking': 'BOOLEAN DEFAULT 0',
        'member_discount_applied': 'DECIMAL(3,2) DEFAULT 1.00',
        'points_earned': 'INTEGER DEFAULT 0'
    }
    
    for column_name, column_definition in new_appointment_columns.items():
        if column_name not in existing_columns:
            try:
                cursor.execute(f"ALTER TABLE appointments ADD COLUMN {column_name} {column_definition}")
                print(f"  ✅ 添加预约表字段: {column_name}")
            except sqlite3.Error as e:
                print(f"  ⚠️  添加预约表字段 {column_name} 失败: {e}")

def verify_database_structure(cursor):
    """验证数据库结构"""
    print("🔍 验证数据库结构...")
    
    # 检查users表结构
    cursor.execute("PRAGMA table_info(users)")
    users_columns = [row[1] for row in cursor.fetchall()]
    
    required_columns = ['phone', 'balance', 'points', 'membership_number', 'medical_record_number']
    missing_columns = [col for col in required_columns if col not in users_columns]
    
    if missing_columns:
        print(f"  ❌ users表缺少字段: {missing_columns}")
        return False
    else:
        print(f"  ✅ users表结构正确 ({len(users_columns)} 个字段)")
    
    # 检查新表
    required_tables = ['user_transactions', 'diagnosis_records']
    for table_name in required_tables:
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
        if cursor.fetchone():
            print(f"  ✅ 表 {table_name} 存在")
        else:
            print(f"  ❌ 表 {table_name} 不存在")
            return False
    
    # 检查数据完整性
    cursor.execute("SELECT COUNT(*) FROM users WHERE phone IS NOT NULL")
    user_count = cursor.fetchone()[0]
    print(f"  📊 有效用户数: {user_count}")
    
    cursor.execute("SELECT COUNT(*) FROM users WHERE membership_number IS NOT NULL")
    member_count = cursor.fetchone()[0]
    print(f"  📊 已初始化会员数: {member_count}")
    
    return True

def main():
    """主函数"""
    db_path = 'mingyi.db'
    
    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return False
    
    print(f"🚀 开始更新数据库: {db_path}")
    
    # 备份数据库
    backup_path = backup_database(db_path)
    
    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # 开始事务
        cursor.execute("BEGIN TRANSACTION")
        
        # 执行更新步骤
        create_indexes_func = update_users_table_structure(cursor)
        create_additional_tables(cursor)
        update_appointments_table(cursor)
        initialize_member_data(cursor)
        
        # 创建索引（在数据初始化后）
        if create_indexes_func:
            create_indexes_func()
        
        # 验证结构
        if verify_database_structure(cursor):
            # 提交事务
            cursor.execute("COMMIT")
            print("✅ 数据库更新成功！")
            
            # 显示统计信息
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM users WHERE balance > 0")
            users_with_balance = cursor.fetchone()[0]
            
            cursor.execute("SELECT member_level, COUNT(*) FROM users GROUP BY member_level")
            level_stats = cursor.fetchall()
            
            print("\n📊 数据库统计:")
            print(f"  👥 总用户数: {total_users}")
            print(f"  💰 有余额用户: {users_with_balance}")
            print("  🏆 会员等级分布:")
            for level, count in level_stats:
                print(f"    - {level}: {count}")
            
            return True
        else:
            cursor.execute("ROLLBACK")
            print("❌ 数据库验证失败，已回滚")
            return False
            
    except Exception as e:
        print(f"❌ 数据库更新失败: {e}")
        try:
            cursor.execute("ROLLBACK")
        except:
            pass
        return False
        
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    success = main()
    if success:
        print("\n🎉 会员和病历系统数据库结构更新完成！")
        print("📝 下一步: 开发API接口")
    else:
        print("\n💥 更新失败，请检查错误信息")
        print("🔄 可以从备份恢复数据库") 