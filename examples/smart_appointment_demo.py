"""
智能预约功能演示脚本
展示如何使用智能预约功能处理自然语言预约请求
"""

import asyncio
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 演示数据
DEMO_CONTEXT_INFO = {
    'shopName': '名医堂·颈肩腰腿特色调理（静安寺店）',
    'contactName': '联系人_1750127546284',
    'combinedName': '名医堂·颈肩腰腿特色调理（静安寺店） - 联系人_1750127546284',
    'chatId': 'chat_联系人_1750127546284'
}

DEMO_CUSTOMER_MESSAGES = [
    "我需要调理师-马老师为我服务，预计16:30到店",
    "预约今天下午3点钟的李老师",
    "想要找张师傅做推拿，时间是17:00",
    "我要预约陈老师，明天上午10点半",
    "需要艾灸服务，找王老师，16点"
]

async def test_smart_appointment_parsing():
    """测试智能预约解析功能"""
    print("=== 智能预约解析测试 ===")
    
    try:
        from aiclient.services.smart_appointment import SmartAppointmentService
        
        # 创建服务实例
        service = SmartAppointmentService()
        
        for i, message in enumerate(DEMO_CUSTOMER_MESSAGES, 1):
            print(f"\n--- 测试 {i}: {message} ---")
            
            # 解析预约请求
            result = await service.parse_appointment_request(
                customer_message=message,
                context_info=DEMO_CONTEXT_INFO
            )
            
            if result["success"]:
                print(f"✅ 解析成功:")
                print(f"   技师姓名: {result.get('therapist_name', 'N/A')}")
                print(f"   预约时间: {result.get('appointment_time', 'N/A')}")
                print(f"   预约日期: {result.get('appointment_date', 'N/A')}")
                print(f"   门店名称: {result.get('store_name', 'N/A')}")
                print(f"   客户姓名: {result.get('customer_name', 'N/A')}")
                print(f"   服务类型: {result.get('service_type', 'N/A')}")
            else:
                print(f"❌ 解析失败: {result.get('error', 'N/A')}")
                
    except Exception as e:
        print(f"❌ 测试失败: {e}")

async def test_smart_appointment_with_mock():
    """使用Mock服务测试完整智能预约流程"""
    print("\n=== 智能预约完整流程测试（Mock服务） ===")
    
    try:
        from aiclient.services.smart_appointment import SmartAppointmentService
        
        # 创建Mock数据库服务
        class MockDatabaseService:
            async def search_therapists(self, store_name=None, therapist_name=None):
                """模拟搜索技师"""
                if therapist_name and "马老师" in therapist_name:
                    return [
                        {
                            "id": 1,
                            "name": "马老师",
                            "store_id": 1,
                            "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
                            "specialties": ["推拿", "按摩"],
                            "experience_years": 8
                        }
                    ]
                return []
            
            async def get_therapist_schedule(self, therapist_id, date):
                """模拟查询技师排班"""
                return {
                    "therapist_id": therapist_id,
                    "date": date,
                    "available_times": ["14:00", "15:00", "16:00", "16:30", "17:00"],
                    "booked_times": ["13:00", "19:00"]
                }
            
            async def create_appointment(self, appointment_data):
                """模拟创建预约"""
                return {
                    "success": True,
                    "data": {
                        "id": 12345,
                        "therapist_id": appointment_data.get("therapist_id"),
                        "user_name": appointment_data.get("user_name"),
                        "user_phone": appointment_data.get("user_phone"),
                        "appointment_date": appointment_data.get("appointment_date"),
                        "appointment_time": appointment_data.get("appointment_time"),
                        "status": "pending"
                    },
                    "message": "预约创建成功"
                }
        
        # 创建Mock邮件服务
        class MockEmailService:
            async def send_appointment_notification_emails(self, email_info):
                """模拟发送预约邮件"""
                return {
                    "success": True,
                    "customer_email_sent": True,
                    "therapist_email_sent": True,
                    "message": "预约邮件发送成功"
                }
        
        # 创建服务实例（使用Mock服务）
        service = SmartAppointmentService(
            database_service=MockDatabaseService(),
            email_service=MockEmailService()
        )
        
        # 测试消息
        test_message = "我需要调理师-马老师为我服务，预计16:30到店"
        
        print(f"测试消息: {test_message}")
        print(f"上下文信息: {DEMO_CONTEXT_INFO}")
        
        # 执行智能预约
        result = await service.create_smart_appointment(
            customer_message=test_message,
            context_info=DEMO_CONTEXT_INFO
        )
        
        print(f"\n预约结果:")
        if result["success"]:
            print(f"✅ 预约创建成功!")
            print(f"   预约ID: {result.get('appointment_id')}")
            print(f"   预约数据: {result.get('appointment_data')}")
            print(f"   邮件发送: {'成功' if result.get('emails_sent') else '失败'}")
            print(f"   消息: {result.get('message')}")
        else:
            print(f"❌ 预约创建失败: {result.get('error')}")
            print(f"   消息: {result.get('message')}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

async def test_function_call_integration():
    """测试Function Call集成"""
    print("\n=== Function Call集成测试 ===")
    
    try:
        from aiclient.adapters.openai_adapter import OpenAIAdapter
        from aiclient.config import ModelConfig
        
        # 创建配置（使用测试配置）
        config = ModelConfig(
            provider="openai",
            model_name="gpt-4",
            api_key="test-key",
            base_url="http://test.com"
        )
        
        # 创建适配器
        adapter = OpenAIAdapter(config)
        
        # 测试Function Call参数
        function_args = {
            "customer_message": "我需要调理师-马老师为我服务，预计16:30到店",
            "context_info": DEMO_CONTEXT_INFO
        }
        
        print(f"Function Call参数:")
        print(f"  函数名: create_smart_appointment")
        print(f"  参数: {function_args}")
        
        # 执行Function Call
        result = await adapter.execute_function_call("create_smart_appointment", function_args)
        
        print(f"\nFunction Call结果:")
        if result.get("success"):
            print(f"✅ Function Call执行成功!")
            print(f"   结果: {result}")
        else:
            print(f"❌ Function Call执行失败: {result.get('error')}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

async def test_base_adapter_tools():
    """测试BaseAdapter工具注册"""
    print("\n=== BaseAdapter工具注册测试 ===")
    
    try:
        from aiclient.adapters.base import BaseAdapter
        from aiclient.config import ModelConfig
        
        # 创建配置
        config = ModelConfig(
            provider="test",
            model_name="test-model",
            api_key="test-key",
            base_url="http://test.com"
        )
        
        # 创建适配器
        adapter = BaseAdapter(config)
        
        # 获取智能预约工具
        smart_tools = adapter.get_smart_appointment_tools()
        
        print(f"智能预约工具数量: {len(smart_tools)}")
        
        for tool in smart_tools:
            function_info = tool["function"]
            print(f"✅ 工具: {function_info['name']}")
            print(f"   描述: {function_info['description']}")
            print(f"   必需参数: {function_info['parameters']['required']}")
        
        # 获取所有工具（包括数据库和邮件工具）
        all_tools = (adapter.get_database_tools() + 
                    adapter.get_email_notification_tools() + 
                    adapter.get_smart_appointment_tools())
        
        print(f"\n所有工具总数: {len(all_tools)}")
        
        # 检查是否包含智能预约工具
        smart_appointment_tool = next(
            (tool for tool in all_tools if tool["function"]["name"] == "create_smart_appointment"), 
            None
        )
        
        if smart_appointment_tool:
            print("✅ 智能预约工具已正确注册")
        else:
            print("❌ 智能预约工具未找到")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

async def main():
    """主函数"""
    print("🚀 智能预约功能演示")
    print("=" * 50)
    
    # 运行所有测试
    await test_smart_appointment_parsing()
    await test_smart_appointment_with_mock()
    await test_function_call_integration()
    await test_base_adapter_tools()
    
    print("\n🎉 演示完成！")

if __name__ == "__main__":
    asyncio.run(main()) 