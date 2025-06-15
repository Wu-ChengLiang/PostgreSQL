const express = require('express');
const router = express.Router();
const pool = require('../../config/database');

// Function Call API: 检查技师可用性
router.post('/check-availability', async (req, res) => {
  try {
    const { store_name, therapist_name, appointment_date, appointment_time } = req.body;
    
    // 验证必填字段
    if (!store_name || !therapist_name || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: store_name, therapist_name, appointment_date, appointment_time' 
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM check_availability($1, $2, $3, $4)',
      [store_name, therapist_name, appointment_date, appointment_time]
    );
    
    const availability = result.rows[0];
    
    res.json({
      success: true,
      is_available: availability.is_available,
      therapist_info: availability.therapist_info,
      conflict_reason: availability.conflict_reason
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check availability',
      details: error.message 
    });
  }
});

// Function Call API: 创建预约
router.post('/create-appointment', async (req, res) => {
  try {
    const {
      store_name,
      therapist_name,
      customer_name,
      customer_phone,
      appointment_date,
      appointment_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!store_name || !therapist_name || !customer_name || !customer_phone || 
        !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }
    
    // 验证电话号码格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(customer_phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }
    
    const result = await pool.query(
      'SELECT * FROM create_appointment($1, $2, $3, $4, $5, $6, $7, $8)',
      [store_name, therapist_name, customer_name, customer_phone, 
       appointment_date, appointment_time, service_type, notes]
    );
    
    const appointment = result.rows[0];
    
    res.json({
      success: appointment.success,
      appointment_id: appointment.appointment_id,
      message: appointment.message
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create appointment',
      details: error.message 
    });
  }
});

// Function Call API: 获取技师今日和明日预约
router.post('/get-therapist-appointments', async (req, res) => {
  try {
    const { therapist_name, store_name } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM get_therapist_appointments($1, $2)',
      [therapist_name, store_name]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching therapist appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch therapist appointments',
      details: error.message 
    });
  }
});

// Function Call API: 查询技师列表
router.post('/search-therapists', async (req, res) => {
  try {
    const { store_name, therapist_name, specialties } = req.body;
    
    let query = `
      SELECT 
        t.id,
        t.name,
        t.gender,
        t.title,
        t.phone,
        t.years_of_experience,
        t.rating_count,
        t.service_count,
        t.is_recommended,
        s.name as store_name,
        s.address as store_address,
        array_agg(DISTINCT ts.specialty) as specialties
      FROM therapists t
      JOIN stores s ON t.store_id = s.id
      LEFT JOIN therapist_specialties ts ON t.id = ts.therapist_id
      WHERE t.status = 'active'
    `;
    
    const params = [];
    
    if (store_name) {
      params.push(store_name);
      query += ` AND s.name ILIKE '%' || $${params.length} || '%'`;
    }
    
    if (therapist_name) {
      params.push(therapist_name);
      query += ` AND t.name ILIKE '%' || $${params.length} || '%'`;
    }
    
    if (specialties && specialties.length > 0) {
      query += ` AND EXISTS (
        SELECT 1 FROM therapist_specialties ts2 
        WHERE ts2.therapist_id = t.id 
        AND ts2.specialty = ANY($${params.length + 1})
      )`;
      params.push(specialties);
    }
    
    query += ` GROUP BY t.id, s.name, s.address 
               ORDER BY t.is_recommended DESC, t.rating_count DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      therapists: result.rows
    });
  } catch (error) {
    console.error('Error searching therapists:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search therapists',
      details: error.message 
    });
  }
});

// Function Call API: 获取门店列表
router.get('/stores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.address,
        s.phone,
        s.business_hours,
        s.status,
        COUNT(DISTINCT t.id) as therapist_count
      FROM stores s
      LEFT JOIN therapists t ON s.id = t.store_id AND t.status = 'active'
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY s.name
    `);
    
    res.json({
      success: true,
      count: result.rows.length,
      stores: result.rows
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch stores',
      details: error.message 
    });
  }
});

// Function Call API: 取消预约
router.post('/cancel-appointment', async (req, res) => {
  try {
    const { appointment_id, customer_phone } = req.body;
    
    if (!appointment_id || !customer_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: appointment_id, customer_phone'
      });
    }
    
    // 验证预约归属
    const checkResult = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND customer_phone = $2 AND status != $3',
      [appointment_id, customer_phone, 'cancelled']
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found or already cancelled'
      });
    }
    
    // 取消预约
    await pool.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', appointment_id]
    );
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to cancel appointment',
      details: error.message 
    });
  }
});

// Function Call API: 查询客户预约记录
router.post('/get-customer-appointments', async (req, res) => {
  try {
    const { customer_phone, status, date_from, date_to } = req.body;
    
    if (!customer_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: customer_phone'
      });
    }
    
    let query = `
      SELECT 
        a.id as appointment_id,
        a.customer_name,
        a.customer_phone,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.service_type,
        a.status,
        a.notes,
        t.name as therapist_name,
        t.gender as therapist_gender,
        t.title as therapist_title,
        s.name as store_name,
        s.address as store_address
      FROM appointments a
      JOIN therapists t ON a.therapist_id = t.id
      JOIN stores s ON a.store_id = s.id
      WHERE a.customer_phone = $1
    `;
    
    const params = [customer_phone];
    
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    
    if (date_from) {
      params.push(date_from);
      query += ` AND a.appointment_date >= $${params.length}`;
    }
    
    if (date_to) {
      params.push(date_to);
      query += ` AND a.appointment_date <= $${params.length}`;
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      appointments: result.rows
    });
  } catch (error) {
    console.error('Error fetching customer appointments:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch customer appointments',
      details: error.message 
    });
  }
});

module.exports = router;