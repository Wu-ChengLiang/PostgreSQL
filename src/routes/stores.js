const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

// 获取所有分店
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stores WHERE status = $1 ORDER BY name',
      ['active']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// 获取单个分店详情（包含技师信息）
router.get('/:id', async (req, res) => {
  try {
    const storeId = req.params.id;
    
    // 获取分店信息
    const storeResult = await pool.query(
      'SELECT * FROM stores WHERE id = $1',
      [storeId]
    );
    
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // 获取该分店的技师信息
    const therapistsResult = await pool.query(
      `SELECT t.*, array_agg(ts.specialty) as specialties
       FROM therapists t
       LEFT JOIN therapist_specialties ts ON t.id = ts.therapist_id
       WHERE t.store_id = $1 AND t.status = 'active'
       GROUP BY t.id
       ORDER BY t.name`,
      [storeId]
    );
    
    const store = storeResult.rows[0];
    store.therapists = therapistsResult.rows;
    
    res.json(store);
  } catch (error) {
    console.error('Error fetching store details:', error);
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
});

// 搜索分店
router.get('/search/:keyword', async (req, res) => {
  try {
    const keyword = req.params.keyword;
    const result = await pool.query(
      `SELECT * FROM stores 
       WHERE name ILIKE $1 AND status = 'active'
       ORDER BY name`,
      [`%${keyword}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching stores:', error);
    res.status(500).json({ error: 'Failed to search stores' });
  }
});

module.exports = router;