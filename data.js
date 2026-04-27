const users = [
    { email: 'student@example.com', password: 'password123', role: 'Student' },
    { email: 'tutor@example.com', password: 'password123', role: 'Tutor' },
    { email: 'admin@example.com', password: 'password123', role: 'Admin' },
    { email: 'superadmin@example.com', password: 'password123', role: 'Super Admin' }
];

const appointments = [
    { id: 1, student: 'student@example.com', tutor: 'tutor@example.com', date: '2026-04-15T10:00:00', course: 'Calculus I', status: 'Scheduled' },
    { id: 2, student: 'student@example.com', tutor: 'tutor@example.com', date: '2026-04-18T14:00:00', course: 'Physics I', status: 'Completed' }
];

const availability = {
    'tutor@example.com': [
        { date: '2026-04-15', slots: ['10:00', '11:00', '14:00'] },
        { date: '2026-04-16', slots: ['09:00', '10:00', '11:00', '13:00'] }
    ]
};

const holidays = ['2026-04-25'];
