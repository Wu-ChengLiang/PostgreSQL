const database = require('../config/database-sqlite');

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    
    // 连接数据库（会自动创建表和初始数据）
    await database.connect();
    
    console.log('✅ 数据库初始化完成！');
    
    // 验证数据
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    console.log(`  - 用户数量: ${userCount.count}`);
    
    const storeCount = await database.get('SELECT COUNT(*) as count FROM stores');
    console.log(`  - 门店数量: ${storeCount.count}`);
    
    const therapistCount = await database.get('SELECT COUNT(*) as count FROM therapists');
    console.log(`  - 技师数量: ${therapistCount.count}`);
    
    const appointmentCount = await database.get('SELECT COUNT(*) as count FROM appointments');
    console.log(`  - 预约数量: ${appointmentCount.count}`);
    
    await database.close();
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeDatabase();