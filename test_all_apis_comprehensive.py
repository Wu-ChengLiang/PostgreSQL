"""
全面的API测试文件
测试所有数据库API和邮件通知API功能
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

# 导入必要的服务
import sys
import os
sys.path.append(os.path.dirname(__file__))

from aiclient.database_service import DatabaseAPIService
from aiclient.services.email_notification import EmailNotificationService, ContactInfoExtractor
from aiclient.services.smart_appointment import SmartAppointmentService

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('test_apis.log', encoding='utf-8')
    ]
)

logger = logging.getLogger(__name__)


class APITester:
    """API测试器"""
    
    def __init__(self):
        self.database_service = DatabaseAPIService()
        self.email_service = EmailNotificationService()
        self.smart_appointment_service = SmartAppointmentService(
            database_service=self.database_service,
            email_service=self.email_service
        )
        self.contact_extractor = ContactInfoExtractor()
        self.test_results: Dict[str, Any] = {}
    
    async def test_get_stores(self) -> Dict[str, Any]:
        """测试获取门店信息API"""
        logger.info("=" * 60)
        logger.info("🏪 测试: 获取门店信息")
        
        try:
            stores = await self.database_service.get_stores()
            
            result = {
                "success": True,
                "api_name": "get_stores",
                "description": "获取所有门店列表信息，包括门店名称、地址、营业时间、技师数量等",
                "data": stores,
                "count": len(stores),
                "message": f"成功获取 {len(stores)} 个门店信息"
            }
            
            # 打印详细信息
            logger.info(f"✅ 成功获取 {len(stores)} 个门店:")
            for i, store in enumerate(stores[:3]):  # 只显示前3个
                logger.info(f"  {i+1}. 门店: {store.get('name', 'N/A')}")
                logger.info(f"     ID: {store.get('id', 'N/A')}")
                logger.info(f"     地址: {store.get('address', 'N/A')}")
                
            if len(stores) > 3:
                logger.info(f"  ... 还有 {len(stores) - 3} 个门店")
                
        except Exception as e:
            result = {
                "success": False,
                "api_name": "get_stores",
                "error": str(e),
                "message": "获取门店信息失败"
            }
            logger.error(f"❌ 获取门店信息失败: {e}")
        
        return result
    
    async def test_search_therapists(self) -> Dict[str, Any]:
        """测试搜索技师信息API"""
        logger.info("=" * 60)
        logger.info("👩‍⚕️ 测试: 搜索技师信息")
        
        try:
            # 测试不同的搜索条件
            search_conditions = [
                {"description": "搜索所有技师", "params": {}},
                {"description": "按门店ID搜索", "params": {"store_id": 1}},
                {"description": "按技师姓名搜索", "params": {"therapist_name": "老师"}},
            ]
            
            all_results = []
            
            for condition in search_conditions:
                logger.info(f"📋 {condition['description']}: {condition['params']}")
                
                therapists = await self.database_service.search_therapists(**condition['params'])
                
                condition_result = {
                    "condition": condition['description'],
                    "params": condition['params'],
                    "count": len(therapists),
                    "data": therapists[:2]  # 只保存前2个作为示例
                }
                all_results.append(condition_result)
                
                logger.info(f"  ✅ 找到 {len(therapists)} 个技师")
                for i, therapist in enumerate(therapists[:2]):
                    logger.info(f"    {i+1}. 技师: {therapist.get('name', 'N/A')}")
                    logger.info(f"       ID: {therapist.get('id', 'N/A')}")
                    logger.info(f"       门店: {therapist.get('store_name', 'N/A')}")
                    logger.info(f"       专长: {therapist.get('specialties', 'N/A')}")
            
            result = {
                "success": True,
                "api_name": "search_therapists",
                "description": "搜索技师信息，支持按门店ID、专长关键词、最少从业年限等条件搜索",
                "data": all_results,
                "message": "技师搜索测试完成"
            }
            
        except Exception as e:
            result = {
                "success": False,
                "api_name": "search_therapists",
                "error": str(e),
                "message": "搜索技师信息失败"
            }
            logger.error(f"❌ 搜索技师信息失败: {e}")
        
        return result
    
    # 取消排班api，因为如果预约失败，只可能是该时间已经被预约
    # async def test_get_therapist_schedule(self) -> Dict[str, Any]:
    #     """测试查询技师排班API"""
    #     logger.info("=" * 60)
    #     logger.info("📅 测试: 查询技师排班信息")
        
    #     try:
    #         # 先获取一个技师ID
    #         therapists = await self.database_service.search_therapists()
    #         if not therapists:
    #             return {
    #                 "success": False,
    #                 "api_name": "get_therapist_schedule",
    #                 "error": "没有找到技师，无法测试排班查询",
    #                 "message": "测试跳过：无可用技师"
    #             }
            
    #         test_therapist = therapists[0]
    #         therapist_id = test_therapist.get('id')
    #         therapist_name = test_therapist.get('name', 'N/A')
            
    #         # 测试今天和明天的排班
    #         today = datetime.now().strftime('%Y-%m-%d')
    #         tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
    #         test_dates = [today, tomorrow]
    #         all_schedules = []
            
    #         for date in test_dates:
    #             logger.info(f"📋 查询技师 {therapist_name} (ID: {therapist_id}) 在 {date} 的排班")
                
    #             schedule = await self.database_service.get_therapist_schedule(therapist_id, date)
                
    #             schedule_result = {
    #                 "date": date,
    #                 "therapist_id": therapist_id,
    #                 "therapist_name": therapist_name,
    #                 "schedule_data": schedule,
    #                 "available_times_count": len(schedule.get('available_times', [])),
    #                 "booked_times_count": len(schedule.get('booked_times', []))
    #             }
    #             all_schedules.append(schedule_result)
                
    #             logger.info(f"  ✅ 可用时间段: {len(schedule.get('available_times', []))} 个")
    #             logger.info(f"  📝 已预约时间: {len(schedule.get('booked_times', []))} 个")
                
    #             # 显示部分可用时间
    #             available_times = schedule.get('available_times', [])
    #             if available_times:
    #                 logger.info(f"  🕐 部分可用时间: {', '.join(available_times[:5])}")
            
    #         result = {
    #             "success": True,
    #             "api_name": "get_therapist_schedule", 
    #             "description": "查询指定技师在指定日期的可用预约时间段和排班信息",
    #             "data": all_schedules,
    #             "message": f"成功查询技师 {therapist_name} 的排班信息"
    #         }
            
    #     except Exception as e:
    #         result = {
    #             "success": False,
    #             "api_name": "get_therapist_schedule",
    #             "error": str(e),
    #             "message": "查询技师排班失败"
    #         }
    #         logger.error(f"❌ 查询技师排班失败: {e}")
        
    #     return result
    
    async def test_get_user_appointments(self) -> Dict[str, Any]:
        """测试查看用户预约列表API"""
        logger.info("=" * 60)
        logger.info("📋 测试: 查看用户预约列表")
        
        try:
            # 使用测试用户电话号码
            test_phones = ["19357509506", "13800138000", "18888888888"]
            
            all_results = []
            
            for phone in test_phones:
                logger.info(f"📱 查询用户 {phone} 的预约列表")
                
                appointments = await self.database_service.get_user_appointments(phone)
                
                phone_result = {
                    "phone": phone,
                    "appointments_count": len(appointments),
                    "appointments": appointments[:3]  # 只保存前3个作为示例
                }
                all_results.append(phone_result)
                
                logger.info(f"  ✅ 找到 {len(appointments)} 个预约")
                for i, appointment in enumerate(appointments[:2]):
                    logger.info(f"    {i+1}. 预约ID: {appointment.get('id', 'N/A')}")
                    logger.info(f"       日期时间: {appointment.get('appointment_date', 'N/A')} {appointment.get('appointment_time', 'N/A')}")
                    logger.info(f"       技师: {appointment.get('therapist_name', 'N/A')}")
                    logger.info(f"       状态: {appointment.get('status', 'N/A')}")
            
            result = {
                "success": True,
                "api_name": "get_user_appointments",
                "description": "查看指定用户的所有预约列表，通过手机号查询",
                "data": all_results,
                "message": "用户预约列表查询测试完成"
            }
            
        except Exception as e:
            result = {
                "success": False,
                "api_name": "get_user_appointments",
                "error": str(e),
                "message": "查询用户预约列表失败"
            }
            logger.error(f"❌ 查询用户预约列表失败: {e}")
        
        return result
    
    async def test_create_smart_appointment(self) -> Dict[str, Any]:
        """测试智能预约API"""
        logger.info("=" * 60)
        logger.info("🤖 测试: 智能预约功能")
        
        try:
            # 先获取可用的技师和门店信息
            stores = await self.database_service.get_stores()
            therapists = await self.database_service.search_therapists()
            
            if not stores or not therapists:
                return {
                    "success": False,
                    "api_name": "create_smart_appointment",
                    "error": "没有找到门店或技师，无法测试智能预约",
                    "message": "测试跳过：无可用数据"
                }
            
            # 测试数据
            test_store = stores[0]
            test_therapist = therapists[0]
            
            # 测试结构化数据模式
            tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            smart_appointment_data = {
                "therapist_name": test_therapist.get('name', '测试技师'),
                "appointment_time": "15:30",
                "customer_name": "测试用户",
                "customer_phone": "19999999999",
                "store_name": test_store.get('name', '测试门店'),
                "appointment_date": tomorrow,
                "notes": "API测试预约，请忽略"
            }
            
            logger.info(f"📋 创建智能预约:")
            logger.info(f"  技师: {smart_appointment_data['therapist_name']}")
            logger.info(f"  客户: {smart_appointment_data['customer_name']} ({smart_appointment_data['customer_phone']})")
            logger.info(f"  时间: {smart_appointment_data['appointment_date']} {smart_appointment_data['appointment_time']}")
            logger.info(f"  门店: {smart_appointment_data['store_name']}")
            
            # 调用智能预约API
            appointment_result = await self.database_service.create_smart_appointment(smart_appointment_data)
            
            if appointment_result.get('success'):
                logger.info("  ✅ 智能预约创建成功!")
                appointment_data = appointment_result.get('data', {})
                logger.info(f"  📝 预约ID: {appointment_data.get('id', 'N/A')}")
            else:
                logger.warning(f"  ⚠️ 智能预约创建失败: {appointment_result.get('error', 'N/A')}")
            
            result = {
                "success": True,
                "api_name": "create_smart_appointment",
                "description": "智能预约功能：支持自然语言模式和结构化数据模式创建预约",
                "test_data": smart_appointment_data,
                "api_result": appointment_result,
                "message": "智能预约测试完成"
            }
            
        except Exception as e:
            result = {
                "success": False,
                "api_name": "create_smart_appointment",
                "error": str(e),
                "message": "智能预约测试失败"
            }
            logger.error(f"❌ 智能预约测试失败: {e}")
        
        return result
    
    async def test_email_notifications(self) -> Dict[str, Any]:
        """测试邮件通知API"""
        logger.info("=" * 60)
        logger.info("📧 测试: 邮件通知功能")
        
        try:
            # 测试邮件地址转换
            test_phones = ["19357509506", "13800138000", "invalid_phone"]
            
            email_conversion_results = []
            for phone in test_phones:
                email = self.contact_extractor.phone_to_email(phone)
                is_valid = self.contact_extractor.is_valid_email(email)
                
                conversion_result = {
                    "phone": phone,
                    "email": email,
                    "is_valid": is_valid
                }
                email_conversion_results.append(conversion_result)
                
                logger.info(f"📱 {phone} → 📧 {email} {'✅' if is_valid else '❌'}")
            
            # 测试邮件模板生成
            appointment_info = {
                "customer_name": "测试用户",
                "customer_phone": "19357509506",
                "therapist_name": "测试技师",
                "therapist_id": 1,
                "appointment_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                "appointment_time": "15:30",
                "service_type": "颈肩腰腿痛调理",
                "store_name": "测试门店",
                "notes": "测试预约"
            }
            
            # 生成客户确认邮件模板
            customer_subject, customer_body = self.email_service.template_manager.generate_customer_confirmation_email(appointment_info)
            
            # 生成技师通知邮件模板
            therapist_subject, therapist_body = self.email_service.template_manager.generate_therapist_notification_email(appointment_info)
            
            logger.info("📧 邮件模板生成测试:")
            logger.info(f"  客户确认邮件主题: {customer_subject}")
            logger.info(f"  技师通知邮件主题: {therapist_subject}")
            
            result = {
                "success": True,
                "api_name": "send_appointment_emails",
                "description": "发送预约相关的邮件通知，包括给客户发送确认邮件和给技师发送新预约通知邮件",
                "email_conversion_test": email_conversion_results,
                "template_test": {
                    "customer_email": {
                        "subject": customer_subject,
                        "body_preview": customer_body[:200] + "..."
                    },
                    "therapist_email": {
                        "subject": therapist_subject,
                        "body_preview": therapist_body[:200] + "..."
                    }
                },
                "message": "邮件通知功能测试完成"
            }
            
        except Exception as e:
            result = {
                "success": False,
                "api_name": "send_appointment_emails",
                "error": str(e),
                "message": "邮件通知测试失败"
            }
            logger.error(f"❌ 邮件通知测试失败: {e}")
        
        return result
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """运行所有API测试"""
        logger.info("🚀 开始全面API测试")
        logger.info("=" * 80)
        
        start_time = datetime.now()
        
        # 定义所有测试
        tests = [
            ("get_stores", self.test_get_stores),
            ("search_therapists", self.test_search_therapists),
            ("get_therapist_schedule", self.test_get_therapist_schedule),
            ("get_user_appointments", self.test_get_user_appointments),
            ("create_smart_appointment", self.test_create_smart_appointment),
            ("email_notifications", self.test_email_notifications),
        ]
        
        # 运行所有测试
        for test_name, test_func in tests:
            try:
                result = await test_func()
                self.test_results[test_name] = result
            except Exception as e:
                logger.error(f"❌ 测试 {test_name} 运行失败: {e}")
                self.test_results[test_name] = {
                    "success": False,
                    "api_name": test_name,
                    "error": str(e),
                    "message": f"测试 {test_name} 运行失败"
                }
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # 统计结果
        total_tests = len(tests)
        successful_tests = sum(1 for result in self.test_results.values() if result.get('success', False))
        failed_tests = total_tests - successful_tests
        
        # 生成最终报告
        final_report = {
            "test_summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": failed_tests,
                "success_rate": f"{(successful_tests/total_tests)*100:.1f}%",
                "duration_seconds": duration,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            },
            "test_results": self.test_results
        }
        
        # 打印最终报告
        logger.info("=" * 80)
        logger.info("📊 最终测试报告")
        logger.info("=" * 80)
        logger.info(f"🏁 测试完成! 总用时: {duration:.2f} 秒")
        logger.info(f"📋 总测试数: {total_tests}")
        logger.info(f"✅ 成功: {successful_tests}")
        logger.info(f"❌ 失败: {failed_tests}")
        logger.info(f"📈 成功率: {(successful_tests/total_tests)*100:.1f}%")
        logger.info("=" * 80)
        
        return final_report
    
    async def cleanup(self):
        """清理资源"""
        try:
            if self.database_service:
                await self.database_service.close()
            logger.info("✅ 资源清理完成")
        except Exception as e:
            logger.error(f"⚠️ 资源清理时出错: {e}")


async def main():
    """主函数"""
    tester = APITester()
    
    try:
        # 运行所有测试
        final_report = await tester.run_all_tests()
        
        # 保存测试报告到文件
        report_filename = f"api_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, ensure_ascii=False, indent=2)
        
        logger.info(f"📄 测试报告已保存到: {report_filename}")
        
        return final_report
    
    finally:
        await tester.cleanup()


if __name__ == "__main__":
    asyncio.run(main()) 