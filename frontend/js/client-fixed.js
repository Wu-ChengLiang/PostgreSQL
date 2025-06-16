// API基础URL
const API_BASE_URL = '/api/v1/client';

// 当前选中的技师
let selectedTherapist = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadStores();
    loadRecommendedTherapists();
    setupEventListeners();
    
    // 设置日期最小值为今天
    const today = new Date().toISOString().split('T')[0];
    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        appointmentDateInput.min = today;
        // 设置最大值为30天后
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        appointmentDateInput.max = maxDate.toISOString().split('T')[0];
    }
});

// 设置事件监听器
function setupEventListeners() {
    // 预约模态框
    const appointmentModal = document.getElementById('appointmentModal');
    const myAppointmentsModal = document.getElementById('myAppointmentsModal');
    const closeButtons = document.getElementsByClassName('close');
    
    // 关闭模态框
    Array.from(closeButtons).forEach(button => {
        button.onclick = function() {
            appointmentModal.style.display = 'none';
            myAppointmentsModal.style.display = 'none';
        }
    });
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        if (event.target == appointmentModal || event.target == myAppointmentsModal) {
            appointmentModal.style.display = 'none';
            myAppointmentsModal.style.display = 'none';
        }
    }
    
    // 预约表单提交
    document.getElementById('appointmentForm').onsubmit = handleAppointmentSubmit;
    
    // 日期改变时加载可用时间
    document.getElementById('appointmentDate').onchange = loadAvailableTimes;
    
    // 我的预约链接
    document.querySelector('a[href="#my-appointments"]').onclick = (e) => {
        e.preventDefault();
        myAppointmentsModal.style.display = 'block';
    };
}

// 加载门店列表
async function loadStores() {
    try {
        console.log('正在加载门店列表...');
        const response = await fetch(`${API_BASE_URL}/stores`);
        const data = await response.json();
        
        if (data.success) {
            const storeSelect = document.getElementById('storeSelect');
            storeSelect.innerHTML = '<option value="">选择门店</option>';
            
            data.data.stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = `${store.name} (${store.therapist_count}位技师)`;
                storeSelect.appendChild(option);
            });
            console.log(`成功加载 ${data.data.stores.length} 家门店`);
        } else {
            console.error('加载门店失败:', data);
        }
    } catch (error) {
        console.error('加载门店失败:', error);
        // 如果API失败，显示错误提示
        const storeSelect = document.getElementById('storeSelect');
        storeSelect.innerHTML = '<option value="">加载门店失败，请刷新页面重试</option>';
    }
}

// 加载推荐技师
async function loadRecommendedTherapists() {
    try {
        const response = await fetch(`${API_BASE_URL}/therapists/search?limit=6`);
        const data = await response.json();
        
        if (data.success) {
            displayTherapists(data.data.therapists);
        }
    } catch (error) {
        console.error('加载推荐技师失败:', error);
    }
}

// 搜索技师
async function searchTherapists() {
    const storeId = document.getElementById('storeSelect').value;
    const specialty = document.getElementById('specialtyInput').value;
    const minExperience = document.getElementById('experienceSelect').value;
    
    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId);
    if (specialty) params.append('specialty', specialty);
    if (minExperience) params.append('min_experience', minExperience);
    
    try {
        const response = await fetch(`${API_BASE_URL}/therapists/search?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayTherapists(data.data.therapists);
            document.getElementById('therapistTitle').textContent = 
                `搜索结果 (共 ${data.data.therapists.length} 位技师)`;
        }
    } catch (error) {
        console.error('搜索技师失败:', error);
        alert('搜索失败，请稍后重试');
    }
}

// 显示技师列表
function displayTherapists(therapists) {
    const therapistList = document.getElementById('therapistList');
    therapistList.innerHTML = '';
    
    if (therapists.length === 0) {
        therapistList.innerHTML = '<p style="text-align: center; color: #666;">暂无符合条件的技师</p>';
        return;
    }
    
    therapists.forEach(therapist => {
        const card = createTherapistCard(therapist);
        therapistList.appendChild(card);
    });
}

// 创建技师卡片
function createTherapistCard(therapist) {
    const card = document.createElement('div');
    card.className = 'therapist-card';
    
    const specialtiesTags = therapist.specialties.map(s => 
        `<span class="specialty-tag">${s}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="therapist-header">
            <div>
                <div class="therapist-name">${therapist.name}</div>
                <div class="therapist-position">${therapist.position}</div>
            </div>
            <div class="therapist-experience">${therapist.years_of_experience}年经验</div>
        </div>
        <div class="therapist-store">${therapist.store.name}</div>
        <div class="therapist-specialties">${specialtiesTags}</div>
        ${therapist.honors ? `<div class="therapist-honors">荣誉：${therapist.honors}</div>` : ''}
        <button class="btn book-btn" onclick="openAppointmentModal(${JSON.stringify(therapist).replace(/"/g, '&quot;')})">
            立即预约
        </button>
    `;
    
    return card;
}

// 打开预约模态框
function openAppointmentModal(therapist) {
    selectedTherapist = therapist;
    const modal = document.getElementById('appointmentModal');
    const therapistInfo = document.getElementById('selectedTherapist');
    
    therapistInfo.innerHTML = `
        <strong>${therapist.name}</strong> - ${therapist.position}<br>
        ${therapist.store.name}<br>
        从业${therapist.years_of_experience}年
    `;
    
    // 重置表单
    document.getElementById('appointmentForm').reset();
    
    // 初始化时间选择器
    const timeSelect = document.getElementById('appointmentTime');
    timeSelect.innerHTML = '<option value="">请先选择日期</option>';
    
    modal.style.display = 'block';
}

// 加载可用时间
async function loadAvailableTimes() {
    if (!selectedTherapist) return;
    
    const date = document.getElementById('appointmentDate').value;
    if (!date) return;
    
    const timeSelect = document.getElementById('appointmentTime');
    timeSelect.innerHTML = '<option value="">加载中...</option>';
    
    try {
        // 生成默认时间段（9:00-21:00）
        const defaultTimes = [];
        for (let hour = 9; hour < 21; hour++) {
            defaultTimes.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        
        // 尝试从API获取实际可用时间
        try {
            const response = await fetch(
                `${API_BASE_URL}/therapists/${selectedTherapist.id}/schedule?date=${date}`
            );
            const data = await response.json();
            
            if (data.success && data.data.schedule.available_times.length > 0) {
                // 使用API返回的时间
                updateTimeOptions(data.data.schedule.available_times);
            } else {
                // 使用默认时间
                updateTimeOptions(defaultTimes);
            }
        } catch (apiError) {
            console.error('获取排班信息失败，使用默认时间:', apiError);
            // API失败时使用默认时间
            updateTimeOptions(defaultTimes);
        }
    } catch (error) {
        console.error('加载可用时间失败:', error);
        timeSelect.innerHTML = '<option value="">加载失败，请重试</option>';
    }
}

// 更新时间选项
function updateTimeOptions(times) {
    const timeSelect = document.getElementById('appointmentTime');
    timeSelect.innerHTML = '';
    
    if (times.length === 0) {
        timeSelect.innerHTML = '<option value="">该日期已约满</option>';
    } else {
        timeSelect.innerHTML = '<option value="">请选择时间</option>';
        times.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }
}

// 处理预约表单提交
async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const formData = {
        therapist_id: selectedTherapist.id,
        user_name: document.getElementById('userName').value,
        user_phone: document.getElementById('userPhone').value,
        appointment_date: document.getElementById('appointmentDate').value,
        appointment_time: document.getElementById('appointmentTime').value,
        notes: document.getElementById('notes').value
    };
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.user_phone)) {
        alert('请输入正确的手机号码');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`预约成功！\n预约编号：${data.data.confirmation_code || '已生成'}\n请记住您的手机号以便查询预约`);
            document.getElementById('appointmentModal').style.display = 'none';
            // 重新加载技师列表以更新可用时间
            loadRecommendedTherapists();
        } else {
            alert(data.error.message || '预约失败，请稍后重试');
        }
    } catch (error) {
        console.error('预约失败:', error);
        alert('预约失败，请稍后重试');
    }
}

// 查询我的预约
async function queryMyAppointments() {
    const phone = document.getElementById('queryPhone').value;
    if (!phone) {
        alert('请输入手机号');
        return;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        alert('请输入正确的手机号码');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/user?phone=${phone}`);
        const data = await response.json();
        
        if (data.success) {
            displayAppointments(data.data.appointments);
        } else {
            alert(data.error.message || '查询失败');
        }
    } catch (error) {
        console.error('查询预约失败:', error);
        alert('查询失败，请稍后重试');
    }
}

// 显示预约列表
function displayAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    
    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<p style="text-align: center; color: #666;">暂无预约记录</p>';
        return;
    }
    
    appointmentsList.innerHTML = appointments.map(appointment => `
        <div class="appointment-item">
            <div class="appointment-header">
                <div>
                    <strong>${appointment.therapist.name}</strong> - ${appointment.therapist.position}<br>
                    ${appointment.store.name}
                </div>
                <span class="appointment-status status-${appointment.status}">${getStatusText(appointment.status)}</span>
            </div>
            <div>
                <strong>预约时间：</strong>${appointment.appointment_date} ${appointment.appointment_time}<br>
                ${appointment.notes ? `<strong>备注：</strong>${appointment.notes}<br>` : ''}
            </div>
            ${appointment.status === 'pending' || appointment.status === 'confirmed' ? 
                `<button class="btn cancel-btn" onclick="cancelAppointment(${appointment.id})">取消预约</button>` : ''}
        </div>
    `).join('');
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'pending': '待确认',
        'confirmed': '已确认',
        'cancelled': '已取消',
        'completed': '已完成'
    };
    return statusMap[status] || status;
}

// 取消预约
async function cancelAppointment(appointmentId) {
    if (!confirm('确定要取消这个预约吗？')) {
        return;
    }
    
    const phone = document.getElementById('queryPhone').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('预约已取消');
            queryMyAppointments(); // 重新加载预约列表
        } else {
            alert(data.error.message || '取消失败');
        }
    } catch (error) {
        console.error('取消预约失败:', error);
        alert('取消失败，请稍后重试');
    }
}