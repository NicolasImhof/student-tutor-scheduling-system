-- Clear existing data
DELETE FROM reviews;
DELETE FROM appointments;
DELETE FROM working_hours;
DELETE FROM tutor_specializations;
DELETE FROM users;
DELETE FROM courses;

-- Insert Courses
INSERT INTO courses (course_name, category) VALUES
('Calculus I', 'Math'),
('Linear Algebra', 'Math'),
('Introduction to Physics', 'Science'),
('Organic Chemistry', 'Science'),
('World History', 'Humanities'),
('English Literature', 'Humanities');

-- Insert Users
INSERT INTO users (first_name, last_name, email, password, role, approval_status, category, major)
VALUES
-- Students
('Sally', 'Student', 'sally.student@example.com', 'password', 'Student', 'Approved', NULL, 'Physics'),
('Tom', 'Thumb', 'tom.thumb@example.com', 'password', 'Student', 'Approved', NULL, 'History'),

-- Tutors
('Jane', 'Smith', 'jane.smith@example.com', 'password', 'Tutor', 'Approved', 'Science', NULL),
('John', 'Doe', 'john.doe@example.com', 'password', 'Tutor', 'Approved', 'Math', NULL),
('Peter', 'Pan', 'peter.pan@example.com', 'password', 'Tutor', 'Pending', 'Humanities', NULL),

-- Admins
('Science', 'Admin', 'science.admin@example.com', 'password', 'Admin', 'Approved', 'Science', NULL),
('Math', 'Admin', 'math.admin@example.com', 'password', 'Admin', 'Approved', 'Math', NULL),

-- Super Admin
('Super', 'Admin', 'superadmin@example.com', 'password', 'Super Admin', 'Approved', NULL, NULL);

-- Link Tutors to Courses
DO $$
DECLARE
    jane_id UUID := (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
    john_id UUID := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
    physics_id UUID := (SELECT course_id FROM courses WHERE course_name = 'Introduction to Physics');
    chem_id UUID := (SELECT course_id FROM courses WHERE course_name = 'Organic Chemistry');
    calc_id UUID := (SELECT course_id FROM courses WHERE course_name = 'Calculus I');
    algebr-id UUID := (SELECT course_id FROM courses WHERE course_name = 'Linear Algebra');
BEGIN
    INSERT INTO tutor_specializations (tutor_id, course_id) VALUES
    (jane_id, physics_id),
    (jane_id, chem_id),
    (john_id, calc_id),
    (john_id, algebr-id);
END $$;

-- Set Tutor Working Hours
DO $$
DECLARE
    jane_id UUID := (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
    john_id UUID := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
BEGIN
    INSERT INTO working_hours (tutor_id, day_of_week, start_time, end_time, is_working)
    VALUES
    (jane_id, 'Monday', '09:00', '17:00', TRUE),
    (jane_id, 'Wednesday', '09:00', '17:00', TRUE),
    (jane_id, 'Friday', '10:00', '15:00', TRUE),
    (john_id, 'Tuesday', '10:00', '18:00', TRUE),
    (john_id, 'Thursday', '10:00', '18:00', TRUE);
END $$;

-- Create Appointments and Reviews
DO $$
DECLARE
    sally_id UUID := (SELECT user_id FROM users WHERE email = 'sally.student@example.com');
    tom_id UUID := (SELECT user_id FROM users WHERE email = 'tom.thumb@example.com');
    jane_id UUID := (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
    john_id UUID := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
    physics_id UUID := (SELECT course_id FROM courses WHERE course_name = 'Introduction to Physics');
    calc_id UUID := (SELECT course_id FROM courses WHERE course_name = 'Calculus I');
    appt1_id UUID := gen_random_uuid();
    appt2_id UUID := gen_random_uuid();
BEGIN
    -- Past appointment for Sally with Jane, with a review
    INSERT INTO appointments (appointment_id, student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (appt1_id, sally_id, jane_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour', 'Completed', physics_id);
    
    INSERT INTO reviews (appointment_id, student_id, tutor_id, rating, comment)
    VALUES (appt1_id, sally_id, jane_id, 5, 'Jane was an amazing tutor! She really helped me understand the concepts.');

    -- Upcoming appointment for Tom with John
    INSERT INTO appointments (appointment_id, student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (appt2_id, tom_id, john_id, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '1 hour', 'Scheduled', calc_id);
END $$;
