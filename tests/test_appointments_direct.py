#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

# 测试配置
BASE_URL = 'http://localhost:3001'

def test_appointments_direct():
    """直接测试预约API"""
    print("🚀 直接测试预约API...")
    print("=" * 60)
    
    # 1. 测试获取预约列表
    print("📋 测试获取预约列表...")
    try:
        response = requests.get(f'{BASE_URL}/api/appointments')
        print(f"响应状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"响应数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            if data.get('success'):
                appointments = data.get('appointments', [])
                print(f"✅ 获取成功，共 {len(appointments)} 个预约")
                
                if appointments:
                    for i, appointment in enumerate(appointments[:2], 1):
                        print(f"\n预约{i}:")
                        print(f"  ID: {appointment.get('id')}")
                        print(f"  日期: {appointment.get('appointment_date')}")
                        print(f"  时间: {appointment.get('start_time')}")
                        print(f"  客户: {appointment.get('user_name') or appointment.get('customer_name')}")
                        print(f"  技师: {appointment.get('therapist_name')}")
                        print(f"  门店: {appointment.get('store_name')}")
                        print(f"  状态: {appointment.get('status')}")
                        print(f"  服务: {appointment.get('service_type')}")
                else:
                    print("  暂无预约数据")
            else:
                print(f"❌ API返回失败: {data}")
        else:
            print(f"❌ API请求失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
    
    print("\n" + "=" * 60)
    
    # 2. 测试健康检查
    print("🏥 测试健康检查...")
    try:
        response = requests.get(f'{BASE_URL}/api/health')
        print(f"健康检查状态: {response.status_code}")
        if response.status_code == 200:
            health_data = response.json()
            print(f"健康状态: {health_data.get('status')}")
            print(f"数据库: {health_data.get('database')}")
            print(f"类型: {health_data.get('type')}")
        else:
            print(f"健康检查失败: {response.text}")
    except Exception as e:
        print(f"健康检查异常: {e}")
    
    print("\n🎉 预约API直接测试完成！")

if __name__ == "__main__":
    test_appointments_direct() 