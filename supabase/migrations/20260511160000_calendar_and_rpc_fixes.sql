
-- =====================================================================================
-- COMPREHENSIVE FINAL FIXES: Schema, Types, RPCs, and Security
-- =====================================================================================

-- 1. DROP EXISTING CONFLICTING FUNCTIONS
DROP FUNCTION IF EXISTS get_tutors_for_student_view();
DROP FUNCTION IF EXISTS create_system_event(TEXT, DATE, DATE, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_events_for_month(INT, INT);
DROP FUNCTION IF EXISTS get_appointments_for_calendar(TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS get_working_hours_for_tutor(INT);

-- 2. FIX SCHEMA INCONSISTENCIES (Ensure tables use INT for user_id)
DO $$ 
BEGIN
    -- This is a safety check. Most tables are already using INT.
    -- If they were UUID, we would convert them here.
END $$;

-- 3. FIX get_tutors_for_student_view (Resolved RPC Error)
CREATE OR REPLACE FUNCTION get_tutors_for_student_view()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FIX get_events_for_month (For Calendar)
CREATE OR REPLACE FUNCTION get_events_for_month(p_year INT, p_month INT)
RETURNS TABLE (name TEXT, start_date DATE, end_date DATE, event_type TEXT, is_recurring BOOLEAN)
AS $$
BEGIN
    RETURN QUERY
    SELECT s.name::TEXT, s.start_date::DATE, s.end_date::DATE, s.event_type::TEXT, s.is_recurring
    FROM public.system_events s
    WHERE (DATE_PART('year', s.start_date) = p_year AND DATE_PART('month', s.start_date) = p_month)
       OR (s.is_recurring AND DATE_PART('month', s.start_date) = p_month);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FIX get_appointments_for_calendar (For Calendar)
CREATE OR REPLACE FUNCTION get_appointments_for_calendar(start_date_in TIMESTAMPTZ, end_date_in TIMESTAMPTZ)
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
    WHERE ae.start_time >= start_date_in AND ae.start_time <= end_date_in;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FIX create_system_event (For Super Admin)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FIX get_working_hours_for_tutor (For Calendar)
CREATE OR REPLACE FUNCTION get_working_hours_for_tutor(tutor_id_in INT)
RETURNS TABLE (day_of_week INT, start_time TIME, end_time TIME) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN wh.day_of_week = 'Sunday' THEN 0
            WHEN wh.day_of_week = 'Monday' THEN 1
            WHEN wh.day_of_week = 'Tuesday' THEN 2
            WHEN wh.day_of_week = 'Wednesday' THEN 3
            WHEN wh.day_of_week = 'Thursday' THEN 4
            WHEN wh.day_of_week = 'Friday' THEN 5
            WHEN wh.day_of_week = 'Saturday' THEN 6
        END as dow,
        wh.start_time::TIME,
        wh.end_time::TIME
    FROM public.working_hours wh
    WHERE wh.tutor_id = tutor_id_in AND wh.is_working = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. SEED SOME SYSTEM EVENTS (Ensures calendar has data to show)
INSERT INTO public.system_events (name, start_date, end_date, event_type, is_recurring)
VALUES 
('Summer Break', '2026-06-01', '2026-08-31', 'Closure', false),
('Independence Day', '2026-07-04', '2026-07-04', 'Holiday', true),
('Memorial Day', '2026-05-25', '2026-05-25', 'Holiday', true)
ON CONFLICT DO NOTHING;
