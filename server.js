const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Added for .env parsing
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const dbPath = path.resolve(__dirname, 'swm_database.db');

// Simple .env parser
const envPath = path.join(__dirname, '.env');
function loadEnv() {
    try {
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                // Ignore comments and empty lines
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

loadEnv(); // Load environment variables

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '12h';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from root

// Database Connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // No token present

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        req.user = user;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
};

// API Endpoints

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.get(sql, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            // User found, generate JWT
            const userForToken = {
                id: row.id,
                username: row.username,
                role: row.role,
                name: row.name
            };

            const accessToken = jwt.sign(userForToken, SECRET_KEY, { expiresIn: JWT_EXPIRATION });

            const { password, ...user } = row;
            res.json({ ...user, accessToken }); // Return user info + token
        } else {
            res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    });
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
    const sql = `
        SELECT j.*, 
        (SELECT json_group_array(json_object('id', ji.id, 'description', ji.description, 'price', ji.price)) 
         FROM job_items ji WHERE ji.job_id = j.id) as items 
        FROM jobs j 
        ORDER BY j.created_at DESC`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Parse items JSON string and map to camelCase
        const jobs = rows.map(row => {
            return {
                id: row.id,
                customerName: row.customer_name,
                jobType: row.job_type,
                subtotal: row.subtotal,
                vat: row.vat,
                estimatedPrice: row.estimated_price,
                status: row.status,
                notes: row.notes,
                createdAt: row.created_at,
                items: JSON.parse(row.items || '[]')
            };
        });
        res.json(jobs);
    });
});

// Create Job
app.post('/api/jobs', authenticateToken, (req, res) => {
    let { id, customerName, jobType, subtotal, vat, estimatedPrice, status, notes, items, createdAt } = req.body;

    // Validate required fields
    // Validate required fields
    if (!customerName || !jobType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const insertJob = `INSERT INTO jobs (id, customer_name, job_type, subtotal, vat, estimated_price, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(insertJob, [id, customerName, jobType, subtotal, vat, estimatedPrice, status, notes, createdAt], function (err) {
            if (err) {
                console.error("Error inserting job:", err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const insertItem = `INSERT INTO job_items (job_id, description, price) VALUES (?, ?, ?)`;
            const stmt = db.prepare(insertItem);

            items.forEach(item => {
                stmt.run([id, item.description, item.price], (err) => {
                    if (err) {
                        console.error("Error inserting item:", err);
                    }
                });
            });

            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                db.run('COMMIT');
                res.status(201).json({ message: 'Job created', id: id });
            });
        });
    });
});

// Update Job
app.put('/api/jobs/:id', authenticateToken, requireAdmin, (req, res) => {
    const jobId = req.params.id;
    const { customerName, jobType, subtotal, vat, estimatedPrice, status, notes, items } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const updateJob = `UPDATE jobs SET customer_name = ?, job_type = ?, subtotal = ?, vat = ?, estimated_price = ?, status = ?, notes = ? WHERE id = ?`;

        db.run(updateJob, [customerName, jobType, subtotal, vat, estimatedPrice, status, notes, jobId], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            // Replace items: Delete all and re-insert
            db.run(`DELETE FROM job_items WHERE job_id = ?`, [jobId], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                const insertItem = `INSERT INTO job_items (job_id, description, price) VALUES (?, ?, ?)`;
                const stmt = db.prepare(insertItem);

                items.forEach(item => {
                    stmt.run([jobId, item.description, item.price]);
                });

                stmt.finalize((err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    db.run('COMMIT');
                    res.json({ message: 'Job updated' });
                });
            });
        });
    });
});

// Update Status (Helper for Kanban drag/drop if needed, or just use general update)
app.patch('/api/jobs/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE jobs SET status = ? WHERE id = ?`, [status, req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Status updated' });
    });
});

// Soft Delete Job (Mark as Cancelled)
app.delete('/api/jobs/:id', authenticateToken, requireAdmin, (req, res) => {
    const id = req.params.id;
    // Instead of DELETE, we update status to 'Cancelled'
    db.run(`UPDATE jobs SET status = 'Cancelled' WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Job cancelled (soft deleted)' });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
