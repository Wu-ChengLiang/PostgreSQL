const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// 测试数据库连接
describe('Database Connection Tests', () => {
  let db;
  const testDbPath = path.join(__dirname, '../../test.db');

  beforeEach(async () => {
    // 删除测试数据库（如果存在）
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
    // 清理测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('应该能够创建数据库连接', async () => {
    db = await open({
      filename: testDbPath,
      driver: sqlite3.Database
    });
    
    expect(db).toBeDefined();
    const result = await db.get('SELECT 1 as test');
    expect(result.test).toBe(1);
  });

  test('应该能够创建数据库表', async () => {
    db = await open({
      filename: testDbPath,
      driver: sqlite3.Database
    });

    // 创建用户表
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 验证表已创建
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );
    expect(tables.length).toBe(1);
    expect(tables[0].name).toBe('users');
  });

  test('应该能够插入和查询数据', async () => {
    db = await open({
      filename: testDbPath,
      driver: sqlite3.Database
    });

    // 创建表
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `);

    // 插入数据
    const result = await db.run(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      ['testuser', 'test@example.com']
    );
    
    expect(result.lastID).toBe(1);
    expect(result.changes).toBe(1);

    // 查询数据
    const user = await db.get('SELECT * FROM users WHERE id = ?', [1]);
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
  });

  test('应该能够处理事务', async () => {
    db = await open({
      filename: testDbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL
      )
    `);

    // 开始事务
    await db.exec('BEGIN TRANSACTION');
    
    try {
      await db.run('INSERT INTO users (username) VALUES (?)', ['user1']);
      await db.run('INSERT INTO users (username) VALUES (?)', ['user2']);
      await db.exec('COMMIT');
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }

    const users = await db.all('SELECT * FROM users');
    expect(users.length).toBe(2);
  });

  test('应该处理唯一约束错误', async () => {
    db = await open({
      filename: testDbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL
      )
    `);

    await db.run('INSERT INTO users (username) VALUES (?)', ['testuser']);
    
    // 尝试插入重复用户名
    await expect(
      db.run('INSERT INTO users (username) VALUES (?)', ['testuser'])
    ).rejects.toThrow(/UNIQUE constraint failed/);
  });
});