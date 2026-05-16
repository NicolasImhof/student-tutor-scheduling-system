-- This function checks if a student is allowed to submit a review for a specific tutor.
CREATE OR REPLACE FUNCTION can_submit_review(
    p_student_id int,
    p_tutor_id int
) 
RETURNS boolean AS $$
DECLARE
    has_completed_appointment boolean;
    has_existing_review boolean;
BEGIN
    -- 1. Check for at least one completed appointment with the tutor.
    SELECT EXISTS (
        SELECT 1
        FROM appointments_enhanced
        WHERE
            student_id = p_student_id AND
            tutor_id = p_tutor_id AND
            status = 'Completed'
    ) INTO has_completed_appointment;

    -- 2. Check if a review from this student for this tutor already exists.
    SELECT EXISTS (
        SELECT 1
        FROM reviews
        WHERE
            student_id = p_student_id AND
            tutor_id = p_tutor_id
    ) INTO has_existing_review;

    -- The student can submit a review only if they have a completed appointment AND no existing review.
    RETURN has_completed_appointment AND NOT has_existing_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This policy ensures a review can only be INSERTED if the above conditions are met.
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can only insert valid reviews" ON reviews
FOR INSERT
WITH CHECK (can_submit_review(student_id, tutor_id));