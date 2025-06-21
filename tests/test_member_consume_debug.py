#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
会员消费功能调试测试
"""

import requests
import json

# 配置
base_url = 'http://localhost:3001/api/v1'
admin_url = f'{base_url}/admin'

def get_token():
    """获取认证令牌"""
    login_response = requests.post(
        f'{admin_url}/login',
        json={'username': 'admin', 'password': 'admin123'},
        headers={'Content-Type': 'application/json'}
    )
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        return login_data['data']['token']
    else:
        print(f"❌ 登录失败: {login_response.status_code}")
        print(login_response.text)
        return None

def test_member_consume():
    """测试会员消费功能"""
    token = get_token()
    if not token:
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    phone = '13800138000'
    
    # 先查询会员信息
    print("🔍 查询会员信息...")
    member_response = requests.get(
        f'{admin_url}/members/phone/{phone}',
        headers=headers
    )
    
    if member_response.status_code == 200:
        member_data = member_response.json()
        member = member_data['member']
        print(f"✅ 会员信息: {member['name']}, 余额: {member['balance']}")
    else:
        print(f"❌ 查询会员失败: {member_response.status_code}")
        print(member_response.text)
        return
    
    # 测试消费
    print("\n💰 测试会员消费...")
    consume_data = {
        'amount': 50.00,  # 减少消费金额
        'description': 'API调试测试消费',
        'service_type': '中医推拿'
    }
    
    response = requests.post(
        f'{admin_url}/members/{phone}/consume',
        json=consume_data,
        headers=headers
    )
    
    print(f"📊 响应状态码: {response.status_code}")
    print(f"📄 响应内容: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ 消费成功!")
        print(f"   新余额: {data.get('new_balance', 'N/A')}")
        print(f"   获得积分: {data.get('points_earned', 'N/A')}")
    else:
        print("❌ 消费失败")
        try:
            error_data = response.json()
            print(f"   错误信息: {error_data}")
        except:
            print(f"   原始响应: {response.text}")

if __name__ == '__main__':
    print("🧪 会员消费功能调试测试")
    print("=" * 50)
    test_member_consume() 