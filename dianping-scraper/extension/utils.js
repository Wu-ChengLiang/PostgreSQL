/**
 * 大众点评数据提取器 - 共享工具模块
 * 包含各模块重复使用的通用函数
 */

window.DianpingUtils = {
    /**
     * 查找所有元素（包括Shadow DOM）
     */
    findAllElements(selector, root = document) {
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
    },

    /**
     * 格式化店铺名称
     */
    formatShopName(rawName) {
        if (!rawName) {
            return null;
        }

        let formattedName = rawName;

        // 移除城市前缀，例如 "上海 - "
        formattedName = formattedName.replace(/^.+?\s*-\s*/, '');

        // 移除括号前的多余空格
        formattedName = formattedName.replace(/\s+\(/, '(');

        // 将半角括号替换为全角括号
        formattedName = formattedName.replace(/\(/g, '（').replace(/\)/g, '）');
        
        // 移除全角括号内部的所有空格
        formattedName = formattedName.replace(/（([^）]+)）/g, (match, innerContent) => {
            return `（${innerContent.replace(/\s/g, '')}）`;
        });

        const finalName = formattedName.trim();
        console.log(`[Utils] 店铺名称格式化: "${rawName}" -> "${finalName}"`);

        return finalName;
    },

    /**
     * 发送店铺信息更新
     */
    sendShopInfoUpdate(shopName) {
        try {
            if (shopName) {
                chrome.runtime.sendMessage({
                    type: 'shopInfoUpdate',
                    shopName: shopName
                });
            }
        } catch (error) {
            console.error('[Utils] 发送店铺信息更新错误:', error);
        }
    },

    /**
     * 通用选择器配置
     */
    selectors: {
        chatMessageList: '.text-message.normal-text, .rich-message, .text-message.shop-text',
        tuanInfo: '.tuan',
        contactItems: '.chat-list-item',
        shopInfo: '.userinfo-from-shop'
    },

    /**
     * 获取当前店铺名称
     */
    getCurrentShopName() {
        console.log('[Utils] 正在查找店铺名称...');
        
        const elements = this.findAllElements(this.selectors.shopInfo, document);
        if (elements.length === 0) {
            console.log('[Utils] 未找到店铺信息元素');
            return null;
        }
        
        const shopInfoElement = elements[0];
        const rawText = shopInfoElement.textContent.trim();
        const formattedName = this.formatShopName(rawText);
        
        console.log(`[Utils] 找到店铺元素，原始文本: "${rawText}"`);
        console.log(`[Utils] 格式化后店铺名称: "${formattedName}"`);
        
        return formattedName;
    },

    /**
     * 生成唯一ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 错误处理包装器
     */
    wrapWithErrorHandler(fn, context = 'Unknown') {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                console.error(`[Utils] ${context} 错误:`, error);
                return null;
            }
        };
    }
}; 