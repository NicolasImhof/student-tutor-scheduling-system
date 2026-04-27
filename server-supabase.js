const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';
const supabase = createClient(supabaseUrl, supabaseKey);

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

        // Fetch holidays
        const { data: holidays, error: holidaysError } = await supabase
            .from('holidays')
            .select('*')
            .gte('date', start_date || '2024-01-01')
            .lte('date', end_date || '2024-12-31');

        if (holidaysError) throw holidaysError;

        // Fetch availability based on role
        let availability = [];
        if (userRole === 'Student') {
            // Students see all tutor availability
            const { data: availData, error: availError } = await supabase
                .from('calendar_day_status')
                .select('*')
                .eq('day_type', 'available')
                .gte('date', start_date || '2024-01-01')
                .lte('date', end_date || '2024-12-31');
            
            if (availError) throw availError;
            availability = availData;
        } else if (userRole === 'Tutor') {
            // Tutors see their own availability
            const { data: availData, error: availError } = await supabase
                .from('calendar_day_status')
                .select('*')
                .eq('tutor_id', userId)
                .gte('date', start_date || '2024-01-01')
                .lte('date', end_date || '2024-12-31');
            
            if (availError) throw availError;
            availability = availData;
        }

        // Fetch appointments
        let appointments = [];
        if (userRole === 'Student') {
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('*')
                .eq('student_id', userId)
                .gte('date', start_date || '2024-01-01')
                .lte('date', end_date || '2024-12-31');
            
            if (apptError) throw apptError;
            appointments = apptData;
        } else if (userRole === 'Tutor') {
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('*')
                .eq('tutor_id', userId)
                .gte('date', start_date || '2024-01-01')
                .lte('date', end_date || '2024-12-31');
            
            if (apptError) throw apptError;
            appointments = apptData;
        }

        res.json({
            holidays: holidays.map(h => h.date),
            availability: availability.reduce((acc, item) => {
                acc[item.date] = {
                    status: item.day_type,
                    slots: item.time_slots || []
                };
                return acc;
            }, {}),
            appointments: appointments
        });

    } catch (error) {
        console.error('Calendar data error:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

// Update calendar day status
app.post('/api/calendar-day-status', authenticateToken, async (req, res) => {
    try {
        const { date, day_type, time_slots } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (userRole !== 'Tutor' && userRole !== 'Admin' && userRole !== 'Super Admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('calendar_day_status')
            .upsert({
                tutor_id: userId,
                date: date,
                day_type: day_type,
                time_slots: time_slots || [],
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });

    } catch (error) {
        console.error('Calendar day status error:', error);
        res.status(500).json({ error: 'Failed to update calendar day status' });
    }
});

// Book appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const { date, time, reason, tutor_id } = req.body;
        const studentId = req.user.userId;

        // Check if slot is available
        const { data: availability, error: availError } = await supabase
            .from('calendar_day_status')
            .select('*')
            .eq('date', date)
            .eq('day_type', 'available')
            .contains('time_slots', [time]);

        if (availError) throw availError;
        if (!availability || availability.length === 0) {
            return res.status(400).json({ error: 'Time slot not available' });
        }

        // Create appointment
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                student_id: studentId,
                tutor_id: tutor_id || availability[0].tutor_id,
                date: date,
                time: time,
                reason: reason,
                status: 'scheduled',
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });

    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// Holiday management
app.post('/api/holidays', authenticateToken, async (req, res) => {
    try {
        const { date, name, description, type } = req.body;
        const userRole = req.user.role;

        if (userRole !== 'Admin' && userRole !== 'Super Admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('holidays')
            .insert({
                date: date,
                name: name,
                description: description,
                type: type || 'public',
                created_by: req.user.userId,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) throw error;

        res.json({ success: true, data: data[0] });

    } catch (error) {
        console.error('Holiday creation error:', error);
        res.status(500).json({ error: 'Failed to create holiday' });
    }
});

app.delete('/api/holidays/:date', authenticateToken, async (req, res) => {
    try {
        const { date } = req.params;
        const userRole = req.user.role;

        if (userRole !== 'Admin' && userRole !== 'Super Admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('holidays')
            .delete()
            .eq('date', date);

        if (error) throw error;

        res.json({ success: true });

    } catch (error) {
        console.error('Holiday deletion error:', error);
        res.status(500).json({ error: 'Failed to delete holiday' });
    }
});

// User authentication
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Fetch user from Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !users) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users;

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Supabase URL: ${supabaseUrl}`);
});