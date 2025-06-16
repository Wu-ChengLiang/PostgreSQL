// API基础URL
const API_BASE_URL = '/api/v1/admin';
const CLIENT_API_URL = '/api/v1/client';

// 认证令牌
let authToken = localStorage.getItem('adminToken');
let currentAdmin = null;

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showAdminPage();
    } else {
        showLoginPage();
    }
    
    // 设置登录表单事件
    document.getElementById('loginForm').onsubmit = handleLogin;
    
    // 设置添加技师表单事件
    document.getElementById('addTherapistForm').onsubmit = handleAddTherapist;
    
    // 设置编辑技师表单事件
    document.getElementById('editTherapistForm').onsubmit = handleEditTherapist;
});

// 显示登录页面
function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminPage').style.display = 'none';
}

// 显示管理页面
function showAdminPage() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    
    // 加载初始数据
    loadDashboard();
    loadStoresForFilter();
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.data.token;
            currentAdmin = data.data.admin;
            localStorage.setItem('adminToken', authToken);
            
            document.getElementById('adminInfo').textContent = `欢迎，${currentAdmin.username}`;
            showAdminPage();
        } else {
            showMessage(data.error.message || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录失败:', error);
        showMessage('登录失败，请检查网络连接', 'error');
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('adminToken');
    authToken = null;
    currentAdmin = null;
    showLoginPage();
}

// API请求封装（带认证）
async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${authToken}`
        }
    });
    
    if (response.status === 401) {
        logout();
        throw new Error('认证失败');
    }
    
    return response.json();
}

// 显示不同的内容区域
function showSection(section) {
    // 隐藏所有区域
    document.querySelectorAll('.content-section').forEach(s => {
        s.style.display = 'none';
    });
    
    // 更新菜单激活状态
    document.querySelectorAll('.menu a').forEach(a => {
        a.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 显示选中的区域
    document.getElementById(`${section}Section`).style.display = 'block';
    
    // 加载对应的数据
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'therapists':
            loadTherapists();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'stores':
            loadStores();
            break;
        case 'statistics':
            initStatistics();
            break;
    }
}

// 加载数据概览
async function loadDashboard() {
    try {
        // 获取今日日期
        const today = new Date().toISOString().split('T')[0];
        
        // 获取本周开始日期
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        // 获取统计数据
        const [todayStats, weekStats, stores, therapists] = await Promise.all([
            apiRequest(`${API_BASE_URL}/appointments?date=${today}`),
            apiRequest(`${API_BASE_URL}/statistics/appointments?start_date=${weekStartStr}&end_date=${today}`),
            apiRequest(`${API_BASE_URL}/stores`),
            apiRequest(`${API_BASE_URL}/therapists`)
        ]);
        
        // 更新显示
        document.getElementById('todayAppointments').textContent = todayStats.data.total || 0;
        document.getElementById('weekAppointments').textContent = weekStats.data.totals.total_appointments || 0;
        document.getElementById('activeTherapists').textContent = therapists.data.total || 0;
        document.getElementById('totalStores').textContent = stores.data.stores.length || 0;
    } catch (error) {
        console.error('加载数据概览失败:', error);
    }
}

// 加载门店列表（用于筛选）
async function loadStoresForFilter() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores`);
        
        if (data.success) {
            const selects = ['filterStore', 'therapistStore'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    // 保留第一个选项
                    select.innerHTML = select.innerHTML.split('</option>')[0] + '</option>';
                    
                    data.data.stores.forEach(store => {
                        const option = document.createElement('option');
                        option.value = store.id;
                        option.textContent = store.name;
                        select.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error('加载门店列表失败:', error);
    }
}

// 加载技师列表
async function loadTherapists() {
    const storeId = document.getElementById('filterStore').value;
    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId);
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/therapists?${params}`);
        
        if (data.success) {
            const tbody = document.getElementById('therapistTableBody');
            tbody.innerHTML = '';
            
            data.data.therapists.forEach(therapist => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${therapist.name}</td>
                    <td>${therapist.position}</td>
                    <td>${therapist.store_name}</td>
                    <td>${therapist.experience_years}年</td>
                    <td>${therapist.specialties.join('、')}</td>
                    <td><span class="status-badge status-${therapist.status}">${therapist.status === 'active' ? '在职' : '离职'}</span></td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-edit" onclick="editTherapist(${therapist.id})">编辑</button>
                        <button class="btn btn-sm btn-delete" onclick="deleteTherapist(${therapist.id})">删除</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载技师列表失败:', error);
    }
}

// 打开添加技师模态框
function openAddTherapistModal() {
    document.getElementById('addTherapistModal').style.display = 'block';
}

// 关闭添加技师模态框
function closeAddTherapistModal() {
    document.getElementById('addTherapistModal').style.display = 'none';
    document.getElementById('addTherapistForm').reset();
}

// 处理添加技师
async function handleAddTherapist(e) {
    e.preventDefault();
    
    const formData = {
        store_id: parseInt(document.getElementById('therapistStore').value),
        name: document.getElementById('therapistName').value,
        position: document.getElementById('therapistPosition').value,
        years_of_experience: parseInt(document.getElementById('therapistExperience').value),
        specialties: document.getElementById('therapistSpecialties').value.split(/[,，]/).map(s => s.trim()),
        phone: document.getElementById('therapistPhone').value,
        honors: document.getElementById('therapistHonors').value
    };
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/therapists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (data.success) {
            showMessage('技师添加成功', 'success');
            closeAddTherapistModal();
            loadTherapists();
        } else {
            showMessage(data.error.message || '添加失败', 'error');
        }
    } catch (error) {
        console.error('添加技师失败:', error);
        showMessage('添加失败，请稍后重试', 'error');
    }
}

// 编辑技师
async function editTherapist(id) {
    try {
        // 获取技师详情
        const data = await apiRequest(`${API_BASE_URL}/therapists/${id}`);
        
        if (data.success) {
            const therapist = data.data;
            
            // 填充表单
            document.getElementById('editTherapistId').value = therapist.id;
            document.getElementById('editTherapistStore').value = therapist.store_id;
            document.getElementById('editTherapistName').value = therapist.name;
            document.getElementById('editTherapistPosition').value = therapist.position;
            document.getElementById('editTherapistExperience').value = therapist.experience_years || therapist.years_of_experience;
            document.getElementById('editTherapistSpecialties').value = therapist.specialties.join('，');
            document.getElementById('editTherapistPhone').value = therapist.phone || '';
            document.getElementById('editTherapistHonors').value = therapist.honors || '';
            document.getElementById('editTherapistStatus').value = therapist.status;
            
            // 加载门店列表到编辑表单
            const storeSelect = document.getElementById('editTherapistStore');
            const stores = await apiRequest(`${API_BASE_URL}/stores`);
            if (stores.success) {
                storeSelect.innerHTML = '<option value="">请选择门店</option>';
                stores.data.stores.forEach(store => {
                    const option = document.createElement('option');
                    option.value = store.id;
                    option.textContent = store.name;
                    if (store.id === therapist.store_id) {
                        option.selected = true;
                    }
                    storeSelect.appendChild(option);
                });
            }
            
            // 显示模态框
            document.getElementById('editTherapistModal').style.display = 'block';
        }
    } catch (error) {
        console.error('获取技师详情失败:', error);
        showMessage('获取技师信息失败，请稍后重试', 'error');
    }
}

// 关闭编辑技师模态框
function closeEditTherapistModal() {
    document.getElementById('editTherapistModal').style.display = 'none';
    document.getElementById('editTherapistForm').reset();
}

// 处理编辑技师
async function handleEditTherapist(e) {
    e.preventDefault();
    
    const therapistId = document.getElementById('editTherapistId').value;
    const formData = {
        store_id: parseInt(document.getElementById('editTherapistStore').value),
        name: document.getElementById('editTherapistName').value,
        position: document.getElementById('editTherapistPosition').value,
        years_of_experience: parseInt(document.getElementById('editTherapistExperience').value),
        specialties: document.getElementById('editTherapistSpecialties').value.split(/[,，]/).map(s => s.trim()),
        phone: document.getElementById('editTherapistPhone').value,
        honors: document.getElementById('editTherapistHonors').value,
        status: document.getElementById('editTherapistStatus').value
    };
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/therapists/${therapistId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (data.success) {
            showMessage('技师信息更新成功', 'success');
            closeEditTherapistModal();
            loadTherapists();
        } else {
            showMessage(data.error.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('更新技师失败:', error);
        showMessage('更新失败，请稍后重试', 'error');
    }
}

// 删除技师
async function deleteTherapist(id) {
    if (!confirm('确定要删除这位技师吗？')) {
        return;
    }
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/therapists/${id}`, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showMessage('技师已删除', 'success');
            loadTherapists();
        } else {
            showMessage(data.error.message || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除技师失败:', error);
        showMessage('删除失败，请稍后重试', 'error');
    }
}

// 加载预约列表
async function loadAppointments() {
    const date = document.getElementById('filterDate').value;
    const status = document.getElementById('filterStatus').value;
    
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/appointments?${params}`);
        
        if (data.success) {
            const tbody = document.getElementById('appointmentTableBody');
            tbody.innerHTML = '';
            
            data.data.appointments.forEach(appointment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${appointment.appointment_date} ${appointment.start_time}</td>
                    <td>${appointment.user_name}</td>
                    <td>${appointment.user_phone || '-'}</td>
                    <td>${appointment.therapist_name}</td>
                    <td>${appointment.store_name}</td>
                    <td><span class="appointment-status status-${appointment.status}">${getStatusText(appointment.status)}</span></td>
                    <td class="action-buttons">
                        ${appointment.status === 'pending' ? 
                            `<button class="btn btn-sm btn-confirm" onclick="updateAppointmentStatus(${appointment.id}, 'confirmed')">确认</button>` : ''}
                        ${appointment.status === 'confirmed' ? 
                            `<button class="btn btn-sm btn-confirm" onclick="updateAppointmentStatus(${appointment.id}, 'completed')">完成</button>` : ''}
                        ${['pending', 'confirmed'].includes(appointment.status) ? 
                            `<button class="btn btn-sm btn-delete" onclick="updateAppointmentStatus(${appointment.id}, 'cancelled')">取消</button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载预约列表失败:', error);
    }
}

// 更新预约状态
async function updateAppointmentStatus(id, status) {
    const confirmMessages = {
        'confirmed': '确定要确认这个预约吗？',
        'completed': '确定要将这个预约标记为已完成吗？',
        'cancelled': '确定要取消这个预约吗？'
    };
    
    if (!confirm(confirmMessages[status])) {
        return;
    }
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/appointments/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (data.success) {
            showMessage('状态更新成功', 'success');
            loadAppointments();
        } else {
            showMessage(data.error.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('更新预约状态失败:', error);
        showMessage('更新失败，请稍后重试', 'error');
    }
}

// 加载门店列表
async function loadStores() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores`);
        
        if (data.success) {
            const storesList = document.getElementById('storesList');
            storesList.innerHTML = '<div class="store-grid">' + 
                data.data.stores.map(store => `
                    <div class="store-card">
                        <h3>${store.name}</h3>
                        <div class="store-info">
                            <p>地址：${store.address || '未设置'}</p>
                            <p>电话：${store.phone || '未设置'}</p>
                            <p>营业时间：${store.business_hours}</p>
                            <p>技师数量：${store.therapist_count}人</p>
                        </div>
                    </div>
                `).join('') + '</div>';
        }
    } catch (error) {
        console.error('加载门店列表失败:', error);
    }
}

// 初始化统计
function initStatistics() {
    // 设置默认日期范围（最近7天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    
    document.getElementById('statsStartDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('statsEndDate').value = endDate.toISOString().split('T')[0];
    
    loadStatistics();
}

// 加载统计数据
async function loadStatistics() {
    const startDate = document.getElementById('statsStartDate').value;
    const endDate = document.getElementById('statsEndDate').value;
    
    if (!startDate || !endDate) {
        showMessage('请选择日期范围', 'error');
        return;
    }
    
    try {
        const [appointmentStats, therapistStats] = await Promise.all([
            apiRequest(`${API_BASE_URL}/statistics/appointments?start_date=${startDate}&end_date=${endDate}`),
            apiRequest(`${API_BASE_URL}/statistics/therapists?start_date=${startDate}&end_date=${endDate}`)
        ]);
        
        const content = document.getElementById('statisticsContent');
        
        // 预约统计
        const appointmentSummary = appointmentStats.data.statistics.totals;
        
        // 技师工作量前5
        const topTherapists = therapistStats.data.statistics.slice(0, 5);
        
        content.innerHTML = `
            <div class="statistics-summary">
                <h3>预约统计</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">总预约数</div>
                        <div class="summary-value">${appointmentSummary.total_appointments}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">已完成</div>
                        <div class="summary-value">${appointmentSummary.completed_appointments}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">已取消</div>
                        <div class="summary-value">${appointmentSummary.cancelled_appointments}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">完成率</div>
                        <div class="summary-value">${appointmentSummary.completion_rate}</div>
                    </div>
                </div>
            </div>
            
            <div class="statistics-summary">
                <h3>技师工作量TOP5</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>技师</th>
                            <th>门店</th>
                            <th>总预约</th>
                            <th>已完成</th>
                            <th>完成率</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topTherapists.map(t => `
                            <tr>
                                <td>${t.name}</td>
                                <td>${t.store_name}</td>
                                <td>${t.total_appointments}</td>
                                <td>${t.completed_appointments}</td>
                                <td>${t.total_appointments > 0 ? 
                                    Math.round(t.completed_appointments / t.total_appointments * 100) + '%' : 
                                    '0%'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showMessage('加载统计数据失败', 'error');
    }
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待确认',
        'confirmed': '已确认',
        'cancelled': '已取消',
        'completed': '已完成',
        'no_show': '未到店'
    };
    return statusMap[status] || status;
}