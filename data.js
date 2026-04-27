const users = [
    { email: 'student@example.com', password: 'password123', role: 'Student' },
    { email: 'tutor@example.com', password: 'password123', role: 'Tutor' },
    { email: 'admin@example.com', password: 'password123', role: 'Admin' },
    { email: 'superadmin@example.com', password: 'password123', role: 'Super Admin' }
];

const appointments = [
    { id: 1, student: 'student@example.com', tutor: 'tutor@example.com', date: '2026-04-15T10:00:00', course: 'Calculus I', status: 'Scheduled', duration: 60, notes: 'Review derivatives' },
    { id: 2, student: 'student@example.com', tutor: 'tutor@example.com', date: '2026-04-18T14:00:00', course: 'Physics I', status: 'Completed', duration: 90, notes: 'Final exam prep' },
    { id: 3, student: 'student2@example.com', tutor: 'tutor@example.com', date: '2026-04-20T09:00:00', course: 'Algebra II', status: 'Scheduled', duration: 60, notes: 'Quadratic equations' },
    { id: 4, student: 'student3@example.com', tutor: 'tutor@example.com', date: '2026-04-22T11:00:00', course: 'Statistics', status: 'Scheduled', duration: 60, notes: 'Probability review' },
    { id: 5, student: 'student4@example.com', tutor: 'tutor@example.com', date: '2026-04-25T15:00:00', course: 'Geometry', status: 'Pending', duration: 90, notes: 'Triangle theorems' },
    { id: 6, student: 'student5@example.com', tutor: 'tutor@example.com', date: '2026-04-28T10:00:00', course: 'Trigonometry', status: 'Scheduled', duration: 60, notes: 'Sine and cosine' },
    { id: 7, student: 'student6@example.com', tutor: 'tutor@example.com', date: '2026-05-02T13:00:00', course: 'Pre-Calculus', status: 'Scheduled', duration: 120, notes: 'Function analysis' },
    { id: 8, student: 'student7@example.com', tutor: 'tutor@example.com', date: '2026-05-05T16:00:00', course: 'Linear Algebra', status: 'Completed', duration: 60, notes: 'Matrix operations' },
    { id: 9, student: 'student8@example.com', tutor: 'tutor@example.com', date: '2026-05-08T09:30:00', course: 'Differential Equations', status: 'Scheduled', duration: 90, notes: 'First order DE' },
    { id: 10, student: 'student9@example.com', tutor: 'tutor@example.com', date: '2026-05-12T14:30:00', course: 'Number Theory', status: 'Scheduled', duration: 60, notes: 'Prime numbers' },
    { id: 11, student: 'student10@example.com', tutor: 'tutor@example.com', date: '2026-05-15T11:00:00', course: 'Abstract Algebra', status: 'Scheduled', duration: 120, notes: 'Group theory' },
    { id: 12, student: 'student11@example.com', tutor: 'tutor@example.com', date: '2026-05-18T15:30:00', course: 'Real Analysis', status: 'Pending', duration: 90, notes: 'Limits and continuity' }
];

const availability = {
    'tutor@example.com': {
        '2026-04-15': { status: 'available', slots: ['10:00', '11:00', '14:00'] },
        '2026-04-16': { status: 'available', slots: ['09:00', '10:00', '11:00', '13:00'] },
        '2026-04-22': { status: 'vacation', approved: false, slots: [] }
    }
};

const workingHours = {
    'tutor@example.com': {
        weeklySchedule: {
            'Monday': { start: '09:00', end: '17:00', working: true },
            'Tuesday': { start: '09:00', end: '17:00', working: true },
            'Wednesday': { start: '09:00', end: '17:00', working: true },
            'Thursday': { start: '09:00', end: '17:00', working: true },
            'Friday': { start: '09:00', end: '17:00', working: true },
            'Saturday': { start: '10:00', end: '14:00', working: true },
            'Sunday': { working: false }
        }
    }
};

const vacationRequests = [
    { tutor: 'tutor@example.com', date: '2026-04-22', status: 'pending' }
];

const holidays = ['2026-04-25'];
