const express = require('express');
const router = express.Router();
const database = require('../config/database-sqlite');

// 获取所有门店
router.get('/', async (req, res) => {
  try {
    const stores = await database.all(`
      SELECT * FROM stores 
      ORDER BY rating DESC, review_count DESC
    `);
    
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
    
    // 获取门店基本信息
    const store = await database.get(
      'SELECT * FROM stores WHERE id = ?',
      [id]
    );
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: '门店不存在'
      });
    }
    
    // 获取门店的技师数量
    const therapistCount = await database.get(
      'SELECT COUNT(*) as count FROM therapists WHERE store_id = ?',
      [id]
    );
    
    store.therapist_count = therapistCount.count;
    
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
    
    const result = await database.run(
      `INSERT INTO stores (name, address, phone, business_hours, rating, review_count) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address, phone || null, business_hours || null, 0, 0]
    );
    
    const store = await database.get(
      'SELECT * FROM stores WHERE id = ?',
      [result.lastID]
    );
    
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
    
    // 检查门店是否存在
    const existingStore = await database.get(
      'SELECT * FROM stores WHERE id = ?',
      [id]
    );
    
    if (!existingStore) {
      return res.status(404).json({
        success: false,
        error: '门店不存在'
      });
    }
    
    // 构建更新语句
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (business_hours !== undefined) {
      updates.push('business_hours = ?');
      values.push(business_hours);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供要更新的字段'
      });
    }
    
    values.push(id);
    
    await database.run(
      `UPDATE stores SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const store = await database.get(
      'SELECT * FROM stores WHERE id = ?',
      [id]
    );
    
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
    
    // 检查门店是否存在
    const store = await database.get(
      'SELECT * FROM stores WHERE id = ?',
      [id]
    );
    
    if (!store) {
      return res.status(404).json({
        success: false,
        error: '门店不存在'
      });
    }
    
    // 检查是否有关联的技师
    const therapistCount = await database.get(
      'SELECT COUNT(*) as count FROM therapists WHERE store_id = ?',
      [id]
    );
    
    if (therapistCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: '该门店下还有技师，无法删除'
      });
    }
    
    await database.run(
      'DELETE FROM stores WHERE id = ?',
      [id]
    );
    
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
    
    const stores = await database.all(
      `SELECT * FROM stores 
       WHERE name LIKE ? 
       ORDER BY rating DESC, review_count DESC`,
      [`%${name}%`]
    );
    
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
    const stores = await database.all(`
      SELECT 
        s.*,
        COUNT(DISTINCT t.id) as therapist_count,
        COUNT(DISTINCT a.id) as appointment_count,
        AVG(t.rating) as avg_therapist_rating
      FROM stores s
      LEFT JOIN therapists t ON s.id = t.store_id
      LEFT JOIN appointments a ON s.id = a.store_id
      GROUP BY s.id
      ORDER BY s.rating DESC
    `);
    
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