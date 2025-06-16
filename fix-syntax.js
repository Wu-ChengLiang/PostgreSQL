const fs = require('fs');
const path = require('path');

// 需要修复的服务文件
const serviceFiles = [
    'src/services/therapistService.js',
    'src/services/appointmentService.js',
    'src/services/storeService.js',
    'src/services/authService.js'
];

function fixSyntaxInFile(filePath) {
    console.log(`📝 修复文件语法: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 查找所有的 try { ... } 块，确保它们有对应的 catch
        content = content.replace(/try\s*{([^}]+)}\s*$/gm, (match, tryContent) => {
            return `try {${tryContent}} catch (error) {
            throw error;
        }`;
        });
        
        // 修复悬空的 try 块
        let lines = content.split('\n');
        let inTry = false;
        let tryStartIndex = -1;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim().startsWith('try {')) {
                inTry = true;
                tryStartIndex = i;
                braceCount = 1;
            } else if (inTry) {
                for (let char of line) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                }
                
                if (braceCount === 0) {
                    // try 块结束
                    inTry = false;
                    // 检查下一行是否有 catch 或 finally
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1].trim();
                        if (!nextLine.startsWith('catch') && !nextLine.startsWith('finally')) {
                            // 添加 catch 块
                            lines[i] = lines[i] + ' catch (error) {\n            throw error;\n        }';
                        }
                    } else {
                        // 文件末尾，添加 catch
                        lines[i] = lines[i] + ' catch (error) {\n            throw error;\n        }';
                    }
                }
            }
        }
        
        content = lines.join('\n');
        
        // 写回文件
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ 语法修复完成`);
        
    } catch (error) {
        console.error(`   ❌ 处理失败: ${error.message}`);
    }
}

console.log('🔧 开始修复服务文件语法...\n');

serviceFiles.forEach(fixSyntaxInFile);

console.log('\n✅ 语法修复完成！');