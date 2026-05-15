CREATE OR REPLACE FUNCTION delete_user(p_user_id INT)
RETURNS void AS $$
BEGIN
    -- This function should only be callable by a service_role or super admin
    -- Additional checks can be added here if needed

    -- Delete from the auth.users table, which will cascade to users table
    DELETE FROM auth.users WHERE id = (SELECT auth_uuid FROM users WHERE user_id = p_user_id);
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
