// 病历管理模块
class MedicalManagement {
    constructor() {
        this.currentPatient = null;
        this.token = localStorage.getItem('adminToken');
        this.baseUrl = '/api/v1/admin';
        this.initEventListeners();
        this.loadTherapists();
    }

    initEventListeners() {
        // 新增病历表单提交
        const addDiagnosisForm = document.getElementById('addDiagnosisForm');
        if (addDiagnosisForm) {
            addDiagnosisForm.addEventListener('submit', (e) => this.handleAddDiagnosis(e));
        }

        // 患者手机号输入框回车键搜索
        const patientPhoneInput = document.getElementById('patientPhoneSearch');
        if (patientPhoneInput) {
            patientPhoneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPatientHistory();
                }
            });
        }

        // 设置默认就诊日期为今天
        const visitDateInput = document.getElementById('diagnosisVisitDate');
        if (visitDateInput) {
            visitDateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    // 加载医师列表
    async loadTherapists() {
        try {
            const response = await fetch('/api/v1/therapists', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.populateTherapistSelect(data.therapists || []);
            }
        } catch (error) {
            console.error('加载医师列表失败:', error);
        }
    }

    // 填充医师选择框
    populateTherapistSelect(therapists) {
        const select = document.getElementById('diagnosisTherapist');
        if (!select) return;

        // 清空现有选项，保留默认选项
        select.innerHTML = '<option value="">请选择医师</option>';
        
        // 添加医师选项
        therapists.forEach(therapist => {
            const option = document.createElement('option');
            option.value = therapist.id;
            option.textContent = `${therapist.name} - ${therapist.position}`;
            select.appendChild(option);
        });
    }

    // 搜索患者病历
    async searchPatientHistory() {
        const phone = document.getElementById('patientPhoneSearch').value.trim();
        
        if (!phone) {
            this.showAlert('请输入患者手机号码', 'warning');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            this.showAlert('请输入正确的11位手机号码', 'warning');
            return;
        }

        try {
            this.showLoading('正在查询患者信息...');
            
            const response = await fetch(`${this.baseUrl}/patients/phone/${phone}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentPatient = data.patient;
                this.displayPatientInfo(data.patient);
                this.loadPatientHistory(phone);
            } else if (response.status === 404) {
                this.showAlert('未找到该患者的信息', 'info');
                this.hidePatientInfo();
                this.clearMedicalHistory();
            } else {
                throw new Error('查询失败');
            }
        } catch (error) {
            console.error('搜索患者失败:', error);
            this.showAlert('查询失败，请稍后重试', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 显示患者基本信息
    displayPatientInfo(patient) {
        const patientInfo = document.getElementById('patientInfo');
        
        patientInfo.innerHTML = `
            <div class="member-info-header">
                <div class="member-avatar">
                    ${patient.name.charAt(0)}
                </div>
                <div class="member-basic-info">
                    <h3>${patient.name}</h3>
                    <p class="member-phone">📱 ${patient.phone}</p>
                </div>
            </div>
            <div class="member-stats">
                <div class="stat-item">
                    <div class="stat-label">病历号</div>
                    <div class="stat-value">${patient.medical_record_number || '未分配'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">性别</div>
                    <div class="stat-value">${patient.gender === 'male' ? '男' : patient.gender === 'female' ? '女' : '未知'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">年龄</div>
                    <div class="stat-value">${patient.age || '未知'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">体质类型</div>
                    <div class="stat-value">${patient.constitution_type || '未评估'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">过敏史</div>
                    <div class="stat-value">${patient.allergies || '无'}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">注册时间</div>
                    <div class="stat-value">${new Date(patient.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        `;
        
        patientInfo.style.display = 'block';
    }

    // 隐藏患者信息
    hidePatientInfo() {
        const patientInfo = document.getElementById('patientInfo');
        patientInfo.style.display = 'none';
        this.currentPatient = null;
    }

    // 加载患者病历历史
    async loadPatientHistory(phone) {
        try {
            const response = await fetch(`${this.baseUrl}/patients/${phone}/history`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayMedicalHistory(data.records || []);
            } else {
                throw new Error('获取病历历史失败');
            }
        } catch (error) {
            console.error('获取病历历史失败:', error);
            this.showAlert('获取病历历史失败，请稍后重试', 'error');
        }
    }

    // 显示病历历史
    displayMedicalHistory(history) {
        const historyContainer = document.getElementById('medicalHistory');
        
        if (!history || history.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">暂无病历记录</div>
            `;
        } else {
            const historyItems = history.map(record => {
                return `
                    <div class="medical-record-item">
                        <div class="medical-record-header">
                            <div class="medical-record-date">
                                🏥 ${new Date(record.visit_date).toLocaleDateString()}
                            </div>
                            <div class="medical-record-id">
                                病历ID: ${record.id}
                            </div>
                        </div>
                        <div class="medical-record-content">
                            <div class="medical-field">
                                <div class="medical-field-label">主诉</div>
                                <div class="medical-field-value">${record.chief_complaint}</div>
                            </div>
                            <div class="medical-field">
                                <div class="medical-field-label">中医诊断</div>
                                <div class="medical-field-value">${record.tcm_diagnosis}</div>
                            </div>
                            <div class="medical-field">
                                <div class="medical-field-label">治疗方案</div>
                                <div class="medical-field-value">${record.treatment_plan}</div>
                            </div>
                            ${record.therapist_name ? `
                                <div class="medical-field">
                                    <div class="medical-field-label">主治医师</div>
                                    <div class="medical-field-value">${record.therapist_name}</div>
                                </div>
                            ` : ''}
                            ${record.notes ? `
                                <div class="medical-field">
                                    <div class="medical-field-label">备注</div>
                                    <div class="medical-field-value">${record.notes}</div>
                                </div>
                            ` : ''}
                            <div class="medical-field">
                                <div class="medical-field-label">记录时间</div>
                                <div class="medical-field-value">${new Date(record.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            historyContainer.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #333;">📋 病历记录 (共${history.length}条)</h3>
                ${historyItems}
            `;
        }
    }

    // 清空病历历史
    clearMedicalHistory() {
        const historyContainer = document.getElementById('medicalHistory');
        historyContainer.innerHTML = '';
    }

    // 打开新增病历模态框
    openAddDiagnosisModal() {
        const modal = document.getElementById('addDiagnosisModal');
        modal.style.display = 'block';
        
        // 清空表单
        document.getElementById('addDiagnosisForm').reset();
        
        // 设置默认日期
        document.getElementById('diagnosisVisitDate').value = new Date().toISOString().split('T')[0];
        
        // 如果当前有患者信息，自动填充手机号
        if (this.currentPatient) {
            document.getElementById('diagnosisPatientPhone').value = this.currentPatient.phone;
        }
    }

    // 关闭新增病历模态框
    closeAddDiagnosisModal() {
        const modal = document.getElementById('addDiagnosisModal');
        modal.style.display = 'none';
    }

    // 处理新增病历
    async handleAddDiagnosis(e) {
        e.preventDefault();
        
        const formData = {
            patient_phone: document.getElementById('diagnosisPatientPhone').value.trim(),
            visit_date: document.getElementById('diagnosisVisitDate').value,
            chief_complaint: document.getElementById('diagnosisComplaint').value.trim(),
            tcm_diagnosis: document.getElementById('diagnosisTcm').value.trim(),
            treatment_plan: document.getElementById('diagnosisTreatment').value.trim(),
            therapist_id: document.getElementById('diagnosisTherapist').value || null,
            notes: document.getElementById('diagnosisNotes').value.trim()
        };

        // 验证必填字段
        if (!formData.patient_phone || !formData.visit_date || !formData.chief_complaint || 
            !formData.tcm_diagnosis || !formData.treatment_plan) {
            this.showAlert('请填写所有必填字段', 'warning');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(formData.patient_phone)) {
            this.showAlert('请输入正确的11位手机号码', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.baseUrl}/patients/${formData.patient_phone}/diagnosis`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('病历添加成功！', 'success');
                this.closeAddDiagnosisModal();
                
                // 自动搜索刚添加病历的患者
                document.getElementById('patientPhoneSearch').value = formData.patient_phone;
                this.searchPatientHistory();
            } else {
                throw new Error(data.error?.message || '添加失败');
            }
        } catch (error) {
            console.error('添加病历失败:', error);
            this.showAlert(error.message || '添加失败，请稍后重试', 'error');
        }
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const patientInfo = document.getElementById('patientInfo');
        patientInfo.innerHTML = `<div class="loading">${message}</div>`;
        patientInfo.style.display = 'block';
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
let medicalManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    medicalManager = new MedicalManagement();
});

// 全局函数
function openAddDiagnosisModal() {
    medicalManager.openAddDiagnosisModal();
}

function closeAddDiagnosisModal() {
    medicalManager.closeAddDiagnosisModal();
}

function searchPatientHistory() {
    medicalManager.searchPatientHistory();
}