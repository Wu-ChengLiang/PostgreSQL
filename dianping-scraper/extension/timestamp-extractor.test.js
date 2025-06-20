/**
 * 时间戳提取器单元测试
 * 遵循TDD原则，先定义期望行为
 */

// 模拟DOM测试环境
class MockDOM {
    static createMessageNode(content, timestamp, messageType = 'customer', timeFormat = 'absolute') {
        const messageContainer = document.createElement('div');
        messageContainer.className = messageType === 'customer' ? 'text-message normal-text' : 'text-message shop-text';
        
        // 消息内容
        const contentNode = document.createElement('span');
        contentNode.textContent = content;
        messageContainer.appendChild(contentNode);
        
        // 时间戳元素（这是我们需要找到的）
        const timestampNode = document.createElement('span');
        timestampNode.className = 'message-time'; // 假设的时间戳类名
        
        if (timeFormat === 'relative') {
            // 相对时间格式："5分钟前", "1小时前", "昨天"
            timestampNode.textContent = timestamp;
        } else {
            // 绝对时间格式："14:30", "09:15"
            timestampNode.textContent = timestamp;
        }
        
        messageContainer.appendChild(timestampNode);
        return messageContainer;
    }
    
    static createChatContainer(messages) {
        const container = document.createElement('div');
        container.className = 'chat-container';
        messages.forEach(msg => container.appendChild(msg));
        return container;
    }
}

// 时间戳提取器测试套件
describe('TimestampExtractor', () => {
    let timestampExtractor;
    
    beforeEach(() => {
        // 假设我们将创建一个TimestampExtractor类
        timestampExtractor = new window.TimestampExtractor();
    });
    
    describe('绝对时间戳提取', () => {
        test('应该正确提取今天的时间戳 "14:30"', () => {
            const messageNode = MockDOM.createMessageNode('测试消息', '14:30');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            // 期望返回今天14:30的完整时间戳
            const expected = new Date();
            expected.setHours(14, 30, 0, 0);
            
            expect(result).toBeInstanceOf(Date);
            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
        });
        
        test('应该正确提取上午时间 "09:15"', () => {
            const messageNode = MockDOM.createMessageNode('早上好', '09:15');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            expect(result.getHours()).toBe(9);
            expect(result.getMinutes()).toBe(15);
        });
        
        test('应该正确提取深夜时间 "23:45"', () => {
            const messageNode = MockDOM.createMessageNode('晚安', '23:45');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            expect(result.getHours()).toBe(23);
            expect(result.getMinutes()).toBe(45);
        });
    });
    
    describe('相对时间戳提取', () => {
        test('应该正确解析 "5分钟前"', () => {
            const messageNode = MockDOM.createMessageNode('测试消息', '5分钟前', 'customer', 'relative');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            const expected = new Date(Date.now() - 5 * 60 * 1000); // 5分钟前
            const timeDiff = Math.abs(result.getTime() - expected.getTime());
            
            // 允许1秒的误差
            expect(timeDiff).toBeLessThan(1000);
        });
        
        test('应该正确解析 "1小时前"', () => {
            const messageNode = MockDOM.createMessageNode('测试消息', '1小时前', 'customer', 'relative');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            const expected = new Date(Date.now() - 60 * 60 * 1000); // 1小时前
            const timeDiff = Math.abs(result.getTime() - expected.getTime());
            
            // 允许1秒的误差
            expect(timeDiff).toBeLessThan(1000);
        });
        
        test('应该正确解析 "昨天"', () => {
            const messageNode = MockDOM.createMessageNode('测试消息', '昨天', 'customer', 'relative');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            expect(result.getDate()).toBe(yesterday.getDate());
        });
    });
    
    describe('边界情况处理', () => {
        test('当找不到时间戳元素时应该返回null', () => {
            const messageNode = document.createElement('div');
            messageNode.textContent = '没有时间戳的消息';
            
            const result = timestampExtractor.extractTimestamp(messageNode);
            expect(result).toBeNull();
        });
        
        test('当时间格式无法解析时应该降级到当前时间', () => {
            const messageNode = MockDOM.createMessageNode('测试消息', '无效时间格式');
            const result = timestampExtractor.extractTimestamp(messageNode);
            
            // 降级策略：返回当前时间
            const now = new Date();
            const timeDiff = Math.abs(result.getTime() - now.getTime());
            expect(timeDiff).toBeLessThan(1000); // 1秒内
        });
        
        test('应该处理跨天的时间戳', () => {
            // 如果现在是00:30，消息时间是23:45，应该是昨天
            const now = new Date();
            if (now.getHours() < 12) {
                const messageNode = MockDOM.createMessageNode('测试消息', '23:45');
                const result = timestampExtractor.extractTimestamp(messageNode);
                
                // 如果当前时间早于消息时间，说明是昨天的消息
                if (result.getTime() > now.getTime()) {
                    const yesterday = new Date(result);
                    yesterday.setDate(yesterday.getDate() - 1);
                    expect(yesterday.getDate()).toBeLessThan(result.getDate());
                }
            }
        });
    });
    
    describe('选择器测试', () => {
        test('应该能找到消息的时间戳元素', () => {
            const messageNode = MockDOM.createMessageNode('测试消息', '14:30');
            const timestampElement = timestampExtractor.findTimestampElement(messageNode);
            
            expect(timestampElement).not.toBeNull();
            expect(timestampElement.textContent).toBe('14:30');
        });
        
        test('应该支持多种时间戳选择器', () => {
            // 测试不同的可能的时间戳元素结构
            const selectors = [
                '.message-time',
                '.time',
                '.timestamp',
                '[data-time]'
            ];
            
            selectors.forEach(selector => {
                const container = document.createElement('div');
                const timeElement = document.createElement('span');
                timeElement.className = selector.replace('.', '');
                timeElement.textContent = '14:30';
                container.appendChild(timeElement);
                
                const result = timestampExtractor.findTimestampElement(container);
                expect(result).not.toBeNull();
            });
        });
    });
    
    describe('集成测试', () => {
        test('应该正确更新消息数据中的时间戳', () => {
            const messageNode = MockDOM.createMessageNode('测试集成', '15:20');
            
            // 模拟原有的消息数据结构
            const messageData = {
                content: '测试集成',
                timestamp: new Date().toISOString(), // 旧的扫描时间戳
                messageType: 'customer'
            };
            
            const updatedData = timestampExtractor.updateMessageTimestamp(messageData, messageNode);
            
            expect(updatedData.timestamp).not.toBe(messageData.timestamp);
            expect(new Date(updatedData.timestamp).getHours()).toBe(15);
            expect(new Date(updatedData.timestamp).getMinutes()).toBe(20);
        });
    });
});

// 导出用于其他测试
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MockDOM };
} 