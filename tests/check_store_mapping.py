#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查门店和技师的关联关系
"""

import sqlite3

def check_store_mapping():
    """检查门店和技师关联"""
    try:
        conn = sqlite3.connect('mingyi.db')
        cursor = conn.cursor()
        
        # 1. 查看门店信息
        cursor.execute('SELECT id, name, address FROM stores ORDER BY id')
        stores = cursor.fetchall()
        print('=== 门店列表 ===')
        for store in stores:
            print(f'ID:{store[0]} 名称:{store[1]} 地址:{store[2]}')
        
        # 2. 查看最近预约中涉及的技师信息
        cursor.execute('''
            SELECT DISTINCT t.id, t.name, t.store_id, s.name as store_name
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE t.id IN (
                SELECT DISTINCT therapist_id FROM appointments 
                WHERE id IN (14, 15, 16, 17, 18)
            )
            ORDER BY t.id
        ''')
        therapists = cursor.fetchall()
        
        print('\n=== 最近预约中的技师信息 ===')
        for therapist in therapists:
            print(f'技师ID:{therapist[0]} 姓名:{therapist[1]} 门店ID:{therapist[2]} 门店:{therapist[3]}')
        
        # 3. 查看具体的预约记录和门店匹配
        cursor.execute('''
            SELECT a.id, u.name as customer, t.name as therapist, 
                   t.store_id as therapist_store_id, s1.name as therapist_store,
                   a.store_id as appointment_store_id, s2.name as appointment_store
            FROM appointments a 
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN therapists t ON a.therapist_id = t.id
            LEFT JOIN stores s1 ON t.store_id = s1.id
            LEFT JOIN stores s2 ON a.store_id = s2.id
            WHERE a.id IN (14, 15, 16, 17, 18)
            ORDER BY a.id DESC
        ''')
        appointments = cursor.fetchall()
        
        print('\n=== 最近预约的门店匹配情况 ===')
        for apt in appointments:
            print(f'预约ID:{apt[0]} 客户:{apt[1]} 技师:{apt[2]}')
            print(f'  技师所属门店: ID={apt[3]} {apt[4]}')
            print(f'  预约记录门店: ID={apt[5]} {apt[6]}')
            match_status = "✅ 匹配" if apt[3] == apt[5] else "❌ 不匹配"
            print(f'  门店匹配状态: {match_status}')
            print()
        
        # 4. 检查名字包含"马"、"周"、"李"的技师（测试中用到的）
        cursor.execute('''
            SELECT t.id, t.name, t.store_id, s.name as store_name
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE t.name LIKE '%马%' OR t.name LIKE '%周%' OR t.name LIKE '%李%'
            ORDER BY t.name
        ''')
        test_therapists = cursor.fetchall()
        
        print('=== 测试中涉及的技师 ===')
        for therapist in test_therapists:
            print(f'技师ID:{therapist[0]} 姓名:{therapist[1]} 门店ID:{therapist[2]} 门店:{therapist[3]}')
        
        # 5. 查找静安寺店
        cursor.execute("SELECT id, name FROM stores WHERE name LIKE '%静安%'")
        jingan_stores = cursor.fetchall()
        
        print('\n=== 静安寺相关门店 ===')
        for store in jingan_stores:
            print(f'门店ID:{store[0]} 名称:{store[1]}')
        
        conn.close()
        
    except Exception as e:
        print(f'❌ 查询失败: {e}')

if __name__ == "__main__":
    check_store_mapping() 