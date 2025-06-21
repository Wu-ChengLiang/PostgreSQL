#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time

# 测试配置
BASE_URL = 'http://localhost:3001'
API_BASE_URL = f'{BASE_URL}/api/v1/admin'
APPOINTMENTS_API_URL = f'{BASE_URL}/api/appointments'

def test_appointments_simple():
    """简化的预约管理API测试"""
    print("🚀 开始预约管理API简化测试...")
    print("=" * 60)
    
    # 1. 管理员登录
    print("🔐 测试管理员登录...")
    login_response = requests.post(f'{API_BASE_URL}/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        token = login_data.get('token') or login_data.get('data', {}).get('token')
        if token:
            print(f"✅ 登录成功")
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
        else:
            print(f"❌ 登录响应中未找到token")
            return
    else:
        print(f"❌ 登录失败")
        return
    
    print("\n" + "=" * 60)
    
    # 等待一下避免请求频率限制
    time.sleep(2)
    
    # 2. 测试预约管理功能
    print("📅 测试预约管理功能...")
    print("-" * 40)
    
    # 2.1 获取预约列表
    print("📋 获取预约列表...")
    try:
        response = requests.get(APPOINTMENTS_API_URL, headers=headers)
        print(f"   响应状态: {response.status_code}")
        
        if response.status_code == 200:
            appointments_data = response.json()
            if appointments_data.get('success'):
                appointments = appointments_data.get('appointments', [])
                print(f"✅ 获取成功，共 {len(appointments)} 个预约")
                
                if appointments:
                    # 显示前3个预约信息
                    for i, appointment in enumerate(appointments[:3], 1):
                        print(f"   预约{i}: 📅 {appointment.get('appointment_date', 'N/A')}")
                        print(f"           🕐 {appointment.get('start_time', 'N/A')}")
                        print(f"           👤 {appointment.get('user_name', 'N/A')}")
                        print(f"           👨‍⚕️ {appointment.get('therapist_name', 'N/A')}")
                        print(f"           📋 {appointment.get('status', 'N/A')}")
                        print()
                else:
                    print("   暂无预约数据")
            else:
                print(f"❌ 获取失败: {appointments_data}")
        else:
            print(f"❌ 获取预约列表失败: {response.text}")
    except Exception as e:
        print(f"❌ 请求异常: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 预约管理API简化测试完成！")

if __name__ == "__main__":
    test_appointments_simple() 