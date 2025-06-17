#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查预约ID 23的具体情况
"""

import asyncio
import aiohttp
import sqlite3

async def check_appointment_23_via_api():
    """通过API检查预约23"""
    print("🔍 通过管理员API检查预约ID 23...")
    
    # 先登录获取token
    async with aiohttp.ClientSession() as session:
        login_data = {"username": "admin", "password": "admin123"}
        
        async with session.post(
            "http://localhost:3001/api/v1/admin/login",
            json=login_data
        ) as response:
            if response.status == 200:
                result = await response.json()
                token = result["data"]["token"]
                print(f"✅ 登录成功")
            else:
                print("❌ 登录失败")
                return
        
        # 查询预约23
        headers = {"Authorization": f"Bearer {token}"}
        async with session.get(
            "http://localhost:3001/api/v1/admin/appointments/23",
            headers=headers
        ) as response:
            print(f"📋 预约23查询结果: HTTP {response.status}")
            
            if response.status == 200:
                result = await response.json()
                if result.get("success"):
                    appointment = result["data"]["appointment"]
                    print(f"✅ 找到预约23:")
                    print(f"   客户: {appointment.get('user', {}).get('name')}")
                    print(f"   技师: {appointment.get('therapist', {}).get('name')}")
                    print(f"   时间: {appointment.get('appointment_date')} {appointment.get('start_time')}")
                    print(f"   状态: {appointment.get('status')}")
                else:
                    print(f"❌ API返回失败: {result.get('error')}")
            elif response.status == 404:
                print("⚠️ 预约23不存在")
            else:
                text = await response.text()
                print(f"❌ HTTP错误: {text}")

def check_appointment_23_in_db():
    """直接在数据库中检查预约23"""
    print("\n🗄️ 直接在数据库中检查预约ID 23...")
    
    try:
        conn = sqlite3.connect('mingyi.db')
        cursor = conn.cursor()
        
        # 查询预约23
        cursor.execute('''
            SELECT a.id, u.name as customer, t.name as therapist, 
                   a.appointment_date, a.start_time, a.status, a.created_at,
                   s.name as store_name, a.notes
            FROM appointments a 
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN therapists t ON a.therapist_id = t.id
            LEFT JOIN stores s ON a.store_id = s.id
            WHERE a.id = 23
        ''')
        
        row = cursor.fetchone()
        
        if row:
            print(f"✅ 数据库中找到预约23:")
            print(f"   ID: {row[0]}")
            print(f"   客户: {row[1]}")
            print(f"   技师: {row[2]}")
            print(f"   时间: {row[3]} {row[4]}")
            print(f"   状态: {row[5]}")
            print(f"   创建时间: {row[6]}")
            print(f"   门店: {row[7]}")
            print(f"   备注: {row[8]}")
        else:
            print("❌ 数据库中没有找到预约23")
        
        # 检查最新几条预约
        cursor.execute('''
            SELECT a.id, u.name as customer, t.name as therapist, 
                   a.appointment_date, a.start_time, a.created_at
            FROM appointments a 
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN therapists t ON a.therapist_id = t.id
            ORDER BY a.id DESC
            LIMIT 5
        ''')
        
        rows = cursor.fetchall()
        print(f"\n📊 数据库中最新5条预约:")
        for row in rows:
            print(f"   ID:{row[0]} 客户:{row[1]} 技师:{row[2]} 时间:{row[3]} {row[4]} 创建:{row[5]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 数据库查询失败: {e}")

async def main():
    """主函数"""
    print("🔍 检查预约ID 23的情况")
    print("=" * 40)
    
    # 1. 数据库直接查询
    check_appointment_23_in_db()
    
    # 2. API查询
    await check_appointment_23_via_api()
    
    print("\n" + "=" * 40)
    print("✅ 预约23检查完成")

if __name__ == "__main__":
    asyncio.run(main()) 