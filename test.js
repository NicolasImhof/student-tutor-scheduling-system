
document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTYzODAsImV4cCI6MjA4NjA3MjM4MH0.mrCDflIMgQvJ0fIEaRJao_pdzLgafgsrlUSDQRCiPqc';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    const testAccounts = {
        student: { email: 'sally.student@example.com', password: 'password' },
        tutor: { email: 'jane.smith@example.com', password: 'password' },
        admin: { email: 'science.admin@example.com', password: 'password' },
        superadmin: { email: 'superadmin@example.com', password: 'password' },
    };

    const runTest = async (role) => {
        console.log(`--- Starting test for ${role.toUpperCase()} ---`);
        const container = document.getElementById('calendar-test-container');
        container.innerHTML = `<h2>Testing as ${role}...</h2><div class="loading">Loading calendar...</div>`;

        const { email, password } = testAccounts[role];

        const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (loginError) {
            container.innerHTML = `<div class="error">Login failed for ${email}: ${loginError.message}</div>`;
            console.error('Login error:', loginError);
            return;
        }
        if (!loginData.user) {
            container.innerHTML = `<div class="error">Login was not successful for ${email}. No user data returned.</div>`;
            return;
        }

        const { data: profile, error: profileError } = await supabaseClient.from('users').select('*').eq('auth_uuid', loginData.user.id).single();
        if (profileError) {
            container.innerHTML = `<div class="error">Failed to fetch profile for ${email}: ${profileError.message}</div>`;
            console.error('Profile fetch error:', profileError);
            return;
        }

        console.log(`Logged in as ${profile.first_name} (${profile.role})`);

        if (window.Calendar) {
            const mockApp = {
                currentUser: { ...loginData.user, ...profile },
                supabase: supabaseClient,
                showAppointmentDetailsModal: (appt) => {
                    alert(`Appointment Clicked:\n${JSON.stringify(appt, null, 2)}`);
                }
            };
            console.log('Initializing calendar with currentUser:', mockApp.currentUser);
            window.Calendar.init(mockApp.currentUser, null, mockApp.supabase, 'week', container, mockApp.showAppointmentDetailsModal);
        } else {
            container.innerHTML = `<div class="error">Calendar object not found.</div>`;
            console.error('Calendar object not found');
        }
    };

    document.getElementById('test-student').onclick = () => runTest('student');
    document.getElementById('test-tutor').onclick = () => runTest('tutor');
    document.getElementById('test-admin').onclick = () => runTest('admin');
    document.getElementById('test-superadmin').onclick = () => runTest('superadmin');
});
