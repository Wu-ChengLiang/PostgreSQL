const express = require('express');
const router = express.Router();
const db = require('../../config/database');

// 创建预约（基于会话ID，不需要认证）
router.post('/', async (req, res) => {
  try {
    const {
      session_id,  // 会话ID，如 NDR745651115
      customer_name,
      customer_phone,
      store_id,
      therapist_id,
      appointment_date,
      appointment_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!session_id || !customer_name || !customer_phone || !therapist_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['session_id', 'customer_name', 'customer_phone', 'therapist_id', 'appointment_date', 'appointment_time']
      });
    }
    
    // 创建预约
    const result = await db.query(
      `INSERT INTO appointments 
       (session_id, customer_name, customer_phone, store_id, therapist_id, 
        appointment_date, appointment_time, service_type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [session_id, customer_name, customer_phone, store_id, therapist_id,
       appointment_date, appointment_time, service_type, notes, 'confirmed']
    );
    
    res.status(201).json({
      success: true,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// 获取会话的预约列表（基于会话ID）
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const result = await db.query(
      `SELECT a.*, t.name as therapist_name, s.name as store_name
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.session_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [sessionId]
    );
    
    res.json({
      success: true,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// 获取单个预约详情（基于会话ID验证）
router.get('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const sessionId = req.query.session_id;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const result = await db.query(
      `SELECT a.*, t.name as therapist_name, t.specialties, 
              s.name as store_name, s.address as store_address
       FROM appointments a
       LEFT JOIN therapists t ON a.therapist_id = t.id
       LEFT JOIN stores s ON a.store_id = s.id
       WHERE a.id = $1 AND a.session_id = $2`,
      [appointmentId, sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found or access denied' });
    }
    
    res.json({
      success: true,
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// 更新预约状态（基于会话ID验证）
router.put('/:id/status', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status, session_id } = req.body;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND session_id = $3 RETURNING *',
      [status, appointmentId, session_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found or access denied' });
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

// 取消预约（基于会话ID验证）
router.delete('/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const sessionId = req.query.session_id || req.body.session_id;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND session_id = $3 RETURNING *',
      ['cancelled', appointmentId, sessionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found or access denied' });
    }
    
    res.json({ 
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// 查询可用时间段（不需要认证）
router.get('/availability/check', async (req, res) => {
  try {
    const { therapist_id, date, store_id } = req.query;
    
    if (!therapist_id || !date) {
      return res.status(400).json({ 
        error: 'Therapist ID and date are required' 
      });
    }
    
    // 获取技师当天已预约的时间
    const bookedResult = await db.query(
      `SELECT appointment_time 
       FROM appointments 
       WHERE therapist_id = $1 
       AND appointment_date = $2 
       AND status != 'cancelled'
       ORDER BY appointment_time`,
      [therapist_id, date]
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
      therapist_id,
      date,
      booked_times: bookedTimes,
      available_times: availableTimes
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

module.exports = router;