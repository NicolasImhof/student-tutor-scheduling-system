
-- Fix get_appointments_for_calendar to support filtering by user, role, and category
DROP FUNCTION IF EXISTS get_appointments_for_calendar(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_appointments_for_calendar(
    start_date_in TIMESTAMPTZ, 
    end_date_in TIMESTAMPTZ,
    p_user_id INT DEFAULT NULL,
    p_role TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
    appointment_id INT,
    tutor_first_name TEXT,
    student_first_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.appointment_id,
        tu.first_name::TEXT,
        su.first_name::TEXT,
        ae.start_time,
        ae.end_time,
        ae.status::TEXT
    FROM public.appointments_enhanced ae
    JOIN public.users tu ON ae.tutor_id = tu.user_id
    JOIN public.users su ON ae.student_id = su.user_id
    WHERE ae.start_time >= start_date_in 
      AND ae.start_time <= end_date_in
      AND (
          p_role IS NULL OR p_role = 'Super Admin'
          OR (p_role = 'Student' AND ae.student_id = p_user_id)
          OR (p_role = 'Tutor' AND ae.tutor_id = p_user_id)
          OR (p_role = 'Admin' AND tu.category = p_category)
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
