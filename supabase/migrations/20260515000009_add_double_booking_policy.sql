-- This policy prevents inserting or updating appointments that would cause a double-booking.
ALTER TABLE appointments_enhanced
ADD CONSTRAINT no_double_booking
CHECK (NOT has_overlapping_appointment(student_id, tutor_id, start_time, end_time, appointment_id));