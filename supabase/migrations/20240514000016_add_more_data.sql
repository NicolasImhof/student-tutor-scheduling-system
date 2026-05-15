DELETE FROM reviews;

-- Add more appointments
INSERT INTO appointments_enhanced (student_id, tutor_id, course_id, start_time, end_time, status) VALUES
(102, 106, 70, '2026-05-10 10:00:00+00', '2026-05-10 11:00:00+00', 'Completed'),
(102, 107, 71, '2026-05-17 10:00:00+00', '2026-05-17 11:00:00+00', 'Scheduled'),
(102, 108, 72, '2026-05-24 10:00:00+00', '2026-05-24 11:00:00+00', 'Scheduled'),
(103, 106, 70, '2026-05-11 11:00:00+00', '2026-05-11 12:00:00+00', 'Completed'),
(103, 107, 71, '2026-05-18 11:00:00+00', '2026-05-18 12:00:00+00', 'Scheduled'),
(103, 108, 72, '2026-05-25 11:00:00+00', '2026-05-25 12:00:00+00', 'Scheduled'),
(104, 106, 70, '2026-05-12 12:00:00+00', '2026-05-12 13:00:00+00', 'Completed'),
(104, 107, 71, '2026-05-19 12:00:00+00', '2026-05-19 13:00:00+00', 'Scheduled'),
(104, 108, 72, '2026-05-26 12:00:00+00', '2026-05-26 13:00:00+00', 'Scheduled');

-- Add reviews for completed appointments
INSERT INTO reviews (appointment_id, student_id, tutor_id, rating, comment) VALUES
((SELECT appointment_id FROM appointments_enhanced WHERE student_id = 102 AND status = 'Completed' LIMIT 1), 102, 106, 5, 'Great tutor!'),
((SELECT appointment_id FROM appointments_enhanced WHERE student_id = 103 AND status = 'Completed' LIMIT 1), 103, 106, 4, 'Very helpful.'),
((SELECT appointment_id FROM appointments_enhanced WHERE student_id = 104 AND status = 'Completed' LIMIT 1), 104, 106, 5, 'Excellent session.');
