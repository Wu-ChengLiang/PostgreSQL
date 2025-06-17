/**
 * 聊天记忆管理器 - Memory Manager
 * 负责管理聊天对话记忆，联系人切换和记忆持久化
 */
class MemoryManager {
    constructor() {
        this.currentChatId = null;
        this.currentContactName = null;
        this.currentShopName = null; // 新增：店铺名称
        this.conversationMemory = []; // 当前对话记忆
        this.isMemoryEnabled = true;
        this.maxMemoryLength = 20; // 最大记忆长度
        
        this.initMemoryManager();
    }

    /**
     * 初始化记忆管理器
     */
    initMemoryManager() {
        this.setupAutoSave();
        console.log('[MemoryManager] 记忆管理器初始化完成');
    }

    /**
     * 设置自动保存机制
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
     * 保存当前记忆到后端
     */
    saveCurrentMemory() {
        try {
            // 检查扩展上下文是否有效
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.warn('[MemoryManager] 扩展上下文无效，跳过记忆保存');
                return;
            }

            // 构建上下文信息
            const contextInfo = {
                shopName: this.currentShopName,
                contactName: this.currentContactName,
                combinedName: this.combinedContactName,
                chatId: this.currentChatId
            };
            
            console.log(`[MemoryManager] 保存记忆-构建上下文信息:`, contextInfo);

            const memoryData = {
                type: 'memory_save',
                payload: {
                    action: 'save',
                    chatId: this.currentChatId,
                    contactName: this.combinedContactName, // 修改：使用组合名称
                    conversationMemory: this.conversationMemory.slice(),
                    contextInfo: contextInfo, // 新增：上下文信息
                    timestamp: Date.now()
                }
            };

            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: memoryData
            }, (response) => {
                // 检查是否有runtime错误
                if (chrome.runtime.lastError) {
                    console.warn('[MemoryManager] 记忆保存失败，扩展上下文可能已失效:', chrome.runtime.lastError.message);
                } else {
                    console.log(`[MemoryManager] 自动保存记忆成功 (${this.conversationMemory.length}条): ${this.currentContactName}`);
                }
            });
            
        } catch (error) {
            console.warn('[MemoryManager] 自动保存记忆错误:', error.message);
            // 不重新抛出错误，避免中断其他功能
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
     * 更新当前店铺名称并通知UI
     * @param {string | null} shopName 
     */
    updateShopName(shopName) {
        if (this.currentShopName !== shopName) {
            this.currentShopName = shopName;
            console.log(`[MemoryManager] 更新店铺信息: ${this.currentShopName}`);

            // 发送消息更新Popup UI
            try {
                if (chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({
                        type: 'shopInfoUpdate',
                        shopName: this.currentShopName
                    });
                }
            } catch (e) {
                console.warn('[MemoryManager] 发送店铺信息更新失败:', e.message);
            }
        }
    }

    /**
     * 自动检测当前联系人
     */
    autoDetectCurrentContact() {
        try {
            // 初始化默认值 
            let contactName = '默认联系人';
            let chatId = 'default_chat';
            
            console.log('[MemoryManager] 开始自动检测当前联系人...');
            
            // 方法1: 优先从 userinfo-username 元素获取（包含 data-chatid）
            const userinfoElement = document.querySelector('.userinfo-username[data-chatid]');
            const shopInfoElement = document.querySelector('.userinfo-from-shop'); // 新增：获取店铺元素
            
            if (userinfoElement) {
                const name = userinfoElement.textContent.trim();
                const dataChatId = userinfoElement.getAttribute('data-chatid');
                if (name && dataChatId) {
                    contactName = name;
                    chatId = dataChatId;
                    console.log(`[MemoryManager] 从 userinfo-username 提取到: ${contactName} (chatId: ${chatId})`);
                }
            } else {
                // 方法2: 从 userinfo-name-show 元素获取联系人名称
                const nameShowElement = document.querySelector('.userinfo-name-show');
                if (nameShowElement) {
                    const name = nameShowElement.textContent.trim();
                    if (name) {
                        contactName = name;
                        chatId = `chat_${name}_${Date.now()}`;
                        console.log(`[MemoryManager] 从 userinfo-name-show 提取到: ${contactName} (生成 chatId: ${chatId})`);
                    }
                } else {
                    // 方法3: 尝试其他可能的选择器
                    const fallbackSelectors = [
                        '.userinfo-username',
                        '.chat-title', 
                        '.contact-name',
                        '.shop-name',
                        '.merchant-name'
                    ];
                    
                    for (const selector of fallbackSelectors) {
                        const element = document.querySelector(selector);
                        if (element && element.textContent.trim()) {
                            const name = element.textContent.trim();
                            contactName = name;
                            chatId = `chat_${name}_${Date.now()}`;
                            console.log(`[MemoryManager] 从备用选择器 ${selector} 提取到: ${contactName}`);
                            break;
                        }
                    }
                    
                    // 方法4: 如果都没找到，使用时间戳生成唯一标识
                    if (contactName === '默认联系人') {
                        const timestamp = Date.now();
                        contactName = `用户_${timestamp}`;
                        chatId = `chat_${timestamp}`;
                        console.log(`[MemoryManager] 未找到联系人信息，生成临时标识: ${contactName}`);
                    }
                }
            }
            
            // 设置当前联系人信息
            this.currentChatId = chatId;
            this.currentContactName = contactName;
            this.currentShopName = shopInfoElement ? shopInfoElement.textContent.trim() : null; // 新增：设置店铺名称
            
            console.log(`[MemoryManager] 最终确定联系人: ${contactName} (ID: ${chatId}), 店铺: ${this.currentShopName}`);
            
        } catch (error) {
            console.error('[MemoryManager] 自动检测联系人错误:', error);
            // 错误恢复：使用时间戳生成唯一标识
            const timestamp = Date.now();
            this.currentChatId = `error_${timestamp}`;
            this.currentContactName = `错误恢复_${timestamp}`;
            this.currentShopName = null; // 新增：重置店铺名称
            console.log(`[MemoryManager] 错误恢复，使用: ${this.currentContactName}`);
        }
    }

    /**
     * 添加消息到记忆（带AI回复触发）
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
        
        // 限制记忆长度
        if (this.conversationMemory.length > this.maxMemoryLength) {
            this.conversationMemory = this.conversationMemory.slice(-this.maxMemoryLength);
        }
        
        console.log(`[MemoryManager] 添加消息到记忆 (${this.conversationMemory.length}/${this.maxMemoryLength}): ${messageData.originalContent.slice(0, 50)}...`);
        
        // 发送记忆更新到后端
        this.sendMemoryUpdate(messageData);
    }

    /**
     * 添加消息到记忆（不触发AI回复）
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
        
        // 限制记忆长度
        if (this.conversationMemory.length > this.maxMemoryLength) {
            this.conversationMemory = this.conversationMemory.slice(-this.maxMemoryLength);
        }
        
        console.log(`[MemoryManager] 添加消息到记忆-无触发 (${this.conversationMemory.length}/${this.maxMemoryLength}): ${messageData.originalContent.slice(0, 50)}...`);
    }

    /**
     * 发送记忆更新到后端
     */
    sendMemoryUpdate(messageData) {
        try {
            // 检查扩展上下文是否有效
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.warn('[MemoryManager] 扩展上下文无效，跳过记忆更新');
                return;
            }

            // 构建上下文信息
            const contextInfo = {
                shopName: this.currentShopName,
                contactName: this.currentContactName,
                combinedName: this.combinedContactName,
                chatId: this.currentChatId
            };
            
            console.log(`[MemoryManager] 构建上下文信息:`, contextInfo);

            const updateData = {
                type: 'memory_update',
                payload: {
                    action: 'add_message',
                    chatId: this.currentChatId,
                    contactName: this.combinedContactName, // 修改：使用组合名称
                    message: messageData,
                    conversationMemory: this.conversationMemory.slice(),
                    contextInfo: contextInfo, // 新增：上下文信息
                    timestamp: Date.now()
                }
            };
            
            console.log(`[MemoryManager] 发送记忆更新数据:`, JSON.stringify(updateData, null, 2));

            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: updateData
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[MemoryManager] 记忆更新失败，扩展上下文可能已失效:', chrome.runtime.lastError.message);
                } else {
                    console.log(`[MemoryManager] 记忆更新成功，包含上下文: ${this.combinedContactName}`);
                }
            });
        } catch (error) {
            console.warn('[MemoryManager] 发送记忆更新错误:', error.message);
        }
    }

    /**
     * 处理联系人切换
     */
    handleContactSwitch(contactInfo) {
        if (!this.isMemoryEnabled) return;
        
        const newChatId = contactInfo.chatId || contactInfo.name;

        if (this.currentChatId && this.currentChatId !== newChatId) {
            console.log(`[MemoryManager] 联系人切换: 从 ${this.currentContactName} 到 ${contactInfo.name}`);
            this.saveCurrentMemory();
            this.clearCurrentMemory();
            this.updateShopName(null); // 重置店铺名称
        }
        
        this.currentChatId = newChatId;
        this.currentContactName = contactInfo.name;
        
        this.loadMemoryForCurrentContact();
    }

    /**
     * 为当前联系人加载记忆
     */
    loadMemoryForCurrentContact() {
        // 实现为当前联系人加载记忆的逻辑
    }

    /**
     * 发送记忆清空请求
     */
    sendMemoryClearRequest(oldChatId, oldContactName) {
        try {
            // 检查扩展上下文是否有效
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.warn('[MemoryManager] 扩展上下文无效，跳过记忆切换请求');
                return;
            }

            const clearData = {
                type: 'chat_context_switch',
                payload: {
                    action: 'switch',
                    oldChatId: oldChatId,
                    oldContactName: oldContactName,
                    newChatId: this.currentChatId,
                    newContactName: this.currentContactName,
                    conversationMemory: this.conversationMemory.slice(),
                    timestamp: Date.now()
                }
            };

            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: clearData
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[MemoryManager] 记忆切换请求失败，扩展上下文可能已失效:', chrome.runtime.lastError.message);
                } else {
                    console.log(`[MemoryManager] 已发送记忆切换请求: ${oldContactName} -> ${this.currentContactName}`);
                }
            });
            
        } catch (error) {
            console.warn('[MemoryManager] 发送记忆切换请求错误:', error.message);
        }
    }

    /**
     * 获取联系人信息
     */
    getContactInfo(contactElement) {
        if (!contactElement) {
            return {
                name: '未知联系人',
                chatId: `unknown_${Date.now()}`,
                element: null,
                shopName: null
            };
        }

        // 尝试从不同的地方获取联系人名称和ID
        const nameElement = contactElement.querySelector('.contact-name, .shop-name, .merchant-name, .title');
        const name = nameElement ? nameElement.textContent.trim() : `联系人_${Date.now()}`;
        
        // 尝试从 data-cid 获取 chatId
        const chatIdFromData = contactElement.getAttribute('data-cid');
        
        // 生成最终的 chatId
        const chatId = chatIdFromData ? chatIdFromData : `chat_${name.replace(/\s/g, '_')}`;
        
        // 新增：补充获取店铺名称
        const shopInfoElement = document.querySelector('.userinfo-from-shop');
        const shopName = shopInfoElement ? shopInfoElement.textContent.trim() : null;

        return {
            name: name,
            chatId: chatId,
            element: contactElement,
            shopName: shopName
        };
    }

    /**
     * 获取当前联系人信息
     */
    getCurrentContact() {
        return {
            chatId: this.currentChatId,
            contactName: this.currentContactName,
            memoryCount: this.conversationMemory.length
        };
    }

    /**
     * 清空当前记忆
     */
    clearCurrentMemory() {
        this.conversationMemory = [];
        console.log('[MemoryManager] 当前记忆已清空');
    }

    /**
     * 设置记忆启用状态
     */
    setMemoryEnabled(enabled) {
        this.isMemoryEnabled = enabled;
        console.log(`[MemoryManager] 记忆功能${enabled ? '已启用' : '已禁用'}`);
    }
}

// 导出记忆管理器
window.MemoryManager = MemoryManager; 