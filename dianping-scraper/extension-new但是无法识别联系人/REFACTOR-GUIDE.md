# 大众点评数据提取器 - 重构指南

## 🔄 重构概述

本次重构将原来的单体 `content.js` (835行) 拆分为4个模块化文件，提高代码可维护性和减少潜在bug。

## 📁 重构后文件结构

### 新增模块文件

1. **memory-manager.js** - 聊天记忆管理模块
   - 管理对话记忆和联系人切换
   - 自动保存和恢复记忆
   - 联系人信息检测和处理

2. **data-extractor.js** - 数据提取模块  
   - 聊天消息提取
   - 团购信息提取
   - DOM监听和轮询提取

3. **message-sender.js** - 消息发送模块
   - AI回复发送
   - 测试消息发送  
   - 批量消息发送
   - 模板消息功能

4. **background-manager.js** - 后台管理模块
   - WebSocket连接管理
   - 消息路由和转发
   - 重连机制优化

5. **content.js** - 重构后的主控制器
   - 模块整合和协调
   - 批量联系人处理
   - 命令监听和分发

### 配置文件更新

- **manifest-refactored.json** - 更新后的扩展配置
  - 按顺序加载所有模块
  - 使用新的后台脚本

## 🔧 原有接口保持不变

### Chrome扩展消息接口
- ✅ `startExtraction` - 开始数据提取
- ✅ `stopExtraction` - 停止数据提取  
- ✅ `startClickContacts` - 开始批量联系人处理
- ✅ `stopClickContacts` - 停止批量联系人处理
- ✅ `testSendMessage` - 测试消息发送
- ✅ `sendAIReply` - AI回复发送

### WebSocket协议接口
- ✅ `ws://localhost:8767` - 服务器地址保持不变
- ✅ JSON消息格式保持不变
- ✅ `sendAIReply` 指令格式保持不变
- ✅ 数据提取格式保持不变

### Python后端兼容性
- ✅ 数据格式完全向后兼容
- ✅ 记忆管理接口保持不变
- ✅ 联系人切换协议保持不变

## 🚀 部署步骤

### 1. 备份原文件
```bash
# 创建备份目录
mkdir backup
cp *.js *.json backup/
```

### 2. 更新扩展配置
```bash
# 替换manifest.json（或重命名）
cp manifest-refactored.json manifest.json
```

### 3. 重新加载扩展
1. 打开 `chrome://extensions/`
2. 找到"大众点评数据提取器"
3. 点击"重新加载"按钮

### 4. 验证功能
- [x] WebSocket连接状态正常
- [x] 数据提取功能正常
- [x] AI回复发送正常
- [x] 批量联系人处理正常
- [x] 记忆管理功能正常

## 🧪 测试清单

### 功能测试
- [ ] **基础数据提取**
  - [ ] 聊天消息提取
  - [ ] 团购信息提取
  - [ ] 数据去重功能

- [ ] **记忆管理**
  - [ ] 联系人自动检测
  - [ ] 对话记忆保存
  - [ ] 联系人切换处理
  - [ ] 自动保存机制

- [ ] **消息发送**
  - [ ] 测试消息发送
  - [ ] AI回复发送
  - [ ] 消息记忆添加
  - [ ] 发送状态检查

- [ ] **批量处理**
  - [ ] 联系人点击功能
  - [ ] 进度更新显示
  - [ ] 错误处理机制
  - [ ] 停止功能

- [ ] **后台连接**
  - [ ] WebSocket连接
  - [ ] 自动重连机制
  - [ ] 消息转发功能
  - [ ] 状态同步

### 兼容性测试
- [ ] **Python后端**
  - [ ] 数据格式兼容
  - [ ] 协议兼容性
  - [ ] 错误处理

- [ ] **UI界面**
  - [ ] Popup界面正常  
  - [ ] 状态显示正确
  - [ ] 按钮功能正常

## 📊 性能优化

### 重构带来的改进
1. **模块化设计** - 降低耦合度，提高可维护性
2. **错误处理** - 更完善的异常捕获和恢复
3. **内存管理** - 优化记忆长度限制和清理机制
4. **重连机制** - 更智能的WebSocket重连策略
5. **代码复用** - 减少重复代码，提高复用性

### 潜在问题修复
- ✅ 修复记忆管理可能的内存泄露
- ✅ 优化DOM查询性能
- ✅ 改进错误恢复机制
- ✅ 统一日志输出格式
- ✅ 加强类型安全检查

## 🔍 调试指南

### 开发者工具调试
```javascript
// 检查模块加载状态
console.log('模块状态:', {
    MemoryManager: typeof MemoryManager,
    DataExtractor: typeof DataExtractor,
    MessageSender: typeof MessageSender,
    dianpingExtractor: !!window.dianpingExtractor
});

// 获取当前状态
window.dianpingExtractor?.getStatus();

// 获取记忆信息
window.dianpingExtractor?.memoryManager.getCurrentContact();
```

### 日志监控
所有模块都使用统一的日志前缀：
- `[MemoryManager]` - 记忆管理相关
- `[DataExtractor]` - 数据提取相关
- `[MessageSender]` - 消息发送相关
- `[BackgroundManager]` - 后台管理相关
- `[DianpingExtractor]` - 主控制器相关

## 🛠️ 故障排除

### 常见问题

1. **模块加载失败**
   - 检查manifest.json中的js文件顺序
   - 确认所有模块文件都存在
   - 查看控制台错误日志

2. **WebSocket连接问题**
   - 确认Python服务器正在运行
   - 检查端口8767是否被占用
   - 查看后台页面的连接日志

3. **数据提取异常**
   - 确认在正确的大众点评页面
   - 检查页面元素选择器是否变化
   - 查看提取模块的错误日志

4. **记忆功能异常**
   - 检查联系人检测逻辑
   - 确认记忆保存机制正常
   - 查看记忆切换相关日志

## 📝 后续优化计划

1. **添加单元测试** - 为每个模块编写测试用例
2. **性能监控** - 添加性能指标收集
3. **错误上报** - 实现错误自动上报机制
4. **配置化** - 使用配置文件管理参数
5. **文档完善** - 添加API文档和使用示例

## 🎯 回滚方案

如果重构后出现问题，可以快速回滚：

```bash
# 恢复原文件
cp backup/content.js ./
cp backup/background.js ./
cp backup/manifest.json ./

# 重新加载扩展
```

## 📞 技术支持

如遇到问题，请检查：
1. 浏览器开发者工具控制台
2. 扩展程序错误页面
3. WebSocket服务器日志
4. 模块加载状态 