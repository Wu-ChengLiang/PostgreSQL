#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log('Initializing SQLite database...');

const db = new sqlite3.Database(dbPath);

// Read and execute schema
const schemaPath = path.join(__dirname, '../database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Read and execute seed data
const seedPath = path.join(__dirname, '../database/seed.sql');
const seed = fs.readFileSync(seedPath, 'utf8');

db.serialize(() => {
    // Execute schema
    const schemaStatements = schema.split(';').filter(stmt => stmt.trim());
    schemaStatements.forEach(stmt => {
        if (stmt.trim()) {
            db.run(stmt, (err) => {
                if (err) {
                    console.error('Error executing schema:', err);
                }
            });
        }
    });

    // Execute seed data
    const seedStatements = seed.split(';').filter(stmt => stmt.trim());
    seedStatements.forEach(stmt => {
        if (stmt.trim()) {
            db.run(stmt, (err) => {
                if (err) {
                    console.error('Error executing seed:', err);
                }
            });
        }
    });

    console.log('Database initialization completed!');
});

db.close();