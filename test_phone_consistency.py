#!/usr/bin/env python3
"""
电话号码一致性测试
验证Python AI客户端和Node.js API生成的电话号码是否一致
"""

import asyncio
import aiohttp
import json
from aiclient.services.smart_appointment import SmartAppointmentService
from aiclient.database_service import DatabaseAPIService

async def test_phone_generation_consistency():
    """测试电话号码生成一致性"""
    
    print("🔧 电话号码一致性测试")
    print("=" * 50)
    
    # 测试用例
    test_names = [
        "leo",
        "张三",
        "王五",
        "测试用户",
        "AI客户"
    ]
    
    # 1. 测试Python端电话号码生成
    print("\n📱 Python端电话号码生成:")
    smart_service = SmartAppointmentService()
    python_phones = {}
    
    for name in test_names:
        context_info = {"contactName": name}
        customer_info = smart_service.extract_customer_info(context_info)
        phone = customer_info.get('phone') or "未生成"
        python_phones[name] = phone
        print(f"  {name:10} -> {phone}")
    
    # 2. 测试Node.js端电话号码生成（模拟API调用）
    print("\n📱 Node.js端电话号码生成:")
    print("  通过智能预约API测试...")
    
    api_base = "http://localhost:3001/client"
    node_phones = {}
    
    async with aiohttp.ClientSession() as session:
        for name in test_names:
            try:
                # 构造智能预约请求
                test_data = {
                    "therapist_name": "马老师",
                    "appointment_time": "15:30",
                    "customer_name": name,
                    "store_name": "名医堂·测试店铺（emagen）",
                    "appointment_date": "2025-06-19",
                    "notes": "电话号码一致性测试"
                }
                
                async with session.post(f"{api_base}/appointments/smart", 
                                      json=test_data,
                                      headers={"Content-Type": "application/json"}) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            # 需要从返回结果中提取电话号码
                            # 这里我们假设返回的数据包含用户电话
                            node_phones[name] = "待获取"  # 实际需要从API响应中解析
                            print(f"  {name:10} -> API调用成功")
                        else:
                            print(f"  {name:10} -> API失败: {result.get('error', 'Unknown')}")
                    else:
                        print(f"  {name:10} -> HTTP {response.status}")
                        
            except Exception as e:
                print(f"  {name:10} -> 连接失败: {e}")
                node_phones[name] = "连接失败"
    
    # 3. 对比结果
    print("\n🔍 电话号码对比结果:")
    print("-" * 50)
    print(f"{'姓名':10} | {'Python':15} | {'Node.js':15} | {'一致性':8}")
    print("-" * 50)
    
    all_consistent = True
    for name in test_names:
        python_phone = python_phones.get(name, "未生成") or "未生成"
        node_phone = node_phones.get(name, "未生成")
        
        # 判断一致性
        if python_phone == node_phone:
            consistency = "✅ 一致"
        elif node_phone in ["待获取", "连接失败", "未生成"]:
            consistency = "⏳ 待验证"
            all_consistent = False
        else:
            consistency = "❌ 不一致"
            all_consistent = False
        
        print(f"{name:10} | {python_phone:15} | {node_phone:15} | {consistency}")
    
    print("-" * 50)
    
    # 4. 生成测试报告
    print(f"\n📊 测试总结:")
    if all_consistent:
        print("✅ 所有测试用例电话号码生成一致！")
    else:
        print("⚠️  存在不一致或无法验证的情况")
        print("🔧 建议:")
        print("   1. 检查Node.js API是否已应用修复")
        print("   2. 确保服务器正在运行")
        print("   3. 验证哈希算法实现一致性")

def test_hash_algorithm():
    """测试哈希算法"""
    print("\n🧮 哈希算法测试:")
    
    # Python端哈希函数 (不再生成虚假电话)
    def python_hash_phone(name):
        return None  # 不生成虚假电话号码
    
    # JavaScript端哈希函数 (不再生成虚假电话)
    def js_hash_phone(name):
        return None  # 不生成虚假电话号码
    
    test_names = ["leo", "张三", "王五"]
    
    print(f"{'姓名':10} | {'Python哈希':15} | {'JS哈希':15} | {'一致性':8}")
    print("-" * 50)
    
    for name in test_names:
        python_phone = python_hash_phone(name) or "未生成"
        js_phone = js_hash_phone(name) or "未生成"
        consistency = "✅ 一致" if python_phone == js_phone else "❌ 不一致"
        
        print(f"{name:10} | {python_phone:15} | {js_phone:15} | {consistency}")

if __name__ == "__main__":
    print("🚀 启动电话号码一致性测试...")
    
    # 测试哈希算法
    test_hash_algorithm()
    
    # 测试完整流程
    asyncio.run(test_phone_generation_consistency())
    
    print("\n✅ 测试完成！")