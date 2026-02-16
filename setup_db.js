const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'swm_database.db');
const sqlPath = path.join(__dirname, 'swm_system.sql');
const envPath = path.join(__dirname, '.env');

// Simple .env parser to avoid checking dependencies
function loadEnv() {
    try {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const idx = trimmed.indexOf('=');
                    if (idx > 0) {
                        const key = trimmed.substring(0, idx).trim();
                        let value = trimmed.substring(idx + 1).trim();
                        // Remove surrounding quotes if they exist
                        if ((value.startsWith("'") && value.endsWith("'")) ||
                            (value.startsWith('"') && value.endsWith('"'))) {
                            value = value.slice(1, -1);
                        }
                        process.env[key] = value;
                    }
                }
            });
            console.log("Loaded .env file");
        }
    } catch (err) {
        console.log("Warning: Could not read .env file:", err.message);
    }
}

loadEnv();

const db = new sqlite3.Database(dbPath);
const sql = fs.readFileSync(sqlPath, 'utf8');

db.serialize(() => {
    // 1. Initialize Tables from SQL
    db.exec(sql, (err) => {
        if (err) {
            console.error('Error executing SQL script:', err.message);
            return;
        }
        console.log('Database initialized successfully from swm_system.sql');

        // 2. Seed Users from Environment Variables
        const admins = JSON.parse(process.env.ADMIN_ACCOUNTS || '[]');
        const users = JSON.parse(process.env.USER_ACCOUNTS || '[]');

        if (admins.length === 0 && users.length === 0) {
            console.log("No accounts found in .env to seed.");
            return;
        }

        const insertUser = db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)");

        let count = 0;

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");

            admins.forEach(admin => {
                insertUser.run(admin.username, admin.password, 'admin', admin.name);
                count++;
            });

            users.forEach(user => {
                insertUser.run(user.username, user.password, 'general', user.name);
                count++;
            });

            db.run("COMMIT", (err) => {
                if (err) {
                    console.error("Error seeding users:", err.message);
                } else {
                    console.log(`Seeded ${count} users from .env`);
                }
                insertUser.finalize();
                db.close();
            });
        });
    });
});
