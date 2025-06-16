#!/usr/bin/env python3
import requests
import json

# 服务器配置
DOMAIN = "http://emagen.323424.xyz"
API_BASE = f"{DOMAIN}/api/v1"

# 测试计数
total_tests = 0
passed_tests = 0

def test_api(name, method, url, data=None, headers=None):
    """测试单个API"""
    global total_tests, passed_tests
    total_tests += 1
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        if response.status_code in [200, 201]:
            passed_tests += 1
            print(f"✅ {name}: 成功 (状态码: {response.status_code})")
            return response.json()
        else:
            print(f"❌ {name}: 失败 (状态码: {response.status_code})")
            print(f"   响应: {response.text}")
            return None
    except Exception as e:
        print(f"❌ {name}: 错误 - {str(e)}")
        return None

def test_frontend():
    """测试前端页面"""
    print("\n📄 测试前端页面...")
    
    pages = [
        ("首页", f"{DOMAIN}/"),
        ("管理后台", f"{DOMAIN}/admin.html")
    ]
    
    for name, url in pages:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"✅ {name}: 可访问")
            else:
                print(f"❌ {name}: 状态码 {response.status_code}")
        except Exception as e:
            print(f"❌ {name}: 错误 - {str(e)}")

def main():
    print("🚀 开始测试云服务器API...")
    print(f"🌐 服务器地址: {DOMAIN}")
    
    # 1. 测试客户端API
    print("\n=== 客户端API测试 ===")
    
    # 获取门店列表
    stores = test_api("获取门店列表", "GET", f"{API_BASE}/client/stores")
    
    # 获取技师列表
    therapists = test_api("获取技师列表", "GET", f"{API_BASE}/client/therapists/search")
    
    # 2. 测试管理端API
    print("\n=== 管理端API测试 ===")
    
    # 管理员登录
    login_data = {"username": "admin", "password": "admin123"}
    login_result = test_api("管理员登录", "POST", f"{API_BASE}/admin/login", login_data)
    
    if login_result and login_result.get("success"):
        token = login_result["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 创建测试门店
        store_data = {
            "name": "测试门店",
            "address": "测试地址123号",
            "phone": "13800138000",
            "business_hours": "9:00-21:00",
            "description": "这是一个测试门店"
        }
        store_result = test_api("创建门店", "POST", f"{API_BASE}/admin/stores", store_data, headers)
        
        if store_result and store_result.get("success"):
            store_id = store_result["data"]["id"]
            
            # 创建测试技师
            therapist_data = {
                "store_id": store_id,
                "name": "测试技师",
                "position": "推拿师",
                "years_of_experience": 5,
                "specialties": ["按摩", "推拿"],
                "phone": "13900139000"
            }
            therapist_result = test_api("创建技师", "POST", f"{API_BASE}/admin/therapists", therapist_data, headers)
        
        # 获取统计数据
        test_api("获取统计概览", "GET", f"{API_BASE}/admin/statistics/overview", headers=headers)
    
    # 3. 测试前端页面
    test_frontend()
    
    # 显示测试结果
    print(f"\n=== 测试结果 ===")
    print(f"总测试数: {total_tests}")
    print(f"通过: {passed_tests}")
    print(f"失败: {total_tests - passed_tests}")
    print(f"成功率: {(passed_tests/total_tests*100):.2f}%")

if __name__ == "__main__":
    main()