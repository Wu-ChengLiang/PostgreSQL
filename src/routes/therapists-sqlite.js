const express = require('express');
const router = express.Router();
const database = require('../config/database-sqlite');

// 获取所有技师
router.get('/', async (req, res) => {
  try {
    const { store_id, service_type } = req.query;
    
    let query = `
      SELECT 
        t.*,
        s.name as store_name,
        s.address as store_address
      FROM therapists t
      LEFT JOIN stores s ON t.store_id = s.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (store_id) {
      conditions.push('t.store_id = ?');
      params.push(parseInt(store_id));
    }
    
    if (service_type) {
      conditions.push('t.service_types LIKE ?');
      params.push(`%${service_type}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.rating DESC, t.review_count DESC';
    
    const therapists = await database.all(query, params);
    
    res.json({
      success: true,
      therapists: therapists
    });
  } catch (error) {
    console.error('获取技师列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师列表失败'
    });
  }
});

// 获取单个技师
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const therapist = await database.get(`
      SELECT 
        t.*,
        s.name as store_name,
        s.address as store_address,
        s.phone as store_phone
      FROM therapists t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.id = ?
    `, [id]);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 获取技师的预约统计
    const appointmentStats = await database.get(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments
      FROM appointments
      WHERE therapist_id = ?
    `, [id]);
    
    therapist.appointment_stats = appointmentStats;
    
    res.json({
      success: true,
      therapist: therapist
    });
  } catch (error) {
    console.error('获取技师详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师详情失败'
    });
  }
});

// 创建新技师
router.post('/', async (req, res) => {
  try {
    const {
      name,
      store_id,
      title,
      specialties,
      service_types,
      bio,
      years_experience
    } = req.body;
    
    // 验证必填字段
    if (!name || !store_id || !service_types) {
      return res.status(400).json({
        success: false,
        error: '姓名、门店ID和服务类型为必填项'
      });
    }
    
    // 检查门店是否存在
    const store = await database.get(
      'SELECT id FROM stores WHERE id = ?',
      [store_id]
    );
    
    if (!store) {
      return res.status(400).json({
        success: false,
        error: '指定的门店不存在'
      });
    }
    
    const result = await database.run(`
      INSERT INTO therapists (
        name, store_id, title, specialties, service_types, 
        bio, rating, review_count, years_experience
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      store_id,
      title || null,
      specialties || null,
      service_types,
      bio || null,
      0,
      0,
      years_experience || 0
    ]);
    
    const therapist = await database.get(
      'SELECT * FROM therapists WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({
      success: true,
      therapist: therapist
    });
  } catch (error) {
    console.error('创建技师失败:', error);
    res.status(500).json({
      success: false,
      error: '创建技师失败'
    });
  }
});

// 更新技师信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      store_id,
      title,
      specialties,
      service_types,
      bio,
      years_experience
    } = req.body;
    
    // 检查技师是否存在
    const existingTherapist = await database.get(
      'SELECT * FROM therapists WHERE id = ?',
      [id]
    );
    
    if (!existingTherapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 如果要更新门店，检查新门店是否存在
    if (store_id) {
      const store = await database.get(
        'SELECT id FROM stores WHERE id = ?',
        [store_id]
      );
      
      if (!store) {
        return res.status(400).json({
          success: false,
          error: '指定的门店不存在'
        });
      }
    }
    
    // 构建更新语句
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (store_id !== undefined) {
      updates.push('store_id = ?');
      values.push(store_id);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (specialties !== undefined) {
      updates.push('specialties = ?');
      values.push(specialties);
    }
    if (service_types !== undefined) {
      updates.push('service_types = ?');
      values.push(service_types);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (years_experience !== undefined) {
      updates.push('years_experience = ?');
      values.push(years_experience);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有提供要更新的字段'
      });
    }
    
    values.push(id);
    
    await database.run(
      `UPDATE therapists SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const therapist = await database.get(
      'SELECT * FROM therapists WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      therapist: therapist
    });
  } catch (error) {
    console.error('更新技师失败:', error);
    res.status(500).json({
      success: false,
      error: '更新技师失败'
    });
  }
});

// 删除技师
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查技师是否存在
    const therapist = await database.get(
      'SELECT * FROM therapists WHERE id = ?',
      [id]
    );
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 检查是否有关联的预约
    const appointmentCount = await database.get(
      'SELECT COUNT(*) as count FROM appointments WHERE therapist_id = ? AND status != ?',
      [id, 'cancelled']
    );
    
    if (appointmentCount.count > 0) {
      return res.status(400).json({
        success: false,
        error: '该技师还有未完成的预约，无法删除'
      });
    }
    
    await database.run(
      'DELETE FROM therapists WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: '技师删除成功'
    });
  } catch (error) {
    console.error('删除技师失败:', error);
    res.status(500).json({
      success: false,
      error: '删除技师失败'
    });
  }
});

// 搜索技师
router.get('/search', async (req, res) => {
  try {
    const { name, service_type } = req.query;
    
    if (!name && !service_type) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索条件'
      });
    }
    
    let query = `
      SELECT 
        t.*,
        s.name as store_name,
        s.address as store_address
      FROM therapists t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (name) {
      query += ' AND t.name LIKE ?';
      params.push(`%${name}%`);
    }
    
    if (service_type) {
      query += ' AND t.service_types LIKE ?';
      params.push(`%${service_type}%`);
    }
    
    query += ' ORDER BY t.rating DESC, t.review_count DESC';
    
    const therapists = await database.all(query, params);
    
    res.json({
      success: true,
      therapists: therapists
    });
  } catch (error) {
    console.error('搜索技师失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索技师失败'
    });
  }
});

// 获取技师可用时间
router.get('/:id/availability', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: '请提供日期参数'
      });
    }
    
    // 获取技师信息
    const therapist = await database.get(
      'SELECT * FROM therapists WHERE id = ?',
      [id]
    );
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 获取该日期的所有预约
    const appointments = await database.all(`
      SELECT start_time, end_time 
      FROM appointments 
      WHERE therapist_id = ? 
        AND appointment_date = ? 
        AND status IN ('confirmed', 'pending')
      ORDER BY start_time
    `, [id, date]);
    
    // 生成可用时间段（假设工作时间为9:00-21:00，每个时间段1小时）
    const workingHours = [];
    for (let hour = 9; hour < 21; hour++) {
      workingHours.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`,
        available: true
      });
    }
    
    // 标记已被预约的时间段
    appointments.forEach(appointment => {
      workingHours.forEach(slot => {
        if (slot.start === appointment.start_time) {
          slot.available = false;
        }
      });
    });
    
    res.json({
      success: true,
      therapist_id: id,
      date: date,
      availability: workingHours
    });
  } catch (error) {
    console.error('获取技师可用时间失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师可用时间失败'
    });
  }
});

// 获取技师可用时间
router.get('/:id/availability', async (req, res) => {
  try {
    const therapistId = parseInt(req.params.id);
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: '需要提供日期参数'
      });
    }
    
    // 检查技师是否存在
    const therapist = await database.get(
      'SELECT id, name FROM therapists WHERE id = ?',
      [therapistId]
    );
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: '技师不存在'
      });
    }
    
    // 获取该技师在指定日期的预约
    const appointments = await database.all(`
      SELECT start_time, end_time 
      FROM appointments 
      WHERE therapist_id = ? 
        AND appointment_date = ?
        AND status IN ('pending', 'confirmed')
      ORDER BY start_time
    `, [therapistId, date]);
    
    // 生成可用时间段（9:00-21:00，每小时一个时段）
    const allTimeSlots = [];
    for (let hour = 9; hour < 21; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      allTimeSlots.push({
        start_time: startTime,
        end_time: endTime,
        available: true
      });
    }
    
    // 标记已预约的时间段为不可用
    appointments.forEach(appointment => {
      const startHour = parseInt(appointment.start_time.split(':')[0]);
      const endHour = parseInt(appointment.end_time.split(':')[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const slotIndex = hour - 9;
        if (slotIndex >= 0 && slotIndex < allTimeSlots.length) {
          allTimeSlots[slotIndex].available = false;
        }
      }
    });
    
    res.json({
      success: true,
      therapist: {
        id: therapist.id,
        name: therapist.name
      },
      date: date,
      timeSlots: allTimeSlots
    });
  } catch (error) {
    console.error('获取技师可用时间失败:', error);
    res.status(500).json({
      success: false,
      error: '获取技师可用时间失败'
    });
  }
});

module.exports = router;