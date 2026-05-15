CREATE OR REPLACE FUNCTION delete_user(p_user_id INT)
RETURNS void AS $$
DECLARE
  v_auth_uuid uuid;
BEGIN
    -- Get the auth_uuid for the user
    SELECT auth_uuid INTO v_auth_uuid FROM users WHERE user_id = p_user_id;

    -- Delete all related data
    DELETE FROM appointments_enhanced WHERE student_id = p_user_id OR tutor_id = p_user_id;
    DELETE FROM reviews WHERE student_id = p_user_id OR tutor_id = p_user_id;
    DELETE FROM time_off_requests WHERE tutor_id = p_user_id;
    DELETE FROM working_hours WHERE tutor_id = p_user_id;

    -- Finally, delete the user from the users table
    DELETE FROM users WHERE user_id = p_user_id;

    -- Delete the user from auth.users
    DELETE FROM auth.users WHERE id = v_auth_uuid;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
