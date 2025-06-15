const BaseModel = require('./BaseModel');

class Appointment extends BaseModel {
  constructor() {
    super('appointments');
  }

  // 查询用户的预约
  async findByUser(userId) {
    const sql = `
      SELECT 
        a.*,
        t.name as therapist_name,
        t.title as therapist_title,
        s.name as store_name,
        s.address as store_address
      FROM ${this.tableName} a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `;
    return await this.db.all(sql, [userId]);
  }

  // 查询技师的预约
  async findByTherapist(therapistId, date = null) {
    let sql = `
      SELECT 
        a.*,
        u.username as user_name,
        u.phone as user_phone
      FROM ${this.tableName} a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.therapist_id = ?
    `;
    
    const params = [therapistId];
    
    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
    
    return await this.db.all(sql, params);
  }

  // 查询门店的预约
  async findByStore(storeId, date = null) {
    let sql = `
      SELECT 
        a.*,
        t.name as therapist_name,
        u.username as user_name
      FROM ${this.tableName} a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.store_id = ?
    `;
    
    const params = [storeId];
    
    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }
    
    sql += ' ORDER BY a.appointment_date DESC, a.start_time DESC';
    
    return await this.db.all(sql, params);
  }

  // 检查时间冲突
  async checkTimeConflict(therapistId, date, startTime, endTime, excludeId = null) {
    let sql = `
      SELECT COUNT(*) as count
      FROM ${this.tableName}
      WHERE therapist_id = ?
        AND appointment_date = ?
        AND status IN ('confirmed', 'pending')
        AND (
          (start_time < ? AND end_time > ?)
          OR (start_time < ? AND end_time > ?)
          OR (start_time >= ? AND end_time <= ?)
        )
    `;
    
    const params = [therapistId, date, endTime, startTime, endTime, endTime, startTime, endTime];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await this.db.get(sql, params);
    return result.count > 0;
  }

  // 创建预约
  async createAppointment(data) {
    // 检查时间冲突
    const hasConflict = await this.checkTimeConflict(
      data.therapist_id,
      data.appointment_date,
      data.start_time,
      data.end_time
    );
    
    if (hasConflict) {
      throw new Error('该时间段已被预约');
    }
    
    // 设置默认状态
    data.status = data.status || 'pending';
    
    return await this.create(data);
  }

  // 更新预约状态
  async updateStatus(id, status) {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error('无效的预约状态');
    }
    
    return await this.update(id, { status });
  }

  // 取消预约
  async cancel(id) {
    return await this.updateStatus(id, 'cancelled');
  }

  // 确认预约
  async confirm(id) {
    return await this.updateStatus(id, 'confirmed');
  }

  // 完成预约
  async complete(id) {
    return await this.updateStatus(id, 'completed');
  }

  // 获取预约统计
  async getStats(storeId = null) {
    let sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM ${this.tableName}
    `;
    
    const params = [];
    
    if (storeId) {
      sql += ' WHERE store_id = ?';
      params.push(storeId);
    }
    
    return await this.db.get(sql, params);
  }

  // 获取日期范围内的预约
  async findByDateRange(startDate, endDate, storeId = null) {
    let sql = `
      SELECT 
        a.*,
        t.name as therapist_name,
        s.name as store_name,
        u.username as user_name
      FROM ${this.tableName} a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.appointment_date BETWEEN ? AND ?
    `;
    
    const params = [startDate, endDate];
    
    if (storeId) {
      sql += ' AND a.store_id = ?';
      params.push(storeId);
    }
    
    sql += ' ORDER BY a.appointment_date, a.start_time';
    
    return await this.db.all(sql, params);
  }
}

module.exports = new Appointment();