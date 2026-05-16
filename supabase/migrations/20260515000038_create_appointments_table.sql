CREATE TABLE appointments (
    appointment_id integer NOT NULL,
    student_id integer,
    tutor_id integer,
    course_id integer,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    status appointment_status DEFAULT 'Scheduled'::appointment_status NOT NULL,
    reason_notes text,
    meeting_link character varying,
    location character varying,
    is_recurring boolean DEFAULT false,
    recurring_rule text,
    topic text
);