const BaseModel = require('./BaseModel');

class Store extends BaseModel {
  constructor() {
    super('stores');
  }

  // 门店特定的方法
  async findByName(name) {
    const sql = `SELECT * FROM ${this.tableName} WHERE name LIKE ?`;
    return await this.db.all(sql, [`%${name}%`]);
  }

  async updateRating(id, rating, reviewCount) {
    return await this.update(id, { rating, review_count: reviewCount });
  }

  async getWithTherapistCount(id) {
    const sql = `
      SELECT s.*, COUNT(t.id) as therapist_count
      FROM ${this.tableName} s
      LEFT JOIN therapists t ON s.id = t.store_id
      WHERE s.id = ?
      GROUP BY s.id
    `;
    return await this.db.get(sql, [id]);
  }

  async getAllWithStats() {
    const sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT t.id) as therapist_count,
        COUNT(DISTINCT a.id) as appointment_count
      FROM ${this.tableName} s
      LEFT JOIN therapists t ON s.id = t.store_id
      LEFT JOIN appointments a ON s.id = a.store_id
      GROUP BY s.id
      ORDER BY s.rating DESC
    `;
    return await this.db.all(sql);
  }
}

module.exports = new Store();