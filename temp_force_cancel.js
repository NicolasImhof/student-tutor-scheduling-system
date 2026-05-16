const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function forceCancelInvalidAppointments() {
    console.log('Fetching all scheduled appointments to verify working hours...');
    const { data: appointments, error } = await supabase
        .from('appointments_enhanced')
        .select('appointment_id, tutor_id, start_time')
        .eq('status', 'Scheduled');

    if (error) {
        console.error('Failed to fetch appointments:', error.message);
        return;
    }

    const invalidAppointmentIds = [];
    for (const appt of appointments) {
        const { data: is_valid, error: checkError } = await supabase.rpc('is_within_working_hours', { p_tutor_id: appt.tutor_id, p_start_time: appt.start_time });
        if (checkError) {
            console.error(`Error checking appointment ${appt.appointment_id}:`, checkError.message);
            continue;
        }
        if (!is_valid) {
            invalidAppointmentIds.push(appt.appointment_id);
        }
    }

    if (invalidAppointmentIds.length > 0) {
        console.log(`Found ${invalidAppointmentIds.length} invalid appointments. Cancelling them now...`);
        const { error: updateError } = await supabase
            .from('appointments_enhanced')
            .update({ status: 'Canceled' })
            .in('appointment_id', invalidAppointmentIds);

        if (updateError) {
            console.error('Error cancelling invalid appointments:', updateError.message);
        } else {
            console.log('Successfully cancelled all invalid appointments.');
        }
    } else {
        console.log('No invalid appointments found. The data is clean.');
    }
}

forceCancelInvalidAppointments();
