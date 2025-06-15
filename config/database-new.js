const { Pool } = require('pg');

// 判断使用哪种数据库
const useRealDb = process.env.USE_MOCK_DB === 'false' || process.env.USE_SQLITE === 'true';
const useSqlite = process.env.USE_SQLITE === 'true' || (process.env.USE_MOCK_DB === 'false' && process.env.DATABASE_TYPE !== 'postgresql');
const useMock = process.env.USE_MOCK_DB === 'true' && !useRealDb;

let db;
let pool;

if (useSqlite) {
  // 使用SQLite
  console.log('🗄️  配置使用SQLite数据库');
  const sqliteDb = require('../src/config/database-sqlite');
  
  db = {
    query: async (text, params) => {
      // 转换PostgreSQL风格的参数到SQLite风格
      if (params && params.length > 0) {
        let sqliteQuery = text;
        params.forEach((param, index) => {
          sqliteQuery = sqliteQuery.replace(`$${index + 1}`, '?');
        });
        return await sqliteDb.query(sqliteQuery, params);
      }
      return await sqliteDb.query(text, params);
    },
    pool: sqliteDb,
    connect: () => sqliteDb.connect(),
    end: () => sqliteDb.close()
  };
} else if (useMock) {
  // 使用Mock数据库
  console.log('🎭 使用模拟数据库 (USE_MOCK_DB=true)');
  db = require('./database-mock');
} else {
  // 尝试使用PostgreSQL
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://dbuser:dbpassword@localhost:5432/clouddb',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    db = {
      query: async (text, params) => {
        try {
          return await pool.query(text, params);
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log('⚠️  PostgreSQL不可用，切换到模拟数据库');
            const mockDb = require('./database-mock');
            return mockDb.query(text, params);
          }
          throw error;
        }
      },
      pool,
      connect: async () => {
        try {
          await pool.connect();
          console.log('✅ PostgreSQL数据库连接成功');
        } catch (error) {
          console.log('⚠️  PostgreSQL连接失败:', error.message);
        }
      },
      end: () => pool.end()
    };
  } catch (error) {
    console.log('❌ PostgreSQL配置失败，使用模拟数据库');
    db = require('./database-mock');
  }
}

module.exports = db;