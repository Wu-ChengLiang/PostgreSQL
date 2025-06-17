#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试门店匹配修复效果
"""

import asyncio
import aiohttp
import json

async def test_store_matching():
    """测试门店匹配逻辑"""
    
    # 测试用例1：从静安寺店预约马老师
    test_case_1 = {
        "therapist_name": "马老师",
        "appointment_time": "19:30",
        "customer_name": "门店匹配测试用户1",
        "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
        "notes": "测试静安寺店门店匹配"
    }
    
    # 测试用例2：从静安寺店预约不存在的技师（应该使用该店其他技师）
    test_case_2 = {
        "therapist_name": "不存在的技师",
        "appointment_time": "20:00",
        "customer_name": "门店匹配测试用户2", 
        "store_name": "名医堂·颈肩腰腿特色调理（静安寺店）",
        "notes": "测试静安寺店默认技师分配"
    }
    
    # 测试用例3：从关山路店预约周老师
    test_case_3 = {
        "therapist_name": "周老师",
        "appointment_time": "15:30",
        "customer_name": "门店匹配测试用户3",
        "store_name": "名医堂·颈肩腰腿特色调理（关山路店）",
        "notes": "测试关山路店门店匹配"
    }
    
    test_cases = [
        ("静安寺店-马老师", test_case_1),
        ("静安寺店-不存在技师", test_case_2),
        ("关山路店-周老师", test_case_3)
    ]
    
    print("🧪 开始测试门店匹配修复效果")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        for test_name, test_data in test_cases:
            print(f"\n📋 测试: {test_name}")
            print(f"请求数据: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
            
            try:
                async with session.post(
                    "http://localhost:3001/api/v1/client/appointments/smart",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        result = await response.json()
                        
                        if result.get("success"):
                            data = result["data"]
                            matched_therapist = data.get("matched_therapist", {})
                            
                            print(f"✅ 预约成功!")
                            print(f"   预约ID: {data.get('appointment_id')}")
                            print(f"   匹配技师: {matched_therapist.get('name')} (ID: {matched_therapist.get('id')})")
                            print(f"   技师门店: {matched_therapist.get('store_name', '未知')}")
                            print(f"   消息: {result.get('message')}")
                            
                            # 检查门店匹配是否正确
                            expected_store = test_data["store_name"]
                            actual_store = matched_therapist.get('store_name', '')
                            
                            if expected_store in actual_store or actual_store in expected_store:
                                print(f"   🎯 门店匹配: ✅ 正确")
                            else:
                                print(f"   🎯 门店匹配: ⚠️ 期望:{expected_store}, 实际:{actual_store}")
                        else:
                            print(f"❌ 预约失败: {result.get('error')}")
                    else:
                        text = await response.text()
                        print(f"❌ HTTP错误 {response.status}: {text}")
                        
            except Exception as e:
                print(f"❌ 测试异常: {e}")
            
            # 短暂等待
            await asyncio.sleep(1)
    
    print("\n" + "=" * 50)
    print("✅ 门店匹配测试完成")

if __name__ == "__main__":
    asyncio.run(test_store_matching()) 