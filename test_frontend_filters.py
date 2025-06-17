#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试前端过滤器行为和API调用
"""

import asyncio
import aiohttp

async def test_appointment_api_with_different_filters():
    """测试不同过滤器参数的API响应"""
    print("🔍 测试预约API不同过滤器的响应")
    print("=" * 50)
    
    # 先登录获取token
    async with aiohttp.ClientSession() as session:
        login_data = {"username": "admin", "password": "admin123"}
        
        async with session.post(
            "http://localhost:3001/api/v1/admin/login",
            json=login_data
        ) as response:
            if response.status == 200:
                result = await response.json()
                token = result["data"]["token"]
                print(f"✅ 登录成功")
            else:
                print("❌ 登录失败")
                return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 测试场景
        test_scenarios = [
            ("不带任何过滤器", ""),
            ("只过滤状态：pending", "status=pending"),
            ("只过滤今天日期", "date=2025-06-17"),
            ("过滤2023-10-12（预约23的日期）", "date=2023-10-12"),
            ("过滤状态：pending + 今天", "status=pending&date=2025-06-17"),
            ("过滤状态：pending + 2023-10-12", "status=pending&date=2023-10-12"),
        ]
        
        for scenario_name, params in test_scenarios:
            print(f"\n📋 {scenario_name}")
            url = f"http://localhost:3001/api/v1/admin/appointments"
            if params:
                url += f"?{params}"
            print(f"   URL: {url}")
            
            try:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            appointments = result["data"]["appointments"]
                            total = result["data"]["total"]
                            print(f"   ✅ 成功: 总数 {total}, 当前页 {len(appointments)}条")
                            
                            # 显示前3条预约的关键信息
                            for i, apt in enumerate(appointments[:3]):
                                print(f"     {i+1}. ID:{apt['id']} 日期:{apt.get('appointment_date')} 状态:{apt.get('status')}")
                            
                            # 特别检查是否包含预约23
                            apt_23 = next((apt for apt in appointments if apt['id'] == 23), None)
                            if apt_23:
                                print(f"     🎯 找到预约23: 日期={apt_23.get('appointment_date')} 状态={apt_23.get('status')}")
                            else:
                                print(f"     ⚠️ 未找到预约23")
                        else:
                            print(f"   ❌ API失败: {result.get('error')}")
                    else:
                        text = await response.text()
                        print(f"   ❌ HTTP错误 {response.status}: {text}")
                        
            except Exception as e:
                print(f"   ❌ 请求异常: {e}")

async def test_appointment_list_pagination():
    """测试预约列表分页"""
    print(f"\n📄 测试预约列表分页")
    print("=" * 30)
    
    async with aiohttp.ClientSession() as session:
        # 先登录
        login_data = {"username": "admin", "password": "admin123"}
        async with session.post(
            "http://localhost:3001/api/v1/admin/login",
            json=login_data
        ) as response:
            result = await response.json()
            token = result["data"]["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 测试分页参数
        for page in [1, 2]:
            url = f"http://localhost:3001/api/v1/admin/appointments?page={page}&limit=10"
            print(f"\n📋 第{page}页 (每页10条)")
            
            try:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            appointments = result["data"]["appointments"]
                            total = result["data"]["total"]
                            page_info = result["data"]
                            
                            print(f"   ✅ 总数:{total} 当前页:{len(appointments)}条")
                            print(f"   📊 分页信息: 页码={page_info.get('page')} 每页={page_info.get('limit')} 总页数={page_info.get('totalPages')}")
                            
                            # 显示该页的预约ID
                            ids = [str(apt['id']) for apt in appointments]
                            print(f"   📝 预约ID: {', '.join(ids)}")
                            
                            # 检查是否包含预约23
                            if 23 in [apt['id'] for apt in appointments]:
                                print(f"     🎯 预约23在第{page}页!")
                        else:
                            print(f"   ❌ 失败: {result.get('error')}")
                    else:
                        print(f"   ❌ HTTP错误: {response.status}")
                        
            except Exception as e:
                print(f"   ❌ 异常: {e}")

async def main():
    """主函数"""
    print("🧪 前端过滤器和API测试")
    print("=" * 50)
    
    # 1. 测试不同过滤器参数
    await test_appointment_api_with_different_filters()
    
    # 2. 测试分页
    await test_appointment_list_pagination()
    
    print("\n" + "=" * 50)
    print("📋 测试总结:")
    print("1. 如果预约23在 date=2023-10-12 的结果中，说明日期过滤器工作正常")
    print("2. 如果预约23不在 '不带任何过滤器' 的结果中，可能是分页问题") 
    print("3. 前端应该检查过滤器的默认值设置")

if __name__ == "__main__":
    asyncio.run(main()) 