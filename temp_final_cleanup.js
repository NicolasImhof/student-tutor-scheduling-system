const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://bycjjodkedhynxkckwtg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc";
const supabase = createClient(supabaseUrl, supabaseKey);

async function runCleanup() {
  try {
    console.log('Fetching invalid appointment IDs...');
    const { data: invalid_appointments, error: fetchError } = await supabase.rpc('get_invalid_appointment_ids');
    if (fetchError) {
      throw fetchError;
    }

    if (!invalid_appointments || invalid_appointments.length === 0) {
        console.log('No invalid appointments found to cancel.');
        return;
    }

    console.log(`Found ${invalid_appointments.length} invalid appointments. Canceling them now...`);

    for (const appt of invalid_appointments) {
        console.log(`Calling RPC to cancel appointment with ID: ${appt.appointment_id}`);
        const { error: rpcError } = await supabase.rpc('cancel_appointment_by_id', { p_appointment_id: appt.appointment_id });

        if (rpcError) {
            console.error(`Failed to cancel appointment with ID: ${appt.appointment_id}`, rpcError.message);
        } else {
            console.log(`Successfully canceled appointment with ID: ${appt.appointment_id}`);
        }
    }

    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Error running cleanup script:', error.message);
  }
}

runCleanup();
