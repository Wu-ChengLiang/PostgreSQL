const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// 创建预约（不需要认证，基于用户名）
router.post('/', async (req, res) => {
  try {
    const {
      username,      // 用户名，如 NDR745651115 或 Gbj982984289
      customer_name, // 客户姓名，如 吴先生
      customer_phone,
      store_id,
      therapist_id,
      appointment_date,
      appointment_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!username || !customer_name || !customer_phone || !therapist_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['username', 'customer_name', 'customer_phone', 'therapist_id', 'appointment_date', 'appointment_time']
      });
    }
    
    // 创建预约
    const result = await db.query(
      `INSERT INTO appointments 
       (username, customer_name, customer_phone, store_id, therapist_id, 
        appointment_date, appointment_time, service_type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [username, customer_name, customer_phone, store_id, therapist_id,
       appointment_date, appointment_time, service_type, notes, 'confirmed']
    );
    
    // 获取关联信息
    const appointmentDetails = await db.query(
      `SELECT a.*, t.name as therapist_name, s.name as store_name
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json({
      success: true,
      appointment: appointmentDetails.rows[0],
      message: `预约成功！预约ID: ${result.rows[0].id}`
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// 获取用户的预约列表（基于用户名）
router.get('/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const result = await db.query(
      `SELECT a.*, t.name as therapist_name, s.name as store_name
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.username = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [username]
    );
    
    res.json({
      success: true,
      username: username,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 获取单个预约详情（验证用户名）
router.get('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const username = req.query.username || req.headers['x-username'];
    
    // 先获取预约信息
    const result = await db.query(
      `SELECT a.*, t.name as therapist_name, t.specialties, 
              s.name as store_name, s.address as store_address
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.id = $1`,
      [appointmentId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = result.rows[0];
    
    // 如果提供了用户名，验证是否为预约所有者
    if (username && appointment.username !== username) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own appointments.' 
      });
    }
    
    res.json({
      success: true,
      appointment: appointment,
      is_owner: username ? appointment.username === username : undefined
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// 取消预约（验证用户名）
router.delete('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const username = req.query.username || req.body.username || req.headers['x-username'];
    
    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required to cancel appointment' 
      });
    }
    
    // 先检查预约是否属于该用户
    const checkResult = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND username = $2',
      [appointmentId, username]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found or you do not have permission to cancel it' 
      });
    }
    
    // 取消预约
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND username = $3 RETURNING *',
      ['cancelled', appointmentId, username]
    );
    
    res.json({ 
      success: true,
      message: `预约已成功取消`,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// 更新预约状态（验证用户名）
router.put('/:id/status', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status, username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // 验证预约属于该用户
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND username = $3 RETURNING *',
      [status, appointmentId, username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Appointment not found or access denied' 
      });
    }
    
    res.json({
      success: true,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// 查询可用时间段（公开接口）
router.get('/availability/:therapistId', async (req, res) => {
  try {
    const therapistId = req.params.therapistId;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ 
        error: 'Date is required' 
      });
    }
    
    // 获取技师信息
    const therapistResult = await db.query(
      'SELECT * FROM therapists WHERE id = $1',
      [therapistId]
    );
    
    if (therapistResult.rows.length === 0) {
      return res.status(404).json({ error: 'Therapist not found' });
    }
    
    // 获取技师当天已预约的时间
    const bookedResult = await db.query(
      `SELECT appointment_time 
       FROM appointments 
       WHERE therapist_id = $1 
       AND appointment_date = $2 
       AND status != 'cancelled'
       ORDER BY appointment_time`,
      [therapistId, date]
    );
    
    const bookedTimes = bookedResult.rows.map(row => row.appointment_time);
    
    // 生成可用时间段（9:00-21:00，每小时一个时段）
    const allTimes = [];
    for (let hour = 9; hour <= 20; hour++) {
      allTimes.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    const availableTimes = allTimes.filter(time => !bookedTimes.includes(time));
    
    res.json({
      success: true,
      therapist: therapistResult.rows[0],
      date: date,
      booked_times: bookedTimes,
      available_times: availableTimes,
      total_slots: allTimes.length,
      available_slots: availableTimes.length
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

module.exports = router;