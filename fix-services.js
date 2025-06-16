const fs = require('fs');
const path = require('path');

// 需要修复的服务文件
const serviceFiles = [
    'src/services/therapistService.js',
    'src/services/appointmentService.js',
    'src/services/storeService.js',
    'src/services/authService.js'
];

function fixServiceFile(filePath) {
    console.log(`📝 修复文件: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 统计修改前的close调用次数
        const closeMatches = content.match(/await\s+db\.close\(\)/g) || [];
        const finallyBlocks = content.match(/finally\s*{\s*await\s+db\.close\(\);\s*}/g) || [];
        
        if (closeMatches.length === 0 && finallyBlocks.length === 0) {
            console.log(`   ✅ 文件已经是正确的，无需修改`);
            return;
        }
        
        // 移除所有的 await db.close() 调用
        content = content.replace(/await\s+db\.close\(\);?\s*/g, '');
        
        // 移除空的 finally 块
        content = content.replace(/finally\s*{\s*}/g, '');
        
        // 移除只包含 close 的 finally 块
        content = content.replace(/finally\s*{\s*await\s+db\.close\(\);\s*}/g, '');
        
        // 清理多余的 try-finally 结构（如果finally为空）
        content = content.replace(/try\s*{([^}]+)}\s*catch[^}]+}\s*$/gm, (match, tryContent) => {
            return `try {${tryContent}} catch${match.substring(match.indexOf('catch') + 5)}`;
        });
        
        // 写回文件
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ 已移除 ${closeMatches.length} 个close调用`);
        
    } catch (error) {
        console.error(`   ❌ 处理失败: ${error.message}`);
    }
}

console.log('🔧 开始修复服务文件...\n');

serviceFiles.forEach(fixServiceFile);

console.log('\n✅ 服务文件修复完成！');
console.log('\n下一步：重启服务器测试所有API');