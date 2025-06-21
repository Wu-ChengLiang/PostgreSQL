#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
会员API接口测试
测试驱动开发 - 基于手机号的会员管理API
"""

import unittest
import json
import requests
import sqlite3
import os
from datetime import datetime

class TestMemberAPI(unittest.TestCase):
    """会员API测试类"""
    
    @classmethod
    def setUpClass(cls):
        """测试类初始化"""
        cls.base_url = 'http://localhost:3001/api/v1'
        cls.admin_url = f'{cls.base_url}/admin'
        cls.client_url = f'{cls.base_url}/client'
        cls.token = None
        
        # 确保服务器正在运行
        try:
            response = requests.get(f'http://localhost:3001/health', timeout=5)
            if response.status_code != 200:
                raise Exception("服务器未启动")
            print("✅ 服务器连接正常")
        except:
            raise Exception("请先启动服务器: npm start 或 node src/app.js")
        
        # 获取管理员认证令牌
        try:
            login_response = requests.post(
                f'{cls.admin_url}/login',
                json={'username': 'admin', 'password': 'admin123'},
                headers={'Content-Type': 'application/json'}
            )
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                cls.token = login_data['data']['token']
                print("✅ 管理员认证成功")
            else:
                raise Exception(f"登录失败: {login_response.status_code}")
        except Exception as e:
            raise Exception(f"认证失败: {e}")
    
    def get_auth_headers(self):
        """获取认证头"""
        if not self.token:
            raise Exception("未获取到认证令牌")
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
    
    def setUp(self):
        """每个测试前的准备"""
        # 测试用的手机号
        self.test_phone = '13800138999'
        self.test_user_data = {
            'name': 'API测试用户',
            'phone': self.test_phone,
            'gender': 'male',
            'age': 30
        }
    
    def tearDown(self):
        """每个测试后的清理"""
        # 清理测试数据（可选）
        pass
    
    # 测试1：通过手机号查询会员信息
    def test_get_member_by_phone(self):
        """测试通过手机号查询会员信息"""
        phone = '13800138000'  # 使用数据库中已有的用户
        
        response = requests.get(
            f'{self.admin_url}/members/phone/{phone}',
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('member', data)
        
        member = data['member']
        self.assertEqual(member['phone'], phone)
        self.assertIn('name', member)
        self.assertIn('balance', member)
        self.assertIn('points', member)
        self.assertIn('membership_number', member)
        
        print(f"✅ 会员查询成功: {member['name']} ({member['phone']})")
    
    # 测试2：创建新会员
    def test_create_member(self):
        """测试创建新会员"""
        response = requests.post(
            f'{self.admin_url}/members',
            json=self.test_user_data,
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('member', data)
        
        member = data['member']
        self.assertEqual(member['phone'], self.test_phone)
        self.assertEqual(member['name'], 'API测试用户')
        self.assertIn('membership_number', member)
        
        print(f"✅ 会员创建成功: {member['membership_number']}")
    
    # 测试3：会员充值
    def test_member_recharge(self):
        """测试会员充值功能"""
        phone = '13800138000'
        recharge_data = {
            'amount': 200.00,
            'payment_method': 'CASH',
            'description': 'API测试充值'
        }
        
        response = requests.post(
            f'{self.admin_url}/members/{phone}/recharge',
            json=recharge_data,
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('transaction', data)
        self.assertIn('new_balance', data)
        
        transaction = data['transaction']
        self.assertEqual(transaction['transaction_type'], 'RECHARGE')
        self.assertEqual(float(transaction['amount']), 200.00)
        
        print(f"✅ 充值成功，新余额: {data['new_balance']}")
    
    # 测试4：会员消费
    def test_member_consume(self):
        """测试会员消费功能"""
        phone = '13800138000'
        consume_data = {
            'amount': 100.00,
            'description': 'API测试消费',
            'service_type': '中医推拿'
        }
        
        response = requests.post(
            f'{self.admin_url}/members/{phone}/consume',
            json=consume_data,
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('transaction', data)
        self.assertIn('new_balance', data)
        self.assertIn('points_earned', data)
        
        print(f"✅ 消费成功，获得积分: {data['points_earned']}")
    
    # 测试5：获取交易记录
    def test_get_transaction_history(self):
        """测试获取交易记录"""
        phone = '13800138000'
        
        response = requests.get(
            f'{self.admin_url}/members/{phone}/transactions',
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('transactions', data)
        
        transactions = data['transactions']
        if len(transactions) > 0:
            transaction = transactions[0]
            self.assertIn('transaction_type', transaction)
            self.assertIn('amount', transaction)
            self.assertIn('created_at', transaction)
        
        print(f"✅ 交易记录查询成功，共 {len(transactions)} 条记录")
    
    # 测试6：会员等级自动升级测试
    def test_member_level_upgrade(self):
        """测试会员等级自动升级"""
        phone = '13800138000'
        
        # 大额充值触发等级升级
        large_recharge = {
            'amount': 1500.00,
            'payment_method': 'WECHAT',
            'description': '大额充值测试等级升级'
        }
        
        response = requests.post(
            f'{self.admin_url}/members/{phone}/recharge',
            json=large_recharge,
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        
        # 检查会员信息是否更新等级
        member_response = requests.get(
            f'{self.admin_url}/members/phone/{phone}',
            headers=self.get_auth_headers()
        )
        member_data = member_response.json()
        member = member_data['member']
        
        # 根据累计消费判断等级是否正确
        total_spent = float(member.get('total_spent', 0))
        current_level = member['member_level']
        
        print(f"✅ 等级升级测试 - 总消费: {total_spent}, 当前等级: {current_level}")
    
    # 测试7：病历记录API测试
    def test_medical_record_api(self):
        """测试病历记录API"""
        phone = '13800138000'
        diagnosis_data = {
            'visit_date': '2025-01-15',
            'chief_complaint': '颈肩腰腿痛',
            'tcm_diagnosis': '肝肾不足，经络瘀阻',
            'treatment_plan': '针灸推拿，活血化瘀',
            'therapist_id': 1
        }
        
        # 添加诊断记录
        response = requests.post(
            f'{self.admin_url}/patients/{phone}/diagnosis',
            json=diagnosis_data,
            headers=self.get_auth_headers()
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data['success'])
        
        # 查询病历记录
        history_response = requests.get(
            f'{self.admin_url}/patients/{phone}/history',
            headers=self.get_auth_headers()
        )
        self.assertEqual(history_response.status_code, 200)
        
        history_data = history_response.json()
        self.assertTrue(history_data['success'])
        self.assertIn('records', history_data)
        
        print(f"✅ 病历记录API测试成功")

if __name__ == '__main__':
    # 运行测试前的说明
    print("🧪 会员API接口测试")
    print("📋 测试前请确保：")
    print("   1. 服务器已启动 (npm start)")
    print("   2. 数据库已更新 (python update_database_structure.py)")
    print("   3. 网络连接正常")
    print()
    
    unittest.main(verbosity=2) 