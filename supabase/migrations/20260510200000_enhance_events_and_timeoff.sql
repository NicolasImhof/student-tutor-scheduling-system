
-- Add is_recurring column to system_events
ALTER TABLE public.system_events
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

-- Add denial_reason column to time_off_requests
ALTER TABLE public.time_off_requests
ADD COLUMN denial_reason TEXT;
