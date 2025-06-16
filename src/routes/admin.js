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
            data: { therapist }
        });
    } catch (error) {
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
            data: { therapist }
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
        
        const appointment = await appointmentService.getAppointmentDetail(id);

        res.json({
            success: true,
            data: { appointment }
        });
    } catch (error) {
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

module.exports = router;