const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticate } = require('../middleware/auth');

// 创建预约（需要认证）
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      therapist_id,
      appointment_date,
      appointment_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!customer_name || !customer_phone || !therapist_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 创建预约
    const result = await db.query(
      `INSERT INTO appointments 
       (customer_name, customer_phone, therapist_id, 
        appointment_date, appointment_time, service_type, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [customer_name, customer_phone, therapist_id,
       appointment_date, appointment_time, service_type, notes, req.userId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// 获取预约列表（需要认证）
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM appointments WHERE user_id = $1 ORDER BY appointment_date DESC, appointment_time DESC',
      [req.userId]
    );
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
    
    const result = await db.query(
      'SELECT * FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, req.userId]
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
    
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, appointmentId, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// 取消预约（需要认证）
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    const result = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      ['cancelled', appointmentId, req.userId]
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

module.exports = router;