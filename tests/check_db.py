#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查数据库中的预约记录
"""

import sqlite3

def check_appointments():
    """检查预约记录"""
    try:
        conn = sqlite3.connect('mingyi.db')
        cursor = conn.cursor()
        
        # 1. 检查总数
        cursor.execute('SELECT COUNT(*) FROM appointments')
        total_count = cursor.fetchone()[0]
        print(f'📊 总预约数: {total_count}')
        
        if total_count == 0:
            print('❌ 没有找到任何预约记录')
            return
        
        # 2. 查看最新的预约记录（简单查询）
        cursor.execute('''
            SELECT id, user_id, therapist_id, appointment_date, start_time, status, created_at 
            FROM appointments 
            ORDER BY id DESC 
            LIMIT 10
        ''')
        rows = cursor.fetchall()
        
        print('\n=== 最新10条预约记录（基本信息） ===')
        for i, row in enumerate(rows):
            print(f'{i+1}. ID:{row[0]} 用户ID:{row[1]} 技师ID:{row[2]} 日期:{row[3]} 时间:{row[4]} 状态:{row[5]} 创建时间:{row[6]}')
        
        # 3. 尝试JOIN查询获取名称
        try:
            cursor.execute('''
                SELECT a.id, u.name as customer_name, t.name as therapist_name, 
                       a.appointment_date, a.start_time, a.status, a.created_at
                FROM appointments a 
                LEFT JOIN users u ON a.user_id = u.id 
                LEFT JOIN therapists t ON a.therapist_id = t.id 
                ORDER BY a.id DESC 
                LIMIT 5
            ''')
            joined_rows = cursor.fetchall()
            
            print('\n=== 最新5条预约记录（详细信息） ===')
            for i, row in enumerate(joined_rows):
                print(f'{i+1}. ID:{row[0]} 客户:{row[1]} 技师:{row[2]} 时间:{row[3]} {row[4]} 状态:{row[5]} 创建:{row[6]}')
                
        except Exception as e:
            print(f'⚠️ JOIN查询失败: {e}')
        
        # 4. 检查用户表和技师表
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        print(f'\n👥 用户总数: {user_count}')
        
        cursor.execute('SELECT COUNT(*) FROM therapists')
        therapist_count = cursor.fetchone()[0]
        print(f'🧑‍⚕️ 技师总数: {therapist_count}')
        
        conn.close()
        
    except Exception as e:
        print(f'❌ 查询失败: {e}')

if __name__ == "__main__":
    check_appointments() 