#!/usr/bin/env python3
"""
简单的API测试脚本
测试 http://emagen.323424.xyz/ 的API端点
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, Optional
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleAPITester:
    """简单的API测试类"""
    
    def __init__(self, base_url: str = "http://emagen.323424.xyz/api/v1"):
        self.base_url = base_url
        self.health_url = "http://emagen.323424.xyz/health"
        
    async def test_health_check(self) -> Dict[str, Any]:
        """测试健康检查接口"""
        print("🔍 测试健康检查接口...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.health_url) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ 健康检查成功: {data}")
                        return {"success": True, "data": data}
                    else:
                        error_text = await response.text()
                        print(f"❌ 健康检查失败 [{response.status}]: {error_text}")
                        return {"success": False, "error": error_text}
        except Exception as e:
            print(f"❌ 健康检查异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_get_stores(self) -> Dict[str, Any]:
        """测试获取门店列表"""
        print("\n🏪 测试获取门店列表...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/client/stores") as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ 门店列表获取成功:")
                        if data.get("success") and data.get("data", {}).get("stores"):
                            stores = data["data"]["stores"]
                            for store in stores[:3]:  # 显示前3个门店
                                print(f"   📍 门店: {store.get('name')} (ID: {store.get('id')})")
                                print(f"      地址: {store.get('address')}")
                                print(f"      营业时间: {store.get('business_hours')}")
                        return {"success": True, "data": data}
                    else:
                        error_text = await response.text()
                        print(f"❌ 门店列表获取失败 [{response.status}]: {error_text}")
                        return {"success": False, "error": error_text}
        except Exception as e:
            print(f"❌ 门店列表获取异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_search_therapists(self) -> Dict[str, Any]:
        """测试搜索技师"""
        print("\n👨‍⚕️ 测试搜索技师...")
        
        # 测试按专长搜索
        params = {"specialty": "按摩", "limit": 5}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/client/therapists/search", params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ 技师搜索成功:")
                        if data.get("success") and data.get("data", {}).get("therapists"):
                            therapists = data["data"]["therapists"]
                            total = data["data"].get("total", 0)
                            print(f"   找到 {total} 位技师，显示前 {len(therapists)} 位:")
                            for therapist in therapists:
                                print(f"   👨‍⚕️ {therapist.get('name')} - {therapist.get('position')}")
                                print(f"      从业经验: {therapist.get('years_of_experience')}年")
                                print(f"      专长: {therapist.get('specialties')}")
                                if therapist.get('store'):
                                    print(f"      门店: {therapist['store'].get('name')}")
                                print()
                        return {"success": True, "data": data}
                    else:
                        error_text = await response.text()
                        print(f"❌ 技师搜索失败 [{response.status}]: {error_text}")
                        return {"success": False, "error": error_text}
        except Exception as e:
            print(f"❌ 技师搜索异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_therapist_schedule(self, therapist_id: int = 1) -> Dict[str, Any]:
        """测试查询技师排班"""
        print(f"\n📅 测试查询技师 {therapist_id} 的排班...")
        
        params = {"date": "2025-01-16"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/client/therapists/{therapist_id}/schedule", params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ 技师排班查询成功:")
                        if data.get("success") and data.get("data", {}).get("schedule"):
                            schedule = data["data"]["schedule"]
                            print(f"   日期: {schedule.get('date')}")
                            print(f"   营业时间: {schedule.get('business_hours')}")
                            available_times = schedule.get('available_times', [])
                            print(f"   可用时间段 ({len(available_times)}个): {available_times}")
                        return {"success": True, "data": data}
                    else:
                        error_text = await response.text()
                        print(f"❌ 技师排班查询失败 [{response.status}]: {error_text}")
                        return {"success": False, "error": error_text}
        except Exception as e:
            print(f"❌ 技师排班查询异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_create_appointment(self, therapist_id: int = 1) -> Dict[str, Any]:
        """测试创建预约"""
        print(f"\n📝 测试创建预约（技师ID: {therapist_id}）...")
        
        appointment_data = {
            "therapist_id": therapist_id,
            "user_name": "测试用户",
            "user_phone": "13800138000",
            "appointment_date": "2025-01-16",
            "appointment_time": "10:00",
            "notes": "API测试预约"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/client/appointments", json=appointment_data) as response:
                    if response.status in [200, 201]:
                        data = await response.json()
                        print(f"✅ 预约创建成功:")
                        if data.get("success") and data.get("data"):
                            appt_data = data["data"]
                            print(f"   预约ID: {appt_data.get('appointment_id')}")
                            print(f"   确认码: {appt_data.get('confirmation_code')}")
                        return {"success": True, "data": data}
                    else:
                        error_text = await response.text()
                        print(f"❌ 预约创建失败 [{response.status}]: {error_text}")
                        return {"success": False, "error": error_text}
        except Exception as e:
            print(f"❌ 预约创建异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_get_user_appointments(self) -> Dict[str, Any]:
        """测试查询用户预约"""
        print("\n📋 测试查询用户预约...")
        
        params = {"phone": "13800138000"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/client/appointments/user", params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ 用户预约查询成功:")
                        if data.get("success") and data.get("data", {}).get("appointments"):
                            appointments = data["data"]["appointments"]
                            print(f"   找到 {len(appointments)} 个预约:")
                            for appt in appointments:
                                print(f"   📝 预约ID: {appt.get('id')}")
                                print(f"      技师: {appt.get('therapist', {}).get('name')}")
                                print(f"      时间: {appt.get('appointment_date')} {appt.get('appointment_time')}")
                                print(f"      状态: {appt.get('status')}")
                                print()
                        return {"success": True, "data": data}
                    else:
                        error_text = await response.text()
                        print(f"❌ 用户预约查询失败 [{response.status}]: {error_text}")
                        return {"success": False, "error": error_text}
        except Exception as e:
            print(f"❌ 用户预约查询异常: {e}")
            return {"success": False, "error": str(e)}

async def main():
    """主测试函数"""
    print("🌟 名医堂数据平台2.0 API 简单测试")
    print("=" * 60)
    print(f"测试地址: http://emagen.323424.xyz/")
    print("=" * 60)
    
    tester = SimpleAPITester()
    
    # 存储测试结果
    results = {}
    
    try:
        # 1. 健康检查
        results['health'] = await tester.test_health_check()
        
        # 2. 获取门店列表
        results['stores'] = await tester.test_get_stores()
        
        # 3. 搜索技师
        results['therapists'] = await tester.test_search_therapists()
        
        # 获取第一个技师的ID（如果搜索成功）
        therapist_id = 1  # 默认值
        if (results['therapists'].get('success') and 
            results['therapists'].get('data', {}).get('data', {}).get('therapists')):
            therapists = results['therapists']['data']['data']['therapists']
            if therapists:
                therapist_id = therapists[0].get('id', 1)
                print(f"\n💡 使用技师ID: {therapist_id} ({therapists[0].get('name', '未知')})")
        
        # 4. 查询技师排班（使用实际技师ID）
        results['schedule'] = await tester.test_therapist_schedule(therapist_id)
        
        # 5. 创建预约（使用实际技师ID）
        results['create_appointment'] = await tester.test_create_appointment(therapist_id)
        
        # 6. 查询用户预约
        results['user_appointments'] = await tester.test_get_user_appointments()
        
        # 汇总测试结果
        print("\n" + "=" * 60)
        print("📊 测试结果汇总:")
        print("=" * 60)
        
        success_count = 0
        total_count = len(results)
        
        for test_name, result in results.items():
            status = "✅ 通过" if result.get("success") else "❌ 失败"
            print(f"{test_name:20} : {status}")
            if result.get("success"):
                success_count += 1
        
        print("-" * 60)
        print(f"总计: {success_count}/{total_count} 测试通过")
        
        if success_count == total_count:
            print("🎉 所有测试通过！API服务运行正常")
        else:
            print("⚠️  部分测试失败，请检查API服务状态")
        
    except Exception as e:
        logger.error(f"测试过程中发生错误: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 