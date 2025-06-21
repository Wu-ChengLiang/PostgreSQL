const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库连接
const dbPath = path.join(process.cwd(), 'mingyi.db');

class MedicalService {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    // 通过手机号查询患者病历信息
    async getPatientByPhone(phone) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, name, phone, gender, age, 
                       medical_record_number, constitution_type, allergies,
                       emergency_contact_name, emergency_contact_phone,
                       created_at, updated_at
                FROM users 
                WHERE phone = ?
            `;
            
            this.db.get(sql, [phone], (err, row) => {
                if (err) {
                    reject(new Error(`查询患者失败: ${err.message}`));
                    return;
                }
                
                if (!row) {
                    reject(new Error('患者不存在'));
                    return;
                }
                
                resolve(row);
            });
        });
    }

    // 添加诊断记录
    async addDiagnosisRecord(phone, diagnosisData) {
        return new Promise((resolve, reject) => {
            const { 
                visit_date, 
                chief_complaint, 
                tcm_diagnosis, 
                treatment_plan, 
                therapist_id, 
                next_visit_date,
                notes 
            } = diagnosisData;
            
            // 首先检查患者是否存在
            this.db.get('SELECT id FROM users WHERE phone = ?', [phone], (err, user) => {
                if (err) {
                    reject(new Error(`查询患者失败: ${err.message}`));
                    return;
                }
                
                if (!user) {
                    reject(new Error('患者不存在'));
                    return;
                }
                
                // 添加诊断记录
                const sql = `
                    INSERT INTO diagnosis_records 
                    (patient_phone, visit_date, chief_complaint, tcm_diagnosis, 
                     treatment_plan, therapist_id, next_visit_date, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                this.db.run(sql, [
                    phone, visit_date, chief_complaint, tcm_diagnosis,
                    treatment_plan, therapist_id, next_visit_date, notes
                ], function(err) {
                    if (err) {
                        reject(new Error(`添加诊断记录失败: ${err.message}`));
                        return;
                    }
                    
                    resolve({
                        id: this.lastID,
                        patient_phone: phone,
                        visit_date,
                        chief_complaint,
                        tcm_diagnosis,
                        treatment_plan,
                        therapist_id,
                        next_visit_date,
                        notes
                    });
                });
            });
        });
    }

    // 获取患者诊断历史
    async getDiagnosisHistory(phone, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT dr.id, dr.visit_date, dr.chief_complaint, dr.tcm_diagnosis,
                       dr.treatment_plan, dr.next_visit_date, dr.notes, dr.created_at,
                       t.name as therapist_name
                FROM diagnosis_records dr
                LEFT JOIN therapists t ON dr.therapist_id = t.id
                WHERE dr.patient_phone = ?
                ORDER BY dr.visit_date DESC, dr.created_at DESC
                LIMIT ?
            `;
            
            this.db.all(sql, [phone, limit], (err, rows) => {
                if (err) {
                    reject(new Error(`查询诊断记录失败: ${err.message}`));
                    return;
                }
                
                resolve(rows || []);
            });
        });
    }

    // 更新患者基本信息
    async updatePatientInfo(phone, updateData) {
        return new Promise((resolve, reject) => {
            const allowedFields = [
                'constitution_type', 'allergies', 'emergency_contact_name', 
                'emergency_contact_phone'
            ];
            
            const updateFields = [];
            const updateValues = [];
            
            // 构建更新字段
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }
            
            if (updateFields.length === 0) {
                reject(new Error('没有有效的更新字段'));
                return;
            }
            
            updateValues.push(phone); // WHERE 条件的参数
            
            const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE phone = ?`;
            
            this.db.run(sql, updateValues, function(err) {
                if (err) {
                    reject(new Error(`更新患者信息失败: ${err.message}`));
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('患者不存在'));
                    return;
                }
                
                resolve({ success: true, changes: this.changes });
            });
        });
    }

    // 获取诊断记录详情
    async getDiagnosisRecordDetail(recordId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT dr.*, 
                       u.name as patient_name, u.phone as patient_phone,
                       t.name as therapist_name, t.position as therapist_position
                FROM diagnosis_records dr
                JOIN users u ON dr.patient_phone = u.phone
                LEFT JOIN therapists t ON dr.therapist_id = t.id
                WHERE dr.id = ?
            `;
            
            this.db.get(sql, [recordId], (err, row) => {
                if (err) {
                    reject(new Error(`查询诊断记录详情失败: ${err.message}`));
                    return;
                }
                
                if (!row) {
                    reject(new Error('诊断记录不存在'));
                    return;
                }
                
                resolve(row);
            });
        });
    }

    // 更新诊断记录
    async updateDiagnosisRecord(recordId, updateData) {
        return new Promise((resolve, reject) => {
            const allowedFields = [
                'chief_complaint', 'tcm_diagnosis', 'treatment_plan', 
                'next_visit_date', 'notes'
            ];
            
            const updateFields = [];
            const updateValues = [];
            
            // 构建更新字段
            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            }
            
            if (updateFields.length === 0) {
                reject(new Error('没有有效的更新字段'));
                return;
            }
            
            updateValues.push(recordId); // WHERE 条件的参数
            
            const sql = `UPDATE diagnosis_records SET ${updateFields.join(', ')} WHERE id = ?`;
            
            this.db.run(sql, updateValues, function(err) {
                if (err) {
                    reject(new Error(`更新诊断记录失败: ${err.message}`));
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('诊断记录不存在'));
                    return;
                }
                
                resolve({ success: true, changes: this.changes });
            });
        });
    }

    // 删除诊断记录
    async deleteDiagnosisRecord(recordId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM diagnosis_records WHERE id = ?', [recordId], function(err) {
                if (err) {
                    reject(new Error(`删除诊断记录失败: ${err.message}`));
                    return;
                }
                
                if (this.changes === 0) {
                    reject(new Error('诊断记录不存在'));
                    return;
                }
                
                resolve({ success: true, deleted: this.changes });
            });
        });
    }

    // 搜索患者（支持模糊搜索姓名和手机号）
    async searchPatients(searchTerm, limit = 20) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, name, phone, gender, age, member_level,
                       medical_record_number, constitution_type,
                       created_at, updated_at
                FROM users 
                WHERE (name LIKE ? OR phone LIKE ?) 
                  AND phone IS NOT NULL AND phone != ''
                ORDER BY created_at DESC
                LIMIT ?
            `;
            
            const searchPattern = `%${searchTerm}%`;
            
            this.db.all(sql, [searchPattern, searchPattern, limit], (err, rows) => {
                if (err) {
                    reject(new Error(`搜索患者失败: ${err.message}`));
                    return;
                }
                
                resolve(rows || []);
            });
        });
    }

    // 获取统计数据
    async getPatientStatistics() {
        return new Promise((resolve, reject) => {
            const stats = {};
            let completed = 0;
            const total = 3;
            
            const checkComplete = () => {
                completed++;
                if (completed === total) {
                    resolve(stats);
                }
            };
            
            // 总患者数
            this.db.get(
                'SELECT COUNT(*) as total FROM users WHERE phone IS NOT NULL AND phone != ""',
                (err, row) => {
                    if (err) {
                        reject(new Error(`查询统计失败: ${err.message}`));
                        return;
                    }
                    stats.total_patients = row.total;
                    checkComplete();
                }
            );
            
            // 本月新增患者
            this.db.get(
                `SELECT COUNT(*) as monthly FROM users 
                 WHERE phone IS NOT NULL AND phone != ""
                   AND created_at >= date('now', 'start of month')`,
                (err, row) => {
                    if (err) {
                        reject(new Error(`查询统计失败: ${err.message}`));
                        return;
                    }
                    stats.monthly_new_patients = row.monthly;
                    checkComplete();
                }
            );
            
            // 诊断记录总数
            this.db.get(
                'SELECT COUNT(*) as total_records FROM diagnosis_records',
                (err, row) => {
                    if (err) {
                        reject(new Error(`查询统计失败: ${err.message}`));
                        return;
                    }
                    stats.total_diagnosis_records = row.total_records;
                    checkComplete();
                }
            );
        });
    }

    // 关闭数据库连接
    close() {
        this.db.close();
    }
}

module.exports = new MedicalService(); 