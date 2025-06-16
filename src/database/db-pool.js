const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 全局数据库连接
let globalDb = null;
let isConnecting = false;

class DatabasePool {
    constructor() {
        this.dbPath = path.join(__dirname, '..', '..', 'mingyi.db');
    }

    async getConnection() {
        // 如果已有连接，直接返回
        if (globalDb) {
            return globalDb;
        }

        // 如果正在连接，等待
        if (isConnecting) {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!isConnecting) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
            });
            return globalDb;
        }

        // 创建新连接
        isConnecting = true;
        
        return new Promise((resolve, reject) => {
            console.log('🔌 创建持久数据库连接...');
            
            globalDb = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                isConnecting = false;
                
                if (err) {
                    console.error('❌ 数据库连接失败:', err);
                    globalDb = null;
                    reject(err);
                } else {
                    // 配置数据库
                    globalDb.serialize(() => {
                        globalDb.run('PRAGMA foreign_keys = ON');
                        globalDb.run('PRAGMA journal_mode = WAL');
                        globalDb.run('PRAGMA busy_timeout = 5000');
                        
                        console.log('✅ 数据库连接成功（持久连接）');
                        resolve(globalDb);
                    });
                }
            });
        });
    }

    async connect() {
        await this.getConnection();
    }

    async close() {
        // 只在应用关闭时真正关闭连接
        if (globalDb && process.env.FORCE_CLOSE === 'true') {
            return new Promise((resolve, reject) => {
                globalDb.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        globalDb = null;
                        console.log('📪 数据库连接已关闭');
                        resolve();
                    }
                });
            });
        }
    }

    async run(sql, params = []) {
        const db = await this.getConnection();
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ SQL执行错误:', err.message);
                    console.error('SQL:', sql);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        const db = await this.getConnection();
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ 查询错误:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        const db = await this.getConnection();
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ 查询错误:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async serialize(callback) {
        const db = await this.getConnection();
        db.serialize(callback);
    }

    async prepare(sql) {
        const db = await this.getConnection();
        return db.prepare(sql);
    }
}

// 单例实例
let poolInstance = null;

// 进程退出时关闭连接
process.on('SIGINT', async () => {
    console.log('\n🛑 收到退出信号...');
    if (globalDb) {
        process.env.FORCE_CLOSE = 'true';
        if (poolInstance) {
            await poolInstance.close();
        }
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (globalDb) {
        process.env.FORCE_CLOSE = 'true';
        if (poolInstance) {
            await poolInstance.close();
        }
    }
    process.exit(0);
});

module.exports = {
    getInstance: () => {
        if (!poolInstance) {
            poolInstance = new DatabasePool();
        }
        return poolInstance;
    },
    Database: DatabasePool
};