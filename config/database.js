const { Pool } = require('pg');

// Try to create PostgreSQL pool
let pool;
let db;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://dbuser:dbpassword@localhost:5432/clouddb',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  // Test connection
  pool.query('SELECT 1').catch(() => {
    console.log('PostgreSQL not available, using mock database');
    db = require('./database-mock');
  });
  
  db = {
    query: (text, params) => pool.query(text, params),
    pool
  };
} catch (error) {
  console.log('PostgreSQL not available, using mock database');
  db = require('./database-mock');
}

module.exports = db;