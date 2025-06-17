"""
数据库API服务模块
为AI功能调用提供数据库查询接口
"""

import aiohttp
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class DatabaseAPIService:
    """数据库API服务类 - 为AI功能调用提供数据接口"""
    
    def __init__(self, base_url: str = "http://localhost:3001"):
        """
        初始化数据库API服务
        
        Args:
            base_url: API服务器基础URL
        """
        self.base_url = base_url.rstrip('/')
        self.session = None
        self.logger = logger.getChild(self.__class__.__name__)
    
    async def _ensure_session(self):
        """确保HTTP会话存在"""
        if not self.session:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            )
    
    async def _make_request(self, endpoint: str, params: Dict = None) -> List[Dict[str, Any]]:
        """
        发送HTTP请求到API服务器
        
        Args:
            endpoint: API端点
            params: 查询参数
            
        Returns:
            API响应数据
        """
        await self._ensure_session()
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, dict) and 'data' in data:
                        return data['data']
                    return data if isinstance(data, list) else []
                else:
                    self.logger.error(f"API请求失败: {url}, 状态码: {response.status}")
                    return []
        except Exception as e:
            self.logger.error(f"API请求异常: {url}, 错误: {e}")
            return []
    
    async def get_stores(self) -> List[Dict[str, Any]]:
        """
        获取所有门店信息
        
        Returns:
            门店列表
        """
        self.logger.info("查询门店列表")
        stores = await self._make_request("/api/stores")
        self.logger.info(f"查询到 {len(stores)} 个门店")
        return stores
    
    async def search_technicians(self, store_id: Optional[int] = None, 
                               name: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        搜索技师信息
        
        Args:
            store_id: 门店ID (可选)
            name: 技师姓名 (可选)
            
        Returns:
            技师列表
        """
        params = {}
        if store_id:
            params['store_id'] = store_id
        if name:
            params['name'] = name
            
        self.logger.info(f"搜索技师: {params}")
        technicians = await self._make_request("/api/therapists", params)
        self.logger.info(f"查询到 {len(technicians)} 个技师")
        return technicians
    
    async def search_therapists(self, store_name: Optional[str] = None,
                              therapist_name: Optional[str] = None,
                              store_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        搜索技师信息（新版本接口）
        
        Args:
            store_name: 门店名称 (可选)
            therapist_name: 技师姓名 (可选)
            store_id: 门店ID (可选)
            
        Returns:
            技师列表
        """
        # 如果有门店名称，先查找门店ID
        if store_name and not store_id:
            stores = await self.get_stores()
            matching_stores = [s for s in stores if store_name in s.get('name', '')]
            if matching_stores:
                store_id = matching_stores[0]['id']
        
        params = {}
        if store_id:
            params['store_id'] = store_id
        if therapist_name:
            params['name'] = therapist_name
            
        self.logger.info(f"搜索技师: {params}")
        therapists = await self._make_request("/api/client/therapists/search", params)
        self.logger.info(f"查询到 {len(therapists)} 个技师")
        return therapists
    
    async def get_therapist_schedule(self, therapist_id: int, date: str) -> Dict[str, Any]:
        """
        获取技师排班信息
        
        Args:
            therapist_id: 技师ID
            date: 查询日期，格式: YYYY-MM-DD
            
        Returns:
            排班信息
        """
        params = {'date': date}
        
        self.logger.info(f"查询技师排班: therapist_id={therapist_id}, date={date}")
        schedule = await self._make_request(f"/api/client/therapists/{therapist_id}/schedule", params)
        
        # 如果返回的是字典格式，提取schedule字段
        if isinstance(schedule, dict) and 'schedule' in schedule:
            schedule_data = schedule['schedule']
        elif isinstance(schedule, list):
            schedule_data = schedule
        else:
            schedule_data = schedule
        
        self.logger.info(f"获取到技师排班信息")
        return {
            "therapist_id": therapist_id,
            "date": date,
            "schedule": schedule_data,
            "available_times": self._extract_available_times(schedule_data),
            "booked_times": self._extract_booked_times(schedule_data)
        }
    
    def _extract_available_times(self, schedule_data) -> List[str]:
        """从排班数据中提取可用时间"""
        if isinstance(schedule_data, dict):
            return schedule_data.get('available_times', [])
        
        # 默认营业时间9:00-21:00
        default_times = []
        for hour in range(9, 21):
            default_times.append(f"{hour:02d}:00")
            default_times.append(f"{hour:02d}:30")
        
        return default_times
    
    def _extract_booked_times(self, schedule_data) -> List[str]:
        """从排班数据中提取已预约时间"""
        if isinstance(schedule_data, dict):
            return schedule_data.get('booked_times', [])
        
        return []
    
    async def query_technician_schedule(self, technician_id: int, 
                                       start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        查询技师排班信息
        
        Args:
            technician_id: 技师ID
            start_date: 开始日期 (YYYY-MM-DD)
            end_date: 结束日期 (YYYY-MM-DD)
            
        Returns:
            排班信息列表
        """
        params = {
            'technician_id': technician_id,
            'start_date': start_date,
            'end_date': end_date
        }
        
        self.logger.info(f"查询技师排班: {params}")
        schedule = await self._make_request("/api/schedules", params)
        self.logger.info(f"查询到 {len(schedule)} 条排班记录")
        return schedule
    
    async def query_available_appointments(self, date: str, 
                                         store_id: Optional[int] = None,
                                         technician_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        查询可用预约时间段
        
        Args:
            date: 查询日期 (YYYY-MM-DD)
            store_id: 门店ID (可选)
            technician_id: 技师ID (可选)
            
        Returns:
            可用时间段列表
        """
        params = {'date': date}
        if store_id:
            params['store_id'] = store_id
        if technician_id:
            params['technician_id'] = technician_id
            
        self.logger.info(f"查询可用预约时间: {params}")
        appointments = await self._make_request("/api/appointments/available", params)
        self.logger.info(f"查询到 {len(appointments)} 个可用时间段")
        return appointments
    
    async def create_appointment(self, appointment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建预约记录
        
        Args:
            appointment_data: 预约数据
            
        Returns:
            创建结果
        """
        await self._ensure_session()
        url = f"{self.base_url}/api/v1/client/appointments"
        
        try:
            async with self.session.post(url, json=appointment_data) as response:
                result = await response.json()
                if response.status == 200 and result.get('success'):
                    self.logger.info(f"预约创建成功: {result.get('data', {}).get('appointment_id', 'N/A')}")
                    return {"success": True, "data": result.get('data', {})}
                else:
                    self.logger.error(f"预约创建失败: {result}")
                    return {"success": False, "error": result.get("error", {}).get("message", "未知错误")}
        except Exception as e:
            self.logger.error(f"预约创建异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_smart_appointment(self, smart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建智能预约记录 - 直接调用智能预约API
        
        Args:
            smart_data: 智能预约数据 (therapist_name, appointment_time等)
            
        Returns:
            创建结果
        """
        await self._ensure_session()
        url = f"{self.base_url}/api/v1/client/appointments/smart"
        
        try:
            self.logger.info(f"发送智能预约请求: {smart_data}")
            async with self.session.post(url, json=smart_data) as response:
                result = await response.json()
                if response.status == 200 and result.get('success'):
                    self.logger.info(f"智能预约创建成功: {result.get('data', {}).get('appointment_id', 'N/A')}")
                    return {
                        "success": True, 
                        "data": result.get('data', {}),
                        "message": result.get('message', '智能预约创建成功')
                    }
                else:
                    self.logger.error(f"智能预约创建失败: {result}")
                    return {"success": False, "error": result.get("error", {}).get("message", "未知错误")}
        except Exception as e:
            self.logger.error(f"智能预约创建异常: {e}")
            return {"success": False, "error": str(e)}
    
    async def close(self):
        """关闭HTTP会话"""
        if self.session:
            await self.session.close()
            self.session = None


# 全局数据库服务实例
_db_service_instance = None

def get_database_service() -> DatabaseAPIService:
    """获取数据库服务实例（单例模式）"""
    global _db_service_instance
    if _db_service_instance is None:
        _db_service_instance = DatabaseAPIService()
    return _db_service_instance


# 为了向后兼容，提供以下函数
async def get_stores():
    """获取所有门店信息"""
    service = get_database_service()
    return await service.get_stores()

async def search_therapists(store_id: Optional[int] = None, name: Optional[str] = None):
    """搜索技师信息"""
    service = get_database_service()
    return await service.search_technicians(store_id=store_id, name=name)

async def query_available_appointments(date: str, store_id: Optional[int] = None, 
                                     technician_id: Optional[int] = None):
    """查询可用预约时间段"""
    service = get_database_service()
    return await service.query_available_appointments(
        date=date, store_id=store_id, technician_id=technician_id
    )

async def create_appointment(appointment_data: Dict[str, Any]):
    """创建预约记录"""
    service = get_database_service()
    return await service.create_appointment(appointment_data) 


