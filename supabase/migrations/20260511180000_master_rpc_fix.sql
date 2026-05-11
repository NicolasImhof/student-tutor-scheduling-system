
-- MASTER FIX: Drop and Recreate all RPCs with proper types and security
-- Renaming get_tutors_for_student_view to get_student_tutor_list to avoid cache issues

-- 1. DROP OLD FUNCTIONS
DROP FUNCTION IF EXISTS get_tutors_for_student_view();
DROP FUNCTION IF EXISTS get_student_tutor_list();
DROP FUNCTION IF EXISTS get_appointments_for_calendar(TIMESTAMPTZ, TIMESTAMPTZ, INT, TEXT, TEXT);

-- 2. CREATE NEW get_student_tutor_list
CREATE OR REPLACE FUNCTION get_student_tutor_list()
RETURNS TABLE (
    user_id INT,
    first_name TEXT,
    last_name TEXT,
    category TEXT,
    average_rating NUMERIC,
    review_count BIGINT,
    specializations JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.first_name::TEXT,
        u.last_name::TEXT,
        u.category::TEXT,
        COALESCE(AVG(r.rating), 0)::NUMERIC as average_rating,
        COUNT(r.review_id)::BIGINT as review_count,
        COALESCE((
            SELECT json_agg(c.course_name)
            FROM public.tutor_specializations ts
            JOIN public.courses c ON ts.course_id = c.course_id
            WHERE ts.tutor_id = u.user_id
        ), '[]'::json) as specializations
    FROM public.users u
    LEFT JOIN public.reviews r ON u.user_id = r.tutor_id
    WHERE u.role = 'Tutor' AND u.approval_status = 'Approved'
    GROUP BY u.user_id, u.first_name, u.last_name, u.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CREATE NEW get_appointments_for_calendar
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. ENSURE create_system_event is robust
CREATE OR REPLACE FUNCTION create_system_event(
    p_name TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_event_type TEXT,
    p_is_recurring BOOLEAN
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.system_events (name, start_date, end_date, event_type, is_recurring)
    VALUES (p_name, p_start_date, p_end_date, p_event_type, p_is_recurring);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
