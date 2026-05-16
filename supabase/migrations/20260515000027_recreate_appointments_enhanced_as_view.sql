-- Step 1: Drop the existing, problematic table.
DROP TABLE IF EXISTS appointments_enhanced;

-- Step 2: Create a function that securely fetches and joins all necessary appointment data.
CREATE OR REPLACE FUNCTION get_all_appointment_details()
RETURNS TABLE (
    appointment_id INT,
    student_id INT,
    tutor_id INT,
    course_id INT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT,
    duration_minutes INT,
    student_full_name TEXT,
    tutor_full_name TEXT,
    course_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.appointment_id,
        a.student_id,
        a.tutor_id,
        a.course_id,
        a.start_time,
        a.end_time,
        a.status::text,
        a.duration_minutes,
        s.first_name || ' ' || s.last_name AS student_full_name,
        t.first_name || ' ' || t.last_name AS tutor_full_name,
        c.course_name
    FROM
        appointments a
    LEFT JOIN
        users s ON a.student_id = s.user_id
    LEFT JOIN
        users t ON a.tutor_id = t.user_id
    LEFT JOIN
        courses c ON a.course_id = c.course_id;
END;
$$;

-- Step 3: Re-create appointments_enhanced as a view that calls the trusted function.
CREATE VIEW appointments_enhanced AS
SELECT * FROM get_all_appointment_details();
