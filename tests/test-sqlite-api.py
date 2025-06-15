#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3002/api"

def test_api(name, method, endpoint, data=None):
    """测试API端点"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        elif method == "DELETE":
            response = requests.delete(url)
        
        print(f"\n=== {name} ===")
        print(f"{method} {endpoint}")
        print(f"状态码: {response.status_code}")
        
        # 尝试解析JSON
        try:
            result = response.json()
            print(f"响应: {json.dumps(result, ensure_ascii=False, indent=2)}")
        except:
            print(f"响应: {response.text}")
            
        return response
        
    except Exception as e:
        print(f"\n=== {name} ===")
        print(f"错误: {str(e)}")
        return None

def main():
    print("🚀 开始测试SQLite数据库API")
    
    # 1. 测试健康检查
    test_api("健康检查", "GET", "/health")
    
    # 2. 测试门店API
    test_api("获取所有门店", "GET", "/stores")
    test_api("获取单个门店", "GET", "/stores/1")
    
    # 3. 测试技师API
    test_api("获取所有技师", "GET", "/therapists")
    test_api("按名称搜索技师", "GET", "/therapists/search?name=陈")
    test_api("按服务类型搜索技师", "GET", "/therapists/search?service_type=推拿")
    test_api("按门店搜索技师", "GET", "/therapists/search?store=莘庄")
    
    # 4. 测试技师可用时间
    import datetime
    tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
    test_api("获取技师可用时间", "GET", f"/therapists/1/availability?date={tomorrow}")
    
    # 5. 测试用户注册和登录
    import time
    timestamp = int(time.time())
    
    # 注册新用户
    register_data = {
        "username": f"testuser_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "phone": "13800138000",
        "password": "password123"
    }
    register_response = test_api("用户注册", "POST", "/users/register", register_data)
    
    # 登录
    if register_response and register_response.status_code == 201:
        login_data = {
            "username": register_data["username"],
            "password": register_data["password"]
        }
        login_response = test_api("用户登录", "POST", "/users/login", login_data)
        
        # 获取用户ID
        if login_response and login_response.status_code == 200:
            user_id = login_response.json()["user"]["id"]
            
            # 6. 测试预约创建
            appointment_data = {
                "user_id": user_id,
                "therapist_id": 1,
                "store_id": 1,
                "service_type": "推拿",
                "appointment_date": tomorrow,
                "start_time": "14:00",
                "end_time": "15:00",
                "notes": "测试预约"
            }
            appointment_response = test_api("创建预约", "POST", "/appointments", appointment_data)
            
            if appointment_response and appointment_response.status_code == 201:
                appointment_id = appointment_response.json()["appointment"]["id"]
                
                # 7. 测试预约查询
                test_api("获取预约详情", "GET", f"/appointments/{appointment_id}")
                test_api("获取用户预约", "GET", f"/appointments/user/{user_id}")
                
                # 8. 测试预约状态更新
                test_api("确认预约", "PUT", f"/appointments/{appointment_id}/status", {"status": "confirmed"})
                
                # 9. 测试取消预约
                test_api("取消预约", "DELETE", f"/appointments/{appointment_id}")
    
    # 10. 测试统计数据
    test_api("获取仪表板统计", "GET", "/dashboard/stats")
    
    # 11. 测试公开预约接口
    public_appointment_data = {
        "username": "test_user",  # 使用初始数据中的用户
        "therapist_id": 2,
        "appointment_date": tomorrow,
        "start_time": "16:00",
        "end_time": "17:00",
        "service_type": "艾灸",
        "notes": "公开预约测试"
    }
    test_api("公开创建预约", "POST", "/appointments/public/create", public_appointment_data)
    
    print("\n✅ 测试完成！")

if __name__ == "__main__":
    main()