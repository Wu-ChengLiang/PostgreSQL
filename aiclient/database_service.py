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
    
    def __init__(self, base_url: str = "http://emagen.323424.xyz"):
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
        url = f"{self.base_url}/api/appointments"
        
        try:
            async with self.session.post(url, json=appointment_data) as response:
                result = await response.json()
                if response.status == 201:
                    self.logger.info(f"预约创建成功: {result.get('id', 'N/A')}")
                    return {"success": True, "data": result}
                else:
                    self.logger.error(f"预约创建失败: {result}")
                    return {"success": False, "error": result.get("message", "未知错误")}
        except Exception as e:
            self.logger.error(f"预约创建异常: {e}")
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


