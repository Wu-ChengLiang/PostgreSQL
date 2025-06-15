// Jest测试设置
const path = require('path');
const fs = require('fs');

// 设置测试超时时间
jest.setTimeout(10000);

// 全局测试清理
afterAll(async () => {
  // 清理所有测试数据库文件
  const testDbPath = path.join(__dirname, '../test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});