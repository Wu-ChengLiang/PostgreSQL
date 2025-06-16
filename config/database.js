// Simplified database configuration - SQLite only
const { getInstance } = require('./database-sqlite');

// Get the singleton database instance
const db = getInstance();

// Export a compatible interface
module.exports = {
    query: async (text, params) => {
        // Convert PostgreSQL-style placeholders ($1, $2) to SQLite style (?, ?)
        let sqliteQuery = text;
        let sqliteParams = params;
        
        if (params && params.length > 0) {
            // Replace $1, $2, etc. with ?
            sqliteQuery = text.replace(/\$(\d+)/g, '?');
            
            // Reorder params if needed (PostgreSQL uses 1-based indexing)
            const matches = text.match(/\$(\d+)/g);
            if (matches) {
                sqliteParams = [];
                matches.forEach((match) => {
                    const index = parseInt(match.substring(1)) - 1;
                    sqliteParams.push(params[index]);
                });
            }
        }
        
        // Execute query based on type
        const operation = sqliteQuery.trim().toUpperCase();
        
        if (operation.startsWith('SELECT')) {
            const rows = await db.all(sqliteQuery, sqliteParams);
            return { rows };
        } else if (operation.startsWith('INSERT') || operation.startsWith('UPDATE') || operation.startsWith('DELETE')) {
            const result = await db.run(sqliteQuery, sqliteParams);
            return {
                rows: [],
                rowCount: result.changes,
                lastID: result.lastID
            };
        } else {
            // For other operations (CREATE, DROP, etc.)
            await db.run(sqliteQuery, sqliteParams);
            return { rows: [] };
        }
    },
    
    // Direct access to database methods
    run: (sql, params) => db.run(sql, params),
    get: (sql, params) => db.get(sql, params),
    all: (sql, params) => db.all(sql, params),
    exec: (sql) => db.exec(sql),
    
    // Transaction support
    beginTransaction: () => db.beginTransaction(),
    commit: () => db.commit(),
    rollback: () => db.rollback(),
    
    // Utility methods
    close: () => db.close(),
    getStats: () => db.getStats(),
    vacuum: () => db.vacuum(),
    analyze: () => db.analyze(),
    optimize: () => db.optimize(),
    
    // For backward compatibility
    pool: {
        query: async (text, params) => module.exports.query(text, params),
        end: () => db.close()
    }
};