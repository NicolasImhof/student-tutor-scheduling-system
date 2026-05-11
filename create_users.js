
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTYzODAsImV4cCI6MjA4NjA3MjM4MH0.mrCDflIMgQvJ0fIEaRJao_pdzLgafgsrlUSDQRCiPqc';
const db = createClient(supabaseUrl, supabaseAnonKey);

const usersToCreate = [
    { email: 'pending.student1@example.com', password: 'password', first_name: 'Penelope', last_name: 'Pending', role: 'Student' },
    { email: 'pending.student2@example.com', password: 'password', first_name: 'Peter', last_name: 'Pending', role: 'Student' },
    { email: 'pending.student3@example.com', password: 'password', first_name: 'Paige', last_name: 'Pending', role: 'Student' },
];

async function createUsers() {
    console.log('Starting user creation process...');
    for (const user of usersToCreate) {
        // First, create the user in the auth schema
        const { data: authData, error: authError } = await db.auth.signUp({
            email: user.email,
            password: user.password,
        });

        if (authError) {
            // If user already exists, we can try to fetch them to get their ID
            if (authError.message.includes('already registered')) {
                 console.warn(`Auth user ${user.email} already exists. Attempting to proceed with profile creation.`);
            } else {
                console.error(`Error creating auth user ${user.email}:`, authError.message);
                continue; // Move to the next user
            }
        }

        // The user object is in authData.user, but if they already existed, we need to sign in to get it.
        // For simplicity in this script, we will assume first-time creation.
        const authUser = (await db.auth.signInWithPassword({email: user.email, password: user.password})).data.user;

        if (!authUser) {
            console.error(`Could not get auth user for ${user.email} after sign-up/sign-in.`);
            continue;
        }

        console.log(`Auth user ${user.email} confirmed with ID: ${authUser.id}`);

        // Next, create the user's profile in the public.users table
        const { error: profileError } = await db.from('users').insert([
            {
                auth_uuid: authUser.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role,
                // approval_status defaults to 'Pending' from the database schema
            }
        ]);

        if (profileError) {
            if (profileError.message.includes('duplicate key')) {
                 console.warn(`Profile for ${user.email} already exists.`);
            } else {
                console.error(`Error creating profile for ${user.email}:`, profileError.message);
            }
        } else {
            console.log(`Successfully created profile for ${user.email}.`);
        }
    }
     console.log('User creation process finished.');
}

createUsers();
