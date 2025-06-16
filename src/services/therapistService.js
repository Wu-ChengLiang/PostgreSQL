const { getInstance } = require('../database/db');

class TherapistService {
    async searchTherapists({ storeId, specialty, minExperience, page = 1, limit = 20 }) {
        const db = getInstance();
        await db.connect();

        try {
            let query = `
                SELECT 
                    t.id,
                    t.name,
                    t.position,
                    t.experience_years AS years_of_experience,
                    t.specialties,
                    t.honors,
                    s.id AS store_id,
                    s.name AS store_name,
                    s.address AS store_address
                FROM therapists t
                JOIN stores s ON t.store_id = s.id
                WHERE t.status = 'active'
            `;

            const params = [];

            // 添加筛选条件
            if (storeId) {
                query += ' AND t.store_id = ?';
                params.push(storeId);
            }

            if (specialty) {
                query += ' AND t.specialties LIKE ?';
                params.push(`%${specialty}%`);
            }

            if (minExperience) {
                query += ' AND t.experience_years >= ?';
                params.push(minExperience);
            }

            // 获取总数
            const countQuery = query.replace(
                'SELECT t.id, t.name, t.position, t.experience_years AS years_of_experience, t.specialties, t.honors, s.id AS store_id, s.name AS store_name, s.address AS store_address',
                'SELECT COUNT(*) as count'
            );
            const { count } = await db.get(countQuery, params);

            // 添加分页
            const offset = (page - 1) * limit;
            query += ' ORDER BY t.experience_years DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const therapists = await db.all(query, params);

            // 解析specialties JSON
            const therapistsWithParsedSpecialties = therapists.map(t => ({
                ...t,
                specialties: JSON.parse(t.specialties || '[]'),
                store: {
                    id: t.store_id,
                    name: t.store_name,
                    address: t.store_address
                }
            }));

            // 移除store_相关字段
            therapistsWithParsedSpecialties.forEach(t => {
                delete t.store_id;
                delete t.store_name;
                delete t.store_address;
            });

            return {
                therapists: therapistsWithParsedSpecialties,
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            };
        } finally {
            await db.close();
        }
    }

    async getTherapistSchedule(therapistId, date) {
        const db = getInstance();
        await db.connect();

        try {
            // 获取技师信息
            const therapist = await db.get(
                'SELECT * FROM therapists WHERE id = ? AND status = "active"',
                [therapistId]
            );

            if (!therapist) {
                throw new Error('技师不存在或已停职');
            }

            // 获取该日期已预约的时间段
            const appointments = await db.all(
                `SELECT start_time 
                 FROM appointments 
                 WHERE therapist_id = ? 
                   AND appointment_date = ? 
                   AND status IN ('pending', 'confirmed')`,
                [therapistId, date]
            );

            const bookedTimes = appointments.map(a => a.start_time);

            // 生成可用时间段（9:00 - 21:00，每小时一个时段）
            const allTimes = [];
            for (let hour = 9; hour < 21; hour++) {
                allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
            }

            const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));

            return {
                date,
                available_times: availableTimes,
                business_hours: '9:00-21:00'
            };
        } finally {
            await db.close();
        }
    }

    async getTherapistList({ storeId, page = 1, limit = 20 }) {
        const db = getInstance();
        await db.connect();

        try {
            let query = `
                SELECT 
                    t.*,
                    s.name AS store_name,
                    COUNT(DISTINCT a.id) AS total_appointments
                FROM therapists t
                JOIN stores s ON t.store_id = s.id
                LEFT JOIN appointments a ON t.id = a.therapist_id
                WHERE 1=1
            `;

            const params = [];

            if (storeId) {
                query += ' AND t.store_id = ?';
                params.push(storeId);
            }

            query += ' GROUP BY t.id';

            // 获取总数
            const countQuery = `SELECT COUNT(*) as count FROM therapists t WHERE 1=1 ${storeId ? 'AND t.store_id = ?' : ''}`;
            const { count } = await db.get(countQuery, storeId ? [storeId] : []);

            // 添加分页
            const offset = (page - 1) * limit;
            query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const therapists = await db.all(query, params);

            // 解析specialties
            const result = therapists.map(t => ({
                ...t,
                specialties: JSON.parse(t.specialties || '[]')
            }));

            return {
                therapists: result,
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            };
        } finally {
            await db.close();
        }
    }

    async createTherapist(data) {
        const db = getInstance();
        await db.connect();

        try {
            const specialtiesJson = Array.isArray(data.specialties) 
                ? JSON.stringify(data.specialties)
                : data.specialties;

            const result = await db.run(
                `INSERT INTO therapists (
                    store_id, name, position, experience_years, 
                    specialties, phone, honors, bio, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    data.store_id,
                    data.name,
                    data.position,
                    data.years_of_experience,
                    specialtiesJson,
                    data.phone || null,
                    data.honors || null,
                    data.bio || null,
                    data.status || 'active'
                ]
            );

            return await this.getTherapistById(result.id);
        } finally {
            await db.close();
        }
    }

    async updateTherapist(id, data) {
        const db = getInstance();
        await db.connect();

        try {
            const fields = [];
            const values = [];

            // 动态构建更新语句
            if (data.name !== undefined) {
                fields.push('name = ?');
                values.push(data.name);
            }
            if (data.position !== undefined) {
                fields.push('position = ?');
                values.push(data.position);
            }
            if (data.years_of_experience !== undefined) {
                fields.push('experience_years = ?');
                values.push(data.years_of_experience);
            }
            if (data.specialties !== undefined) {
                fields.push('specialties = ?');
                values.push(
                    Array.isArray(data.specialties) 
                        ? JSON.stringify(data.specialties)
                        : data.specialties
                );
            }
            if (data.phone !== undefined) {
                fields.push('phone = ?');
                values.push(data.phone);
            }
            if (data.honors !== undefined) {
                fields.push('honors = ?');
                values.push(data.honors);
            }
            if (data.status !== undefined) {
                fields.push('status = ?');
                values.push(data.status);
            }

            if (fields.length === 0) {
                throw new Error('没有要更新的字段');
            }

            values.push(id);
            await db.run(
                `UPDATE therapists SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            return await this.getTherapistById(id);
        } finally {
            await db.close();
        }
    }

    async deleteTherapist(id) {
        const db = getInstance();
        await db.connect();

        try {
            // 检查是否有未完成的预约
            const pendingAppointments = await db.get(
                `SELECT COUNT(*) as count 
                 FROM appointments 
                 WHERE therapist_id = ? 
                   AND status IN ('pending', 'confirmed')
                   AND appointment_date >= DATE('now')`,
                [id]
            );

            if (pendingAppointments.count > 0) {
                throw new Error('该技师还有未完成的预约，无法删除');
            }

            // 软删除：将状态设置为inactive
            await db.run(
                'UPDATE therapists SET status = "inactive" WHERE id = ?',
                [id]
            );
        } finally {
            await db.close();
        }
    }

    async getTherapistById(id) {
        const db = getInstance();
        await db.connect();

        try {
            const therapist = await db.get(
                `SELECT t.*, s.name AS store_name 
                 FROM therapists t 
                 JOIN stores s ON t.store_id = s.id 
                 WHERE t.id = ?`,
                [id]
            );

            if (!therapist) {
                throw new Error('技师不存在');
            }

            therapist.specialties = JSON.parse(therapist.specialties || '[]');
            return therapist;
        } finally {
            await db.close();
        }
    }

    async getWorkloadStatistics({ startDate, endDate, storeId }) {
        const db = getInstance();
        await db.connect();

        try {
            let query = `
                SELECT 
                    t.id,
                    t.name,
                    t.position,
                    s.name AS store_name,
                    COUNT(a.id) AS total_appointments,
                    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
                    SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments
                FROM therapists t
                JOIN stores s ON t.store_id = s.id
                LEFT JOIN appointments a ON t.id = a.therapist_id 
                    AND a.appointment_date BETWEEN ? AND ?
                WHERE t.status = 'active'
            `;

            const params = [startDate, endDate];

            if (storeId) {
                query += ' AND t.store_id = ?';
                params.push(storeId);
            }

            query += ' GROUP BY t.id ORDER BY total_appointments DESC';

            const statistics = await db.all(query, params);

            return statistics;
        } finally {
            await db.close();
        }
    }
}

module.exports = new TherapistService();