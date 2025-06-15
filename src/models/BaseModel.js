const database = require('../config/database-sqlite');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = database;
  }

  async findAll(conditions = {}, options = {}) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];
      
      // 构建WHERE子句
      const whereConditions = Object.entries(conditions)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        });
      
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      // 添加排序
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }
      
      // 添加限制
      if (options.limit) {
        sql += ` LIMIT ${options.limit}`;
      }
      
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
      
      return await this.db.all(sql, params);
    } catch (error) {
      console.error(`查询${this.tableName}失败:`, error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      return await this.db.get(sql, [id]);
    } catch (error) {
      console.error(`查询${this.tableName} ID ${id}失败:`, error);
      throw error;
    }
  }

  async findOne(conditions = {}) {
    try {
      let sql = `SELECT * FROM ${this.tableName}`;
      const params = [];
      
      const whereConditions = Object.entries(conditions)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        });
      
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      sql += ' LIMIT 1';
      
      return await this.db.get(sql, params);
    } catch (error) {
      console.error(`查询${this.tableName}失败:`, error);
      throw error;
    }
  }

  async create(data) {
    try {
      const fields = Object.keys(data).filter(key => data[key] !== undefined);
      const values = fields.map(field => data[field]);
      const placeholders = fields.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      const result = await this.db.run(sql, values);
      
      return {
        id: result.lastID,
        ...data
      };
    } catch (error) {
      console.error(`创建${this.tableName}失败:`, error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const fields = Object.keys(data).filter(key => data[key] !== undefined && key !== 'id');
      const values = fields.map(field => data[field]);
      values.push(id);
      
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      
      const result = await this.db.run(sql, values);
      
      if (result.changes === 0) {
        throw new Error(`未找到ID为${id}的记录`);
      }
      
      return await this.findById(id);
    } catch (error) {
      console.error(`更新${this.tableName} ID ${id}失败:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await this.db.run(sql, [id]);
      
      return result.changes > 0;
    } catch (error) {
      console.error(`删除${this.tableName} ID ${id}失败:`, error);
      throw error;
    }
  }

  async count(conditions = {}) {
    try {
      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params = [];
      
      const whereConditions = Object.entries(conditions)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          params.push(value);
          return `${key} = ?`;
        });
      
      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      const result = await this.db.get(sql, params);
      return result.count;
    } catch (error) {
      console.error(`统计${this.tableName}失败:`, error);
      throw error;
    }
  }

  async rawQuery(sql, params = []) {
    try {
      return await this.db.all(sql, params);
    } catch (error) {
      console.error('原始查询失败:', error);
      throw error;
    }
  }
}

module.exports = BaseModel;