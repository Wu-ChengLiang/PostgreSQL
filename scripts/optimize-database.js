#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const db = require('../config/database');

async function optimizeDatabase() {
    console.log('🔧 Starting database optimization...\n');

    try {
        // 1. Run ANALYZE to update query planner statistics
        console.log('📊 Analyzing database...');
        await db.analyze();
        console.log('✅ Analysis completed\n');

        // 2. Run OPTIMIZE pragma
        console.log('⚡ Running optimization...');
        await db.optimize();
        console.log('✅ Optimization completed\n');

        // 3. Get database statistics
        console.log('📈 Database Statistics:');
        const stats = await db.getStats();
        console.log(`   - Total stores: ${stats.total_stores}`);
        console.log(`   - Total therapists: ${stats.total_therapists}`);
        console.log(`   - Database size: ${(stats.db_size / 1024 / 1024).toFixed(2)} MB\n`);

        // 4. Check indexes
        console.log('🔍 Checking indexes...');
        const indexes = await db.all(`
            SELECT name, tbl_name, sql 
            FROM sqlite_master 
            WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
            ORDER BY tbl_name, name
        `);
        
        console.log(`   Found ${indexes.length} custom indexes:`);
        indexes.forEach(idx => {
            console.log(`   - ${idx.name} on ${idx.tbl_name}`);
        });
        console.log('');

        // 5. Run integrity check
        console.log('🔒 Running integrity check...');
        const integrityCheck = await db.get('PRAGMA integrity_check');
        if (integrityCheck.integrity_check === 'ok') {
            console.log('✅ Database integrity: OK\n');
        } else {
            console.error('❌ Database integrity issues found:', integrityCheck);
            process.exit(1);
        }

        // 6. Optionally run VACUUM (can be slow on large databases)
        const vacuumPrompt = process.argv.includes('--vacuum');
        if (vacuumPrompt) {
            console.log('🧹 Running VACUUM (this may take a while)...');
            await db.vacuum();
            console.log('✅ VACUUM completed\n');
        } else {
            console.log('💡 Tip: Run with --vacuum flag to compact the database\n');
        }

        console.log('✨ Database optimization completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during optimization:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Run optimization
optimizeDatabase();