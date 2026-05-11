
CREATE TABLE system_events (
    event_id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL UNIQUE,
    event_type TEXT NOT NULL, -- e.g., 'Holiday', 'Closure', 'Event'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admins can manage system events" 
ON system_events
FOR ALL
TO authenticated
USING (get_my_role() = 'Super Admin');
