/**
 * 大众点评数据提取器 - 弹出窗口脚本
 * 精简版 - 只保留核心功能
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleExtraction');
    const toggleText = document.getElementById('toggleText');
    const extractionStatus = document.getElementById('extractionStatus');
    const websocketStatus = document.getElementById('websocketStatus');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    // 联系人点击控件
    const startClickButton = document.getElementById('startClickContacts');
    const stopClickButton = document.getElementById('stopClickContacts');
    const clickText = document.getElementById('clickText');
    const contactCountInput = document.getElementById('contactCount');
    const switchIntervalInput = document.getElementById('switchInterval');
    const clickProgressSpan = document.getElementById('clickProgress');
    const currentShop = document.getElementById('currentShop');

    // 测试发送按钮
    const testSendButton = document.getElementById('testSendButton');

    let currentTabId = null;
    let isExtracting = false;
    let isClickingContacts = false;

    function updateUI(extracting) {
        isExtracting = extracting;
        if (isExtracting) {
            toggleButton.className = 'btn btn-secondary';
            toggleText.textContent = '停止提取';
            extractionStatus.textContent = '运行中';
            extractionStatus.className = 'value connected';
        } else {
            toggleButton.className = 'btn btn-primary';
            toggleText.textContent = '启动提取';
            extractionStatus.textContent = '未激活';
            extractionStatus.className = 'value warning';
        }
    }
    
    function updateWebsocketStatusUI(connected) {
         if (connected) {
            websocketStatus.textContent = '已连接';
            websocketStatus.className = 'value connected';
            statusDot.className = 'status-dot connected';
            statusText.textContent = '已连接';
        } else {
            websocketStatus.textContent = '未连接';
            websocketStatus.className = 'value error';
            statusDot.className = 'status-dot error';
            statusText.textContent = '未连接';
        }
    }

    function updateClickUI(clicking) {
        isClickingContacts = clicking;
        if (isClickingContacts) {
            startClickButton.style.display = 'none';
            stopClickButton.style.display = 'block';
            contactCountInput.disabled = true;
            switchIntervalInput.disabled = true;
        } else {
            startClickButton.style.display = 'block';
            stopClickButton.style.display = 'none';
            contactCountInput.disabled = false;
            switchIntervalInput.disabled = false;
            clickProgressSpan.textContent = '已停止';
            clickProgressSpan.className = 'value warning';
        }
    }

    function showMessage(text, type = 'success') {
        const messageDiv = document.getElementById('message');
        const messageText = document.getElementById('messageText');
        messageText.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    // 获取当前标签页并检查状态
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab) return;
        currentTabId = tab.id;
        
        const pageElement = document.getElementById('currentPage');
        if (!tab.url || !tab.url.includes('dianping.com')) {
            toggleButton.disabled = true;
            extractionStatus.textContent = '非大众点评页';
            pageElement.textContent = '非大众点评页面';
            pageElement.className = 'value warning';
            updateUI(false);
        } else {
            pageElement.textContent = '大众点评';
            pageElement.className = 'value connected';
        }

        // 获取初始状态
        chrome.runtime.sendMessage({ type: 'getStatus', tabId: currentTabId }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("获取状态错误:", chrome.runtime.lastError.message);
                updateUI(false);
                updateWebsocketStatusUI(false);
            } else if (response) {
                updateUI(response.isExtracting);
                updateWebsocketStatusUI(response.isConnected);

                // 新增：从内容脚本获取店铺名称
                chrome.tabs.sendMessage(currentTabId, { type: 'getShopName' }, (shopResponse) => {
                    if (chrome.runtime.lastError) {
                        console.warn("无法获取店铺名称:", chrome.runtime.lastError.message);
                        return;
                    }
                    if (shopResponse && shopResponse.shopName) {
                        currentShop.textContent = shopResponse.shopName;
                        currentShop.className = 'value connected';
                    }
                });
            } else {
                updateUI(false);
                updateWebsocketStatusUI(false);
            }
        });
    });

    // 切换提取状态
    toggleButton.addEventListener('click', () => {
        if (!currentTabId || toggleButton.disabled) return;

        const messageType = isExtracting ? 'stopExtraction' : 'startExtraction';
        chrome.runtime.sendMessage({ type: messageType, tabId: currentTabId }, (response) => {
            if (chrome.runtime.lastError) {
                console.error(messageType + " 错误:", chrome.runtime.lastError.message);
            } else if (response && (response.status === 'started' || response.status === 'stopped')) {
                updateUI(!isExtracting);
            }
        });
    });

    // 开始稳定工作
    startClickButton.addEventListener('click', () => {
        if (!currentTabId || startClickButton.disabled) return;

        const count = parseInt(contactCountInput.value) || 2;
        const intervalSeconds = parseFloat(switchIntervalInput.value) || 3;
        const interval = intervalSeconds * 1000; // 转换为毫秒

        if (count < 1 || count > 50) {
            showMessage('请输入1-50之间的联系人数量', 'error');
            return;
        }

        if (intervalSeconds < 1 || intervalSeconds > 30) {
            showMessage('请输入1-30秒之间的切换间隔', 'error');
            return;
        }

        chrome.runtime.sendMessage({
            type: 'startClickContacts',
            tabId: currentTabId,
            count: count,
            interval: interval
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("启动稳定工作错误:", chrome.runtime.lastError.message);
                showMessage('启动失败', 'error');
            } else if (response && response.status === 'started') {
                updateClickUI(true);
                clickProgressSpan.textContent = `第1轮 0/${count} - 准备开始(循环模式)`;
                clickProgressSpan.className = 'value connected';
                showMessage(`开始稳定工作循环处理${count}个联系人(${intervalSeconds}秒间隔)`, 'success');
            }
        });
    });

    // 停止点击联系人
    stopClickButton.addEventListener('click', () => {
        if (!currentTabId) return;

        chrome.runtime.sendMessage({
            type: 'stopClickContacts',
            tabId: currentTabId
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("停止稳定工作错误:", chrome.runtime.lastError.message);
            } else if (response && response.status === 'stopped') {
                updateClickUI(false);
                showMessage('已停止稳定工作', 'warning');
            }
        });
    });

    // 测试发送功能
    testSendButton.addEventListener('click', () => {
        if (!currentTabId) {
            showMessage('请先选择一个大众点评页面', 'error');
            return;
        }

        // 禁用按钮避免重复点击
        testSendButton.disabled = true;
        testSendButton.style.opacity = '0.6';

        chrome.runtime.sendMessage({
            type: 'testSendMessage',
            tabId: currentTabId
        }, (response) => {
            // 恢复按钮状态
            testSendButton.disabled = false;
            testSendButton.style.opacity = '1';

            if (chrome.runtime.lastError) {
                console.error("测试发送错误:", chrome.runtime.lastError.message);
                showMessage('测试发送失败', 'error');
            } else if (response && response.status === 'success') {
                showMessage('测试消息发送成功！', 'success');
            } else if (response && response.status === 'failed') {
                showMessage(response.message || '测试发送失败', 'error');
            }
        });
    });

    // 监听来自content script的进度更新
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'clickProgress') {
            let progressText;
            if (request.isLooping) {
                // 循环模式显示
                progressText = request.status ? 
                    `第${request.round}轮 ${request.current}/${request.total} - ${request.status}` : 
                    `第${request.round}轮 ${request.current}/${request.total} (循环中)`;
            } else {
                // 普通模式显示
                progressText = request.status ? 
                    `${request.current}/${request.total} - ${request.status}` : 
                    `${request.current}/${request.total}`;
            }
            clickProgressSpan.textContent = progressText;
            
            // 循环模式下不自动停止
            if (!request.isLooping && request.current >= request.total) {
                updateClickUI(false);
                showMessage('稳定工作完成', 'success');
            }
        } else if (request.type === 'clickError') {
            updateClickUI(false);
            showMessage(request.message || '工作过程中发生错误', 'error');
        } else if (request.type === 'shopInfoUpdate') {
            if (request.shopName) {
                currentShop.textContent = request.shopName;
                currentShop.className = 'value connected';
            } else {
                currentShop.textContent = '--';
                currentShop.className = 'value';
            }
        }
    });
}); 