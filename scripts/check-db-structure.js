const { getInstance } = require('../src/database/db');

async function checkDatabaseStructure() {
    const db = getInstance();
    await db.connect();
    
    console.log('🔍 检查数据库结构...\n');
    
    try {
        // 1. 检查therapists表结构
        console.log('📋 therapists表结构：');
        const therapistSchema = await db.all(`
            PRAGMA table_info(therapists)
        `);
        
        console.table(therapistSchema.map(col => ({
            字段名: col.name,
            类型: col.type,
            非空: col.notnull ? '是' : '否',
            默认值: col.dflt_value || '无'
        })));
        
        // 2. 检查现有技师数据
        const therapistCount = await db.get('SELECT COUNT(*) as count FROM therapists');
        console.log(`\n📊 现有技师数量: ${therapistCount.count}`);
        
        // 3. 检查stores表中的门店
        console.log('\n🏪 现有门店列表：');
        const stores = await db.all('SELECT id, name FROM stores ORDER BY id');
        console.table(stores);
        
        // 4. 查看几条示例技师数据
        console.log('\n👥 示例技师数据（前3条）：');
        const sampleTherapists = await db.all('SELECT * FROM therapists LIMIT 3');
        console.log(JSON.stringify(sampleTherapists, null, 2));
        
    } catch (error) {
        console.error('❌ 错误:', error);
    } finally {
        await db.close();
    }
}

checkDatabaseStructure();