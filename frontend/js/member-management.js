// 会员管理模块
class MemberManagement {
    constructor() {
        this.currentMember = null;
        this.token = localStorage.getItem('adminToken');
        this.baseUrl = '/api/v1/admin';
        this.initEventListeners();
    }

    initEventListeners() {
        // 新增会员表单提交
        const addMemberForm = document.getElementById('addMemberForm');
        if (addMemberForm) {
            addMemberForm.addEventListener('submit', (e) => this.handleAddMember(e));
        }

        // 充值表单提交
        const rechargeForm = document.getElementById('rechargeForm');
        if (rechargeForm) {
            rechargeForm.addEventListener('submit', (e) => this.handleRecharge(e));
        }

        // 消费表单提交
        const consumeForm = document.getElementById('consumeForm');
        if (consumeForm) {
            consumeForm.addEventListener('submit', (e) => this.handleConsume(e));
        }

        // 手机号输入框回车键搜索
        const phoneSearchInput = document.getElementById('memberPhoneSearch');
        if (phoneSearchInput) {
            phoneSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchMemberByPhone();
                }
            });
        }
    }

    // 搜索会员
    async searchMemberByPhone() {
        const phone = document.getElementById('memberPhoneSearch').value.trim();
        
        if (!phone) {
            this.showAlert('请输入手机号码', 'warning');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            this.showAlert('请输入正确的11位手机号码', 'warning');
            return;
        }

        try {
            this.showLoading('正在查询会员信息...');
            
            const response = await fetch(`${this.baseUrl}/members/phone/${phone}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentMember = data.member;
                this.displayMemberDetails(data.member);
                this.showMemberActions();
            } else if (response.status === 404) {
                this.showAlert('未找到该手机号的会员信息', 'info');
                this.hideMemberDetails();
            } else {
                throw new Error('查询失败');
            }
        } catch (error) {
            console.error('搜索会员失败:', error);
            this.showAlert('查询失败，请稍后重试', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 显示会员详情
    displayMemberDetails(member) {
        const memberDetails = document.getElementById('memberDetails');
        
        const levelBadgeClass = `member-level-badge ${member.member_level}`;
        const levelText = this.getLevelText(member.member_level);
        
        memberDetails.innerHTML = `
            <div class="member-info-header">
                <div class="member-avatar">
                    ${member.name.charAt(0)}
                </div>
                <div class="member-basic-info">
                    <h3>${member.name}</h3>
                    <p class="member-phone">📱 ${member.phone}</p>
                </div>
                <div class="member-level">
                    <span class="${levelBadgeClass}">${levelText}</span>
                </div>
            </div>
            <div class="member-stats">
                <div class="stat-item">
                    <div class="stat-label">会员编号</div>
                    <div class="stat-value">${member.membership_number}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">账户余额</div>
                    <div class="stat-value balance">¥${parseFloat(member.balance || 0).toFixed(2)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">积分</div>
                    <div class="stat-value points">${member.points || 0}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">总消费</div>
                    <div class="stat-value">¥${parseFloat(member.total_spent || 0).toFixed(2)}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">折扣率</div>
                    <div class="stat-value">${Math.round((member.discount_rate || 1) * 100)}%</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">注册时间</div>
                    <div class="stat-value">${new Date(member.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        `;
        
        memberDetails.style.display = 'block';
    }

    // 隐藏会员详情
    hideMemberDetails() {
        const memberDetails = document.getElementById('memberDetails');
        const memberActions = document.getElementById('memberActions');
        const transactionHistory = document.getElementById('transactionHistory');
        
        memberDetails.style.display = 'none';
        memberActions.style.display = 'none';
        transactionHistory.style.display = 'none';
        
        this.currentMember = null;
    }

    // 显示会员操作按钮
    showMemberActions() {
        const memberActions = document.getElementById('memberActions');
        memberActions.style.display = 'flex';
    }

    // 获取等级文本
    getLevelText(level) {
        const levelMap = {
            'normal': '普通会员',
            'silver': '银卡会员',
            'gold': '金卡会员',
            'diamond': '钻石会员'
        };
        return levelMap[level] || '普通会员';
    }

    // 打开新增会员模态框
    openAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        modal.style.display = 'block';
        
        // 清空表单
        document.getElementById('addMemberForm').reset();
    }

    // 关闭新增会员模态框
    closeAddMemberModal() {
        const modal = document.getElementById('addMemberModal');
        modal.style.display = 'none';
    }

    // 处理新增会员
    async handleAddMember(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('memberName').value.trim(),
            phone: document.getElementById('memberPhone').value.trim(),
            gender: document.getElementById('memberGender').value,
            age: parseInt(document.getElementById('memberAge').value) || null,
            address: document.getElementById('memberAddress').value.trim(),
            emergency_contact_name: document.getElementById('memberEmergencyName').value.trim(),
            emergency_contact_phone: document.getElementById('memberEmergencyPhone').value.trim()
        };

        // 验证必填字段
        if (!formData.name || !formData.phone) {
            this.showAlert('请填写姓名和手机号', 'warning');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            this.showAlert('请输入正确的11位手机号码', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/members`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('会员添加成功！', 'success');
                this.closeAddMemberModal();
                
                // 自动搜索刚添加的会员
                document.getElementById('memberPhoneSearch').value = formData.phone;
                this.searchMemberByPhone();
            } else {
                throw new Error(data.error?.message || '添加失败');
            }
        } catch (error) {
            console.error('添加会员失败:', error);
            this.showAlert(error.message || '添加失败，请稍后重试', 'error');
        }
    }

    // 打开充值模态框
    openRechargeModal() {
        if (!this.currentMember) {
            this.showAlert('请先查询会员信息', 'warning');
            return;
        }

        const modal = document.getElementById('rechargeModal');
        const memberInfo = document.getElementById('rechargeModalMemberInfo');
        
        memberInfo.innerHTML = `
            <h4>💳 ${this.currentMember.name}</h4>
            <p>手机号：${this.currentMember.phone}</p>
            <p>当前余额：¥${parseFloat(this.currentMember.balance || 0).toFixed(2)}</p>
            <p>会员等级：${this.getLevelText(this.currentMember.member_level)}</p>
        `;
        
        // 清空表单
        document.getElementById('rechargeForm').reset();
        modal.style.display = 'block';
    }

    // 关闭充值模态框
    closeRechargeModal() {
        const modal = document.getElementById('rechargeModal');
        modal.style.display = 'none';
    }

    // 处理充值
    async handleRecharge(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('rechargeAmount').value);
        const paymentMethod = document.getElementById('rechargeMethod').value;
        const description = document.getElementById('rechargeDescription').value.trim() || '会员充值';

        if (!amount || amount <= 0) {
            this.showAlert('请输入正确的充值金额', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/members/${this.currentMember.phone}/recharge`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    payment_method: paymentMethod,
                    description: description
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert(`充值成功！新余额：¥${data.new_balance}`, 'success');
                this.closeRechargeModal();
                
                // 刷新会员信息
                this.searchMemberByPhone();
            } else {
                throw new Error(data.error?.message || '充值失败');
            }
        } catch (error) {
            console.error('充值失败:', error);
            this.showAlert(error.message || '充值失败，请稍后重试', 'error');
        }
    }

    // 打开消费模态框
    openConsumeModal() {
        if (!this.currentMember) {
            this.showAlert('请先查询会员信息', 'warning');
            return;
        }

        const modal = document.getElementById('consumeModal');
        const memberInfo = document.getElementById('consumeModalMemberInfo');
        const discountInfo = document.getElementById('discountInfo');
        
        memberInfo.innerHTML = `
            <h4>🛒 ${this.currentMember.name}</h4>
            <p>手机号：${this.currentMember.phone}</p>
            <p>当前余额：¥${parseFloat(this.currentMember.balance || 0).toFixed(2)}</p>
            <p>会员等级：${this.getLevelText(this.currentMember.member_level)}</p>
        `;

        const discountRate = this.currentMember.discount_rate || 1;
        const discountPercent = Math.round(discountRate * 100);
        
        if (discountRate < 1) {
            discountInfo.innerHTML = `
                <h5>🎉 会员优惠</h5>
                <p>您享受 ${discountPercent}% 折扣优惠</p>
                <p>实际扣费将按优惠价格计算</p>
            `;
            discountInfo.style.display = 'block';
        } else {
            discountInfo.style.display = 'none';
        }
        
        // 清空表单
        document.getElementById('consumeForm').reset();
        modal.style.display = 'block';
    }

    // 关闭消费模态框
    closeConsumeModal() {
        const modal = document.getElementById('consumeModal');
        modal.style.display = 'none';
    }

    // 处理消费
    async handleConsume(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('consumeAmount').value);
        const serviceType = document.getElementById('consumeServiceType').value;
        const description = document.getElementById('consumeDescription').value.trim() || serviceType;

        if (!amount || amount <= 0) {
            this.showAlert('请输入正确的消费金额', 'warning');
            return;
        }

        const currentBalance = parseFloat(this.currentMember.balance || 0);
        const discountRate = this.currentMember.discount_rate || 1;
        const actualAmount = amount * discountRate;

        if (actualAmount > currentBalance) {
            this.showAlert(`余额不足！当前余额：¥${currentBalance.toFixed(2)}，需要：¥${actualAmount.toFixed(2)}`, 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/members/${this.currentMember.phone}/consume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    description: description,
                    service_type: serviceType
                })
            });

            const data = await response.json();

            if (response.ok) {
                const pointsEarned = data.points_earned || 0;
                this.showAlert(`消费成功！扣费：¥${data.amount}，获得积分：${pointsEarned}`, 'success');
                this.closeConsumeModal();
                
                // 刷新会员信息
                this.searchMemberByPhone();
            } else {
                throw new Error(data.error?.message || '消费失败');
            }
        } catch (error) {
            console.error('消费失败:', error);
            this.showAlert(error.message || '消费失败，请稍后重试', 'error');
        }
    }

    // 查看交易记录
    async viewTransactionHistory() {
        if (!this.currentMember) {
            this.showAlert('请先查询会员信息', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/members/${this.currentMember.phone}/transactions`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.displayTransactionHistory(data.transactions);
            } else {
                throw new Error('获取交易记录失败');
            }
        } catch (error) {
            console.error('获取交易记录失败:', error);
            this.showAlert('获取交易记录失败，请稍后重试', 'error');
        }
    }

    // 显示交易记录
    displayTransactionHistory(transactions) {
        const historyContainer = document.getElementById('transactionHistory');
        
        if (!transactions || transactions.length === 0) {
            historyContainer.innerHTML = `
                <div class="transaction-header">📋 交易记录</div>
                <div class="empty-state">暂无交易记录</div>
            `;
        } else {
            const transactionItems = transactions.map(tx => {
                const isRecharge = tx.transaction_type === 'RECHARGE';
                const amountClass = isRecharge ? 'positive' : 'negative';
                const amountPrefix = isRecharge ? '+' : '-';
                
                return `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-type ${tx.transaction_type}">
                                ${isRecharge ? '💰 充值' : '🛒 消费'}
                            </div>
                            <div class="transaction-desc">${tx.description || ''}</div>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-amount ${amountClass}">
                                ${amountPrefix}¥${parseFloat(tx.amount).toFixed(2)}
                            </div>
                            <div class="transaction-date">
                                ${new Date(tx.created_at).toLocaleString()}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            historyContainer.innerHTML = `
                <div class="transaction-header">📋 交易记录 (共${transactions.length}条)</div>
                ${transactionItems}
            `;
        }
        
        historyContainer.style.display = 'block';
    }

    // 编辑会员信息
    editMemberInfo() {
        if (!this.currentMember) {
            this.showAlert('请先查询会员信息', 'warning');
            return;
        }
        
        // 这里可以打开编辑模态框，暂时用alert提示
        this.showAlert('编辑功能开发中...', 'info');
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const memberDetails = document.getElementById('memberDetails');
        memberDetails.innerHTML = `<div class="loading">${message}</div>`;
        memberDetails.style.display = 'block';
    }

    // 隐藏加载状态
    hideLoading() {
        // 加载状态会被其他内容覆盖，这里不需要特殊处理
    }

    // 显示提示消息
    showAlert(message, type = 'info') {
        // 创建提示元素
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        // 根据类型设置样式
        switch (type) {
            case 'success':
                alert.style.backgroundColor = '#d4edda';
                alert.style.color = '#155724';
                alert.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                alert.style.backgroundColor = '#f8d7da';
                alert.style.color = '#721c24';
                alert.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                alert.style.backgroundColor = '#fff3cd';
                alert.style.color = '#856404';
                alert.style.border = '1px solid #ffeaa7';
                break;
            default:
                alert.style.backgroundColor = '#d1ecf1';
                alert.style.color = '#0c5460';
                alert.style.border = '1px solid #bee5eb';
        }

        alert.textContent = message;
        document.body.appendChild(alert);

        // 3秒后自动消失
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
    }
}

// 全局函数，供HTML调用
let memberManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    memberManager = new MemberManagement();
});

// 全局函数
function openAddMemberModal() {
    memberManager.openAddMemberModal();
}

function closeAddMemberModal() {
    memberManager.closeAddMemberModal();
}

function searchMemberByPhone() {
    memberManager.searchMemberByPhone();
}

function openRechargeModal() {
    memberManager.openRechargeModal();
}

function closeRechargeModal() {
    memberManager.closeRechargeModal();
}

function openConsumeModal() {
    memberManager.openConsumeModal();
}

function closeConsumeModal() {
    memberManager.closeConsumeModal();
}

function viewTransactionHistory() {
    memberManager.viewTransactionHistory();
}

function editMemberInfo() {
    memberManager.editMemberInfo();
}