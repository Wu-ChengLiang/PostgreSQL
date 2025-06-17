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
        const stores = await storeService.getAllStores();
        const store = stores ? stores.find(s => s.name === decodedStoreName) : null;
        
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

// 智能预约 - 简化版本，只需要最少的信息
router.post('/appointments/smart', async (req, res, next) => {
    try {
        const { 
            therapist_name,
            appointment_time,
            customer_name,
            store_name,
            appointment_date,
            notes 
        } = req.body;

        console.log('🤖 智能预约请求:', req.body);

        // 只验证最基本的参数
        if (!therapist_name && !appointment_time) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PARAMS',
                    message: '至少需要技师姓名或预约时间'
                }
            });
        }

        // 自动填充默认值
        const finalCustomerName = customer_name || `客户_${Date.now()}`;
        const finalAppointmentDate = appointment_date || new Date().toISOString().split('T')[0];
        const finalAppointmentTime = appointment_time || '14:00';
        const finalTherapistName = therapist_name || '默认技师';

        // 查找技师（智能匹配逻辑）
        let matchedTherapist = null;
        let targetStoreId = null;
        
        // 1. 先根据门店名称找到门店ID
        if (store_name) {
            const stores = await storeService.getAllStores();
            const targetStore = stores.find(s => 
                s.name.includes(store_name.replace('·', '').replace('店', '')) ||
                store_name.includes(s.name.replace('·', '').replace('店', ''))
            );
            if (targetStore) {
                targetStoreId = targetStore.id;
                console.log('🏪 找到目标门店:', targetStore.name, '(ID:', targetStore.id, ')');
            }
        }
        
        // 2. 优先在指定门店搜索技师
        if (targetStoreId && therapist_name) {
            const storeTherapists = await therapistService.searchTherapists({
                storeId: targetStoreId,
                page: 1,
                limit: 100
            });
            
            if (storeTherapists.therapists && storeTherapists.therapists.length > 0) {
                matchedTherapist = storeTherapists.therapists.find(t => 
                    t.name.includes(therapist_name.replace('老师', '').replace('师傅', '')) ||
                    therapist_name.includes(t.name.replace('老师', '').replace('师傅', ''))
                );
                
                if (matchedTherapist) {
                    console.log('✅ 在指定门店找到技师:', matchedTherapist.name);
                }
            }
        }
        
        // 3. 如果在指定门店没找到，搜索所有门店
        if (!matchedTherapist && therapist_name) {
            const allTherapists = await therapistService.searchTherapists({
                page: 1,
                limit: 100
            });
            
            if (allTherapists.therapists && allTherapists.therapists.length > 0) {
                matchedTherapist = allTherapists.therapists.find(t => 
                    t.name.includes(therapist_name.replace('老师', '').replace('师傅', '')) ||
                    therapist_name.includes(t.name.replace('老师', '').replace('师傅', ''))
                );
                
                if (matchedTherapist) {
                    console.log('⚠️ 在其他门店找到技师:', matchedTherapist.name, '门店ID:', matchedTherapist.store_id);
                }
            }
        }
        
        // 4. 如果还是没找到，在指定门店选择第一个技师
        if (!matchedTherapist && targetStoreId) {
            const storeTherapists = await therapistService.searchTherapists({
                storeId: targetStoreId,
                page: 1,
                limit: 100
            });
            
            if (storeTherapists.therapists && storeTherapists.therapists.length > 0) {
                matchedTherapist = storeTherapists.therapists[0];
                console.log('🎯 使用指定门店的默认技师:', matchedTherapist.name);
            }
        }
        
        // 5. 最后的备选：使用任意技师
        if (!matchedTherapist) {
            const allTherapists = await therapistService.searchTherapists({
                page: 1,
                limit: 100
            });
            
            if (allTherapists.therapists && allTherapists.therapists.length > 0) {
                matchedTherapist = allTherapists.therapists[0];
                console.log('💡 使用备选技师:', matchedTherapist.name);
            }
        }

        if (!matchedTherapist) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'THERAPIST_NOT_FOUND',
                    message: '未找到可用的技师'
                }
            });
        }

        console.log('📋 使用技师:', matchedTherapist.name, '(ID:', matchedTherapist.id, ')');

        // 创建预约
        const result = await appointmentService.createAppointment({
            therapistId: matchedTherapist.id,
            userName: finalCustomerName,
            userPhone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`, // 生成假电话
            appointmentDate: finalAppointmentDate,
            appointmentTime: finalAppointmentTime,
            notes: notes || `智能预约: ${therapist_name || ''} ${appointment_time || ''}`
        });

        console.log('✅ 预约创建成功:', result);

        res.json({
            success: true,
            data: {
                ...result,
                matched_therapist: matchedTherapist,
                original_request: {
                    therapist_name,
                    appointment_time,
                    customer_name,
                    store_name
                }
            },
            message: `智能预约成功！技师: ${matchedTherapist.name}, 时间: ${finalAppointmentTime}, 客户: ${finalCustomerName}`
        });
    } catch (error) {
        console.error('❌ 智能预约失败:', error);
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