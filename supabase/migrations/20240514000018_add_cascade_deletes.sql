
-- Add ON DELETE CASCADE to foreign keys referencing the users table

-- reviews table
ALTER TABLE public.reviews DROP CONSTRAINT fk_tutor;
ALTER TABLE public.reviews ADD CONSTRAINT fk_tutor FOREIGN KEY (tutor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE public.reviews DROP CONSTRAINT fk_student;
ALTER TABLE public.reviews ADD CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- appointments_enhanced table
ALTER TABLE public.appointments_enhanced DROP CONSTRAINT appointments_enhanced_tutor_id_fkey;
ALTER TABLE public.appointments_enhanced ADD CONSTRAINT appointments_enhanced_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE public.appointments_enhanced DROP CONSTRAINT appointments_enhanced_student_id_fkey;
ALTER TABLE public.appointments_enhanced ADD CONSTRAINT appointments_enhanced_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- working_hours table
ALTER TABLE public.working_hours DROP CONSTRAINT working_hours_tutor_id_fkey;
ALTER TABLE public.working_hours ADD CONSTRAINT working_hours_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- time_off_requests table
ALTER TABLE public.time_off_requests DROP CONSTRAINT fk_tutor;
ALTER TABLE public.time_off_requests ADD CONSTRAINT fk_tutor FOREIGN KEY (tutor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

ALTER TABLE public.time_off_requests DROP CONSTRAINT fk_reviewed_by;
ALTER TABLE public.time_off_requests ADD CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- tutor_specializations table
ALTER TABLE public.tutor_specializations DROP CONSTRAINT tutor_specializations_tutor_id_fkey;
ALTER TABLE public.tutor_specializations ADD CONSTRAINT tutor_specializations_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- review_deletion_requests table
ALTER TABLE public.review_deletion_requests DROP CONSTRAINT review_deletion_requests_reviewed_by_fkey;
ALTER TABLE public.review_deletion_requests ADD CONSTRAINT review_deletion_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- system_events table
ALTER TABLE public.system_events DROP CONSTRAINT fk_created_by;
ALTER TABLE public.system_events ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE CASCADE;
