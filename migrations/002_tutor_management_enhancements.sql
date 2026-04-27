-- Tutor Management Enhancements Migration
-- This migration adds tables and modifications to support comprehensive tutor management features

-- Create a table for working hours management
CREATE TABLE WorkingHours (
    working_hours_id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_working BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, day_of_week)
);

-- Create a table for appointment management with enhanced details
CREATE TABLE AppointmentsEnhanced (
    appointment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    course_id INT REFERENCES Courses(course_id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    status appointment_status NOT NULL DEFAULT 'Scheduled',
    reason_notes TEXT,
    meeting_link VARCHAR(500),
    location VARCHAR(255),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_rule TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for tutor availability with status tracking
CREATE TABLE TutorAvailability (
    availability_id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'unavailable', 'sick', 'vacation')),
    time_slots JSONB,
    reason TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tutor_id, date)
);

-- Create a table for vacation requests
CREATE TABLE VacationRequests (
    vacation_id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status approval_status NOT NULL DEFAULT 'Pending',
    approved_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for working hours approval requests
CREATE TABLE WorkingHoursRequests (
    request_id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    requested_schedule JSONB NOT NULL,
    status approval_status NOT NULL DEFAULT 'Pending',
    approved_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_working_hours_tutor ON WorkingHours(tutor_id);
CREATE INDEX idx_working_hours_day ON WorkingHours(day_of_week);
CREATE INDEX idx_appointments_enhanced_tutor ON AppointmentsEnhanced(tutor_id);
CREATE INDEX idx_appointments_enhanced_student ON AppointmentsEnhanced(student_id);
CREATE INDEX idx_appointments_enhanced_status ON AppointmentsEnhanced(status);
CREATE INDEX idx_appointments_enhanced_start_time ON AppointmentsEnhanced(start_time);
CREATE INDEX idx_tutor_availability_tutor ON TutorAvailability(tutor_id);
CREATE INDEX idx_tutor_availability_date ON TutorAvailability(date);
CREATE INDEX idx_tutor_availability_status ON TutorAvailability(status);
CREATE INDEX idx_vacation_requests_tutor ON VacationRequests(tutor_id);
CREATE INDEX idx_vacation_requests_status ON VacationRequests(status);
CREATE INDEX idx_working_hours_requests_tutor ON WorkingHoursRequests(tutor_id);
CREATE INDEX idx_working_hours_requests_status ON WorkingHoursRequests(status);

-- Create a view for tutor dashboard data
CREATE VIEW TutorDashboardView AS
SELECT 
    u.user_id,
    u.first_name || ' ' || u.last_name as tutor_name,
    u.email,
    COUNT(DISTINCT a.appointment_id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Scheduled' THEN a.appointment_id END) as upcoming_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Completed' THEN a.appointment_id END) as completed_appointments,
    COUNT(DISTINCT ta.date) as days_with_availability,
    COUNT(DISTINCT CASE WHEN ta.status = 'vacation' AND ta.is_approved = FALSE THEN ta.date END) as pending_vacation_days,
    jsonb_agg(DISTINCT jsonb_build_object('day', wh.day_of_week, 'start', wh.start_time, 'end', wh.end_time, 'working', wh.is_working)) as working_schedule
FROM Users u
LEFT JOIN AppointmentsEnhanced a ON u.user_id = a.tutor_id
LEFT JOIN TutorAvailability ta ON u.user_id = ta.tutor_id
LEFT JOIN WorkingHours wh ON u.user_id = wh.tutor_id
WHERE u.role = 'Tutor'
GROUP BY u.user_id, u.first_name, u.last_name, u.email;

-- Create a view for admin tutor management
CREATE VIEW AdminTutorManagementView AS
SELECT 
    u.user_id,
    u.first_name || ' ' || u.last_name as tutor_name,
    u.email,
    u.approval_status,
    COUNT(DISTINCT a.appointment_id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'Scheduled' THEN a.appointment_id END) as upcoming_appointments,
    COUNT(DISTINCT wh.working_hours_id) as working_days_configured,
    COUNT(DISTINCT CASE WHEN ta.status = 'vacation' AND ta.is_approved = FALSE THEN ta.date END) as pending_vacation_days,
    COUNT(DISTINCT CASE WHEN whr.status = 'Pending' THEN whr.request_id END) as pending_working_hours_requests,
    CASE 
        WHEN COUNT(DISTINCT wh.working_hours_id) > 0 AND COUNT(DISTINCT wh.working_hours_id) = 7 THEN 'Active'
        ELSE 'Inactive'
    END as working_status
FROM Users u
LEFT JOIN AppointmentsEnhanced a ON u.user_id = a.tutor_id
LEFT JOIN TutorAvailability ta ON u.user_id = ta.tutor_id
LEFT JOIN WorkingHours wh ON u.user_id = wh.tutor_id
LEFT JOIN WorkingHoursRequests whr ON u.user_id = whr.tutor_id
WHERE u.role = 'Tutor'
GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.approval_status;

-- Create a function to get tutor availability for a date range
CREATE OR REPLACE FUNCTION get_tutor_availability(
    tutor_id_param INT,
    start_date DATE,
    end_date DATE
) RETURNS TABLE (
    date DATE,
    status VARCHAR(20),
    time_slots JSONB,
    reason TEXT,
    is_approved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ta.date,
        ta.status,
        ta.time_slots,
        ta.reason,
        ta.is_approved
    FROM TutorAvailability ta
    WHERE ta.tutor_id = tutor_id_param
    AND ta.date >= start_date
    AND ta.date <= end_date
    ORDER BY ta.date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get tutor appointments with pagination
CREATE OR REPLACE FUNCTION get_tutor_appointments(
    tutor_id_param INT,
    status_filter VARCHAR(20) DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    limit_count INT DEFAULT 10,
    offset_count INT DEFAULT 0
) RETURNS TABLE (
    appointment_id INT,
    student_name TEXT,
    course_name VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INT,
    status appointment_status,
    reason_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.appointment_id,
        s.first_name || ' ' || s.last_name as student_name,
        c.course_name,
        a.start_time,
        a.end_time,
        a.duration_minutes,
        a.status,
        a.reason_notes
    FROM AppointmentsEnhanced a
    JOIN Users s ON a.student_id = s.user_id
    LEFT JOIN Courses c ON a.course_id = c.course_id
    WHERE a.tutor_id = tutor_id_param
    AND (status_filter IS NULL OR a.status = status_filter::appointment_status)
    AND (start_date IS NULL OR DATE(a.start_time) >= start_date)
    AND (end_date IS NULL OR DATE(a.start_time) <= end_date)
    ORDER BY a.start_time DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to approve/reject working hours
CREATE OR REPLACE FUNCTION approve_working_hours(
    request_id_param INT,
    admin_id_param INT,
    action VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
    IF action = 'approve' THEN
        UPDATE WorkingHoursRequests 
        SET status = 'Approved', approved_by = admin_id_param, approved_at = CURRENT_TIMESTAMP
        WHERE request_id = request_id_param;
        
        -- Apply the approved schedule
        UPDATE WorkingHours wh
        SET start_time = (requested_schedule->>'start_time')::TIME,
            end_time = (requested_schedule->>'end_time')::TIME,
            is_working = (requested_schedule->>'is_working')::BOOLEAN,
            updated_at = CURRENT_TIMESTAMP
        FROM WorkingHoursRequests whr
        WHERE wh.tutor_id = whr.tutor_id 
        AND wh.day_of_week = (requested_schedule->>'day_of_week')::VARCHAR
        AND whr.request_id = request_id_param;
    ELSE
        UPDATE WorkingHoursRequests 
        SET status = 'Denied', approved_by = admin_id_param, approved_at = CURRENT_TIMESTAMP
        WHERE request_id = request_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to approve/reject vacation requests
CREATE OR REPLACE FUNCTION approve_vacation_request(
    vacation_id_param INT,
    admin_id_param INT,
    action VARCHAR(10)
) RETURNS VOID AS $$
BEGIN
    IF action = 'approve' THEN
        UPDATE VacationRequests 
        SET status = 'Approved', approved_by = admin_id_param, approved_at = CURRENT_TIMESTAMP
        WHERE vacation_id = vacation_id_param;
        
        -- Update the corresponding availability records
        UPDATE TutorAvailability ta
        SET is_approved = TRUE,
            approved_by = admin_id_param,
            approved_at = CURRENT_TIMESTAMP
        FROM VacationRequests vr
        WHERE ta.tutor_id = vr.tutor_id
        AND ta.date >= vr.start_date
        AND ta.date <= vr.end_date
        AND ta.status = 'vacation'
        AND vr.vacation_id = vacation_id_param;
    ELSE
        UPDATE VacationRequests 
        SET status = 'Denied', approved_by = admin_id_param, approved_at = CURRENT_TIMESTAMP
        WHERE vacation_id = vacation_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_working_hours
    BEFORE UPDATE ON WorkingHours
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_appointments_enhanced
    BEFORE UPDATE ON AppointmentsEnhanced
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_tutor_availability
    BEFORE UPDATE ON TutorAvailability
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_vacation_requests
    BEFORE UPDATE ON VacationRequests
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_working_hours_requests
    BEFORE UPDATE ON WorkingHoursRequests
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();