const { getInstance } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class AppointmentService {
    // 获取技师的所有预约
    async getTherapistAppointments(therapistId) {
        const db = getInstance();
        await db.connect();

        try {
            const appointments = await db.all(
                `SELECT 
                    a.*,
                    s.name as service_name
                FROM appointments a
                LEFT JOIN services s ON a.service_id = s.id
                WHERE a.therapist_id = ?
                  AND a.status IN ('pending', 'confirmed')
                  AND a.appointment_date >= DATE('now')
                ORDER BY a.appointment_date, a.start_time`,
                [therapistId]
            );

            return appointments;
        } finally {
            await db.close();
        }
    }

    async createAppointment({ therapistId, userName, userPhone, appointmentDate, appointmentTime, notes }) {
        const db = getInstance();
        await db.connect();

        try {
            // 开始事务
            await db.run('BEGIN TRANSACTION');

            // 检查技师是否存在且在职
            const therapist = await db.get(
                'SELECT * FROM therapists WHERE id = ? AND status = "active"',
                [therapistId]
            );

            if (!therapist) {
                throw new Error('技师不存在或已停职');
            }

            // 检查时间段是否已被预约
            const existingAppointment = await db.get(
                `SELECT * FROM appointments 
                 WHERE therapist_id = ? 
                   AND appointment_date = ? 
                   AND start_time = ?
                   AND status IN ('pending', 'confirmed')`,
                [therapistId, appointmentDate, appointmentTime]
            );

            if (existingAppointment) {
                throw new Error('该时间段已被预约');
            }

            // 查找或创建用户
            let user = await db.get(
                'SELECT * FROM users WHERE phone = ?',
                [userPhone]
            );

            if (!user) {
                const userResult = await db.run(
                    'INSERT INTO users (name, phone) VALUES (?, ?)',
                    [userName, userPhone]
                );
                user = { id: userResult.id };
            } else {
                // 更新用户姓名（如果提供的姓名不同）
                if (user.name !== userName) {
                    await db.run(
                        'UPDATE users SET name = ? WHERE id = ?',
                        [userName, user.id]
                    );
                }
            }

            // 生成预约确认码
            const confirmationCode = `APT${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            // 创建预约
            const endTime = this.calculateEndTime(appointmentTime, 60); // 默认60分钟
            
            const result = await db.run(
                `INSERT INTO appointments (
                    user_id, therapist_id, store_id, appointment_date, 
                    start_time, end_time, duration, status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.id,
                    therapistId,
                    therapist.store_id,
                    appointmentDate,
                    appointmentTime,
                    endTime,
                    60,
                    'pending',
                    notes || null
                ]
            );

            // 提交事务
            await db.run('COMMIT');

            // 更新用户访问次数
            await db.run(
                'UPDATE users SET total_visits = total_visits + 1 WHERE id = ?',
                [user.id]
            );

            return {
                appointment_id: result.id,
                confirmation_code: confirmationCode
            };
        } catch (error) {
            // 回滚事务
            await db.run('ROLLBACK');
            throw error;
        } finally {
            await db.close();
        }
    }

    async getUserAppointments(phone) {
        const db = getInstance();
        await db.connect();

        try {
            const user = await db.get(
                'SELECT * FROM users WHERE phone = ?',
                [phone]
            );

            if (!user) {
                return [];
            }

            const appointments = await db.all(
                `SELECT 
                    a.*,
                    t.name AS therapist_name,
                    t.position AS therapist_position,
                    s.name AS store_name,
                    s.address AS store_address
                 FROM appointments a
                 JOIN therapists t ON a.therapist_id = t.id
                 JOIN stores s ON a.store_id = s.id
                 WHERE a.user_id = ?
                 ORDER BY a.appointment_date DESC, a.start_time DESC`,
                [user.id]
            );

            return appointments.map(a => ({
                id: a.id,
                therapist: {
                    id: a.therapist_id,
                    name: a.therapist_name,
                    position: a.therapist_position
                },
                store: {
                    id: a.store_id,
                    name: a.store_name,
                    address: a.store_address
                },
                appointment_date: a.appointment_date,
                appointment_time: a.start_time,
                duration: a.duration,
                status: a.status,
                notes: a.notes,
                created_at: a.created_at
            }));
        } finally {
            await db.close();
        }
    }

    async cancelAppointment(appointmentId, phone) {
        const db = getInstance();
        await db.connect();

        try {
            // 验证预约是否属于该用户
            const appointment = await db.get(
                `SELECT a.*, u.phone 
                 FROM appointments a
                 JOIN users u ON a.user_id = u.id
                 WHERE a.id = ? AND u.phone = ?`,
                [appointmentId, phone]
            );

            if (!appointment) {
                throw new Error('预约不存在或无权取消');
            }

            if (appointment.status === 'cancelled') {
                throw new Error('该预约已经取消');
            }

            if (appointment.status === 'completed') {
                throw new Error('已完成的预约无法取消');
            }

            // 检查是否在可取消时间内（预约时间前2小时）
            const appointmentDateTime = new Date(`${appointment.appointment_date} ${appointment.start_time}`);
            const now = new Date();
            const hoursBeforeAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

            if (hoursBeforeAppointment < 2) {
                throw new Error('预约时间前2小时内无法取消');
            }

            // 更新预约状态
            await db.run(
                'UPDATE appointments SET status = "cancelled" WHERE id = ?',
                [appointmentId]
            );
        } finally {
            await db.close();
        }
    }

    async getAppointmentList({ storeId, therapistId, date, status, page = 1, limit = 20 }) {
        const db = getInstance();
        await db.connect();

        try {
            let query = `
                SELECT 
                    a.*,
                    u.name AS user_name,
                    u.phone AS user_phone,
                    t.name AS therapist_name,
                    t.position AS therapist_position,
                    s.name AS store_name
                FROM appointments a
                LEFT JOIN users u ON a.user_id = u.id
                LEFT JOIN therapists t ON a.therapist_id = t.id
                LEFT JOIN stores s ON a.store_id = s.id
                WHERE 1=1
            `;

            const params = [];

            if (storeId) {
                query += ' AND a.store_id = ?';
                params.push(storeId);
            }

            if (therapistId) {
                query += ' AND a.therapist_id = ?';
                params.push(therapistId);
            }

            if (date) {
                query += ' AND a.appointment_date = ?';
                params.push(date);
            }

            if (status) {
                query += ' AND a.status = ?';
                params.push(status);
            }

            // 获取总数 - 简化查询避免复杂的字符串替换
            let countQuery = `SELECT COUNT(*) as count FROM appointments a WHERE 1=1`;
            const countParams = [];

            if (storeId) {
                countQuery += ' AND a.store_id = ?';
                countParams.push(storeId);
            }

            if (therapistId) {
                countQuery += ' AND a.therapist_id = ?';
                countParams.push(therapistId);
            }

            if (date) {
                countQuery += ' AND a.appointment_date = ?';
                countParams.push(date);
            }

            if (status) {
                countQuery += ' AND a.status = ?';
                countParams.push(status);
            }
            
            const countResult = await db.get(countQuery, countParams);
            const count = countResult && countResult.count !== undefined ? countResult.count : 0;

            // 添加排序和分页
            const offset = (page - 1) * limit;
            query += ' ORDER BY a.appointment_date DESC, a.start_time DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const appointments = await db.all(query, params);

            return {
                appointments: appointments || [],
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            };
        } finally {
            await db.close();
        }
    }

    async getAppointmentDetail(id) {
        const db = getInstance();
        await db.connect();

        try {
            const appointment = await db.get(
                `SELECT 
                    a.*,
                    u.name AS user_name,
                    u.phone AS user_phone,
                    u.total_visits,
                    t.name AS therapist_name,
                    t.position AS therapist_position,
                    t.specialties AS therapist_specialties,
                    s.name AS store_name,
                    s.address AS store_address,
                    s.phone AS store_phone
                 FROM appointments a
                 LEFT JOIN users u ON a.user_id = u.id
                 LEFT JOIN therapists t ON a.therapist_id = t.id
                 LEFT JOIN stores s ON a.store_id = s.id
                 WHERE a.id = ?`,
                [id]
            );

            if (!appointment) {
                throw new Error('预约不存在');
            }

            return {
                id: appointment.id,
                user: {
                    id: appointment.user_id,
                    name: appointment.user_name,
                    phone: appointment.user_phone,
                    total_visits: appointment.total_visits
                },
                therapist: {
                    id: appointment.therapist_id,
                    name: appointment.therapist_name,
                    position: appointment.therapist_position,
                    specialties: JSON.parse(appointment.therapist_specialties || '[]')
                },
                store: {
                    id: appointment.store_id,
                    name: appointment.store_name,
                    address: appointment.store_address,
                    phone: appointment.store_phone
                },
                appointment_date: appointment.appointment_date,
                start_time: appointment.start_time,
                end_time: appointment.end_time,
                duration: appointment.duration,
                status: appointment.status,
                notes: appointment.notes,
                health_notes: appointment.health_notes,
                therapist_notes: appointment.therapist_notes,
                rating: appointment.rating,
                review: appointment.review,
                created_at: appointment.created_at,
                updated_at: appointment.updated_at
            };
        } finally {
            await db.close();
        }
    }

    async updateAppointmentStatus(id, status) {
        const db = getInstance();
        await db.connect();

        try {
            const appointment = await db.get(
                'SELECT * FROM appointments WHERE id = ?',
                [id]
            );

            if (!appointment) {
                throw new Error('预约不存在');
            }

            // 状态转换验证
            const validTransitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['completed', 'cancelled', 'no_show'],
                'cancelled': [],
                'completed': [],
                'no_show': []
            };

            if (!validTransitions[appointment.status].includes(status)) {
                throw new Error(`无法将状态从 ${appointment.status} 更改为 ${status}`);
            }

            await db.run(
                'UPDATE appointments SET status = ? WHERE id = ?',
                [status, id]
            );

            return await this.getAppointmentDetail(id);
        } finally {
            await db.close();
        }
    }

    async getAppointmentStatistics({ startDate, endDate, storeId }) {
        const db = getInstance();
        await db.connect();

        try {
            let query = `
                SELECT 
                    COUNT(*) AS total_appointments,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,
                    SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS no_show_appointments,
                    DATE(appointment_date) AS date
                FROM appointments
                WHERE appointment_date BETWEEN ? AND ?
            `;

            const params = [startDate, endDate];

            if (storeId) {
                query += ' AND store_id = ?';
                params.push(storeId);
            }

            query += ' GROUP BY DATE(appointment_date) ORDER BY date';

            const dailyStats = await db.all(query, params);

            // 计算总计
            const totalsQuery = `SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
                SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS no_show
             FROM appointments
             WHERE appointment_date BETWEEN ? AND ?
             ${storeId ? 'AND store_id = ?' : ''}`;
             
            const totalsResult = await db.get(totalsQuery, params);
            
            // 修复统计数据的空值处理
            const totals = totalsResult || {};
            const totalAppointments = totals.total || 0;
            const completedAppointments = totals.completed || 0;
            const cancelledAppointments = totals.cancelled || 0;
            const noShowAppointments = totals.no_show || 0;

            const result = {
                daily_statistics: dailyStats || [],
                totals: {
                    total_appointments: totalAppointments,
                    completed_appointments: completedAppointments,
                    cancelled_appointments: cancelledAppointments,
                    no_show_appointments: noShowAppointments,
                    completion_rate: totalAppointments > 0 ? 
                        (completedAppointments / totalAppointments * 100).toFixed(2) + '%' : 
                        '0%'
                }
            };
            
            return result;
        } finally {
            await db.close();
        }
    }

    calculateEndTime(startTime, duration) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + duration;
        const endHours = Math.floor(totalMinutes / 60);
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    }
}

module.exports = new AppointmentService();