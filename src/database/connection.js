const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../mingyi.db');
    }

    async connect() {
        try {
            // 确保数据库目录存在
            const dbDir = path.dirname(this.dbPath);
            if (\!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // 打开数据库连接
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });

            console.log('✅ 数据库连接成功');
            
            // 启用外键约束
            await this.db.exec('PRAGMA foreign_keys = ON');
            
            // 初始化数据库架构
            await this.initializeSchema();
            
            return this.db;
        } catch (error) {
            console.error('❌ 数据库连接失败:', error);
            throw error;
        }
    }

    async initializeSchema() {
        try {
            // 读取并执行schema.sql
            const schemaPath = path.join(__dirname, 'schema.sql');
            if (fs.existsSync(schemaPath)) {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                await this.db.exec(schema);
                console.log('✅ 数据库架构初始化成功');
            }
        } catch (error) {
            console.error('❌ 数据库架构初始化失败:', error);
            throw error;
        }
    }

    async run(sql, params = []) {
        try {
            return await this.db.run(sql, params);
        } catch (error) {
            console.error('SQL执行错误:', error);
            throw error;
        }
    }

    async get(sql, params = []) {
        try {
            return await this.db.get(sql, params);
        } catch (error) {
            console.error('查询错误:', error);
            throw error;
        }
    }

    async all(sql, params = []) {
        try {
            return await this.db.all(sql, params);
        } catch (error) {
            console.error('查询错误:', error);
            throw error;
        }
    }

    async transaction(callback) {
        await this.db.exec('BEGIN TRANSACTION');
        try {
            const result = await callback(this.db);
            await this.db.exec('COMMIT');
            return result;
        } catch (error) {
            await this.db.exec('ROLLBACK');
            throw error;
        }
    }

    async close() {
        if (this.db) {
            await this.db.close();
            console.log('数据库连接已关闭');
        }
    }
}

module.exports = Database;
EOF < /dev/null