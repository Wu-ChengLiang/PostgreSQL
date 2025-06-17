/**
 * 消息发送器 - Message Sender
 * 负责处理AI回复发送和测试消息发送功能
 */
class MessageSender {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.initSender();
    }

    /**
     * 初始化消息发送器
     */
    initSender() {
        console.log('[MessageSender] 消息发送器初始化完成');
    }

    /**
     * 执行注入脚本任务
     */
    _executeInjectedScript(task) {
        console.log(`[MessageSender] 注入脚本执行任务:`, task);
        
        return new Promise((resolve, reject) => {
            const scriptId = 'verve-injector-script';
            const taskEventName = 'verveInjectorTask';
            const resultEventName = 'verveInjectorResult';

            // 清理之前的脚本
            document.getElementById(scriptId)?.remove();

            // 1. 定义结果监听器
            const resultListener = (event) => {
                console.log(`[MessageSender] 收到结果:`, event.detail);
                if (event.detail.status === 'success') {
                    resolve({ status: 'success', message: event.detail.message });
                } else {
                    reject(new Error(event.detail.message || '注入脚本执行失败'));
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
            
            // 4. 脚本加载完成后，分发任务给它
            script.onload = () => {
                console.log('[MessageSender] 注入脚本已加载，发送任务...');
                window.dispatchEvent(new CustomEvent(taskEventName, { detail: task }));
            };
            
            script.onerror = (e) => {
                console.error('[MessageSender] 注入脚本加载失败:', e);
                window.removeEventListener(resultEventName, resultListener); // 错误时清理
                reject(new Error('注入脚本加载失败'));
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
        console.log(`[MessageSender] 收到AI回复发送请求: "${replyText}"`);
        
        // 将AI回复添加到记忆中
        const aiReplyData = {
            id: `ai_reply_${Date.now()}`,
            type: 'chat_message',
            messageType: 'shop', // AI回复算作商家回复
            content: `[商家] ${replyText}`,
            originalContent: replyText,
            timestamp: Date.now(),
            chatId: this.memoryManager.currentChatId,
            contactName: this.memoryManager.currentContactName
        };
        
        this.memoryManager.addToMemoryWithoutTrigger(aiReplyData);
        
        return this._executeInjectedScript({
            action: 'testAndSend',
            text: replyText
        });
    }

    /**
     * 发送自定义消息
     */
    sendCustomMessage(messageText, addToMemory = true) {
        console.log(`[MessageSender] 发送自定义消息: "${messageText}"`);
        
        if (addToMemory) {
            // 将消息添加到记忆中
            const customMessageData = {
                id: `custom_msg_${Date.now()}`,
                type: 'chat_message',
                messageType: 'shop',
                content: `[商家] ${messageText}`,
                originalContent: messageText,
                timestamp: Date.now(),
                chatId: this.memoryManager.currentChatId,
                contactName: this.memoryManager.currentContactName
            };
            
            this.memoryManager.addToMemoryWithoutTrigger(customMessageData);
        }
        
        return this._executeInjectedScript({
            action: 'testAndSend',
            text: messageText
        });
    }

    /**
     * 批量发送消息（带延迟）
     */
    async sendBatchMessages(messages, delay = 1000) {
        console.log(`[MessageSender] 批量发送 ${messages.length} 条消息，延迟 ${delay}ms`);
        
        const results = [];
        
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            console.log(`[MessageSender] 发送第 ${i + 1}/${messages.length} 条消息: "${message}"`);
            
            try {
                const result = await this.sendCustomMessage(message, true);
                results.push({ index: i, message, status: 'success', result });
                
                // 最后一条消息不需要延迟
                if (i < messages.length - 1) {
                    await this.sleep(delay);
                }
            } catch (error) {
                console.error(`[MessageSender] 第 ${i + 1} 条消息发送失败:`, error);
                results.push({ index: i, message, status: 'failed', error: error.message });
            }
        }
        
        console.log(`[MessageSender] 批量发送完成，成功 ${results.filter(r => r.status === 'success').length}/${messages.length} 条`);
        return results;
    }

    /**
     * 发送模板消息
     */
    sendTemplateMessage(templateType, params = {}) {
        const templates = {
            greeting: '您好！感谢您的咨询，请问有什么可以帮您的吗？',
            thanks: '谢谢您的理解和支持！',
            confirm: '好的，我已记录您的需求，稍后为您处理。',
            goodbye: '感谢您的咨询，祝您生活愉快！',
            custom: params.text || '这是一条自定义消息'
        };
        
        const messageText = templates[templateType] || templates.custom;
        console.log(`[MessageSender] 发送模板消息 [${templateType}]: "${messageText}"`);
        
        return this.sendCustomMessage(messageText, true);
    }

    /**
     * 检查是否可以发送消息
     */
    canSendMessage() {
        try {
            // 检查是否在大众点评页面
            if (!window.location.href.includes('dianping.com')) {
                console.warn('[MessageSender] 不在大众点评页面，无法发送消息');
                return false;
            }
            
            // 检查是否有输入框
            const iframes = document.querySelectorAll('iframe');
            for (let iframe of iframes) {
                try {
                    const doc = iframe.contentDocument;
                    if (doc && doc.querySelector('pre[data-placeholder="请输入你要回复顾客的内容"].dzim-chat-input-container')) {
                        return true;
                    }
                } catch (e) {
                    // 忽略跨域错误
                }
            }
            
            console.warn('[MessageSender] 未找到消息输入框');
            return false;
        } catch (error) {
            console.error('[MessageSender] 检查发送条件错误:', error);
            return false;
        }
    }

    /**
     * 获取当前页面的发送状态
     */
    getSendStatus() {
        return {
            canSend: this.canSendMessage(),
            currentContact: this.memoryManager.getCurrentContact(),
            pageUrl: window.location.href,
            timestamp: Date.now()
        };
    }

    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 设置发送延迟
     */
    setSendDelay(delay) {
        this.sendDelay = delay;
        console.log(`[MessageSender] 设置发送延迟: ${delay}ms`);
    }

    /**
     * 获取发送历史（从记忆中获取已发送的消息）
     */
    getSendHistory() {
        const history = this.memoryManager.conversationMemory.filter(
            msg => msg.role === 'assistant'
        );
        
        console.log(`[MessageSender] 发送历史: ${history.length} 条消息`);
        return history;
    }
}

// 导出消息发送器
window.MessageSender = MessageSender; 