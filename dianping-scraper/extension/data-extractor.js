/**
 * 大众点评数据提取器 - 数据提取模块
 * 负责页面数据的提取、处理和发送
 */

class DataExtractor {
    constructor() {
        this.extractedData = new Set();
        this.observer = null;
        this.utils = window.DianpingUtils;
        this.lastShopName = null; // 缓存上次的店铺名称，避免重复发送
        this.processedMessages = new Map(); // 存储已处理的消息ID及其时间戳
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
     * 格式化店铺名称 (委托给工具类)
     */
    formatShopName(rawName) {
        return this.utils.formatShopName(rawName);
    }

    /**
     * 使用 MutationObserver 等待店铺名称出现
     */
    waitForShopNameWithObserver(timeout = 5000) {
        return new Promise(resolve => {
            const selector = this.utils.selectors.shopInfo;

            // 立即检查元素是否已存在
            const existingElements = this.utils.findAllElements(selector, document);
            if (existingElements.length > 0 && existingElements[0].textContent.trim()) {
                console.log('[DataExtractor] 店铺名称被立即找到 (Shadow DOM)');
                const rawShopName = existingElements[0].textContent.trim();
                resolve(this.utils.formatShopName(rawShopName));
                return;
            }

            const targetNode = document.body;
            let timer = null;

            const observer = new MutationObserver((mutationsList, obs) => {
                const shopElements = this.utils.findAllElements(selector, document);
                if (shopElements.length > 0 && shopElements[0].textContent.trim()) {
                    console.log('[DataExtractor] 通过 MutationObserver 找到店铺名称 (Shadow DOM)');
                    const rawShopName = shopElements[0].textContent.trim();
                    if (timer) clearTimeout(timer);
                    obs.disconnect();
                    resolve(this.utils.formatShopName(rawShopName));
                }
            });

            // 设置超时
            timer = setTimeout(() => {
                observer.disconnect();
                console.warn(`[DataExtractor] 等待店铺名称超时 (${timeout}ms)`);
                resolve(null);
            }, timeout);

            observer.observe(targetNode, { childList: true, subtree: true });
            console.log('[DataExtractor] MutationObserver 已启动，等待店铺名称...');
        });
    }

    /**
     * 开始DOM观察
     */
    startObserving(memoryManager, sendDataCallback) {
        this.observer = new MutationObserver(() => {
            this.extractData(memoryManager, sendDataCallback);
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * 停止DOM观察
     */
    stopObserving() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    /**
     * 提取聊天消息
     */
    extractChatMessages(memoryManager) {
        const messages = [];
        const messageNodes = this.utils.findAllElements(this.utils.selectors.chatMessageList, document);
        const memoryStatus = memoryManager.getMemoryStatus();

        messageNodes.forEach((node, index) => {
            // 使用新的表情处理方法提取内容
            const content = this.utils.extractMessageContent(node);
            
            let messageType = '';
            let prefix = '';
            // 改进角色判断逻辑，添加更多调试信息
            if (node.className.includes('shop-text')) {
                messageType = 'shop';  // 商家消息，对应assistant角色
                prefix = '[商家] ';
            } else if (node.className.includes('normal-text')) {
                messageType = 'customer';  // 客户消息，对应user角色
                prefix = '[客户] ';
            } else {
                messageType = 'unknown';
                prefix = '[未知] ';
                console.log(`[DataExtractor] 未知消息类型，className: ${node.className}`);
            }
            
            // 调试信息
            if (content.length > 0) {
                console.log(`[DataExtractor] 检测到${messageType}消息: "${content}" (长度: ${content.length})`);
            }
            
            const prefixedContent = prefix + content;
            const uniqueKey = `${content}_${messageType}`;

            // 只要有内容（包括纯表情）且不重复，就提取
            if (content.length > 0 && !this.extractedData.has(uniqueKey)) {
                // 添加更严格的去重机制，包含chatId和内容的组合
                const strictUniqueKey = `${memoryStatus.currentChatId}_${content}_${messageType}`;
                
                if (this.extractedData.has(strictUniqueKey)) {
                    console.log(`[DataExtractor] 跳过重复消息: ${content}`);
                    return;
                }
                
                // 检查是否已经处理过这条消息
                const messageSignature = `${memoryStatus.currentChatId}_${messageType}_${content}`;
                const now = Date.now();
                
                if (this.processedMessages.has(messageSignature)) {
                    const lastProcessed = this.processedMessages.get(messageSignature);
                    // 如果5分钟内已经处理过相同的消息，跳过
                    if (now - lastProcessed < 5 * 60 * 1000) {
                        console.log(`[DataExtractor] 5分钟内已处理过此消息，跳过: ${content}`);
                        return;
                    }
                }
                
                // 记录处理时间
                this.processedMessages.set(messageSignature, now);
                
                const messageData = {
                    id: this.utils.generateId('msg'),
                    type: 'chat_message',
                    messageType: messageType,
                    content: prefixedContent,
                    originalContent: content,
                    timestamp: new Date().toISOString(), // 注意：这是检测时间，非实际消息时间
                    chatId: memoryStatus.currentChatId,
                    contactName: memoryStatus.combinedContactName
                };
                
                messages.push(messageData);
                this.extractedData.add(uniqueKey);
                this.extractedData.add(strictUniqueKey); // 同时添加严格去重键
                
                // 根据消息类型添加到记忆
                if (messageType === 'customer') {
                    memoryManager.addToMemory(messageData);
                } else {
                    memoryManager.addToMemoryWithoutTrigger(messageData);
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
        const tuanNodes = this.utils.findAllElements(this.utils.selectors.tuanInfo, document);

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
                        id: this.utils.generateId('tuan'),
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
     * 执行完整的数据提取
     */
    extractData(memoryManager, sendDataCallback) {
        try {
            const allExtractedData = [];
            
            const { messages } = this.extractChatMessages(memoryManager);
            if (messages.length > 0) {
                allExtractedData.push(...messages);
            }
            
            const { tuanInfo } = this.extractTuanInfo();
            if (tuanInfo.length > 0) {
                allExtractedData.push(...tuanInfo);
            }
            
            // 检查并发送店铺信息更新
            this.checkAndSendShopInfoUpdate();
            
            if (allExtractedData.length > 0 && sendDataCallback) {
                sendDataCallback({
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
     * 检查并发送店铺信息更新
     */
    checkAndSendShopInfoUpdate() {
        try {
            const shopName = this.utils.getCurrentShopName();
            if (shopName && shopName !== this.lastShopName) {
                console.log(`[DataExtractor] 检测到店铺信息: ${shopName}`);
                this.lastShopName = shopName;
                this.utils.sendShopInfoUpdate(shopName);
            }
        } catch (error) {
            console.error('[DataExtractor] 检查店铺信息时出错:', error);
        }
    }

    /**
     * 清空已提取数据缓存
     */
    clearExtractedData() {
        this.extractedData.clear();
        this.lastShopName = null; // 重置店铺名称缓存
        this.processedMessages.clear(); // 清空已处理消息记录
    }
}

// 导出到全局
window.DataExtractor = DataExtractor; 