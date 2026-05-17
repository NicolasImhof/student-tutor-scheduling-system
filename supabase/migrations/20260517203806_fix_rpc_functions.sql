-- Fix handle_new_user trigger function to properly cast enum types
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert a new profile record for the new user.
    -- Explicitly cast strings to their respective enum types.
    INSERT INTO public.users (auth_uuid, email, role, approval_status, first_name, last_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        (NEW.raw_user_meta_data->>'role')::public.user_role, 
        'Pending'::public.approval_status,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$function$;

-- Fix cancel_appointment function to use appointments_enhanced and correct status 'Canceled'
CREATE OR REPLACE FUNCTION public.cancel_appointment(p_appointment_id integer, p_user_id integer, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Check if the user is authorized to cancel this appointment
    IF p_role = 'Student' AND EXISTS (SELECT 1 FROM public.appointments_enhanced WHERE appointment_id = p_appointment_id AND student_id = p_user_id) THEN
        UPDATE public.appointments_enhanced SET status = 'Canceled' WHERE appointment_id = p_appointment_id;
    ELSIF p_role = 'Tutor' AND EXISTS (SELECT 1 FROM public.appointments_enhanced WHERE appointment_id = p_appointment_id AND tutor_id = p_user_id) THEN
        UPDATE public.appointments_enhanced SET status = 'Canceled' WHERE appointment_id = p_appointment_id;
    ELSIF p_role IN ('Admin', 'Super Admin') THEN
        UPDATE public.appointments_enhanced SET status = 'Canceled' WHERE appointment_id = p_appointment_id;
    ELSE
        RAISE EXCEPTION 'User not authorized to cancel this appointment';
    END IF;
END;
$function$;

-- Fix reschedule_appointment function to use appointments_enhanced
CREATE OR REPLACE FUNCTION public.reschedule_appointment(p_appointment_id integer, p_new_start_time timestamp with time zone, p_new_end_time timestamp with time zone, p_user_id integer, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    target_appointment RECORD;
BEGIN
    -- Get the appointment details
    SELECT * INTO target_appointment FROM public.appointments_enhanced WHERE appointment_id = p_appointment_id;

    -- Authorization Check: Ensure the user is part of the appointment or is an admin.
    IF target_appointment.student_id = p_user_id OR target_appointment.tutor_id = p_user_id OR p_role IN ('Admin', 'Super Admin') THEN
        -- Proceed with the update
        UPDATE public.appointments_enhanced
        SET start_time = p_new_start_time, end_time = p_new_end_time, status = 'Scheduled'
        WHERE appointment_id = p_appointment_id;
    ELSE
        -- If not authorized, raise an exception.
        RAISE EXCEPTION 'User not authorized to reschedule this appointment.';
    END IF;
END;
$function$;

-- Fix create_event_and_cancel_appointments function to use appointments_enhanced and correct status 'Canceled'
CREATE OR REPLACE FUNCTION public.create_event_and_cancel_appointments(p_name text, p_start_date date, p_end_date date, p_event_type event_type, p_is_recurring boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_event_id int;
BEGIN
    -- Insert the new system event and get its ID
    INSERT INTO system_events (name, start_date, end_date, event_type, is_recurring)
    VALUES (p_name, p_start_date, p_end_date, p_event_type::text, p_is_recurring)
    RETURNING event_id INTO v_event_id;

    -- Cancel all appointments that fall within the date range of the new event
    UPDATE public.appointments_enhanced
    SET status = 'Canceled'
    WHERE
        status = 'Scheduled' AND
        start_time::date >= p_start_date AND
        start_time::date <= p_end_date;
END;
$function$;

-- Also fix any other create_event_* functions that might use 'appointments' or 'Cancelled'
CREATE OR REPLACE FUNCTION public.create_system_event_and_cancel_appointments(p_event_name text, p_start_date date, p_end_date date, p_event_type text, p_is_recurring boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Ensure the user is a Super Admin or Admin
    IF get_my_role() NOT IN ('Super Admin', 'Admin') THEN
        RAISE EXCEPTION 'Permission denied: Must be an Admin or Super Admin.';
    END IF;

    -- Insert the new system event
    INSERT INTO public.system_events (name, start_date, end_date, event_type, is_recurring)
    VALUES (p_event_name, p_start_date, p_end_date, p_event_type, p_is_recurring);

    -- Find and cancel conflicting appointments
    UPDATE public.appointments_enhanced
    SET status = 'Canceled'
    WHERE DATE(start_time) BETWEEN p_start_date AND p_end_date
    AND status = 'Scheduled';

END;
$function$;
