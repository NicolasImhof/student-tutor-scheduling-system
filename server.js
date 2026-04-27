const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tutor_scheduling',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Calendar API endpoints
app.get('/api/calendar-data', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date, tutor_id } = req.query;
        const userId = req.user.userId;
        const userRole = req.user.role;

        let query;
        let params;

        if (userRole === 'Student') {
            // Students can see availability for all approved tutors
            query = `
                SELECT 
                    date,
                    day_type,
                    display_color,
                    status_description,
                    tutor_id,
                    tutor_name,
                    is_available,
                    is_busy,
                    is_holiday
                FROM get_calendar_data($1, $2, $3)
                WHERE tutor_id IN (
                    SELECT user_id FROM Users WHERE role = 'Tutor' AND approval_status = 'Approved'
                )
                ORDER BY date, tutor_name
            `;
            params = [start_date || new Date().toISOString().split('T')[0], 
                     end_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], 
                     tutor_id];
        } else if (userRole === 'Tutor') {
            // Tutors can see their own calendar data
            query = `
                SELECT 
                    date,
                    day_type,
                    display_color,
                    status_description,
                    tutor_id,
                    tutor_name,
                    is_available,
                    is_busy,
                    is_holiday
                FROM get_calendar_data($1, $2, $3)
                WHERE tutor_id = $4
                ORDER BY date
            `;
            params = [start_date || new Date().toISOString().split('T')[0], 
                     end_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], 
                     userId, userId];
        } else {
            // Admins can see all calendar data
            query = `
                SELECT 
                    date,
                    day_type,
                    display_color,
                    status_description,
                    tutor_id,
                    tutor_name,
                    is_available,
                    is_busy,
                    is_holiday
                FROM get_calendar_data($1, $2, $3)
                ORDER BY date, tutor_name
            `;
            params = [start_date || new Date().toISOString().split('T')[0], 
                     end_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], 
                     tutor_id];
        }

        const result = await pool.query(query, params);
        
        // Transform the data into the format expected by the calendar
        const calendarData = {
            holidays: [],
            availability: {},
            appointments: []
        };

        result.rows.forEach(row => {
            if (row.is_holiday) {
                calendarData.holidays.push(row.date);
            }
            
            if (row.is_available || row.is_busy) {
                if (!calendarData.availability[row.date]) {
                    calendarData.availability[row.date] = [];
                }
                calendarData.availability[row.date].push({
                    tutor_id: row.tutor_id,
                    tutor_name: row.tutor_name,
                    status: row.is_busy ? 'busy' : 'available',
                    date: row.date
                });
            }
        });

        res.json(calendarData);
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/calendar-day-status', authenticateToken, async (req, res) => {
    try {
        const { date, day_type, status_description, tutor_id } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Check permissions
        if (userRole === 'Tutor' && tutor_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        } else if (userRole === 'Student') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query(
            'SELECT upsert_calendar_day_status($1, $2, $3, $4)',
            [date, day_type, status_description, tutor_id || userId]
        );

        res.json({ message: 'Calendar day status updated successfully' });
    } catch (error) {
        console.error('Error updating calendar day status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/calendar-settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await pool.query(
            'SELECT * FROM CalendarSettings WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // Create default settings if they don't exist
            await pool.query(
                'INSERT INTO CalendarSettings (user_id) VALUES ($1)',
                [userId]
            );
            
            const newResult = await pool.query(
                'SELECT * FROM CalendarSettings WHERE user_id = $1',
                [userId]
            );
            
            res.json(newResult.rows[0]);
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error fetching calendar settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/calendar-settings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const settings = req.body;
        
        const setClause = Object.keys(settings)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [userId, ...Object.values(settings)];
        
        await pool.query(
            `UPDATE CalendarSettings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
            values
        );

        res.json({ message: 'Calendar settings updated successfully' });
    } catch (error) {
        console.error('Error updating calendar settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authentication endpoints
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT user_id, email, password, role, approval_status FROM Users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        
        if (user.approval_status !== 'Approved') {
            return res.status(403).json({ error: 'Account not approved' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                userId: user.user_id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});