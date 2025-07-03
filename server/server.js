const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Environment setup
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.path}`);
    next();
});

// Static file serving - try multiple paths to ensure compatibility
const staticPath = path.join(__dirname, '..');
console.log('Static path:', staticPath);
console.log('Current directory:', __dirname);
console.log('Production mode:', isProduction);

// Check if critical files exist
const criticalFiles = [
    path.join(staticPath, 'index.html'),
    path.join(staticPath, 'css', 'styles.css'),
    path.join(staticPath, 'js', 'language.js'),
    path.join(staticPath, 'js', 'main.js'),
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'css', 'styles.css'),
    path.join(__dirname, 'js', 'language.js')
];

criticalFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`File ${file}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
});

// Try serving static files from multiple locations
app.use(express.static(staticPath));
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(staticPath, 'css')));
app.use('/js', express.static(path.join(staticPath, 'js')));
app.use('/assets', express.static(path.join(staticPath, 'assets')));

// Database setup
let db;

if (isProduction && process.env.POSTGRES_URL) {
    // Production: Use Postgres
    db = new Pool({
        connectionString: process.env.POSTGRES_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log('Connected to PostgreSQL database');
    initializeDatabase();
} else {
    // Development: Use SQLite (conditionally require to avoid issues in production)
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
        if (err) {
            console.error('Error connecting to database:', err);
        } else {
            console.log('Connected to SQLite database');
            initializeDatabase();
        }
    });
}

// Database abstraction layer
const dbQuery = {
    run: async (query, params = []) => {
        if (isProduction) {
            try {
                const result = await db.query(query, params);
                return { lastID: result.rows[0]?.id, changes: result.rowCount };
            } catch (err) {
                throw err;
            }
        } else {
            return new Promise((resolve, reject) => {
                db.run(query, params, function(err) {
                    if (err) reject(err);
                    else resolve({ lastID: this.lastID, changes: this.changes });
                });
            });
        }
    },
    get: async (query, params = []) => {
        if (isProduction) {
            const result = await db.query(query, params);
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                db.get(query, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }
    },
    all: async (query, params = []) => {
        if (isProduction) {
            const result = await db.query(query, params);
            return result.rows;
        } else {
            return new Promise((resolve, reject) => {
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }
};

// Initialize database tables
async function initializeDatabase() {
    try {
        if (isProduction) {
            // PostgreSQL syntax
            await dbQuery.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                surname TEXT,
                birthday TEXT,
                email TEXT NOT NULL,
                phone TEXT,
                schedule TEXT,
                experience TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await dbQuery.run(`CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            await dbQuery.run(`CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                instructor TEXT,
                schedule TEXT,
                capacity INTEGER,
                price DECIMAL(10,2)
            )`);

            await dbQuery.run(`CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                class_id INTEGER REFERENCES classes(id),
                booking_date TIMESTAMP,
                status TEXT
            )`);
        } else {
            // SQLite syntax
            await dbQuery.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                surname TEXT,
                birthday TEXT,
                email TEXT NOT NULL,
                phone TEXT,
                schedule TEXT,
                experience TEXT,
                message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await dbQuery.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            await dbQuery.run(`CREATE TABLE IF NOT EXISTS classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                instructor TEXT,
                schedule TEXT,
                capacity INTEGER,
                price DECIMAL(10,2)
            )`);

            await dbQuery.run(`CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                class_id INTEGER,
                booking_date DATETIME,
                status TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (class_id) REFERENCES classes(id)
            )`);
        }
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// API Routes

// Get all contact form submissions (for admin panel)
app.get('/api/admin/submissions', async (req, res) => {
    try {
        const rows = await dbQuery.all(`SELECT * FROM contact_submissions ORDER BY created_at DESC`);
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get individual submission by ID
app.get('/api/admin/submissions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const row = await dbQuery.get(`SELECT * FROM contact_submissions WHERE id = ${isProduction ? '$1' : '?'}`, [id]);
        
        if (!row) {
            res.status(404).json({ error: 'Submission not found' });
            return;
        }
        res.json(row);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/classes', async (req, res) => {
    try {
        const rows = await dbQuery.all('SELECT * FROM classes');
        res.json(rows);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/bookings', async (req, res) => {
    try {
        const { user_id, class_id, booking_date } = req.body;
        const placeholders = isProduction ? '($1, $2, $3, $4)' : '(?, ?, ?, ?)';
        const result = await dbQuery.run(
            `INSERT INTO bookings (user_id, class_id, booking_date, status) VALUES ${placeholders}`,
            [user_id, class_id, booking_date, 'pending']
        );
        res.json({ id: result.lastID });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Form submission endpoint
app.post('/api/submit-form', async (req, res) => {
    try {
        const { name, surname, birthday, email, phone, schedule, experience, message } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        
        const placeholders = isProduction ? '($1, $2, $3, $4, $5, $6, $7, $8)' : '(?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await dbQuery.run(
            `INSERT INTO contact_submissions 
             (name, surname, birthday, email, phone, schedule, experience, message) 
             VALUES ${placeholders}`,
            [name, surname, birthday, email, phone, schedule, experience, message]
        );
        
        console.log('New contact submission saved with ID:', result.lastID);
        res.json({ success: true, id: result.lastID, message: 'Form submitted successfully!' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Failed to save form data' });
    }
});

// Payment endpoint
app.post('/api/create-payment', async (req, res) => {
    const { payment_method_id, amount, currency } = req.body;
    
    try {
        // Here you would integrate with Stripe
        // This is a placeholder for the actual Stripe integration
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug route for static files
app.get(['/css/*', '/js/*', '/assets/*'], (req, res) => {
    console.log(`Static file request not handled: ${req.path}`);
    const filePath = path.join(__dirname, '..', req.path);
    console.log(`Trying to serve: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send(`File not found: ${req.path}`);
    }
});

// Serve the main page for all other routes
app.get('*', (req, res) => {
    console.log(`Serving index.html for: ${req.path}`);
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 