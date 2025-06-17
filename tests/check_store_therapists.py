#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查门店技师分布情况
"""

import sqlite3

def check_store_therapist_distribution():
    """检查门店技师分布"""
    try:
        conn = sqlite3.connect('mingyi.db')
        cursor = conn.cursor()
        
        print("🏪 门店技师分布分析")
        print("=" * 50)
        
        # 1. 检查关键门店的技师数量
        key_stores = ['静安寺', '关山路', '斜土路', '永康', '隆昌路']
        
        for store_keyword in key_stores:
            cursor.execute('''
                SELECT s.name as store_name, COUNT(t.id) as therapist_count
                FROM stores s 
                LEFT JOIN therapists t ON s.id = t.store_id AND t.status = 'active'
                WHERE s.name LIKE ?
                GROUP BY s.id, s.name
                ORDER BY s.name
            ''', [f'%{store_keyword}%'])
            
            stores = cursor.fetchall()
            print(f"\n📍 {store_keyword}相关门店:")
            for store in stores:
                print(f"   {store[0]}: {store[1]}个技师")
        
        # 2. 查看静安寺店的具体技师列表
        cursor.execute('''
            SELECT t.id, t.name, t.position, s.name as store_name
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE s.name LIKE '%静安寺%' AND t.status = 'active'
            ORDER BY t.id
        ''')
        jingan_therapists = cursor.fetchall()
        
        print(f"\n🧑‍⚕️ 静安寺店技师列表:")
        if jingan_therapists:
            for therapist in jingan_therapists:
                print(f"   ID:{therapist[0]} 姓名:{therapist[1]} 职位:{therapist[2]}")
        else:
            print("   ❌ 静安寺店没有技师！")
        
        # 3. 查看关山路店的具体技师列表
        cursor.execute('''
            SELECT t.id, t.name, t.position, s.name as store_name
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE s.name LIKE '%关山路%' AND t.status = 'active'
            ORDER BY t.id
        ''')
        guanshan_therapists = cursor.fetchall()
        
        print(f"\n🧑‍⚕️ 关山路店技师列表:")
        if guanshan_therapists:
            for therapist in guanshan_therapists:
                print(f"   ID:{therapist[0]} 姓名:{therapist[1]} 职位:{therapist[2]}")
        else:
            print("   ❌ 关山路店没有活跃技师！")
        
        # 4. 查看所有叫"马老师"的技师分布
        cursor.execute('''
            SELECT t.id, t.name, s.name as store_name, t.status
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE t.name LIKE '%马%'
            ORDER BY t.name, s.name
        ''')
        ma_therapists = cursor.fetchall()
        
        print(f"\n👨‍⚕️ 所有'马'相关技师分布:")
        for therapist in ma_therapists:
            status_icon = "✅" if therapist[3] == 'active' else "❌"
            print(f"   {status_icon} ID:{therapist[0]} 姓名:{therapist[1]} 门店:{therapist[2]} 状态:{therapist[3]}")
        
        # 5. 查看所有叫"周老师"相关的技师分布
        cursor.execute('''
            SELECT t.id, t.name, s.name as store_name, t.status
            FROM therapists t 
            LEFT JOIN stores s ON t.store_id = s.id 
            WHERE t.name LIKE '%周%'
            ORDER BY t.name, s.name
        ''')
        zhou_therapists = cursor.fetchall()
        
        print(f"\n👨‍⚕️ 所有'周'相关技师分布:")
        for therapist in zhou_therapists:
            status_icon = "✅" if therapist[3] == 'active' else "❌"
            print(f"   {status_icon} ID:{therapist[0]} 姓名:{therapist[1]} 门店:{therapist[2]} 状态:{therapist[3]}")
        
        conn.close()
        
        print(f"\n💡 结论分析:")
        print(f"   1. 如果静安寺店没有技师，那么门店匹配失败是正常的")
        print(f"   2. 系统会fallback到其他门店的同名技师")
        print(f"   3. 这解释了为什么用户从静安寺店访问，但预约显示其他门店")
        
    except Exception as e:
        print(f'❌ 查询失败: {e}')

if __name__ == "__main__":
    check_store_therapist_distribution() 