const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// 获取所有预约
router.get('/', async (req, res) => {
  try {
    const { user_id, therapist_id, store_id, status, date } = req.query;
    const conditions = {};
    
    if (user_id) conditions.user_id = parseInt(user_id);
    if (therapist_id) conditions.therapist_id = parseInt(therapist_id);
    if (store_id) conditions.store_id = parseInt(store_id);
    if (status) conditions.status = status;
    if (date) conditions.appointment_date = date;
    
    const appointments = await Appointment.findAll(conditions, {
      orderBy: 'appointment_date DESC, start_time DESC'
    });
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取预约列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取预约列表失败'
    });
  }
});

// 获取单个预约详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: '预约不存在'
      });
    }
    
    res.json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('获取预约详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取预约详情失败'
    });
  }
});

// 创建新预约
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      therapist_id,
      store_id,
      service_type,
      appointment_date,
      start_time,
      end_time,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!user_id || !therapist_id || !store_id || !service_type || 
        !appointment_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }
    
    // 创建预约
    const appointment = await Appointment.createAppointment({
      user_id: parseInt(user_id),
      therapist_id: parseInt(therapist_id),
      store_id: parseInt(store_id),
      service_type,
      appointment_date,
      start_time,
      end_time,
      notes
    });
    
    res.status(201).json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('创建预约失败:', error);
    
    if (error.message === '该时间段已被预约') {
      return res.status(409).json({
        success: false,
        error: '该时间段已被预约'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '创建预约失败'
    });
  }
});

// 更新预约状态
router.put('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: '请提供状态参数'
      });
    }
    
    const appointment = await Appointment.updateStatus(id, status);
    
    res.json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('更新预约状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '更新预约状态失败'
    });
  }
});

// 取消预约
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointment = await Appointment.cancel(id);
    
    res.json({
      success: true,
      message: '预约已取消',
      appointment: appointment
    });
  } catch (error) {
    console.error('取消预约失败:', error);
    res.status(500).json({
      success: false,
      error: '取消预约失败'
    });
  }
});

// 用户的预约列表
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const appointments = await Appointment.findByUser(userId);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取用户预约失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户预约失败'
    });
  }
});

// 技师的预约列表
router.get('/therapist/:therapistId', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.therapistId);
    const { date } = req.query;
    const appointments = await Appointment.findByTherapist(therapistId, date);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取技师预约失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师预约失败'
    });
  }
});

// 门店的预约列表
router.get('/store/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const { date } = req.query;
    const appointments = await Appointment.findByStore(storeId, date);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取门店预约失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门店预约失败'
    });
  }
});

// 预约统计
router.get('/stats', async (req, res) => {
  try {
    const { store_id } = req.query;
    const stats = await Appointment.getStats(store_id ? parseInt(store_id) : null);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('获取预约统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取预约统计失败'
    });
  }
});

// 公开创建预约接口（基于用户名）
router.post('/public/create', async (req, res) => {
  try {
    const {
      username,
      therapist_id,
      appointment_date,
      start_time,
      end_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!username || !therapist_id || !appointment_date || 
        !start_time || !end_time || !service_type) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }
    
    // 查找用户
    const User = require('../models/User');
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 获取技师信息以确定门店
    const Therapist = require('../models/Therapist');
    const therapist = await Therapist.findById(therapist_id);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 创建预约
    const appointment = await Appointment.createAppointment({
      user_id: user.id,
      therapist_id: parseInt(therapist_id),
      store_id: therapist.store_id,
      service_type,
      appointment_date,
      start_time,
      end_time,
      notes
    });
    
    res.status(201).json({
      success: true,
      appointment: appointment,
      message: '预约创建成功'
    });
  } catch (error) {
    console.error('创建公开预约失败:', error);
    
    if (error.message === '该时间段已被预约') {
      return res.status(409).json({
        success: false,
        error: '该时间段已被预约'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '创建预约失败'
    });
  }
});

module.exports = router;