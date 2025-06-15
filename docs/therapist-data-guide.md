# 技师数据导入指南

## 已导入的门店数据

### 1. 门店列表
- 名医堂·颈肩腰腿特色调理（莘庄店）- 营业时间: 09:00-21:00
- 名医堂妙康中医·推拿正骨·针灸·艾灸 - 营业时间: 09:00-21:00
- 名医堂永康中医·推拿正骨·针灸·艾灸 - 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（隆昌路店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（爱琴海店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（关山路店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（五角场万达店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（国顺店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（春申路店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（兰溪路店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（浦东大道店）- 营业时间: 09:00-21:00
- 名医堂·颈肩腰腿特色调理（龙华路店）- 营业时间: 09:30-21:00
- 名医堂·颈肩腰腿特色调理（世纪公园店）- 营业时间: 10:00-21:00

### 2. 技师数据结构
每个技师包含以下信息：
- 姓名
- 职称（调理师、医师、推拿师、健康师、艾灸师等）
- 从业年限
- 好评数
- 服务次数
- 是否商家推荐
- 专长列表

### 3. 数据库更新
运行以下命令导入所有技师数据到PostgreSQL数据库：
```bash
psql -U dbuser -d clouddb -f migrations/004_insert_all_therapists.sql
```

### 4. Mock数据库支持
Mock数据库已更新，包含：
- 13个门店数据
- 部分技师数据（用于测试）
- 支持所有查询功能

## API使用示例

### 获取所有门店
```bash
curl http://localhost:3000/api/stores
```

### 获取所有技师
```bash
curl http://localhost:3000/api/therapists
```

### 查询特定技师的排班
```bash
# 按技师姓名查询
curl "http://localhost:3000/api/therapists?action=query_schedule&therapist_name=陈老师"

# 按服务类型查询
curl "http://localhost:3000/api/therapists?action=query_schedule&service_type=艾灸"

# 按门店查询
curl "http://localhost:3000/api/therapists?action=query_schedule&store_name=莘庄店"
```

### 创建预约（基于用户名）
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "username": "NDR745651115",
    "customer_name": "张先生",
    "customer_phone": "13812345678",
    "therapist_id": 1,
    "store_id": 1,
    "appointment_date": "2024-01-20",
    "appointment_time": "14:00",
    "service_type": "经络疏通",
    "notes": "首次预约"
  }'
```

### 查看用户的预约
```bash
curl http://localhost:3000/api/appointments/user/NDR745651115
```

### 取消预约
```bash
curl -X DELETE "http://localhost:3000/api/appointments/1?username=NDR745651115"
```

## 数据特点

1. **商家推荐**：部分技师标记为"商家推荐"（is_recommended = true）
2. **专长多样**：技师有多种专长，从中医内科到推拿按摩等
3. **经验丰富**：技师从业年限从2年到66年不等
4. **评价体系**：包含好评数和服务次数统计
5. **营业时间**：不同门店有不同营业时间（09:00-21:00, 09:30-21:00, 10:00-21:00）

## 注意事项

1. 数据库迁移会清除现有技师数据，请备份重要数据
2. Mock数据库仅包含部分技师用于测试
3. 生产环境使用PostgreSQL数据库将包含所有技师数据
4. 所有技师默认设置为每周7天工作，时间根据门店营业时间自动设置