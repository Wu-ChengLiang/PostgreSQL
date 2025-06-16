// 工具函数库

// 显示消息提示
function showMessage(message, type = 'info', duration = 3000) {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // 自动移除消息
    setTimeout(() => {
        if (messageEl && messageEl.parentNode) {
            messageEl.remove();
        }
    }, duration);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化日期（仅日期）
function formatDateOnly(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 格式化时间（仅时间）
function formatTimeOnly(timeString) {
    if (!timeString) return '-';
    return timeString.slice(0, 5); // 截取 HH:MM
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 验证手机号
function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// 验证邮箱
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 生成随机ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 深拷贝对象
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const cloned = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
}

// 本地存储工具
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (e) {
            console.error('Storage clear error:', e);
        }
    }
};

// 获取URL参数
function getUrlParams() {
    const params = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlSearchParams) {
        params[key] = value;
    }
    return params;
}

// 设置URL参数
function setUrlParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.replaceState({}, '', url);
}

// 加载状态管理
const LoadingManager = {
    show(element) {
        if (!element) return;
        element.innerHTML = '<div class="loading">加载中...</div>';
    },
    
    hide(element) {
        if (!element) return;
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    }
};

// 表单验证
function validateForm(formElement, rules) {
    const errors = [];
    
    Object.keys(rules).forEach(fieldName => {
        const field = formElement.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;
        
        const rule = rules[fieldName];
        const value = field.value.trim();
        
        // 必填验证
        if (rule.required && !value) {
            errors.push(`${rule.label || fieldName} 是必填项`);
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
        
        // 长度验证
        if (value && rule.minLength && value.length < rule.minLength) {
            errors.push(`${rule.label || fieldName} 至少需要 ${rule.minLength} 个字符`);
            field.classList.add('error');
        }
        
        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${rule.label || fieldName} 不能超过 ${rule.maxLength} 个字符`);
            field.classList.add('error');
        }
        
        // 正则验证
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(rule.message || `${rule.label || fieldName} 格式不正确`);
            field.classList.add('error');
        }
        
        // 自定义验证
        if (value && rule.validator && !rule.validator(value)) {
            errors.push(rule.message || `${rule.label || fieldName} 验证失败`);
            field.classList.add('error');
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// 确认对话框
function confirmDialog(message, onConfirm, onCancel) {
    const result = confirm(message);
    if (result && onConfirm) {
        onConfirm();
    } else if (!result && onCancel) {
        onCancel();
    }
    return result;
}

// 数组去重
function uniqueArray(arr, key) {
    if (!key) {
        return [...new Set(arr)];
    }
    
    const seen = new Set();
    return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

// 数字格式化
function formatNumber(num, decimals = 0) {
    if (isNaN(num)) return '0';
    return Number(num).toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// 计算两个日期之间的天数
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

// 导出所有工具函数
window.Utils = {
    showMessage,
    formatDate,
    formatDateOnly,
    formatTimeOnly,
    debounce,
    throttle,
    validatePhone,
    validateEmail,
    generateId,
    deepClone,
    Storage,
    getUrlParams,
    setUrlParams,
    LoadingManager,
    validateForm,
    confirmDialog,
    uniqueArray,
    formatNumber,
    daysBetween
}; 