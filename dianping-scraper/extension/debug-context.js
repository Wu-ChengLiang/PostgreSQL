/**
 * 调试上下文信息构建的脚本
 * 在浏览器控制台中运行此脚本来测试上下文信息
 */

// 测试上下文信息构建
function testContextInfo() {
    console.log("🔧 开始测试上下文信息构建...");
    
    // 检查 MemoryManager 是否存在
    if (typeof window.MemoryManager === 'undefined') {
        console.error("❌ MemoryManager 未找到！请确保扩展已正确加载。");
        return;
    }
    
    // 创建 MemoryManager 实例
    const memoryManager = new window.MemoryManager();
    
    // 手动设置测试数据
    memoryManager.currentShopName = "名医堂·颈肩腰腿特色调理（斜土路店）";
    memoryManager.currentContactName = "联系人_1750126856144";
    memoryManager.currentChatId = "chat_联系人_1750126856144";
    
    console.log("📝 设置测试数据:");
    console.log("- 店铺名称:", memoryManager.currentShopName);
    console.log("- 联系人:", memoryManager.currentContactName);
    console.log("- 聊天ID:", memoryManager.currentChatId);
    console.log("- 组合名称:", memoryManager.combinedContactName);
    
    // 测试上下文信息构建
    const contextInfo = {
        shopName: memoryManager.currentShopName,
        contactName: memoryManager.currentContactName,
        combinedName: memoryManager.combinedContactName,
        chatId: memoryManager.currentChatId
    };
    
    console.log("✅ 构建的上下文信息:", contextInfo);
    
    // 测试发送数据结构
    const testUpdateData = {
        type: 'memory_update',
        payload: {
            action: 'add_message',
            chatId: memoryManager.currentChatId,
            contactName: memoryManager.combinedContactName,
            message: {
                messageType: 'customer',
                originalContent: '测试消息',
                timestamp: Date.now(),
                id: 'test_123'
            },
            conversationMemory: [{
                role: 'user',
                content: '测试消息',
                timestamp: Date.now(),
                messageId: 'test_123'
            }],
            contextInfo: contextInfo,
            timestamp: Date.now()
        }
    };
    
    console.log("📤 准备发送的数据结构:");
    console.log(JSON.stringify(testUpdateData, null, 2));
    
    // 检查关键字段
    console.log("🔍 检查关键字段:");
    console.log("- payload.contextInfo 存在:", 'contextInfo' in testUpdateData.payload);
    console.log("- contextInfo 内容完整:", Object.keys(contextInfo).length === 4);
    
    return testUpdateData;
}

// 测试实际发送
function testSendMessage() {
    console.log("📡 测试实际发送消息...");
    
    const testData = testContextInfo();
    
    if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
            type: 'extractedData',
            data: testData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("❌ 发送失败:", chrome.runtime.lastError.message);
            } else {
                console.log("✅ 发送成功!");
                console.log("📥 响应:", response);
            }
        });
    } else {
        console.error("❌ Chrome 扩展运行时不可用");
    }
}

// 导出测试函数到全局
window.testContextInfo = testContextInfo;
window.testSendMessage = testSendMessage;

console.log("🧪 调试工具已加载！");
console.log("📋 可用命令:");
console.log("  testContextInfo() - 测试上下文信息构建");
console.log("  testSendMessage() - 测试发送消息");
console.log("💡 使用方法: 在控制台输入 testContextInfo() 回车执行"); 