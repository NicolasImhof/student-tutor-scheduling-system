-- Final attempt: Move all seeding logic into a single, secure PostgreSQL function
CREATE OR REPLACE FUNCTION seed_all_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Data holding variables
    tutor_record RECORD;
    student_record RECORD;
    course_record RECORD;
    working_hour_record RECORD;
    event_record RECORD;

    -- Looping and generation variables
    target_date DATE;
    day_of_week INT;
    current_time TIMESTAMPTZ;
    working_end_time TIMESTAMPTZ;
    appointment_end_time TIMESTAMPTZ;
    duration INT;
    new_status TEXT;
    new_reason TEXT;

BEGIN
    -- 1. Empty the table first to ensure a clean slate
    DELETE FROM appointments_enhanced;

    -- 2. Loop through a 14-day period (past week to next week)
    FOR i IN 0..13 LOOP
        target_date := CURRENT_DATE - (7 - i) * INTERVAL '1 day';
        day_of_week := EXTRACT(ISODOW FROM target_date);

        -- 3. Find tutors working on this specific day
        FOR working_hour_record IN 
            SELECT * FROM working_hours wh WHERE wh.day_of_week = day_of_week AND wh.is_working
        LOOP
            -- Ensure we start on a clean half-hour
            current_time := date_trunc('hour', (target_date + working_hour_record.start_time)::TIMESTAMPTZ);

            -- 4. Attempt to create a couple of appointments within this slot
            FOR j IN 1..2 LOOP
                IF current_time >= working_end_time THEN
                    CONTINUE;
                END IF;

                -- Fetch a random student and course for variety
                SELECT user_id INTO student_record FROM users WHERE role = 'Student' ORDER BY random() LIMIT 1;
                SELECT course_id INTO course_record FROM courses ORDER BY random() LIMIT 1;
                IF student_record IS NULL OR course_record IS NULL THEN CONTINUE; END IF;

                duration := (floor(random() * 3) + 1) * 30; -- 30, 60, or 90 minutes
                appointment_end_time := current_time + (duration * INTERVAL '1 minute');

                IF appointment_end_time > working_end_time THEN
                    CONTINUE;
                END IF;

                -- 5. Check for conflicts (double-booking and system events)
                IF NOT is_slot_available(working_hour_record.tutor_id, current_time, appointment_end_time) THEN
                    current_time := current_time + INTERVAL '30 minutes';
                    CONTINUE;
                END IF;

                -- Determine status
                new_status := 'Scheduled';
                new_reason := NULL;

                SELECT name INTO event_record FROM system_events 
                WHERE current_time BETWEEN start_date AND end_date LIMIT 1;

                IF event_record IS NOT NULL THEN
                    new_status := 'Canceled';
                    new_reason := 'Canceled due to system event: ' || event_record.name;
                ELSIF current_time < CURRENT_TIMESTAMP THEN
                    new_status := 'Completed';
                END IF;

                -- 6. Insert the new, valid appointment
                INSERT INTO appointments_enhanced (student_id, tutor_id, course_id, start_time, end_time, duration_minutes, status, reason_notes, topic)
                VALUES (student_record.user_id, working_hour_record.tutor_id, course_record.course_id, current_time, appointment_end_time, duration, new_status::appointment_status, new_reason, 'Generated Topic');

                -- Move to the next available slot
                current_time := appointment_end_time;
            END LOOP;
        END LOOP;
    END LOOP;
END;
$$;