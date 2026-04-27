-- Initial data for Student-Tutor Scheduling System
-- Execute this in Supabase SQL Editor after running schema.sql and 001_enhanced_calendar.sql

-- Create SQL execution helper function (if not exists)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Insert sample users with different roles
-- Password for all users: 'password' (hashed with bcrypt)
INSERT INTO users (email, password, role, name) VALUES 
('student@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'John Student'),
('tutor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Tutor', 'Jane Tutor'),
('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Admin User'),
('superadmin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Admin', 'Super Admin');

-- Insert sample tutors
INSERT INTO tutors (user_id, name, email, subject, bio, hourly_rate, rating) VALUES 
((SELECT id FROM users WHERE email = 'tutor@example.com'), 'Jane Tutor', 'tutor@example.com', 'Mathematics', 'Experienced math tutor with 5+ years of experience teaching algebra, calculus, and statistics.', 50.00, 4.8),
((SELECT id FROM users WHERE email = 'admin@example.com'), 'Admin Tutor', 'admin@example.com', 'Physics', 'Physics expert with advanced degree and teaching experience.', 60.00, 4.9);

-- Insert sample tutor availability
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available) VALUES 
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 1, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 2, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 3, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 4, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 5, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'admin@example.com'), 1, '10:00', '16:00', true),
((SELECT id FROM tutors WHERE email = 'admin@example.com'), 3, '10:00', '16:00', true),
((SELECT id FROM tutors WHERE email = 'admin@example.com'), 5, '10:00', '16:00', true);

-- Insert sample holidays for 2024-2025
INSERT INTO holidays (date, name, description) VALUES 
('2024-01-01', 'New Year''s Day', 'New Year holiday'),
('2024-07-04', 'Independence Day', 'US Independence Day'),
('2024-12-25', 'Christmas Day', 'Christmas holiday'),
('2025-01-01', 'New Year''s Day', 'New Year holiday'),
('2025-07-04', 'Independence Day', 'US Independence Day'),
('2025-12-25', 'Christmas Day', 'Christmas holiday');

-- Insert sample calendar day statuses for demonstration
INSERT INTO calendar_day_status (date, status, description) VALUES 
('2024-12-02', 'busy', 'Busy day with many appointments'),
('2024-12-03', 'available', 'Fully available for bookings'),
('2024-12-04', 'unavailable', 'Personal day off'),
('2024-12-05', 'holiday', 'Holiday - office closed'),
('2024-12-06', 'available', 'Available for appointments');

-- Insert sample appointments
INSERT INTO appointments (student_id, tutor_id, appointment_date, start_time, end_time, status, subject, notes) VALUES 
(
    (SELECT id FROM users WHERE email = 'student@example.com'),
    (SELECT id FROM tutors WHERE email = 'tutor@example.com'),
    '2024-12-02',
    '10:00',
    '11:00',
    'scheduled',
    'Mathematics',
    'Review algebra concepts for upcoming exam'
),
(
    (SELECT id FROM users WHERE email = 'student@example.com'),
    (SELECT id FROM tutors WHERE email = 'admin@example.com'),
    '2024-12-03',
    '14:00',
    '15:00',
    'completed',
    'Physics',
    'Quantum mechanics basics session'
);

-- Insert sample messages between users
INSERT INTO messages (sender_id, receiver_id, subject, content, timestamp, is_read) VALUES 
(
    (SELECT id FROM users WHERE email = 'student@example.com'),
    (SELECT id FROM users WHERE email = 'tutor@example.com'),
    'Question about tomorrow''s session',
    'Hi Jane, I wanted to confirm our session tomorrow at 10 AM. Should I bring any specific materials?',
    NOW(),
    false
),
(
    (SELECT id FROM users WHERE email = 'tutor@example.com'),
    (SELECT id FROM users WHERE email = 'student@example.com'),
    'Re: Question about tomorrow''s session',
    'Hi John! Yes, please bring your textbook and any homework assignments you''re working on. See you tomorrow!',
    NOW() + INTERVAL '1 hour',
    true
);

-- Insert sample reviews
INSERT INTO reviews (student_id, tutor_id, rating, comment, timestamp) VALUES 
(
    (SELECT id FROM users WHERE email = 'student@example.com'),
    (SELECT id FROM tutors WHERE email = 'tutor@example.com'),
    5,
    'Excellent tutor! Very patient and explains concepts clearly.',
    NOW() - INTERVAL '7 days'
),
(
    (SELECT id FROM users WHERE email = 'student@example.com'),
    (SELECT id FROM tutors WHERE email = 'admin@example.com'),
    4,
    'Great physics tutor. Helped me understand quantum mechanics.',
    NOW() - INTERVAL '14 days'
);

-- Verify data insertion
SELECT 'Users created:' as info, COUNT(*) as count FROM users;
SELECT 'Tutors created:' as info, COUNT(*) as count FROM tutors;
SELECT 'Appointments created:' as info, COUNT(*) as count FROM appointments;
SELECT 'Holidays created:' as info, COUNT(*) as count FROM holidays;
SELECT 'Messages created:' as info, COUNT(*) as count FROM messages;
SELECT 'Reviews created:' as info, COUNT(*) as count FROM reviews;

-- Display sample login credentials
SELECT 'Sample Login Credentials:' as info;
SELECT 'Student: student@example.com / password' as credentials;
SELECT 'Tutor: tutor@example.com / password' as credentials;
SELECT 'Admin: admin@example.com / password' as credentials;
SELECT 'Super Admin: superadmin@example.com / password' as credentials;