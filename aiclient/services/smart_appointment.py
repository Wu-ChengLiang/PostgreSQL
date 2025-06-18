"""
智能预约服务
处理自然语言预约请求，解析用户意图并创建预约
"""

import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class AppointmentRequest:
    """预约请求数据类"""
    therapist_name: Optional[str] = None
    appointment_time: Optional[str] = None
    appointment_date: Optional[str] = None
    store_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None


class NaturalLanguageParser:
    """自然语言解析器"""
    
    def __init__(self):
        self.logger = logger.getChild(self.__class__.__name__)
        
        # 技师姓名匹配模式
        self.therapist_patterns = [
            r'([张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃河顾孔向汤]+)([老师|师傅|医生|技师|调理师]*)',
            r'调理师[-\s]*([^，,。\s]+)'
        ]
        
        # 时间匹配模式
        self.time_patterns = [
            r'(\d{1,2}):(\d{2})',  # 16:30
            r'(\d{1,2})点(\d{0,2})',  # 16点30
            r'(\d{1,2})点半',  # 16点半
            r'(\d{1,2}):(\d{2})',  # 16:30
        ]
        
        # 门店匹配模式
        self.store_patterns = [
            r'([\u4e00-\u9fa5]+店)',  # 静安寺店
            r'([\u4e00-\u9fa5]+分店)',  # 静安寺分店
            r'([\u4e00-\u9fa5]+门店)',  # 静安寺门店
        ]
        
        # 服务类型匹配
        self.service_patterns = [
            r'(调理|推拿理疗|艾灸|拔罐|刮痧|足疗)'
        ]
    
    def parse_therapist_name(self, text: str) -> Optional[str]:
        """解析技师姓名"""
        for pattern in self.therapist_patterns:
            match = re.search(pattern, text)
            if match:
                name = match.group(1)
                suffix = match.group(2) if len(match.groups()) > 1 else ""
                
                # 如果没有后缀，默认添加"老师"
                if not suffix and len(name) <= 3:
                    name += "老师"
                elif suffix:
                    name += suffix
                
                self.logger.info(f"解析到技师姓名: {name}")
                return name
        
        return None
    
    def parse_appointment_time(self, text: str) -> Optional[str]:
        """解析预约时间"""
        for pattern in self.time_patterns:
            match = re.search(pattern, text)
            if match:
                if '点半' in pattern:
                    hour = int(match.group(1))
                    time_str = f"{hour:02d}:30"
                elif '点' in pattern:
                    hour = int(match.group(1))
                    minute = int(match.group(2)) if match.group(2) else 0
                    time_str = f"{hour:02d}:{minute:02d}"
                else:
                    hour = int(match.group(1))
                    minute = int(match.group(2))
                    time_str = f"{hour:02d}:{minute:02d}"
                
                self.logger.info(f"解析到预约时间: {time_str}")
                return time_str
        
        return None
    
    def parse_store_name(self, text: str) -> Optional[str]:
        """解析门店名称"""
        for pattern in self.store_patterns:
            match = re.search(pattern, text)
            if match:
                store_name = match.group(1)
                self.logger.info(f"解析到门店名称: {store_name}")
                return store_name
        
        return None
    
    def parse_service_type(self, text: str) -> Optional[str]:
        """解析服务类型"""
        for pattern in self.service_patterns:
            match = re.search(pattern, text)
            if match:
                service_type = match.group(1)
                self.logger.info(f"解析到服务类型: {service_type}")
                return service_type
        
        return "调理"  # 默认服务类型
    
    def parse_appointment_request(self, text: str) -> AppointmentRequest:
        """解析完整的预约请求"""
        request = AppointmentRequest()
        
        request.therapist_name = self.parse_therapist_name(text)
        request.appointment_time = self.parse_appointment_time(text)
        request.store_name = self.parse_store_name(text)
        request.service_type = self.parse_service_type(text)
        
        # 默认预约今天
        request.appointment_date = datetime.now().strftime("%Y-%m-%d")
        
        return request


class SmartAppointmentService:
    """智能预约服务"""
    
    def __init__(self, database_service=None, email_service=None):
        """
        初始化智能预约服务
        
        Args:
            database_service: 数据库服务实例
            email_service: 邮件服务实例
        """
        self.database_service = database_service
        self.email_service = email_service
        self.parser = NaturalLanguageParser()
        self.logger = logger.getChild(self.__class__.__name__)
        
        # 如果没有提供服务实例，使用默认的
        if not self.database_service:
            from ..database_service import get_database_service
            self.database_service = get_database_service()
        
        if not self.email_service:
            from .email_notification import EmailNotificationService
            from .email_sender_adapter import EmailSenderAdapter
            email_sender = EmailSenderAdapter()
            self.email_service = EmailNotificationService(
                email_sender=email_sender,
                database_service=self.database_service
            )
    
    def extract_customer_info(self, context_info: Dict[str, Any]) -> Dict[str, str]:
        """
        从上下文信息中提取客户信息
        
        Args:
            context_info: 上下文信息
            
        Returns:
            客户信息字典
        """
        customer_info = {}
        
        # 提取客户姓名
        if 'contactName' in context_info:
            customer_info['name'] = context_info['contactName']
        elif 'combinedName' in context_info:
            # 从组合名称中提取联系人名称
            combined_name = context_info['combinedName']
            if ' - ' in combined_name:
                customer_info['name'] = combined_name.split(' - ')[1]
            else:
                customer_info['name'] = combined_name
        
        # 提取门店信息
        if 'shopName' in context_info:
            customer_info['store_name'] = context_info['shopName']
        
        # 生成客户电话（基于联系人名称）
        if 'name' in customer_info:
            # 从联系人名称中提取可能的电话号码
            name = customer_info['name']
            phone_match = re.search(r'(\d{11})', name)
            if phone_match:
                customer_info['phone'] = phone_match.group(1)
            else:
                # 如果没有电话，使用联系人ID生成一个测试电话
                customer_info['phone'] = f"138{hash(name) % 100000000:08d}"
        
        return customer_info
    
    async def parse_appointment_request(self, customer_message: str, 
                                      context_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        解析预约请求
        
        Args:
            customer_message: 客户消息
            context_info: 上下文信息
            
        Returns:
            解析结果
        """
        try:
            # 解析自然语言请求
            request = self.parser.parse_appointment_request(customer_message)
            
            # 提取客户信息
            customer_info = self.extract_customer_info(context_info)
            
            # 构建结果
            result = {
                "success": True,
                "therapist_name": request.therapist_name,
                "appointment_time": request.appointment_time,
                "appointment_date": request.appointment_date,
                "store_name": customer_info.get('store_name') or request.store_name,  # 优先使用上下文中的门店信息
                "customer_name": customer_info.get('name'),
                "customer_phone": customer_info.get('phone'),
                "service_type": request.service_type,
                "original_message": customer_message
            }
            
            self.logger.info(f"预约请求解析成功: {result}")
            return result
            
        except Exception as e:
            self.logger.error(f"预约请求解析失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "预约请求解析失败"
            }
    
    async def find_therapist(self, therapist_name: str, store_name: str = None) -> Optional[Dict[str, Any]]:
        """
        查找技师
        
        Args:
            therapist_name: 技师姓名
            store_name: 门店名称
            
        Returns:
            技师信息
        """
        try:
            # 调用数据库服务搜索技师
            therapists = await self.database_service.search_therapists(
                store_name=store_name,
                therapist_name=therapist_name
            )
            
            if therapists and len(therapists) > 0:
                return therapists[0]
            
            return None
            
        except Exception as e:
            self.logger.error(f"查找技师失败: {e}")
            return None
    
    async def check_availability(self, therapist_id: int, appointment_date: str, 
                               appointment_time: str) -> bool:
        """
        检查技师可用性
        
        Args:
            therapist_id: 技师ID
            appointment_date: 预约日期
            appointment_time: 预约时间
            
        Returns:
            是否可用
        """
        try:
            # 调用数据库服务查询技师排班
            schedule = await self.database_service.get_therapist_schedule(
                therapist_id, appointment_date
            )
            
            # 检查时间是否可用
            available_times = schedule.get('available_times', [])
            return appointment_time in available_times
            
        except Exception as e:
            self.logger.error(f"检查可用性失败: {e}")
            return False
    
    async def create_smart_appointment(self, customer_message: str, 
                                     context_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建智能预约
        
        Args:
            customer_message: 客户消息
            context_info: 上下文信息
            
        Returns:
            创建结果
        """
        try:
            # 1. 解析预约请求
            parse_result = await self.parse_appointment_request(customer_message, context_info)
            
            if not parse_result["success"]:
                return {
                    "success": False,
                    "error": "信息解析失败",
                    "message": "请提供完整的预约信息，包括技师姓名、预约时间等",
                    "suggestion": "请说明您想预约哪位技师，什么时间"
                }
            
            # 2. 查找技师
            therapist = await self.find_therapist(
                parse_result["therapist_name"],
                parse_result["store_name"]
            )
            
            if not therapist:
                return {
                    "success": False,
                    "error": "技师不存在",
                    "message": f"很抱歉，没有找到{parse_result['therapist_name']}技师",
                    "suggestion": "请检查技师姓名是否正确，或者选择其他技师"
                }
            
            # 3. 创建智能预约 - 直接调用API，让API处理时间冲突
            smart_appointment_data = {
                "therapist_name": parse_result["therapist_name"],
                "appointment_time": parse_result["appointment_time"],
                "customer_name": parse_result["customer_name"],
                "customer_phone": parse_result["customer_phone"],
                "store_name": parse_result["store_name"],
                "appointment_date": parse_result["appointment_date"],
                "notes": f"AI智能预约：{customer_message}"
            }
            
            # 使用智能预约API
            appointment_result = await self.database_service.create_smart_appointment(smart_appointment_data)
            
            if not appointment_result.get("success"):
                # 解析具体的错误信息
                error_message = appointment_result.get("error", "")
                
                if "已被预约" in error_message or "时间段已被预约" in error_message:
                    return {
                        "success": False,
                        "error": "时间冲突",
                        "message": f"{parse_result['therapist_name']}在{parse_result['appointment_time']}已经有安排了",
                        "suggestion": f"建议您选择{parse_result['therapist_name']}的其他时间，或者选择同门店的其他技师",
                        "therapist_name": parse_result["therapist_name"],
                        "requested_time": parse_result["appointment_time"]
                    }
                elif "技师不存在" in error_message:
                    return {
                        "success": False,
                        "error": "技师信息错误",
                        "message": f"很抱歉，{parse_result['therapist_name']}目前不在我们门店",
                        "suggestion": "请选择其他技师，我可以为您推荐同门店的其他优秀技师"
                    }
                elif "门店不存在" in error_message:
                    return {
                        "success": False,
                        "error": "门店信息错误",
                        "message": "门店信息有误",
                        "suggestion": "请确认您要预约的门店信息"
                    }
                elif "营业时间" in error_message:
                    return {
                        "success": False,
                        "error": "营业时间限制",
                        "message": f"{parse_result['appointment_time']}不在营业时间内",
                        "suggestion": "请选择营业时间内的时段（通常为9:00-21:00）"
                    }
                else:
                    return {
                        "success": False,
                        "error": "预约处理失败",
                        "message": "预约暂时无法完成，可能是系统繁忙",
                        "suggestion": "请稍后重试，或者选择其他时间段",
                        "details": error_message
                    }
            
            # # 5. 发送邮件通知 (已注释)
            # email_result = {"success": True, "message": "邮件发送已跳过"}
            
            # if self.email_service:
            #     try:
            #         email_info = {
            #             "customer_name": parse_result["customer_name"],
            #             "customer_phone": parse_result["customer_phone"],
            #             "therapist_id": therapist["id"],
            #             "therapist_name": therapist["name"],
            #             "appointment_date": parse_result["appointment_date"],
            #             "appointment_time": parse_result["appointment_time"],
            #             "service_type": parse_result["service_type"],
            #             "store_name": parse_result["store_name"]
            #         }
            #         
            #         email_result = await self.email_service.send_appointment_notification_emails(email_info)
            #     except Exception as e:
            #         self.logger.warning(f"邮件发送失败: {e}")
            #         email_result = {"success": False, "error": str(e)}
            
            # 6. 返回结果
            appointment_id = appointment_result["data"].get("appointment_id") or appointment_result["data"].get("id")
            
            return {
                "success": True,
                "appointment_created": True,
                "emails_sent": email_result.get("success", False),
                "appointment_id": appointment_id,
                "appointment_data": appointment_result["data"],
                "message": f"预约成功！{parse_result['therapist_name']}，{parse_result['appointment_date']} {parse_result['appointment_time']}",
                "confirmation_details": {
                    "therapist_name": parse_result["therapist_name"],
                    "appointment_date": parse_result["appointment_date"],
                    "appointment_time": parse_result["appointment_time"],
                    "customer_name": parse_result["customer_name"]
                }
            }
            
        except Exception as e:
            self.logger.error(f"智能预约创建失败: {e}")
            return {
                "success": False,
                "error": "系统错误",
                "message": "预约系统暂时不可用",
                "suggestion": "请稍后重试，或联系客服协助处理",
                "details": str(e)
            } 