const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authService = require('../services/authService');
const therapistService = require('../services/therapistService');
const appointmentService = require('../services/appointmentService');
const storeService = require('../services/storeService');

// 管理员登录
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '请提供用户名和密码'
                }
            });
        }

        const result = await authService.login(username, password);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// 以下路由需要认证
router.use(authMiddleware);

// 获取门店列表
router.get('/stores', async (req, res, next) => {
    try {
        const stores = await storeService.getAllStores();
        res.json({
            success: true,
            data: { stores }
        });
    } catch (error) {
        next(error);
    }
});

// 技师管理 - 获取技师列表
router.get('/therapists', async (req, res, next) => {
    try {
        const { store_id, page = 1, limit = 20 } = req.query;
        
        const result = await therapistService.getTherapistList({
            storeId: store_id,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// 添加技师
router.post('/therapists', async (req, res, next) => {
    try {
        const therapistData = req.body;
        
        // 验证必填字段
        const requiredFields = ['store_id', 'name', 'position', 'years_of_experience', 'specialties'];
        for (const field of requiredFields) {
            if (!therapistData[field]) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_PARAMS',
                        message: `缺少必填字段: ${field}`
                    }
                });
            }
        }

        const therapist = await therapistService.createTherapist(therapistData);

        res.json({
            success: true,
            data: therapist
        });
    } catch (error) {
        next(error);
    }
});

// 获取技师详情
router.get('/therapists/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const therapist = await therapistService.getTherapistById(id);
        
        res.json({
            success: true,
            data: therapist
        });
    } catch (error) {
        if (error.message === '技师不存在') {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '技师不存在'
                }
            });
        }
        next(error);
    }
});

// 更新技师信息
router.put('/therapists/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const therapist = await therapistService.updateTherapist(id, updateData);

        res.json({
            success: true,
            data: therapist
        });
    } catch (error) {
        next(error);
    }
});

// 删除技师
router.delete('/therapists/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        await therapistService.deleteTherapist(id);

        res.json({
            success: true,
            data: {
                message: '技师已删除'
            }
        });
    } catch (error) {
        next(error);
    }
});

// 预约管理 - 获取预约列表
router.get('/appointments', async (req, res, next) => {
    try {
        const { store_id, therapist_id, date, status, page = 1, limit = 20 } = req.query;
        
        const result = await appointmentService.getAppointmentList({
            storeId: store_id,
            therapistId: therapist_id,
            date,
            status,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// 获取预约详情
router.get('/appointments/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(`🔍 查询预约详情: ID=${id}`);
        
        const appointment = await appointmentService.getAppointmentDetail(id);

        res.json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
        console.log(`❌ 预约详情查询错误: ${error.message}`);
        console.log(`🔍 错误消息包含"不存在": ${error.message.includes('不存在')}`);
        
        if (error.message === '预约不存在' || 
            error.message.includes('不存在') || 
            error.message.includes('not found') ||
            error.message.includes('Not found')) {
            console.log('✅ 匹配404条件，返回404状态码');
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: '预约不存在'
                }
            });
        }
        console.log('❌ 未匹配404条件，传递给错误处理中间件');
        // 设置错误状态码，然后传递给错误处理中间件
        error.status = error.status || 500;
        next(error);
    }
});

// 更新预约状态
router.put('/appointments/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '无效的状态值'
                }
            });
        }

        const appointment = await appointmentService.updateAppointmentStatus(id, status);

        res.json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
});

// 数据统计 - 预约统计
router.get('/statistics/appointments', async (req, res, next) => {
    try {
        const { start_date, end_date, store_id } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '请提供开始和结束日期'
                }
            });
        }

        const statistics = await appointmentService.getAppointmentStatistics({
            startDate: start_date,
            endDate: end_date,
            storeId: store_id
        });

        res.json({
            success: true,
            data: { statistics }
        });
    } catch (error) {
        next(error);
    }
});

// 技师工作量统计
router.get('/statistics/therapists', async (req, res, next) => {
    try {
        const { start_date, end_date, store_id } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '请提供开始和结束日期'
                }
            });
        }

        const statistics = await therapistService.getWorkloadStatistics({
            startDate: start_date,
            endDate: end_date,
            storeId: store_id
        });

        res.json({
            success: true,
            data: { statistics }
        });
    } catch (error) {
        next(error);
    }
});

// 创建门店
router.post('/stores', async (req, res, next) => {
    try {
        const store = await storeService.createStore(req.body);
        
        res.status(201).json({
            success: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
});

// 更新门店
router.put('/stores/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const store = await storeService.updateStore(id, req.body);
        
        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
});

// 获取门店详情
router.get('/stores/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await storeService.getStoreDetail(id);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// 获取统计概览
router.get('/statistics/overview', async (req, res, next) => {
    try {
        const db = require('../database/db').getInstance();
        await db.connect();
        
        try {
            // 获取各项统计数据
            const [storesCount, therapistsCount, appointmentsCount, usersCount] = await Promise.all([
                db.get('SELECT COUNT(*) as count FROM stores WHERE status = "active"'),
                db.get('SELECT COUNT(*) as count FROM therapists WHERE status = "active"'),
                db.get('SELECT COUNT(*) as count FROM appointments'),
                db.get('SELECT COUNT(*) as count FROM users')
            ]);
            
            const todayAppointments = await db.get(
                'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = DATE("now")'
            );
            
            const monthRevenue = await db.get(
                `SELECT SUM(price) as revenue FROM appointments 
                 WHERE status = "completed" 
                 AND appointment_date >= DATE("now", "start of month")`
            );
            
            res.json({
                success: true,
                data: {
                    stores_count: storesCount.count,
                    therapists_count: therapistsCount.count,
                    appointments_count: appointmentsCount.count,
                    users_count: usersCount.count,
                    today_appointments: todayAppointments.count,
                    month_revenue: monthRevenue.revenue || 0
                }
            });
        } finally {
            // Don't close the connection with persistent pool
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;