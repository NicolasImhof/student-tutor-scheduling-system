
-- Step 1: Drop the trigger to prevent recursive errors during bulk insert.
DROP TRIGGER IF EXISTS on_appointment_change_update_enhanced ON appointments_enhanced;

-- Step 2: Truncate the table to erase all old, incorrect data.
TRUNCATE TABLE appointments_enhanced, reviews RESTART IDENTITY CASCADE;

-- Step 3: Insert the new, rule-compliant appointments.
-- All appointments are scheduled on weekdays (Monday-Friday), between 09:00 and 17:00.
-- All appointments are on 30-minute intervals and do not overlap for any student or tutor.

INSERT INTO appointments_enhanced (student_id, tutor_id, course_id, start_time, end_time, status, location, topic)
VALUES
-- Tutor 1 (Math)
((SELECT user_id FROM users WHERE email = 'student1@example.com'), (SELECT user_id FROM users WHERE email = 'tutor1@example.com'), (SELECT course_id FROM courses WHERE course_code = 'MATH101'), '2026-05-18 09:00:00', '2026-05-18 09:30:00', 'Scheduled', 'Online', 'Algebra I'),
((SELECT user_id FROM users WHERE email = 'student1@example.com'), (SELECT user_id FROM users WHERE email = 'tutor1@example.com'), (SELECT course_id FROM courses WHERE course_code = 'MATH101'), '2026-05-19 10:00:00', '2026-05-19 10:30:00', 'Scheduled', 'Online', 'Algebra II'),
((SELECT user_id FROM users WHERE email = 'student1@example.com'), (SELECT user_id FROM users WHERE email = 'tutor1@example.com'), (SELECT course_id FROM courses WHERE course_code = 'MATH101'), '2026-05-20 11:00:00', '2026-05-20 11:30:00', 'Scheduled', 'Online', 'Geometry'),
((SELECT user_id FROM users WHERE email = 'student1@example.com'), (SELECT user_id FROM users WHERE email = 'tutor1@example.com'), (SELECT course_id FROM courses WHERE course_code = 'MATH101'), '2026-05-21 13:00:00', '2026-05-21 13:30:00', 'Scheduled', 'Online', 'Trigonometry'),
((SELECT user_id FROM users WHERE email = 'student1@example.com'), (SELECT user_id FROM users WHERE email = 'tutor1@example.com'), (SELECT course_id FROM courses WHERE course_code = 'MATH101'), '2026-05-22 14:00:00', '2026-05-22 14:30:00', 'Scheduled', 'Online', 'Calculus'),

-- Tutor 2 (English)
((SELECT user_id FROM users WHERE email = 'student2@example.com'), (SELECT user_id FROM users WHERE email = 'tutor2@example.com'), (SELECT course_id FROM courses WHERE course_code = 'ENGL201'), '2026-05-18 09:30:00', '2026-05-18 10:00:00', 'Scheduled', 'Online', 'Shakespeare'),
((SELECT user_id FROM users WHERE email = 'student2@example.com'), (SELECT user_id FROM users WHERE email = 'tutor2@example.com'), (SELECT course_id FROM courses WHERE course_code = 'ENGL201'), '2026-05-19 10:30:00', '2026-05-19 11:00:00', 'Scheduled', 'Online', 'Poe'),
((SELECT user_id FROM users WHERE email = 'student2@example.com'), (SELECT user_id FROM users WHERE email = 'tutor2@example.com'), (SELECT course_id FROM courses WHERE course_code = 'ENGL201'), '2026-05-20 11:30:00', '2026-05-20 12:00:00', 'Scheduled', 'Online', 'Essay Structure'),
((SELECT user_id FROM users WHERE email = 'student2@example.com'), (SELECT user_id FROM users WHERE email = 'tutor2@example.com'), (SELECT course_id FROM courses WHERE course_code = 'ENGL201'), '2026-05-21 13:30:00', '2026-05-21 14:00:00', 'Scheduled', 'Online', 'Thesis Statements'),
((SELECT user_id FROM users WHERE email = 'student2@example.com'), (SELECT user_id FROM users WHERE email = 'tutor2@example.com'), (SELECT course_id FROM courses WHERE course_code = 'ENGL201'), '2026-05-22 14:30:00', '2026-05-22 15:00:00', 'Scheduled', 'Online', 'Creative Writing'),

-- Tutor 3 (Biology)
((SELECT user_id FROM users WHERE email = 'student3@example.com'), (SELECT user_id FROM users WHERE email = 'tutor3@example.com'), (SELECT course_id FROM courses WHERE course_code = 'BIOL101'), '2026-05-18 10:00:00', '2026-05-18 10:30:00', 'Scheduled', 'Online', 'Cell Biology'),
((SELECT user_id FROM users WHERE email = 'student3@example.com'), (SELECT user_id FROM users WHERE email = 'tutor3@example.com'), (SELECT course_id FROM courses WHERE course_code = 'BIOL101'), '2026-05-19 11:00:00', '2026-05-19 11:30:00', 'Scheduled', 'Online', 'Genetics'),
((SELECT user_id FROM users WHERE email = 'student3@example.com'), (SELECT user_id FROM users WHERE email = 'tutor3@example.com'), (SELECT course_id FROM courses WHERE course_code = 'BIOL101'), '2026-05-20 12:00:00', '2026-05-20 12:30:00', 'Scheduled', 'Online', 'Evolution'),
((SELECT user_id FROM users WHERE email = 'student3@example.com'), (SELECT user_id FROM users WHERE email = 'tutor3@example.com'), (SELECT course_id FROM courses WHERE course_code = 'BIOL101'), '2026-05-21 14:00:00', '2026-05-21 14:30:00', 'Scheduled', 'Online', 'Ecology'),
((SELECT user_id FROM users WHERE email = 'student3@example.com'), (SELECT user_id FROM users WHERE email = 'tutor3@example.com'), (SELECT course_id FROM courses WHERE course_code = 'BIOL101'), '2026-05-22 15:00:00', '2026-05-22 15:30:00', 'Scheduled', 'Online', 'Anatomy');

-- Step 4: Recreate the trigger.
CREATE TRIGGER on_appointment_change_update_enhanced
    AFTER INSERT OR UPDATE ON appointments_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_details();
