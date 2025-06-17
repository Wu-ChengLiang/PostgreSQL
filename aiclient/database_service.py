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
        self.api_base = f"{self.base_url}/api/v1"  # 使用v1版本API
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
        url = f"{self.api_base}{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    # 处理新API结构的响应
                    if isinstance(data, dict):
                        if 'success' in data and data['success'] and 'data' in data:
                            # 新API格式：{"success": true, "data": {...}}
                            return data['data']
                        elif 'data' in data:
                            # 旧API格式兼容
                            return data['data']
                    return data if isinstance(data, list) else []
                else:
                    self.logger.error(f"API请求失败: {url}, 状态码: {response.status}")
                    return []
        except Exception as e:
            self.logger.error(f"API请求异常: {url}, 错误: {e}")
            return []
    
    async def _make_post_request(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        """
        发送POST请求到API服务器
        
        Args:
            endpoint: API端点
            data: 请求数据
            
        Returns:
            API响应数据
        """
        await self._ensure_session()
        url = f"{self.api_base}{endpoint}"
        
        try:
            async with self.session.post(url, json=data) as response:
                result = await response.json()
                if response.status == 200:
                    return result
                else:
                    self.logger.error(f"POST请求失败: {url}, 状态码: {response.status}, 响应: {result}")
                    return {"success": False, "error": result}
        except Exception as e:
            self.logger.error(f"POST请求异常: {url}, 错误: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_stores(self) -> List[Dict[str, Any]]:
        """
        获取所有门店信息
        
        Returns:
            门店列表
        """
        self.logger.info("查询门店列表")
        stores_data = await self._make_request("/client/stores")
        
        # 处理新API结构
        if isinstance(stores_data, dict) and 'stores' in stores_data:
            stores = stores_data['stores']
        elif isinstance(stores_data, list):
            stores = stores_data
        else:
            stores = []
            
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
        therapists_data = await self._make_request("/client/therapists/search", params)
        
        # 处理新API结构 - 调试输出
        self.logger.info(f"原始响应数据: {therapists_data}")
        
        # 处理新API结构
        if isinstance(therapists_data, dict) and 'therapists' in therapists_data:
            therapists = therapists_data['therapists']
        elif isinstance(therapists_data, list):
            therapists = therapists_data
        else:
            therapists = []
            
        self.logger.info(f"查询到 {len(therapists)} 个技师")
        return therapists
    
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
        therapists_data = await self._make_request("/client/therapists/search", params)
        
        # 调试输出
        self.logger.info(f"原始响应数据类型: {type(therapists_data)}")
        self.logger.info(f"原始响应数据: {therapists_data}")
        
        # 处理新API结构
        if isinstance(therapists_data, dict) and 'therapists' in therapists_data:
            therapists = therapists_data['therapists']
        elif isinstance(therapists_data, list):
            therapists = therapists_data
        else:
            therapists = []
            
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
        schedule = await self._make_request(f"/client/therapists/{therapist_id}/schedule", params)
        
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
        # 使用新的技师排班API
        schedule_list = []
        current_date = datetime.strptime(start_date, '%Y-%m-%d')
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
        
        while current_date <= end_date_obj:
            date_str = current_date.strftime('%Y-%m-%d')
            schedule = await self.get_therapist_schedule(technician_id, date_str)
            schedule_list.append(schedule)
            current_date += timedelta(days=1)
        
        self.logger.info(f"查询到 {len(schedule_list)} 条排班记录")
        return schedule_list
    
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
        # 如果有技师ID，直接查询技师排班
        if technician_id:
            schedule = await self.get_therapist_schedule(technician_id, date)
            return schedule.get('available_times', [])
        
        # 否则查询门店的所有技师
        if store_id:
            therapists = await self.search_therapists(store_id=store_id)
            available_slots = []
            for therapist in therapists:
                schedule = await self.get_therapist_schedule(therapist['id'], date)
                for time_slot in schedule.get('available_times', []):
                    available_slots.append({
                        'therapist_id': therapist['id'],
                        'therapist_name': therapist['name'],
                        'time': time_slot,
                        'date': date
                    })
            return available_slots
        
        return []
    
    async def create_appointment(self, appointment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建预约记录
        
        Args:
            appointment_data: 预约数据
            
        Returns:
            创建结果
        """
        self.logger.info(f"创建预约: {appointment_data}")
        result = await self._make_post_request("/client/appointments", appointment_data)
        
        if result.get('success'):
            self.logger.info(f"预约创建成功: {result.get('data', {}).get('id', 'N/A')}")
            return {"success": True, "data": result.get('data', {})}
        else:
            self.logger.error(f"预约创建失败: {result}")
            return {"success": False, "error": result.get("error", {}).get("message", "未知错误")}
    
    async def create_smart_appointment(self, smart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建智能预约记录 - 直接调用智能预约API
        
        Args:
            smart_data: 智能预约数据 (therapist_name, appointment_time等)
            
        Returns:
            创建结果
        """
        self.logger.info(f"发送智能预约请求: {smart_data}")
        result = await self._make_post_request("/client/appointments/smart", smart_data)
        
        if result.get('success'):
            self.logger.info(f"智能预约创建成功: {result.get('data', {}).get('id', 'N/A')}")
            return {
                "success": True, 
                "data": result.get('data', {}),
                "message": result.get('message', '智能预约创建成功')
            }
        else:
            self.logger.error(f"智能预约创建失败: {result}")
            return {"success": False, "error": result.get("error", {}).get("message", "未知错误")}
    
    async def get_user_appointments(self, phone: str) -> List[Dict[str, Any]]:
        """
        获取用户预约列表
        
        Args:
            phone: 用户电话号码
            
        Returns:
            预约列表
        """
        params = {'phone': phone}
        self.logger.info(f"查询用户预约: {phone}")
        appointments_data = await self._make_request("/client/appointments/user", params)
        
        # 处理新API结构
        if isinstance(appointments_data, dict) and 'appointments' in appointments_data:
            appointments = appointments_data['appointments']
        elif isinstance(appointments_data, list):
            appointments = appointments_data
        else:
            appointments = []
            
        self.logger.info(f"查询到 {len(appointments)} 个预约记录")
        return appointments
    
    async def get_appointment_details(self, appointment_id: int) -> Dict[str, Any]:
        """
        获取预约详情
        
        Args:
            appointment_id: 预约ID
            
        Returns:
            预约详情
        """
        await self._ensure_session()
        url = f"{self.api_base}/admin/appointments/{appointment_id}"
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('success') and result.get('data'):
                        return result['data']
                    return result
                else:
                    self.logger.error(f"获取预约详情失败: {appointment_id}")
                    return {}
        except Exception as e:
            self.logger.error(f"获取预约详情异常: {e}")
            return {}
    
    async def cancel_appointment(self, appointment_id: int, phone: str) -> Dict[str, Any]:
        """
        取消预约
        
        Args:
            appointment_id: 预约ID
            phone: 用户电话（用于验证）
            
        Returns:
            取消结果
        """
        await self._ensure_session()
        url = f"{self.api_base}/client/appointments/{appointment_id}"
        data = {"phone": phone}
        
        try:
            async with self.session.delete(url, json=data) as response:
                result = await response.json()
                if response.status == 200 and result.get('success'):
                    self.logger.info(f"预约取消成功: {appointment_id}")
                    return {"success": True, "data": result.get('data', {})}
                else:
                    self.logger.error(f"预约取消失败: {result}")
                    return {"success": False, "error": result.get("error", {}).get("message", "取消失败")}
        except Exception as e:
            self.logger.error(f"预约取消异常: {e}")
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


