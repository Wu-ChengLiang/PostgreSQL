#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

# 测试配置
BASE_URL = 'http://localhost:3001'
API_BASE_URL = f'{BASE_URL}/api/v1/admin'

def test_debug():
    """调试测试"""
    print("🔍 调试测试...")
    
    # 测试登录
    print("🔐 测试登录...")
    try:
        login_response = requests.post(f'{API_BASE_URL}/login', json={
            'username': 'admin',
            'password': 'admin123'
        })
        print(f"登录响应状态: {login_response.status_code}")
        print(f"登录响应内容: {login_response.text}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data.get('token') or login_data.get('data', {}).get('token')
            if token:
                print(f"✅ 获取到token: {token[:20]}...")
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # 测试预约API
                print("📅 测试预约API...")
                appointments_response = requests.get(f'{BASE_URL}/api/appointments', headers=headers)
                print(f"预约API响应状态: {appointments_response.status_code}")
                print(f"预约API响应内容: {appointments_response.text[:200]}...")
                
            else:
                print(f"❌ 未找到token")
        else:
            print(f"❌ 登录失败")
    except Exception as e:
        print(f"❌ 请求异常: {e}")

if __name__ == "__main__":
    test_debug() 