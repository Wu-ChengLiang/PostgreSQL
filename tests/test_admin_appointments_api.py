#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试管理员API的预约查询功能
"""

import asyncio
import aiohttp
import json

async def test_admin_login():
    """测试管理员登录"""
    print("🔐 测试管理员登录...")
    
    async with aiohttp.ClientSession() as session:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            async with session.post(
                "http://localhost:3001/api/v1/admin/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        token = result["data"]["token"]
                        admin_info = result["data"]["admin"]
                        print(f"✅ 登录成功! 管理员: {admin_info.get('username')}")
                        print(f"   Token: {token[:20]}...")
                        return token
                    else:
                        print(f"❌ 登录失败: {result.get('error')}")
                        return None
                else:
                    text = await response.text()
                    print(f"❌ HTTP错误 {response.status}: {text}")
                    return None
                    
        except Exception as e:
            print(f"❌ 登录异常: {e}")
            return None

async def test_admin_appointments_api(token):
    """测试管理员预约API"""
    print("\n📋 测试管理员预约查询API...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        # 测试1: 查询所有预约
        print("\n🔍 测试1: 查询所有预约")
        try:
            async with session.get(
                "http://localhost:3001/api/v1/admin/appointments",
                headers=headers
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        appointments = result["data"]["appointments"]
                        total = result["data"]["total"]
                        print(f"✅ 查询成功! 总数: {total}, 当前页: {len(appointments)}条")
                        
                        # 显示最新几条预约
                        print("   最新预约记录:")
                        for i, apt in enumerate(appointments[:5]):
                            print(f"   {i+1}. ID:{apt['id']} 客户:{apt.get('user_name')} 技师:{apt.get('therapist_name')} 时间:{apt.get('appointment_date')} {apt.get('start_time')}")
                    else:
                        print(f"❌ 查询失败: {result.get('error')}")
                else:
                    text = await response.text()
                    print(f"❌ HTTP错误 {response.status}: {text}")
                    
        except Exception as e:
            print(f"❌ 查询异常: {e}")
        
        # 测试2: 查询今天的预约
        print("\n🔍 测试2: 查询今天的预约")
        try:
            from datetime import datetime
            today = datetime.now().strftime("%Y-%m-%d")
            
            async with session.get(
                f"http://localhost:3001/api/v1/admin/appointments?date={today}",
                headers=headers
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        appointments = result["data"]["appointments"]
                        total = result["data"]["total"]
                        print(f"✅ 今天预约查询成功! 总数: {total}条")
                        
                        if appointments:
                            for i, apt in enumerate(appointments):
                                print(f"   {i+1}. ID:{apt['id']} 客户:{apt.get('user_name')} 技师:{apt.get('therapist_name')} 时间:{apt.get('start_time')}")
                        else:
                            print("   📝 今天没有预约记录")
                    else:
                        print(f"❌ 今天预约查询失败: {result.get('error')}")
                else:
                    text = await response.text()
                    print(f"❌ HTTP错误 {response.status}: {text}")
                    
        except Exception as e:
            print(f"❌ 今天预约查询异常: {e}")
        
        # 测试3: 查询特定预约详情
        print("\n🔍 测试3: 查询特定预约详情 (ID: 23)")
        try:
            async with session.get(
                "http://localhost:3001/api/v1/admin/appointments/23",
                headers=headers
            ) as response:
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        appointment = result["data"]["appointment"]
                        print(f"✅ 预约详情查询成功!")
                        print(f"   ID: {appointment['id']}")
                        print(f"   客户: {appointment.get('user', {}).get('name')}")
                        print(f"   技师: {appointment.get('therapist', {}).get('name')}")
                        print(f"   门店: {appointment.get('store', {}).get('name')}")
                        print(f"   时间: {appointment.get('appointment_date')} {appointment.get('start_time')}")
                        print(f"   状态: {appointment.get('status')}")
                    else:
                        print(f"❌ 预约详情查询失败: {result.get('error')}")
                elif response.status == 404:
                    print(f"⚠️ 预约ID 23不存在 (404)")
                else:
                    text = await response.text()
                    print(f"❌ HTTP错误 {response.status}: {text}")
                    
        except Exception as e:
            print(f"❌ 预约详情查询异常: {e}")

async def main():
    """主测试函数"""
    print("🧪 管理员API预约查询测试")
    print("=" * 50)
    
    # 1. 登录获取token
    token = await test_admin_login()
    
    if not token:
        print("❌ 无法获取管理员token，测试终止")
        return
    
    # 2. 测试预约查询API
    await test_admin_appointments_api(token)
    
    print("\n" + "=" * 50)
    print("✅ 管理员API测试完成")

if __name__ == "__main__":
    asyncio.run(main()) 