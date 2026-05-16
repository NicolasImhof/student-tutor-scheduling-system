const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runCleanup() {
    console.log('Running function to fix out-of-hours appointments...');
    const { error } = await supabase.rpc('fix_out_of_hours_appointments');
    if (error) {
        console.error('Error running cleanup function:', error);
    } else {
        console.log('Successfully fixed out-of-hours appointments.');
    }
}

runCleanup();
