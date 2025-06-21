#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
前端集成测试
测试会员和病历管理的前端后端集成功能
"""

import requests
import json
import time

# 测试配置
BASE_URL = 'http://localhost:3001'
API_BASE_URL = f'{BASE_URL}/api/v1/admin'

def test_admin_login():
    """测试管理员登录"""
    print("🔐 测试管理员登录...")
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    response = requests.post(f'{API_BASE_URL}/login', json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            token = data['data']['token']
            print(f"✅ 登录成功，获取到token: {token[:20]}...")
            return token
        else:
            print(f"❌ 登录失败: {data.get('error', {}).get('message', '未知错误')}")
    else:
        print(f"❌ 登录请求失败，状态码: {response.status_code}")
    
    return None

def test_member_apis(token):
    """测试会员相关API"""
    print("\n👥 测试会员管理API...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 测试查询已存在的会员（张三）
    print("🔍 查询会员：13800138000")
    response = requests.get(f'{API_BASE_URL}/members/phone/13800138000', headers=headers)
    
    if response.status_code == 200:
        member_data = response.json()
        print(f"✅ 查询成功: {member_data['member']['name']} - 余额: ¥{member_data['member']['balance']}")
        
        # 测试充值
        print("💰 测试充值功能...")
        recharge_data = {
            'amount': 100,
            'payment_method': 'CASH',
            'description': '前端测试充值'
        }
        
        response = requests.post(f'{API_BASE_URL}/members/13800138000/recharge', 
                               json=recharge_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 充值成功，新余额: ¥{result['new_balance']}")
        else:
            print(f"❌ 充值失败: {response.text}")
        
        # 测试消费
        print("🛒 测试消费功能...")
        consume_data = {
            'amount': 50,
            'service_type': '中医推拿',
            'description': '前端测试消费'
        }
        
        response = requests.post(f'{API_BASE_URL}/members/13800138000/consume', 
                               json=consume_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            amount = result.get('amount') or result['transaction']['amount']
            points_earned = result.get('points_earned', 0)
            print(f"✅ 消费成功，扣费: ¥{amount}，获得积分: {points_earned}")
        else:
            print(f"❌ 消费失败: {response.text}")
        
        # 测试交易记录
        print("📋 测试交易记录...")
        response = requests.get(f'{API_BASE_URL}/members/13800138000/transactions', headers=headers)
        
        if response.status_code == 200:
            transactions = response.json()
            print(f"✅ 获取交易记录成功，共 {len(transactions['transactions'])} 条记录")
        else:
            print(f"❌ 获取交易记录失败: {response.text}")
            
    else:
        print(f"❌ 查询会员失败，状态码: {response.status_code}")

def test_medical_apis(token):
    """测试病历相关API"""
    print("\n🏥 测试病历管理API...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # 测试查询患者信息
    print("🔍 查询患者：13800138000")
    response = requests.get(f'{API_BASE_URL}/patients/phone/13800138000', headers=headers)
    
    if response.status_code == 200:
        patient_data = response.json()
        print(f"✅ 查询患者成功: {patient_data['patient']['name']} - 病历号: {patient_data['patient']['medical_record_number']}")
        
        # 测试添加病历
        print("📝 测试添加病历...")
        diagnosis_data = {
            'patient_phone': '13800138000',
            'visit_date': '2025-01-22',
            'chief_complaint': '前端测试 - 颈肩酸痛，持续一周',
            'tcm_diagnosis': '前端测试 - 颈肩综合征，气血瘀滞',
            'treatment_plan': '前端测试 - 推拿按摩，活血化瘀，每日一次，连续7天',
            'notes': '前端集成测试记录'
        }
        
        response = requests.post(f'{API_BASE_URL}/patients/13800138000/diagnosis', 
                               json=diagnosis_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ 添加病历成功，病历ID: {result['diagnosis']['id']}")
        else:
            print(f"❌ 添加病历失败: {response.text}")
        
        # 测试查询病历历史
        print("📋 测试病历历史...")
        response = requests.get(f'{API_BASE_URL}/patients/13800138000/history', headers=headers)
        
        if response.status_code == 200:
            history = response.json()
            records = history.get('records', [])
            print(f"✅ 获取病历历史成功，共 {len(records)} 条记录")
            if records:
                latest = records[0]
                print(f"   最新记录: {latest['visit_date']} - {latest['chief_complaint'][:30]}...")
        else:
            print(f"❌ 获取病历历史失败: {response.text}")
            
    else:
        print(f"❌ 查询患者失败，状态码: {response.status_code}")

def test_frontend_pages():
    """测试前端页面访问"""
    print("\n🌐 测试前端页面访问...")
    
    # 测试管理后台页面
    print("📄 测试管理后台页面...")
    response = requests.get(f'{BASE_URL}/admin.html')
    
    if response.status_code == 200:
        content = response.text
        if '会员管理' in content and '病历管理' in content:
            print("✅ 管理后台页面正常，包含会员和病历管理菜单")
        else:
            print("⚠️  管理后台页面可访问，但可能缺少新功能")
    else:
        print(f"❌ 管理后台页面访问失败，状态码: {response.status_code}")
    
    # 测试CSS文件
    print("🎨 测试CSS样式文件...")
    response = requests.get(f'{BASE_URL}/css/elderly-friendly.css')
    
    if response.status_code == 200:
        print("✅ 老年人友好样式文件加载正常")
    else:
        print(f"❌ 样式文件加载失败，状态码: {response.status_code}")
    
    # 测试JavaScript文件
    print("📜 测试JavaScript文件...")
    js_files = [
        '/js/member-management.js',
        '/js/medical-management.js'
    ]
    
    for js_file in js_files:
        response = requests.get(f'{BASE_URL}{js_file}')
        if response.status_code == 200:
            print(f"✅ {js_file} 加载正常")
        else:
            print(f"❌ {js_file} 加载失败，状态码: {response.status_code}")

def main():
    """主测试函数"""
    print("🚀 开始前端集成测试...")
    print("=" * 60)
    
    # 测试管理员登录
    token = test_admin_login()
    
    if not token:
        print("❌ 无法获取认证令牌，测试终止")
        return
    
    # 测试会员管理API
    test_member_apis(token)
    
    # 测试病历管理API  
    test_medical_apis(token)
    
    # 测试前端页面
    test_frontend_pages()
    
    print("\n" + "=" * 60)
    print("🎉 前端集成测试完成！")
    print("\n📋 使用说明:")
    print("1. 访问 http://localhost:3000/admin.html")
    print("2. 使用 admin/admin123 登录")
    print("3. 点击左侧菜单的'会员管理'或'病历管理'")
    print("4. 测试手机号: 13800138000 (张三)")
    print("5. 界面设计适合老年人使用：大字体、大按钮、高对比度")

if __name__ == '__main__':
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器，请确保服务器已启动")
        print("   启动命令: node src/app.js")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}") 