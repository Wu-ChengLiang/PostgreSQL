const express = require('express');
const router = express.Router();
const therapistService = require('../services/therapistService');
const appointmentService = require('../services/appointmentService');
const storeService = require('../services/storeService');

// 搜索技师
router.get('/therapists/search', async (req, res, next) => {
    try {
        const { store_id, specialty, min_experience, page = 1, limit = 20 } = req.query;
        
        const result = await therapistService.searchTherapists({
            storeId: store_id,
            specialty,
            minExperience: min_experience,
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

// 新增：根据店名查询所有技师及预约时间
router.get('/stores/:storeName/therapists-schedule', async (req, res, next) => {
    try {
        const { storeName } = req.params;
        
        // 解码URL中的中文店名
        const decodedStoreName = decodeURIComponent(storeName);
        
        // 查找门店
        const storesData = await storeService.getAllStores();
        const store = storesData.stores ? storesData.stores.find(s => s.name === decodedStoreName) : null;
        
        if (!store) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'STORE_NOT_FOUND',
                    message: '未找到该门店'
                }
            });
        }
        
        // 获取该门店的所有技师
        const therapists = await therapistService.searchTherapists({
            storeId: store.id,
            page: 1,
            limit: 100
        });
        
        // 获取每个技师的预约信息
        const therapistsWithSchedule = await Promise.all(
            therapists.therapists.map(async (therapist) => {
                // 获取该技师的所有预约
                const appointments = await appointmentService.getTherapistAppointments(therapist.id);
                
                return {
                    id: therapist.id,
                    name: therapist.name,
                    position: therapist.position,
                    appointments: appointments.map(apt => ({
                        date: apt.appointment_date,
                        start_time: apt.start_time,
                        end_time: apt.end_time,
                        service: apt.service_name || '预约服务'
                    }))
                };
            })
        );
        
        res.json({
            success: true,
            data: {
                store: {
                    id: store.id,
                    name: store.name,
                    address: store.address
                },
                therapists: therapistsWithSchedule
            }
        });
    } catch (error) {
        next(error);
    }
});

// 查询技师排班
router.get('/therapists/:id/schedule', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '请提供查询日期'
                }
            });
        }

        const schedule = await therapistService.getTherapistSchedule(id, date);

        res.json({
            success: true,
            data: { schedule }
        });
    } catch (error) {
        next(error);
    }
});

// 创建预约
router.post('/appointments', async (req, res, next) => {
    try {
        const { 
            therapist_id, 
            user_name, 
            user_phone, 
            appointment_date, 
            appointment_time,
            notes 
        } = req.body;

        // 参数验证
        if (!therapist_id || !user_name || !appointment_date || !appointment_time) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '缺少必填参数'
                }
            });
        }

        const result = await appointmentService.createAppointment({
            therapistId: therapist_id,
            userName: user_name,
            userPhone: user_phone,
            appointmentDate: appointment_date,
            appointmentTime: appointment_time,
            notes
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
});

// 查看用户预约
router.get('/appointments/user', async (req, res, next) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '请提供手机号'
                }
            });
        }

        const appointments = await appointmentService.getUserAppointments(phone);

        res.json({
            success: true,
            data: { appointments }
        });
    } catch (error) {
        next(error);
    }
});

// 取消预约
router.delete('/appointments/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '请提供手机号进行验证'
                }
            });
        }

        await appointmentService.cancelAppointment(id, phone);

        res.json({
            success: true,
            data: {
                message: '预约已成功取消'
            }
        });
    } catch (error) {
        next(error);
    }
});

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

// 获取门店详情（包含技师列表）
router.get('/stores/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const store = await storeService.getStoreDetail(id);

        res.json({
            success: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;