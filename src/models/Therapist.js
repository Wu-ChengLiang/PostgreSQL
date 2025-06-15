const BaseModel = require('./BaseModel');

class Therapist extends BaseModel {
  constructor() {
    super('therapists');
  }

  // 按名称查询技师
  async findByName(name) {
    const sql = `
      SELECT t.*, s.name as store_name, s.address as store_address
      FROM ${this.tableName} t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.name LIKE ?
      ORDER BY t.rating DESC
    `;
    return await this.db.all(sql, [`%${name}%`]);
  }

  // 按门店查询技师
  async findByStore(storeId) {
    const sql = `
      SELECT t.*, s.name as store_name, s.address as store_address
      FROM ${this.tableName} t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.store_id = ?
      ORDER BY t.rating DESC
    `;
    return await this.db.all(sql, [storeId]);
  }

  // 按门店名称查询技师
  async findByStoreName(storeName) {
    const sql = `
      SELECT t.*, s.name as store_name, s.address as store_address
      FROM ${this.tableName} t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE s.name LIKE ?
      ORDER BY t.rating DESC
    `;
    return await this.db.all(sql, [`%${storeName}%`]);
  }

  // 按服务类型查询技师
  async findByServiceType(serviceType) {
    const sql = `
      SELECT t.*, s.name as store_name, s.address as store_address
      FROM ${this.tableName} t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.service_types LIKE ?
      ORDER BY t.rating DESC
    `;
    return await this.db.all(sql, [`%${serviceType}%`]);
  }

  // 获取技师详细信息（包含门店信息）
  async getDetailById(id) {
    const sql = `
      SELECT 
        t.*,
        s.name as store_name,
        s.address as store_address,
        s.phone as store_phone,
        s.business_hours as store_business_hours
      FROM ${this.tableName} t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.id = ?
    `;
    return await this.db.get(sql, [id]);
  }

  // 获取技师的可用时间
  async getAvailableSlots(therapistId, date) {
    // 获取技师当天的所有预约
    const sql = `
      SELECT start_time, end_time
      FROM appointments
      WHERE therapist_id = ? 
        AND appointment_date = ?
        AND status IN ('confirmed', 'pending')
      ORDER BY start_time
    `;
    const appointments = await this.db.all(sql, [therapistId, date]);
    
    // 生成可用时间段（9:00-21:00，每小时一个时段）
    const allSlots = [];
    for (let hour = 9; hour < 21; hour++) {
      allSlots.push({
        start: `${hour.toString().padStart(2, '0')}:00`,
        end: `${(hour + 1).toString().padStart(2, '0')}:00`
      });
    }
    
    // 过滤出未被预约的时段
    const availableSlots = allSlots.filter(slot => {
      return !appointments.some(apt => 
        apt.start_time === slot.start && apt.end_time === slot.end
      );
    });
    
    return availableSlots;
  }

  // 更新技师评分
  async updateRating(id, rating, reviewCount) {
    return await this.update(id, { rating, review_count: reviewCount });
  }

  // 创建技师时处理JSON字段
  async create(data) {
    // 将数组转换为JSON字符串
    if (Array.isArray(data.specialties)) {
      data.specialties = JSON.stringify(data.specialties);
    }
    if (Array.isArray(data.service_types)) {
      data.service_types = JSON.stringify(data.service_types);
    }
    return await super.create(data);
  }

  // 更新技师时处理JSON字段
  async update(id, data) {
    // 将数组转换为JSON字符串
    if (Array.isArray(data.specialties)) {
      data.specialties = JSON.stringify(data.specialties);
    }
    if (Array.isArray(data.service_types)) {
      data.service_types = JSON.stringify(data.service_types);
    }
    return await super.update(id, data);
  }
}

module.exports = new Therapist();