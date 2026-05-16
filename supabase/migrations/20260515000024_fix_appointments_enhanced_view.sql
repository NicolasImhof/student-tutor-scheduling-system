-- First, drop the existing view
DROP VIEW IF EXISTS appointments_enhanced;

-- Next, create a function with SECURITY DEFINER that can bypass RLS to get all necessary data.
CREATE OR REPLACE FUNCTION get_all_appointment_details()
RETURNS TABLE (
    appointment_id INT,
    student_id INT,
    tutor_id INT,
    course_id INT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT,
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

-- Finally, recreate the view to select from the SECURITY DEFINER function.
-- RLS policies will still apply to the view itself, but the underlying function will return the complete data.
CREATE VIEW appointments_enhanced AS
SELECT * FROM get_all_appointment_details();
