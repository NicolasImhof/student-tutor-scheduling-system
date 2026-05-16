
-- Verification Script
-- This script checks for any violations of the appointment scheduling rules.
-- If any of these queries return a single row, the data is still incorrect.


-- Check 1: Find any appointments scheduled outside of a tutor's working hours.
SELECT
    a.appointment_id,
    a.tutor_id,
    u.full_name AS tutor_name,
    to_char(a.start_time, 'YYYY-MM-DD') AS appointment_date,
    EXTRACT(ISODOW FROM a.start_time) AS day_of_week,
    to_char(a.start_time, 'HH24:MI:SS') AS appointment_start_time,
    wh.start_time AS tutor_shift_start,
    wh.end_time AS tutor_shift_end
FROM
    appointments_enhanced a
JOIN
    working_hours wh ON a.tutor_id = wh.tutor_id AND EXTRACT(ISODOW FROM a.start_time) = wh.day_of_week
JOIN
    users u ON a.tutor_id = u.user_id
WHERE
    (a.start_time::time < wh.start_time OR a.end_time::time > wh.end_time) AND a.status = 'Scheduled';


-- Check 2: Find any appointments scheduled on a weekend.
SELECT
    appointment_id,
    to_char(start_time, 'YYYY-MM-DD') AS appointment_date,
    EXTRACT(ISODOW FROM start_time) AS day_of_week
FROM
    appointments_enhanced
WHERE
    EXTRACT(ISODOW FROM start_time) IN (6, 7) AND status = 'Scheduled';


-- Check 3: Find any 'Scheduled' appointments that fall on a system event day.
SELECT
    a.appointment_id,
    a.start_time,
    s.name AS event_name
FROM
    appointments_enhanced a
JOIN
    system_events s ON a.start_time::date BETWEEN s.start_date AND s.end_date
WHERE
    a.status = 'Scheduled';


-- Check 4: Find any overlapping appointments for the same tutor or student.
SELECT
    a1.appointment_id AS appt1_id,
    a1.student_id AS student1,
    a1.tutor_id AS tutor1,
    a1.start_time AS start1,
    a1.end_time AS end1,
    a2.appointment_id AS appt2_id,
    a2.student_id AS student2,
    a2.tutor_id AS tutor2,
    a2.start_time AS start2,
    a2.end_time AS end2
FROM
    appointments_enhanced a1, appointments_enhanced a2
WHERE
    a1.appointment_id < a2.appointment_id
    AND (a1.student_id = a2.student_id OR a1.tutor_id = a2.tutor_id)
    AND (a1.start_time, a1.end_time) OVERLAPS (a2.start_time, a2.end_time)
    AND a1.status = 'Scheduled' AND a2.status = 'Scheduled';

