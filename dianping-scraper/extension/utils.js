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
     * 表情映射表
     */
    emotionMap: {
        // 基础表情
        'cc_face_1': '[微笑]',
        'cc_face_2': '[撇嘴]',
        'cc_face_3': '[色]',
        'cc_face_4': '[发呆]',
        'cc_face_5': '[得意]',
        'cc_face_6': '[流泪]',
        'cc_face_7': '[害羞]',
        'cc_face_8': '[闭嘴]',
        'cc_face_9': '[睡]',
        'cc_face_10': '[大哭]',
        'cc_face_11': '[尴尬]',
        'cc_face_12': '[发怒]',
        'cc_face_13': '[调皮]',
        'cc_face_14': '[呲牙]',
        'cc_face_15': '[惊讶]',
        'cc_face_16': '[难过]',
        'cc_face_17': '[酷]',
        'cc_face_18': '[冷汗]',
        'cc_face_19': '[抓狂]',
        'cc_face_20': '[吐]',
        'cc_face_21': '[偷笑]',
        'cc_face_22': '[愉快]',
        'cc_face_23': '[白眼]',
        'cc_face_24': '[傲慢]',
        'cc_face_25': '[饥饿]',
        'cc_face_26': '[困]',
        'cc_face_27': '[惊恐]',
        'cc_face_28': '[流汗]',
        'cc_face_29': '[憨笑]',
        'cc_face_30': '[悠闲]',
        // 扩展表情
        'cc_face_67': '[爱心]',
        'cc_face_90': '[OK]'
    },

    /**
     * 提取消息内容（包括表情）
     */
    extractMessageContent(messageNode) {
        let content = '';
        let faceCount = 0; // 统计表情数量
        
        // 递归处理所有子节点
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    content += text;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList && node.classList.contains('face')) {
                    // 处理表情
                    const faceClass = Array.from(node.classList).find(cls => cls.startsWith('cc_face_'));
                    if (faceClass && this.emotionMap[faceClass]) {
                        content += this.emotionMap[faceClass];
                        faceCount++;
                        console.log(`[Utils] 提取表情: ${faceClass} -> ${this.emotionMap[faceClass]}`);
                    } else if (faceClass) {
                        console.warn(`[Utils] 未知表情类: ${faceClass}`);
                    }
                } else {
                    // 递归处理其他元素的子节点
                    for (const child of node.childNodes) {
                        processNode(child);
                    }
                }
            }
        };
        
        processNode(messageNode);
        
        const finalContent = content.trim();
        if (faceCount > 0 || finalContent) {
            console.log(`[Utils] 消息内容提取完成: "${finalContent}" (包含${faceCount}个表情)`);
        }
        
        return finalContent;
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