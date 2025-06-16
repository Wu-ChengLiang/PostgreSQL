#!/usr/bin/env python3
import requests
import json
import time

# 测试配置
BASE_URL = "http://emagen.323424.xyz"
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "details": []
}

def test_api(name, method, path, data=None, headers=None):
    """测试API并记录结果"""
    test_results["total"] += 1
    print(f"\n{'='*50}")
    print(f"测试: {name}")
    print(f"URL: {BASE_URL}{path}")
    
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{path}", json=data, headers=headers, timeout=10)
        else:
            print(f"不支持的方法: {method}")
            return None
        
        print(f"状态码: {response.status_code}")
        
        # 解析响应
        try:
            result = response.json()
            print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)[:200]}...")
            
            if response.status_code == 200:
                test_results["passed"] += 1
                test_results["details"].append({"name": name, "status": "PASS"})
                print("✅ 测试通过")
                return result
            else:
                test_results["failed"] += 1
                test_results["details"].append({"name": name, "status": "FAIL", "reason": f"状态码 {response.status_code}"})
                print("❌ 测试失败")
        except:
            print(f"响应文本: {response.text[:200]}...")
            if response.status_code == 200:
                test_results["passed"] += 1
                test_results["details"].append({"name": name, "status": "PASS"})
                print("✅ 测试通过（非JSON响应）")
            else:
                test_results["failed"] += 1
                test_results["details"].append({"name": name, "status": "FAIL", "reason": "响应解析失败"})
                print("❌ 响应解析失败")
            
    except Exception as e:
        test_results["failed"] += 1
        test_results["details"].append({"name": name, "status": "FAIL", "reason": str(e)})
        print(f"❌ 请求失败: {str(e)}")

def run_all_tests():
    """运行所有测试"""
    print("=== 名医堂3.0云端测试 ===")
    print(f"目标服务器: {BASE_URL}")
    print(f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. 前端页面测试
    test_api("前端首页", "GET", "/")
    test_api("管理后台页面", "GET", "/admin.html")
    
    # 2. 健康检查
    test_api("健康检查API", "GET", "/health")
    
    # 3. 客户端API测试
    test_api("获取门店列表", "GET", "/api/client/stores")
    test_api("搜索技师", "GET", "/api/client/therapists/search?limit=5")
    
    # 4. 测试新的实验性API
    store_name = "名医堂·颈肩腰腿特色调理（宜山路店）"
    test_api(
        "门店技师预约时间查询（新API）",
        "GET",
        f"/api/client/stores/{store_name}/therapists-schedule"
    )
    
    # 5. 管理员登录测试
    login_result = test_api(
        "管理员登录",
        "POST",
        "/api/admin/login",
        {"username": "admin", "password": "admin123"}
    )
    
    # 6. 如果登录成功，测试管理员API
    if login_result and login_result.get("success") and login_result["data"].get("token"):
        token = login_result["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        test_api("获取技师列表（管理员）", "GET", "/api/admin/therapists?limit=5", headers=headers)
        test_api("获取统计概览", "GET", "/api/admin/statistics/overview", headers=headers)
    
    # 打印测试报告
    print(f"\n{'='*50}")
    print("=== 测试报告 ===")
    print(f"总测试数: {test_results['total']}")
    print(f"通过: {test_results['passed']}")
    print(f"失败: {test_results['failed']}")
    print(f"通过率: {(test_results['passed'] / test_results['total'] * 100):.2f}%")
    
    if test_results['failed'] > 0:
        print("\n失败的测试:")
        for test in test_results['details']:
            if test['status'] == 'FAIL':
                print(f"- {test['name']}: {test.get('reason', '未知原因')}")
    
    # 总结
    print(f"\n{'='*50}")
    if test_results['failed'] == 0:
        print("✅ 所有测试通过！3.0版本部署成功！")
    else:
        print("⚠️  部分测试失败，请检查服务器配置。")

if __name__ == "__main__":
    run_all_tests()