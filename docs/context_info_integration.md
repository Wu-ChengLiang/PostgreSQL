# 上下文信息集成实现

## 概述

为了让AI能够了解当前对话的背景信息（店铺名称、联系人信息），我们在整个系统中集成了上下文信息传递机制。

## 问题背景

在原有系统中，AI只能接收消息内容和对话历史，无法知道当前是在哪个店铺与哪个客户进行对话。这导致AI回复缺乏针对性，无法提供个性化的服务。

从日志中可以看到类似这样的信息：
```
名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151
```

这个组合信息包含了重要的上下文：
- **店铺名称**: 名医堂·颈肩腰腿特色调理（斜土路店）
- **联系人**: 联系人_1750124628151

## 解决方案

### 1. 前端修改 (memory-manager.js)

#### 修改点1: sendMemoryUpdate方法
```javascript
// 构建上下文信息
const contextInfo = {
    shopName: this.currentShopName,
    contactName: this.currentContactName,
    combinedName: this.combinedContactName,
    chatId: this.currentChatId
};

const updateData = {
    type: 'memory_update',
    payload: {
        action: 'add_message',
        chatId: this.currentChatId,
        contactName: this.combinedContactName,
        message: messageData,
        conversationMemory: this.conversationMemory.slice(),
        contextInfo: contextInfo, // 新增：上下文信息
        timestamp: Date.now()
    }
};
```

#### 修改点2: saveCurrentMemory方法
```javascript
// 构建上下文信息
const contextInfo = {
    shopName: this.currentShopName,
    contactName: this.currentContactName,
    combinedName: this.combinedContactName,
    chatId: this.currentChatId
};

const memoryData = {
    type: 'memory_save',
    payload: {
        action: 'save',
        chatId: this.currentChatId,
        contactName: this.combinedContactName,
        conversationMemory: this.conversationMemory.slice(),
        contextInfo: contextInfo, // 新增：上下文信息
        timestamp: Date.now()
    }
};
```

### 2. 后端修改 (server.py)

#### 修改点1: handle_memory_update方法
```python
# 提取上下文信息
context_info = payload.get("contextInfo")

try:
    ai_response = await self.ai_client.generate_customer_service_reply(
        customer_message=message_content,
        conversation_history=full_history,
        context_info=context_info  # 传递上下文信息给AI
    )
```

#### 修改点2: handle_memory_save方法
```python
# 提取上下文信息（如果有）
context_info = payload.get("contextInfo")
if context_info:
    logger.info(f"[记忆保存] 上下文信息: {context_info}")

# 保存所有记忆到数据库
for message in conversation_memory:
    message['chatId'] = message.get('chatId', chat_id)
    message['contactName'] = message.get('contactName', contact_name)
    
    # 如果有上下文信息，添加到消息中
    if context_info:
        message['contextInfo'] = context_info
```

### 3. AI客户端修改 (client.py)

#### 修改点: generate_customer_service_reply方法
```python
async def generate_customer_service_reply(self, customer_message: str, 
                                         preferred_provider: Optional[AIProvider] = None,
                                         conversation_history: Optional[List[Dict[str, Any]]] = None,
                                         context_info: Optional[Dict[str, Any]] = None) -> AIResponse:
    """生成客服回复（支持Function Call）
    
    Args:
        customer_message: 客户消息
        preferred_provider: 偏好的AI提供商
        conversation_history: 对话历史
        context_info: 上下文信息（店铺名称、联系人信息等）
    """
    
    # 处理上下文信息
    if context_info:
        logger.info(f"[AI调试] 上下文信息: {context_info}")
        shop_name = context_info.get('shopName')
        contact_name = context_info.get('contactName') 
        combined_name = context_info.get('combinedName')
        
        if combined_name:
            logger.info(f"[AI调试] 当前对话对象: {combined_name}")
    
    # 创建带有对话历史和上下文的客服提示词
    request = adapter.create_customer_service_prompt_with_history(customer_message, history_to_use, context_info)
```

### 4. 适配器基类修改 (base.py)

#### 修改点: create_customer_service_prompt_with_history方法
```python
def create_customer_service_prompt_with_history(self, customer_message: str, 
                                               conversation_history: list = None,
                                               context_info: dict = None) -> AIRequest:
    """创建带有对话历史和上下文信息的客服回复提示词
    
    Args:
        customer_message: 客户消息
        conversation_history: 对话历史
        context_info: 上下文信息（店铺名称、联系人信息等）
    """
    
    # 构建上下文信息文本
    context_text = ""
    if context_info:
        shop_name = context_info.get('shopName')
        contact_name = context_info.get('contactName')
        combined_name = context_info.get('combinedName')
        
        if combined_name:
            context_text = f"\n【当前对话对象】: {combined_name}"
        elif shop_name and contact_name:
            context_text = f"\n【当前对话对象】: {shop_name} - {contact_name}"
        elif shop_name:
            context_text = f"\n【当前门店】: {shop_name}"
    
    system_prompt = f"""你是名医堂的智能客服助理，{context_text}
    
    ... (其他提示内容)
    """
```

## 数据流程

1. **前端检测**: `memory-manager.js` 检测到新消息时，构建包含上下文信息的数据包
2. **发送到后端**: 通过WebSocket发送包含 `contextInfo` 的消息
3. **后端接收**: `server.py` 接收消息并提取上下文信息
4. **传递给AI**: 将上下文信息传递给AI客户端
5. **AI处理**: AI适配器在系统提示中包含上下文信息
6. **生成回复**: AI基于完整上下文生成个性化回复

## 上下文信息结构

```javascript
const contextInfo = {
    shopName: "名医堂·颈肩腰腿特色调理（斜土路店）",  // 店铺名称
    contactName: "联系人_1750124628151",                // 联系人名称  
    combinedName: "名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151", // 组合名称
    chatId: "chat_联系人_1750124628151"                 // 聊天ID
};
```

## 测试

创建了 `tests/test_context_info_integration.py` 测试文件，验证：
- ✅ 上下文信息正确传递给AI
- ✅ 从组合名称中提取店铺和联系人信息
- ✅ 上下文信息结构完整性

## 预期效果

现在AI能够：
1. **了解当前店铺**: 知道自己在为哪个门店提供服务
2. **识别客户身份**: 通过联系人信息提供个性化服务
3. **提供针对性回复**: 基于店铺和客户信息给出更准确的回答
4. **保持对话连贯性**: 结合历史记录和上下文提供一致的服务体验

## 日志示例

启用后，你会在日志中看到类似信息：
```
[AI调试] 上下文信息: {'shopName': '名医堂·颈肩腰腿特色调理（斜土路店）', 'contactName': '联系人_1750124628151', 'combinedName': '名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151', 'chatId': 'chat_联系人_1750124628151'}
[AI调试] 当前对话对象: 名医堂·颈肩腰腿特色调理（斜土路店） - 联系人_1750124628151
```

这确保了AI始终了解当前的对话背景，提供更好的客户服务体验。 