/**
 * 时间戳提取器
 * 从大众点评聊天页面DOM中提取消息的真实发送时间
 */

class TimestampExtractor {
    constructor() {
        // 时间戳选择器配置（按优先级排列）
        this.timestampSelectors = [
            '.message-time',
            '.time-info',
            '.msg-time', 
            '.timestamp',
            '[data-time]',
            // 可能的其他选择器
            '.chat-time',
            '.send-time'
        ];
        
        // 时间格式正则表达式
        this.timePatterns = {
            // 绝对时间：14:30, 09:15
            absoluteTime: /^(\d{1,2}):(\d{2})$/,
            // 相对时间：5分钟前, 1小时前
            relativeMinutes: /^(\d+)分钟前$/,
            relativeHours: /^(\d+)小时前$/,
            // 日期：5月28日, 12月1日
            monthDay: /^(\d{1,2})月(\d{1,2})日$/,
            // 组合格式：用户名。14:30
            userTime: /^.+[。.](\d{1,2}):(\d{2})$/,
            // 昨天、今天等
            relativeDay: /^(昨天|今天|前天)$/
        };
    }
    
    /**
     * 从消息节点中查找时间戳元素
     * @param {Element} messageNode - 消息DOM节点
     * @returns {Element|null} 时间戳元素
     */
    findTimestampElement(messageNode) {
        if (!messageNode) return null;
        
        // 1. 尝试在消息节点内部查找时间戳元素
        for (const selector of this.timestampSelectors) {
            const timestampEl = messageNode.querySelector(selector);
            if (timestampEl && timestampEl.textContent.trim()) {
                console.log(`[TimestampExtractor] 找到时间戳元素: ${selector} -> "${timestampEl.textContent.trim()}"`);
                return timestampEl;
            }
        }
        
        // 2. 检查消息节点的兄弟节点
        const siblings = messageNode.parentNode ? messageNode.parentNode.children : [];
        for (const sibling of siblings) {
            if (sibling === messageNode) continue;
            
            for (const selector of this.timestampSelectors) {
                const timestampEl = sibling.querySelector(selector);
                if (timestampEl && timestampEl.textContent.trim()) {
                    console.log(`[TimestampExtractor] 在兄弟节点找到时间戳: ${selector} -> "${timestampEl.textContent.trim()}"`);
                    return timestampEl;
                }
            }
        }
        
        // 3. 检查消息节点本身的文本内容（用于组合格式）
        const nodeText = messageNode.textContent.trim();
        if (this.timePatterns.userTime.test(nodeText)) {
            console.log(`[TimestampExtractor] 在节点文本中找到时间格式: "${nodeText}"`);
            // 创建虚拟时间戳元素
            const virtualEl = document.createElement('span');
            const match = nodeText.match(this.timePatterns.userTime);
            virtualEl.textContent = `${match[1]}:${match[2]}`;
            return virtualEl;
        }
        
        console.warn(`[TimestampExtractor] 未找到时间戳元素`, messageNode);
        return null;
    }
    
    /**
     * 解析时间文本为Date对象
     * @param {string} timeText - 时间文本
     * @returns {Date|null} 解析后的时间
     */
    parseTimeText(timeText) {
        if (!timeText) return null;
        
        const text = timeText.trim();
        const now = new Date();
        
        try {
            // 1. 绝对时间：14:30
            const absoluteMatch = text.match(this.timePatterns.absoluteTime);
            if (absoluteMatch) {
                const [, hours, minutes] = absoluteMatch;
                const result = new Date();
                result.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                // 处理跨天情况：如果解析的时间比当前时间晚太多，可能是昨天的消息
                const timeDiff = result.getTime() - now.getTime();
                if (timeDiff > 12 * 60 * 60 * 1000) { // 超过12小时，可能是昨天
                    result.setDate(result.getDate() - 1);
                }
                
                console.log(`[TimestampExtractor] 解析绝对时间: "${text}" -> ${result.toLocaleString()}`);
                return result;
            }
            
            // 2. 相对时间：5分钟前
            const minutesMatch = text.match(this.timePatterns.relativeMinutes);
            if (minutesMatch) {
                const minutes = parseInt(minutesMatch[1]);
                const result = new Date(now.getTime() - minutes * 60 * 1000);
                console.log(`[TimestampExtractor] 解析相对时间(分钟): "${text}" -> ${result.toLocaleString()}`);
                return result;
            }
            
            // 3. 相对时间：1小时前
            const hoursMatch = text.match(this.timePatterns.relativeHours);
            if (hoursMatch) {
                const hours = parseInt(hoursMatch[1]);
                const result = new Date(now.getTime() - hours * 60 * 60 * 1000);
                console.log(`[TimestampExtractor] 解析相对时间(小时): "${text}" -> ${result.toLocaleString()}`);
                return result;
            }
            
            // 4. 日期：5月28日
            const monthDayMatch = text.match(this.timePatterns.monthDay);
            if (monthDayMatch) {
                const [, month, day] = monthDayMatch;
                const result = new Date();
                result.setMonth(parseInt(month) - 1, parseInt(day));
                result.setHours(12, 0, 0, 0); // 默认设为中午
                
                // 如果日期在未来，说明是去年的
                if (result.getTime() > now.getTime()) {
                    result.setFullYear(result.getFullYear() - 1);
                }
                
                console.log(`[TimestampExtractor] 解析日期: "${text}" -> ${result.toLocaleString()}`);
                return result;
            }
            
            // 5. 相对日期：昨天、今天
            if (this.timePatterns.relativeDay.test(text)) {
                const result = new Date();
                if (text === '昨天') {
                    result.setDate(result.getDate() - 1);
                } else if (text === '前天') {
                    result.setDate(result.getDate() - 2);
                }
                result.setHours(12, 0, 0, 0); // 默认设为中午
                
                console.log(`[TimestampExtractor] 解析相对日期: "${text}" -> ${result.toLocaleString()}`);
                return result;
            }
            
        } catch (error) {
            console.error(`[TimestampExtractor] 解析时间出错: "${text}"`, error);
        }
        
        // 如果都无法解析，返回null而不是当前时间
        console.warn(`[TimestampExtractor] 无法解析时间格式: "${text}"`);
        return null;
    }
    
    /**
     * 从消息节点提取时间戳
     * @param {Element} messageNode - 消息DOM节点
     * @returns {Date|null} 提取的时间戳
     */
    extractTimestamp(messageNode) {
        if (!messageNode) {
            console.warn('[TimestampExtractor] 消息节点为空');
            return null;
        }
        
        // 1. 查找时间戳元素
        const timestampElement = this.findTimestampElement(messageNode);
        if (!timestampElement) {
            console.warn('[TimestampExtractor] 未找到时间戳元素');
            return null;
        }
        
        // 2. 提取时间文本
        const timeText = timestampElement.textContent.trim();
        if (!timeText) {
            console.warn('[TimestampExtractor] 时间戳元素内容为空');
            return null;
        }
        
        // 3. 解析时间
        const timestamp = this.parseTimeText(timeText);
        
        if (timestamp) {
            console.log(`[TimestampExtractor] 成功提取时间戳: "${timeText}" -> ${timestamp.toISOString()}`);
        } else {
            console.warn(`[TimestampExtractor] 时间戳解析失败: "${timeText}"`);
        }
        
        return timestamp;
    }
    
    /**
     * 更新消息数据的时间戳
     * @param {Object} messageData - 原始消息数据
     * @param {Element} messageNode - 消息DOM节点  
     * @returns {Object} 更新后的消息数据
     */
    updateMessageTimestamp(messageData, messageNode) {
        const realTimestamp = this.extractTimestamp(messageNode);
        
        if (realTimestamp) {
            // 使用真实时间戳替换扫描时间戳
            const updatedData = {
                ...messageData,
                timestamp: realTimestamp.toISOString(),
                originalTimestamp: messageData.timestamp, // 保留原始扫描时间戳用于调试
                timestampSource: 'extracted' // 标记时间戳来源
            };
            
            console.log(`[TimestampExtractor] 更新消息时间戳: ${messageData.timestamp} -> ${updatedData.timestamp}`);
            return updatedData;
        } else {
            // 提取失败，使用降级策略
            console.warn(`[TimestampExtractor] 提取失败，保持原时间戳: ${messageData.timestamp}`);
            return {
                ...messageData,
                timestampSource: 'fallback' // 标记为降级时间戳
            };
        }
    }
    
    /**
     * 批量处理消息的时间戳
     * @param {Array} messages - 消息数组
     * @param {Array} messageNodes - 对应的DOM节点数组
     * @returns {Array} 更新时间戳后的消息数组
     */
    batchUpdateTimestamps(messages, messageNodes) {
        if (!messages || !messageNodes || messages.length !== messageNodes.length) {
            console.error('[TimestampExtractor] 消息数组和节点数组长度不匹配');
            return messages;
        }
        
        return messages.map((message, index) => {
            return this.updateMessageTimestamp(message, messageNodes[index]);
        });
    }
    
    /**
     * 验证时间戳是否合理
     * @param {Date} timestamp - 要验证的时间戳
     * @returns {boolean} 是否合理
     */
    validateTimestamp(timestamp) {
        if (!timestamp || !(timestamp instanceof Date)) {
            return false;
        }
        
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        
        // 时间戳应该在一年前到一小时后的范围内
        return timestamp >= oneYearAgo && timestamp <= oneHourLater;
    }
}

// 导出到全局
window.TimestampExtractor = TimestampExtractor; 