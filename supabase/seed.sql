-- More comprehensive seed data for the Student-to-Tutor Scheduling System

-- Clear existing data in the correct order to avoid foreign key constraints
DELETE FROM reviews;
DELETE FROM appointments_enhanced;
DELETE FROM working_hours;
DELETE FROM tutor_specializations;
DELETE FROM time_off_requests;
DELETE FROM users;
DELETE FROM courses;

-- Insert Courses
INSERT INTO courses (course_name, course_code) VALUES
('Calculus I', 'MATH101'),
('Calculus II', 'MATH102'),
('Linear Algebra', 'MATH201'),
('Introduction to Physics', 'PHYS101'),
('Advanced Physics', 'PHYS201'),
('Organic Chemistry', 'CHEM201'),
('World History', 'HIST101'),
('European History', 'HIST201'),
('English Literature', 'ENGL101'),
('Creative Writing', 'ENGL201');

-- Insert Users
INSERT INTO users (first_name, last_name, email, password, role, approval_status, category, major)
VALUES
-- Students
('Sally', 'Student', 'sally.student@example.com', 'password', 'Student', 'Approved', NULL, 'Physics'),
('Tom', 'Thumb', 'tom.thumb@example.com', 'password', 'Student', 'Approved', NULL, 'History'),
('Alice', 'Wonder', 'alice.wonder@example.com', 'password', 'Student', 'Approved', NULL, 'Chemistry'),
('Bob', 'Builder', 'bob.builder@example.com', 'password', 'Student', 'Approved', NULL, 'Math'),

-- Tutors
('Jane', 'Smith', 'jane.smith@example.com', 'password', 'Tutor', 'Approved', 'Science', NULL),
('John', 'Doe', 'john.doe@example.com', 'password', 'Tutor', 'Approved', 'Math', NULL),
('Emily', 'White', 'emily.white@example.com', 'password', 'Tutor', 'Approved', 'Humanities', NULL),
('Peter', 'Pan', 'peter.pan@example.com', 'password', 'Tutor', 'Pending', 'Humanities', NULL),

-- Admins
('Science', 'Admin', 'science.admin@example.com', 'password', 'Admin', 'Approved', 'Science', NULL),
('Math', 'Admin', 'math.admin@example.com', 'password', 'Admin', 'Approved', 'Math', NULL),
('Humanities', 'Admin', 'humanities.admin@example.com', 'password', 'Admin', 'Approved', 'Humanities', NULL),

-- Super Admin
('Super', 'Admin', 'superadmin@example.com', 'password', 'Super Admin', 'Approved', NULL, NULL);

-- Link Tutors to Courses
DO $$
DECLARE
    jane_id INTEGER := (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
    john_id INTEGER := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
    emily_id INTEGER := (SELECT user_id FROM users WHERE email = 'emily.white@example.com');
    physics_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Introduction to Physics');
    adv_physics_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Advanced Physics');
    chem_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Organic Chemistry');
    calc1_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Calculus I');
    calc2_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Calculus II');
    algebr_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Linear Algebra');
    world_hist_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'World History');
    euro_hist_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'European History');
    eng_lit_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'English Literature');
BEGIN
    INSERT INTO tutor_specializations (tutor_id, course_id) VALUES
    (jane_id, physics_id),
    (jane_id, adv_physics_id),
    (jane_id, chem_id),
    (john_id, calc1_id),
    (john_id, calc2_id),
    (john_id, algebr_id),
    (emily_id, world_hist_id),
    (emily_id, euro_hist_id),
    (emily_id, eng_lit_id);
END $$;

-- Set Tutor Working Hours
DO $$
DECLARE
    jane_id INTEGER := (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
    john_id INTEGER := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
    emily_id INTEGER := (SELECT user_id FROM users WHERE email = 'emily.white@example.com');
BEGIN
    INSERT INTO working_hours (tutor_id, day_of_week, start_time, end_time, is_working)
    VALUES
    (jane_id, 'Monday', '09:00', '17:00', TRUE),
    (jane_id, 'Wednesday', '09:00', '17:00', TRUE),
    (jane_id, 'Friday', '10:00', '15:00', TRUE),
    (john_id, 'Tuesday', '10:00', '18:00', TRUE),
    (john_id, 'Thursday', '10:00', '18:00', TRUE),
    (emily_id, 'Monday', '13:00', '19:00', TRUE),
    (emily_id, 'Tuesday', '13:00', '19:00', TRUE),
    (emily_id, 'Wednesday', '13:00', '19:00', TRUE);
END $$;

-- Create Time Off Request for a Tutor
DO $$
DECLARE
    john_id INTEGER := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
BEGIN
    INSERT INTO time_off_requests (tutor_id, start_date, end_date, reason, status)
    VALUES (john_id, NOW() + INTERVAL '10 days', NOW() + INTERVAL '12 days', 'Family event', 'Pending');
END $$;

-- Create Appointments and Reviews to ensure all users have interactions
DO $$
DECLARE
    sally_id INTEGER := (SELECT user_id FROM users WHERE email = 'sally.student@example.com');
    tom_id INTEGER := (SELECT user_id FROM users WHERE email = 'tom.thumb@example.com');
    alice_id INTEGER := (SELECT user_id FROM users WHERE email = 'alice.wonder@example.com');
    bob_id INTEGER := (SELECT user_id FROM users WHERE email = 'bob.builder@example.com');
    jane_id INTEGER := (SELECT user_id FROM users WHERE email = 'jane.smith@example.com');
    john_id INTEGER := (SELECT user_id FROM users WHERE email = 'john.doe@example.com');
    emily_id INTEGER := (SELECT user_id FROM users WHERE email = 'emily.white@example.com');
    physics_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Introduction to Physics');
    chem_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Organic Chemistry');
    calc1_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'Calculus I');
    world_hist_id INTEGER := (SELECT course_id FROM courses WHERE course_name = 'World History');
BEGIN
    -- Past appointment for Sally with Jane, with a review that has a deletion request
    INSERT INTO appointments_enhanced (student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (sally_id, jane_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour', 'Completed', physics_id);
    
    INSERT INTO reviews (appointment_id, student_id, tutor_id, rating, comment, deletion_requested)
    VALUES ((SELECT appointment_id FROM appointments_enhanced WHERE student_id = sally_id AND tutor_id = jane_id), sally_id, jane_id, 5, 'Jane was an amazing tutor! She really helped me understand the concepts.', true);

    -- Past appointment for Tom with John, with a review
    INSERT INTO appointments_enhanced (student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (tom_id, john_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1 hour', 'Completed', calc1_id);

    INSERT INTO reviews (appointment_id, student_id, tutor_id, rating, comment)
    VALUES ((SELECT appointment_id FROM appointments_enhanced WHERE student_id = tom_id AND tutor_id = john_id), tom_id, john_id, 4, 'John is a great tutor, very patient and knowledgeable.');

    -- Past appointment for Alice with Jane, with a review
    INSERT INTO appointments_enhanced (student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (alice_id, jane_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour', 'Completed', chem_id);

    INSERT INTO reviews (appointment_id, student_id, tutor_id, rating, comment)
    VALUES ((SELECT appointment_id FROM appointments_enhanced WHERE student_id = alice_id AND tutor_id = jane_id), alice_id, jane_id, 3, 'Session was okay, but we didn''t cover as much as I hoped.');

    -- Upcoming appointment for Bob with Emily
    INSERT INTO appointments_enhanced (student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (bob_id, emily_id, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Scheduled', world_hist_id);

    -- Upcoming (but needs confirmation) appointment for Sally with John
    INSERT INTO appointments_enhanced (student_id, tutor_id, start_time, end_time, status, course_id)
    VALUES (sally_id, john_id, NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '1 hour', 'Scheduled', calc1_id);

END $$;
