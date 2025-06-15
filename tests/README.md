# 测试文件说明

## 🧪 测试套件

### Python测试
- `test-production-api.py` - 完整的生产环境API测试，包括：
  - 门店查询
  - 技师查询（按名称、门店、服务类型）
  - 预约流程（创建、查询、取消）

### Shell测试脚本
- `test-all-apis.sh` - 测试所有API端点
- `test-appointments-public.sh` - 测试公开预约API
- `test-api.sh` - 基础API测试
- `test-auth.sh` - 认证功能测试
- `test-function-api.sh` - 函数式API测试
- `test-therapist-data.sh` - 技师数据测试

## 🚀 运行测试

### Python测试
```bash
python3 test-production-api.py
```

### Shell测试
```bash
./test-all-apis.sh
```

## ✅ 测试结果示例

```
🚀 开始测试生产环境API (http://emagen.323424.xyz/api)

=== 测试门店API ===
找到 5 家门店

=== 测试技师查询API ===
1. 按技师名查询（陈老师）：找到 1 个技师
2. 按门店查询（莘庄店）：找到 3 个技师
3. 按服务类型查询（艾灸）：找到 2 个技师

=== 测试预约流程 ===
1. 查询技师可用时间：✅
2. 创建预约：✅ 预约成功！
3. 查看用户预约：✅
4. 取消预约：✅

✅ 测试完成！
```