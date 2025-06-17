#!/usr/bin/env python3
"""
智能预约功能测试 - TDD方式实现
测试用户消息解析和预约创建功能
"""

import pytest
import asyncio
import json
import websockets
import logging
from datetime import datetime, date, time

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestSmartAppointment:
    """智能预约功能测试类"""
    
    def setup_method(self):
        """每个测试方法前的设置"""
        self.test_messages = {
            "basic": "您好,我需要调理师-马老师为我服务预计16:30到店",
            "with_name": "您好,我是张三,需要调理师-马老师为我服务预计16:30到店,电话13812345678",
            "with_store": "您好,我需要斜土路店的调理师-马老师为我服务预计16:30到店",
            "complex": "您好,我是李四,需要斜土路店的调理师-马老师为我服务预计明天16:30到店,我的电话是13987654321"
        }
    
    def test_message_parsing_basic(self):
        """测试基本消息解析"""
        # 期望结果
        expected = {
            "therapist_name": "马老师",
            "appointment_time": "16:30",
            "store_name": None,
            "customer_name": None,
            "customer_phone": None
        }
        
        # 这里我们先写测试，稍后实现函数
        from src.services.appointmentParser import parse_appointment_message
        result = parse_appointment_message(self.test_messages["basic"])
        
        assert result["therapist_name"] == expected["therapist_name"]
        assert result["appointment_time"] == expected["appointment_time"]
        assert result["store_name"] == expected["store_name"]
    
    def test_message_parsing_with_customer_info(self):
        """测试包含客户信息的消息解析"""
        expected = {
            "therapist_name": "马老师",
            "appointment_time": "16:30",
            "customer_name": "张三",
            "customer_phone": "13812345678"
        }
        
        from src.services.appointmentParser import parse_appointment_message
        result = parse_appointment_message(self.test_messages["with_name"])
        
        assert result["therapist_name"] == expected["therapist_name"]
        assert result["customer_name"] == expected["customer_name"]
        assert result["customer_phone"] == expected["customer_phone"]
    
    def test_message_parsing_with_store(self):
        """测试包含门店信息的消息解析"""
        expected = {
            "therapist_name": "马老师",
            "appointment_time": "16:30",
            "store_name": "斜土路店"
        }
        
        from src.services.appointmentParser import parse_appointment_message
        result = parse_appointment_message(self.test_messages["with_store"])
        
        assert result["therapist_name"] == expected["therapist_name"]
        assert result["store_name"] == expected["store_name"]
    
    def test_therapist_matching(self):
        """测试技师匹配功能"""
        from src.services.appointmentService import find_therapist_by_name
        
        # 测试能否找到技师
        therapist = find_therapist_by_name("马老师")
        assert therapist is not None
        assert "马" in therapist["name"]
    
    def test_appointment_creation(self):
        """测试预约创建功能"""
        from src.services.appointmentService import create_smart_appointment
        
        appointment_data = {
            "therapist_name": "马老师",
            "appointment_time": "16:30",
            "appointment_date": date.today().isoformat(),
            "customer_name": "测试用户",
            "customer_phone": "13800000000"
        }
        
        result = create_smart_appointment(appointment_data)
        
        assert result["success"] is True
        assert "appointment_id" in result
        assert result["appointment_id"] > 0
    
    @pytest.mark.asyncio
    async def test_websocket_integration(self):
        """测试WebSocket集成 - 模拟用户发送智能预约消息"""
        uri = "ws://localhost:8767"
        
        try:
            async with websockets.connect(uri) as websocket:
                # 接收欢迎消息
                await websocket.recv()
                
                # 模拟智能预约消息
                smart_message = {
                    "type": "memory_update",
                    "payload": {
                        "chatId": "smart_appointment_test",
                        "contactName": "智能预约测试用户",
                        "conversationMemory": [
                            {
                                "role": "user",
                                "content": "您好,我需要调理师-马老师为我服务预计16:30到店",
                                "timestamp": datetime.now().isoformat(),
                                "messageId": "smart_msg_001"
                            }
                        ]
                    }
                }
                
                await websocket.send(json.dumps(smart_message, ensure_ascii=False))
                
                # 等待AI回复，应该包含预约确认信息
                response = await asyncio.wait_for(websocket.recv(), timeout=15.0)
                response_data = json.loads(response)
                
                # 检查是否触发了智能预约
                if response_data.get('type') == 'sendAIReply':
                    reply_text = response_data.get('text', '')
                    assert '预约' in reply_text
                    assert '马老师' in reply_text
                    logger.info(f"✅ 智能预约测试成功: {reply_text[:100]}...")
                
        except Exception as e:
            logger.error(f"WebSocket集成测试失败: {e}")
            pytest.fail(f"WebSocket测试失败: {e}")
    
    def test_appointment_display_data(self):
        """测试预约展示数据格式"""
        from src.services.appointmentService import format_appointment_for_display
        
        appointment_data = {
            "id": 1,
            "customer_name": "张三",
            "therapist_name": "马老师",
            "store_name": "斜土路店",
            "appointment_date": "2025-06-17",
            "start_time": "16:30",
            "status": "confirmed"
        }
        
        display_data = format_appointment_for_display(appointment_data)
        
        assert display_data["display_text"] == "张三 预约 斜土路店 马老师 2025-06-17 16:30"
        assert display_data["status_text"] == "已确认"
        assert display_data["can_modify"] is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 