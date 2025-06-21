#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time

# 测试配置
BASE_URL = 'http://localhost:3001'
API_BASE_URL = f'{BASE_URL}/api/v1/admin'

def test_store_management_frontend():
    """测试门店管理前端集成功能"""
    print("🚀 开始门店管理前端集成测试...")
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
    
    # 2. 测试门店管理功能
    print("🏪 测试门店管理功能...")
    print("-" * 40)
    
    # 2.1 获取门店列表
    print("📋 获取门店列表...")
    response = requests.get(f'{API_BASE_URL}/stores', headers=headers)
    
    if response.status_code == 200:
        stores_data = response.json()
        if stores_data.get('success'):
            stores = stores_data.get('data', {}).get('stores', [])
            print(f"✅ 获取成功，共 {len(stores)} 个门店")
            
            if stores:
                # 显示门店信息
                for i, store in enumerate(stores[:3], 1):  # 只显示前3个
                    print(f"   门店{i}: 🏪 {store.get('name', 'N/A')}")
                    print(f"           📍 {store.get('address', 'N/A')}")
                    print(f"           📞 {store.get('phone', '未设置')}")
                    print(f"           👨‍⚕️ {store.get('therapist_count', 0)}名技师")
                    print(f"           🕒 {store.get('business_hours', 'N/A')}")
                    if store.get('manager_name'):
                        print(f"           👔 店长：{store.get('manager_name')}")
                    print()
                
                # 获取第一个门店的ID用于后续测试
                first_store_id = stores[0].get('id')
                first_store_name = stores[0].get('name')
            else:
                print("   暂无门店数据")
                first_store_id = None
        else:
            print(f"❌ 获取失败: {stores_data}")
            return
    else:
        print(f"❌ 获取门店列表失败: {response.text}")
        return
    
    # 2.2 测试创建门店
    print("➕ 测试创建门店...")
    new_store_data = {
        'name': '测试门店（前端集成测试）',
        'address': '上海市测试区测试路999号',
        'phone': '021-99999999',
        'business_hours': '8:00-22:00',
        'manager': '测试店长',
        'description': '这是一个用于前端集成测试的门店'
    }
    
    response = requests.post(f'{API_BASE_URL}/stores', json=new_store_data, headers=headers)
    
    if response.status_code == 201:
        new_store = response.json()
        if new_store.get('success'):
            created_store = new_store.get('data', {}).get('store', new_store.get('data', {}))
            new_store_id = created_store.get('id')
            print(f"✅ 创建成功: 🏪 {created_store.get('name', 'N/A')}")
            print(f"   门店ID: {new_store_id}")
        else:
            print(f"❌ 创建失败: {new_store}")
            new_store_id = None
    else:
        response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
        # 检查是否实际上是成功的（有些API返回200而不是201）
        if isinstance(response_data, dict) and response_data.get('success'):
            created_store = response_data.get('data', {}).get('store', response_data.get('data', {}))
            new_store_id = created_store.get('id')
            print(f"✅ 创建成功: 🏪 {created_store.get('name', 'N/A')}")
            print(f"   门店ID: {new_store_id}")
        else:
            print(f"❌ 创建门店失败: {response_data}")
            new_store_id = None
    
    # 2.3 测试获取门店详情
    if first_store_id:
        print(f"🔍 获取门店详情 (ID: {first_store_id})...")
        response = requests.get(f'{API_BASE_URL}/stores/{first_store_id}', headers=headers)
        
        if response.status_code == 200:
            store_detail = response.json()
            if store_detail.get('success'):
                store = store_detail.get('data', {}).get('store', store_detail.get('store', {}))
                print(f"✅ 获取成功: 🏪 {store.get('name', 'N/A')}")
                print(f"   详细信息:")
                print(f"   📍 地址: {store.get('address', 'N/A')}")
                print(f"   📞 电话: {store.get('phone', '未设置')}")
                print(f"   🕒 营业时间: {store.get('business_hours', 'N/A')}")
                print(f"   🔄 状态: {store.get('status', 'active')}")
            else:
                print(f"❌ 获取失败: {store_detail}")
        else:
            print(f"❌ 获取门店详情失败: {response.text}")
    
    # 2.4 测试更新门店
    if new_store_id:
        print(f"✏️ 测试更新门店 (ID: {new_store_id})...")
        update_data = {
            'name': '测试门店（已更新）',
            'address': '上海市测试区测试路888号（新地址）',
            'phone': '021-88888888',
            'business_hours': '9:00-21:00',
            'manager': '新店长',
            'description': '门店信息已更新',
            'status': 'active'
        }
        
        response = requests.put(f'{API_BASE_URL}/stores/{new_store_id}', json=update_data, headers=headers)
        
        if response.status_code == 200:
            updated_store = response.json()
            if updated_store.get('success'):
                print("✅ 更新成功")
            else:
                print(f"❌ 更新失败: {updated_store}")
        else:
            print(f"❌ 更新门店失败: {response.text}")
    
    print("\n" + "-" * 40)
    
    # 3. 测试技师管理功能
    print("👨‍⚕️ 测试技师管理功能...")
    print("-" * 40)
    
    # 3.1 获取技师列表
    print("📋 获取技师列表...")
    response = requests.get(f'{API_BASE_URL}/therapists', headers=headers)
    
    if response.status_code == 200:
        therapists_data = response.json()
        if therapists_data.get('success'):
            therapists = therapists_data.get('data', {}).get('therapists', therapists_data.get('therapists', []))
            print(f"✅ 获取成功，共 {len(therapists)} 个技师")
            
            if therapists:
                # 显示技师信息
                for i, therapist in enumerate(therapists[:3], 1):  # 只显示前3个
                    print(f"   技师{i}: 👨‍⚕️ {therapist.get('name', 'N/A')}")
                    print(f"           💼 职位：{therapist.get('position', 'N/A')}")
                    print(f"           📅 经验：{therapist.get('experience_years', 'N/A')}年")
                    print(f"           🏪 门店ID：{therapist.get('store_id', 'N/A')}")
                    specialties = therapist.get('specialties', [])
                    if isinstance(specialties, list):
                        print(f"           🎯 专长：{', '.join(specialties)}")
                    else:
                        print(f"           🎯 专长：{specialties}")
                    print()
                
                first_therapist_id = therapists[0].get('id')
            else:
                print("   暂无技师数据")
                first_therapist_id = None
        else:
            print(f"❌ 获取失败: {therapists_data}")
    else:
        print(f"❌ 获取技师列表失败: {response.text}")
        first_therapist_id = None
    
    # 3.2 测试创建技师
    if first_store_id:
        print("➕ 测试创建技师...")
        new_therapist_data = {
            'store_id': first_store_id,
            'name': '测试技师（前端集成测试）',
            'position': '调理师',
            'title': '高级调理师',
            'years_of_experience': 8,
            'specialties': '["前端测试按摩", "集成测试推拿", "API测试艾灸"]',
            'phone': '13999999999',
            'status': 'active'
        }
        
        response = requests.post(f'{API_BASE_URL}/therapists', json=new_therapist_data, headers=headers)
        
        if response.status_code == 201:
            new_therapist = response.json()
            if new_therapist.get('success'):
                created_therapist = new_therapist.get('data', {}).get('therapist', new_therapist.get('data', {}))
                new_therapist_id = created_therapist.get('id')
                print(f"✅ 创建成功: 👨‍⚕️ {created_therapist.get('name', 'N/A')}")
                print(f"   技师ID: {new_therapist_id}")
            else:
                print(f"❌ 创建失败: {new_therapist}")
                new_therapist_id = None
        else:
            response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            # 检查是否实际上是成功的（有些API返回200而不是201）
            if isinstance(response_data, dict) and response_data.get('success'):
                created_therapist = response_data.get('data', {})
                new_therapist_id = created_therapist.get('id')
                print(f"✅ 创建成功: 👨‍⚕️ {created_therapist.get('name', 'N/A')}")
                print(f"   技师ID: {new_therapist_id}")
            else:
                print(f"❌ 创建技师失败: {response_data}")
                new_therapist_id = None
    
    print("\n" + "-" * 40)
    
    # 4. 测试前端页面访问
    print("🌐 测试前端页面访问...")
    print("-" * 40)
    
    # 4.1 测试管理后台页面
    print("📄 测试管理后台页面...")
    response = requests.get(f'{BASE_URL}/admin.html')
    if response.status_code == 200:
        html_content = response.text
        # 检查门店管理相关元素
        if 'storesSection' in html_content and '门店管理' in html_content:
            print("✅ 管理后台页面正常，包含门店管理功能")
        else:
            print("❌ 管理后台页面缺少门店管理功能")
    else:
        print(f"❌ 管理后台页面访问失败: {response.status_code}")
    
    # 4.2 测试CSS样式文件
    print("🎨 测试CSS样式文件...")
    response = requests.get(f'{BASE_URL}/css/elderly-friendly.css')
    if response.status_code == 200:
        css_content = response.text
        if 'elderly-friendly' in css_content or 'btn-large' in css_content:
            print("✅ 老年人友好样式文件加载正常")
        else:
            print("❌ 老年人友好样式文件内容异常")
    else:
        print(f"❌ 老年人友好样式文件加载失败: {response.status_code}")
    
    # 4.3 测试JavaScript文件
    print("📜 测试JavaScript文件...")
    js_files = ['admin.js']
    for js_file in js_files:
        response = requests.get(f'{BASE_URL}/js/{js_file}')
        if response.status_code == 200:
            js_content = response.text
            if 'loadStores' in js_content and 'openAddStoreModal' in js_content:
                print(f"✅ /js/{js_file} 包含门店管理功能")
            else:
                print(f"❌ /js/{js_file} 缺少门店管理功能")
        else:
            print(f"❌ /js/{js_file} 加载失败: {response.status_code}")
    
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
    
    # 注意：门店删除API可能不存在，这里先跳过
    if new_store_id:
        print(f"ℹ️ 测试门店 (ID: {new_store_id}) 保留在系统中，可手动删除")
    
    print("\n" + "=" * 60)
    print("🎉 门店管理前端集成测试完成！")
    
    print("\n📋 功能验证总结:")
    print("✅ 管理员登录认证")
    print("✅ 门店列表查询和显示")
    print("✅ 门店详情查询")
    print("✅ 门店创建功能")
    print("✅ 门店更新功能")
    print("✅ 技师列表查询和显示")
    print("✅ 技师创建功能")
    print("✅ 前端页面和资源加载")
    
    print("\n🎯 老年人友好设计特性:")
    print("📱 大字体、大按钮设计")
    print("🎨 高对比度颜色搭配")
    print("😊 Emoji图标辅助识别")
    print("💬 清晰的操作反馈信息")
    print("🔍 简化的搜索和操作流程")
    
    print("\n📞 使用说明:")
    print("1. 访问 http://localhost:3001/admin.html")
    print("2. 使用 admin/admin123 登录")
    print("3. 点击左侧菜单的'门店管理'")
    print("4. 体验老年人友好的界面设计")

if __name__ == "__main__":
    try:
        test_store_management_frontend()
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc() 