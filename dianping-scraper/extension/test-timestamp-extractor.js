/**
 * TimestampExtractor 快速验证测试
 * 在浏览器控制台中运行此文件进行测试
 */

// 快速测试函数
function testTimestampExtractor() {
    console.log('开始测试 TimestampExtractor...');
    
    // 创建测试实例
    const extractor = new TimestampExtractor();
    
    // 测试用例
    const testCases = [
        { input: '14:30', expected: 'absoluteTime', description: '绝对时间测试' },
        { input: '09:15', expected: 'absoluteTime', description: '上午时间测试' },
        { input: '5分钟前', expected: 'relativeMinutes', description: '相对分钟测试' },
        { input: '1小时前', expected: 'relativeHours', description: '相对小时测试' },
        { input: '5月28日', expected: 'monthDay', description: '月日格式测试' },
        { input: '昨天', expected: 'relativeDay', description: '相对日期测试' },
        { input: '测试账号。20:48', expected: 'userTime', description: '用户时间组合格式测试' }
    ];
    
    console.log('\n=== 时间解析测试 ===');
    testCases.forEach((testCase, index) => {
        console.log(`\n测试 ${index + 1}: ${testCase.description}`);
        console.log(`输入: "${testCase.input}"`);
        
        const result = extractor.parseTimeText(testCase.input);
        if (result) {
            console.log(`✅ 解析成功: ${result.toLocaleString()}`);
            console.log(`   ISO格式: ${result.toISOString()}`);
        } else {
            console.log(`❌ 解析失败`);
        }
    });
    
    // 测试DOM节点创建和解析
    console.log('\n=== DOM节点测试 ===');
    
    // 创建测试节点
    const testNode = document.createElement('div');
    testNode.className = 'text-message normal-text';
    testNode.innerHTML = `
        <span class="message-content">测试消息</span>
        <span class="message-time">15:20</span>
    `;
    
    console.log('创建测试DOM节点...');
    const extractedTime = extractor.extractTimestamp(testNode);
    
    if (extractedTime) {
        console.log(`✅ DOM时间戳提取成功: ${extractedTime.toLocaleString()}`);
    } else {
        console.log(`❌ DOM时间戳提取失败`);
    }
    
    // 测试消息数据更新
    console.log('\n=== 消息数据更新测试 ===');
    
    const mockMessageData = {
        content: '测试消息',
        timestamp: new Date().toISOString(),
        messageType: 'customer'
    };
    
    console.log(`原始时间戳: ${mockMessageData.timestamp}`);
    
    const updatedData = extractor.updateMessageTimestamp(mockMessageData, testNode);
    
    if (updatedData.timestampSource === 'extracted') {
        console.log(`✅ 消息时间戳更新成功: ${updatedData.timestamp}`);
        console.log(`   时间戳来源: ${updatedData.timestampSource}`);
    } else {
        console.log(`⚠️  使用降级时间戳: ${updatedData.timestampSource}`);
    }
    
    console.log('\n测试完成！');
    return {
        extractor,
        testResults: { testCases, extractedTime, updatedData }
    };
}

// 在控制台中运行测试
// 用法：在浏览器控制台中输入 testTimestampExtractor()
console.log('TimestampExtractor 测试文件已加载。运行 testTimestampExtractor() 开始测试。'); 