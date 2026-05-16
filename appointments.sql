
INSERT INTO appointments_enhanced (student_id, tutor_id, course_id, start_time, end_time, status, reason_notes, location, is_recurring, recurring_rule, topic)
VALUES
-- Completed Appointments
(2, 1, 1, '2026-05-11 09:00:00', '2026-05-11 09:30:00', 'Completed', NULL, 'Online', FALSE, NULL, 'Introduction to Algebra'),
(3, 1, 1, '2026-05-12 10:00:00', '2026-05-12 11:00:00', 'Completed', NULL, 'Library Room 101', FALSE, NULL, 'Linear Equations'),
(4, 2, 2, '2026-05-13 14:00:00', '2026-05-13 14:30:00', 'Completed', NULL, 'Online', FALSE, NULL, 'Essay Writing'),

-- Scheduled Appointments
(5, 2, 2, '2026-05-18 11:00:00', '2026-05-18 11:30:00', 'Scheduled', NULL, 'Online', FALSE, NULL, 'Grammar Review'),
(6, 3, 3, '2026-05-19 13:00:00', '2026-05-19 14:00:00', 'Scheduled', NULL, 'Science Lab 3', FALSE, NULL, 'Cell Biology'),
(7, 3, 3, '2026-05-20 09:30:00', '2026-05-20 10:00:00', 'Scheduled', NULL, 'Online', FALSE, NULL, 'Genetics'),

-- Canceled Appointments
(8, 4, 4, '2026-05-21 15:00:00', '2026-05-21 15:30:00', 'Canceled', 'Tutor sick', 'Online', FALSE, NULL, 'Calculus I'),
(9, 4, 4, '2026-05-22 16:00:00', '2026-05-22 17:00:00', 'Canceled', 'Snow day', 'Campus wide', FALSE, NULL, 'Derivatives'),
(10, 5, 5, '2026-05-25 10:00:00', '2026-05-25 10:30:00', 'Canceled', 'Memorial Day', 'Campus wide', FALSE, NULL, 'Intro to Programming');
