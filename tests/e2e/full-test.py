#!/usr/bin/env python3
"""
端到端集成测试
测试完整的前后端系统集成
"""

import requests
import json
import time
from datetime import datetime, timedelta

# 配置
BACKEND_URL = "http://localhost:3002/api"
FRONTEND_URL = "http://localhost:3001"

# 测试数据
TEST_USER = {
    "username": f"e2e_test_{int(time.time())}",
    "email": f"e2e_test_{int(time.time())}@example.com",
    "phone": "13900139000",
    "password": "Test123456!"
}

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def add_pass(self):
        self.passed += 1
    
    def add_fail(self, error):
        self.failed += 1
        self.errors.append(error)
    
    def print_summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*50}")
        print(f"测试完成: 总计 {total} 项")
        print(f"✅ 通过: {self.passed}")
        print(f"❌ 失败: {self.failed}")
        
        if self.errors:
            print(f"\n错误详情:")
            for i, error in enumerate(self.errors, 1):
                print(f"{i}. {error}")
        
        print(f"{'='*50}\n")
        return self.failed == 0

result = TestResult()

def test(name, func):
    """运行单个测试"""
    print(f"\n🧪 {name}...", end='', flush=True)
    try:
        func()
        print(" ✅")
        result.add_pass()
    except Exception as e:
        print(f" ❌ {str(e)}")
        result.add_fail(f"{name}: {str(e)}")

def test_backend_health():
    """测试后端健康状态"""
    response = requests.get(f"{BACKEND_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ok'
    assert data['database'] == 'connected'
    assert data['type'] == 'SQLite'

def test_frontend_health():
    """测试前端是否可访问"""
    response = requests.get(FRONTEND_URL)
    assert response.status_code == 200
    # 检查中文内容
    assert '控制台' in response.text or '中医理疗预约管理系统' in response.text

def test_api_stores():
    """测试门店API"""
    response = requests.get(f"{BACKEND_URL}/stores")
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert len(data['stores']) > 0
    # 检查任意一个门店名称包含中文
    assert any('莘庄' in store['name'] or '中医' in store['name'] for store in data['stores'])

def test_api_therapists():
    """测试技师API"""
    response = requests.get(f"{BACKEND_URL}/therapists")
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert len(data['therapists']) > 0

def test_therapist_search():
    """测试技师搜索功能"""
    # 按名称搜索
    response = requests.get(f"{BACKEND_URL}/therapists/search?name=陈")
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert len(data['therapists']) > 0
    assert '陈' in data['therapists'][0]['name']
    
    # 按服务类型搜索
    response = requests.get(f"{BACKEND_URL}/therapists/search?service_type=推拿")
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert len(data['therapists']) > 0

def test_user_registration_login():
    """测试用户注册和登录"""
    # 注册
    response = requests.post(f"{BACKEND_URL}/users/register", json=TEST_USER)
    assert response.status_code == 201
    data = response.json()
    assert data['success'] == True
    assert data['user']['username'] == TEST_USER['username']
    assert 'token' in data
    
    # 登录
    login_data = {
        "username": TEST_USER['username'],
        "password": TEST_USER['password']
    }
    response = requests.post(f"{BACKEND_URL}/users/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert 'token' in data
    
    return data['user']['id'], data['token']

def test_appointment_flow(user_id, token):
    """测试完整的预约流程"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # 1. 获取技师可用时间
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    response = requests.get(f"{BACKEND_URL}/therapists/1/availability?date={tomorrow}")
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert len(data['available_slots']) > 0
    
    # 2. 创建预约
    appointment_data = {
        "user_id": user_id,
        "therapist_id": 1,
        "store_id": 1,
        "service_type": "推拿",
        "appointment_date": tomorrow,
        "start_time": "15:00",
        "end_time": "16:00",
        "notes": "端到端测试预约"
    }
    response = requests.post(f"{BACKEND_URL}/appointments", json=appointment_data, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data['success'] == True
    appointment_id = data['appointment']['id']
    
    # 3. 查询预约
    response = requests.get(f"{BACKEND_URL}/appointments/{appointment_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert data['appointment']['id'] == appointment_id
    
    # 4. 更新预约状态
    response = requests.put(
        f"{BACKEND_URL}/appointments/{appointment_id}/status",
        json={"status": "confirmed"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert data['appointment']['status'] == 'confirmed'
    
    # 5. 取消预约
    response = requests.delete(f"{BACKEND_URL}/appointments/{appointment_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True

def test_dashboard_stats():
    """测试仪表板统计API"""
    response = requests.get(f"{BACKEND_URL}/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert 'total_stores' in data['stats']
    assert 'total_therapists' in data['stats']
    assert 'total_users' in data['stats']
    assert 'total_appointments' in data['stats']
    assert data['stats']['total_stores'] == 5
    assert data['stats']['total_therapists'] == 13

def test_public_appointment():
    """测试公开预约接口"""
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    # 先创建一个测试用户
    test_user_data = {
        "username": f"public_test_{int(time.time())}",
        "email": f"public_test_{int(time.time())}@example.com",
        "phone": "13800138001",
        "password": "Test123!"
    }
    user_response = requests.post(f"{BACKEND_URL}/users/register", json=test_user_data)
    assert user_response.status_code == 201
    
    # 使用新创建的用户进行公开预约
    appointment_data = {
        "username": test_user_data["username"],
        "therapist_id": 3,
        "appointment_date": tomorrow,
        "start_time": "19:00",
        "end_time": "20:00",
        "service_type": "艾灸",
        "notes": "公开预约测试"
    }
    response = requests.post(f"{BACKEND_URL}/appointments/public/create", json=appointment_data)
    assert response.status_code == 201
    data = response.json()
    assert data['success'] == True
    assert data['message'] == '预约创建成功'

def test_data_persistence():
    """测试数据持久性"""
    # 创建一个门店
    store_data = {
        "name": f"测试门店_{int(time.time())}",
        "address": "测试地址123号",
        "phone": "021-88888888",
        "business_hours": "09:00-21:00"
    }
    response = requests.post(f"{BACKEND_URL}/stores", json=store_data)
    assert response.status_code == 201
    data = response.json()
    store_id = data['store']['id']
    
    # 查询刚创建的门店
    response = requests.get(f"{BACKEND_URL}/stores/{store_id}")
    assert response.status_code == 200
    data = response.json()
    assert data['store']['name'] == store_data['name']
    
    # 更新门店信息
    update_data = {"phone": "021-99999999"}
    response = requests.put(f"{BACKEND_URL}/stores/{store_id}", json=update_data)
    assert response.status_code == 200
    
    # 验证更新
    response = requests.get(f"{BACKEND_URL}/stores/{store_id}")
    assert response.status_code == 200
    data = response.json()
    assert data['store']['phone'] == update_data['phone']
    
    # 删除门店
    response = requests.delete(f"{BACKEND_URL}/stores/{store_id}")
    assert response.status_code == 200

def test_chinese_localization():
    """测试中文本地化"""
    # 这个测试需要前端运行并能返回中文内容
    # 由于是API测试，我们主要测试API返回的中文数据
    response = requests.get(f"{BACKEND_URL}/stores")
    assert response.status_code == 200
    data = response.json()
    # 验证返回的数据包含中文
    assert any('中医' in store['name'] or '理疗' in store['name'] for store in data['stores'])

def main():
    print("🚀 开始端到端集成测试")
    print(f"后端地址: {BACKEND_URL}")
    print(f"前端地址: {FRONTEND_URL}")
    
    # 基础健康检查
    test("后端健康检查", test_backend_health)
    test("前端健康检查", test_frontend_health)
    
    # API功能测试
    test("门店API测试", test_api_stores)
    test("技师API测试", test_api_therapists)
    test("技师搜索功能", test_therapist_search)
    
    # 用户和预约流程
    print("\n📝 测试用户注册和预约流程...")
    user_id = None
    token = None
    
    def user_flow():
        nonlocal user_id, token
        user_id, token = test_user_registration_login()
    
    test("用户注册登录", user_flow)
    
    if user_id and token:
        test("完整预约流程", lambda: test_appointment_flow(user_id, token))
    
    # 其他功能测试
    test("仪表板统计", test_dashboard_stats)
    test("公开预约接口", test_public_appointment)
    test("数据持久性", test_data_persistence)
    test("中文本地化", test_chinese_localization)
    
    # 打印测试结果
    success = result.print_summary()
    
    if success:
        print("🎉 所有测试通过！系统运行正常。")
        print("\n📋 系统功能清单：")
        print("✅ SQLite真实数据库支持")
        print("✅ 完整的CRUD操作")
        print("✅ 用户认证系统")
        print("✅ 预约管理流程")
        print("✅ 技师搜索功能")
        print("✅ 数据持久化")
        print("✅ 中文本地化")
        print("✅ RESTful API设计")
        print("✅ 前后端分离架构")
    else:
        print("❌ 测试失败，请检查错误信息。")
        exit(1)

if __name__ == "__main__":
    main()