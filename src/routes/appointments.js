const express = require('express');
const router = express.Router();
const pool = require('../../config/database');
const { authenticate } = require('../middleware/auth');

// 创建预约（需要认证）
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      customer_name,
      customer_phone,
      store_id,
      therapist_id,
      appointment_date,
      appointment_time,
      duration_minutes,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!customer_name || !customer_phone || !therapist_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 检查技师是否可用
    const therapistResult = await client.query(
      'SELECT name FROM therapists WHERE id = $1',
      [therapist_id]
    );
    
    if (therapistResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    const availabilityResult = await client.query(
      'SELECT * FROM check_therapist_availability($1, $2, $3)',
      [therapistResult.rows[0].name, appointment_date, appointment_time]
    );
    
    if (!availabilityResult.rows[0].is_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Therapist is not available at this time' });
    }
    
    // 创建预约
    const result = await client.query(
      `INSERT INTO appointments 
       (customer_name, customer_phone, store_id, therapist_id, 
        appointment_date, appointment_time, duration_minutes, 
        service_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [customer_name, customer_phone, store_id || availabilityResult.rows[0].store_id,
       therapist_id, appointment_date, appointment_time, 
       duration_minutes || 60, service_type, notes]
    );
    
    await client.query('COMMIT');
    
    // 获取完整的预约信息
    const appointmentResult = await pool.query(
      'SELECT * FROM appointment_details WHERE appointment_id = $1',
      [result.rows[0].id]
    );
    
    res.status(201).json(appointmentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  } finally {
    client.release();
  }
});

// 获取用户的预约列表（需要认证）
router.get('/my-appointments', authenticate, async (req, res) => {
  try {
    const { status, start_date, end_date } = req.query;
    const userEmail = req.user.email; // 从JWT token获取
    
    let query = `
      SELECT * FROM appointment_details 
      WHERE customer_phone IN (
        SELECT phone FROM users WHERE email = $1
      )
    `;
    
    const params = [userEmail];
    
    if (status) {
      params.push(status);
      query += ` AND appointment_status = $${params.length}`;
    }
    
    if (start_date) {
      params.push(start_date);
      query += ` AND appointment_date >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      query += ` AND appointment_date <= $${params.length}`;
    }
    
    query += ' ORDER BY appointment_date DESC, appointment_time DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 获取所有预约（管理员功能，需要认证）
router.get('/', authenticate, async (req, res) => {
  try {
    const { store_id, therapist_id, status, date } = req.query;
    
    let query = 'SELECT * FROM appointment_details WHERE 1=1';
    const params = [];
    
    if (store_id) {
      params.push(store_id);
      query += ` AND store_id = $${params.length}`;
    }
    
    if (therapist_id) {
      params.push(therapist_id);
      query += ` AND therapist_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND appointment_status = $${params.length}`;
    }
    
    if (date) {
      params.push(date);
      query += ` AND appointment_date = $${params.length}`;
    }
    
    query += ' ORDER BY appointment_date DESC, appointment_time DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 获取单个预约详情（需要认证）
router.get('/:id', authenticate, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    const result = await pool.query(
      'SELECT * FROM appointment_details WHERE appointment_id = $1',
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// 更新预约状态（需要认证）
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // 获取更新后的完整信息
    const appointmentResult = await pool.query(
      'SELECT * FROM appointment_details WHERE appointment_id = $1',
      [appointmentId]
    );
    
    res.json(appointmentResult.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// 取消预约（需要认证）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['cancelled', appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// 智能预约助手（处理自然语言查询）
router.post('/assistant', async (req, res) => {
  try {
    const { message } = req.body;
    
    // 解析消息内容
    let response = {
      message: message,
      suggestions: [],
      available_therapists: []
    };
    
    // 提取日期和时间信息
    const timeMatch = message.match(/(\d{1,2}):?(\d{0,2})/);
    let appointmentTime = null;
    if (timeMatch) {
      const hours = timeMatch[1].padStart(2, '0');
      const minutes = timeMatch[2] || '00';
      appointmentTime = `${hours}:${minutes}`;
    }
    
    // 提取日期（如果没有指定，默认今天）
    const today = new Date().toISOString().split('T')[0];
    const appointmentDate = today; // 可以扩展支持更多日期格式
    
    // 解析搜索词
    let therapistName = '';
    let storeName = '';
    
    // 提取技师名称模式（如：王老师、陈老师等）
    const nameMatch = message.match(/([张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢唐许韩冯邓曹彭曾萧田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃河顾孔向汤][老师|师傅|医生|师]*)/);
    if (nameMatch) {
      therapistName = nameMatch[0];
    }
    
    // 提取分店信息（如：东方路店、静安寺店等）
    const storeMatch = message.match(/([\u4e00-\u9fa5]+店)/);
    if (storeMatch) {
      storeName = storeMatch[0];
    }
    
    // 构建查询条件
    let queryConditions = ["t.status = 'active'"];
    let queryParams = [];
    
    if (therapistName) {
      queryParams.push(`%${therapistName}%`);
      queryConditions.push(`t.name ILIKE $${queryParams.length}`);
    }
    
    if (storeName) {
      queryParams.push(`%${storeName}%`);
      queryConditions.push(`s.name ILIKE $${queryParams.length}`);
    }
    
    // 如果没有任何搜索条件，返回空结果
    if (queryParams.length === 0) {
      response.suggestions.push({
        type: 'no_criteria',
        message: '请提供技师姓名或分店信息'
      });
      return res.json(response);
    }
    
    // 搜索技师
    const searchResult = await pool.query(
      `SELECT t.*, s.name as store_name, 
              array_agg(DISTINCT ts.specialty) as specialties
       FROM therapists t
       JOIN stores s ON t.store_id = s.id
       LEFT JOIN therapist_specialties ts ON t.id = ts.therapist_id
       WHERE ${queryConditions.join(' AND ')}
       GROUP BY t.id, s.name
       ORDER BY s.name, t.name`,
      queryParams
    );
    
    // 检查每个技师的可用性
    for (let therapist of searchResult.rows) {
      if (appointmentTime) {
        const availabilityResult = await pool.query(
          'SELECT * FROM check_therapist_availability($1, $2, $3)',
          [therapist.name, appointmentDate, appointmentTime]
        );
        therapist.availability = availabilityResult.rows[0];
      }
    }
    
    response.available_therapists = searchResult.rows;
    
    // 生成建议
    if (searchResult.rows.length > 0) {
      response.suggestions.push({
        type: 'therapists_found',
        count: searchResult.rows.length,
        message: `找到 ${searchResult.rows.length} 位符合条件的技师`
      });
      
      if (appointmentTime) {
        const availableCount = searchResult.rows.filter(t => t.availability?.is_available).length;
        response.suggestions.push({
          type: 'availability',
          message: `其中 ${availableCount} 位技师在 ${appointmentDate} ${appointmentTime} 可以预约`
        });
      }
    } else {
      response.suggestions.push({
        type: 'no_results',
        message: '没有找到符合条件的技师，请尝试其他搜索条件'
      });
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error in appointment assistant:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

module.exports = router;