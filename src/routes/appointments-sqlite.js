const express = require('express');
const router = express.Router();
const database = require('../config/database-sqlite');

// 获取所有预约
router.get('/', async (req, res) => {
  try {
    const { user_id, therapist_id, store_id, status, date } = req.query;
    
    let query = `
      SELECT 
        a.*,
        u.username as user_name,
        t.name as therapist_name,
        s.name as store_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (user_id) {
      conditions.push('a.user_id = ?');
      params.push(parseInt(user_id));
    }
    
    if (therapist_id) {
      conditions.push('a.therapist_id = ?');
      params.push(parseInt(therapist_id));
    }
    
    if (store_id) {
      conditions.push('a.store_id = ?');
      params.push(parseInt(store_id));
    }
    
    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }
    
    if (date) {
      conditions.push('a.appointment_date = ?');
      params.push(date);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
    
    const appointments = await database.all(query, params);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取预约列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取预约列表失败'
    });
  }
});

// 获取单个预约详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const appointment = await database.get(`
      SELECT 
        a.*,
        u.username as user_name,
        u.email as user_email,
        u.phone as user_phone,
        t.name as therapist_name,
        t.title as therapist_title,
        s.name as store_name,
        s.address as store_address,
        s.phone as store_phone
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      WHERE a.id = ?
    `, [id]);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: '预约不存在'
      });
    }
    
    res.json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('获取预约详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取预约详情失败'
    });
  }
});

// 创建新预约
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      username,
      customer_name,
      customer_phone,
      therapist_id,
      store_id,
      service_type,
      appointment_date,
      appointment_time,
      start_time,
      end_time,
      notes
    } = req.body;
    
    // 字段映射和转换
    let finalUserId = user_id;
    let finalStartTime = start_time || appointment_time;
    let finalEndTime = end_time;
    
    // 如果没有user_id但有username，查找用户ID
    if (!finalUserId && username) {
      const user = await database.get(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      if (user) {
        finalUserId = user.id;
      } else if (customer_name && customer_phone) {
        // 如果用户不存在但有客户信息，创建新用户
        const newUser = await database.run(
          'INSERT INTO users (username, email, phone) VALUES (?, ?, ?)',
          [customer_name, `${customer_name}@temp.com`, customer_phone]
        );
        finalUserId = newUser.lastID;
      }
    }
    
    // 如果没有end_time，默认设置为start_time + 1小时
    if (!finalEndTime && finalStartTime) {
      const startHour = parseInt(finalStartTime.split(':')[0]);
      const startMinute = parseInt(finalStartTime.split(':')[1]);
      const endHour = startHour + 1;
      finalEndTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    }
    
    // 验证必填字段
    if (!finalUserId || !therapist_id || !service_type || 
        !appointment_date || !finalStartTime || !finalEndTime) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段',
        debug: {
          user_id: finalUserId,
          therapist_id,
          service_type,
          appointment_date,
          start_time: finalStartTime,
          end_time: finalEndTime
        }
      });
    }
    
    // 如果没有store_id，从therapist获取
    let finalStoreId = store_id;
    if (!finalStoreId) {
      const therapist = await database.get(
        'SELECT store_id FROM therapists WHERE id = ?',
        [therapist_id]
      );
      if (therapist) {
        finalStoreId = therapist.store_id;
      }
    }
    
    // 再次检查用户是否存在（因为可能是新创建的）
    const user = await database.get(
      'SELECT id FROM users WHERE id = ?',
      [finalUserId]
    );
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 检查技师是否存在
    const therapist = await database.get(
      'SELECT id, store_id FROM therapists WHERE id = ?',
      [therapist_id]
    );
    
    if (!therapist) {
      return res.status(400).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 验证技师所属门店
    if (finalStoreId && therapist.store_id !== parseInt(finalStoreId)) {
      return res.status(400).json({
        success: false,
        error: '技师不属于该门店'
      });
    }
    
    // 检查时间冲突
    const conflictAppointment = await database.get(`
      SELECT id FROM appointments 
      WHERE therapist_id = ? 
        AND appointment_date = ? 
        AND start_time = ?
        AND status IN ('pending', 'confirmed')
    `, [therapist_id, appointment_date, finalStartTime]);
    
    if (conflictAppointment) {
      return res.status(409).json({
        success: false,
        error: '该时间段已被预约'
      });
    }
    
    // 如果没有store_id，使用技师的store_id
    if (!finalStoreId) {
      finalStoreId = therapist.store_id;
    }
    
    // 创建预约
    const result = await database.run(`
      INSERT INTO appointments (
        user_id, therapist_id, store_id, service_type,
        appointment_date, start_time, end_time, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
    `, [
      finalUserId,
      therapist_id,
      finalStoreId,
      service_type,
      appointment_date,
      finalStartTime,
      finalEndTime,
      notes || null
    ]);
    
    const appointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('创建预约失败:', error);
    res.status(500).json({
      success: false,
      error: '创建预约失败'
    });
  }
});

// 更新预约状态
router.put('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: '请提供状态参数'
      });
    }
    
    // 验证状态值
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值'
      });
    }
    
    // 检查预约是否存在
    const appointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: '预约不存在'
      });
    }
    
    // 更新状态
    await database.run(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );
    
    const updatedAppointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('更新预约状态失败:', error);
    res.status(500).json({
      success: false,
      error: '更新预约状态失败'
    });
  }
});

// 更新预约信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      appointment_date,
      start_time,
      end_time,
      service_type,
      notes
    } = req.body;
    
    // 检查预约是否存在
    const existingAppointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        error: '预约不存在'
      });
    }
    
    // 如果要更新时间，检查时间冲突
    if (appointment_date || start_time) {
      const checkDate = appointment_date || existingAppointment.appointment_date;
      const checkTime = start_time || existingAppointment.start_time;
      
      const conflictAppointment = await database.get(`
        SELECT id FROM appointments 
        WHERE therapist_id = ? 
          AND appointment_date = ? 
          AND start_time = ?
          AND id != ?
          AND status IN ('pending', 'confirmed')
      `, [existingAppointment.therapist_id, checkDate, checkTime, id]);
      
      if (conflictAppointment) {
        return res.status(409).json({
          success: false,
          error: '该时间段已被预约'
        });
      }
    }
    
    // 构建更新语句
    const updates = [];
    const values = [];
    
    if (appointment_date !== undefined) {
      updates.push('appointment_date = ?');
      values.push(appointment_date);
    }
    if (start_time !== undefined) {
      updates.push('start_time = ?');
      values.push(start_time);
    }
    if (end_time !== undefined) {
      updates.push('end_time = ?');
      values.push(end_time);
    }
    if (service_type !== undefined) {
      updates.push('service_type = ?');
      values.push(service_type);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供要更新的字段'
      });
    }
    
    values.push(id);
    
    await database.run(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const appointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('更新预约失败:', error);
    res.status(500).json({
      success: false,
      error: '更新预约失败'
    });
  }
});

// 取消预约
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查预约是否存在
    const appointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: '预约不存在'
      });
    }
    
    // 更新为取消状态
    await database.run(
      'UPDATE appointments SET status = ? WHERE id = ?',
      ['cancelled', id]
    );
    
    res.json({
      success: true,
      message: '预约已取消'
    });
  } catch (error) {
    console.error('取消预约失败:', error);
    res.status(500).json({
      success: false,
      error: '取消预约失败'
    });
  }
});

// 用户的预约列表
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const appointments = await database.all(`
      SELECT 
        a.*,
        t.name as therapist_name,
        s.name as store_name
      FROM appointments a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `, [userId]);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取用户预约失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户预约失败'
    });
  }
});

// 技师的预约列表
router.get('/therapist/:therapistId', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.therapistId);
    const { date } = req.query;
    
    let query = `
      SELECT 
        a.*,
        u.username as user_name,
        u.phone as user_phone
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.therapist_id = ?
    `;
    
    const params = [therapistId];
    
    if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.start_time ASC';
    
    const appointments = await database.all(query, params);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取技师预约失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师预约失败'
    });
  }
});

// 门店的预约列表
router.get('/store/:storeId', async (req, res) => {
  try {
    const storeId = parseInt(req.params.storeId);
    const { date } = req.query;
    
    let query = `
      SELECT 
        a.*,
        u.username as user_name,
        t.name as therapist_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN therapists t ON a.therapist_id = t.id
      WHERE a.store_id = ?
    `;
    
    const params = [storeId];
    
    if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }
    
    query += ' ORDER BY a.appointment_date DESC, a.start_time ASC';
    
    const appointments = await database.all(query, params);
    
    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('获取门店预约失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门店预约失败'
    });
  }
});

// 预约统计
router.get('/stats', async (req, res) => {
  try {
    const { store_id } = req.query;
    
    let storeCondition = '';
    const params = [];
    
    if (store_id) {
      storeCondition = ' WHERE store_id = ?';
      params.push(parseInt(store_id));
    }
    
    // 总体统计
    const totalStats = await database.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM appointments
      ${storeCondition}
    `, params);
    
    // 今日统计
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await database.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM appointments
      WHERE appointment_date = ?
        ${store_id ? 'AND store_id = ?' : ''}
    `, store_id ? [today, store_id] : [today]);
    
    // 服务类型统计
    const serviceStats = await database.all(`
      SELECT 
        service_type,
        COUNT(*) as count
      FROM appointments
      ${storeCondition}
      GROUP BY service_type
      ORDER BY count DESC
    `, params);
    
    res.json({
      success: true,
      stats: {
        total: totalStats,
        today: todayStats,
        by_service: serviceStats
      }
    });
  } catch (error) {
    console.error('获取预约统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取预约统计失败'
    });
  }
});

// 公开创建预约接口（基于用户名）
router.post('/public/create', async (req, res) => {
  try {
    const {
      username,
      therapist_id,
      appointment_date,
      start_time,
      end_time,
      service_type,
      notes
    } = req.body;
    
    // 验证必填字段
    if (!username || !therapist_id || !appointment_date || 
        !start_time || !end_time || !service_type) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }
    
    // 查找用户
    const user = await database.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 获取技师信息以确定门店
    const therapist = await database.get(
      'SELECT id, store_id FROM therapists WHERE id = ?',
      [therapist_id]
    );
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 检查时间冲突
    const conflictAppointment = await database.get(`
      SELECT id FROM appointments 
      WHERE therapist_id = ? 
        AND appointment_date = ? 
        AND start_time = ?
        AND status IN ('pending', 'confirmed')
    `, [therapist_id, appointment_date, start_time]);
    
    if (conflictAppointment) {
      return res.status(409).json({
        success: false,
        error: '该时间段已被预约'
      });
    }
    
    // 创建预约
    const result = await database.run(`
      INSERT INTO appointments (
        user_id, therapist_id, store_id, service_type,
        appointment_date, start_time, end_time, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'))
    `, [
      user.id,
      therapist_id,
      therapist.store_id,
      service_type,
      appointment_date,
      start_time,
      end_time,
      notes || null
    ]);
    
    const appointment = await database.get(
      'SELECT * FROM appointments WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      appointment: appointment,
      message: '预约创建成功'
    });
  } catch (error) {
    console.error('创建公开预约失败:', error);
    res.status(500).json({
      success: false,
      error: '创建预约失败'
    });
  }
});

module.exports = router;