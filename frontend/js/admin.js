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
    
    // 设置门店表单事件
    document.getElementById('addStoreForm').onsubmit = handleAddStore;
    document.getElementById('editStoreForm').onsubmit = handleEditStore;
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
    
    // 找到对应的菜单项并激活
    const targetMenuItem = document.querySelector(`.menu a[onclick*="${section}"]`);
    if (targetMenuItem) {
        targetMenuItem.classList.add('active');
    }
    
    // 显示选中的区域
    const targetSection = document.getElementById(`${section}Section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // TODO: 更新URL hash来记住当前页面 ✓
    window.location.hash = section;
    
    // 加载对应的数据
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'members':
            // 会员管理页面，不需要预加载数据
            break;
        case 'medical':
            // 病历管理页面，不需要预加载数据
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

// TODO: 页面加载时检查URL hash并显示对应页面 ✓
function initializePage() {
    // 从URL hash获取当前应该显示的页面
    const hash = window.location.hash.substring(1); // 去掉 # 号
    const validSections = ['dashboard', 'members', 'medical', 'therapists', 'appointments', 'stores', 'statistics'];
    
    // 如果hash有效，显示对应页面，否则显示默认的数据概览页面
    const currentSection = validSections.includes(hash) ? hash : 'dashboard';
    
    showSection(currentSection);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // 监听浏览器前进后退按钮
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.substring(1);
        const validSections = ['dashboard', 'members', 'medical', 'therapists', 'appointments', 'stores', 'statistics'];
        
        if (validSections.includes(hash)) {
            showSection(hash);
        }
    });
});

// 修改菜单链接的点击处理，防止默认行为
function handleMenuClick(event, section) {
    event.preventDefault();
    showSection(section);
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
    try {
        showLoading('正在加载技师列表...');
        
        const data = await apiRequest(`${API_BASE_URL}/therapists`);
        
        if (data.success) {
            const therapists = data.data?.therapists || [];
            const therapistsList = document.getElementById('therapistsList');
            
            if (therapists.length === 0) {
                therapistsList.innerHTML = `
                    <div class="empty-state">
                        <h3>👨‍⚕️ 暂无技师</h3>
                        <p>点击"新增技师"按钮添加第一位技师</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            
            therapistsList.innerHTML = therapists.map(therapist => `
                <div class="therapist-card elderly-friendly">
                    <div class="therapist-header">
                        <div class="therapist-name-section">
                            <h3 class="therapist-name">👤 ${therapist.name}</h3>
                            <span class="therapist-position">${getPositionIcon(therapist.position)} ${therapist.position}</span>
                        </div>
                        <span class="therapist-status-badge status-${therapist.status || 'active'}">${getTherapistStatusText(therapist.status || 'active')}</span>
                    </div>
                    <div class="therapist-info">
                        <div class="info-item">
                            <span class="info-label">🏪 所属门店：</span>
                            <span class="info-value">${therapist.store_name || '未设置'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📅 从业年限：</span>
                            <span class="info-value">${therapist.experience_years || therapist.years_of_experience || 0}年</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">💪 专业技能：</span>
                            <span class="info-value">${Array.isArray(therapist.specialties) ? therapist.specialties.join('、') : (therapist.specialties || '未设置')}</span>
                        </div>
                        ${therapist.phone ? `
                        <div class="info-item">
                            <span class="info-label">📞 联系电话：</span>
                            <span class="info-value">${therapist.phone}</span>
                        </div>
                        ` : ''}
                        ${therapist.honors ? `
                        <div class="info-item">
                            <span class="info-label">🏆 荣誉称号：</span>
                            <span class="info-value">${therapist.honors}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="therapist-actions">
                        <button class="btn btn-primary btn-large" onclick="editTherapist(${therapist.id})">✏️ 编辑</button>
                        <button class="btn btn-info btn-large" onclick="viewTherapistAppointments(${therapist.id})">📅 预约记录</button>
                        <button class="btn btn-warning btn-large" onclick="viewTherapistStats(${therapist.id})">📊 工作统计</button>
                        <button class="btn btn-danger btn-large" onclick="deleteTherapist(${therapist.id})">🗑️ 删除</button>
                    </div>
                </div>
            `).join('');
            
            // 加载门店列表到筛选器
            loadStoresForTherapistFilter();
            
            showMessage(`✅ 成功加载 ${therapists.length} 位技师`, 'success');
        } else {
            showMessage('❌ 加载技师列表失败', 'error');
        }
    } catch (error) {
        console.error('加载技师列表失败:', error);
        showMessage('❌ 加载技师列表失败，请稍后重试', 'error');
    } finally {
        hideLoading();
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
    try {
        showLoading('正在加载预约列表...');
        
        // 使用正确的API路径
        const data = await apiRequest(`${API_BASE_URL}/appointments`);
        
        if (data.success) {
            const appointments = data.data?.appointments || [];
            const appointmentsList = document.getElementById('appointmentsList');
            
            if (appointments.length === 0) {
                appointmentsList.innerHTML = `
                    <div class="empty-state">
                        <h3>📅 暂无预约</h3>
                        <p>点击"新增预约"按钮添加第一个预约</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            
            appointmentsList.innerHTML = appointments.map(appointment => `
                <div class="appointment-container">
                    <div class="appointment-card elderly-friendly">
                        <div class="appointment-header">
                            <div class="appointment-time">
                                <span class="appointment-date">📅 ${appointment.appointment_date}</span>
                                <span class="appointment-time-slot">🕐 ${appointment.start_time}${appointment.end_time ? ` - ${appointment.end_time}` : ''}</span>
                            </div>
                            <span class="appointment-status-badge status-${appointment.status}">${getAppointmentStatusText(appointment.status)}</span>
                        </div>
                    <div class="appointment-info">
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-icon">👤</div>
                                <div class="info-content">
                                    <div class="info-label">客户</div>
                                    <div class="info-value">${appointment.user_name || appointment.customer_name || '未知'}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">📞</div>
                                <div class="info-content">
                                    <div class="info-label">电话</div>
                                    <div class="info-value">${appointment.user_phone || appointment.customer_phone || '未设置'}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">👨‍⚕️</div>
                                <div class="info-content">
                                    <div class="info-label">技师</div>
                                    <div class="info-value">${appointment.therapist_name || '未分配'}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">🏪</div>
                                <div class="info-content">
                                    <div class="info-label">门店</div>
                                    <div class="info-value">${appointment.store_name || '未设置'}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">💆</div>
                                <div class="info-content">
                                    <div class="info-label">服务</div>
                                    <div class="info-value">${appointment.service_type || '未设置'}</div>
                                </div>
                            </div>
                            ${appointment.notes ? `
                            <div class="info-card info-card-full">
                                <div class="info-icon">📝</div>
                                <div class="info-content">
                                    <div class="info-label">备注</div>
                                    <div class="info-value">${appointment.notes}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                        <div class="appointment-actions">
                            <button class="btn btn-primary btn-large" onclick="editAppointment(${appointment.id})">✏️ 编辑</button>
                            ${appointment.status === 'pending' ? 
                                `<button class="btn btn-success btn-large" onclick="updateAppointmentStatus(${appointment.id}, 'confirmed')">✅ 确认</button>` : ''}
                            ${appointment.status === 'confirmed' ? 
                                `<button class="btn btn-success btn-large" onclick="updateAppointmentStatus(${appointment.id}, 'completed')">✨ 完成</button>` : ''}
                            ${['pending', 'confirmed'].includes(appointment.status) ? 
                                `<button class="btn btn-danger btn-large" onclick="updateAppointmentStatus(${appointment.id}, 'cancelled')">❌ 取消</button>` : ''}
                            <button class="btn btn-info btn-large" onclick="viewAppointmentDetails(${appointment.id})">👁️ 详情</button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            showMessage(`✅ 成功加载 ${appointments.length} 个预约`, 'success');
        } else {
            showMessage('❌ 加载预约列表失败', 'error');
        }
    } catch (error) {
        console.error('加载预约列表失败:', error);
        showMessage('❌ 加载预约列表失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 搜索预约
function searchAppointments() {
    const dateFilter = document.getElementById('appointmentDateFilter').value;
    const statusFilter = document.getElementById('appointmentStatusFilter').value;
    const searchTerm = document.getElementById('appointmentSearchInput').value.toLowerCase().trim();
    
    const appointmentCards = document.querySelectorAll('.appointment-container');
    let visibleCount = 0;
    
    appointmentCards.forEach(card => {
        let shouldShow = true;
        
        // 日期筛选
        if (dateFilter) {
            const appointmentDate = card.querySelector('.appointment-date').textContent.replace('📅 ', '');
            if (appointmentDate !== dateFilter) {
                shouldShow = false;
            }
        }
        
        // 状态筛选
        if (statusFilter && shouldShow) {
            const statusBadge = card.querySelector('.appointment-status-badge');
            if (!statusBadge.classList.contains(`status-${statusFilter}`)) {
                shouldShow = false;
            }
        }
        
        // 搜索词筛选
        if (searchTerm && shouldShow) {
            const cardText = card.textContent.toLowerCase();
            if (!cardText.includes(searchTerm)) {
                shouldShow = false;
            }
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (visibleCount === 0) {
        showMessage('❌ 未找到匹配的预约', 'warning');
    } else {
        showMessage(`🔍 找到 ${visibleCount} 个匹配的预约`, 'success');
    }
}

// 更新预约状态
async function updateAppointmentStatus(id, status) {
    const confirmMessages = {
        'confirmed': '✅ 确定要确认这个预约吗？',
        'completed': '✨ 确定要将这个预约标记为已完成吗？',
        'cancelled': '❌ 确定要取消这个预约吗？'
    };
    
    if (!confirm(confirmMessages[status])) {
        return;
    }
    
    try {
        showLoading('正在更新预约状态...');
        
        const data = await apiRequest(`${API_BASE_URL}/appointments/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (data.success) {
            showMessage('✅ 状态更新成功', 'success');
            loadAppointments();
        } else {
            showMessage(data.error?.message || '❌ 更新失败', 'error');
        }
    } catch (error) {
        console.error('更新预约状态失败:', error);
        showMessage('❌ 更新失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 打开新增预约模态框
function openAddAppointmentModal() {
    document.getElementById('addAppointmentModal').style.display = 'block';
    loadStoresForAppointment();
    
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').value = today;
}

// 关闭新增预约模态框
function closeAddAppointmentModal() {
    document.getElementById('addAppointmentModal').style.display = 'none';
    document.getElementById('addAppointmentForm').reset();
}

// 为预约加载门店列表
async function loadStoresForAppointment() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores`);
        if (data.success) {
            const stores = data.data?.stores || [];
            const storeSelect = document.getElementById('appointmentStore');
            
            storeSelect.innerHTML = '<option value="">请选择门店</option>';
            stores.forEach(store => {
                storeSelect.innerHTML += `<option value="${store.id}">${store.name}</option>`;
            });
        }
    } catch (error) {
        console.error('加载门店列表失败:', error);
    }
}

// 为预约加载门店技师
async function loadStoreTherapistsForAppointment() {
    const storeId = document.getElementById('appointmentStore').value;
    const therapistSelect = document.getElementById('appointmentTherapist');
    
    therapistSelect.innerHTML = '<option value="">请先选择门店</option>';
    
    if (!storeId) return;
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/therapists?store_id=${storeId}`);
        if (data.success) {
            const therapists = data.data?.therapists || [];
            
            therapistSelect.innerHTML = '<option value="">请选择技师</option>';
            therapists.forEach(therapist => {
                therapistSelect.innerHTML += `<option value="${therapist.id}">${therapist.name} - ${therapist.title || therapist.position || '技师'}</option>`;
            });
        }
    } catch (error) {
        console.error('加载技师列表失败:', error);
    }
}

// 编辑预约
async function editAppointment(id) {
    try {
        const data = await apiRequest(`${API_BASE_URL}/appointments/${id}`);
        if (data.success) {
            const appointment = data.data?.appointment;
            
            // 填充编辑表单
            document.getElementById('editAppointmentId').value = appointment.id;
            document.getElementById('editAppointmentCustomerName').value = appointment.user_name || appointment.customer_name || '';
            document.getElementById('editAppointmentCustomerPhone').value = appointment.user_phone || appointment.customer_phone || '';
            document.getElementById('editAppointmentDate').value = appointment.appointment_date;
            document.getElementById('editAppointmentTime').value = appointment.start_time;
            document.getElementById('editAppointmentService').value = appointment.service_type || '';
            document.getElementById('editAppointmentStatus').value = appointment.status;
            document.getElementById('editAppointmentNotes').value = appointment.notes || '';
            
            // 显示编辑模态框
            document.getElementById('editAppointmentModal').style.display = 'block';
        }
    } catch (error) {
        console.error('获取预约详情失败:', error);
        showMessage('❌ 获取预约详情失败', 'error');
    }
}

// 关闭编辑预约模态框
function closeEditAppointmentModal() {
    document.getElementById('editAppointmentModal').style.display = 'none';
    document.getElementById('editAppointmentForm').reset();
}

// 查看预约详情
function viewAppointmentDetails(id) {
    showMessage('👁️ 预约详情功能开发中...', 'info');
    // TODO: 实现预约详情功能
}

// 显示预约统计
function showAppointmentStats() {
    document.getElementById('appointmentStatsModal').style.display = 'block';
    loadAppointmentStats();
}

// 关闭预约统计模态框
function closeAppointmentStatsModal() {
    document.getElementById('appointmentStatsModal').style.display = 'none';
}

// 加载预约统计
async function loadAppointmentStats() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/appointments`);
        if (data.success) {
            const appointments = data.data?.appointments || [];
            
            // 统计各种状态的预约数量
            const stats = {
                total: appointments.length,
                pending: appointments.filter(a => a.status === 'pending').length,
                confirmed: appointments.filter(a => a.status === 'confirmed').length,
                completed: appointments.filter(a => a.status === 'completed').length,
                cancelled: appointments.filter(a => a.status === 'cancelled').length
            };
            
            // 今日预约统计
            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = appointments.filter(a => a.appointment_date === today);
            
            document.getElementById('appointmentStatsContent').innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>📊 总预约数</h3>
                        <div class="stat-value">${stats.total}</div>
                    </div>
                    <div class="stat-card">
                        <h3>⏳ 待确认</h3>
                        <div class="stat-value">${stats.pending}</div>
                    </div>
                    <div class="stat-card">
                        <h3>✅ 已确认</h3>
                        <div class="stat-value">${stats.confirmed}</div>
                    </div>
                    <div class="stat-card">
                        <h3>✨ 已完成</h3>
                        <div class="stat-value">${stats.completed}</div>
                    </div>
                    <div class="stat-card">
                        <h3>❌ 已取消</h3>
                        <div class="stat-value">${stats.cancelled}</div>
                    </div>
                    <div class="stat-card">
                        <h3>📅 今日预约</h3>
                        <div class="stat-value">${todayAppointments.length}</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载预约统计失败:', error);
        document.getElementById('appointmentStatsContent').innerHTML = '<p>❌ 加载统计数据失败</p>';
    }
}

// 获取预约状态文本
function getAppointmentStatusText(status) {
    const statusMap = {
        'pending': '⏳ 待确认',
        'confirmed': '✅ 已确认',
        'completed': '✨ 已完成',
        'cancelled': '❌ 已取消'
    };
    return statusMap[status] || status;
}

// 搜索技师
function searchTherapists() {
    const storeFilter = document.getElementById('therapistStoreFilter').value;
    const positionFilter = document.getElementById('therapistPositionFilter').value;
    const searchTerm = document.getElementById('therapistSearchInput').value.toLowerCase().trim();
    
    const therapistCards = document.querySelectorAll('.therapist-card');
    let visibleCount = 0;
    
    therapistCards.forEach(card => {
        let shouldShow = true;
        
        // 门店筛选
        if (storeFilter && shouldShow) {
            const storeName = card.querySelector('.info-value').textContent.toLowerCase();
            if (!storeName.includes(storeFilter.toLowerCase())) {
                shouldShow = false;
            }
        }
        
        // 职位筛选
        if (positionFilter && shouldShow) {
            const positionElement = card.querySelector('.therapist-position');
            if (!positionElement.textContent.includes(positionFilter)) {
                shouldShow = false;
            }
        }
        
        // 搜索词筛选
        if (searchTerm && shouldShow) {
            const cardText = card.textContent.toLowerCase();
            if (!cardText.includes(searchTerm)) {
                shouldShow = false;
            }
        }
        
        if (shouldShow) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (visibleCount === 0) {
        showMessage('❌ 未找到匹配的技师', 'warning');
    } else {
        showMessage(`🔍 找到 ${visibleCount} 位匹配的技师`, 'success');
    }
}

// 为技师筛选器加载门店列表
async function loadStoresForTherapistFilter() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores`);
        if (data.success) {
            const stores = data.data?.stores || [];
            const storeSelect = document.getElementById('therapistStoreFilter');
            
            // 保留原有的"所有门店"选项
            const currentValue = storeSelect.value;
            storeSelect.innerHTML = '<option value="">🔍 所有门店</option>';
            
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.name;
                option.textContent = store.name;
                storeSelect.appendChild(option);
            });
            
            // 恢复之前的选择
            storeSelect.value = currentValue;
        }
    } catch (error) {
        console.error('加载门店列表失败:', error);
    }
}

// 获取职位图标
function getPositionIcon(position) {
    const iconMap = {
        '调理师': '👨‍⚕️',
        '推拿师': '🤲',
        '艾灸师': '🔥',
        '专家医师': '👨‍⚕️',
        '健康管理师': '📋',
        '按摩师': '💆‍♂️'
    };
    return iconMap[position] || '👨‍⚕️';
}

// 获取技师状态文本
function getTherapistStatusText(status) {
    const statusMap = {
        'active': '✅ 在职',
        'inactive': '❌ 离职',
        'on_leave': '🏖️ 请假'
    };
    return statusMap[status] || '✅ 在职';
}

// 查看技师预约记录
function viewTherapistAppointments(therapistId) {
    showMessage('📅 技师预约记录功能开发中...', 'info');
    // TODO: 实现技师预约记录功能
}

// 查看技师工作统计
function viewTherapistStats(therapistId) {
    showMessage('📊 技师工作统计功能开发中...', 'info');
    // TODO: 实现技师工作统计功能
}

// 显示技师统计
function showTherapistStats() {
    document.getElementById('therapistStatsModal').style.display = 'block';
    loadTherapistStats();
}

// 关闭技师统计模态框
function closeTherapistStatsModal() {
    document.getElementById('therapistStatsModal').style.display = 'none';
}

// 加载技师统计
async function loadTherapistStats() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/therapists`);
        if (data.success) {
            const therapists = data.data?.therapists || [];
            
            // 统计各种职位的技师数量
            const positionStats = {};
            const storeStats = {};
            let totalExperience = 0;
            
            therapists.forEach(therapist => {
                // 职位统计
                const position = therapist.position || '未知';
                positionStats[position] = (positionStats[position] || 0) + 1;
                
                // 门店统计
                const store = therapist.store_name || '未分配';
                storeStats[store] = (storeStats[store] || 0) + 1;
                
                // 经验统计
                totalExperience += (therapist.experience_years || therapist.years_of_experience || 0);
            });
            
            const avgExperience = therapists.length > 0 ? Math.round(totalExperience / therapists.length * 10) / 10 : 0;
            
            document.getElementById('therapistStatsContent').innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>👨‍⚕️ 技师总数</h3>
                        <div class="stat-value">${therapists.length}</div>
                    </div>
                    <div class="stat-card">
                        <h3>📅 平均经验</h3>
                        <div class="stat-value">${avgExperience}年</div>
                    </div>
                    <div class="stat-card">
                        <h3>✅ 在职技师</h3>
                        <div class="stat-value">${therapists.filter(t => (t.status || 'active') === 'active').length}</div>
                    </div>
                </div>
                
                <div class="stats-section">
                    <h3>👔 职位分布</h3>
                    <div class="stats-list">
                        ${Object.entries(positionStats).map(([position, count]) => `
                            <div class="stats-item">
                                <span>${getPositionIcon(position)} ${position}</span>
                                <span>${count}人</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="stats-section">
                    <h3>🏪 门店分布</h3>
                    <div class="stats-list">
                        ${Object.entries(storeStats).slice(0, 5).map(([store, count]) => `
                            <div class="stats-item">
                                <span>🏪 ${store}</span>
                                <span>${count}人</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载技师统计失败:', error);
        document.getElementById('therapistStatsContent').innerHTML = '<p>❌ 加载统计数据失败</p>';
    }
}

// 加载门店列表
async function loadStores() {
    try {
        showLoading('正在加载门店列表...');
        const data = await apiRequest(`${API_BASE_URL}/stores`);
        
        if (data.success) {
            const stores = data.data?.stores || data || [];
            const storesList = document.getElementById('storesList');
            
            if (stores.length === 0) {
                storesList.innerHTML = `
                    <div class="empty-state">
                        <h3>🏪 暂无门店</h3>
                        <p>点击"新增门店"按钮添加第一个门店</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            
            storesList.innerHTML = stores.map(store => `
                <div class="store-card elderly-friendly">
                    <div class="store-header">
                        <h3 class="store-name">🏪 ${store.name}</h3>
                        <span class="store-status-badge ${store.status || 'active'}">${getStoreStatusText(store.status || 'active')}</span>
                    </div>
                    <div class="store-info">
                        <div class="info-item">
                            <span class="info-label">📍 地址：</span>
                            <span class="info-value">${store.address || '未设置'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">📞 电话：</span>
                            <span class="info-value">${store.phone || '未设置'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">🕒 营业时间：</span>
                            <span class="info-value">${store.business_hours || '9:00-21:00'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">👨‍⚕️ 技师数量：</span>
                            <span class="info-value">${store.therapist_count || 0}人</span>
                        </div>
                        ${store.manager ? `
                        <div class="info-item">
                            <span class="info-label">👔 店长：</span>
                            <span class="info-value">${store.manager}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="store-actions">
                        <button class="btn btn-primary btn-large" onclick="editStore(${store.id})">✏️ 编辑</button>
                        <button class="btn btn-info btn-large" onclick="viewStoreTherapists(${store.id})">👥 查看技师</button>
                        <button class="btn btn-warning btn-large" onclick="viewStoreStats(${store.id})">📊 门店统计</button>
                    </div>
                </div>
            `).join('');
            
            showMessage(`✅ 成功加载 ${stores.length} 个门店`, 'success');
        } else {
            showMessage('❌ 加载门店列表失败', 'error');
        }
    } catch (error) {
        console.error('加载门店列表失败:', error);
        showMessage('❌ 加载门店列表失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 搜索门店
function searchStores() {
    const searchTerm = document.getElementById('storeSearchInput').value.toLowerCase().trim();
    const storeCards = document.querySelectorAll('.store-card');
    
    if (!searchTerm) {
        // 如果搜索框为空，显示所有门店
        storeCards.forEach(card => {
            card.style.display = 'block';
        });
        showMessage('🔍 显示所有门店', 'info');
        return;
    }
    
    let visibleCount = 0;
    storeCards.forEach(card => {
        const storeName = card.querySelector('.store-name').textContent.toLowerCase();
        const storeInfo = card.querySelector('.store-info').textContent.toLowerCase();
        
        if (storeName.includes(searchTerm) || storeInfo.includes(searchTerm)) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (visibleCount === 0) {
        showMessage('❌ 未找到匹配的门店', 'warning');
    } else {
        showMessage(`🔍 找到 ${visibleCount} 个匹配的门店`, 'success');
    }
}

// 显示加载状态
function showLoading(message = '加载中...') {
    // 可以在这里添加加载动画
    console.log('Loading:', message);
}

// 隐藏加载状态
function hideLoading() {
    // 隐藏加载动画
    console.log('Loading hidden');
}

// 查看门店统计
function viewStoreStats(storeId) {
    showMessage('📊 门店统计功能开发中...', 'info');
    // TODO: 实现门店统计功能
}

// 获取门店状态文本
function getStoreStatusText(status) {
    const statusMap = {
        'active': '营业中',
        'maintenance': '装修中',
        'closed': '已关闭'
    };
    return statusMap[status] || '营业中';
}

// 打开添加门店模态框
function openAddStoreModal() {
    document.getElementById('addStoreModal').style.display = 'block';
    document.getElementById('addStoreForm').reset();
    // 设置默认营业时间
    document.getElementById('storeHours').value = '9:00-21:00';
    showMessage('📝 请填写门店信息', 'info');
}

// 关闭添加门店模态框
function closeAddStoreModal() {
    document.getElementById('addStoreModal').style.display = 'none';
    document.getElementById('addStoreForm').reset();
}

// 处理添加门店
async function handleAddStore(e) {
    e.preventDefault();
    
    // 获取表单数据
    const storeName = document.getElementById('storeName').value.trim();
    const storeAddress = document.getElementById('storeAddress').value.trim();
    const storeHours = document.getElementById('storeHours').value.trim();
    
    // 基本验证
    if (!storeName) {
        showMessage('❌ 请输入门店名称', 'error');
        document.getElementById('storeName').focus();
        return;
    }
    
    if (!storeAddress) {
        showMessage('❌ 请输入门店地址', 'error');
        document.getElementById('storeAddress').focus();
        return;
    }
    
    if (!storeHours) {
        showMessage('❌ 请输入营业时间', 'error');
        document.getElementById('storeHours').focus();
        return;
    }
    
    const formData = {
        name: storeName,
        code: document.getElementById('storeCode').value.trim(),
        address: storeAddress,
        phone: document.getElementById('storePhone').value.trim(),
        manager: document.getElementById('storeManager').value.trim(),
        business_hours: storeHours,
        description: document.getElementById('storeDescription').value.trim()
    };
    
    try {
        showLoading('正在添加门店...');
        
        const data = await apiRequest(`${API_BASE_URL}/stores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (data.success) {
            showMessage('✅ 门店添加成功！', 'success');
            closeAddStoreModal();
            loadStores();
            loadStoresForFilter(); // 刷新筛选器
        } else {
            showMessage(`❌ 添加失败：${data.error?.message || '未知错误'}`, 'error');
        }
    } catch (error) {
        console.error('添加门店失败:', error);
        showMessage('❌ 添加失败，请检查网络连接后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 编辑门店
async function editStore(id) {
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores/${id}`);
        
        if (data.success) {
            const store = data.data.store;
            
            document.getElementById('editStoreId').value = store.id;
            document.getElementById('editStoreName').value = store.name;
            document.getElementById('editStoreCode').value = store.code || '';
            document.getElementById('editStoreAddress').value = store.address || '';
            document.getElementById('editStorePhone').value = store.phone || '';
            document.getElementById('editStoreManager').value = store.manager || '';
            document.getElementById('editStoreHours').value = store.business_hours;
            document.getElementById('editStoreDescription').value = store.description || '';
            document.getElementById('editStoreStatus').value = store.status || 'active';
            
            document.getElementById('editStoreModal').style.display = 'block';
        }
    } catch (error) {
        console.error('获取门店信息失败:', error);
        showMessage('获取门店信息失败', 'error');
    }
}

// 关闭编辑门店模态框
function closeEditStoreModal() {
    document.getElementById('editStoreModal').style.display = 'none';
    document.getElementById('editStoreForm').reset();
}

// 处理编辑门店
async function handleEditStore(e) {
    e.preventDefault();
    
    const storeId = document.getElementById('editStoreId').value;
    const formData = {
        name: document.getElementById('editStoreName').value,
        code: document.getElementById('editStoreCode').value,
        address: document.getElementById('editStoreAddress').value,
        phone: document.getElementById('editStorePhone').value,
        manager: document.getElementById('editStoreManager').value,
        business_hours: document.getElementById('editStoreHours').value,
        description: document.getElementById('editStoreDescription').value,
        status: document.getElementById('editStoreStatus').value
    };
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores/${storeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (data.success) {
            showMessage('门店信息更新成功', 'success');
            closeEditStoreModal();
            loadStores();
            loadStoresForFilter(); // 刷新筛选器
        } else {
            showMessage(data.error?.message || '更新失败', 'error');
        }
    } catch (error) {
        console.error('更新门店失败:', error);
        showMessage('更新失败，请稍后重试', 'error');
    }
}

// 删除门店
async function deleteStore(id) {
    if (!confirm('确定要删除这个门店吗？删除后不可恢复！')) {
        return;
    }
    
    try {
        const data = await apiRequest(`${API_BASE_URL}/stores/${id}`, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showMessage('门店已删除', 'success');
            loadStores();
            loadStoresForFilter(); // 刷新筛选器
        } else {
            showMessage(data.error?.message || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除门店失败:', error);
        showMessage('删除失败，请稍后重试', 'error');
    }
}

// 查看门店技师
function viewStoreTherapists(storeId) {
    showSection('therapists');
    // 设置门店筛选器
    document.getElementById('filterStore').value = storeId;
    loadTherapists();
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
        
        // TODO: 修复统计数据的空值处理 ✓
        // 预约统计 - 添加空值检查
        const appointmentSummary = appointmentStats?.data?.statistics?.totals || {
            total_appointments: 0,
            completed_appointments: 0,
            cancelled_appointments: 0,
            completion_rate: '0%'
        };
        
        // 技师工作量前5 - 添加空值检查
        const topTherapists = therapistStats?.data?.statistics?.slice(0, 5) || [];
        
        content.innerHTML = `
            <div class="statistics-summary">
                <h3>预约统计</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">总预约数</div>
                        <div class="summary-value">${appointmentSummary.total_appointments || 0}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">已完成</div>
                        <div class="summary-value">${appointmentSummary.completed_appointments || 0}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">已取消</div>
                        <div class="summary-value">${appointmentSummary.cancelled_appointments || 0}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">完成率</div>
                        <div class="summary-value">${appointmentSummary.completion_rate || '0%'}</div>
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
                        ${topTherapists.length > 0 ? topTherapists.map(t => `
                            <tr>
                                <td>${t.name || '-'}</td>
                                <td>${t.store_name || '-'}</td>
                                <td>${t.total_appointments || 0}</td>
                                <td>${t.completed_appointments || 0}</td>
                                <td>${(t.total_appointments || 0) > 0 ? 
                                    Math.round((t.completed_appointments || 0) / (t.total_appointments || 1) * 100) + '%' : 
                                    '0%'}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="5" style="text-align: center; color: #666;">暂无数据</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('加载统计数据失败:', error);
        showMessage('加载统计数据失败', 'error');
        
        // TODO: 显示错误状态的统计界面 ✓
        const content = document.getElementById('statisticsContent');
        content.innerHTML = `
            <div class="statistics-summary">
                <h3>预约统计</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">总预约数</div>
                        <div class="summary-value">-</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">已完成</div>
                        <div class="summary-value">-</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">已取消</div>
                        <div class="summary-value">-</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">完成率</div>
                        <div class="summary-value">-</div>
                    </div>
                </div>
                <p style="text-align: center; color: #666; margin-top: 20px;">
                    数据加载失败，请检查网络连接或稍后重试
                </p>
            </div>
        `;
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