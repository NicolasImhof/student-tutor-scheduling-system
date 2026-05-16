-- This migration updates the RLS policy on the reviews table to allow students to delete their own reviews.

-- First, we drop the existing policy to recreate it with DELETE permissions
DROP POLICY IF EXISTS "Students can view and edit their own reviews" ON reviews;

-- Recreate the policy with SELECT, UPDATE, and DELETE permissions
CREATE POLICY "Students can manage their own reviews" ON reviews
FOR ALL USING (
    (SELECT user_id FROM users WHERE auth_uuid = auth.uid()) = student_id
) WITH CHECK (
    (SELECT user_id FROM users WHERE auth_uuid = auth.uid()) = student_id
);