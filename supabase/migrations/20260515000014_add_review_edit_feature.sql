-- 1. Add the is_edited column to the reviews table
ALTER TABLE reviews
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

-- 2. Update the RLS policy to allow students to edit their own reviews
-- First, we drop the existing policy to recreate it with update permissions
DROP POLICY IF EXISTS "Students can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Students can view and edit their own reviews" ON reviews;

-- Recreate the policy with SELECT and UPDATE permissions
CREATE POLICY "Students can view and edit their own reviews" ON reviews
FOR ALL USING (
    (SELECT user_id FROM users WHERE auth_uuid = auth.uid()) = student_id
) WITH CHECK (
    (SELECT user_id FROM users WHERE auth_uuid = auth.uid()) = student_id
);