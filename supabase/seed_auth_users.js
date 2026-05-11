const { createClient } = require('@supabase/supabase-js');

// IMPORTANT: These should be stored securely in environment variables, not hardcoded.
// For this one-time script, we are using them directly.
const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
// NOTE: This is the SERVICE_ROLE_KEY, which has admin privileges. It must be kept secret.
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const usersToSeed = [
    // Students
    { email: 'sally.student@example.com', password: 'password', role: 'Student', first_name: 'Sally', last_name: 'Student', major: 'Physics' },
    { email: 'tom.thumb@example.com', password: 'password', role: 'Student', first_name: 'Tom', last_name: 'Thumb', major: 'History' },
    { email: 'alice.wonder@example.com', password: 'password', role: 'Student', first_name: 'Alice', last_name: 'Wonder', major: 'Chemistry' },
    { email: 'bob.builder@example.com', password: 'password', role: 'Student', first_name: 'Bob', last_name: 'Builder', major: 'Math' },

    // Tutors
    { email: 'jane.smith@example.com', password: 'password', role: 'Tutor', first_name: 'Jane', last_name: 'Smith', category: 'Science', approval_status: 'Approved' },
    { email: 'john.doe@example.com', password: 'password', role: 'Tutor', first_name: 'John', last_name: 'Doe', category: 'Math', approval_status: 'Approved' },
    { email: 'emily.white@example.com', password: 'password', role: 'Tutor', first_name: 'Emily', last_name: 'White', category: 'Humanities', approval_status: 'Approved' },
    { email: 'peter.pan@example.com', password: 'password', role: 'Tutor', first_name: 'Peter', last_name: 'Pan', category: 'Humanities', approval_status: 'Pending' }, // Pending Tutor

    // Admins
    { email: 'science.admin@example.com', password: 'password', role: 'Admin', first_name: 'Science', last_name: 'Admin', category: 'Science', approval_status: 'Approved' },
    { email: 'math.admin@example.com', password: 'password', role: 'Admin', first_name: 'Math', last_name: 'Admin', category: 'Math', approval_status: 'Approved' },
    { email: 'humanities.admin@example.com', password: 'password', role: 'Admin', first_name: 'Humanities', last_name: 'Admin', category: 'Humanities', approval_status: 'Approved' },

    // Super Admin
    { email: 'superadmin@example.com', password: 'password', role: 'Super Admin', first_name: 'Super', last_name: 'Admin', approval_status: 'Approved' },
];

async function seedUsers() {
    console.log('Starting user seeding process...');

    // 1. Get all existing auth users
    const { data: { users: existingAuthUsers }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing existing users:', listError.message);
        return;
    }

    // 2. Delete all existing users to ensure a clean slate
    console.log(`Found ${existingAuthUsers.length} existing auth users. Deleting them...`);
    const deletePromises = existingAuthUsers.map(user => supabase.auth.admin.deleteUser(user.id));
    await Promise.all(deletePromises);
    console.log('All existing auth users deleted.');

    // Also, clear the public.users table for a completely fresh start
    const { error: deletePublicUsersError } = await supabase.from('users').delete().neq('user_id', 0); // Deletes all rows
    if (deletePublicUsersError) {
        console.error('Error clearing public.users table:', deletePublicUsersError.message);
        return;
    }
    console.log('Public.users table cleared.');

    // 3. Create new users
    console.log('Creating new users...');
    for (const userData of usersToSeed) {
        // Create the user in the auth schema
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true, // Auto-confirm the email since we disabled the requirement
        });

        if (authError) {
            console.error(`Failed to create auth user for ${userData.email}:`, authError.message);
            continue; // Skip to the next user
        }

        console.log(`Successfully created auth user for ${userData.email}`);

        // Now, create the corresponding profile in the public.users table
        const { error: profileError } = await supabase.from('users').insert({
            auth_uuid: authData.user.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            role: userData.role,
            approval_status: userData.approval_status || 'Approved', // Default to 'Approved' if not specified
            category: userData.category || null,
            major: userData.major || null,
        });

        if (profileError) {
            console.error(`Failed to create profile for ${userData.email}:`, profileError.message);
        }
    }

    console.log('Seeding process completed!');
}

seedUsers();
