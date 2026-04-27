// Simple mock server for preview demonstration
// This server runs without external dependencies

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8090;

// Mock data for demonstration
const mockUsers = {
    'student@example.com': { password: 'password123', role: 'Student', name: 'John Student', approval_status: 'Approved' },
    'student2@example.com': { password: 'password123', role: 'Student', name: 'Sarah Student', approval_status: 'Approved' },
    'tutor@example.com': { password: 'password123', role: 'Tutor', name: 'Jane Tutor', approval_status: 'Approved' },
    'tutor2@example.com': { password: 'password123', role: 'Tutor', name: 'Mike Tutor', approval_status: 'Pending' },
    'admin@example.com': { password: 'password123', role: 'Admin', name: 'Admin User', approval_status: 'Approved' },
    'superadmin@example.com': { password: 'password123', role: 'Super Admin', name: 'Super Admin', approval_status: 'Approved' }
};

const mockTutors = [
    { id: 1, name: 'Jane Tutor', email: 'tutor@example.com', subject: 'Mathematics', bio: 'Experienced math tutor', hourly_rate: 50, rating: 4.8 },
    { id: 2, name: 'Admin Tutor', email: 'admin@example.com', subject: 'Physics', bio: 'Physics expert', hourly_rate: 60, rating: 4.9 }
];

const mockHolidays = [
    '2024-12-25', '2025-01-01', '2025-07-04'
];

// Simple file server
function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

// Mock API endpoints
function handleAPI(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    if (path === '/api/login') {
        // Mock login endpoint
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { email, password } = JSON.parse(body);
            const user = mockUsers[email];
            
            if (user && user.password === password) {
                res.end(JSON.stringify({
                    token: 'mock-jwt-token',
                    user: { email, role: user.role, name: user.name }
                }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({ error: 'Invalid credentials' }));
            }
        });
    } else if (path === '/api/calendar-data') {
        // Mock calendar data - return format matching the Calendar class expectations
        const { start_date, end_date } = parsedUrl.query;
        res.end(JSON.stringify({
            holidays: mockHolidays,
            availability: {
                'tutor@example.com': {
                    '2024-12-02': { status: 'available', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
                    '2024-12-03': { status: 'busy', slots: ['10:00', '11:00'] },
                    '2024-12-04': { status: 'unavailable', slots: [] }
                }
            },
            appointments: []
        }));
    } else if (path === '/api/tutors') {
        res.end(JSON.stringify(mockTutors));
    } else if (path === '/api/admin/tutors') {
        // Return all tutors with their working hours and availability
        const tutorData = Object.keys(mockUsers)
            .filter(email => mockUsers[email].role === 'Tutor')
            .map(email => ({
                email: email,
                name: mockUsers[email].name,
                workingHours: mockWorkingHours[email] || { weeklySchedule: {} },
                availability: mockAvailability[email] || {}
            }));
        res.end(JSON.stringify(tutorData));
    } else if (path === '/api/admin/approve-hours') {
        // Mock approve working hours
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { tutorEmail, action } = JSON.parse(body);
            res.end(JSON.stringify({ success: true, message: `Hours ${action}d successfully` }));
        });
    } else if (path === '/api/admin/approve-vacation') {
        // Mock approve vacation
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { tutorEmail, action } = JSON.parse(body);
            res.end(JSON.stringify({ success: true, message: `Vacation ${action}d successfully` }));
        });
    } else if (path === '/api/admin/users') {
        // Return all users for admin management
        const usersData = Object.keys(mockUsers).map(email => ({
            email: email,
            name: mockUsers[email].name,
            role: mockUsers[email].role,
            approval_status: mockUsers[email].approval_status || 'Approved'
        }));
        res.end(JSON.stringify(usersData));
    } else if (path === '/api/admin/toggle-user-status' && req.method === 'POST') {
        // Mock toggle user status
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { userEmail, newStatus } = JSON.parse(body);
            if (mockUsers[userEmail]) {
                mockUsers[userEmail].approval_status = newStatus;
            }
            res.end(JSON.stringify({ success: true, message: `User status updated to ${newStatus}` }));
        });
    } else if (path === '/api/admin/holidays') {
        if (req.method === 'GET') {
            // Return all holidays
            res.end(JSON.stringify(mockHolidays));
        } else if (req.method === 'POST') {
            // Add new holiday
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                const { date, name } = JSON.parse(body);
                const newHoliday = { id: Date.now(), date, name };
                mockHolidays.push(newHoliday);
                res.end(JSON.stringify({ success: true, message: 'Holiday added successfully' }));
            });
        }
    } else if (path.startsWith('/api/admin/holidays/') && req.method === 'DELETE') {
        // Delete holiday
        const holidayId = parseInt(path.split('/').pop());
        const index = mockHolidays.findIndex(h => h.id === holidayId);
        if (index !== -1) {
            mockHolidays.splice(index, 1);
            res.end(JSON.stringify({ success: true, message: 'Holiday removed successfully' }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Holiday not found' }));
        }
    } else if (path === '/api/admin/schedule-config' && req.method === 'POST') {
        // Mock save schedule configuration
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const config = JSON.parse(body);
            res.end(JSON.stringify({ success: true, message: 'Schedule configuration saved successfully' }));
        });
    } else {
        res.end(JSON.stringify({ message: 'Mock API endpoint' }));
    }
}

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle API requests
    if (pathname.startsWith('/api/')) {
        handleAPI(req, res);
        return;
    }
    
    // Handle static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    serveFile(res, filePath, contentType);
});

server.listen(PORT, () => {
    console.log(`🚀 Mock server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/`);
    console.log('');
    console.log('🌐 Website Preview URLs:');
    console.log(`   Main page: http://localhost:${PORT}`);
    console.log(`   Student dashboard: http://localhost:${PORT}/student-dashboard.html`);
    console.log(`   Tutor dashboard: http://localhost:${PORT}/tutor-dashboard.html`);
    console.log(`   Admin dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log('');
    console.log('🔑 Test login credentials:');
    console.log('   student@example.com / password');
    console.log('   tutor@example.com / password');
    console.log('   admin@example.com / password');
    console.log('   superadmin@example.com / password');
});

module.exports = server;