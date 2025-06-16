const { getInstance } = require('../database/db');

class StoreService {
    async getAllStores() {
        const db = getInstance();
        await db.connect();

        try {
            const stores = await db.all(
                `SELECT 
                    s.*,
                    COUNT(DISTINCT t.id) AS therapist_count
                 FROM stores s
                 LEFT JOIN therapists t ON s.id = t.store_id AND t.status = 'active'
                 GROUP BY s.id
                 ORDER BY s.name`
            );

            return stores;
        } finally {
            await db.close();
        }
    }

    async getStoreDetail(id) {
        const db = getInstance();
        await db.connect();

        try {
            // 获取门店信息
            const store = await db.get(
                'SELECT * FROM stores WHERE id = ?',
                [id]
            );

            if (!store) {
                throw new Error('门店不存在');
            }

            // 获取门店的技师列表
            const therapists = await db.all(
                `SELECT 
                    id,
                    name,
                    position,
                    experience_years AS years_of_experience,
                    specialties,
                    honors,
                    status
                 FROM therapists 
                 WHERE store_id = ? AND status = 'active'
                 ORDER BY experience_years DESC`,
                [id]
            );

            // 解析技师的专长
            const therapistsWithParsedSpecialties = therapists.map(t => ({
                ...t,
                specialties: JSON.parse(t.specialties || '[]')
            }));

            // 获取门店统计信息
            const stats = await db.get(
                `SELECT 
                    COUNT(DISTINCT t.id) AS total_therapists,
                    COUNT(DISTINCT CASE WHEN t.position = '专家医师' THEN t.id END) AS expert_count,
                    AVG(t.experience_years) AS avg_experience
                 FROM therapists t
                 WHERE t.store_id = ? AND t.status = 'active'`,
                [id]
            );

            return {
                store: {
                    ...store,
                    statistics: {
                        total_therapists: stats.total_therapists,
                        expert_count: stats.expert_count,
                        average_experience: Math.round(stats.avg_experience || 0)
                    }
                },
                therapists: therapistsWithParsedSpecialties
            };
        } finally {
            await db.close();
        }
    }

    async createStore(data) {
        const db = getInstance();
        await db.connect();

        try {
            const result = await db.run(
                `INSERT INTO stores (name, address, phone, business_hours, manager_name) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    data.name,
                    data.address,
                    data.phone || null,
                    data.business_hours || '09:00-21:00',
                    data.manager_name || null
                ]
            );

            return await this.getStoreById(result.id);
        } finally {
            await db.close();
        }
    }

    async updateStore(id, data) {
        const db = getInstance();
        await db.connect();

        try {
            const fields = [];
            const values = [];

            if (data.name !== undefined) {
                fields.push('name = ?');
                values.push(data.name);
            }
            if (data.address !== undefined) {
                fields.push('address = ?');
                values.push(data.address);
            }
            if (data.phone !== undefined) {
                fields.push('phone = ?');
                values.push(data.phone);
            }
            if (data.business_hours !== undefined) {
                fields.push('business_hours = ?');
                values.push(data.business_hours);
            }
            if (data.manager_name !== undefined) {
                fields.push('manager_name = ?');
                values.push(data.manager_name);
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
                `UPDATE stores SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            return await this.getStoreById(id);
        } finally {
            await db.close();
        }
    }

    async getStoreById(id) {
        const db = getInstance();
        await db.connect();

        try {
            const store = await db.get(
                'SELECT * FROM stores WHERE id = ?',
                [id]
            );

            if (!store) {
                throw new Error('门店不存在');
            }

            return store;
        } finally {
            await db.close();
        }
    }

    async getStoreStatistics(id) {
        const db = getInstance();
        await db.connect();

        try {
            // 获取门店的各项统计数据
            const stats = await db.get(
                `SELECT 
                    COUNT(DISTINCT t.id) AS total_therapists,
                    COUNT(DISTINCT u.id) AS total_customers,
                    COUNT(DISTINCT a.id) AS total_appointments,
                    SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
                    AVG(a.rating) AS average_rating
                 FROM stores s
                 LEFT JOIN therapists t ON s.id = t.store_id AND t.status = 'active'
                 LEFT JOIN appointments a ON s.id = a.store_id
                 LEFT JOIN users u ON a.user_id = u.id
                 WHERE s.id = ?`,
                [id]
            );

            // 获取最受欢迎的技师
            const topTherapists = await db.all(
                `SELECT 
                    t.id,
                    t.name,
                    t.position,
                    COUNT(a.id) AS appointment_count,
                    AVG(a.rating) AS average_rating
                 FROM therapists t
                 LEFT JOIN appointments a ON t.id = a.therapist_id AND a.status = 'completed'
                 WHERE t.store_id = ? AND t.status = 'active'
                 GROUP BY t.id
                 ORDER BY appointment_count DESC, average_rating DESC
                 LIMIT 5`,
                [id]
            );

            return {
                overview: {
                    total_therapists: stats.total_therapists || 0,
                    total_customers: stats.total_customers || 0,
                    total_appointments: stats.total_appointments || 0,
                    completed_appointments: stats.completed_appointments || 0,
                    completion_rate: stats.total_appointments > 0 
                        ? ((stats.completed_appointments / stats.total_appointments) * 100).toFixed(2) + '%'
                        : '0%',
                    average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : null
                },
                top_therapists: topTherapists
            };
        } finally {
            await db.close();
        }
    }
}

module.exports = new StoreService();