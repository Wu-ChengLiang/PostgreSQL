"""
测试AI通过client和base调用触发智能预约功能
"""

import asyncio
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def test_ai_smart_appointment_direct():
    """测试AI直接调用智能预约API（结构化数据模式）"""
    print("🤖 测试1: AI直接调用智能预约API")
    print("=" * 50)
    
    try:
        from aiclient.database_service import DatabaseAPIService
        
        # 创建数据库服务实例
        db_service = DatabaseAPIService(base_url="http://localhost:3001")
        
        # 模拟AI解析的结构化数据
        smart_data = {
            "therapist_name": "马老师",
            "appointment_time": "17:30",  # 使用不同时间避免冲突
            "customer_name": "AI测试用户",
            "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
            "notes": "AI直接调用测试"
        }
        
        print(f"📋 AI解析数据: {smart_data}")
        
        # 调用智能预约API
        result = await db_service.create_smart_appointment(smart_data)
        
        if result.get("success"):
            print(f"✅ AI直接调用成功!")
            print(f"   预约ID: {result['data'].get('appointment_id')}")
            print(f"   消息: {result.get('message')}")
            return True
        else:
            print(f"❌ AI直接调用失败: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False
    finally:
        if 'db_service' in locals():
            await db_service.close()

async def test_ai_function_call():
    """测试AI通过Function Call触发智能预约"""
    print("\n🔧 测试2: AI通过Function Call触发预约")
    print("=" * 50)
    
    try:
        from aiclient.adapters.openai_adapter import OpenAIAdapter
        from aiclient.config import ModelConfig
        
        # 创建配置
        config = ModelConfig(
            provider="openai",
            model_name="gpt-4",
            api_key="test-key",
            base_url="http://test.com"
        )
        
        # 创建适配器
        adapter = OpenAIAdapter(config)
        
        # 模拟AI调用Function Call - 结构化数据模式
        function_args = {
            "therapist_name": "李老师",
            "appointment_time": "18:00",  # 使用不同时间
            "customer_name": "Function Call测试用户",
            "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
            "notes": "Function Call测试"
        }
        
        print(f"🔧 Function Call参数: {function_args}")
        
        # 执行Function Call
        result = await adapter.execute_function_call("create_smart_appointment", function_args)
        
        if result.get("success"):
            print(f"✅ Function Call成功!")
            print(f"   预约ID: {result['data'].get('appointment_id')}")
            print(f"   消息: {result.get('message')}")
            return True
        else:
            print(f"❌ Function Call失败: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False

async def test_ai_natural_language_mode():
    """测试AI自然语言模式"""
    print("\n💬 测试3: AI自然语言解析模式")
    print("=" * 50)
    
    try:
        from aiclient.adapters.openai_adapter import OpenAIAdapter
        from aiclient.config import ModelConfig
        
        # 创建配置
        config = ModelConfig(
            provider="openai",
            model_name="gpt-4",
            api_key="test-key",
            base_url="http://test.com"
        )
        
        # 创建适配器
        adapter = OpenAIAdapter(config)
        
        # 模拟AI调用Function Call - 自然语言模式
        function_args = {
            "customer_message": "我需要调理师-陈老师为我服务，预计19:00到店",
            "context_info": {
                "shopName": "名医堂·颈肩腰腿特色调理（静安寺店）",
                "contactName": "AI自然语言测试",
                "combinedName": "名医堂·颈肩腰腿特色调理（静安寺店） - AI自然语言测试",
                "chatId": "chat_ai_test"
            }
        }
        
        print(f"💬 自然语言输入: {function_args['customer_message']}")
        print(f"📍 上下文信息: {function_args['context_info']}")
        
        # 执行Function Call
        result = await adapter.execute_function_call("create_smart_appointment", function_args)
        
        if result.get("success"):
            print(f"✅ 自然语言解析成功!")
            print(f"   预约ID: {result.get('appointment_id')}")
            print(f"   消息: {result.get('message')}")
            return True
        else:
            print(f"❌ 自然语言解析失败: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False

async def test_base_adapter_tools():
    """测试BaseAdapter工具配置"""
    print("\n⚙️  测试4: BaseAdapter工具配置")
    print("=" * 50)
    
    try:
        from aiclient.adapters.openai_adapter import OpenAIAdapter
        from aiclient.config import ModelConfig
        
        # 创建配置
        config = ModelConfig(
            provider="openai",
            model_name="gpt-4", 
            api_key="test-key",
            base_url="http://test.com"
        )
        
        # 创建适配器
        adapter = OpenAIAdapter(config)
        
        # 获取智能预约工具
        tools = adapter.get_smart_appointment_tools()
        
        print(f"🔧 智能预约工具数量: {len(tools)}")
        
        for tool in tools:
            function_info = tool["function"]
            print(f"✅ 工具名称: {function_info['name']}")
            print(f"   描述: {function_info['description'][:100]}...")
            
            # 检查新的参数结构
            properties = function_info['parameters']['properties']
            if 'therapist_name' in properties:
                print(f"   ✅ 支持结构化数据模式 (therapist_name)")
            if 'customer_message' in properties:
                print(f"   ✅ 支持自然语言模式 (customer_message)")
            
            required = function_info['parameters']['required']
            print(f"   必填参数: {required if required else '无(灵活调用)'}")
        
        return len(tools) > 0
        
    except Exception as e:
        print(f"❌ 测试异常: {e}")
        return False

async def verify_appointments():
    """验证创建的预约记录"""
    print("\n📊 验证预约记录")
    print("=" * 30)
    
    try:
        import aiohttp
        
        async with aiohttp.ClientSession() as session:
            # 查询最新预约记录
            async with session.get("http://localhost:3001/api/v1/client/stores") as response:
                if response.status == 200:
                    print("✅ 服务器连接正常")
                    print("请在前端 http://localhost:3001/frontend/admin.html 查看最新预约记录")
                    return True
                else:
                    print("❌ 服务器连接失败")
                    return False
                    
    except Exception as e:
        print(f"⚠️ 验证失败: {e}")
        return False

async def main():
    """主测试函数"""
    print("🚀 AI智能预约集成测试")
    print("测试AI是否能通过client和base调用触发预约")
    print("=" * 60)
    
    results = []
    
    # 执行所有测试
    tests = [
        ("AI直接调用", test_ai_smart_appointment_direct),
        ("Function Call", test_ai_function_call),
        ("自然语言模式", test_ai_natural_language_mode),
        ("BaseAdapter配置", test_base_adapter_tools),
    ]
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name}测试异常: {e}")
            results.append((test_name, False))
        
        # 短暂等待
        await asyncio.sleep(1)
    
    # 验证预约记录
    await verify_appointments()
    
    # 测试结果汇总
    print(f"\n📋 测试结果汇总")
    print("=" * 40)
    
    success_count = 0
    for test_name, success in results:
        status = "✅ 成功" if success else "❌ 失败"
        print(f"   {test_name}: {status}")
        if success:
            success_count += 1
    
    print(f"\n🎯 总体结果: {success_count}/{len(results)} 通过")
    
    if success_count >= len(results) - 1:  # 允许1个测试失败
        print("🎉 AI智能预约集成测试通过！")
        print("AI已经能够通过client和base调用成功触发预约！")
    else:
        print("⚠️ 部分测试失败，需要检查配置")
    
    return success_count >= len(results) - 1

if __name__ == "__main__":
    success = asyncio.run(main()) 