
INSERT INTO appointments_enhanced (student_id, tutor_id, course_id, start_time, end_time, status, reason_notes, location, is_recurring, recurring_rule, topic)
VALUES
-- Completed Appointments (before current date)
(2, 1, 1, '2026-05-11 09:00:00', '2026-05-11 09:30:00', 'Completed', NULL, 'Online', FALSE, NULL, 'Review of Basic Algebra'),
(3, 1, 1, '2026-05-12 10:30:00', '2026-05-12 11:30:00', 'Completed', NULL, 'Library Room 203', FALSE, NULL, 'Advanced Linear Equations'),
(4, 2, 2, '2026-05-13 14:00:00', '2026-05-13 15:00:00', 'Completed', NULL, 'Online', FALSE, NULL, 'Creative Writing Workshop'),

-- Scheduled Appointments (within tutor schedules)
(5, 2, 2, '2026-05-18 11:30:00', '2026-05-18 12:00:00', 'Scheduled', NULL, 'Online', FALSE, NULL, 'Understanding Thesis Statements'),
(6, 3, 3, '2026-05-19 13:00:00', '2026-05-19 14:30:00', 'Scheduled', NULL, 'Science Lab 1', FALSE, NULL, 'Photosynthesis Process'),
(7, 3, 3, '2026-05-20 09:00:00', '2026-05-20 09:30:00', 'Scheduled', NULL, 'Online', FALSE, NULL, 'Genetics and DNA'),

-- Canceled Appointments (due to events or other reasons)
(8, 4, 4, '2026-05-21 15:30:00', '2026-05-21 16:00:00', 'Canceled', 'Tutor last-minute emergency', 'Online', FALSE, NULL, 'Intro to Calculus'),
(9, 4, 4, '2026-01-20 16:00:00', '2026-01-20 17:00:00', 'Canceled', 'Campus closed due to snow day', 'Campus-wide', FALSE, NULL, 'Advanced Derivatives'),
(10, 5, 5, '2026-05-25 10:30:00', '2026-05-25 11:00:00', 'Canceled', 'University Holiday: Memorial Day', 'Campus-wide', FALSE, NULL, 'Python Programming Basics');
