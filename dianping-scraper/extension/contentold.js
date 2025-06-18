/**
 * 大众点评数据提取器 - Content Script
 * 重构版 - 核心数据提取和用户交互功能
 */

(function() {
    'use strict';
    
    console.log('[DianpingExtractor] Content Script 加载完成 (重构版)');
    
    class DianpingDataExtractor {
        constructor() {
            this.isActive = false;
            this.observer = null;
            this.pollingInterval = null;
            this.extractedData = new Set();
            
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

            // 数据提取选择器
            this.selectors = {
                chatMessageList: '.text-message.normal-text, .rich-message, .text-message.shop-text',
                tuanInfo: '.tuan',
                contactItems: '.chat-list-item',
            };
            
            // 初始化记忆管理器
            this.memoryManager = new MemoryManager();
            
            this.init();
        }

        init() {
            this.listenForCommands();
        }

        /**
         * 监听来自后台脚本的命令
         */
        listenForCommands() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log(`[DianpingExtractor] 收到命令: ${request.type}`);
                switch (request.type) {
                    case 'startExtraction':
                        this.start();
                        sendResponse({ status: 'started' });
                        break;
                    case 'stopExtraction':
                        this.stop();
                        sendResponse({ status: 'stopped' });
                        break;
                    case 'startClickContacts':
                        this.startClickContacts(request.count, request.interval);
                        sendResponse({ status: 'started' });
                        break;
                    case 'stopClickContacts':
                        this.stopClickContacts();
                        sendResponse({ status: 'stopped' });
                        break;
                    case 'testSendMessage':
                        this.executeTestSend()
                            .then(result => sendResponse(result))
                            .catch(error => sendResponse({ status: 'failed', message: error.message }));
                        break;
                    case 'sendAIReply':
                        this.sendAIReply(request.text)
                             .then(result => sendResponse(result))
                             .catch(error => sendResponse({ status: 'failed', message: error.message }));
                        break;
                    case 'getShopName':
                        const shopInfoElement = document.querySelector('.userinfo-from-shop');
                        const shopName = shopInfoElement ? this.formatShopName(shopInfoElement.textContent.trim()) : null;
                        sendResponse({ shopName: shopName });
                        break;
                }
                return true;
            });
        }
        
        /**
         * 执行注入脚本任务
         */
        _executeInjectedScript(task) {
            console.log(`[ContentScript] Injecting script to perform task:`, task);
            
            return new Promise((resolve, reject) => {
                const scriptId = 'verve-injector-script';
                const taskEventName = 'verveInjectorTask';
                const resultEventName = 'verveInjectorResult';

                // 清理之前的脚本
                document.getElementById(scriptId)?.remove();

                // 1. 定义结果监听器
                const resultListener = (event) => {
                    console.log(`[ContentScript] Received result:`, event.detail);
                    if (event.detail.status === 'success') {
                        resolve({ status: 'success', message: event.detail.message });
                    } else {
                        reject(new Error(event.detail.message || 'Injected script failed.'));
                    }
                    // 自动清理
                    window.removeEventListener(resultEventName, resultListener);
                    document.getElementById(scriptId)?.remove();
                };

                // 2. 添加结果监听器
                window.addEventListener(resultEventName, resultListener, { once: true });

                // 3. 创建并注入脚本元素
                const script = document.createElement('script');
                script.id = scriptId;
                script.src = chrome.runtime.getURL('injector.js');
                
                // 4. 脚本加载完成后，向其发送任务
                script.onload = () => {
                    console.log('[ContentScript] Injected script loaded. Sending task...');
                    window.dispatchEvent(new CustomEvent(taskEventName, { detail: task }));
                };
                
                script.onerror = (e) => {
                    console.error('[ContentScript] Failed to load injector script:', e);
                    window.removeEventListener(resultEventName, resultListener);
                    reject(new Error('Failed to load injector script.'));
                };
                
                (document.head || document.documentElement).appendChild(script);
            });
        }

        /**
         * 执行测试发送
         */
        executeTestSend() {
            return this._executeInjectedScript({
                action: 'testAndSend',
                text: '这是一个自动发送的测试消息'
            });
        }

        /**
         * 发送AI回复
         */
        sendAIReply(replyText) {
            console.log(`[ContentScript] Received request to send AI reply: "${replyText}"`);
            
            // 将AI回复添加到记忆中
            const memoryStatus = this.memoryManager.getMemoryStatus();
            const aiReplyData = {
                id: `ai_reply_${Date.now()}`,
                type: 'chat_message',
                messageType: 'shop',
                content: `[商家] ${replyText}`,
                originalContent: replyText,
                timestamp: Date.now(),
                chatId: memoryStatus.currentChatId,
                contactName: memoryStatus.combinedContactName
            };
            
            this.memoryManager.addToMemoryWithoutTrigger(aiReplyData);
            
            return this._executeInjectedScript({
                action: 'testAndSend',
                text: replyText
            });
        }
        
        /**
         * 开始数据提取
         */
        start() {
            if (this.isActive) {
                console.log('[DianpingExtractor] 提取器已激活');
                return;
            }
            this.isActive = true;
            console.log('[DianpingExtractor] 开始数据提取');

            this.extractedData.clear();

            if (this.detectPageType() === 'chat_page') {
                console.log('[DianpingExtractor] 聊天页面 - 启动轮询模式');
                if (this.pollingInterval) clearInterval(this.pollingInterval);
                this.pollingInterval = setInterval(() => this.extractData(), 2000);
            } else {
                console.log('[DianpingExtractor] 普通页面 - 启动DOM监听模式');
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
            console.log('[DianpingExtractor] 数据提取已停止');
        }

        /**
         * 发送数据到后台脚本
         */
        sendDataToBackground(data) {
            try {
                chrome.runtime.sendMessage({
                    type: 'extractedData',
                    data: data.payload.data
                });
            } catch (error) {
                console.error('[DianpingExtractor] 发送消息错误:', error);
            }
        }

        /**
         * 格式化店铺名称
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
            
            // 移除全角括号内部的所有空格
            formattedName = formattedName.replace(/（([^）]+)）/g, (match, innerContent) => {
                return `（${innerContent.replace(/\s/g, '')}）`;
            });

            const finalName = formattedName.trim();
            console.log(`[DianpingExtractor] 店铺名称格式化: "${rawName}" -> "${finalName}"`);

            return finalName;
        }

        /**
         * 使用 MutationObserver 等待店铺名称出现
         */
        waitForShopNameWithObserver(timeout = 5000) {
            return new Promise(resolve => {
                const selector = '.userinfo-from-shop';

                // 立即检查元素是否已存在
                const existingElements = this.findAllElements(selector, document);
                if (existingElements.length > 0 && existingElements[0].textContent.trim()) {
                    console.log('[DianpingExtractor] 店铺名称被立即找到 (Shadow DOM)');
                    const rawShopName = existingElements[0].textContent.trim();
                    resolve(this.formatShopName(rawShopName));
                    return;
                }

                const targetNode = document.body;
                let timer = null;

                const observer = new MutationObserver((mutationsList, obs) => {
                    const shopElements = this.findAllElements(selector, document);
                    if (shopElements.length > 0 && shopElements[0].textContent.trim()) {
                        console.log('[DianpingExtractor] 通过 MutationObserver 找到店铺名称 (Shadow DOM)');
                        const rawShopName = shopElements[0].textContent.trim();
                        if (timer) clearTimeout(timer);
                        obs.disconnect();
                        resolve(this.formatShopName(rawShopName));
                    }
                });

                // 设置超时
                timer = setTimeout(() => {
                    observer.disconnect();
                    console.warn(`[DianpingExtractor] 等待店铺名称超时 (${timeout}ms)`);
                    resolve(null);
                }, timeout);

                observer.observe(targetNode, { childList: true, subtree: true });
                console.log('[DianpingExtractor] MutationObserver 已启动，等待店铺名称...');
            });
        }
         
        /**
         * 开始DOM观察
         */
        startObserving() {
            this.observer = new MutationObserver(() => {
                this.extractData();
            });
            this.observer.observe(document.body, { childList: true, subtree: true });
        }

        /**
         * 提取数据
         */
        extractData() {
            // 自动检测当前联系人（如果尚未设置）
            const memoryStatus = this.memoryManager.getMemoryStatus();
            if (!memoryStatus.currentChatId) {
                this.autoDetectCurrentContact();
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
                console.error('[DianpingExtractor] 数据提取错误:', error);
            }
        }
        
        /**
         * 自动检测当前联系人
         */
        autoDetectCurrentContact() {
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
                const shopName = shopInfoElement ? this.formatShopName(shopInfoElement.textContent.trim()) : null;
                
                // 更新记忆管理器中的联系人信息
                this.memoryManager.updateContactInfo(chatId, contactName, shopName);
                
                console.log(`[联系人检测] 最终确定联系人: ${contactName} (ID: ${chatId}), 店铺: ${shopName}`);
                
            } catch (error) {
                console.error('[联系人检测] 自动检测联系人错误:', error);
                const timestamp = Date.now();
                const chatId = `error_${timestamp}`;
                const contactName = `错误恢复_${timestamp}`;
                this.memoryManager.updateContactInfo(chatId, contactName);
                console.log(`[联系人检测] 错误恢复，使用: ${contactName}`);
            }
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
         * 提取聊天消息
         */
        extractChatMessages() {
            const messages = [];
            const messageNodes = this.findAllElements(this.selectors.chatMessageList, document);
            const memoryStatus = this.memoryManager.getMemoryStatus();

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
                const uniqueKey = `${content}_${messageType}`;

                if (content && !this.extractedData.has(uniqueKey)) {
                    const messageData = {
                        id: `msg_${Date.now()}_${index}`,
                        type: 'chat_message',
                        messageType: messageType,
                        content: prefixedContent,
                        originalContent: content,
                        timestamp: Date.now(),
                        chatId: memoryStatus.currentChatId,
                        contactName: memoryStatus.combinedContactName
                    };
                    
                    messages.push(messageData);
                    this.extractedData.add(uniqueKey);
                    
                    // 根据消息类型添加到记忆
                    if (messageType === 'customer') {
                        this.memoryManager.addToMemory(messageData);
                    } else {
                        this.memoryManager.addToMemoryWithoutTrigger(messageData);
                    }
                }
            });
            
            if(messages.length > 0) {
                console.log(`[DianpingExtractor] 提取 ${messages.length} 条新消息`);
            }

            return { messages, count: messages.length };
        }

        /**
         * 提取团购信息
         */
        extractTuanInfo() {
            const tuanInfoList = [];
            const tuanNodes = this.findAllElements(this.selectors.tuanInfo, document);

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
                    console.error('[DianpingExtractor] 提取团购信息错误:', error);
                }
            });
            
            if(tuanInfoList.length > 0) {
                console.log(`[DianpingExtractor] 提取 ${tuanInfoList.length} 条团购信息`);
            }

            return { tuanInfo: tuanInfoList, count: tuanInfoList.length };
        }
        
        /**
         * 开始点击联系人循环
         */
        startClickContacts(count = 2, interval = 2000) {
            if (this.isClickingContacts) {
                console.log('[DianpingExtractor] 循环提取已在进行中');
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
            
            console.log(`[DianpingExtractor] 开始循环提取，总数: ${count}, 间隔: ${interval}ms`);
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
            
            console.log('[DianpingExtractor] 循环提取已停止');
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
                console.log(`[DianpingExtractor] 完成第${this.currentRound - 1}轮循环，开始第${this.currentRound}轮`);
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
                console.log(`[DianpingExtractor] 点击第 ${this.clickCount + 1} 个联系人: ${contactInfo.name}`);
                
                // 处理联系人切换
                this.memoryManager.handleContactSwitch(contactInfo);
                
                targetContact.click();
                
                this.clickCount++;
                this.totalProcessedContacts++;
                this.sendProgressUpdate(`正在处理联系人: ${contactInfo.name}`);
                
                setTimeout(() => {
                    this.extractCurrentContactData(contactInfo);
                }, this.pageLoadWaitTime);
                
            } catch (error) {
                console.error('[DianpingExtractor] 点击联系人错误:', error);
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
            const shopName = shopInfoElement ? this.formatShopName(shopInfoElement.textContent.trim()) : null;
            
            return {
                name: name,
                chatId: chatId,
                shopName: shopName,
                timestamp: Date.now()
            };
        }
        
        /**
         * 提取当前联系人数据
         */
        async extractCurrentContactData(contactInfo) {
            if (!this.isClickingContacts) return;
            
            console.log(`[DianpingExtractor] 开始提取联系人 ${contactInfo.name} 的数据...`);
            
            try {
                // 等待店铺名称
                const shopName = await this.waitForShopNameWithObserver(5000);
                this.memoryManager.updateShopName(shopName);
                
                const allExtractedData = [];
                const memoryStatus = this.memoryManager.getMemoryStatus();
                
                const { messages } = this.extractChatMessages();
                if (messages.length > 0) {
                    const messagesWithContact = messages.map(msg => ({
                        ...msg,
                        contactInfo: { ...contactInfo, shopName: shopName },
                        contactName: memoryStatus.combinedContactName,
                        contactChatId: contactInfo.chatId
                    }));
                    allExtractedData.push(...messagesWithContact);
                }
                
                const { tuanInfo } = this.extractTuanInfo();
                if (tuanInfo.length > 0) {
                    const tuanWithContact = tuanInfo.map(tuan => ({
                        ...tuan,
                        contactInfo: { ...contactInfo, shopName: shopName },
                        contactName: memoryStatus.combinedContactName,
                        contactChatId: contactInfo.chatId
                    }));
                    allExtractedData.push(...tuanWithContact);
                }
                
                if (allExtractedData.length > 0) {
                    console.log(`[DianpingExtractor] 为 "${memoryStatus.combinedContactName}" 提取了 ${allExtractedData.length} 条数据`);
                    this.sendDataToBackground({
                        type: 'dianping_data',
                        payload: {
                            pageType: this.detectPageType(),
                            data: allExtractedData
                        }
                    });
                } else {
                    console.log(`[DianpingExtractor] 联系人 "${memoryStatus.combinedContactName}" 暂无新数据`);
                }
                
            } catch (error) {
                console.error('[DianpingExtractor] 提取当前联系人数据时出错:', error);
            }
            
            setTimeout(() => {
                this.proceedToNextContact();
            }, this.extractionWaitTime);
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
                console.error('[DianpingExtractor] 发送进度更新错误:', error);
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
                console.error('[DianpingExtractor] 发送错误消息错误:', error);
            }
        }
    }
    
    // 确保MemoryManager已加载
    if (typeof MemoryManager === 'undefined') {
        console.error('[DianpingExtractor] MemoryManager未加载，请检查memory.js是否正确加载');
        return;
    }
    
    if (!window.dianpingExtractor) {
        window.dianpingExtractor = new DianpingDataExtractor();
    }
})(); 