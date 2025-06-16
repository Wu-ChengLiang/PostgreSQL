const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SQLiteDatabase {
    constructor() {
        this.dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'mingyi.db');
        this.db = null;
        this.isConnecting = false;
        this.connectionPromise = null;
        
        // Performance configuration
        this.config = {
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 1,
            busyTimeout: parseInt(process.env.DB_BUSY_TIMEOUT) || 5000,
            cacheSize: parseInt(process.env.DB_CACHE_SIZE) || 2000,
            pageSize: parseInt(process.env.DB_PAGE_SIZE) || 4096,
            synchronous: process.env.DB_SYNCHRONOUS || 'NORMAL',
            journalMode: process.env.DB_JOURNAL_MODE || 'WAL',
            tempStore: process.env.DB_TEMP_STORE || 'MEMORY'
        };
    }

    async connect() {
        // If already connected, return existing connection
        if (this.db) {
            return this.db;
        }

        // If connection is in progress, wait for it
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        // Create new connection
        this.connectionPromise = this._createConnection();
        return this.connectionPromise;
    }

    async _createConnection() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Creating optimized SQLite connection...');
            
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
                if (err) {
                    console.error('❌ Database connection failed:', err);
                    this.db = null;
                    this.connectionPromise = null;
                    reject(err);
                    return;
                }

                try {
                    // Apply performance optimizations
                    await this._optimizeDatabase();
                    console.log('✅ SQLite database connected and optimized');
                    resolve(this.db);
                } catch (optimizeError) {
                    console.error('❌ Database optimization failed:', optimizeError);
                    reject(optimizeError);
                }
            });
        });
    }

    async _optimizeDatabase() {
        const pragmas = [
            // Enable foreign keys
            'PRAGMA foreign_keys = ON',
            
            // Performance optimizations
            `PRAGMA cache_size = ${this.config.cacheSize}`,
            `PRAGMA page_size = ${this.config.pageSize}`,
            `PRAGMA busy_timeout = ${this.config.busyTimeout}`,
            `PRAGMA journal_mode = ${this.config.journalMode}`,
            `PRAGMA synchronous = ${this.config.synchronous}`,
            `PRAGMA temp_store = ${this.config.tempStore}`,
            
            // Additional optimizations
            'PRAGMA auto_vacuum = INCREMENTAL',
            'PRAGMA mmap_size = 268435456', // 256MB memory-mapped I/O
            'PRAGMA optimize' // Run query optimizer
        ];

        for (const pragma of pragmas) {
            await this.run(pragma);
        }

        // Create indexes for better query performance
        await this._createIndexes();
    }

    async _createIndexes() {
        const indexes = [
            // Stores indexes
            'CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name)',
            'CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status)',
            
            // Therapists indexes
            'CREATE INDEX IF NOT EXISTS idx_therapists_store_id ON therapists(store_id)',
            'CREATE INDEX IF NOT EXISTS idx_therapists_status ON therapists(status)',
            'CREATE INDEX IF NOT EXISTS idx_therapists_store_status ON therapists(store_id, status)',
            
            // Appointments indexes (if exists)
            'CREATE INDEX IF NOT EXISTS idx_appointments_therapist_id ON appointments(therapist_id) WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type="table" AND name="appointments")',
            'CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date) WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type="table" AND name="appointments")'
        ];

        for (const index of indexes) {
            try {
                await this.run(index);
            } catch (err) {
                // Ignore errors for missing tables
                if (!err.message.includes('no such table')) {
                    console.warn('Index creation warning:', err.message);
                }
            }
        }
    }

    async run(sql, params = []) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    async exec(sql) {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            db.exec(sql, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async serialize(callback) {
        const db = await this.connect();
        db.serialize(callback);
    }

    async prepare(sql) {
        const db = await this.connect();
        return db.prepare(sql);
    }

    async beginTransaction() {
        await this.run('BEGIN TRANSACTION');
    }

    async commit() {
        await this.run('COMMIT');
    }

    async rollback() {
        await this.run('ROLLBACK');
    }

    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db = null;
                        this.connectionPromise = null;
                        console.log('📪 Database connection closed');
                        resolve();
                    }
                });
            });
        }
    }

    // Utility method for running queries with automatic retry
    async executeWithRetry(operation, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (err) {
                lastError = err;
                
                // Only retry on specific errors
                if (err.code === 'SQLITE_BUSY' || err.code === 'SQLITE_LOCKED') {
                    console.warn(`Database busy, retrying (${attempt}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                } else {
                    throw err;
                }
            }
        }
        
        throw lastError;
    }

    // Performance monitoring
    async getStats() {
        const stats = await this.all(`
            SELECT 
                (SELECT COUNT(*) FROM stores) as total_stores,
                (SELECT COUNT(*) FROM therapists) as total_therapists,
                (SELECT page_count * page_size FROM pragma_page_count(), pragma_page_size()) as db_size
        `);
        
        return stats[0];
    }

    // Maintenance operations
    async vacuum() {
        console.log('🧹 Running database vacuum...');
        await this.run('VACUUM');
        console.log('✅ Database vacuum completed');
    }

    async analyze() {
        console.log('📊 Running database analysis...');
        await this.run('ANALYZE');
        console.log('✅ Database analysis completed');
    }

    async optimize() {
        console.log('⚡ Optimizing database...');
        await this.run('PRAGMA optimize');
        await this.analyze();
        console.log('✅ Database optimization completed');
    }
}

// Singleton instance
let instance = null;

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    if (instance) {
        await instance.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    if (instance) {
        await instance.close();
    }
    process.exit(0);
});

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new SQLiteDatabase();
        }
        return instance;
    },
    SQLiteDatabase
};