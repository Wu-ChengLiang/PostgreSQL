const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

// 获取所有技师或查询排班
router.get('/', async (req, res) => {
  try {
    const { store_id, specialty, action, therapist_name, store_name, date, service_type } = req.query;
    
    // 处理查询排班的特殊action
    if (action === 'query_schedule') {
      try {
        console.log('Query schedule params:', { therapist_name, store_name, service_type });
        // 使用数据库中的 get_therapist_appointments 函数
        const result = await pool.query(
          'SELECT * FROM get_therapist_appointments($1, $2, $3)',
          [therapist_name || null, store_name || null, service_type || null]
        );
        console.log('Query result:', result);
        
        // 如果没有结果，返回空数组
        if (!result || !result.rows || result.rows.length === 0) {
          return res.json({
            action: 'query_schedule',
            therapists: [],
            date: date || new Date().toISOString().split('T')[0]
          });
        }
        
        return res.json({
          action: 'query_schedule',
          therapists: result.rows,
          date: date || new Date().toISOString().split('T')[0]
        });
      } catch (err) {
        console.error('Query schedule error:', err);
        return res.status(400).json({ error: 'Failed to query therapist schedule' });
      }
    }
    
    // 原有的获取技师列表逻辑
    let query = `
      SELECT t.*, s.name as store_name, 
             array_agg(DISTINCT ts.specialty) as specialties
      FROM therapists t
      JOIN stores s ON t.store_id = s.id
      LEFT JOIN therapist_specialties ts ON t.id = ts.therapist_id
      WHERE t.status = 'active'
    `;
    
    const params = [];
    if (store_id) {
      params.push(store_id);
      query += ` AND t.store_id = $${params.length}`;
    }
    
    // 支持specialty或service_type参数
    const specialtyParam = specialty || service_type;
    if (specialtyParam) {
      params.push(specialtyParam);
      query += ` AND EXISTS (
        SELECT 1 FROM therapist_specialties ts2 
        WHERE ts2.therapist_id = t.id AND ts2.specialty ILIKE $${params.length}
      )`;
    }
    
    query += ' GROUP BY t.id, s.name ORDER BY t.name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ error: 'Failed to fetch therapists' });
  }
});

// 搜索技师（支持自然语言查询）
router.post('/search', async (req, res) => {
  try {
    const { query: searchQuery, date, time } = req.body;
    
    // 解析查询中的技师名称和职位
    let therapistName = '';
    let position = '';
    
    // 提取技师名称（如：王老师、陈老师等）
    const nameMatch = searchQuery.match(/([张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃河顾孔向汤][老师|师傅|医生|师])/);
    if (nameMatch) {
      therapistName = nameMatch[0];
    }
    
    // 提取职位信息（如：副店长、主管等）
    const positionMatch = searchQuery.match(/(副店长|店长|主管|经理)/);
    if (positionMatch) {
      position = positionMatch[0];
    }
    
    // 构建查询
    let sqlQuery = `
      SELECT t.*, s.name as store_name, 
             array_agg(DISTINCT ts.specialty) as specialties
      FROM therapists t
      JOIN stores s ON t.store_id = s.id
      LEFT JOIN therapist_specialties ts ON t.id = ts.therapist_id
      WHERE t.status = 'active'
    `;
    
    const params = [];
    if (therapistName) {
      params.push(`%${therapistName}%`);
      sqlQuery += ` AND t.name ILIKE $${params.length}`;
    }
    
    if (position) {
      params.push(`%${position}%`);
      sqlQuery += ` AND t."position" ILIKE $${params.length}`;
    }
    
    sqlQuery += ' GROUP BY t.id, s.name';
    
    const result = await pool.query(sqlQuery, params);
    
    // 如果提供了日期和时间，检查可用性
    if (date && time && result.rows.length > 0) {
      for (let therapist of result.rows) {
        const availabilityResult = await pool.query(
          `SELECT * FROM check_therapist_availability($1, $2, $3)`,
          [therapist.name, date, time]
        );
        therapist.availability = availabilityResult.rows[0];
      }
    }
    
    res.json({
      query: searchQuery,
      therapists: result.rows,
      parsed: {
        therapistName,
        position,
        date,
        time
      }
    });
  } catch (error) {
    console.error('Error searching therapists:', error);
    res.status(500).json({ error: 'Failed to search therapists' });
  }
});

// 获取技师排班
router.get('/:id/schedule', async (req, res) => {
  try {
    const therapistId = req.params.id;
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT * FROM schedules 
      WHERE therapist_id = $1
    `;
    
    const params = [therapistId];
    
    if (start_date) {
      params.push(start_date);
      query += ` AND date >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND date <= $${params.length}`;
    }
    
    query += ' ORDER BY date, start_time';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// 生成技师排班
router.post('/:id/schedule', async (req, res) => {
  try {
    const therapistId = req.params.id;
    const { start_date, end_date, start_time, end_time } = req.body;
    
    await pool.query(
      'CALL generate_weekly_schedule($1, $2, $3, $4, $5)',
      [therapistId, start_date, end_date, start_time || '09:00', end_time || '21:00']
    );
    
    res.json({ message: 'Schedule generated successfully' });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// 检查技师可用性
router.post('/:id/availability', async (req, res) => {
  try {
    const therapistId = req.params.id;
    const { date, time } = req.body;
    
    // 获取技师信息
    const therapistResult = await pool.query(
      'SELECT name FROM therapists WHERE id = $1',
      [therapistId]
    );
    
    if (therapistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    const therapistName = therapistResult.rows[0].name;
    
    // 检查可用性
    const result = await pool.query(
      'SELECT * FROM check_therapist_availability($1, $2, $3)',
      [therapistName, date, time]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

module.exports = router;