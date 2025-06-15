#!/usr/bin/env python3
"""
测试新的预约系统API接口
验证所有Function Call是否与新的API规范同步
"""

import asyncio
import json
from datetime import datetime, timedelta
import aiohttp
from typing import Optional, List, Dict, Any

class DatabaseAPIService:
    """数据库API服务类"""
    
    def __init__(self, base_url: str = "http://emagen.323424.xyz/api"):
        self.base_url = base_url
    
    async def _make_get_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """发送HTTP GET请求到API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        error_text = await response.text()
                        print(f"API错误 {response.status}: {error_text}")
                        raise Exception(f"API错误 {response.status}: {error_text}")
        except Exception as e:
            print(f"GET请求失败 {url}: {e}")
            raise
    
    async def _make_post_request(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """发送HTTP POST请求到API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status in [200, 201]:
                        result = await response.json()
                        return result
                    else:
                        error_text = await response.text()
                        print(f"API错误 {response.status}: {error_text}")
                        raise Exception(f"API错误 {response.status}: {error_text}")
        except Exception as e:
            print(f"POST请求失败 {url}: {e}")
            raise
    
    async def _make_delete_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """发送HTTP DELETE请求到API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.delete(url, params=params) as response:
                    if response.status in [200, 204]:
                        if response.content_type == 'application/json':
                            result = await response.json()
                            return result
                        else:
                            return {"success": True, "message": "删除成功"}
                    else:
                        error_text = await response.text()
                        print(f"API错误 {response.status}: {error_text}")
                        raise Exception(f"API错误 {response.status}: {error_text}")
        except Exception as e:
            print(f"DELETE请求失败 {url}: {e}")
            raise
    
    async def create_appointment(self, username: str, customer_name: str, customer_phone: str, 
                               therapist_id: int, appointment_date: str, appointment_time: str,
                               service_type: Optional[str] = None, notes: Optional[str] = None) -> Dict[str, Any]:
        """创建预约"""
        data = {
            "username": username,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "therapist_id": therapist_id,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time
        }
        
        if service_type:
            data["service_type"] = service_type
        if notes:
            data["notes"] = notes
        
        try:
            result = await self._make_post_request("/appointments", data)
            return result
        except Exception as e:
            print(f"创建预约失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "预约创建失败"
            }
    
    async def get_user_appointments(self, username: str) -> List[Dict[str, Any]]:
        """查看用户的预约列表"""
        try:
            result = await self._make_get_request(f"/appointments/user/{username}")
            if isinstance(result, dict) and "appointments" in result:
                return result["appointments"]
            elif isinstance(result, list):
                return result
            return []
        except Exception as e:
            print(f"获取用户预约失败: {e}")
            return []
    
    async def get_appointment_details(self, appointment_id: int) -> Optional[Dict[str, Any]]:
        """获取预约详情"""
        try:
            result = await self._make_get_request(f"/appointments/{appointment_id}")
            if isinstance(result, dict) and "appointment" in result:
                return result["appointment"]
            return result
        except Exception as e:
            print(f"获取预约详情失败: {e}")
            return None
    
    async def cancel_appointment(self, appointment_id: int, username: str) -> Dict[str, Any]:
        """取消预约"""
        params = {"username": username}
        
        try:
            result = await self._make_delete_request(f"/appointments/{appointment_id}", params)
            return result
        except Exception as e:
            print(f"取消预约失败: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "预约取消失败"
            }
    
    async def query_therapist_availability(self, therapist_id: int, date: str) -> Dict[str, Any]:
        """查询技师可用时间"""
        params = {"date": date}
        
        try:
            result = await self._make_get_request(f"/appointments/availability/{therapist_id}", params)
            return result
        except Exception as e:
            print(f"查询技师可用时间失败: {e}")
            return {"available_times": [], "booked_times": []}
    
    async def search_therapists(self, therapist_name: Optional[str] = None, 
                               store_name: Optional[str] = None,
                               service_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """查询技师（多种方式）"""
        params = {"action": "query_schedule"}
        
        if therapist_name:
            params["therapist_name"] = therapist_name
        if store_name:
            params["store_name"] = store_name
        if service_type:
            params["service_type"] = service_type
        
        try:
            # 这个API返回空字符串时表示没有数据
            result = await self._make_get_request("/therapists", params)
            if result == "" or result is None:
                return []
            if isinstance(result, list):
                return result
            return []
        except Exception as e:
            print(f"搜索技师失败: {e}")
            return []
    
    async def get_stores(self) -> List[Dict[str, Any]]:
        """获取门店列表"""
        try:
            result = await self._make_get_request("/stores")
            if isinstance(result, list):
                return result
            return result.get("stores", [])
        except Exception as e:
            print(f"获取门店列表失败: {e}")
            return []

async def test_new_api_endpoints():
    """测试新的API端点"""
    print("🔍 测试新的预约系统API接口...")
    
    # 初始化数据库服务
    db_service = DatabaseAPIService()
    
    try:
        # 1. 测试获取门店列表
        print("\n1️⃣ 测试获取门店列表")
        stores = await db_service.get_stores()
        print(f"   门店数量: {len(stores)}")
        if stores:
            print(f"   门店示例: {json.dumps(stores[0], ensure_ascii=False, indent=2)}")
        
        # 2. 测试搜索技师（按门店）
        print("\n2️⃣ 测试搜索技师（按门店）")
        therapists = await db_service.search_therapists(store_name="莘庄店")
        print(f"   找到 {len(therapists)} 个技师")
        if therapists:
            print(f"   技师示例: {json.dumps(therapists[0], ensure_ascii=False, indent=2)}")
        
        # 3. 测试搜索技师（按技师名）
        print("\n3️⃣ 测试搜索技师（按技师名）")
        therapists = await db_service.search_therapists(therapist_name="陈老师")
        print(f"   找到 {len(therapists)} 个技师")
        
        # 4. 测试搜索技师（按服务类型）
        print("\n4️⃣ 测试搜索技师（按服务类型）")
        therapists = await db_service.search_therapists(service_type="艾灸")
        print(f"   找到 {len(therapists)} 个技师")
        
        # 5. 测试查询技师可用时间
        print("\n5️⃣ 测试查询技师可用时间")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        availability = await db_service.query_therapist_availability(1, tomorrow)
        print(f"   技师ID 1 在 {tomorrow} 的可用时段:")
        print(f"   - 可用时间: {availability.get('available_times', [])}")
        print(f"   - 已预约时间: {availability.get('booked_times', [])}")
        
        # 6. 测试创建预约
        print("\n6️⃣ 测试创建预约")
        create_result = await db_service.create_appointment(
            username="TEST_USER_001",
            customer_name="测试用户",
            customer_phone="13800138000", 
            therapist_id=1,
            appointment_date=tomorrow,
            appointment_time="14:00",
            service_type="经络疏通",
            notes="API测试预约"
        )
        print(f"   创建预约结果: {json.dumps(create_result, ensure_ascii=False, indent=2)}")
        
        # 7. 测试查看用户预约
        print("\n7️⃣ 测试查看用户预约")
        user_appointments = await db_service.get_user_appointments("TEST_USER_001")
        print(f"   用户预约数量: {len(user_appointments)}")
        if user_appointments:
            print(f"   最新预约: {json.dumps(user_appointments[0], ensure_ascii=False, indent=2)}")
        
        # 8. 测试查看预约详情
        if user_appointments:
            print("\n8️⃣ 测试查看预约详情")
            appointment_id = user_appointments[0].get("id")
            if appointment_id:
                details = await db_service.get_appointment_details(appointment_id)
                print(f"   预约详情: {json.dumps(details, ensure_ascii=False, indent=2)}")
        
        print("\n✅ 新API接口测试完成")
        
    except Exception as e:
        print(f"❌ API测试失败: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """主测试函数"""
    print("🚀 开始测试更新后的预约系统API接口\n")
    print("=" * 60)
    
    # 测试数据库API
    await test_new_api_endpoints()
    
    print("\n" + "=" * 60)
    print("🎉 所有测试完成！")

if __name__ == "__main__":
    asyncio.run(main())