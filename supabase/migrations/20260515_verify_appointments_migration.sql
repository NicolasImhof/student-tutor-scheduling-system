
-- Verification Script as a Migration
-- If this migration fails, it means there are still violations of the appointment scheduling rules.

DO $$
DECLARE
    violation_count INT;
BEGIN
    -- Check 1: Find any appointments scheduled outside of a tutor's working hours.
    SELECT COUNT(*) INTO violation_count
    FROM appointments_enhanced a
    JOIN working_hours wh ON a.tutor_id = wh.tutor_id AND EXTRACT(ISODOW FROM a.start_time) = wh.day_of_week
    WHERE (a.start_time::time < wh.start_time OR a.end_time::time > wh.end_time) AND a.status = 'Scheduled';

    IF violation_count > 0 THEN
        RAISE EXCEPTION 'Verification failed: Found % appointments outside of tutor working hours.', violation_count;
    END IF;

    -- Check 2: Find any appointments scheduled on a weekend.
    SELECT COUNT(*) INTO violation_count
    FROM appointments_enhanced
    WHERE EXTRACT(ISODOW FROM start_time) IN (6, 7) AND status = 'Scheduled';

    IF violation_count > 0 THEN
        RAISE EXCEPTION 'Verification failed: Found % appointments on weekends.', violation_count;
    END IF;

    -- Check 3: Find any 'Scheduled' appointments that fall on a system event day.
    SELECT COUNT(*) INTO violation_count
    FROM appointments_enhanced a
    JOIN system_events s ON a.start_time::date BETWEEN s.start_date AND s.end_date
    WHERE a.status = 'Scheduled';

    IF violation_count > 0 THEN
        RAISE EXCEPTION 'Verification failed: Found % scheduled appointments on event days.', violation_count;
    END IF;

    -- Check 4: Find any overlapping appointments for the same tutor or student.
    SELECT COUNT(*) INTO violation_count
    FROM appointments_enhanced a1, appointments_enhanced a2
    WHERE a1.appointment_id < a2.appointment_id
      AND (a1.student_id = a2.student_id OR a1.tutor_id = a2.tutor_id)
      AND (a1.start_time, a1.end_time) OVERLAPS (a2.start_time, a2.end_time)
      AND a1.status = 'Scheduled' AND a2.status = 'Scheduled';

    IF violation_count > 0 THEN
        RAISE EXCEPTION 'Verification failed: Found % overlapping appointments.', violation_count;
    END IF;

    RAISE NOTICE 'All verification checks passed.';
END $$;

