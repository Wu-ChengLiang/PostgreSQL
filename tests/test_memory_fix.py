#!/usr/bin/env python3
"""
测试记忆系统修复
验证新版本的记忆保存和加载功能
"""

import asyncio
import json
import websockets
import logging
from datetime import datetime

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_memory_save():
    """测试 memory_save 消息类型"""
    uri = "ws://localhost:8767"
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("连接到服务器成功")
            
            # 接收欢迎消息
            welcome_msg = await websocket.recv()
            logger.info(f"收到欢迎消息: {welcome_msg}")
            
            # 测试 memory_save 消息
            test_memory_data = {
                "type": "memory_save",
                "payload": {
                    "action": "save",
                    "chatId": "test_chat_12345", 
                    "contactName": "测试联系人",
                    "conversationMemory": [
                        {
                            "role": "user",
                            "content": "你好，我想预约按摩服务",
                            "timestamp": datetime.now().isoformat(),
                            "messageId": "msg_001"
                        },
                        {
                            "role": "assistant", 
                            "content": "您好！请问您方便提供姓名和电话吗？",
                            "timestamp": datetime.now().isoformat(),
                            "messageId": "msg_002"
                        },
                        {
                            "role": "user",
                            "content": "我叫张三，电话是13812345678",
                            "timestamp": datetime.now().isoformat(),
                            "messageId": "msg_003"
                        }
                    ],
                    "timestamp": datetime.now().timestamp()
                }
            }
            
            logger.info("发送 memory_save 测试消息...")
            await websocket.send(json.dumps(test_memory_data, ensure_ascii=False))
            
            # 接收响应
            response = await websocket.recv()
            response_data = json.loads(response)
            logger.info(f"收到响应: {response_data}")
            
            if response_data.get('type') == 'memory_save_complete':
                logger.info("✅ memory_save 测试成功！")
                logger.info(f"保存统计: {response_data.get('saved_count')}/{response_data.get('total_count')}")
            else:
                logger.error("❌ memory_save 测试失败")
                
    except Exception as e:
        logger.error(f"测试失败: {e}")


async def test_memory_update():
    """测试 memory_update 消息类型（应该触发AI回复）"""
    uri = "ws://localhost:8767"
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("连接到服务器成功")
            
            # 接收欢迎消息
            await websocket.recv()
            
            # 测试 memory_update 消息
            test_update_data = {
                "type": "memory_update",
                "payload": {
                    "action": "add_message",
                    "chatId": "test_chat_67890",
                    "contactName": "测试客户2", 
                    "conversationMemory": [
                        {
                            "role": "user",
                            "content": "请问你们有什么服务项目？",
                            "timestamp": datetime.now().isoformat(),
                            "messageId": "msg_101"
                        }
                    ],
                    "timestamp": datetime.now().timestamp()
                }
            }
            
            logger.info("发送 memory_update 测试消息...")
            await websocket.send(json.dumps(test_update_data, ensure_ascii=False))
            
            # 接收响应 (可能有多个)
            responses = []
            try:
                # 等待AI回复
                for _ in range(3):  # 最多等待3个响应
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    response_data = json.loads(response)
                    responses.append(response_data)
                    logger.info(f"收到响应: {response_data}")
                    
                    # 如果收到AI回复，说明触发成功
                    if response_data.get('type') == 'sendAIReply':
                        logger.info("✅ AI回复触发成功！")
                        logger.info(f"AI回复内容: {response_data.get('text', '')[:100]}...")
                        break
                        
            except asyncio.TimeoutError:
                logger.warning("等待AI回复超时")
                
            logger.info(f"总共收到 {len(responses)} 个响应")
            
    except Exception as e:
        logger.error(f"测试失败: {e}")


async def test_typo_handling():
    """测试拼写错误处理（memoory_save）"""
    uri = "ws://localhost:8767"
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("连接到服务器成功")
            
            # 接收欢迎消息
            await websocket.recv()
            
            # 测试拼写错误的消息类型
            test_typo_data = {
                "type": "memoory_save",  # 故意拼写错误
                "payload": {
                    "action": "save",
                    "chatId": "test_typo_chat",
                    "contactName": "拼写错误测试",
                    "conversationMemory": [
                        {
                            "role": "user",
                            "content": "测试拼写错误处理",
                            "timestamp": datetime.now().isoformat(),
                            "messageId": "typo_msg_001"
                        }
                    ],
                    "timestamp": datetime.now().timestamp()
                }
            }
            
            logger.info("发送 memoory_save (拼写错误) 测试消息...")
            await websocket.send(json.dumps(test_typo_data, ensure_ascii=False))
            
            # 接收响应
            response = await websocket.recv()
            response_data = json.loads(response)
            logger.info(f"收到响应: {response_data}")
            
            if response_data.get('type') == 'memory_save_complete':
                logger.info("✅ 拼写错误处理成功！服务器正确处理了 memoory_save")
            else:
                logger.error("❌ 拼写错误处理失败")
                
    except Exception as e:
        logger.error(f"测试失败: {e}")


async def main():
    """运行所有测试"""
    logger.info("🧪 开始记忆系统修复测试...")
    
    await test_memory_save()
    await asyncio.sleep(2)
    
    await test_memory_update()
    await asyncio.sleep(2)
    
    await test_typo_handling()
    
    logger.info("🎉 所有测试完成！")


if __name__ == "__main__":
    asyncio.run(main()) 