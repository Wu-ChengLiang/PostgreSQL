/**
 * 扩展工具函数 - Extension Utils
 * 提供安全的Chrome扩展API调用和错误处理
 */
class ExtensionUtils {
    /**
     * 检查扩展上下文是否有效
     */
    static isExtensionContextValid() {
        return !!(chrome && chrome.runtime && chrome.runtime.sendMessage);
    }

    /**
     * 安全发送消息到后台脚本
     * @param {Object} message 要发送的消息
     * @param {Function} callback 可选的回调函数
     * @param {string} logPrefix 日志前缀
     * @returns {boolean} 是否成功发送
     */
    static safeSendMessage(message, callback, logPrefix = '[ExtensionUtils]') {
        try {
            // 检查扩展上下文是否有效
            if (!this.isExtensionContextValid()) {
                console.warn(`${logPrefix} 扩展上下文无效，跳过消息发送`);
                return false;
            }

            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn(`${logPrefix} 消息发送失败，扩展上下文可能已失效:`, chrome.runtime.lastError.message);
                    if (callback) callback(null, chrome.runtime.lastError);
                } else {
                    if (callback) callback(response, null);
                }
            });

            return true;
        } catch (error) {
            console.warn(`${logPrefix} 发送消息错误:`, error.message);
            if (callback) callback(null, error);
            return false;
        }
    }

    /**
     * 安全发送数据到后台（用于数据提取）
     * @param {Object} data 要发送的数据
     * @param {string} logPrefix 日志前缀
     * @returns {boolean} 是否成功发送
     */
    static safeSendData(data, logPrefix = '[ExtensionUtils]') {
        return this.safeSendMessage({
            type: 'extractedData',
            data: data
        }, null, logPrefix);
    }

    /**
     * 安全发送进度更新
     * @param {Object} progressData 进度数据
     * @param {string} logPrefix 日志前缀
     * @returns {boolean} 是否成功发送
     */
    static safeSendProgress(progressData, logPrefix = '[ExtensionUtils]') {
        return this.safeSendMessage({
            type: 'clickProgress',
            ...progressData
        }, null, logPrefix);
    }

    /**
     * 安全发送错误消息
     * @param {string} errorMessage 错误消息
     * @param {string} logPrefix 日志前缀
     * @returns {boolean} 是否成功发送
     */
    static safeSendError(errorMessage, logPrefix = '[ExtensionUtils]') {
        return this.safeSendMessage({
            type: 'clickError',
            message: errorMessage
        }, null, logPrefix);
    }

    /**
     * 检查当前页面是否为大众点评页面
     * @returns {boolean} 是否为大众点评页面
     */
    static isDianpingPage() {
        return window.location.href.includes('dianping.com');
    }

    /**
     * 获取扩展状态信息
     * @returns {Object} 扩展状态
     */
    static getExtensionStatus() {
        return {
            contextValid: this.isExtensionContextValid(),
            isDianpingPage: this.isDianpingPage(),
            url: window.location.href,
            timestamp: Date.now()
        };
    }

    /**
     * 延迟函数
     * @param {number} ms 延迟毫秒数
     * @returns {Promise} Promise对象
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 安全的DOM查询（包括Shadow DOM）
     * @param {string} selector CSS选择器
     * @param {Element} root 根元素，默认为document
     * @returns {Array} 匹配的元素数组
     */
    static safeQueryAll(selector, root = document) {
        let elements = [];
        try {
            Array.prototype.push.apply(elements, root.querySelectorAll(selector));
            const descendants = root.querySelectorAll('*');
            for (const el of descendants) {
                if (el.shadowRoot) {
                    const nestedElements = this.safeQueryAll(selector, el.shadowRoot);
                    Array.prototype.push.apply(elements, nestedElements);
                }
            }
        } catch (e) {
            console.warn('[ExtensionUtils] DOM查询错误:', e.message);
        }
        return elements;
    }

    /**
     * 格式化时间戳
     * @param {number} timestamp 时间戳
     * @returns {string} 格式化的时间字符串
     */
    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN');
    }

    /**
     * 生成唯一ID
     * @param {string} prefix 前缀
     * @returns {string} 唯一ID
     */
    static generateUniqueId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 导出工具类
window.ExtensionUtils = ExtensionUtils; 