/**
 * 页面结构分析器 - Page Structure Analyzer
 * 基于 data-extractor.js 的逻辑，用于在浏览器F12控制台中直接运行
 * 解析大众点评页面的结构和关键信息
 */
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
        
        // 扩展选择器配置，包含商家信息
        this.selectors = {
            // 原有选择器
            chatMessageList: '.text-message.normal-text, .rich-message, .text-message.shop-text',
            tuanInfo: '.tuan',
            contactItems: '.chat-list-item',
            
            // 商家信息选择器
            shopInfo: '.userinfo-from-shop',
            shopName: '.shop-name, .title, h1, h2, h3',
            shopAddress: '.address, .location, .addr',
            shopPhone: '.phone, .tel, .mobile',
            shopRating: '.rating, .score, .star',
            shopTags: '.tag, .label, .category',
            
            // 其他可能的元素
            userInfo: '[class*="user"], [class*="avatar"], [class*="profile"]',
            messageContainer: '[class*="message"], [class*="chat"], [class*="conversation"]',
            buttonElements: 'button, [role="button"], .btn, [class*="button"]'
        };
        
        this.init();
    }

    init() {
        console.log('🔍 [PageStructureAnalyzer] 页面结构分析器初始化完成');
        console.log('📋 可用方法:');
        console.log('  - analyzer.analyzeAll() - 分析所有页面结构');
        console.log('  - analyzer.analyzeShopInfo() - 分析商家信息');
        console.log('  - analyzer.analyzeMessages() - 分析聊天消息');
        console.log('  - analyzer.findElements(selector) - 查找特定元素');
        console.log('  - analyzer.getResults() - 获取分析结果');
        console.log('  - analyzer.exportResults() - 导出分析结果');
    }

    /**
     * 分析所有页面结构
     */
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

    /**
     * 分析页面基本信息
     */
    analyzePageInfo() {
        console.log('📄 [PageStructureAnalyzer] 分析页面基本信息...');
        
        this.results.pageInfo = {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
            pathname: window.location.pathname,
            pageType: this.detectPageType(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        console.log('✅ 页面基本信息:', this.results.pageInfo);
    }

    /**
     * 分析商家信息 - 重点关注userinfo-from-shop元素
     */
    analyzeShopInfo() {
        console.log('🏪 [PageStructureAnalyzer] 分析商家信息...');
        
        const shopInfo = {};
        
        // 查找目标元素: userinfo-from-shop
        const shopElements = this.findAllElements(this.selectors.shopInfo, document);
        console.log(`🎯 找到 ${shopElements.length} 个 userinfo-from-shop 元素`);
        
        shopElements.forEach((element, index) => {
            const info = {
                index: index,
                className: element.className,
                textContent: element.textContent?.trim(),
                innerHTML: element.innerHTML,
                attributes: this.getElementAttributes(element),
                parentElement: element.parentElement?.tagName,
                parentClass: element.parentElement?.className,
                position: this.getElementPosition(element)
            };
            
            // 尝试解析地址和商家名称
            if (info.textContent) {
                const parsed = this.parseShopInfoText(info.textContent);
                info.parsed = parsed;
            }
            
            shopInfo[`userinfo-from-shop-${index}`] = info;
            console.log(`  📍 商家信息 ${index + 1}:`, info);
        });
        
        // 查找其他可能的商家信息元素
        const otherSelectors = [
            this.selectors.shopName,
            this.selectors.shopAddress,
            this.selectors.shopPhone,
            this.selectors.shopRating,
            this.selectors.shopTags
        ];
        
        otherSelectors.forEach((selector, idx) => {
            const elements = this.findAllElements(selector, document);
            if (elements.length > 0) {
                const selectorName = ['shopName', 'shopAddress', 'shopPhone', 'shopRating', 'shopTags'][idx];
                shopInfo[selectorName] = elements.map(el => ({
                    textContent: el.textContent?.trim(),
                    className: el.className,
                    tagName: el.tagName
                }));
            }
        });
        
        this.results.shopInfo = shopInfo;
        console.log('✅ 商家信息分析完成:', shopInfo);
    }

    /**
     * 解析商家信息文本
     */
    parseShopInfoText(text) {
        const parsed = {
            original: text,
            city: '',
            shopName: '',
            district: ''
        };
        
        // 尝试解析 "城市 - 商家名称" 格式
        const cityShopMatch = text.match(/^(.+?)\s*-\s*(.+)$/);
        if (cityShopMatch) {
            parsed.city = cityShopMatch[1]?.trim();
            parsed.shopName = cityShopMatch[2]?.trim();
        }
        
        // 尝试提取括号内的信息（通常是分店信息）
        const branchMatch = text.match(/\(([^)]+)\)/);
        if (branchMatch) {
            parsed.branch = branchMatch[1];
        }
        
        // 尝试提取地区信息
        const locationTerms = ['区', '市', '县', '镇', '街道', '路', '广场', '商场', '中心'];
        for (const term of locationTerms) {
            if (text.includes(term)) {
                const regex = new RegExp(`([^\\s-]+${term})`);
                const match = text.match(regex);
                if (match) {
                    parsed.district = match[1];
                    break;
                }
            }
        }
        
        return parsed;
    }

    /**
     * 分析聊天消息（基于原有逻辑）
     */
    analyzeMessages() {
        console.log('💬 [PageStructureAnalyzer] 分析聊天消息...');
        
        const messages = [];
        const messageNodes = this.findAllElements(this.selectors.chatMessageList, document);
        
        console.log(`💬 找到 ${messageNodes.length} 个消息元素`);
        
        messageNodes.forEach((node, index) => {
            const content = (node.innerText || node.textContent)?.trim();
            
            let messageType = 'unknown';
            if (node.className.includes('shop-text')) {
                messageType = 'shop';
            } else if (node.className.includes('normal-text')) {
                messageType = 'customer';
            }
            
            if (content) {
                const messageData = {
                    index: index,
                    type: messageType,
                    content: content,
                    className: node.className,
                    tagName: node.tagName,
                    attributes: this.getElementAttributes(node),
                    parentInfo: {
                        tagName: node.parentElement?.tagName,
                        className: node.parentElement?.className
                    }
                };
                
                messages.push(messageData);
                console.log(`  💬 消息 ${index + 1} (${messageType}):`, content.substring(0, 50) + '...');
            }
        });
        
        this.results.chatMessages = messages;
        console.log('✅ 聊天消息分析完成，共', messages.length, '条消息');
    }

    /**
     * 分析团购信息
     */
    analyzeTuanInfo() {
        console.log('🎫 [PageStructureAnalyzer] 分析团购信息...');
        
        const tuanInfo = [];
        const tuanNodes = this.findAllElements(this.selectors.tuanInfo, document);
        
        console.log(`🎫 找到 ${tuanNodes.length} 个团购元素`);
        
        tuanNodes.forEach((node, index) => {
            const nameNode = node.querySelector('.tuan-name');
            const salePriceNode = node.querySelector('.sale-price');
            const originalPriceNode = node.querySelector('.tuan-price .gray-price > span, .tuan-price > .gray > .gray-price:not(.left-dis)');
            const imageNode = node.querySelector('.tuan-img img');
            
            const tuanData = {
                index: index,
                name: nameNode?.innerText?.trim() || '',
                salePrice: salePriceNode?.innerText?.trim() || '',
                originalPrice: originalPriceNode?.innerText?.trim() || '',
                image: imageNode?.src || '',
                className: node.className,
                html: node.outerHTML.substring(0, 200) + '...'
            };
            
            tuanInfo.push(tuanData);
            console.log(`  🎫 团购 ${index + 1}:`, tuanData);
        });
        
        this.results.tuanInfo = tuanInfo;
        console.log('✅ 团购信息分析完成，共', tuanInfo.length, '个团购');
    }

    /**
     * 分析联系人信息
     */
    analyzeContactInfo() {
        console.log('👥 [PageStructureAnalyzer] 分析联系人信息...');
        
        const contactInfo = [];
        const contactNodes = this.findAllElements(this.selectors.contactItems, document);
        
        console.log(`👥 找到 ${contactNodes.length} 个联系人元素`);
        
        contactNodes.forEach((node, index) => {
            const contactData = {
                index: index,
                textContent: node.textContent?.trim(),
                className: node.className,
                attributes: this.getElementAttributes(node),
                html: node.outerHTML.substring(0, 200) + '...'
            };
            
            contactInfo.push(contactData);
            console.log(`  👥 联系人 ${index + 1}:`, contactData.textContent);
        });
        
        this.results.contactInfo = contactInfo;
        console.log('✅ 联系人信息分析完成，共', contactInfo.length, '个联系人');
    }

    /**
     * 分析所有关键元素
     */
    analyzeAllElements() {
        console.log('🔍 [PageStructureAnalyzer] 分析所有关键元素...');
        
        const allElements = [];
        
        // 获取所有有class的元素
        const elementsWithClass = document.querySelectorAll('[class]');
        console.log(`🔍 页面中有 ${elementsWithClass.length} 个带class的元素`);
        
        // 统计class使用频率
        const classStats = {};
        elementsWithClass.forEach(el => {
            const classes = el.className.split(' ').filter(c => c.trim());
            classes.forEach(cls => {
                classStats[cls] = (classStats[cls] || 0) + 1;
            });
        });
        
        // 按使用频率排序
        const sortedClasses = Object.entries(classStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 50); // 取前50个最常用的class
        
        console.log('📊 最常用的50个class:', sortedClasses);
        
        // 查找可能包含关键信息的元素
        const keywordPatterns = [
            'shop', 'store', 'business', 'merchant',
            'user', 'customer', 'client',
            'message', 'chat', 'conversation',
            'info', 'detail', 'profile',
            'contact', 'phone', 'address',
            'price', 'tuan', 'deal', 'offer'
        ];
        
        keywordPatterns.forEach(pattern => {
            const elements = this.findElementsByKeyword(pattern);
            if (elements.length > 0) {
                allElements.push({
                    keyword: pattern,
                    count: elements.length,
                    elements: elements.slice(0, 5).map(el => ({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent?.trim().substring(0, 100)
                    }))
                });
            }
        });
        
        this.results.allElements = allElements;
        this.results.classStats = sortedClasses;
        console.log('✅ 所有关键元素分析完成');
    }

    /**
     * 根据关键词查找元素
     */
    findElementsByKeyword(keyword) {
        const elements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            if (el.className && typeof el.className === 'string' && el.className.toLowerCase().includes(keyword.toLowerCase())) {
                elements.push(el);
            }
        });
        
        return elements;
    }

    /**
     * 查找所有匹配的元素（包括Shadow DOM）- 基于原有逻辑
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
            console.warn('查找元素时出错:', e);
        }
        return elements;
    }

    /**
     * 获取元素的所有属性
     */
    getElementAttributes(element) {
        const attributes = {};
        if (element.attributes) {
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attributes[attr.name] = attr.value;
            }
        }
        return attributes;
    }

    /**
     * 获取元素位置信息
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        };
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
        if (url.includes('dianping.com')) {
            return 'dianping_page';
        }
        return 'unknown';
    }

    /**
     * 查找特定元素
     */
    findElements(selector) {
        console.log(`🔍 查找元素: ${selector}`);
        const elements = this.findAllElements(selector, document);
        console.log(`✅ 找到 ${elements.length} 个元素`);
        
        elements.forEach((el, index) => {
            console.log(`  ${index + 1}. ${el.tagName} - ${el.className} - ${el.textContent?.trim().substring(0, 50)}`);
        });
        
        return elements;
    }

    /**
     * 打印分析结果
     */
    printResults() {
        console.log('\n📊 ========== 页面结构分析结果 ==========');
        console.log('📄 页面信息:', this.results.pageInfo);
        console.log('🏪 商家信息:', this.results.shopInfo);
        console.log('💬 聊天消息:', this.results.chatMessages.length, '条');
        console.log('🎫 团购信息:', this.results.tuanInfo.length, '个');
        console.log('👥 联系人信息:', this.results.contactInfo.length, '个');
        console.log('📊 最常用class (前10):', this.results.classStats?.slice(0, 10));
        console.log('🔍 关键元素:', this.results.allElements.length, '类');
        console.log('==========================================\n');
    }

    /**
     * 获取分析结果
     */
    getResults() {
        return this.results;
    }

    /**
     * 导出分析结果为JSON
     */
    exportResults() {
        const jsonString = JSON.stringify(this.results, null, 2);
        console.log('📤 导出分析结果:');
        console.log(jsonString);
        
        // 如果支持，尝试复制到剪贴板
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsonString).then(() => {
                console.log('✅ 结果已复制到剪贴板');
            }).catch(err => {
                console.warn('❌ 复制到剪贴板失败:', err);
            });
        }
        
        return jsonString;
    }
}

// 创建分析器实例并暴露到全局
console.log('🚀 正在初始化页面结构分析器...');
window.analyzer = new PageStructureAnalyzer();

// 提供快速分析方法
window.quickAnalyze = () => {
    console.log('⚡ 快速分析页面结构...');
    return window.analyzer.analyzeAll();
};

console.log('✅ 页面结构分析器已准备就绪！');
console.log('🎯 使用方法:');
console.log('  - quickAnalyze() - 快速分析');
console.log('  - analyzer.analyzeShopInfo() - 只分析商家信息');
console.log('  - analyzer.findElements(".userinfo-from-shop") - 查找特定元素');