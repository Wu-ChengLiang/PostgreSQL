#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
客户端API测试
验证基本功能和路由是否正常工作
"""

import unittest
import requests
import json

class TestClientAPI(unittest.TestCase):
    """客户端API测试类"""
    
    @classmethod
    def setUpClass(cls):
        """测试类初始化"""
        cls.base_url = 'http://localhost:3001'
        cls.client_url = f'{cls.base_url}/api/v1/client'
        
        # 确保服务器正在运行
        try:
            response = requests.get(f'{cls.base_url}/health', timeout=5)
            if response.status_code != 200:
                raise Exception("服务器未启动")
            print("✅ 服务器连接正常")
        except Exception as e:
            raise Exception(f"请先启动服务器: {e}")
    
    def test_health_check(self):
        """测试健康检查端点"""
        response = requests.get(f'{self.base_url}/health')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('service', data)
        
        print(f"✅ 健康检查成功: {data['service']}")
    
    def test_therapist_search(self):
        """测试技师搜索功能"""
        response = requests.get(f'{self.client_url}/therapists/search')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('data', data)
        
        print(f"✅ 技师搜索API工作正常")
    
    def test_static_file_access(self):
        """测试静态文件访问"""
        response = requests.get(f'{self.base_url}/frontend/index.html')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/html', response.headers.get('content-type', ''))
        
        print(f"✅ 静态文件访问正常")
    
    def test_appointment_creation_validation(self):
        """测试预约创建的参数验证"""
        # 测试缺少必填参数的情况
        response = requests.post(
            f'{self.client_url}/appointments',
            json={},
            headers={'Content-Type': 'application/json'}
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'INVALID_PARAMS')
        
        print(f"✅ 预约参数验证正常工作")
    
    def test_smart_appointment_basic(self):
        """测试智能预约的基本功能"""
        smart_appointment_data = {
            'therapist_name': '测试技师',
            'appointment_time': '10:00',
            'customer_name': '测试客户',
            'appointment_date': '2025-01-20'
        }
        
        response = requests.post(
            f'{self.client_url}/appointments/smart',
            json=smart_appointment_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # 这个可能会失败（技师不存在），但至少API应该能处理请求
        self.assertIn(response.status_code, [200, 400, 404])
        data = response.json()
        
        if response.status_code == 200:
            print(f"✅ 智能预约成功")
        else:
            print(f"⚠️ 智能预约失败但API正常工作: {data.get('error', {}).get('message', '未知错误')}")
    
    def test_api_404_handling(self):
        """测试404错误处理"""
        response = requests.get(f'{self.client_url}/nonexistent-endpoint')
        
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['error']['code'], 'NOT_FOUND')
        
        print(f"✅ 404错误处理正常")

if __name__ == '__main__':
    print("🧪 客户端API基础功能测试")
    print("📋 验证服务器和路由是否正常工作")
    print()
    
    unittest.main(verbosity=2) 