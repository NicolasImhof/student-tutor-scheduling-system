const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAppointmentsTable() {
    try {
        console.log('Starting table recreation process...');

        // Step 1: Create a temporary table with the correct structure
        await supabase.rpc('execute_sql', { sql: `
            CREATE TABLE appointments_temp AS
            SELECT
                a.appointment_id,
                a.student_id,
                a.tutor_id,
                a.course_id,
                a.start_time,
                a.end_time,
                a.status,
                a.duration_minutes,
                s.first_name || ' ' || s.last_name AS student_full_name,
                t.first_name || ' ' || t.last_name AS tutor_full_name,
                c.course_name
            FROM
                appointments a
            LEFT JOIN
                users s ON a.student_id = s.user_id
            LEFT JOIN
                users t ON a.tutor_id = t.user_id
            LEFT JOIN
                courses c ON a.course_id = c.course_id;
        `});
        console.log('Temporary table created.');

        // Step 2: Drop the old table
        await supabase.rpc('execute_sql', { sql: 'DROP TABLE appointments_enhanced;' });
        console.log('Old table dropped.');

        // Step 3: Rename the temporary table
        await supabase.rpc('execute_sql', { sql: 'ALTER TABLE appointments_temp RENAME TO appointments_enhanced;' });
        console.log('Table renamed. Process complete.');

    } catch (error) {
        console.error('An error occurred during table recreation:', error.message);
    }
}

fixAppointmentsTable();
