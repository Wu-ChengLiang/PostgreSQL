#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查最新的预约记录和门店匹配情况
"""

import sqlite3

def check_latest_appointments():
    """检查最新预约记录"""
    try:
        conn = sqlite3.connect('mingyi.db')
        cursor = conn.cursor()
        
        # 1. 检查总数
        cursor.execute('SELECT COUNT(*) FROM appointments')
        total_count = cursor.fetchone()[0]
        print(f'📊 当前总预约数: {total_count}')
        
        # 2. 查看最新的预约记录（详细信息）
        cursor.execute('''
            SELECT a.id, u.name as customer, t.name as therapist, 
                   t.store_id as therapist_store_id, s1.name as therapist_store,
                   a.store_id as appointment_store_id, s2.name as appointment_store,
                   a.appointment_date, a.start_time, a.notes, a.created_at
            FROM appointments a 
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN therapists t ON a.therapist_id = t.id
            LEFT JOIN stores s1 ON t.store_id = s1.id
            LEFT JOIN stores s2 ON a.store_id = s2.id
            ORDER BY a.id DESC 
            LIMIT 10
        ''')
        appointments = cursor.fetchall()
        
        print('\n=== 最新10条预约记录（详细门店匹配） ===')
        for apt in appointments:
            print(f'预约ID:{apt[0]} 客户:{apt[1]} 技师:{apt[2]}')
            print(f'  技师所属门店: ID={apt[3]} {apt[4]}')
            print(f'  预约记录门店: ID={apt[5]} {apt[6]}')
            print(f'  预约时间: {apt[7]} {apt[8]}')
            print(f'  备注: {apt[9]}')
            print(f'  创建时间: {apt[10]}')
            
            match_status = "✅ 匹配" if apt[3] == apt[5] else "❌ 不匹配"
            print(f'  门店匹配状态: {match_status}')
            
            # 特别标记包含"门店匹配测试"的记录
            if apt[9] and "门店匹配测试" in apt[9]:
                print(f'  🧪 这是门店匹配测试记录!')
            print()
        
        # 3. 检查是否有静安寺店的技师
        cursor.execute('''
            SELECT t.id, t.name, s.name as store_name
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE s.name LIKE '%静安寺%'
            ORDER BY t.id
        ''')
        jingan_therapists = cursor.fetchall()
        
        print('=== 静安寺店的技师 ===')
        if jingan_therapists:
            for therapist in jingan_therapists:
                print(f'技师ID:{therapist[0]} 姓名:{therapist[1]} 门店:{therapist[2]}')
        else:
            print('❌ 静安寺店没有技师！这解释了为什么门店匹配会失败')
        
        # 4. 查看周龙标和马老师的门店信息
        cursor.execute('''
            SELECT t.id, t.name, t.store_id, s.name as store_name
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE t.name IN ('周龙标', '马老师')
            ORDER BY t.name
        ''')
        specific_therapists = cursor.fetchall()
        
        print('\n=== 特定技师的门店信息 ===')
        for therapist in specific_therapists:
            print(f'技师ID:{therapist[0]} 姓名:{therapist[1]} 门店ID:{therapist[2]} 门店:{therapist[3]}')
        
        conn.close()
        
    except Exception as e:
        print(f'❌ 查询失败: {e}')

if __name__ == "__main__":
    check_latest_appointments() 