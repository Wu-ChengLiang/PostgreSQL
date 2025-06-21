#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

# 测试配置
BASE_URL = 'http://localhost:3001'
API_BASE_URL = f'{BASE_URL}/api/v1/admin'

def test_admin_appointments():
    """测试管理员预约API"""
    print("🚀 开始管理员预约API测试...")
    print("=" * 60)
    
    # 1. 管理员登录
    print("🔐 测试管理员登录...")
    try:
        login_response = requests.post(f'{API_BASE_URL}/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        print(f"登录响应状态: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('data', {}).get('token')
            if token:
                print(f"✅ 登录成功，获取到token")
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # 2. 测试获取预约列表
                print("\n📅 测试获取预约列表...")
                appointments_response = requests.get(f'{API_BASE_URL}/appointments', headers=headers)
                print(f"预约列表响应状态: {appointments_response.status_code}")
                
                if appointments_response.status_code == 200:
                    appointments_data = appointments_response.json()
                    print(f"预约列表响应: {json.dumps(appointments_data, indent=2, ensure_ascii=False)}")
                    
                    if appointments_data.get('success'):
                        appointments = appointments_data.get('data', {}).get('appointments', [])
                        print(f"✅ 获取成功，共 {len(appointments)} 个预约")
                        
                        # 显示前几个预约的详细信息
                        for i, appointment in enumerate(appointments[:3], 1):
                            print(f"\n预约{i}:")
                            print(f"  ID: {appointment.get('id')}")
                            print(f"  日期: {appointment.get('appointment_date')}")
                            print(f"  时间: {appointment.get('start_time')}")
                            print(f"  客户: {appointment.get('user_name') or appointment.get('customer_name')}")
                            print(f"  技师: {appointment.get('therapist_name')}")
                            print(f"  门店: {appointment.get('store_name')}")
                            print(f"  状态: {appointment.get('status')}")
                    else:
                        print(f"❌ 获取预约列表失败: {appointments_data}")
                else:
                    print(f"❌ 预约列表请求失败: {appointments_response.text}")
                
                # 3. 测试获取门店列表（用于预约表单）
                print("\n🏪 测试获取门店列表...")
                stores_response = requests.get(f'{API_BASE_URL}/stores', headers=headers)
                print(f"门店列表响应状态: {stores_response.status_code}")
                
                if stores_response.status_code == 200:
                    stores_data = stores_response.json()
                    if stores_data.get('success'):
                        stores = stores_data.get('data', {}).get('stores', [])
                        print(f"✅ 获取成功，共 {len(stores)} 个门店")
                        
                        # 显示前几个门店
                        for i, store in enumerate(stores[:3], 1):
                            print(f"  门店{i}: {store.get('name')} (ID: {store.get('id')})")
                    else:
                        print(f"❌ 获取门店列表失败: {stores_data}")
                else:
                    print(f"❌ 门店列表请求失败: {stores_response.text}")
                
                # 4. 测试获取技师列表
                print("\n👨‍⚕️ 测试获取技师列表...")
                therapists_response = requests.get(f'{API_BASE_URL}/therapists', headers=headers)
                print(f"技师列表响应状态: {therapists_response.status_code}")
                
                if therapists_response.status_code == 200:
                    therapists_data = therapists_response.json()
                    if therapists_data.get('success'):
                        therapists = therapists_data.get('data', {}).get('therapists', [])
                        print(f"✅ 获取成功，共 {len(therapists)} 个技师")
                        
                        # 显示前几个技师
                        for i, therapist in enumerate(therapists[:3], 1):
                            print(f"  技师{i}: {therapist.get('name')} - {therapist.get('position')} (ID: {therapist.get('id')})")
                    else:
                        print(f"❌ 获取技师列表失败: {therapists_data}")
                else:
                    print(f"❌ 技师列表请求失败: {therapists_response.text}")
                
            else:
                print(f"❌ 未找到token")
        else:
            print(f"❌ 登录失败: {login_response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")

    print("\n" + "=" * 60)
    print("🎉 管理员预约API测试完成！")

if __name__ == "__main__":
    test_admin_appointments() 