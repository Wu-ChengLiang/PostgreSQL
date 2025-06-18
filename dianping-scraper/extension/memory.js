/**
 * 记忆管理模块 - Memory Manager
 * 负责对话记忆的存储、管理和同步
 */

class MemoryManager {
    constructor() {
        // 记忆管理相关属性
        this.currentChatId = null;
        this.currentContactName = null;
        this.currentShopName = null;
        this.conversationMemory = []; // 当前对话记忆
        this.isMemoryEnabled = true;
        
        this.init();
    }

    init() {
        this.setupAutoSave();
        console.log('[MemoryManager] 记忆管理器初始化完成');
    }

    /**
     * 设置自动保存
     */
    setupAutoSave() {
        // 页面卸载时自动保存记忆
        window.addEventListener('beforeunload', () => {
            if (this.conversationMemory.length > 0 && this.currentChatId) {
                this.saveCurrentMemory();
            }
        });
        
        // 页面隐藏时也保存记忆
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.conversationMemory.length > 0 && this.currentChatId) {
                this.saveCurrentMemory();
            }
        });
    }

    /**
     * 保存当前记忆
     */
    saveCurrentMemory() {
        try {
            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: {
                    type: 'memory_save',
                    payload: {
                        action: 'save',
                        chatId: this.currentChatId,
                        contactName: this.combinedContactName,
                        conversationMemory: this.conversationMemory.slice(),
                        timestamp: Date.now()
                    }
                }
            });
            console.log(`[记忆] 自动保存记忆 (${this.conversationMemory.length}条): ${this.currentContactName}`);
        } catch (error) {
            console.error('[记忆] 自动保存记忆错误:', error);
        }
    }

    /**
     * 获取组合后的联系人名称（店铺 - 用户）
     */
    get combinedContactName() {
        return this.currentShopName
            ? `${this.currentShopName} - ${this.currentContactName}`
            : this.currentContactName;
    }

    /**
     * 更新当前联系人信息
     */
    updateContactInfo(chatId, contactName, shopName = null) {
        this.currentChatId = chatId;
        this.currentContactName = contactName;
        if (shopName !== null) {
            this.currentShopName = shopName;
        }
        console.log(`[记忆] 更新联系人信息: ${this.combinedContactName} (ID: ${chatId})`);
    }

    /**
     * 更新店铺名称
     */
    updateShopName(shopName) {
        if (this.currentShopName !== shopName) {
            this.currentShopName = shopName;
            console.log(`[记忆] 更新店铺信息: ${this.currentShopName}`);
        }
    }

    /**
     * 处理联系人切换
     */
    handleContactSwitch(contactInfo) {
        if (!this.isMemoryEnabled) return;
        
        const newChatId = contactInfo.chatId || contactInfo.name;
        const newContactName = contactInfo.name;
        
        // 检测是否切换了联系人
        if (this.currentChatId && this.currentChatId !== newChatId) {
            console.log(`[记忆] 检测到联系人切换: ${this.currentContactName} -> ${newContactName}`);
            
            // 发送记忆清空请求
            this.sendMemoryClearRequest(this.currentChatId, this.currentContactName);
            
            // 清空当前记忆
            this.conversationMemory = [];
        }
        
        // 更新当前联系人信息
        this.updateContactInfo(newChatId, newContactName, contactInfo.shopName);
        
        console.log(`[记忆] 当前聊天对象: ${this.combinedContactName} (ID: ${newChatId})`);
    }

    /**
     * 发送记忆清空请求
     */
    sendMemoryClearRequest(oldChatId, oldContactName) {
        try {
            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: {
                    type: 'chat_context_switch',
                    payload: {
                        action: 'switch',
                        oldChatId: oldChatId,
                        oldContactName: oldContactName,
                        newChatId: this.currentChatId,
                        newContactName: this.currentContactName,
                        conversationMemory: this.conversationMemory.slice(), // 发送当前记忆的副本
                        timestamp: Date.now()
                    }
                }
            });
            console.log(`[记忆] 已发送记忆切换请求: ${oldContactName} -> ${this.currentContactName}`);
        } catch (error) {
            console.error('[记忆] 发送记忆切换请求错误:', error);
        }
    }

    /**
     * 添加消息到记忆并触发AI回复
     */
    addToMemory(messageData) {
        if (!this.isMemoryEnabled || !messageData) return;
        
        // 添加到本地记忆
        this.conversationMemory.push({
            role: messageData.messageType === 'customer' ? 'user' : 'assistant',
            content: messageData.originalContent,
            timestamp: messageData.timestamp,
            messageId: messageData.id
        });
        
        // 限制记忆长度，保留最近的20条消息
        if (this.conversationMemory.length > 20) {
            this.conversationMemory = this.conversationMemory.slice(-20);
        }
        
        console.log(`[记忆] 添加消息到记忆 (${this.conversationMemory.length}/20): ${messageData.originalContent.slice(0, 50)}...`);
        
        // 发送记忆更新到后端
        this.sendMemoryUpdate(messageData);
    }

    /**
     * 添加消息到记忆但不触发AI回复
     */
    addToMemoryWithoutTrigger(messageData) {
        if (!this.isMemoryEnabled || !messageData) return;
        
        // 添加到本地记忆
        this.conversationMemory.push({
            role: messageData.messageType === 'customer' ? 'user' : 'assistant',
            content: messageData.originalContent,
            timestamp: messageData.timestamp,
            messageId: messageData.id
        });
        
        // 限制记忆长度，保留最近的20条消息
        if (this.conversationMemory.length > 20) {
            this.conversationMemory = this.conversationMemory.slice(-20);
        }
        
        console.log(`[记忆-无触发] 添加消息到记忆 (${this.conversationMemory.length}/20): ${messageData.originalContent.slice(0, 50)}...`);
        
        // 不发送memory_update，避免触发AI回复
    }

    /**
     * 发送记忆更新
     */
    sendMemoryUpdate(messageData) {
        try {
            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: {
                    type: 'memory_update',
                    payload: {
                        action: 'add_message',
                        chatId: this.currentChatId,
                        contactName: this.combinedContactName,
                        message: messageData,
                        conversationMemory: this.conversationMemory.slice(), // 发送当前记忆的副本
                        timestamp: Date.now()
                    }
                }
            });
        } catch (error) {
            console.error('[记忆] 发送记忆更新错误:', error);
        }
    }

    /**
     * 获取当前记忆状态
     */
    getMemoryStatus() {
        return {
            isEnabled: this.isMemoryEnabled,
            currentChatId: this.currentChatId,
            currentContactName: this.currentContactName,
            currentShopName: this.currentShopName,
            combinedContactName: this.combinedContactName,
            memoryCount: this.conversationMemory.length
        };
    }

    /**
     * 启用/禁用记忆功能
     */
    setMemoryEnabled(enabled) {
        this.isMemoryEnabled = enabled;
        console.log(`[记忆] 记忆功能${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 清空当前记忆
     */
    clearMemory() {
        this.conversationMemory = [];
        console.log('[记忆] 当前记忆已清空');
    }

    /**
     * 获取记忆副本
     */
    getMemorySnapshot() {
        return this.conversationMemory.slice();
    }
}

// 导出 MemoryManager
window.MemoryManager = MemoryManager; 