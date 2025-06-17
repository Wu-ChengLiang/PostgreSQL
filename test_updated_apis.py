#!/usr/bin/env python3
"""
测试更新后的数据库API服务
验证所有API端点是否正常工作
"""

import asyncio
import logging
from datetime import datetime, timedelta
from aiclient.database_service import DatabaseAPIService
from aiclient.adapters.openai_adapter import OpenAIAdapter
from aiclient.config import ModelConfig

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

async def test_database_apis():
    """测试数据库API服务"""
    print("🚀 开始测试更新后的数据库API服务")
    print("=" * 50)
    
    # 初始化数据库服务
    db_service = DatabaseAPIService()
    
    try:
        # 1. 测试获取门店列表
        print("📍 测试获取门店列表...")
        stores = await db_service.get_stores()
        print(f"✅ 获取到 {len(stores)} 个门店")
        if stores:
            test_store = stores[0]
            print(f"   示例门店: {test_store.get('name', 'N/A')} (ID: {test_store.get('id', 'N/A')})")
        
        # 2. 测试搜索技师
        print("👨‍⚕️ 测试搜索技师...")
        therapists = await db_service.search_therapists()
        print(f"✅ 搜索到 {len(therapists)} 个技师")
        if therapists:
            test_therapist = therapists[0] 
            print(f"   示例技师: {test_therapist.get('name', 'N/A')} (ID: {test_therapist.get('id', 'N/A')})")
            
            # 3. 测试获取技师排班
            print("📅 测试获取技师排班...")
            today = datetime.now().strftime('%Y-%m-%d')
            schedule = await db_service.get_therapist_schedule(test_therapist['id'], today)
            print(f"✅ 获取技师排班成功")
            print(f"   可用时间段: {len(schedule.get('available_times', []))} 个")
        
        # 4. 测试创建预约 (使用智能预约API)
        print("🎯 测试智能预约API...")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        smart_appointment_data = {
            "therapist_name": "马老师",
            "appointment_time": "16:30", 
            "appointment_date": tomorrow,
            "customer_name": "测试用户",
            "notes": "API测试预约"
        }
        
        smart_result = await db_service.create_smart_appointment(smart_appointment_data)
        if smart_result.get('success'):
            print(f"✅ 智能预约创建成功: {smart_result.get('data', {})}")
        else:
            print(f"❌ 智能预约创建失败: {smart_result.get('error', 'Unknown error')}")
        
        # 5. 测试查询用户预约
        print("📋 测试查询用户预约...")
        user_appointments = await db_service.get_user_appointments("13900139000")
        print(f"✅ 查询到 {len(user_appointments)} 个用户预约")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await db_service.close()
    
    print("=" * 50)
    print("🎉 数据库API测试完成!")

async def test_function_calls():
    """测试函数调用功能"""
    print("\n🔧 开始测试函数调用功能")
    print("=" * 50)
    
    # 创建模拟的配置
    config = ModelConfig(
        provider="openai",
        model_name="gpt-3.5-turbo",
        api_key="test-key",
        base_url="http://localhost:8000",
        max_tokens=1000,
        temperature=0.7
    )
    
    adapter = OpenAIAdapter(config)
    
    try:
        # 测试获取门店
        print("🏪 测试get_stores函数...")
        result = await adapter.execute_function_call("get_stores", {})
        if result.get('success'):
            print(f"✅ 获取门店成功: {len(result.get('data', []))} 个门店")
        else:
            print(f"❌ 获取门店失败: {result.get('error', 'Unknown error')}")
        
        # 测试搜索技师
        print("👨‍⚕️ 测试search_therapists函数...")
        result = await adapter.execute_function_call("search_therapists", {})
        if result.get('success'):
            print(f"✅ 搜索技师成功: {len(result.get('data', []))} 个技师")
            
            # 如果有技师，测试获取排班
            if result.get('data'):
                therapist_id = result['data'][0]['id']
                today = datetime.now().strftime('%Y-%m-%d')
                
                print("📅 测试get_therapist_schedule函数...")
                schedule_result = await adapter.execute_function_call(
                    "get_therapist_schedule", 
                    {"therapist_id": therapist_id, "date": today}
                )
                if schedule_result.get('success'):
                    print(f"✅ 获取技师排班成功")
                else:
                    print(f"❌ 获取技师排班失败: {schedule_result.get('error', 'Unknown error')}")
        else:
            print(f"❌ 搜索技师失败: {result.get('error', 'Unknown error')}")
        
        # 测试智能预约
        print("🎯 测试create_smart_appointment函数...")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        smart_result = await adapter.execute_function_call(
            "create_smart_appointment",
            {
                "therapist_name": "马老师",
                "appointment_time": "14:30",
                "appointment_date": tomorrow,
                "customer_name": "函数测试用户",
                "notes": "函数调用测试"
            }
        )
        if smart_result.get('success'):
            print(f"✅ 智能预约函数调用成功")
        else:
            print(f"❌ 智能预约函数调用失败: {smart_result.get('error', 'Unknown error')}")
        
    except Exception as e:
        print(f"❌ 函数调用测试失败: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 50)
    print("🎉 函数调用测试完成!")

async def main():
    """主函数"""
    await test_database_apis()
    await test_function_calls()

if __name__ == "__main__":
    asyncio.run(main()) 