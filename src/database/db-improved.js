const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabasePool {
    constructor() {
        this.dbPath = path.join(__dirname, '..', '..', 'mingyi.db');
        this.db = null;
        this.isConnected = false;
        this.connectionPromise = null;
    }

    async connect() {
        // 如果已经连接，直接返回
        if (this.isConnected && this.db) {
            return;
        }

        // 如果正在连接中，等待连接完成
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // 创建新的连接
        this.connectionPromise = new Promise((resolve, reject) => {
            console.log('📦 创建数据库连接...');
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('❌ 数据库连接失败:', err);
                    this.isConnected = false;
                    this.connectionPromise = null;
                    reject(err);
                } else {
                    // 启用外键约束和WAL模式以提高并发性能
                    this.db.serialize(() => {
                        this.db.run('PRAGMA foreign_keys = ON');
                        this.db.run('PRAGMA journal_mode = WAL');
                        this.db.run('PRAGMA busy_timeout = 5000'); // 5秒超时
                        
                        console.log('✅ 数据库连接成功');
                        this.isConnected = true;
                        this.connectionPromise = null;
                        resolve();
                    });
                }
            });
        });

        return this.connectionPromise;
    }

    // 不再自动关闭连接
    async close() {
        // 只在应用关闭时调用
        if (this.db && this.isConnected) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ 关闭数据库失败:', err);
                        reject(err);
                    } else {
                        console.log('📪 数据库连接已关闭');
                        this.isConnected = false;
                        this.db = null;
                        resolve();
                    }
                });
            });
        }
    }

    async run(sql, params = []) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ SQL执行错误:', err);
                    console.error('SQL:', sql);
                    console.error('参数:', params);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ 查询错误:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        await this.ensureConnection();
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ 查询错误:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async serialize(callback) {
        await this.ensureConnection();
        this.db.serialize(callback);
    }

    async prepare(sql) {
        await this.ensureConnection();
        return this.db.prepare(sql);
    }

    // 确保连接存在
    async ensureConnection() {
        if (!this.isConnected || !this.db) {
            await this.connect();
        }
    }

    // 执行事务
    async transaction(callback) {
        await this.ensureConnection();
        
        return new Promise(async (resolve, reject) => {
            try {
                await this.run('BEGIN TRANSACTION');
                const result = await callback(this);
                await this.run('COMMIT');
                resolve(result);
            } catch (error) {
                await this.run('ROLLBACK');
                reject(error);
            }
        });
    }
}

// 单例实例
let poolInstance = null;

// 处理进程退出时关闭数据库
process.on('SIGINT', async () => {
    console.log('\n🛑 收到退出信号，关闭数据库连接...');
    if (poolInstance) {
        await poolInstance.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (poolInstance) {
        await poolInstance.close();
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
    // 兼容旧接口
    Database: DatabasePool
};