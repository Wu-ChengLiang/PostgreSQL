#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
会员完整功能流程测试
包括充值、消费、查询等完整流程
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

def test_complete_member_flow():
    """测试完整的会员功能流程"""
    token = get_token()
    if not token:
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    phone = '13800138000'
    
    print("=" * 60)
    print("🧪 会员功能完整流程测试")
    print("=" * 60)
    
    # 1. 查询会员信息
    print("\n1️⃣ 查询会员信息...")
    member_response = requests.get(
        f'{admin_url}/members/phone/{phone}',
        headers=headers
    )
    
    if member_response.status_code == 200:
        member_data = member_response.json()
        member = member_data['member']
        print(f"✅ 会员信息: {member['name']}")
        print(f"   手机号: {member['phone']}")
        print(f"   会员号: {member['membership_number']}")
        print(f"   余额: {member['balance']}")
        print(f"   积分: {member['points']}")
        print(f"   等级: {member['member_level']}")
    else:
        print(f"❌ 查询会员失败: {member_response.status_code}")
        return
    
    # 2. 会员充值
    print("\n2️⃣ 会员充值...")
    recharge_data = {
        'amount': 500.00,
        'payment_method': 'WECHAT',
        'description': '完整流程测试充值'
    }
    
    recharge_response = requests.post(
        f'{admin_url}/members/{phone}/recharge',
        json=recharge_data,
        headers=headers
    )
    
    if recharge_response.status_code == 200:
        recharge_result = recharge_response.json()
        print(f"✅ 充值成功!")
        print(f"   充值金额: {recharge_result.get('amount', 'N/A')}")
        print(f"   原余额: {recharge_result.get('old_balance', 'N/A')}")
        print(f"   新余额: {recharge_result.get('new_balance', 'N/A')}")
    else:
        print(f"❌ 充值失败: {recharge_response.status_code}")
        print(recharge_response.text)
        return
    
    # 3. 会员消费
    print("\n3️⃣ 会员消费...")
    consume_data = {
        'amount': 150.00,
        'description': '完整流程测试消费',
        'service_type': '中医推拿按摩'
    }
    
    consume_response = requests.post(
        f'{admin_url}/members/{phone}/consume',
        json=consume_data,
        headers=headers
    )
    
    if consume_response.status_code == 200:
        consume_result = consume_response.json()
        print(f"✅ 消费成功!")
        print(f"   消费金额: {consume_result.get('amount', 'N/A')}")
        print(f"   原余额: {consume_result.get('old_balance', 'N/A')}")
        print(f"   新余额: {consume_result.get('new_balance', 'N/A')}")
        print(f"   获得积分: {consume_result.get('points_earned', 'N/A')}")
    else:
        print(f"❌ 消费失败: {consume_response.status_code}")
        print(consume_response.text)
        return
    
    # 4. 查询交易记录
    print("\n4️⃣ 查询交易记录...")
    transactions_response = requests.get(
        f'{admin_url}/members/{phone}/transactions',
        headers=headers
    )
    
    if transactions_response.status_code == 200:
        transactions_data = transactions_response.json()
        transactions = transactions_data['transactions']
        print(f"✅ 交易记录查询成功，共 {len(transactions)} 条记录")
        
        # 显示最近3条交易
        for i, tx in enumerate(transactions[:3]):
            print(f"   {i+1}. {tx['transaction_type']} - {tx['amount']}元 ({tx['created_at'][:19]})")
    else:
        print(f"❌ 交易记录查询失败: {transactions_response.status_code}")
    
    # 5. 添加病历记录
    print("\n5️⃣ 添加病历记录...")
    diagnosis_data = {
        'visit_date': '2025-01-15',
        'chief_complaint': '肩颈疼痛，腰部酸胀',
        'tcm_diagnosis': '肝肾不足，气血瘀阻',
        'treatment_plan': '针灸推拿，活血化瘀，补益肝肾',
        'therapist_id': 1
    }
    
    diagnosis_response = requests.post(
        f'{admin_url}/patients/{phone}/diagnosis',
        json=diagnosis_data,
        headers=headers
    )
    
    if diagnosis_response.status_code == 201:
        print("✅ 病历记录添加成功!")
    else:
        print(f"❌ 病历记录添加失败: {diagnosis_response.status_code}")
        print(diagnosis_response.text)
    
    # 6. 查询病历记录
    print("\n6️⃣ 查询病历记录...")
    history_response = requests.get(
        f'{admin_url}/patients/{phone}/history',
        headers=headers
    )
    
    if history_response.status_code == 200:
        history_data = history_response.json()
        records = history_data['records']
        print(f"✅ 病历记录查询成功，共 {len(records)} 条记录")
        
        if records:
            latest = records[0]
            print(f"   最新记录: {latest['tcm_diagnosis']} ({latest['visit_date']})")
    else:
        print(f"❌ 病历记录查询失败: {history_response.status_code}")
    
    # 7. 最终会员状态
    print("\n7️⃣ 最终会员状态...")
    final_member_response = requests.get(
        f'{admin_url}/members/phone/{phone}',
        headers=headers
    )
    
    if final_member_response.status_code == 200:
        final_member_data = final_member_response.json()
        final_member = final_member_data['member']
        print(f"✅ 最终会员状态:")
        print(f"   余额: {final_member['balance']}")
        print(f"   积分: {final_member['points']}")
        print(f"   等级: {final_member['member_level']}")
        print(f"   总消费: {final_member.get('total_spent', 'N/A')}")
    
    print("\n🎉 会员功能完整流程测试完成!")

if __name__ == '__main__':
    test_complete_member_flow() 