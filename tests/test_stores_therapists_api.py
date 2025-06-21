#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

# 测试配置
BASE_URL = 'http://localhost:3001'
API_BASE_URL = f'{BASE_URL}/api/v1/admin'

def test_stores_therapists_api():
    """测试门店和技师管理API"""
    print("🚀 开始门店和技师API测试...")
    print("=" * 60)
    
    # 1. 管理员登录
    print("🔐 测试管理员登录...")
    login_response = requests.post(f'{API_BASE_URL}/login', json={
        'username': 'admin',
        'password': 'admin123'
    })
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        print(f"登录响应: {login_data}")
        token = login_data.get('token') or login_data.get('data', {}).get('token')
        if token:
            print(f"✅ 登录成功，获取到token: {token[:20]}...")
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
        else:
            print(f"❌ 登录响应中未找到token: {login_data}")
            return
    else:
        print(f"❌ 登录失败: {login_response.text}")
        return
    
    print("\n" + "=" * 60)
    
    # 2. 测试门店管理API
    print("🏪 测试门店管理API...")
    print("-" * 40)
    
    # 2.1 获取所有门店
    print("📋 获取所有门店...")
    response = requests.get(f'{API_BASE_URL}/stores', headers=headers)
    print(f"响应状态码: {response.status_code}")
    print(f"响应内容: {response.text[:500]}...")
    
    if response.status_code == 200:
        try:
            stores_data = response.json()
            stores = stores_data if isinstance(stores_data, list) else stores_data.get('data', [])
            print(f"✅ 获取成功，共 {len(stores)} 个门店")
            if stores and len(stores) > 0:
                first_store = stores[0]
                print(f"   示例门店: {first_store.get('name', 'N/A')} - {first_store.get('address', 'N/A')}")
                store_id = first_store.get('id')
            else:
                print("   门店列表为空")
                store_id = 1  # 使用默认ID进行后续测试
        except Exception as e:
            print(f"❌ 解析门店数据失败: {e}")
            store_id = 1
    else:
        print(f"❌ 获取门店失败: {response.text}")
        store_id = 1  # 使用默认ID继续测试
    
    # 2.2 获取单个门店详情
    if store_id:
        print(f"🔍 获取门店详情 (ID: {store_id})...")
        response = requests.get(f'{API_BASE_URL}/stores/{store_id}', headers=headers)
        if response.status_code == 200:
            store_detail = response.json()
            print(f"✅ 获取成功: {store_detail.get('name', 'N/A')}")
        else:
            print(f"❌ 获取门店详情失败: {response.text}")
    
    # 2.3 测试创建门店
    print("➕ 测试创建门店...")
    new_store_data = {
        'name': '测试门店（API测试）',
        'address': '上海市测试区测试路123号',
        'phone': '021-12345678',
        'business_hours': '09:00-21:00',
        'manager_name': '测试经理'
    }
    response = requests.post(f'{API_BASE_URL}/stores', json=new_store_data, headers=headers)
    if response.status_code == 201:
        new_store = response.json()
        print(f"✅ 创建成功: {new_store.get('name', 'N/A')}")
        new_store_id = new_store.get('id')
    else:
        print(f"❌ 创建门店失败: {response.text}")
        new_store_id = None
    
    print("\n" + "-" * 40)
    
    # 3. 测试技师管理API
    print("👨‍⚕️ 测试技师管理API...")
    print("-" * 40)
    
    # 3.1 获取所有技师
    print("📋 获取所有技师...")
    response = requests.get(f'{API_BASE_URL}/therapists', headers=headers)
    print(f"技师响应状态码: {response.status_code}")
    print(f"技师响应内容: {response.text[:300]}...")
    
    if response.status_code == 200:
        try:
            therapists_data = response.json()
            therapists = therapists_data if isinstance(therapists_data, list) else therapists_data.get('data', [])
            print(f"✅ 获取成功，共 {len(therapists)} 个技师")
            if therapists and len(therapists) > 0:
                first_therapist = therapists[0]
                print(f"   示例技师: {first_therapist.get('name', 'N/A')} - {first_therapist.get('position', 'N/A')}")
                therapist_id = first_therapist.get('id')
            else:
                print("   技师列表为空")
                therapist_id = 1
        except Exception as e:
            print(f"❌ 解析技师数据失败: {e}")
            therapist_id = 1
    else:
        print(f"❌ 获取技师失败: {response.text}")
        therapist_id = 1
    
    # 3.2 获取单个技师详情
    if therapist_id:
        print(f"🔍 获取技师详情 (ID: {therapist_id})...")
        response = requests.get(f'{API_BASE_URL}/therapists/{therapist_id}', headers=headers)
        if response.status_code == 200:
            therapist_detail = response.json()
            print(f"✅ 获取成功: {therapist_detail.get('name', 'N/A')} - {therapist_detail.get('specialties', 'N/A')}")
        else:
            print(f"❌ 获取技师详情失败: {response.text}")
    
    # 3.3 测试创建技师
    if store_id:
        print("➕ 测试创建技师...")
        new_therapist_data = {
            'store_id': store_id,
            'name': '测试技师（API测试）',
            'position': '调理师',
            'title': '高级调理师',
            'experience_years': 5,
            'specialties': '["测试按摩", "测试推拿"]',
            'phone': '13800138999',
            'status': 'active'
        }
        response = requests.post(f'{API_BASE_URL}/therapists', json=new_therapist_data, headers=headers)
        if response.status_code == 201:
            new_therapist = response.json()
            print(f"✅ 创建成功: {new_therapist.get('name', 'N/A')}")
            new_therapist_id = new_therapist.get('id')
        else:
            print(f"❌ 创建技师失败: {response.text}")
            new_therapist_id = None
    
    print("\n" + "-" * 40)
    
    # 4. 测试统计API
    print("📊 测试统计API...")
    print("-" * 40)
    
    # 4.1 技师统计
    print("📈 获取技师统计...")
    response = requests.get(f'{API_BASE_URL}/statistics/therapists', headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print(f"✅ 获取成功: {stats}")
    else:
        print(f"❌ 获取技师统计失败: {response.text}")
    
    print("\n" + "=" * 60)
    
    # 5. 清理测试数据
    print("🧹 清理测试数据...")
    
    # 删除测试技师
    if new_therapist_id:
        response = requests.delete(f'{API_BASE_URL}/therapists/{new_therapist_id}', headers=headers)
        if response.status_code == 200:
            print("✅ 测试技师删除成功")
        else:
            print(f"❌ 测试技师删除失败: {response.text}")
    
    # 删除测试门店（如果有删除API的话）
    # 注意：从API路由来看，可能没有删除门店的API，这里先跳过
    
    print("\n" + "=" * 60)
    print("🎉 门店和技师API测试完成！")
    
    print("\n📋 API路由总结:")
    print("门店管理:")
    print("  - GET /api/v1/admin/stores - 获取所有门店")
    print("  - GET /api/v1/admin/stores/:id - 获取门店详情")
    print("  - POST /api/v1/admin/stores - 创建门店")
    print("  - PUT /api/v1/admin/stores/:id - 更新门店")
    print("\n技师管理:")
    print("  - GET /api/v1/admin/therapists - 获取所有技师")
    print("  - GET /api/v1/admin/therapists/:id - 获取技师详情")
    print("  - POST /api/v1/admin/therapists - 创建技师")
    print("  - PUT /api/v1/admin/therapists/:id - 更新技师")
    print("  - DELETE /api/v1/admin/therapists/:id - 删除技师")
    print("  - GET /api/v1/admin/statistics/therapists - 技师统计")

if __name__ == "__main__":
    try:
        test_stores_therapists_api()
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc() 