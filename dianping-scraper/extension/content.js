/**
 * 大众点评数据提取器 - 主入口文件（重构版）
 * 负责模块协调、消息监听和注入脚本执行
 */

(function() {
    'use strict';
    
    console.log('[DianpingExtractor] Content Script 加载完成 (重构版)');
    
    class DianpingDataExtractor {
        constructor() {
            this.isActive = false;
            this.pollingInterval = null;
            
            // 初始化各个模块
            this.dataExtractor = new DataExtractor();
            this.contactManager = new ContactManager();
            this.memoryManager = new MemoryManager();
            
            // 设置模块间的关联
            this.contactManager.setMemoryManager(this.memoryManager);
            this.contactManager.setContactClickedCallback((contactInfo) => {
                this.handleContactClicked(contactInfo);
            });
            
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
                        this.contactManager.startClickContacts(request.count, request.interval);
                        sendResponse({ status: 'started' });
                        break;
                    case 'stopClickContacts':
                        this.contactManager.stopClickContacts();
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
                        const shopName = window.DianpingUtils.getCurrentShopName();
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
                id: window.DianpingUtils.generateId('ai_reply'),
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

            this.dataExtractor.clearExtractedData();

            // 立即检查并发送店铺信息更新
            this.sendShopInfoUpdate();

            if (this.dataExtractor.detectPageType() === 'chat_page') {
                console.log('[DianpingExtractor] 聊天页面 - 启动轮询模式');
                if (this.pollingInterval) clearInterval(this.pollingInterval);
                this.pollingInterval = setInterval(() => this.extractData(), 2000);
            } else {
                console.log('[DianpingExtractor] 普通页面 - 启动DOM监听模式');
                this.dataExtractor.startObserving(this.memoryManager, (data) => {
                    this.sendDataToBackground(data);
                });
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

            this.dataExtractor.stopObserving();
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
         * 提取数据
         */
        extractData() {
            // 自动检测当前联系人（如果尚未设置）
            const memoryStatus = this.memoryManager.getMemoryStatus();
            if (!memoryStatus.currentChatId) {
                this.contactManager.autoDetectCurrentContact(this.memoryManager);
            }
            
            // 执行数据提取
            this.dataExtractor.extractData(this.memoryManager, (data) => {
                this.sendDataToBackground(data);
            });
            
            // 发送店铺信息更新（如果有变化）
            this.sendShopInfoUpdate();
        }

        /**
         * 发送店铺信息更新
         */
        sendShopInfoUpdate() {
            const shopName = window.DianpingUtils.getCurrentShopName();
            window.DianpingUtils.sendShopInfoUpdate(shopName);
        }
        
        /**
         * 处理联系人点击事件
         */
        async handleContactClicked(contactInfo) {
            if (!this.contactManager.getClickingStatus().isClickingContacts) return;
            
            console.log(`[DianpingExtractor] 开始提取联系人 ${contactInfo.name} 的数据...`);
            
            try {
                // 等待店铺名称
                const shopName = await this.dataExtractor.waitForShopNameWithObserver(5000);
                this.memoryManager.updateShopName(shopName);
                
                const allExtractedData = [];
                const memoryStatus = this.memoryManager.getMemoryStatus();
                
                const { messages } = this.dataExtractor.extractChatMessages(this.memoryManager);
                if (messages.length > 0) {
                    const messagesWithContact = messages.map(msg => ({
                        ...msg,
                        contactInfo: { ...contactInfo, shopName: shopName },
                        contactName: memoryStatus.combinedContactName,
                        contactChatId: contactInfo.chatId
                    }));
                    allExtractedData.push(...messagesWithContact);
                }
                
                const { tuanInfo } = this.dataExtractor.extractTuanInfo();
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
                            pageType: this.dataExtractor.detectPageType(),
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
                this.contactManager.proceedToNextContact();
            }, this.contactManager.extractionWaitTime);
        }
    }
    
    // 确保依赖模块已加载
    if (typeof window.DianpingUtils === 'undefined') {
        console.error('[DianpingExtractor] DianpingUtils未加载，请检查utils.js是否正确加载');
        return;
    }
    
    if (typeof MemoryManager === 'undefined') {
        console.error('[DianpingExtractor] MemoryManager未加载，请检查memory.js是否正确加载');
        return;
    }
    
    if (typeof DataExtractor === 'undefined') {
        console.error('[DianpingExtractor] DataExtractor未加载，请检查data-extractor.js是否正确加载');
        return;
    }
    
    if (typeof ContactManager === 'undefined') {
        console.error('[DianpingExtractor] ContactManager未加载，请检查contact-manager.js是否正确加载');
        return;
    }
    
    if (!window.dianpingExtractor) {
        window.dianpingExtractor = new DianpingDataExtractor();
    }
})(); 