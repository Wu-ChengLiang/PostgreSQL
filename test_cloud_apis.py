#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://emagen.323424.xyz"

def test_api(name, method, url, data=None, headers=None):
    """测试API并显示结果"""
    print(f"\n{'='*50}")
    print(f"测试: {name}")
    print(f"URL: {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        else:
            print(f"不支持的方法: {method}")
            return
        
        print(f"状态码: {response.status_code}")
        
        try:
            result = response.json()
            print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
            if response.status_code == 200 and result.get('success'):
                print("✅ 测试通过")
            else:
                print("❌ 测试失败")
        except:
            print(f"响应文本: {response.text[:200]}...")
            print("❌ 响应解析失败")
            
    except Exception as e:
        print(f"❌ 请求失败: {str(e)}")

def main():
    print("开始测试云服务器API...")
    
    # 1. 测试技师搜索API
    test_api(
        "技师搜索API",
        "GET",
        f"{BASE_URL}/api/client/therapists/search?page=1&limit=10"
    )
    
    # 2. 测试管理员登录API
    test_api(
        "管理员登录API",
        "POST",
        f"{BASE_URL}/api/admin/login",
        {
            "username": "admin",
            "password": "admin123"
        }
    )
    
    # 3. 测试门店列表API
    test_api(
        "门店列表API",
        "GET",
        f"{BASE_URL}/api/client/stores"
    )
    
    # 4. 如果登录成功，测试需要认证的API
    print("\n" + "="*50)
    print("尝试获取token并测试认证API...")
    
    login_response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": "admin", "password": "admin123"}
    )
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        if login_data.get('success') and login_data.get('data', {}).get('token'):
            token = login_data['data']['token']
            headers = {"Authorization": f"Bearer {token}"}
            
            # 测试管理员技师列表API
            test_api(
                "管理员技师列表API",
                "GET",
                f"{BASE_URL}/api/admin/therapists?page=1&limit=10",
                headers=headers
            )
            
            # 测试统计概览API
            test_api(
                "统计概览API",
                "GET",
                f"{BASE_URL}/api/admin/statistics/overview",
                headers=headers
            )
    
    print("\n" + "="*50)
    print("测试完成!")

if __name__ == "__main__":
    main()