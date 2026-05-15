CREATE OR REPLACE FUNCTION populate_appointment_topics()
RETURNS void AS $$
DECLARE
    appt RECORD;
    tutor_specializations TEXT[];
    random_specialization TEXT;
BEGIN
    FOR appt IN SELECT * FROM appointments_enhanced WHERE topic IS NULL LOOP
        -- Get tutor's specializations
        SELECT specializations INTO tutor_specializations FROM users WHERE user_id = appt.tutor_id;

        -- If the tutor has specializations, pick one at random
        IF array_length(tutor_specializations, 1) > 0 THEN
            random_specialization := tutor_specializations[1 + floor(random() * array_length(tutor_specializations, 1))];
            UPDATE appointments_enhanced SET topic = random_specialization WHERE appointment_id = appt.appointment_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
