// API基础URL
const API_BASE_URL = '/api/v1/client';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('名医堂 3.0 初始化...');
    
    // 加载门店数据
    loadStores();
    
    // 设置日期限制
    const today = new Date().toISOString().split('T')[0];
    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        appointmentDateInput.min = today;
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        appointmentDateInput.max = maxDate.toISOString().split('T')[0];
    }
    
    // 默认显示门店页面
    showStores();
});

// 显示门店页面
function showStores() {
    hideAllSections();
    document.getElementById('storesSection').style.display = 'block';
}

// 显示技师页面
function showTherapists() {
    hideAllSections();
    document.getElementById('therapistsSection').style.display = 'block';
    loadRecommendedTherapists();
}

// 显示预约页面
function showAppointment() {
    hideAllSections();
    document.getElementById('appointmentSection').style.display = 'block';
}

// 隐藏所有页面
function hideAllSections() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
}

// 加载门店列表
async function loadStores() {
    try {
        console.log('正在加载门店列表...');
        const response = await fetch(`${API_BASE_URL}/stores`);
        const data = await response.json();
        
        if (data.success && data.data.stores) {
            console.log(`成功加载 ${data.data.stores.length} 家门店`);
            
            // 更新所有门店下拉框
            const selects = ['storeSelect', 'therapistStoreFilter', 'appointmentStore'];
            selects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    const defaultOption = select.querySelector('option');
                    select.innerHTML = '';
                    if (defaultOption) {
                        select.appendChild(defaultOption);
                    }
                    
                    data.data.stores.forEach(store => {
                        const option = document.createElement('option');
                        option.value = store.id;
                        option.textContent = store.name;
                        option.dataset.storeName = store.name;
                        select.appendChild(option);
                    });
                }
            });
        } else {
            console.error('加载门店失败:', data);
            showMessage('加载门店失败，请刷新页面重试', 'error');
        }
    } catch (error) {
        console.error('加载门店失败:', error);
        showMessage('网络错误，请检查连接', 'error');
    }
}

// 显示门店详情
function showStoreDetails() {
    const select = document.getElementById('storeSelect');
    const storeId = select.value;
    
    if (!storeId) {
        document.getElementById('storeDetails').innerHTML = '';
        document.getElementById('storeTherapists').innerHTML = '';
        return;
    }
    
    // 获取选中的门店名称
    const selectedOption = select.options[select.selectedIndex];
    const storeName = selectedOption.textContent;
    
    // 显示门店信息（这里可以扩展显示更多信息）
    document.getElementById('storeDetails').innerHTML = `
        <h3>${storeName}</h3>
        <p>门店ID: ${storeId}</p>
        <p>营业时间: 9:00 - 21:00</p>
    `;
}

// 显示门店技师
async function showStoreTherapists() {
    const storeId = document.getElementById('storeSelect').value;
    
    if (!storeId) {
        showMessage('请先选择门店', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/therapists/search?store_id=${storeId}`);
        const data = await response.json();
        
        if (data.success) {
            displayTherapists(data.data.therapists, 'storeTherapists');
            
            // 测试新API
            const selectedOption = document.getElementById('storeSelect').options[document.getElementById('storeSelect').selectedIndex];
            const storeName = selectedOption.dataset.storeName;
            if (storeName) {
                testNewAPI(storeName);
            }
        }
    } catch (error) {
        console.error('加载技师失败:', error);
        showMessage('加载技师失败', 'error');
    }
}

// 测试新的实验性API
async function testNewAPI(storeName) {
    try {
        console.log('测试新API:', storeName);
        const response = await fetch(`${API_BASE_URL}/stores/${encodeURIComponent(storeName)}/therapists-schedule`);
        const data = await response.json();
        
        if (data.success) {
            console.log('新API返回数据:', data.data);
        }
    } catch (error) {
        console.error('新API测试失败:', error);
    }
}

// 加载推荐技师
async function loadRecommendedTherapists() {
    try {
        const response = await fetch(`${API_BASE_URL}/therapists/search?limit=20`);
        const data = await response.json();
        
        if (data.success) {
            displayTherapists(data.data.therapists, 'therapistList');
        }
    } catch (error) {
        console.error('加载推荐技师失败:', error);
    }
}

// 搜索技师
async function searchTherapists() {
    const storeId = document.getElementById('therapistStoreFilter').value;
    const specialty = document.getElementById('specialtyInput').value;
    
    const params = new URLSearchParams();
    if (storeId) params.append('store_id', storeId);
    if (specialty) params.append('specialty', specialty);
    
    try {
        const response = await fetch(`${API_BASE_URL}/therapists/search?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayTherapists(data.data.therapists, 'therapistList');
        }
    } catch (error) {
        console.error('搜索技师失败:', error);
        showMessage('搜索失败，请稍后重试', 'error');
    }
}

// 显示技师列表
function displayTherapists(therapists, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!therapists || therapists.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">暂无技师数据</p>';
        return;
    }
    
    therapists.forEach(therapist => {
        const card = createTherapistCard(therapist);
        container.appendChild(card);
    });
}

// 创建技师卡片
function createTherapistCard(therapist) {
    const card = document.createElement('div');
    card.className = 'therapist-card';
    
    const specialties = therapist.specialties || [];
    const specialtiesTags = specialties.map(s => 
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
        <div class="therapist-store">${therapist.store ? therapist.store.name : '未知门店'}</div>
        <div class="therapist-specialties">${specialtiesTags}</div>
        <button class="btn btn-primary" onclick="selectTherapistForAppointment(${therapist.id}, '${therapist.name}')">
            选择预约
        </button>
    `;
    
    return card;
}

// 选择技师进行预约
function selectTherapistForAppointment(therapistId, therapistName) {
    showAppointment();
    
    // 获取技师所属门店
    fetch(`${API_BASE_URL}/therapists/search`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const therapist = data.data.therapists.find(t => t.id === therapistId);
                if (therapist && therapist.store) {
                    // 设置门店
                    document.getElementById('appointmentStore').value = therapist.store.id;
                    // 加载该门店的技师
                    loadStoreTherapists().then(() => {
                        // 设置技师
                        document.getElementById('appointmentTherapist').value = therapistId;
                    });
                }
            }
        });
}

// 加载门店的技师列表（用于预约表单）
async function loadStoreTherapists() {
    const storeId = document.getElementById('appointmentStore').value;
    const therapistSelect = document.getElementById('appointmentTherapist');
    
    if (!storeId) {
        therapistSelect.innerHTML = '<option value="">请先选择门店</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/therapists/search?store_id=${storeId}`);
        const data = await response.json();
        
        if (data.success) {
            therapistSelect.innerHTML = '<option value="">请选择技师</option>';
            data.data.therapists.forEach(therapist => {
                const option = document.createElement('option');
                option.value = therapist.id;
                option.textContent = `${therapist.name} - ${therapist.position} (${therapist.years_of_experience}年经验)`;
                therapistSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载技师失败:', error);
    }
}

// 提交预约
async function submitAppointment() {
    const therapistId = document.getElementById('appointmentTherapist').value;
    const userName = document.getElementById('userName').value;
    const userPhone = document.getElementById('userPhone').value;
    const appointmentDate = document.getElementById('appointmentDate').value;
    const appointmentTime = document.getElementById('appointmentTime').value;
    
    if (!therapistId || !userName || !userPhone || !appointmentDate || !appointmentTime) {
        showMessage('请填写所有必填项（包括手机号）', 'error');
        return;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(userPhone)) {
        showMessage('请输入有效的手机号码', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                therapist_id: parseInt(therapistId),
                user_name: userName,
                user_phone: userPhone,
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                notes: ''
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('预约成功！', 'success');
            // 清空表单
            document.getElementById('userName').value = '';
            document.getElementById('userPhone').value = '';
            document.getElementById('appointmentDate').value = '';
            document.getElementById('appointmentTime').value = '';
        } else {
            showMessage(data.error?.message || '预约失败', 'error');
        }
    } catch (error) {
        console.error('预约失败:', error);
        showMessage('网络错误，请稍后重试', 'error');
    }
}

// 显示消息
function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}