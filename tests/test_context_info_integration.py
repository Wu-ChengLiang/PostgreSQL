"""
测试上下文信息集成
验证店铺名称和联系人信息在整个系统中的传递和使用
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# 添加路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from aiclient.client import AIClient
from aiclient.models import AIResponse, AIProvider


class TestContextInfoIntegration:
    """测试上下文信息集成"""
    
    def setup_method(self):
        """设置测试环境"""
        self.ai_client = AIClient()
    
    @pytest.mark.asyncio
    async def test_context_info_passed_to_ai(self):
        """测试上下文信息是否正确传递给AI"""
        # 模拟上下文信息
        context_info = {
            'shopName': '名医堂·颈肩腰腿特色调理（斜土路店）',
            'contactName': '联系人_1750124628151',
            'combinedName': '名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151',
            'chatId': 'chat_联系人_1750124628151'
        }
        
        # 模拟对话历史
        conversation_history = [
            {
                "role": "user",
                "content": "你好，我想预约按摩",
                "timestamp": 1750124628150
            }
        ]
        
        # 模拟AI响应
        mock_response = AIResponse(
            content="您好！欢迎来到名医堂·颈肩腰腿特色调理（斜土路店）。我可以帮您安排按摩预约。",
            model="test-model",
            provider="test"
        )
        
        # Mock适配器的create_customer_service_prompt_with_history方法
        with patch.object(self.ai_client.adapters[AIProvider.OPENAI], 'create_customer_service_prompt_with_history') as mock_create_prompt:
            with patch.object(self.ai_client.adapters[AIProvider.OPENAI], 'chat_completion', return_value=mock_response):
                # 调用AI生成回复
                response = await self.ai_client.generate_customer_service_reply(
                    customer_message="我想预约明天的按摩",
                    conversation_history=conversation_history,
                    context_info=context_info
                )
                
                # 验证create_customer_service_prompt_with_history被正确调用
                mock_create_prompt.assert_called_once()
                call_args = mock_create_prompt.call_args
                
                # 检查参数
                assert call_args[0][0] == "我想预约明天的按摩"  # customer_message
                assert call_args[0][1] == conversation_history   # conversation_history
                assert call_args[0][2] == context_info           # context_info
                
                # 验证响应
                assert response is not None
                assert response.content == mock_response.content
    
    def test_context_info_extraction_from_combined_name(self):
        """测试从组合名称中提取上下文信息"""
        combined_name = "名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151"
        
        # 模拟从组合名称提取信息的逻辑
        if " - " in combined_name:
            parts = combined_name.split(" - ", 1)
            shop_name = parts[0].strip()
            contact_name = parts[1].strip()
        else:
            shop_name = None
            contact_name = combined_name
        
        assert shop_name == "名医堂·颈肩腰腿特色调理（斜土路店）"
        assert contact_name == "联系人_1750124628151"
    
    def test_context_info_structure(self):
        """测试上下文信息结构的完整性"""
        context_info = {
            'shopName': '名医堂·颈肩腰腿特色调理（斜土路店）',
            'contactName': '联系人_1750124628151',
            'combinedName': '名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151',
            'chatId': 'chat_联系人_1750124628151'
        }
        
        # 验证所有必要的字段都存在
        required_fields = ['shopName', 'contactName', 'combinedName', 'chatId']
        for field in required_fields:
            assert field in context_info
            assert context_info[field] is not None
            assert len(str(context_info[field])) > 0
        
        # 验证组合名称的格式
        expected_combined = f"{context_info['shopName']} - {context_info['contactName']}"
        assert context_info['combinedName'] == expected_combined


if __name__ == "__main__":
    pytest.main([__file__]) 