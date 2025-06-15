const express = require('express');
const router = express.Router();
const Store = require('../models/Store');

// 获取所有门店
router.get('/', async (req, res) => {
  try {
    const stores = await Store.findAll({}, { orderBy: 'rating DESC' });
    res.json({
      success: true,
      stores: stores
    });
  } catch (error) {
    console.error('获取门店列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门店列表失败'
    });
  }
});

// 获取单个门店
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const store = await Store.getWithTherapistCount(id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: '门店不存在'
      });
    }
    
    res.json({
      success: true,
      store: store
    });
  } catch (error) {
    console.error('获取门店详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门店详情失败'
    });
  }
});

// 创建新门店
router.post('/', async (req, res) => {
  try {
    const { name, address, phone, business_hours } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: '门店名称和地址为必填项'
      });
    }
    
    const store = await Store.create({
      name,
      address,
      phone,
      business_hours,
      rating: 0,
      review_count: 0
    });
    
    res.status(201).json({
      success: true,
      store: store
    });
  } catch (error) {
    console.error('创建门店失败:', error);
    res.status(500).json({
      success: false,
      error: '创建门店失败'
    });
  }
});

// 更新门店信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, address, phone, business_hours } = req.body;
    
    const store = await Store.update(id, {
      name,
      address,
      phone,
      business_hours
    });
    
    res.json({
      success: true,
      store: store
    });
  } catch (error) {
    console.error('更新门店失败:', error);
    res.status(500).json({
      success: false,
      error: '更新门店失败'
    });
  }
});

// 删除门店
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await Store.delete(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: '门店不存在'
      });
    }
    
    res.json({
      success: true,
      message: '门店删除成功'
    });
  } catch (error) {
    console.error('删除门店失败:', error);
    res.status(500).json({
      success: false,
      error: '删除门店失败'
    });
  }
});

// 搜索门店
router.get('/search', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词'
      });
    }
    
    const stores = await Store.findByName(name);
    
    res.json({
      success: true,
      stores: stores
    });
  } catch (error) {
    console.error('搜索门店失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索门店失败'
    });
  }
});

// 获取门店统计信息
router.get('/stats', async (req, res) => {
  try {
    const stores = await Store.getAllWithStats();
    
    res.json({
      success: true,
      stores: stores
    });
  } catch (error) {
    console.error('获取门店统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门店统计失败'
    });
  }
});

module.exports = router;