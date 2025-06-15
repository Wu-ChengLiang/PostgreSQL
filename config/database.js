const { Pool } = require('pg');

// Try to create PostgreSQL pool
let pool;
let db;
let useMock = false;

// Check if we should use mock database
if (process.env.USE_MOCK_DB === 'true') {
  console.log('Using mock database (USE_MOCK_DB=true)');
  db = require('./database-mock');
  useMock = true;
} else {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://dbuser:dbpassword@localhost:5432/clouddb',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection synchronously
    db = {
      query: async (text, params) => {
        try {
          return await pool.query(text, params);
        } catch (error) {
          if (!useMock && error.code === 'ECONNREFUSED') {
            console.log('PostgreSQL not available, switching to mock database');
            const mockDb = require('./database-mock');
            useMock = true;
            return mockDb.query(text, params);
          }
          throw error;
        }
      },
      pool
    };
  } catch (error) {
    console.log('PostgreSQL not available, using mock database');
    db = require('./database-mock');
    useMock = true;
  }
}

module.exports = db;