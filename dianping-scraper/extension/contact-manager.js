/**
 * 大众点评数据提取器 - 联系人管理模块
 * 负责联系人检测、点击循环和进度管理
 */

class ContactManager {
    constructor() {
        // 联系人点击循环相关
        this.isClickingContacts = false;
        this.clickTimeout = null;
        this.clickCount = 0;
        this.totalClicks = 0;
        this.currentRound = 1;
        this.totalProcessedContacts = 0;
        this.clickInterval = 2000;
        this.pageLoadWaitTime = 1500;
        this.extractionWaitTime = 2500;

        // 选择器
        this.selectors = {
            contactItems: '.chat-list-item',
        };
    }

    /**
     * 自动检测当前联系人
     */
    autoDetectCurrentContact(memoryManager) {
        try {
            let contactName = '默认联系人';
            let chatId = 'default_chat';
            
            console.log('[联系人检测] 开始自动检测当前联系人...');
            
            // 方法1: 优先从 userinfo-username 元素获取（包含 data-chatid）
            const userinfoElement = document.querySelector('.userinfo-username[data-chatid]');
            if (userinfoElement) {
                const name = userinfoElement.textContent.trim();
                const dataChatId = userinfoElement.getAttribute('data-chatid');
                if (name && dataChatId) {
                    contactName = name;
                    chatId = dataChatId;
                    console.log(`[联系人检测] 从 userinfo-username 提取到: ${contactName} (chatId: ${chatId})`);
                }
            } else {
                // 方法2: 从 userinfo-name-show 元素获取联系人名称
                const nameShowElement = document.querySelector('.userinfo-name-show');
                if (nameShowElement) {
                    const name = nameShowElement.textContent.trim();
                    if (name) {
                        contactName = name;
                        chatId = `chat_${name}_${Date.now()}`;
                        console.log(`[联系人检测] 从 userinfo-name-show 提取到: ${contactName} (生成 chatId: ${chatId})`);
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
                            console.log(`[联系人检测] 从备用选择器 ${selector} 提取到: ${contactName}`);
                            break;
                        }
                    }
                    
                    // 方法4: 如果都没找到，使用时间戳生成唯一标识
                    if (contactName === '默认联系人') {
                        const timestamp = Date.now();
                        contactName = `用户_${timestamp}`;
                        chatId = `chat_${timestamp}`;
                        console.log(`[联系人检测] 未找到联系人信息，生成临时标识: ${contactName}`);
                    }
                }
            }
            
            // 检测店铺名称
            const shopInfoElement = document.querySelector('.userinfo-from-shop');
            const shopName = shopInfoElement ? this._formatShopName(shopInfoElement.textContent.trim()) : null;
            
            // 更新记忆管理器中的联系人信息
            memoryManager.updateContactInfo(chatId, contactName, shopName);
            
            // 发送店铺信息更新
            this.sendShopInfoUpdate(shopName);
            
            console.log(`[联系人检测] 最终确定联系人: ${contactName} (ID: ${chatId}), 店铺: ${shopName}`);
            
        } catch (error) {
            console.error('[联系人检测] 自动检测联系人错误:', error);
            const timestamp = Date.now();
            const chatId = `error_${timestamp}`;
            const contactName = `错误恢复_${timestamp}`;
            memoryManager.updateContactInfo(chatId, contactName);
            console.log(`[联系人检测] 错误恢复，使用: ${contactName}`);
        }
    }

    /**
     * 格式化店铺名称
     */
    _formatShopName(rawName) {
        if (!rawName) {
            return null;
        }

        let formattedName = rawName;

        // 移除城市前缀，例如 "上海 - "
        formattedName = formattedName.replace(/^.+?\s*-\s*/, '');

        // 移除括号前的多余空格
        formattedName = formattedName.replace(/\s+\(/, '(');

        // 将半角括号替换为全角括号
        formattedName = formattedName.replace(/\(/g, '（').replace(/\)/g, '）');
        
        // 移除全角括号内部的所有空格
        formattedName = formattedName.replace(/（([^）]+)）/g, (match, innerContent) => {
            return `（${innerContent.replace(/\s/g, '')}）`;
        });

        const finalName = formattedName.trim();
        console.log(`[ContactManager] 店铺名称格式化: "${rawName}" -> "${finalName}"`);

        return finalName;
    }

    /**
     * 查找所有元素（包括Shadow DOM）
     */
    findAllElements(selector, root) {
        let elements = [];
        try {
            Array.prototype.push.apply(elements, root.querySelectorAll(selector));
            const descendants = root.querySelectorAll('*');
            for (const el of descendants) {
                if (el.shadowRoot) {
                    const nestedElements = this.findAllElements(selector, el.shadowRoot);
                    Array.prototype.push.apply(elements, nestedElements);
                }
            }
        } catch (e) {
            // 忽略错误
        }
        return elements;
    }

    /**
     * 开始点击联系人循环
     */
    startClickContacts(count = 2, interval = 2000) {
        if (this.isClickingContacts) {
            console.log('[ContactManager] 循环提取已在进行中');
            return;
        }
        
        this.isClickingContacts = true;
        this.clickCount = 0;
        this.totalClicks = count;
        this.currentRound = 1;
        this.totalProcessedContacts = 0;
        this.clickInterval = interval;

        // 动态调整内部延迟时间
        this.pageLoadWaitTime = Math.min(1500, interval * 0.6);
        this.extractionWaitTime = Math.min(2500, interval * 0.8);
        
        console.log(`[ContactManager] 开始循环提取，总数: ${count}, 间隔: ${interval}ms`);
        this.sendProgressUpdate();
        this.clickNextContact();
    }

    /**
     * 停止点击联系人循环
     */
    stopClickContacts() {
        if (!this.isClickingContacts) return;
        
        this.isClickingContacts = false;
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        
        console.log('[ContactManager] 循环提取已停止');
    }

    /**
     * 点击下一个联系人
     */
    clickNextContact() {
        if (!this.isClickingContacts) {
            return;
        }
        
        // 循环逻辑：当达到总数时，重置为0，继续循环
        if (this.clickCount >= this.totalClicks) {
            this.clickCount = 0;
            this.currentRound++;
            console.log(`[ContactManager] 完成第${this.currentRound - 1}轮循环，开始第${this.currentRound}轮`);
            this.sendProgressUpdate('重新开始循环');
        }
        
        try {
            const contactElements = this.findAllElements(this.selectors.contactItems, document);
            
            if (contactElements.length === 0) {
                this.sendErrorMessage('未找到联系人元素');
                return;
            }
            
            const targetContact = contactElements[this.clickCount];
            if (!targetContact) {
                this.sendErrorMessage(`联系人 ${this.clickCount + 1} 不存在`);
                return;
            }
            
            const contactInfo = this.getContactInfo(targetContact);
            console.log(`[ContactManager] 点击第 ${this.clickCount + 1} 个联系人: ${contactInfo.name}`);
            
                         // 处理联系人切换
             if (this.memoryManager) {
                 this.memoryManager.handleContactSwitch(contactInfo);
             }
             
             // 发送店铺信息更新
             this.sendShopInfoUpdate(contactInfo.shopName);
            
            targetContact.click();
            
            this.clickCount++;
            this.totalProcessedContacts++;
            this.sendProgressUpdate(`正在处理联系人: ${contactInfo.name}`);
            
            setTimeout(() => {
                if (this.onContactClicked) {
                    this.onContactClicked(contactInfo);
                }
            }, this.pageLoadWaitTime);
            
        } catch (error) {
            console.error('[ContactManager] 点击联系人错误:', error);
            this.sendErrorMessage(`点击错误: ${error.message}`);
        }
    }

    /**
     * 获取联系人信息
     */
    getContactInfo(contactElement) {
        let name = '未知联系人';
        let chatId = '';
        
        try {
            // 优先从带有 data-chatid 属性的 userinfo-username 元素获取
            const nameElementWithChatId = contactElement.querySelector('.userinfo-username[data-chatid]');
            if (nameElementWithChatId) {
                name = nameElementWithChatId.textContent.trim();
                chatId = nameElementWithChatId.getAttribute('data-chatid');
                console.log(`[联系人信息] 从 userinfo-username 提取: ${name} (chatId: ${chatId})`);
            } else {
                // 备用方案
                const selectors = ['.userinfo-name-show', '.userinfo-username', '.contact-name'];
                for (const selector of selectors) {
                    const nameElement = contactElement.querySelector(selector);
                    if (nameElement && nameElement.textContent.trim()) {
                        name = nameElement.textContent.trim();
                        console.log(`[联系人信息] 从 ${selector} 提取: ${name}`);
                        break;
                    }
                }
                
                chatId = contactElement.getAttribute('data-chatid') || contactElement.id || '';
            }
            
        } catch (error) {
            console.error('[联系人信息] 获取联系人信息错误:', error);
        }
        
        // 获取店铺名称
        const shopInfoElement = document.querySelector('.userinfo-from-shop');
        const shopName = shopInfoElement ? this._formatShopName(shopInfoElement.textContent.trim()) : null;
        
        return {
            name: name,
            chatId: chatId,
            shopName: shopName,
            timestamp: Date.now()
        };
    }

    /**
     * 继续到下一个联系人
     */
    proceedToNextContact() {
        if (!this.isClickingContacts) return;
        
        this.clickTimeout = setTimeout(() => this.clickNextContact(), this.clickInterval);
    }

    /**
     * 发送进度更新
     */
    sendProgressUpdate(status = '') {
        try {
            chrome.runtime.sendMessage({
                type: 'clickProgress',
                current: this.clickCount,
                total: this.totalClicks,
                round: this.currentRound,
                status: status,
                isLooping: true
            });
        } catch (error) {
            console.error('[ContactManager] 发送进度更新错误:', error);
        }
    }

    /**
     * 发送错误消息
     */
    sendErrorMessage(message) {
        this.isClickingContacts = false;
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        
        try {
            chrome.runtime.sendMessage({
                type: 'clickError',
                message: message
            });
        } catch (error) {
            console.error('[ContactManager] 发送错误消息错误:', error);
        }
    }

    /**
     * 设置记忆管理器
     */
    setMemoryManager(memoryManager) {
        this.memoryManager = memoryManager;
    }

    /**
     * 设置联系人点击回调
     */
    setContactClickedCallback(callback) {
        this.onContactClicked = callback;
    }

    /**
     * 发送店铺信息更新
     */
    sendShopInfoUpdate(shopName) {
        try {
            if (shopName) {
                chrome.runtime.sendMessage({
                    type: 'shopInfoUpdate',
                    shopName: shopName
                });
            }
        } catch (error) {
            console.error('[ContactManager] 发送店铺信息更新错误:', error);
        }
    }

    /**
     * 获取循环状态
     */
    getClickingStatus() {
        return {
            isClickingContacts: this.isClickingContacts,
            clickCount: this.clickCount,
            totalClicks: this.totalClicks,
            currentRound: this.currentRound,
            totalProcessedContacts: this.totalProcessedContacts
        };
    }
}

// 导出到全局
window.ContactManager = ContactManager; 