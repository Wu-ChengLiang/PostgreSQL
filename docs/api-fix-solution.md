# API修复方案

## 问题描述
技师查询API返回空结果，原因是：
1. Mock数据库没有实现 `get_therapist_appointments` 函数
2. 路由处理器没有正确支持 `service_type` 参数

## 已完成的修复

### 1. 修复 `config/database-mock.js`
添加了 `get_therapist_appointments` 函数的模拟实现，支持按以下条件查询：
- `therapist_name` - 技师姓名（模糊匹配）
- `store_name` - 门店名称（模糊匹配）
- `service_type` - 服务类型/专长（模糊匹配）

### 2. 修复 `src/routes/therapists.js`
- 添加了 `service_type` 参数支持
- 改进了错误处理和日志记录
- 支持 `specialty` 或 `service_type` 参数（兼容性）

## 本地测试结果

```bash
# 按技师名查询
curl "http://localhost:3002/api/therapists?action=query_schedule&therapist_name=陈老师"
# 成功返回1个技师

# 按门店查询
curl "http://localhost:3002/api/therapists?action=query_schedule&store_name=莘庄店"
# 返回该门店的所有技师

# 按服务类型查询
curl "http://localhost:3002/api/therapists?action=query_schedule&service_type=艾灸"
# 返回所有提供艾灸服务的技师
```

## 部署步骤

### 选项1：手动部署
```bash
# 1. 连接服务器
ssh ubuntu@43.167.226.222

# 2. 备份现有文件
cd /home/ubuntu/cloud-postgres-api
cp config/database-mock.js config/database-mock.js.backup
cp src/routes/therapists.js src/routes/therapists.js.backup

# 3. 更新文件（使用编辑器或上传新文件）

# 4. 重启服务
pm2 restart cloud-postgres-api
```

### 选项2：使用部署脚本
```bash
chmod +x deploy-fix.sh
./deploy-fix.sh
# 需要输入服务器密码
```

## Python客户端修复建议

您的Python客户端需要处理以下情况：

1. **空响应处理**
```python
# 在 search_therapists 方法中
result = await self._make_get_request("/therapists", params)
if result == "" or result is None:
    return []
```

2. **正确的响应格式**
API现在返回：
```json
{
  "action": "query_schedule",
  "therapists": [...],
  "date": "2025-06-15"
}
```

需要修改客户端来提取 `therapists` 字段：
```python
async def search_therapists(self, ...):
    result = await self._make_get_request("/therapists", params)
    if isinstance(result, dict) and "therapists" in result:
        return result["therapists"]
    elif isinstance(result, list):
        return result
    return []
```

## 测试命令

部署后可以使用以下命令测试：

```bash
# 测试技师查询
curl "http://emagen.323424.xyz/api/therapists?action=query_schedule&therapist_name=陈老师"

# 测试门店查询
curl "http://emagen.323424.xyz/api/therapists?action=query_schedule&store_name=莘庄店"

# 测试服务类型查询
curl "http://emagen.323424.xyz/api/therapists?action=query_schedule&service_type=艾灸"
```