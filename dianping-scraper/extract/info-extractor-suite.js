/**
 * =================================================================
 * 全功能信息提取套件 - Info Extractor Suite
 * 
 * 包含:
 * 1. 页面结构分析器 (PageStructureAnalyzer)
 * 2. 商家信息提取器 (ShopInfoExtractor)
 * 3. DataExtractor 测试工具 (DataExtractorTester)
 * 
 * 使用方法:
 * 1. 复制此文件全部内容到大众点评页面的F12控制台执行
 * 2. 根据需要调用以下方法:
 *    - quickAnalyze() : 全面分析页面结构
 *    - extractShopInfo() : 提取商家信息并高亮
 *    - testDataExtractor() : 测试增强后的DataExtractor功能
 * =================================================================
 */

// =================================================================
// 1. 页面结构分析器 (PageStructureAnalyzer)
// =================================================================

class PageStructureAnalyzer {
    constructor() {
        this.results = {
            pageInfo: {},
            shopInfo: {},
            chatMessages: [],
            tuanInfo: [],
            contactInfo: [],
            allElements: []
        };
        
        this.selectors = {
            chatMessageList: '.text-message.normal-text, .rich-message, .text-message.shop-text',
            tuanInfo: '.tuan',
            contactItems: '.chat-list-item',
            shopInfo: '.userinfo-from-shop',
            shopName: '.shop-name, .title, h1, h2, h3',
            shopAddress: '.address, .location, .addr',
            shopPhone: '.phone, .tel, .mobile',
            shopRating: '.rating, .score, .star',
            shopTags: '.tag, .label, .category',
            userInfo: '[class*="user"], [class*="avatar"], [class*="profile"]',
            messageContainer: '[class*="message"], [class*="chat"], [class*="conversation"]',
            buttonElements: 'button, [role="button"], .btn, [class*="button"]'
        };
        
        this.init();
    }

    init() {
        console.log('🔍 [PageStructureAnalyzer] 页面结构分析器初始化完成');
    }

    analyzeAll() {
        console.log('🚀 [PageStructureAnalyzer] 开始全面分析页面结构...');
        
        this.analyzePageInfo();
        this.analyzeShopInfo();
        this.analyzeMessages();
        this.analyzeTuanInfo();
        this.analyzeContactInfo();
        this.analyzeAllElements();
        
        this.printResults();
        return this.results;
    }

    analyzePageInfo() {
        console.log('📄 [PageStructureAnalyzer] 分析页面基本信息...');
        this.results.pageInfo = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
        };
    }

    analyzeShopInfo() {
        console.log('🏪 [PageStructureAnalyzer] 分析商家信息...');
        const shopInfo = {};
        const shopElements = this.findAllElements(this.selectors.shopInfo, document);
        
        shopElements.forEach((element, index) => {
            const info = {
                textContent: element.textContent?.trim(),
                parsed: this.parseShopInfoText(element.textContent?.trim()),
            };
            shopInfo[`userinfo-from-shop-${index}`] = info;
        });
        
        this.results.shopInfo = shopInfo;
    }

    parseShopInfoText(text) {
        if (!text) return {};
        const parsed = { original: text, city: '', shopName: '', branch: '' };
        const cityShopMatch = text.match(/^(.+?)\s*-\s*(.+)$/);
        if (cityShopMatch) {
            parsed.city = cityShopMatch[1]?.trim();
            parsed.shopName = cityShopMatch[2]?.trim();
        }
        const branchMatch = text.match(/\(([^)]+)\)/);
        if (branchMatch) {
            parsed.branch = branchMatch[1];
        }
        return parsed;
    }

    analyzeMessages() {
        const messageNodes = this.findAllElements(this.selectors.chatMessageList, document);
        this.results.chatMessages = Array.from(messageNodes).map(node => node.textContent?.trim());
    }
    
    analyzeTuanInfo() {
        const tuanNodes = this.findAllElements(this.selectors.tuanInfo, document);
        this.results.tuanInfo = Array.from(tuanNodes).map(node => node.querySelector('.tuan-name')?.innerText.trim());
    }

    analyzeContactInfo() {
        const contactNodes = this.findAllElements(this.selectors.contactItems, document);
        this.results.contactInfo = Array.from(contactNodes).map(node => node.textContent?.trim());
    }

    analyzeAllElements() {
        const elementsWithClass = document.querySelectorAll('[class]');
        const classStats = {};
        elementsWithClass.forEach(el => {
            const classes = el.className.split(' ').filter(c => c.trim());
            classes.forEach(cls => {
                classStats[cls] = (classStats[cls] || 0) + 1;
            });
        });
        this.results.classStats = Object.entries(classStats).sort(([,a],[,b]) => b - a).slice(0, 20);
    }

    findAllElements(selector, root) {
        let elements = [];
        try {
            elements.push(...root.querySelectorAll(selector));
            for (const el of root.querySelectorAll('*')) {
                if (el.shadowRoot) {
                    elements.push(...this.findAllElements(selector, el.shadowRoot));
                }
            }
        } catch (e) { /* ignore */ }
        return elements;
    }

    printResults() {
        console.log('\n📊 ========== 页面结构分析结果 ==========');
        console.log('📄 页面信息:', this.results.pageInfo);
        console.log('🏪 商家信息:', this.results.shopInfo);
        console.log('💬 聊天消息:', this.results.chatMessages.length, '条');
        console.log('🎫 团购信息:', this.results.tuanInfo.length, '个');
        console.log('👥 联系人信息:', this.results.contactInfo.length, '个');
        console.log('📊 最常用class:', this.results.classStats);
        console.log('==========================================\n');
    }

    exportResults() {
        const jsonString = JSON.stringify(this.results, null, 2);
        console.log(jsonString);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsonString).then(() => console.log('✅ 结果已复制到剪贴板'));
        }
    }
}

// =================================================================
// 2. 商家信息提取器 (ShopInfoExtractor)
// =================================================================

class ShopInfoExtractor {
    constructor() {
        this.targetSelector = '.userinfo-from-shop';
    }

    extractShopInfo() {
        console.log('🔍 开始提取商家信息...');
        const elements = this.findAllElements(this.targetSelector, document);
        console.log(`✅ 找到 ${elements.length} 个 ${this.targetSelector} 元素`);
        
        this.highlightElements(elements);
        
        const results = elements.map((element, index) => {
            const data = {
                index,
                textContent: element.textContent?.trim(),
                parsed: this.parseShopText(element.textContent?.trim()),
            };
            console.log(`📍 商家信息 ${index + 1}:`, data);
            return data;
        });

        console.log('🎉 商家信息提取完成！');
        return results;
    }

    parseShopText(text) {
        if (!text) return {};
        const parsed = { original: text, city: '', shopName: '', branch: '' };
        const cityShopMatch = text.match(/^(.+?)\s*-\s*(.+)$/);
        if (cityShopMatch) {
            parsed.city = cityShopMatch[1]?.trim();
            parsed.shopName = cityShopMatch[2]?.trim();
        }
        const branchMatch = text.match(/\(([^)]+)\)/);
        if (branchMatch) {
            parsed.branch = branchMatch[1];
        }
        return parsed;
    }

    findAllElements(selector, root) {
        let elements = [];
        try {
            elements.push(...root.querySelectorAll(selector));
            for (const el of root.querySelectorAll('*')) {
                if (el.shadowRoot) {
                    elements.push(...this.findAllElements(selector, el.shadowRoot));
                }
            }
        } catch (e) { /* ignore */ }
        return elements;
    }

    highlightElements(elements) {
        this.clearHighlight();
        elements.forEach(el => {
            el.style.outline = '3px solid #ff6b35';
            el.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
            el.classList.add('shop-info-highlight');
        });
    }

    clearHighlight() {
        document.querySelectorAll('.shop-info-highlight').forEach(el => {
            el.style.outline = '';
            el.style.backgroundColor = '';
            el.classList.remove('shop-info-highlight');
        });
    }
}

// =================================================================
// 3. DataExtractor 测试工具 (DataExtractorTester)
// =================================================================

class MockMemoryManager {
    constructor() { this.currentChatId = 'test_chat_123'; this.currentContactName = '测试联系人'; }
    autoDetectCurrentContact() {}
    addToMemory(data) {}
    addToMemoryWithoutTrigger(data) {}
}

class DataExtractorTester {
    constructor() {
        this.mockMemoryManager = new MockMemoryManager();
        this.extractor = null;
    }

    init() {
        if (typeof DataExtractor === 'undefined') {
            console.error('❌ DataExtractor类未找到，请先加载包含修改后逻辑的data-extractor.js');
            return false;
        }
        this.extractor = new DataExtractor(this.mockMemoryManager);
        return true;
    }

    testShopInfoExtraction() {
        console.log('\n🏪 测试商家信息提取...');
        if (!this.init()) return;
        const shopInfo = this.extractor.refreshShopInfo();
        if (shopInfo) {
            console.log('✅ 商家信息提取成功:', shopInfo);
        } else {
            console.warn('⚠️ 未找到商家信息元素');
        }
    }

    testMessageExtractionWithShopInfo() {
        console.log('\n💬 测试消息提取（含商家信息）...');
        if (!this.init()) return;
        this.extractor.extractShopInfo();
        const { messages } = this.extractor.extractChatMessages();
        console.log(`✅ 找到 ${messages.length} 条消息`);
        messages.forEach((msg, idx) => {
            console.log(`  ${idx + 1}. 内容: ${msg.content}`);
            console.log(`     商家信息: ${msg.shopInfo ? msg.shopInfo.displayText : '无'}`);
        });
    }
    
    runAllTests() {
        console.log('🧪 ========== DataExtractor 完整测试开始 ==========');
        if (!this.init()) return;
        this.testShopInfoExtraction();
        this.testMessageExtractionWithShopInfo();
        console.log('\n🎉 ========== 所有测试完成 ==========');
    }
}


// =================================================================
// 全局方法
// =================================================================
console.log('🚀 全功能信息提取套件已加载！');

function quickAnalyze() {
    console.log('⚡ 快速分析页面结构...');
    const analyzer = new PageStructureAnalyzer();
    return analyzer.analyzeAll();
}

function extractShopInfo() {
    console.log('⚡ 提取商家信息...');
    const extractor = new ShopInfoExtractor();
    return extractor.extractShopInfo();
}

function clearShopHighlight() {
    const extractor = new ShopInfoExtractor();
    extractor.clearHighlight();
    console.log('🧹 高亮已清除');
}

function testDataExtractor() {
    console.log('⚡ 运行DataExtractor完整测试...');
    const tester = new DataExtractorTester();
    return tester.runAllTests();
}

console.log('✅ 可用命令: quickAnalyze(), extractShopInfo(), clearShopHighlight(), testDataExtractor()'); 