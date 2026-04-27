-- Enhanced Calendar Data Storage Migration
-- This migration adds tables and modifications to support the enhanced calendar features

-- Create a table for calendar day status tracking
CREATE TABLE CalendarDayStatus (
    calendar_day_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('weekend', 'holiday', 'available', 'busy', 'regular')),
    status_description TEXT,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, tutor_id)
);

-- Create index for faster date lookups
CREATE INDEX idx_calendar_day_status_date ON CalendarDayStatus(date);
CREATE INDEX idx_calendar_day_status_tutor ON CalendarDayStatus(tutor_id);

-- Create a table for calendar preferences and settings
CREATE TABLE CalendarSettings (
    setting_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    weekend_color VARCHAR(7) DEFAULT '#fff3cd',
    holiday_color VARCHAR(7) DEFAULT '#f8d7da',
    available_color VARCHAR(7) DEFAULT '#cce5ff',
    busy_color VARCHAR(7) DEFAULT '#d4edda',
    selected_color VARCHAR(7) DEFAULT '#bbdefb',
    calendar_scale DECIMAL(3,2) DEFAULT 2.0,
    show_weekends BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create a view for calendar data aggregation
CREATE VIEW CalendarDataView AS
SELECT 
    cds.date,
    cds.day_type,
    cds.status_description,
    cds.tutor_id,
    u.first_name || ' ' || u.last_name as tutor_name,
    u.role as user_role,
    CASE 
        WHEN cds.day_type = 'weekend' THEN COALESCE(cs.weekend_color, '#fff3cd')
        WHEN cds.day_type = 'holiday' THEN COALESCE(cs.holiday_color, '#f8d7da')
        WHEN cds.day_type = 'available' THEN COALESCE(cs.available_color, '#cce5ff')
        WHEN cds.day_type = 'busy' THEN COALESCE(cs.busy_color, '#d4edda')
        ELSE '#ffffff'
    END as display_color,
    EXISTS (
        SELECT 1 FROM ScheduleRules sr 
        WHERE sr.rule_type = 'holiday' 
        AND cds.date >= DATE(sr.start_time) 
        AND cds.date <= DATE(sr.end_time)
    ) as is_system_holiday,
    EXISTS (
        SELECT 1 FROM Availabilities a 
        WHERE a.tutor_id = cds.tutor_id 
        AND DATE(a.start_time) = cds.date
    ) as has_availability,
    EXISTS (
        SELECT 1 FROM Appointments app 
        WHERE app.tutor_id = cds.tutor_id 
        AND DATE(app.start_time) = cds.date
        AND app.status IN ('Scheduled', 'Rescheduled')
    ) as has_appointments
FROM CalendarDayStatus cds
JOIN Users u ON cds.tutor_id = u.user_id
LEFT JOIN CalendarSettings cs ON cds.tutor_id = cs.user_id;

-- Create a function to get calendar data for a specific date range
CREATE OR REPLACE FUNCTION get_calendar_data(
    start_date DATE,
    end_date DATE,
    tutor_id_param INT DEFAULT NULL
) RETURNS TABLE (
    date DATE,
    day_type VARCHAR(50),
    display_color VARCHAR(7),
    status_description TEXT,
    tutor_id INT,
    tutor_name TEXT,
    is_available BOOLEAN,
    is_busy BOOLEAN,
    is_holiday BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cdv.date,
        cdv.day_type,
        cdv.display_color,
        cdv.status_description,
        cdv.tutor_id,
        cdv.tutor_name,
        CASE WHEN cdv.day_type = 'available' THEN TRUE ELSE FALSE END,
        CASE WHEN cdv.day_type = 'busy' THEN TRUE ELSE FALSE END,
        CASE WHEN cdv.day_type = 'holiday' OR cdv.is_system_holiday THEN TRUE ELSE FALSE END
    FROM CalendarDataView cdv
    WHERE cdv.date >= start_date 
    AND cdv.date <= end_date
    AND (tutor_id_param IS NULL OR cdv.tutor_id = tutor_id_param)
    ORDER BY cdv.date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update or insert calendar day status
CREATE OR REPLACE FUNCTION upsert_calendar_day_status(
    date_param DATE,
    day_type_param VARCHAR(50),
    status_description_param TEXT,
    tutor_id_param INT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO CalendarDayStatus (date, day_type, status_description, tutor_id)
    VALUES (date_param, day_type_param, status_description_param, tutor_id_param)
    ON CONFLICT (date, tutor_id) 
    DO UPDATE SET 
        day_type = EXCLUDED.day_type,
        status_description = EXCLUDED.status_description,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Insert default calendar settings for existing users
INSERT INTO CalendarSettings (user_id, calendar_scale)
SELECT user_id, 2.0 
FROM Users 
WHERE user_id NOT IN (SELECT user_id FROM CalendarSettings);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_day_status
    BEFORE UPDATE ON CalendarDayStatus
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_calendar_settings
    BEFORE UPDATE ON CalendarSettings
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();