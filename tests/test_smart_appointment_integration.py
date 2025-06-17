"""
智能预约功能集成测试
测试AI能够处理自然语言预约请求并调用相应的function call
"""

import pytest
import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, Any

# 测试数据
CONTEXT_INFO = {
    'shopName': '名医堂·颈肩腰腿特色调理（静安寺店）',
    'contactName': '联系人_1750127546284',
    'combinedName': '名医堂·颈肩腰腿特色调理（静安寺店） - 联系人_1750127546284',
    'chatId': 'chat_联系人_1750127546284'
}

CUSTOMER_INPUT = "我需要调理师-马老师为我服务，预计16:30到店"

@pytest.fixture
def mock_database_api():
    """模拟数据库API服务"""
    class MockDatabaseAPI:
        async def search_therapists(self, store_name: str = None, therapist_name: str = None):
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
        
        async def get_therapist_schedule(self, therapist_id: int, date: str):
            """模拟查询技师排班"""
            return {
                "therapist_id": therapist_id,
                "date": date,
                "available_times": ["14:00", "15:00", "16:00", "16:30", "17:00"],
                "booked_times": ["13:00", "19:00"]
            }
        
        async def create_appointment(self, appointment_data: Dict[str, Any]):
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
        
        async def get_stores(self):
            """模拟获取门店列表"""
            return [
                {
                    "id": 1,
                    "name": "名医堂·颈肩腰腿特色调理（静安寺店）",
                    "address": "静安寺店地址",
                    "phone": "021-12345678"
                }
            ]
    
    return MockDatabaseAPI()

@pytest.fixture  
def mock_email_service():
    """模拟邮件服务"""
    class MockEmailService:
        async def send_appointment_notification_emails(self, appointment_info: Dict[str, Any]):
            """模拟发送预约邮件"""
            return {
                "success": True,
                "customer_email_sent": True,
                "therapist_email_sent": True,
                "message": "预约邮件发送成功"
            }
    
    return MockEmailService()

class TestSmartAppointmentIntegration:
    """智能预约集成测试类"""
    
    @pytest.mark.asyncio
    async def test_smart_appointment_service_creation(self):
        """测试智能预约服务创建"""
        from aiclient.services.smart_appointment import SmartAppointmentService
        
        service = SmartAppointmentService()
        assert service is not None
        assert hasattr(service, 'parse_appointment_request')
        assert hasattr(service, 'create_smart_appointment')
    
    @pytest.mark.asyncio
    async def test_parse_appointment_request(self):
        """测试解析预约请求"""
        from aiclient.services.smart_appointment import SmartAppointmentService
        
        service = SmartAppointmentService()
        
        result = await service.parse_appointment_request(
            customer_message=CUSTOMER_INPUT,
            context_info=CONTEXT_INFO
        )
        
        assert result["success"] is True
        assert "马老师" in result["therapist_name"]
        assert result["appointment_time"] == "16:30"
        assert "静安寺店" in result["store_name"]
        assert result["customer_name"] == "联系人_1750127546284"
    
    @pytest.mark.asyncio
    async def test_create_smart_appointment_with_mocks(self, mock_database_api, mock_email_service):
        """测试智能预约创建（使用模拟服务）"""
        from aiclient.services.smart_appointment import SmartAppointmentService
        
        service = SmartAppointmentService(
            database_service=mock_database_api,
            email_service=mock_email_service
        )
        
        result = await service.create_smart_appointment(
            customer_message=CUSTOMER_INPUT,
            context_info=CONTEXT_INFO
        )
        
        assert result["success"] is True
        assert result["appointment_created"] is True
        assert result["emails_sent"] is True
        assert "appointment_id" in result
    
    @pytest.mark.asyncio
    async def test_function_call_registration(self):
        """测试function call注册"""
        from aiclient.adapters.openai_adapter import OpenAIAdapter
        
        # 创建OpenAI适配器（具体实现类）
        from aiclient.config import ModelConfig
        config = ModelConfig(
            provider="openai",
            model_name="test-model",
            api_key="test-key",
            base_url="http://test.com"
        )
        
        adapter = OpenAIAdapter(config)
        
        # 获取智能预约工具
        tools = adapter.get_smart_appointment_tools()
        
        assert len(tools) > 0
        
        # 检查智能预约工具
        smart_appointment_tool = next(
            (tool for tool in tools if tool["function"]["name"] == "create_smart_appointment"), 
            None
        )
        
        assert smart_appointment_tool is not None
        assert "customer_message" in smart_appointment_tool["function"]["parameters"]["properties"]
        assert "context_info" in smart_appointment_tool["function"]["parameters"]["properties"]
    
    @pytest.mark.asyncio
    async def test_ai_adapter_function_call(self):
        """测试AI适配器的function call执行"""
        from aiclient.adapters.openai_adapter import OpenAIAdapter
        from aiclient.config import ModelConfig
        
        config = ModelConfig(
            provider="openai",
            model_name="gpt-4",
            api_key="test-key",
            base_url="http://test.com"
        )
        
        adapter = OpenAIAdapter(config)
        
        # 测试智能预约function call
        function_args = {
            "customer_message": CUSTOMER_INPUT,
            "context_info": CONTEXT_INFO
        }
        
        result = await adapter.execute_function_call("create_smart_appointment", function_args)
        
        # 由于这是集成测试，可能需要真实的数据库连接
        # 在此我们主要测试调用路径是否正确
        assert "success" in result
    
    @pytest.mark.asyncio
    async def test_end_to_end_appointment_flow(self, mock_database_api, mock_email_service):
        """端到端预约流程测试"""
        from aiclient.services.smart_appointment import SmartAppointmentService
        from aiclient.models import AIRequest, AIMessage, MessageRole
        
        # 1. 初始化服务
        service = SmartAppointmentService(
            database_service=mock_database_api,
            email_service=mock_email_service
        )
        
        # 2. 解析预约请求
        parse_result = await service.parse_appointment_request(
            customer_message=CUSTOMER_INPUT,
            context_info=CONTEXT_INFO
        )
        
        assert parse_result["success"] is True
        
        # 3. 检查技师可用性
        therapist_schedule = await mock_database_api.get_therapist_schedule(
            therapist_id=1,
            date=datetime.now().strftime("%Y-%m-%d")
        )
        
        assert "16:30" in therapist_schedule["available_times"]
        
        # 4. 创建预约
        appointment_result = await service.create_smart_appointment(
            customer_message=CUSTOMER_INPUT,
            context_info=CONTEXT_INFO
        )
        
        assert appointment_result["success"] is True
        assert appointment_result["appointment_created"] is True
        assert appointment_result["emails_sent"] is True
        
        # 5. 验证预约数据
        appointment_data = appointment_result["appointment_data"]
        assert appointment_data["therapist_id"] == 1
        assert appointment_data["appointment_time"] == "16:30"
        assert appointment_data["user_name"] == "联系人_1750127546284"

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 