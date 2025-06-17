#!/usr/bin/env python3
"""
调试上下文信息传递功能的脚本
用于验证AI客户端是否能正确接收和处理上下文信息
"""

import asyncio
import sys
import os

# 添加路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'aiclient'))

from aiclient.client import AIClient


async def test_context_info():
    """测试上下文信息传递"""
    print("🔧 开始测试上下文信息传递功能...")
    
    # 创建AI客户端
    client = AIClient()
    
    # 模拟上下文信息
    context_info = {
        'shopName': '名医堂·颈肩腰腿特色调理（斜土路店）',
        'contactName': '联系人_1750126513139',
        'combinedName': '名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750126513139',
        'chatId': 'chat_联系人_1750126513139'
    }
    
    # 模拟对话历史
    conversation_history = [
        {
            "role": "user",
            "content": "你好，我想了解一下服务项目",
            "timestamp": 1750126513000
        }
    ]
    
    print(f"📤 发送上下文信息: {context_info}")
    print(f"📝 对话历史: {len(conversation_history)} 条记录")
    
    try:
        # 调用AI生成回复
        response = await client.generate_customer_service_reply(
            customer_message="我想预约明天的按摩服务",
            conversation_history=conversation_history,
            context_info=context_info
        )
        
        print("✅ AI回复生成成功!")
        print(f"📨 AI回复内容: {response.content}")
        print(f"🤖 使用模型: {response.model}")
        print(f"🏪 提供商: {response.provider}")
        
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """主函数"""
    print("=" * 60)
    print("🧪 上下文信息传递功能测试")
    print("=" * 60)
    
    success = await test_context_info()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 测试通过! 上下文信息传递功能正常工作")
    else:
        print("⚠️  测试失败! 请检查配置和日志")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main()) 