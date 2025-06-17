/**
 * 大众点评数据提取器 - Content Script (重构版)
 * 整合记忆管理、数据提取、消息发送等模块
 */

(function() {
    'use strict';
    
    console.log('[DianpingExtractor] Content Script 加载完成 (重构版)');
    
    class DianpingDataExtractor {
        constructor() {
            // 批量联系人点击相关属性
            this.isClickingContacts = false;
            this.clickTimeout = null;
            this.pageLoadTimeout = null;
            this.extractionTimeout = null;
            this.clickCount = 0;
            this.totalClicks = 0;
            this.totalProcessedContacts = 0; // 总处理的联系人数量（用于计算循环轮数）
            this.clickInterval = 2000;
            this.pageLoadWaitTime = 1500;
            this.extractionWaitTime = 2500;
            
            this.selectors = {
                contactItems: '.chat-list-item',
            };
            
            this.init();
        }

        /**
         * 初始化提取器
         */
        init() {
            this.initializeModules();
            this.listenForCommands();
            this.startContactPolling();
            console.log('[DianpingExtractor] 大众点评数据提取器初始化完成');
        }

        /**
         * 初始化所有模块
         */
        initializeModules() {
            // 初始化记忆管理器
            this.memoryManager = new MemoryManager();
            
            // 初始化数据提取器
            this.dataExtractor = new DataExtractor(this.memoryManager);
            
            // 初始化消息发送器
            this.messageSender = new MessageSender(this.memoryManager);
        }

        /**
         * 监听Chrome扩展命令
         */
        listenForCommands() {
            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                console.log(`[DianpingExtractor] 收到命令: ${request.type}`);
                
                switch (request.type) {
                    case 'startExtraction':
                        this.dataExtractor.start();
                        sendResponse({ status: 'started' });
                        break;
                        
                    case 'stopExtraction':
                        this.dataExtractor.stop();
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
                        this.messageSender.executeTestSend()
                            .then(result => sendResponse(result))
                            .catch(error => sendResponse({ status: 'failed', message: error.message }));
                        break;
                        
                    case 'sendAIReply':
                        this.messageSender.sendAIReply(request.text)  
                             .then(result => sendResponse(result))
                             .catch(error => sendResponse({ status: 'failed', message: error.message }));
                        break;

                    case 'getShopName':
                        const shopInfoElement = document.querySelector('.userinfo-from-shop');
                        const shopName = shopInfoElement ? shopInfoElement.textContent.trim() : null;
                        sendResponse({ shopName: shopName });
                        break;
                }
                return true;
            });
        }

        /**
         * 开始批量点击联系人
         */
        startClickContacts(count = 10, interval = 2000) {
            if (this.isClickingContacts) {
                console.log('[DianpingExtractor] 稳定工作已在进行中');
                return;
            }
            
            this.isClickingContacts = true;
            this.clickCount = 0;
            this.totalClicks = count;
            this.totalProcessedContacts = 0; // 重置总处理数量
            this.clickInterval = interval;

            // 动态调整内部延迟时间
            this.pageLoadWaitTime = Math.min(1500, interval * 0.6);
            this.extractionWaitTime = Math.min(2500, interval * 0.8);
            
            console.log(`[DianpingExtractor] 开始稳定工作，总数: ${count}, 间隔: ${interval}ms`);
            this.sendProgressUpdate();
            this.clickNextContact();
        }
        
        /**
         * 停止批量点击联系人
         */
        stopClickContacts() {
            if (!this.isClickingContacts) return;
            
            this.isClickingContacts = false;

            // 清除所有相关的定时器
            if (this.clickTimeout) {
                clearTimeout(this.clickTimeout);
                this.clickTimeout = null;
            }
            if (this.pageLoadTimeout) {
                clearTimeout(this.pageLoadTimeout);
                this.pageLoadTimeout = null;
            }
            if (this.extractionTimeout) {
                clearTimeout(this.extractionTimeout);
                this.extractionTimeout = null;
            }
            
            console.log('[DianpingExtractor] 稳定工作已通过清除所有定时器强制停止');
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
                console.log('[DianpingExtractor] 完成一轮稳定工作，重新开始循环');
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
                
                const contactInfo = this.memoryManager.getContactInfo(targetContact);
                console.log(`[DianpingExtractor] 点击第 ${this.clickCount + 1} 个联系人: ${contactInfo.name}`);
                
                // 检测联系人切换并处理记忆
                this.memoryManager.handleContactSwitch(contactInfo);
                
                targetContact.click();
                
                this.clickCount++;
                this.totalProcessedContacts++; // 更新总处理数量
                this.sendProgressUpdate(`正在处理联系人: ${contactInfo.name}`);
                
                // 等待页面加载后，异步执行提取
                this.pageLoadTimeout = setTimeout(async () => {
                    await this.extractCurrentContactData(contactInfo);
                }, this.pageLoadWaitTime);
                
            } catch (error) {
                console.error('[DianpingExtractor] 点击联系人错误:', error);
                this.sendErrorMessage(`点击错误: ${error.message}`);
            }
        }

        /**
         * 提取当前联系人数据
         */
        async extractCurrentContactData(contactInfo) {
            if (!this.isClickingContacts) return;
            
            console.log(`[DianpingExtractor] 通知 DataExtractor 开始为 ${contactInfo.name} 提取...`);
            // 异步调用并等待数据提取器完成
            await this.dataExtractor.extractCurrentContactData(contactInfo);
            console.log(`[DianpingExtractor] DataExtractor 已完成对 ${contactInfo.name} 的处理`);
            
            // 使用固定的延迟，让出控制权，然后再继续下一个
            this.extractionTimeout = setTimeout(() => {
                this.proceedToNextContact();
            }, this.extractionWaitTime);
        }
        
        /**
         * 继续下一个联系人
         */
        proceedToNextContact() {
            if (!this.isClickingContacts) return;
            
            // 无限循环：始终继续到下一个联系人
            this.clickTimeout = setTimeout(() => this.clickNextContact(), this.clickInterval);
        }
        
        /**
         * 发送进度更新
         */
        sendProgressUpdate(status = '') {
            try {
                // 检查扩展上下文是否有效
                if (!chrome.runtime || !chrome.runtime.sendMessage) {
                    console.warn('[DianpingExtractor] 扩展上下文无效，跳过进度更新');
                    return;
                }

                // 计算循环轮数
                const currentRound = Math.floor(this.totalProcessedContacts / this.totalClicks) + 1;
                const currentInRound = this.clickCount === 0 ? this.totalClicks : this.clickCount;

                chrome.runtime.sendMessage({
                    type: 'clickProgress',
                    current: currentInRound,
                    total: this.totalClicks,
                    round: currentRound,
                    status: status,
                    isLooping: true
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[DianpingExtractor] 进度更新失败，扩展上下文可能已失效:', chrome.runtime.lastError.message);
                    }
                });
            } catch (error) {
                console.warn('[DianpingExtractor] 发送进度更新错误:', error.message);
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
                // 检查扩展上下文是否有效
                if (!chrome.runtime || !chrome.runtime.sendMessage) {
                    console.warn('[DianpingExtractor] 扩展上下文无效，跳过错误消息发送');
                    return;
                }

                chrome.runtime.sendMessage({
                    type: 'clickError',
                    message: message
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('[DianpingExtractor] 错误消息发送失败，扩展上下文可能已失效:', chrome.runtime.lastError.message);
                    }
                });
            } catch (error) {
                console.warn('[DianpingExtractor] 发送错误消息错误:', error.message);
            }
        }

        /**
         * 查找所有匹配的元素（包括Shadow DOM）
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
         * 获取提取器状态
         */
        getStatus() {
            return {
                isExtracting: this.dataExtractor.isExtracting(),
                isClickingContacts: this.isClickingContacts,
                currentContact: this.memoryManager.getCurrentContact(),
                clickProgress: {
                    current: this.clickCount,
                    total: this.totalClicks
                }
            };
        }

        /**
         * 关键修复：持续轮询直到检测到联系人
         */
        startContactPolling() {
            // 先立即尝试一次
            this.memoryManager.autoDetectCurrentContact();
            if (this.memoryManager.isContactDetected()) {
                console.log('[DianpingExtractor] 首次尝试成功检测到联系人');
                return;
            }

            console.log('[DianpingExtractor] 未立即检测到联系人，启动轮询...');
            const pollInterval = 1000; // 每秒检测一次
            const maxAttempts = 15; // 最多尝试15秒
            let attempts = 0;

            const pollingId = setInterval(() => {
                attempts++;
                this.memoryManager.autoDetectCurrentContact();
                
                if (this.memoryManager.isContactDetected() || attempts >= maxAttempts) {
                    clearInterval(pollingId);
                    if (this.memoryManager.isContactDetected()) {
                         console.log(`[DianpingExtractor] 轮询成功，在第 ${attempts} 次尝试后检测到联系人`);
                    } else {
                         console.warn(`[DianpingExtractor] 轮询超时，${maxAttempts}秒后仍未检测到联系人`);
                    }
                }
            }, pollInterval);
        }
    }
    
    // 等待所有模块加载完成后初始化
    function initializeWhenReady() {
        // 检查所有必需的模块是否已加载
        if (typeof MemoryManager !== 'undefined' && 
            typeof DataExtractor !== 'undefined' && 
            typeof MessageSender !== 'undefined') {
            
            if (!window.dianpingExtractor) {
                window.dianpingExtractor = new DianpingDataExtractor();
            }
        } else {
            // 如果模块还没加载完成，继续等待
            setTimeout(initializeWhenReady, 100);
        }
    }
    
    // 开始初始化检查
    initializeWhenReady();
})(); 