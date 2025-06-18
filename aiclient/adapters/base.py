"""
AI适配器基类
"""

import json
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import asyncio
import logging

from ..models import AIRequest, AIResponse, AIMessage, MessageRole
from ..config import ModelConfig


logger = logging.getLogger(__name__)


class BaseAdapter(ABC):
    """AI适配器基类"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.logger = logger.getChild(self.__class__.__name__)
        self.supports_function_calling = False
    
    @abstractmethod
    async def chat_completion(self, request: AIRequest) -> AIResponse:
        """执行聊天补全请求"""
        pass
    
    @abstractmethod
    def _prepare_request(self, request: AIRequest) -> dict:
        """准备API请求数据"""
        pass
    
    @abstractmethod
    def _parse_response(self, response_data: dict) -> AIResponse:
        """解析API响应数据"""
        pass
    
    def get_database_tools(self) -> List[Dict[str, Any]]:
        """获取数据库查询工具配置"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_therapist_schedule",
                    "description": "查询指定技师在指定日期的可用预约时间段和排班信息",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "therapist_id": {
                                "type": "integer",
                                "description": "技师ID"
                            },
                            "date": {
                                "type": "string",
                                "description": "查询日期，格式: YYYY-MM-DD"
                            }
                        },
                        "required": ["therapist_id", "date"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_therapists",
                    "description": "搜索技师信息，支持按门店ID、专长关键词、最少从业年限等条件搜索",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "store_id": {
                                "type": "integer",
                                "description": "门店ID，用于搜索指定门店的技师"
                            },
                            "specialty": {
                                "type": "string",
                                "description": "专长关键词，如：按摩、推拿、艾灸等"
                            },
                            "min_experience": {
                                "type": "integer",
                                "description": "最少从业年限"
                            },
                            "page": {
                                "type": "integer",
                                "description": "页码，默认1"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "每页数量，默认20"
                            }
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_appointment",
                    "description": "创建新的预约记录，需要提供完整的客户信息和预约时间",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "therapist_id": {
                                "type": "integer",
                                "description": "技师ID"
                            },
                            "user_name": {
                                "type": "string",
                                "description": "用户姓名"
                            },
                            "user_phone": {
                                "type": "string",
                                "description": "用户电话号码"
                            },
                            "appointment_date": {
                                "type": "string",
                                "description": "预约日期，格式: YYYY-MM-DD"
                            },
                            "appointment_time": {
                                "type": "string",
                                "description": "预约时间，格式: HH:MM"
                            },
                            "notes": {
                                "type": "string",
                                "description": "备注信息（可选）"
                            }
                        },
                        "required": ["therapist_id", "user_name", "user_phone", "appointment_date", "appointment_time"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_user_appointments", 
                    "description": "查看指定用户的所有预约列表，通过手机号查询",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "phone": {
                                "type": "string",
                                "description": "用户电话号码"
                            }
                        },
                        "required": ["phone"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_appointment_details",
                    "description": "获取指定预约的详细信息",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {
                                "type": "integer",
                                "description": "预约ID"
                            }
                        },
                        "required": ["appointment_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_appointment",
                    "description": "取消指定的预约，需要提供预约ID和用户电话进行身份验证",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {
                                "type": "integer",
                                "description": "预约ID"
                            },
                            "phone": {
                                "type": "string",
                                "description": "用户电话号码，用于验证身份"
                            }
                        },
                        "required": ["appointment_id", "phone"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_stores",
                    "description": "获取所有门店列表信息，包括门店名称、地址、营业时间、技师数量等",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            }
        ]
    
    def get_email_notification_tools(self) -> List[Dict[str, Any]]:
        """获取邮件通知工具配置"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "send_appointment_emails",
                    "description": "发送预约相关的邮件通知，包括给客户发送确认邮件和给技师发送新预约通知邮件",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "customer_name": {
                                "type": "string",
                                "description": "客户姓名"
                            },
                            "customer_phone": {
                                "type": "string",
                                "description": "客户电话号码，用于生成163邮箱地址"
                            },
                            "therapist_id": {
                                "type": "integer",
                                "description": "技师ID，用于查询技师信息和发送通知邮件"
                            },
                            "appointment_date": {
                                "type": "string",
                                "description": "预约日期，格式: YYYY-MM-DD"
                            },
                            "appointment_time": {
                                "type": "string",
                                "description": "预约时间，格式: HH:MM"
                            },
                            "service_type": {
                                "type": "string",
                                "description": "服务类型（可选）"
                            },
                            "notes": {
                                "type": "string",
                                "description": "预约备注信息（可选）"
                            }
                        },
                        "required": ["customer_name", "customer_phone", "therapist_id", "appointment_date", "appointment_time"]
                    }
                }
            }
        ]
    
    def get_smart_appointment_tools(self) -> List[Dict[str, Any]]:
        """获取智能预约工具配置"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "create_smart_appointment",
                    "description": """智能预约功能：创建预约并处理各种情况。

🎯 功能说明：
- 支持自然语言解析预约信息
- 自动处理时间冲突和技师不可用情况
- 返回友好的错误信息和建议

⚠️ 错误处理：
当预约失败时，工具会返回具体原因：
- "时间冲突"：技师在该时间已有安排，建议选择其他时间或技师
- "技师不存在"：技师信息错误，建议选择其他技师
- "营业时间限制"：时间超出营业范围
- "系统错误"：临时故障，建议稍后重试

📝 使用建议：
- 优先使用结构化数据模式（直接传递解析好的信息）
- 当预约失败时，根据返回的suggestion字段给客户友好建议
- 不要说"未知错误"，而要根据具体错误类型给出有用的建议""",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "therapist_name": {
                                "type": "string",
                                "description": "技师姓名，例如：'马老师'、'李老师'、'张师傅'等"
                            },
                            "appointment_time": {
                                "type": "string",
                                "description": "预约时间，格式：HH:MM，例如：'16:30'、'14:00'"
                            },
                            "customer_name": {
                                "type": "string",
                                "description": "客户姓名，从客户消息中提取真实姓名，例如：'吴城良'、'张三'"
                            },
                            "customer_phone": {
                                "type": "string",
                                "description": "客户电话号码，从客户消息中提取11位手机号，例如：'19357509506'。如果客户提供了电话号码，必须提取此字段"
                            },
                            "store_name": {
                                "type": "string",
                                "description": "门店名称，例如：'名医堂·颈肩腰腿特色调理（静安寺店）'"
                            },
                            "appointment_date": {
                                "type": "string",
                                "description": "预约日期，格式：YYYY-MM-DD，如不提供则默认今天"
                            },
                            "notes": {
                                "type": "string",
                                "description": "备注信息，可选"
                            },
                            "customer_message": {
                                "type": "string",
                                "description": "【自然语言模式】客户的原始预约请求，当没有提供结构化数据时使用"
                            },
                            "context_info": {
                                "type": "object",
                                "description": "【自然语言模式】对话上下文信息，当没有提供结构化数据时使用",
                                "properties": {
                                    "shopName": {
                                        "type": "string",
                                        "description": "门店名称"
                                    },
                                    "contactName": {
                                        "type": "string",
                                        "description": "联系人名称"
                                    },
                                    "combinedName": {
                                        "type": "string",
                                        "description": "组合名称"
                                    },
                                    "chatId": {
                                        "type": "string",
                                        "description": "聊天会话ID"
                                    }
                                }
                            }
                        },
                        "required": []
                    }
                }
            }
        ]
    
    async def _make_request(self, url: str, headers: dict, data: dict) -> dict:
        """发送HTTP请求"""
        import aiohttp
        
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        
        for attempt in range(self.config.max_retries):
            try:
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.post(url, headers=headers, json=data) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            error_text = await response.text()
                            self.logger.error(f"HTTP错误 {response.status}: {error_text}")
                            if attempt == self.config.max_retries - 1:
                                raise Exception(f"HTTP错误 {response.status}: {error_text}")
            except Exception as e:
                self.logger.warning(f"请求失败 (尝试 {attempt + 1}/{self.config.max_retries}): {e}")
                if attempt == self.config.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # 指数退避
    
    def create_customer_service_prompt(self, customer_message: str, context_info: dict = None) -> AIRequest:
        """创建客服回复的提示词"""
        
        # 构建上下文信息文本
        context_text = ""
        if context_info:
            shop_name = context_info.get('shopName')
            contact_name = context_info.get('contactName')
            combined_name = context_info.get('combinedName')
            
            if combined_name:
                context_text = f"\n【当前对话对象】: {combined_name}"
            elif shop_name and contact_name:
                context_text = f"\n【当前对话对象】: {shop_name} - {contact_name}"
            elif shop_name:
                context_text = f"\n【当前门店】: {shop_name}"
        
        system_prompt = f"""
        
你是名医堂的智能客服助理，现在有一个人和你对话{context_text}


用户消息：{customer_message}


【客服工作流程】
根据对话阶段采用不同策略：

🔸 首次咨询阶段（客户刚开始咨询时）：
1. 第一句话简洁地向客户介绍可用技师和推荐
2. 主动调用 get_stores 获取门店列表
3. 根据当前门店名称找到对应的门店ID  
4. 调用 search_therapists 获取该门店技师信息
5. 如果对方没有确认技师，推荐给其优秀的技师


🔸 预约阶段（客户表达预约意向后）：
1. 主动询问客户贵姓和联系电话
3. 一次性确认所有信息（确认时不要重复电话号码）
4. 立即调用 create_smart_appointment 创建预约（根据前面的门店、技师、客户姓名和电话）
5. 调用 send_appointment_emails 发送邮件通知

【工具使用优先级】
**咨询初期时优先使用**：
- get_stores: 获取门店信息和门店ID映射
- search_therapists: 搜索技师信息（必须传入正确的store_id）

**预约阶段优先使用**：
- create_smart_appointment: 智能预约 （如果预约返回500错误，说明已被预约，请推荐同门店其他技师）
- send_appointment_emails: 发送预约邮件通知

**次要工具**（客户特别需要时才调用）：
- get_user_appointments: 查看用户预约列表
- get_stores: 获取门店信息（预约阶段时为次要）
- search_therapists: 搜索技师信息（预约阶段时为次要）

工作原则：
1. 识别对话阶段，采用对应的工作流程
2. 首次咨询时主动提供门店技师信息
3. 预约阶段主动收集客户信息（姓名、电话）
4. 确认信息时不要显示电话号码，预约码（避免屏蔽）
5. 一次确认后立即创建预约并发送邮件（技师邮件未开通，只要发送客户邮件）
6. 回复简洁明了，不使用markdown格式
7. 基于对话历史提供连贯的回复

【基础信息】
医保支付：不支持医保
店内餐饮：仅提供养生茶和小食糖果（无正餐）

【预约规则】
指定技师：可约/需等待/推荐同级替补
双人间：有空房直接约，满员则改期
女技师：可预约，若无则推荐男技师
迟到处理：短时宽容/影响后续则改期
退款流程：平台直接退款或改约

【服务项目】
推荐套餐：小调理（颈肩腰腿痛专项）
团购建议：到店评估后购买
生理期服务：量少时可艾灸，需预约
技师资质：持推拿证，8年以上经验

【其他咨询】
招聘信息：停招/招聘中
节假日：全年营业（仅春节放假）

请根据客户消息，判断当前对话阶段，使用相应的工具和流程提供准确回复。
禁止直接发送真实的手机号、确认码给客户。
"""
        
        messages = [
            AIMessage(role=MessageRole.SYSTEM, content=system_prompt),
            AIMessage(role=MessageRole.USER, content=customer_message)
        ]
        
        return AIRequest(
            messages=messages,
            max_tokens=self.config.max_tokens,
            temperature=self.config.temperature
        )
    
    def create_customer_service_prompt_with_history(self, customer_message: str, 
                                                   conversation_history: list = None,
                                                   context_info: dict = None) -> AIRequest:
        """创建带有对话历史和上下文信息的客服回复提示词
        
        Args:
            customer_message: 客户消息
            conversation_history: 对话历史
            context_info: 上下文信息（店铺名称、联系人信息等）
        """
        
        # 如果没有历史记录，回退到普通方法
        if not conversation_history:
            return self.create_customer_service_prompt(customer_message, context_info)
        
        # 构建上下文信息文本
        context_text = ""
        if context_info:
            shop_name = context_info.get('shopName')
            contact_name = context_info.get('contactName')
            combined_name = context_info.get('combinedName')
            
            if combined_name:
                context_text = f"\n【当前对话对象】: {combined_name}"
            elif shop_name and contact_name:
                context_text = f"\n【当前对话对象】: {shop_name} - {contact_name}"
            elif shop_name:
                context_text = f"\n【当前门店】: {shop_name}"
        
        system_prompt = f"""
你是名医堂的智能客服助理，现在有一个人和你对话{context_text}


你们的对话聊天历史：{conversation_history}


【客服工作流程】
根据对话阶段采用不同策略：

🔸 首次咨询阶段（客户刚开始咨询时）：
1. 第一句话简洁地向客户介绍可用技师和推荐
2. 主动调用 get_stores 获取门店列表
3. 根据当前门店名称找到对应的门店ID  
4. 调用 search_therapists 获取该门店技师信息
5. 如果对方没有确认技师，推荐给其优秀的技师


🔸 预约阶段（客户表达预约意向后）：
1. 主动询问客户贵姓和联系电话
3. 一次性确认所有信息（确认时不要重复电话号码）
4. 立即调用 create_smart_appointment 创建预约（根据前面的门店、技师、客户姓名和电话）
5. 调用 send_appointment_emails 发送邮件通知

【工具使用优先级】
**咨询初期时优先使用**：
- get_stores: 获取门店信息和门店ID映射
- search_therapists: 搜索技师信息（必须传入正确的store_id）

**预约阶段优先使用**：
- create_smart_appointment: 智能预约 （如果预约返回500错误，说明已被预约，请推荐同门店其他技师）
- send_appointment_emails: 发送预约邮件通知

**次要工具**（客户特别需要时才调用）：
- get_user_appointments: 查看用户预约列表
- get_stores: 获取门店信息（预约阶段时为次要）
- search_therapists: 搜索技师信息（预约阶段时为次要）

工作原则：
1. 识别对话阶段，采用对应的工作流程
2. 首次咨询时主动提供门店技师信息
3. 预约阶段主动收集客户信息（姓名、电话）
4. 确认信息时不要显示电话号码，预约码（避免屏蔽）
5. 一次确认后立即创建预约并发送邮件（技师邮件未开通，只要发送客户邮件）
6. 回复简洁明了，不使用markdown格式
7. 基于对话历史提供连贯的回复

【基础信息】
医保支付：不支持医保
店内餐饮：仅提供养生茶和小食糖果（无正餐）

【预约规则】
指定技师：可约/需等待/推荐同级替补
双人间：有空房直接约，满员则改期
女技师：可预约，若无则推荐男技师
迟到处理：短时宽容/影响后续则改期
退款流程：平台直接退款或改约

【服务项目】
推荐套餐：小调理（颈肩腰腿痛专项）
团购建议：到店评估后购买
生理期服务：量少时可艾灸，需预约
技师资质：持推拿证，8年以上经验

【其他咨询】
招聘信息：停招/招聘中
节假日：全年营业（仅春节放假）

请根据客户消息，判断当前对话阶段，使用相应的工具和流程提供准确回复。
禁止直接发送真实的手机号、确认编号等长串字符给客户，这些消息会被屏蔽
"""

        messages = [AIMessage(role=MessageRole.SYSTEM, content=system_prompt)]
        
        # 添加对话历史 - 增加到30条历史记录以提供更好的上下文
        for memory_item in conversation_history[-30:]:  # 使用最近30条历史记录
            role = MessageRole.USER if memory_item.get("role") == "user" else MessageRole.ASSISTANT
            content = memory_item.get("content", "")
            if content.strip():
                messages.append(AIMessage(role=role, content=content))
        
        # 添加当前客户消息
        messages.append(AIMessage(role=MessageRole.USER, content=customer_message))
        
        # 如果适配器支持function calling，添加工具
        tools = None
        if self.supports_function_calling:
            tools = self.get_database_tools() + self.get_email_notification_tools() + self.get_smart_appointment_tools()
        
        return AIRequest(
            messages=messages,
            max_tokens=self.config.max_tokens,
            temperature=0.5,  # 稍微提高创造性，让回复更自然
            tools=tools  # 添加数据库查询工具
        )
    
    async def process_tool_calls(self, tool_calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        处理工具调用
        
        Args:
            tool_calls: 工具调用列表
            
        Returns:
            工具调用结果列表
        """
        results = []
        
        for tool_call in tool_calls:
            try:
                function_name = tool_call["function"]["name"]
                function_args = json.loads(tool_call["function"]["arguments"])
                
                # 执行函数调用
                if hasattr(self, 'execute_function_call'):
                    result = await self.execute_function_call(function_name, function_args)
                else:
                    result = {
                        "success": False,
                        "error": "适配器不支持函数调用",
                        "message": "当前适配器未实现函数调用功能"
                    }
                
                results.append({
                    "tool_call_id": tool_call["id"],
                    "function_name": function_name,
                    "result": result
                })
                
            except Exception as e:
                logger.error(f"处理工具调用失败: {e}")
                results.append({
                    "tool_call_id": tool_call.get("id", "unknown"),
                    "function_name": tool_call.get("function", {}).get("name", "unknown"),
                    "result": {
                        "success": False,
                        "error": str(e),
                        "message": "工具调用处理失败"
                    }
                })
        
        return results 