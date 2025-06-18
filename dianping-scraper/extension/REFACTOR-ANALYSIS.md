# Content Script 拆分分析报告

## 拆分概述

原始的 `content.js` 文件包含 825 行代码，功能复杂且职责混合。为了提高代码的可维护性和模块化程度，我们将其拆分为 3 个专门的模块：

## 拆分后的文件结构

### 1. `data-extractor.js` - 数据提取核心模块
**职责：**
- 页面数据提取逻辑（聊天消息、团购信息）
- 页面类型检测（聊天页面/普通页面）
- Shadow DOM 元素查找
- 店铺名称格式化和等待逻辑
- DOM 变化观察（MutationObserver）

**主要类：** `DataExtractor`

**核心方法：**
- `extractChatMessages()` - 提取聊天消息
- `extractTuanInfo()` - 提取团购信息
- `detectPageType()` - 检测页面类型
- `findAllElements()` - Shadow DOM 查找
- `waitForShopNameWithObserver()` - 等待店铺名称出现

### 2. `contact-manager.js` - 联系人管理模块
**职责：**
- 联系人自动检测和信息获取
- 联系人点击循环逻辑
- 循环进度管理和状态更新
- 错误处理和重试机制

**主要类：** `ContactManager`

**核心方法：**
- `autoDetectCurrentContact()` - 自动检测当前联系人
- `startClickContacts()` - 开始联系人循环点击
- `clickNextContact()` - 点击下一个联系人
- `getContactInfo()` - 获取联系人信息
- `sendProgressUpdate()` - 发送进度更新

### 3. `content-refactored.js` - 主入口协调器
**职责：**
- 模块初始化和依赖管理
- Chrome 扩展消息监听和命令分发
- 注入脚本执行（与页面交互）
- 模块间数据流协调
- 生命周期管理（启动/停止）

**主要类：** `DianpingDataExtractor`

**核心方法：**
- `listenForCommands()` - 监听后台脚本命令
- `_executeInjectedScript()` - 执行注入脚本
- `sendAIReply()` - 发送AI回复
- `handleContactClicked()` - 处理联系人点击事件

## 拆分的优势

### 1. **单一职责原则**
- 每个模块只负责一个明确的功能领域
- 降低了代码的复杂度和理解难度
- 便于独立测试和调试

### 2. **模块化设计**
- 清晰的模块边界和接口
- 松耦合的模块关系
- 支持独立开发和维护

### 3. **代码可维护性**
- 单个文件代码量减少（每个文件约 200-300 行）
- 功能定位更加明确
- Bug 修复和功能扩展更容易

### 4. **可重用性**
- 数据提取模块可用于其他类似页面
- 联系人管理模块可扩展到其他社交平台
- 通用工具函数可以抽离共享

### 5. **测试友好**
- 每个模块可以独立进行单元测试
- 模拟依赖更容易实现
- 测试覆盖率更容易提升

## 模块间的依赖关系

```
content-refactored.js (协调器)
├── DataExtractor (数据提取)
├── ContactManager (联系人管理)
└── MemoryManager (记忆管理，已存在)

依赖流向：
- ContactManager → MemoryManager
- DataExtractor → MemoryManager  
- DianpingDataExtractor → 所有模块
```

## 加载顺序

在 `manifest.json` 中的正确加载顺序：
1. `memory.js` - 记忆管理基础
2. `data-extractor.js` - 数据提取核心
3. `contact-manager.js` - 联系人管理
4. `content-refactored.js` - 主协调器

## 使用方式

### 切换到重构版本：
1. 备份现有的 `manifest.json`
2. 将 `manifest-refactored.json` 重命名为 `manifest.json`
3. 重新加载扩展

### 回退到原版本：
1. 恢复原始的 `manifest.json`
2. 重新加载扩展

## 向后兼容性

重构后的代码完全保持了原有的：
- API 接口
- 消息协议
- 功能行为
- 性能特征

所有现有的调用方式和配置都无需修改。

## 性能影响

拆分后的性能特征：
- **内存使用：** 略有增加（多个类实例）
- **加载时间：** 基本不变（文件总大小相同）
- **运行效率：** 基本不变（相同的执行逻辑）
- **维护成本：** 显著降低

## 未来扩展建议

1. **配置管理模块：** 抽离选择器和配置常量
2. **工具函数库：** 提取通用的DOM操作函数  
3. **事件系统：** 实现模块间的事件通信
4. **日志系统：** 统一的日志格式和级别管理
5. **错误处理：** 集中的错误捕获和报告机制 