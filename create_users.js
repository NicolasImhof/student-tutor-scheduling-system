const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTYzODAsImV4cCI6MjA4NjA3MjM4MH0.mrCDflIMgQvJ0fIEaRJao_pdzLgafgsrlUSDQRCiPqc';
const db = createClient(supabaseUrl, supabaseAnonKey);

const users = [
    { email: 'superadmin@example.com', password: 'password', options: { data: { first_name: 'Super', last_name: 'Admin', role: 'Super Admin' } } },
    { email: 'science.admin@example.com', password: 'password', options: { data: { first_name: 'Science', last_name: 'Admin', role: 'Admin', category: 'Science' } } },
    { email: 'math.admin@example.com', password: 'password', options: { data: { first_name: 'Math', last_name: 'Admin', role: 'Admin', category: 'Math' } } },
    { email: 'jane.smith@example.com', password: 'password', options: { data: { first_name: 'Jane', last_name: 'Smith', role: 'Tutor', category: 'Science' } } },
    { email: 'bob.jones@example.com', password: 'password', options: { data: { first_name: 'Bob', last_name: 'Jones', role: 'Tutor', category: 'Math' } } },
    { email: 'john.doe@example.com', password: 'password', options: { data: { first_name: 'John', last_name: 'Doe', role: 'Student', major: 'Physics' } } },
    { email: 'sally.student@example.com', password: 'password', options: { data: { first_name: 'Sally', last_name: 'Student', major: 'Mathematics' } } },
];

async function createUsers() {
    for (const user of users) {
        const { data, error } = await db.auth.signUp(user);
        if (error) {
            console.error(`Error creating user ${user.email}:`, error);
        } else {
            console.log(`User ${user.email} created successfully.`);
        }
    }
}

createUsers();