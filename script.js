const App = {
    // App state
    currentUser: null,
    viewPermissions: {
        'find-tutor': ['Student'],
        'my-appointments': ['Student', 'Tutor', 'Admin', 'Super Admin'],
        'tutor-availability': ['Tutor'],
        'my-reviews': ['Student', 'Tutor'],
        'admin-dashboard': ['Admin'],
        'user-management': ['Super Admin'],
        'system-events': ['Super Admin'],
        'review-management': ['Admin', 'Super Admin'],
        'my-profile': ['Student', 'Tutor', 'Admin', 'Super Admin'],
    },

    // MAIN APP
    async init() {
        const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTYzODAsImV4cCI6MjA4NjA3MjM4MH0.mrCDflIMgQvJ0fIEaRJao_pdzLgafgsrlUSDQRCiPqc';
        this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
        this.setupEventListeners();
        this.checkSession();
    },

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.onsubmit = (e) => { e.preventDefault(); this.login(); };
    },

    setupDashboardEventListeners() {
        const logoutLink = document.getElementById('dashboard-logout-link');
        if (logoutLink) logoutLink.onclick = (e) => { e.preventDefault(); this.logout(); };

        const nav = document.getElementById('dashboard-nav');
        if (nav) {
            nav.onclick = (e) => {
                const link = e.target.closest('.nav-link');
                if (link) {
                    e.preventDefault();
                    this.loadView(link.getAttribute('href').substring(1));
                }
            };
        }
    },

    // AUTH
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) alert(`Login failed: ${error.message}`);
        else if (data.user) this.checkSession();
    },

    async logout() {
        await this.supabase.auth.signOut();
        this.currentUser = null;
        const dashboard = document.getElementById('dashboard-container');
        if (dashboard) dashboard.innerHTML = '';
        const loginView = document.getElementById('login-view');
        if (loginView) loginView.classList.remove('hidden');
        document.body.className = '';
    },

    async checkSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            const { data: profile, error } = await this.supabase.from('users').select('*').eq('auth_uuid', session.user.id).single();
            if (error) { console.error('Profile fetch error:', error); this.logout(); return; }
            if (profile) {
                if (profile.approval_status !== 'Approved') {
                    alert('Your account is pending approval.');
                    this.logout();
                    return;
                }
                this.currentUser = { ...session.user, ...profile };
                document.getElementById('login-view').classList.add('hidden');
                document.body.className = `role-${profile.role.toLowerCase().replace(' ', '-')}`;
                this.renderDashboard();
            }
        }
    },

    // NAVIGATION
    renderDashboard() {
        const container = document.getElementById('dashboard-container');
        container.innerHTML = `
            <div id="dashboard-view">
                <header id="dashboard-header">
                    <h1>Tutor Scheduling</h1>
                    <div id="user-info"><span id="user-name"></span> <a href="#" id="dashboard-logout-link">Logout</a></div>
                </header>
                <nav id="dashboard-nav-container">
                    <h2 id="dashboard-title">Dashboard</h2>
                    <nav id="dashboard-nav"></nav>
                </nav>
                <main id="dashboard-content"></main>
                <footer>&copy; 2026 Student-to-Tutor System</footer>
            </div>
        `;

        const nav = document.getElementById('dashboard-nav');
        let links = '';
        for (const v in this.viewPermissions) {
            if (this.viewPermissions[v].includes(this.currentUser.role)) {
                links += `<a href="#${v}" class="nav-link">${v.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a>`;
            }
        }
        nav.innerHTML = links;
        document.getElementById('user-name').textContent = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        this.setupDashboardEventListeners();
        this.loadView(this.getDefaultViewForRole(this.currentUser.role));
    },

    getDefaultViewForRole(role) {
        if (role === 'Student') return 'find-tutor';
        if (role === 'Tutor') return 'my-appointments';
        if (role === 'Admin') return 'admin-dashboard';
        return 'user-management';
    },

    loadView(view) {
        const content = document.getElementById('dashboard-content');
        if (!content) return;
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${view}`));
        
        try {
            switch (view) {
                case 'find-tutor': this.renderFindTutor(content); break;
                case 'my-appointments': this.renderMyAppointments(content); break;
                case 'admin-dashboard': this.renderAdminDashboard(content); break;
                case 'user-management': this.renderUserManagement(content); break;
                case 'system-events': this.renderSystemEvents(content); break;
                case 'my-profile': this.renderMyProfile(content); break;
                case 'tutor-availability': this.renderTutorAvailability(content); break;
                case 'my-reviews': this.renderMyReviews(content); break;
                case 'review-management': this.renderReviewManagement(content); break;
                default: content.innerHTML = `<h2>${view}</h2><p>Working on it...</p>`;
            }
        } catch (e) {
            console.error(`Error loading view ${view}:`, e);
            content.innerHTML = `<div class="error">Error loading view: ${e.message}</div>`;
        }
    },

    // VIEWS
    async renderFindTutor(container) {
        container.innerHTML = `
            <section class="dashboard-section">
                <h2>Find a Tutor</h2>
                <div class="search-bar"><input type="text" id="tutor-search" placeholder="Search tutors..." class="form-control"></div>
                <div id="tutor-list" class="tutor-grid mt-4"><div class="loading">Loading...</div></div>
            </section>
        `;
        const { data: tutors, error } = await this.supabase.rpc('get_student_tutor_list');
        if (error) { 
            console.error('RPC Error:', error);
            document.getElementById('tutor-list').innerHTML = `<div class="error">RPC Error: ${error.message}. Please ensure the latest migrations are applied.</div>`; 
            return; 
        }

        const render = (list) => {
            const listEl = document.getElementById('tutor-list');
            if (!listEl) return;
            listEl.innerHTML = list.map(t => `
                <div class="tutor-card">
                    <div class="tutor-card-header"><h3>${t.first_name} ${t.last_name}</h3><span class="badge">${t.category}</span></div>
                    <div class="tutor-card-body">
                        <p><strong>Specializations:</strong> ${t.specializations.join(', ')}</p>
                        <div class="rating">★ ${t.average_rating ? Number(t.average_rating).toFixed(1) : '0.0'} (${t.review_count} reviews)</div>
                    </div>
                    <div class="tutor-card-footer">
                        <button class="btn btn-primary btn-sm book-btn" data-id="${t.user_id}">Book</button>
                        <button class="btn btn-secondary btn-sm view-rev-btn" data-id="${t.user_id}">Reviews</button>
                    </div>
                </div>
            `).join('');
            
            listEl.querySelectorAll('.book-btn').forEach(b => b.onclick = () => this.showBookingModal(list.find(t => t.user_id == b.dataset.id)));
            listEl.querySelectorAll('.view-rev-btn').forEach(b => b.onclick = () => this.showReviewsModal(list.find(t => t.user_id == b.dataset.id)));
        };

        render(tutors || []);
        const searchInput = document.getElementById('tutor-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                render(tutors.filter(t => `${t.first_name} ${t.last_name}`.toLowerCase().includes(term) || t.category.toLowerCase().includes(term)));
            };
        }
    },

    async renderMyAppointments(container) {
        container.innerHTML = `<section class="dashboard-section"><h2>My Appointments</h2><div id="cal-container" class="calendar-container"></div><div id="appt-list" class="mt-4"></div></section>`;
        
        if (window.Calendar) {
            window.Calendar.init(this.currentUser, null, this.supabase, 'week', document.getElementById('cal-container'));
        }

        let query = this.supabase.from('appointments_enhanced').select('*, tutor:tutor_id!inner(*), student:student_id(*)');
        if (this.currentUser.role === 'Student') query = query.eq('student_id', this.currentUser.user_id);
        else if (this.currentUser.role === 'Tutor') query = query.eq('tutor_id', this.currentUser.user_id);
        else if (this.currentUser.role === 'Admin') query = query.eq('tutor.category', this.currentUser.category);

        const { data: appts, error } = await query.order('start_time', { ascending: false });
        if (error) { console.error('Appts fetch error:', error); }

        const list = document.getElementById('appt-list');
        if (!appts || appts.length === 0) { list.innerHTML = '<div class="info">No appointments.</div>'; return; }

        list.innerHTML = `<h3>Appointment List</h3>` + appts.map(a => `
            <div class="appointment-card ${a.status.toLowerCase()} p-2 mb-2 card d-flex justify-between align-center">
                <div>
                    <strong>${new Date(a.start_time).toLocaleString()}</strong><br>
                    ${this.currentUser.role === 'Student' ? `Tutor: ${a.tutor.first_name}` : `Student: ${a.student.first_name}`}
                </div>
                <div>
                    <span class="status-badge">${a.status}</span>
                    ${a.status === 'Scheduled' ? `<button class="btn btn-sm btn-danger ml-2 cancel-appt" data-id="${a.appointment_id}">Cancel</button>` : ''}
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.cancel-appt').forEach(b => b.onclick = async () => {
            await this.supabase.from('appointments_enhanced').update({ status: 'Cancelled' }).eq('appointment_id', b.dataset.id);
            this.renderMyAppointments(container);
        });
    },

    async renderMyReviews(container) {
        container.innerHTML = `<section class="dashboard-section"><h2>My Reviews</h2><div id="rev-list">Loading...</div></section>`;
        const isStudent = this.currentUser.role === 'Student';
        
        const { data: reviews, error } = await this.supabase.from('reviews')
            .select('*, tutor:tutor_id(*), student:student_id(*)')
            .eq(isStudent ? 'student_id' : 'tutor_id', this.currentUser.user_id);

        if (error) { console.error('Reviews Error:', error); container.innerHTML += `<div class="error">${error.message}</div>`; return; }
        const list = document.getElementById('rev-list');
        if (!reviews || reviews.length === 0) { list.innerHTML = '<div class="info">No reviews found.</div>'; return; }

        list.innerHTML = reviews.map(r => `
            <div class="review-card p-3 mb-3 card">
                <div class="review-header d-flex justify-between">
                    <span>★ ${r.rating} | ${isStudent ? `For: ${r.tutor.first_name}` : 'From: Student'}</span>
                    <span class="text-muted">${new Date(r.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                <p class="mt-2">${r.comment}</p>
                ${r.tutor_response ? `<div class="tutor-response p-2 mt-2 bg-light"><strong>Tutor Response:</strong> ${r.tutor_response}</div>` : ''}
                ${!isStudent && !r.tutor_response ? `
                    <div class="mt-2">
                        <input type="text" id="reply-${r.review_id}" class="form-control" placeholder="Write a reply...">
                        <button class="btn btn-sm btn-primary mt-1 reply-btn" data-id="${r.review_id}">Reply</button>
                    </div>
                ` : ''}
                ${!isStudent && !r.deletion_requested ? `<button class="btn btn-sm btn-danger mt-1 req-del" data-id="${r.review_id}">Request Deletion</button>` : ''}
                ${r.deletion_requested ? `<span class="badge badge-warning mt-1">Deletion Requested</span>` : ''}
            </div>
        `).join('');

        list.querySelectorAll('.reply-btn').forEach(b => b.onclick = async () => {
            const reply = document.getElementById(`reply-${b.dataset.id}`).value;
            await this.supabase.from('reviews').update({ tutor_response: reply }).eq('review_id', b.dataset.id);
            this.renderMyReviews(container);
        });

        list.querySelectorAll('.req-del').forEach(b => b.onclick = async () => {
            await this.supabase.from('reviews').update({ deletion_requested: true }).eq('review_id', b.dataset.id);
            alert('Requested!'); this.renderMyReviews(container);
        });
    },

    async renderTutorAvailability(container) {
        container.innerHTML = `
            <section class="dashboard-section">
                <h2>Time Off Requests</h2>
                <form id="off-form" class="mb-4 card p-3">
                    <h3>Request New Time Off</h3>
                    <div class="grid grid-2 mt-2">
                        <div class="form-group"><label>Start Date</label><input type="date" name="start" class="form-control" required></div>
                        <div class="form-group"><label>End Date</label><input type="date" name="end" class="form-control" required></div>
                    </div>
                    <div class="form-group mt-2"><label>Reason</label><input type="text" name="reason" class="form-control" required></div>
                    <button type="submit" class="btn btn-primary mt-2">Submit Request</button>
                </form>
                <div id="off-list"></div>
            </section>
        `;
        const load = async () => {
            const { data, error } = await this.supabase.from('time_off_requests').select('*').eq('tutor_id', this.currentUser.user_id).order('created_at', {ascending: false});
            const listEl = document.getElementById('off-list');
            if (!listEl) return;
            listEl.innerHTML = `<h3>My Requests</h3>` + (data || []).map(r => `
                <div class="card mb-2 p-2 d-flex justify-between align-center">
                    <div><strong>${r.start_date} to ${r.end_date}</strong> - <span class="status-badge status-${r.status.toLowerCase()}">${r.status}</span></div>
                    ${r.status === 'Pending' ? `<button class="btn btn-sm btn-danger cancel-off" data-id="${r.request_id}">Cancel</button>` : ''}
                </div>
            `).join('');
            listEl.querySelectorAll('.cancel-off').forEach(b => b.onclick = async () => {
                const { error: delError } = await this.supabase.from('time_off_requests').delete().eq('request_id', b.dataset.id);
                if (delError) alert(delError.message); else load();
            });
        };
        load();
        document.getElementById('off-form').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            await this.supabase.from('time_off_requests').insert([{ tutor_id: this.currentUser.user_id, start_date: fd.get('start'), end_date: fd.get('end'), reason: fd.get('reason'), status: 'Pending' }]);
            e.target.reset(); load();
        };
    },

    async renderAdminDashboard(container) {
        container.innerHTML = `
            <section class="dashboard-section">
                <h2>Admin Dashboard (${this.currentUser.category})</h2>
                <div class="tabs">
                    <button class="tab-btn active" data-tab="tutors">Tutors</button>
                    <button class="tab-btn" data-tab="timeoff">Time Off Requests</button>
                </div>
                <div id="admin-content" class="mt-4"></div>
            </section>
        `;
        const load = async (tab) => {
            const adminContent = document.getElementById('admin-content');
            if (!adminContent) return;
            if (tab === 'tutors') {
                const { data } = await this.supabase.from('users').select('*').eq('role', 'Tutor').eq('category', this.currentUser.category);
                adminContent.innerHTML = `<table class="user-table"><thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead>
                    <tbody>${(data || []).map(t => `<tr><td>${t.first_name} ${t.last_name}</td><td>${t.email}</td><td>${t.approval_status}</td></tr>`).join('')}</tbody></table>`;
            } else {
                const { data } = await this.supabase.from('time_off_requests').select('*, tutor:tutor_id!inner(*)').eq('tutor.category', this.currentUser.category);
                adminContent.innerHTML = `<table class="user-table"><thead><tr><th>Tutor</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>${(data || []).map(r => `
                        <tr><td>${r.tutor.first_name}</td><td>${r.start_date} to ${r.end_date}</td><td>${r.status}</td>
                        <td>${r.status === 'Pending' ? `<button class="btn btn-sm btn-primary app-off" data-id="${r.request_id}">Approve</button>` : ''}</td></tr>
                    `).join('')}</tbody></table>`;
                adminContent.querySelectorAll('.app-off').forEach(b => b.onclick = async () => {
                    await this.supabase.from('time_off_requests').update({ status: 'Approved' }).eq('request_id', b.dataset.id);
                    load('timeoff');
                });
            }
        };
        load('tutors');
        container.querySelectorAll('.tab-btn').forEach(b => b.onclick = (e) => {
            container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            load(e.target.dataset.tab);
        });
    },

    async renderReviewManagement(container) {
        container.innerHTML = `<section class="dashboard-section"><h2>Review Deletion Requests</h2><div id="rm-list">Loading...</div></section>`;
        let query = this.supabase.from('reviews').select('*, tutor:tutor_id!inner(*), student:student_id(*)').eq('deletion_requested', true);
        if (this.currentUser.role === 'Admin') query = query.eq('tutor.category', this.currentUser.category);

        const { data, error } = await query;
        if (error) { console.error('RM Error:', error); return; }

        const listEl = document.getElementById('rm-list');
        listEl.innerHTML = `<table class="user-table"><thead><tr><th>Tutor</th><th>Review</th><th>Action</th></tr></thead>
            <tbody>${(data || []).map(r => `<tr><td>${r.tutor.first_name}</td><td>${r.comment}</td>
                <td><button class="btn btn-sm btn-danger del-rev" data-id="${r.review_id}">Delete</button>
                    <button class="btn btn-sm btn-secondary rej-rev" data-id="${r.review_id}">Reject</button></td></tr>`).join('')}</tbody></table>`;

        listEl.querySelectorAll('.del-rev').forEach(b => b.onclick = async () => {
            if(confirm('Delete review?')) {
                await this.supabase.from('reviews').delete().eq('review_id', b.dataset.id);
                this.renderReviewManagement(container);
            }
        });
        listEl.querySelectorAll('.rej-rev').forEach(b => b.onclick = async () => {
            await this.supabase.from('reviews').update({ deletion_requested: false }).eq('review_id', b.dataset.id);
            this.renderReviewManagement(container);
        });
    },

    async renderUserManagement(container) {
        container.innerHTML = `<section class="dashboard-section"><h2>User Management</h2><div id="user-list"></div></section>`;
        const load = async () => {
            const { data: users } = await this.supabase.from('users').select('*').order('role');
            const listEl = document.getElementById('user-list');
            if (!listEl) return;
            listEl.innerHTML = `<table class="user-table">
                <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${users.map(u => `
                    <tr><td>${u.first_name} ${u.last_name}</td><td>${u.role}</td><td>${u.approval_status}</td>
                    <td>
                        ${u.approval_status === 'Pending' && this.currentUser.role === 'Super Admin' ? `<button class="btn btn-sm btn-primary app-u" data-id="${u.user_id}">Approve</button>` : ''}
                        ${this.currentUser.role === 'Super Admin' ? `<button class="btn btn-sm btn-danger del-u" data-id="${u.user_id}">Delete</button>` : ''}
                    </td></tr>
                `).join('')}</tbody></table>`;
            listEl.querySelectorAll('.app-u').forEach(b => b.onclick = async () => { await this.supabase.from('users').update({ approval_status: 'Approved' }).eq('user_id', b.dataset.id); load(); });
            listEl.querySelectorAll('.del-u').forEach(b => b.onclick = async () => { if(confirm('Delete user?')) { await this.supabase.from('users').delete().eq('user_id', b.dataset.id); load(); } });
        };
        load();
    },

    renderSystemEvents(container) {
        container.innerHTML = `
            <section class="dashboard-section">
                <h2>System Events</h2>
                <form id="event-form" class="mb-4 card p-3">
                    <h3>Create New System Event</h3>
                    <input type="text" name="name" placeholder="Event Name" class="form-control mb-2" required>
                    <div class="grid grid-2">
                        <input type="date" name="start" class="form-control mb-2" required>
                        <input type="date" name="end" class="form-control mb-2" required>
                    </div>
                    <select name="type" class="form-control mb-2"><option>Holiday</option><option>Closure</option></select>
                    <button type="submit" class="btn btn-primary">Create Event</button>
                </form>
                <div id="event-list"></div>
            </section>
        `;
        const load = async () => {
            const { data } = await this.supabase.from('system_events').select('*').order('start_date');
            const listEl = document.getElementById('event-list');
            if (!listEl) return;
            listEl.innerHTML = `<h3>Existing Events</h3>` + (data || []).map(e => `
                <div class="card mb-2 p-2"><strong>${e.name}</strong> (${e.start_date} to ${e.end_date})</div>
            `).join('');
        };
        load();
        document.getElementById('event-form').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const { error } = await this.supabase.rpc('create_system_event', {
                p_name: fd.get('name'), p_start_date: fd.get('start'), p_end_date: fd.get('end'), 
                p_event_type: fd.get('type'), p_is_recurring: false
            });
            if (error) alert(error.message); else { alert('Created!'); e.target.reset(); load(); }
        };
    },

    renderMyProfile(container) {
        container.innerHTML = `
            <section class="dashboard-section">
                <h2>My Profile</h2>
                <div class="grid grid-2">
                    <form id="profile-form" class="card p-3">
                        <h3>Basic Info</h3>
                        <div class="form-group"><label>First Name</label><input type="text" name="first_name" value="${this.currentUser.first_name}" class="form-control mb-2"></div>
                        <div class="form-group"><label>Last Name</label><input type="text" name="last_name" value="${this.currentUser.last_name}" class="form-control mb-2"></div>
                        <button type="submit" class="btn btn-primary">Update Info</button>
                    </form>
                    <form id="pass-form" class="card p-3">
                        <h3>Change Password</h3>
                        <div class="form-group"><label>New Password</label><input type="password" name="password" placeholder="New Password" class="form-control mb-2" required></div>
                        <button type="submit" class="btn btn-secondary">Update Password</button>
                    </form>
                </div>
            </section>
        `;
        document.getElementById('profile-form').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            await this.supabase.from('users').update({ first_name: fd.get('first_name'), last_name: fd.get('last_name') }).eq('user_id', this.currentUser.user_id);
            alert('Updated!'); this.checkSession();
        };
        document.getElementById('pass-form').onsubmit = async (e) => {
            e.preventDefault();
            const { error } = await this.supabase.auth.updateUser({ password: new FormData(e.target).get('password') });
            if (error) alert(error.message); else alert('Password changed!');
        };
    },

    async showBookingModal(tutor) {
        const m = document.getElementById('modal-container');
        if (!m) return;

        let selectedSlot = null;

        m.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal large">
                    <div class="modal-header">
                        <h3>Book Appointment with ${tutor.first_name} ${tutor.last_name}</h3>
                        <button onclick="document.getElementById('modal-container').innerHTML=''">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Please select a date to see available 30-minute time slots.</p>
                        <div class="booking-form-container mt-4">
                            <input type="date" id="booking-date" class="form-control mb-2">
                            <div id="time-slots-container" class="time-slots-container mt-3"></div>
                            <button id="confirm-booking-btn" class="btn btn-primary mt-3" disabled>Confirm Appointment</button>
                        </div>
                        <div id="booking-feedback" class="mt-3"></div>
                    </div>
                </div>
            </div>`;

        const dateInput = document.getElementById('booking-date');
        const slotsContainer = document.getElementById('time-slots-container');
        const confirmBtn = document.getElementById('confirm-booking-btn');
        const feedbackEl = document.getElementById('booking-feedback');

        dateInput.onchange = async () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            slotsContainer.innerHTML = '<div>Loading available times...</div>';
            confirmBtn.disabled = true;
            selectedSlot = null;
            feedbackEl.innerHTML = '';

            const { data: slots, error } = await this.supabase.rpc('get_tutor_availability_slots', {
                p_tutor_id: tutor.user_id,
                p_target_date: selectedDate
            });

            if (error) {
                console.error('Error fetching availability:', error);
                slotsContainer.innerHTML = `<div class="error">Could not load availability. Please try again.</div>`;
                return;
            }

            if (!slots || slots.length === 0) {
                slotsContainer.innerHTML = '<div>No available time slots for this date.</div>';
                return;
            }

            slotsContainer.innerHTML = '';
            slots.forEach(slot => {
                const slotTime = new Date(slot.available_slot);
                const button = document.createElement('button');
                button.className = 'btn time-slot-btn';
                button.textContent = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                button.dataset.slot = slot.available_slot;
                
                button.onclick = () => {
                    document.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    selectedSlot = button.dataset.slot;
                    confirmBtn.disabled = false;
                };
                slotsContainer.appendChild(button);
            });
        };

        confirmBtn.onclick = async () => {
            if (!selectedSlot) {
                feedbackEl.innerHTML = `<div class="error">Please select a time slot.</div>`;
                return;
            }

            confirmBtn.disabled = true;
            feedbackEl.innerHTML = `<div>Booking...</div>`;

            const startTime = new Date(selectedSlot);
            const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

            const { data, error } = await this.supabase.rpc('book_appointment', {
                p_student_id: this.currentUser.user_id,
                p_tutor_id: tutor.user_id,
                p_start_time: startTime.toISOString(),
                p_end_time: endTime.toISOString()
            });

            if (error) {
                console.error('Booking RPC error:', error);
                feedbackEl.innerHTML = `<div class="error">Error booking appointment: ${error.message}</div>`;
                confirmBtn.disabled = false;
            } else if (data && data.length > 0) {
                const result = data[0];
                if (result.success) {
                    feedbackEl.innerHTML = `<div class="success">${result.message}</div>`;
                    setTimeout(() => {
                        document.getElementById('modal-container').innerHTML='';
                        this.loadView('my-appointments');
                    }, 2000);
                } else {
                    feedbackEl.innerHTML = `<div class="error">${result.message}</div>`;
                    confirmBtn.disabled = false;
                }
            }
        };
    },

    async showReviewsModal(t) {
        const m = document.getElementById('modal-container');
        if (!m) return;
        m.innerHTML = `<div class="modal-backdrop"><div class="modal"><div class="modal-header"><h3>Reviews for ${t.first_name}</h3><button onclick="document.getElementById('modal-container').innerHTML=''">×</button></div><div id="m-rev" class="modal-body">Loading...</div></div></div>`;
        const { data } = await this.supabase.from('reviews').select('*').eq('tutor_id', t.user_id);
        document.getElementById('m-rev').innerHTML = (data || []).map(r => `<div class="review-card card p-2 mb-2">★ ${r.rating}<p>${r.comment}</p></div>`).join('') || 'No reviews yet.';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
