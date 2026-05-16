-- Step 1: Create the trusted function to sync details.
CREATE OR REPLACE FUNCTION sync_appointment_details()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function runs with elevated privileges to bypass RLS and fetch names.
    UPDATE appointments_enhanced ae
    SET
        student_full_name = (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.user_id = NEW.student_id),
        tutor_full_name = (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.user_id = NEW.tutor_id),
        course_name = (SELECT c.course_name FROM courses c WHERE c.course_id = NEW.course_id)
    WHERE ae.appointment_id = NEW.appointment_id;

    RETURN NEW;
END;
$$;

-- Step 2: Drop the old trigger if it exists and create a new one.
DROP TRIGGER IF EXISTS on_appointment_change_update_enhanced ON appointments;
CREATE TRIGGER on_appointment_change_update_enhanced
    AFTER INSERT OR UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION sync_appointment_details();

-- Step 3: Create a one-time function to fix all existing appointments.
CREATE OR REPLACE FUNCTION backfill_appointment_details()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    appt RECORD;
BEGIN
    FOR appt IN SELECT appointment_id, student_id, tutor_id, course_id FROM appointments LOOP
        UPDATE appointments_enhanced ae
        SET
            student_full_name = (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.user_id = appt.student_id),
            tutor_full_name = (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.user_id = appt.tutor_id),
            course_name = (SELECT c.course_name FROM courses c WHERE c.course_id = appt.course_id)
        WHERE ae.appointment_id = appt.appointment_id;
    END LOOP;
END;
$$;
