const express = require('express');
const router = express.Router();
const Therapist = require('../models/Therapist');

// 获取所有技师
router.get('/', async (req, res) => {
  try {
    const therapists = await Therapist.findAll({}, { orderBy: 'rating DESC' });
    res.json({
      success: true,
      therapists: therapists
    });
  } catch (error) {
    console.error('获取技师列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师列表失败'
    });
  }
});

// 搜索技师
router.get('/search', async (req, res) => {
  try {
    const { name, store, service_type } = req.query;
    let therapists = [];
    
    if (name) {
      // 按名称搜索
      therapists = await Therapist.findByName(name);
    } else if (store) {
      // 按门店名称搜索
      therapists = await Therapist.findByStoreName(store);
    } else if (service_type) {
      // 按服务类型搜索
      therapists = await Therapist.findByServiceType(service_type);
    } else {
      // 返回所有技师
      therapists = await Therapist.findAll({}, { orderBy: 'rating DESC' });
    }
    
    res.json({
      success: true,
      therapists: therapists
    });
  } catch (error) {
    console.error('搜索技师失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索技师失败'
    });
  }
});

// 获取单个技师详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const therapist = await Therapist.getDetailById(id);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 解析JSON字符串
    if (therapist.specialties && typeof therapist.specialties === 'string') {
      try {
        therapist.specialties = JSON.parse(therapist.specialties);
      } catch (e) {
        therapist.specialties = [];
      }
    }
    
    if (therapist.service_types && typeof therapist.service_types === 'string') {
      try {
        therapist.service_types = JSON.parse(therapist.service_types);
      } catch (e) {
        therapist.service_types = [];
      }
    }
    
    res.json({
      success: true,
      therapist: therapist
    });
  } catch (error) {
    console.error('获取技师详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师详情失败'
    });
  }
});

// 获取技师可用时间
router.get('/:id/availability', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: '请提供日期参数'
      });
    }
    
    const availableSlots = await Therapist.getAvailableSlots(id, date);
    
    res.json({
      success: true,
      therapist_id: id,
      date: date,
      available_slots: availableSlots
    });
  } catch (error) {
    console.error('获取技师可用时间失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师可用时间失败'
    });
  }
});

// 创建新技师
router.post('/', async (req, res) => {
  try {
    const {
      name,
      store_id,
      title,
      specialties,
      service_types,
      bio,
      years_experience
    } = req.body;
    
    if (!name || !store_id) {
      return res.status(400).json({
        success: false,
        error: '技师姓名和所属门店为必填项'
      });
    }
    
    const therapist = await Therapist.create({
      name,
      store_id,
      title,
      specialties,
      service_types,
      bio,
      years_experience: years_experience || 0,
      rating: 0,
      review_count: 0
    });
    
    res.status(201).json({
      success: true,
      therapist: therapist
    });
  } catch (error) {
    console.error('创建技师失败:', error);
    res.status(500).json({
      success: false,
      error: '创建技师失败'
    });
  }
});

// 更新技师信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;
    
    const therapist = await Therapist.update(id, updateData);
    
    res.json({
      success: true,
      therapist: therapist
    });
  } catch (error) {
    console.error('更新技师失败:', error);
    res.status(500).json({
      success: false,
      error: '更新技师失败'
    });
  }
});

// 删除技师
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await Therapist.delete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    res.json({
      success: true,
      message: '技师删除成功'
    });
  } catch (error) {
    console.error('删除技师失败:', error);
    res.status(500).json({
      success: false,
      error: '删除技师失败'
    });
  }
});

// 按门店ID获取技师
router.get('/store/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const therapists = await Therapist.findByStore(storeId);
    
    res.json({
      success: true,
      therapists: therapists
    });
  } catch (error) {
    console.error('获取门店技师失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门店技师失败'
    });
  }
});

module.exports = router;