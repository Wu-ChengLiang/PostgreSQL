/**
 * 数据提取器 - Data Extractor  
 * 负责从大众点评页面提取聊天消息、团购信息等数据
 */
class DataExtractor {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.isActive = false;
        this.observer = null;
        this.pollingInterval = null;
        this.extractedData = new Set(); // 用于去重
        
        // 选择器配置
        this.selectors = {
            chatMessageList: '.text-message.normal-text, .rich-message, .text-message.shop-text',
            tuanInfo: '.tuan',
            contactItems: '.chat-list-item',
        };
        
        this.initExtractor();
    }

    /**
     * 初始化数据提取器
     */
    initExtractor() {
        console.log('[DataExtractor] 数据提取器初始化完成');
    }

    /**
     * 开始数据提取
     */
    start() {
        if (this.isActive) {
            console.log('[DataExtractor] 提取器已激活');
            return;
        }
        
        this.isActive = true;
        console.log('[DataExtractor] 开始数据提取');

        this.extractedData.clear();

        if (this.detectPageType() === 'chat_page') {
            console.log('[DataExtractor] 聊天页面 - 启动轮询模式');
            if (this.pollingInterval) clearInterval(this.pollingInterval);
            this.pollingInterval = setInterval(() => this.extractData(), 2000);
        } else {
            console.log('[DataExtractor] 普通页面 - 启动DOM监听模式');
            this.startObserving();
        }
    }

    /**
     * 停止数据提取
     */
    stop() {
        if (!this.isActive) return;
        this.isActive = false;

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        console.log('[DataExtractor] 数据提取已停止');
    }

    /**
     * 启动DOM观察器
     */
    startObserving() {
        this.observer = new MutationObserver(() => {
            this.extractData();
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * 执行数据提取
     */
    extractData() {
        // 自动检测当前联系人（如果尚未设置）
        if (!this.memoryManager.currentChatId) {
            this.memoryManager.autoDetectCurrentContact();
        }
        
        try {
            const allExtractedData = [];
            
            const { messages } = this.extractChatMessages();
            if (messages.length > 0) {
                allExtractedData.push(...messages);
            }
            
            const { tuanInfo } = this.extractTuanInfo();
            if (tuanInfo.length > 0) {
                allExtractedData.push(...tuanInfo);
            }
            
            if (allExtractedData.length > 0) {
                this.sendDataToBackground({
                    type: 'dianping_data',
                    payload: {
                        pageType: this.detectPageType(),
                        data: allExtractedData
                    }
                });
            }
        } catch (error) {
            console.error('[DataExtractor] 数据提取错误:', error);
        }
    }

    /**
     * 提取聊天消息
     */
    extractChatMessages() {
        const messages = [];
        const messageNodes = ExtensionUtils.safeQueryAll(this.selectors.chatMessageList, document);

        messageNodes.forEach((node, index) => {
            const content = (node.innerText || node.textContent).trim();
            
            let messageType = '';
            let prefix = '';
            if (node.className.includes('shop-text')) {
                messageType = 'shop';
                prefix = '[商家] ';
            } else if (node.className.includes('normal-text')) {
                messageType = 'customer';
                prefix = '[客户] ';
            } else {
                messageType = 'unknown';
                prefix = '[未知] ';
            }
            
            const prefixedContent = prefix + content;
            
            // 简化的去重机制：仅基于内容和类型
            const uniqueKey = `${content}_${messageType}`;

            if (content && !this.extractedData.has(uniqueKey)) {
                const messageData = {
                    id: `msg_${Date.now()}_${index}`,
                    type: 'chat_message',
                    messageType: messageType,
                    content: prefixedContent,
                    originalContent: content,
                    timestamp: Date.now(),
                    chatId: this.memoryManager.currentChatId,
                    contactName: this.memoryManager.currentContactName
                };
                
                messages.push(messageData);
                this.extractedData.add(uniqueKey);
                
                // 只对客户消息添加到记忆并可能触发AI回复
                if (messageType === 'customer') {
                    this.memoryManager.addToMemory(messageData);
                } else {
                    // 商家消息只添加到记忆，不触发AI回复逻辑
                    this.memoryManager.addToMemoryWithoutTrigger(messageData);
                }
            }
        });
        
        if(messages.length > 0) {
            console.log(`[DataExtractor] 提取 ${messages.length} 条新消息`);
        }

        return { messages, count: messages.length };
    }

    /**
     * 提取团购信息
     */
    extractTuanInfo() {
        const tuanInfoList = [];
        const tuanNodes = ExtensionUtils.safeQueryAll(this.selectors.tuanInfo, document);

        tuanNodes.forEach((node, index) => {
            try {
                const nameNode = node.querySelector('.tuan-name');
                const salePriceNode = node.querySelector('.sale-price');
                const originalPriceNode = node.querySelector('.tuan-price .gray-price > span, .tuan-price > .gray > .gray-price:not(.left-dis)');
                const imageNode = node.querySelector('.tuan-img img');

                const name = nameNode ? nameNode.innerText.trim() : '';
                const salePrice = salePriceNode ? salePriceNode.innerText.trim() : '';
                
                const uniqueKey = `tuan_${name}_${salePrice}`;

                if (name && salePrice && !this.extractedData.has(uniqueKey)) {
                    const originalPrice = originalPriceNode ? originalPriceNode.innerText.trim() : '';
                    const image = imageNode ? imageNode.src : '';

                    tuanInfoList.push({
                        id: `tuan_${Date.now()}_${index}`,
                        type: 'tuan_info',
                        content: {
                            name,
                            salePrice,
                            originalPrice,
                            image,
                        }
                    });
                    this.extractedData.add(uniqueKey);
                }
            } catch (error) {
                console.error('[DataExtractor] 提取团购信息错误:', error);
            }
        });
        
        if(tuanInfoList.length > 0) {
            console.log(`[DataExtractor] 提取 ${tuanInfoList.length} 条团购信息`);
        }

        return { tuanInfo: tuanInfoList, count: tuanInfoList.length };
    }

    /**
     * 提取指定联系人的数据
     */
    async extractCurrentContactData(contactInfo) {
        console.log(`[DataExtractor] 开始为联系人 ${contactInfo.name} 提取数据...`);
        
        try {
            // 使用 MutationObserver 等待并提取店铺名称
            const shopName = await this.waitForShopNameWithObserver(5000); // 等待最多5秒
            this.memoryManager.updateShopName(shopName);

            const allExtractedData = [];
            
            const { messages } = this.extractChatMessages();
            if (messages.length > 0) {
                const messagesWithContact = messages.map(msg => ({
                    ...msg,
                    contactInfo: { ...contactInfo, shopName: this.memoryManager.currentShopName },
                    contactName: this.memoryManager.combinedContactName, // 使用组合名称
                    contactChatId: contactInfo.chatId
                }));
                allExtractedData.push(...messagesWithContact);
            }
            
            const { tuanInfo } = this.extractTuanInfo();
            if (tuanInfo.length > 0) {
                const tuanWithContact = tuanInfo.map(tuan => ({
                    ...tuan,
                    contactInfo: { ...contactInfo, shopName: this.memoryManager.currentShopName },
                    contactName: this.memoryManager.combinedContactName, // 使用组合名称
                    contactChatId: contactInfo.chatId
                }));
                allExtractedData.push(...tuanWithContact);
            }
            
            if (allExtractedData.length > 0) {
                console.log(`[DataExtractor] 为 "${this.memoryManager.combinedContactName}" 提取了 ${allExtractedData.length} 条数据`);
                this.sendDataToBackground({
                    type: 'dianping_data',
                    payload: {
                        pageType: this.detectPageType(),
                        data: allExtractedData
                    }
                });
            }
            
        } catch (error) {
            console.error('[DataExtractor] 提取当前联系人数据时出错:', error);
        }
    }

    /**
     * 修改：使用 MutationObserver 等待店铺名称出现
     * @param {number} timeout - 等待超时时间 (ms)
     * @returns {Promise<string|null>}
     */
    waitForShopNameWithObserver(timeout = 5000) {
        return new Promise(resolve => {
            const selector = '.userinfo-from-shop';

            // 立即检查元素是否已存在
            const existingElements = ExtensionUtils.safeQueryAll(selector);
            if (existingElements.length > 0 && existingElements[0].textContent.trim()) {
                console.log('[DataExtractor] 店铺名称被立即找到 (Shadow DOM)');
                const rawShopName = existingElements[0].textContent.trim();
                resolve(this.formatShopName(rawShopName));
                return;
            }

            const targetNode = document.body; // 观察整个文档的变化
            let timer = null;

            const observer = new MutationObserver((mutationsList, obs) => {
                const shopElements = ExtensionUtils.safeQueryAll(selector);
                if (shopElements.length > 0 && shopElements[0].textContent.trim()) {
                    console.log('[DataExtractor] 通过 MutationObserver 找到店铺名称 (Shadow DOM)');
                    const rawShopName = shopElements[0].textContent.trim();
                    if (timer) clearTimeout(timer);
                    obs.disconnect();
                    resolve(this.formatShopName(rawShopName));
                }
            });

            // 设置超时，以防元素一直不出现
            timer = setTimeout(() => {
                observer.disconnect();
                console.warn(`[DataExtractor] 等待店铺名称超时 (${timeout}ms)`);
                resolve(null); // 超时后返回 null，不中断流程
            }, timeout);

            observer.observe(targetNode, { childList: true, subtree: true });
            console.log('[DataExtractor] MutationObserver 已启动，等待店铺名称...');
        });
    }

    /**
     * 新增：格式化店铺名称
     * @param {string | null} rawName 原始店铺名称
     * @returns {string|null} 格式化后的店铺名称
     */
    formatShopName(rawName) {
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
        
        // 新增：移除全角括号内部的所有空格
        formattedName = formattedName.replace(/（([^）]+)）/g, (match, innerContent) => {
            return `（${innerContent.replace(/\s/g, '')}）`;
        });

        const finalName = formattedName.trim();
        console.log(`[DataExtractor] 店铺名称格式化: "${rawName}" -> "${finalName}"`);

        return finalName;
    }

    /**
     * 检测页面类型
     */
    detectPageType() {
        const url = window.location.href;
        if (url.includes('dzim-main-pc') || document.querySelector('wujie-app')) {
            return 'chat_page';
        }
        if (document.querySelector('.message-list') || document.querySelector('.text-message')) {
            return 'chat_page';
        }
        return 'unknown';
    }

    /**
     * 发送数据到后台脚本
     */
    sendDataToBackground(data) {
        try {
            // 检查扩展上下文是否有效
            if (!chrome.runtime || !chrome.runtime.sendMessage) {
                console.warn('[DataExtractor] 扩展上下文无效，跳过数据发送');
                return;
            }

            chrome.runtime.sendMessage({
                type: 'extractedData',
                data: data.payload.data
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('[DataExtractor] 数据发送失败，扩展上下文可能已失效:', chrome.runtime.lastError.message);
                }
            });
        } catch (error) {
            console.warn('[DataExtractor] 发送消息错误:', error.message);
        }
    }

    /**
     * 获取提取状态
     */
    isExtracting() {
        return this.isActive;
    }

    /**
     * 清空已提取数据缓存
     */
    clearExtractedCache() {
        this.extractedData.clear();
        console.log('[DataExtractor] 已清空提取数据缓存');
    }
}

// 导出数据提取器
window.DataExtractor = DataExtractor; 