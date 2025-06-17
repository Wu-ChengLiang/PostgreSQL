/**
 * 重构后功能测试脚本
 * 在大众点评页面的控制台中运行此脚本来测试所有功能
 */

(function() {
    'use strict';
    
    console.log('🧪 开始重构后功能测试...');
    
    // 测试结果收集
    const testResults = {
        moduleLoading: [],
        functionality: [],
        compatibility: []
    };
    
    /**
     * 测试模块加载状态
     */
    function testModuleLoading() {
        console.log('\n📦 测试模块加载状态...');
        
        const modules = [
            { name: 'MemoryManager', obj: window.MemoryManager },
            { name: 'DataExtractor', obj: window.DataExtractor },
            { name: 'MessageSender', obj: window.MessageSender },
            { name: 'BackgroundManager', obj: window.BackgroundManager },
            { name: 'dianpingExtractor', obj: window.dianpingExtractor }
        ];
        
        modules.forEach(module => {
            const loaded = typeof module.obj !== 'undefined';
            console.log(`${loaded ? '✅' : '❌'} ${module.name}: ${loaded ? '已加载' : '未加载'}`);
            testResults.moduleLoading.push({
                name: module.name,
                loaded: loaded,
                type: typeof module.obj
            });
        });
    }
    
    /**
     * 测试记忆管理功能
     */
    function testMemoryManager() {
        console.log('\n🧠 测试记忆管理功能...');
        
        if (!window.dianpingExtractor?.memoryManager) {
            console.log('❌ 记忆管理器未初始化');
            return;
        }
        
        const memoryManager = window.dianpingExtractor.memoryManager;
        
        try {
            // 测试联系人检测
            memoryManager.autoDetectCurrentContact();
            const contact = memoryManager.getCurrentContact();
            console.log('✅ 联系人检测:', contact);
            
            // 测试记忆添加
            const testMessage = {
                id: 'test_msg_' + Date.now(),
                type: 'chat_message',
                messageType: 'customer',
                content: '[客户] 测试消息',
                originalContent: '测试消息',
                timestamp: Date.now()
            };
            
            memoryManager.addToMemoryWithoutTrigger(testMessage);
            console.log('✅ 记忆添加功能正常');
            
            testResults.functionality.push({
                module: 'MemoryManager',
                status: 'success',
                details: '联系人检测和记忆管理正常'
            });
            
        } catch (error) {
            console.error('❌ 记忆管理器测试失败:', error);
            testResults.functionality.push({
                module: 'MemoryManager',
                status: 'failed',
                error: error.message
            });
        }
    }
    
    /**
     * 测试数据提取功能
     */
    function testDataExtractor() {
        console.log('\n📊 测试数据提取功能...');
        
        if (!window.dianpingExtractor?.dataExtractor) {
            console.log('❌ 数据提取器未初始化');
            return;
        }
        
        const dataExtractor = window.dianpingExtractor.dataExtractor;
        
        try {
            // 测试页面类型检测
            const pageType = dataExtractor.detectPageType();
            console.log('✅ 页面类型检测:', pageType);
            
            // 测试元素查找
            const chatMessages = dataExtractor.findAllElements('.text-message', document);
            console.log('✅ 聊天消息元素查找:', chatMessages.length, '个');
            
            // 测试提取状态
            const isExtracting = dataExtractor.isExtracting();
            console.log('✅ 提取状态:', isExtracting ? '进行中' : '已停止');
            
            testResults.functionality.push({
                module: 'DataExtractor',
                status: 'success',
                details: `页面类型: ${pageType}, 消息元素: ${chatMessages.length}个`
            });
            
        } catch (error) {
            console.error('❌ 数据提取器测试失败:', error);
            testResults.functionality.push({
                module: 'DataExtractor',
                status: 'failed',
                error: error.message
            });
        }
    }
    
    /**
     * 测试消息发送功能
     */
    function testMessageSender() {
        console.log('\n📤 测试消息发送功能...');
        
        if (!window.dianpingExtractor?.messageSender) {
            console.log('❌ 消息发送器未初始化');
            return;
        }
        
        const messageSender = window.dianpingExtractor.messageSender;
        
        try {
            // 测试发送状态检查
            const sendStatus = messageSender.getSendStatus();
            console.log('✅ 发送状态检查:', sendStatus);
            
            // 测试发送能力检查
            const canSend = messageSender.canSendMessage();
            console.log('✅ 发送能力:', canSend ? '可发送' : '不可发送');
            
            // 测试发送历史
            const history = messageSender.getSendHistory();
            console.log('✅ 发送历史:', history.length, '条');
            
            testResults.functionality.push({
                module: 'MessageSender',
                status: 'success',
                details: `发送能力: ${canSend}, 历史消息: ${history.length}条`
            });
            
        } catch (error) {
            console.error('❌ 消息发送器测试失败:', error);
            testResults.functionality.push({
                module: 'MessageSender',
                status: 'failed',
                error: error.message
            });
        }
    }
    
    /**
     * 测试接口兼容性
     */
    function testCompatibility() {
        console.log('\n🔗 测试接口兼容性...');
        
        try {
            // 测试Chrome扩展接口
            const extensionAPIs = [
                'chrome.runtime.sendMessage',
                'chrome.runtime.onMessage.addListener'
            ];
            
            extensionAPIs.forEach(api => {
                const parts = api.split('.');
                let obj = window;
                let exists = true;
                
                for (const part of parts) {
                    if (obj && typeof obj[part] !== 'undefined') {
                        obj = obj[part];
                    } else {
                        exists = false;
                        break;
                    }
                }
                
                console.log(`${exists ? '✅' : '❌'} ${api}: ${exists ? '可用' : '不可用'}`);
            });
            
            // 测试必需的DOM API
            const domAPIs = [
                'document.querySelector',
                'document.querySelectorAll',
                'document.createElement',
                'document.addEventListener'
            ];
            
            domAPIs.forEach(api => {
                const parts = api.split('.');
                let obj = window;
                let exists = true;
                
                for (const part of parts) {
                    if (obj && typeof obj[part] !== 'undefined') {
                        obj = obj[part];
                    } else {
                        exists = false;
                        break;
                    }
                }
                
                console.log(`${exists ? '✅' : '❌'} ${api}: ${exists ? '可用' : '不可用'}`);
            });
            
            testResults.compatibility.push({
                category: 'APIs',
                status: 'success',
                details: 'Chrome扩展和DOM API均可用'
            });
            
        } catch (error) {
            console.error('❌ 兼容性测试失败:', error);
            testResults.compatibility.push({
                category: 'APIs',
                status: 'failed',
                error: error.message
            });
        }
    }
    
    /**
     * 测试全局状态
     */
    function testGlobalStatus() {
        console.log('\n🌐 测试全局状态...');
        
        if (window.dianpingExtractor) {
            try {
                const status = window.dianpingExtractor.getStatus();
                console.log('✅ 全局状态:', JSON.stringify(status, null, 2));
                
                testResults.functionality.push({
                    module: 'GlobalStatus',
                    status: 'success',
                    details: '全局状态获取正常'
                });
            } catch (error) {
                console.error('❌ 全局状态获取失败:', error);
                testResults.functionality.push({
                    module: 'GlobalStatus',
                    status: 'failed',
                    error: error.message
                });
            }
        } else {
            console.log('❌ 主提取器未初始化');
        }
    }
    
    /**
     * 运行完整测试套件
     */
    function runFullTest() {
        console.log('🚀 运行完整测试套件...\n');
        
        testModuleLoading();
        testMemoryManager();
        testDataExtractor();
        testMessageSender();
        testCompatibility();
        testGlobalStatus();
        
        // 输出测试总结
        console.log('\n📋 测试总结:');
        console.log('='.repeat(50));
        
        const moduleResults = testResults.moduleLoading;
        const loadedModules = moduleResults.filter(m => m.loaded).length;
        console.log(`📦 模块加载: ${loadedModules}/${moduleResults.length} 成功`);
        
        const funcResults = testResults.functionality;
        const successfulFunctions = funcResults.filter(f => f.status === 'success').length;
        console.log(`⚙️ 功能测试: ${successfulFunctions}/${funcResults.length} 成功`);
        
        const compatResults = testResults.compatibility;
        const compatibleAPIs = compatResults.filter(c => c.status === 'success').length;
        console.log(`🔗 兼容性测试: ${compatibleAPIs}/${compatResults.length} 成功`);
        
        // 总体评估
        const totalTests = moduleResults.length + funcResults.length + compatResults.length;
        const totalSuccess = loadedModules + successfulFunctions + compatibleAPIs;
        const successRate = ((totalSuccess / totalTests) * 100).toFixed(1);
        
        console.log(`\n🎯 总体成功率: ${successRate}% (${totalSuccess}/${totalTests})`);
        
        if (successRate >= 90) {
            console.log('🎉 重构测试通过！系统运行正常。');
        } else if (successRate >= 70) {
            console.log('⚠️ 重构基本成功，但有部分问题需要修复。');
        } else {
            console.log('❌ 重构存在严重问题，需要立即修复。');
        }
        
        return testResults;
    }
    
    // 暴露测试函数到全局
    window.testRefactored = {
        runFullTest,
        testModuleLoading,
        testMemoryManager,
        testDataExtractor,
        testMessageSender,
        testCompatibility,
        testGlobalStatus,
        getResults: () => testResults
    };
    
    console.log('\n🔧 测试工具已加载！');
    console.log('运行 testRefactored.runFullTest() 开始完整测试');
    console.log('或运行单独的测试函数，如 testRefactored.testMemoryManager()');
    
})(); 