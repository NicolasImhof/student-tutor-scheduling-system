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
        try {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) this.checkSession();
        } catch (error) {
            alert(`Login failed: ${error.message}`);
        }
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
        if (session && session.user) {
            const { data: profile, error } = await this.supabase.from('users').select('*').eq('auth_uuid', session.user.id).single();
            if (error) { 
                console.error('Profile fetch error:', error); 
                // It might be a new user signing up, the trigger will create the profile.
                // Let's wait a bit and retry.
                setTimeout(() => this.checkSession(), 1000);
                return; 
            }
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
            } else {
                // This case handles the delay between auth user creation and profile trigger execution
                console.log("Profile not found, will retry...");
                setTimeout(() => this.checkSession(), 1000); // Retry after a second
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

    getAppointmentDisplayName(appt) {
        let displayName;
        switch (this.currentUser.role) {
            case 'Student':
                displayName = appt.tutor_full_name;
                break;
            case 'Tutor':
                displayName = appt.student_full_name;
                break;
            case 'Admin':
            case 'Super Admin':
                displayName = `${appt.tutor_full_name} & ${appt.student_full_name}`;
                break;
            default:
                displayName = 'Appointment';
        }
        return displayName;
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
                        <p><strong>Specializations:</strong> ${(t.specializations || []).map(s => s.course_name).join(', ')}</p>
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
        container.innerHTML = `<section class="dashboard-section"><h2>My Appointments</h2><div id="cal-container" class="calendar-container"></div></section>`;
        
        if (window.Calendar) {
            window.Calendar.init(this.currentUser, null, this.supabase, 'week', document.getElementById('cal-container'), 
                (appt) => this.showAppointmentDetailsModal(appt),
                (appt) => this.getAppointmentDisplayName(appt)
            );
        }
    },

    async showAppointmentDetailsModal(appt) {
        const m = document.getElementById('modal-container');
        if (!m) return;

        const isCancellable = appt.status === 'Scheduled' && (this.currentUser.role === 'Student' || this.currentUser.role === 'Tutor');
        const isReschedulable = this.currentUser.role === 'Tutor' && appt.status !== 'Completed';
        
        const startTime = new Date(appt.start_time);
        const endTime = new Date(appt.end_time);

        let detailsHtml = '';
        switch (this.currentUser.role) {
            case 'Student':
                detailsHtml = `
                    <p><strong>Tutor:</strong> ${appt.tutor_full_name}</p>
                    <p><strong>Subject:</strong> ${appt.course_name || 'N/A'}</p>
                `;
                break;
            case 'Tutor':
                detailsHtml = `
                    <p><strong>Student:</strong> ${appt.student_full_name}</p>
                    <p><strong>Subject:</strong> ${appt.course_name || 'N/A'}</p>
                `;
                break;
            case 'Admin':
            case 'Super Admin':
                detailsHtml = `
                    <p><strong>Tutor:</strong> ${appt.tutor_full_name}</p>
                    <p><strong>Student:</strong> ${appt.student_full_name}</p>
                    <p><strong>Subject:</strong> ${appt.course_name || 'N/A'}</p>
                `;
                break;
        }

        m.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Appointment Details</h3>
                        <button onclick="document.getElementById('modal-container').innerHTML=''">×</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Date:</strong> ${startTime.toLocaleDateString()}</p>
                        <p><strong>Time:</strong> ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        <p><strong>Status:</strong> <span class="status-badge">${appt.status}</span></p>
                        ${detailsHtml}
                        ${isCancellable ? `<button id="cancel-appt-btn" class="btn btn-danger mt-3">Cancel Appointment</button>` : ''}
                        ${isReschedulable ? `<button id="reschedule-appt-btn" class="btn btn-secondary mt-3 ml-2">Reschedule</button>` : ''}
                    </div>
                </div>
            </div>`;

        if (isCancellable) {
            document.getElementById('cancel-appt-btn').onclick = async () => {
                if (confirm('Are you sure you want to cancel this appointment?')) {
                    await this.supabase.rpc('cancel_appointment', { p_appointment_id: appt.appointment_id, p_user_id: this.currentUser.user_id, p_role: this.currentUser.role });
                    document.getElementById('modal-container').innerHTML = '';
                    this.loadView('my-appointments');
                }
            };
        }

        if (isReschedulable) {
            document.getElementById('reschedule-appt-btn').onclick = () => this.showRescheduleModal(appt);
        }
    },

    async renderMyReviews(container) {
        const isStudent = this.currentUser.role === 'Student';
        let reviewableAppointments = [];

        // --- Data Fetching ---
        if (isStudent) {
            try {
                // 1. Get all of the student's completed appointments.
                const { data: completedAppts, error: apptsError } = await this.supabase
                    .from('appointments_enhanced') // Use the base table for reliability
                    .select('appointment_id, start_time, tutor_id, course_id')
                    .eq('student_id', this.currentUser.user_id)
                    .eq('status', 'Completed');
                if (apptsError) throw apptsError;

                if (!completedAppts || completedAppts.length === 0) {
                    reviewableAppointments = [];
                } else {
                    // 2. Get all appointment IDs the student has already reviewed.
                    const { data: existingReviews, error: reviewsError } = await this.supabase
                        .from('reviews')
                        .select('appointment_id')
                        .eq('student_id', this.currentUser.user_id)
                        .not('appointment_id', 'is', null);
                    if (reviewsError) throw reviewsError;

                    // 3. Filter to find appointments that haven't been reviewed yet.
                    const reviewedAppointmentIds = new Set((existingReviews || []).map(r => r.appointment_id));
                    const unreviewedAppts = completedAppts.filter(appt => !reviewedAppointmentIds.has(appt.appointment_id));

                    if (unreviewedAppts.length > 0) {
                        // 4. Gather all unique IDs for tutors and courses that need details.
                        const tutorIds = [...new Set(unreviewedAppts.map(a => a.tutor_id))];
                        const courseIds = [...new Set(unreviewedAppts.map(a => a.course_id))];

                        // 5. Fetch all details securely and in parallel.
                        const [tutorsRes, coursesRes] = await Promise.all([
                            this.supabase.rpc('get_users_by_ids', { p_user_ids: tutorIds }),
                            this.supabase.from('courses').select('course_id, course_name').in('course_id', courseIds)
                        ]);

                        if (tutorsRes.error) throw new Error(`Failed to fetch tutors for reviews: ${tutorsRes.error.message}`);
                        if (coursesRes.error) throw new Error(`Failed to fetch courses for reviews: ${coursesRes.error.message}`);
                        
                        // 6. Create lookup maps for easy data access.
                        const tutorMap = new Map(tutorsRes.data.map(t => [t.user_id, t]));
                        const courseMap = new Map(coursesRes.data.map(c => [c.course_id, c]));

                        // 7. "Hydrate" the appointment objects with the fetched details.
                        reviewableAppointments = unreviewedAppts.map(appt => ({
                            ...appt,
                            tutor: tutorMap.get(appt.tutor_id),
                            course: courseMap.get(appt.course_id)
                        })).filter(appt => appt.tutor && appt.course); // Final safety filter
                    }
                }
            } catch (error) {
                console.error('Error fetching data for reviewable appointments:', error);
                reviewableAppointments = []; // Ensure it's an empty array on error
            }
        }

        // --- Initial Render (Shell) ---
        container.innerHTML = `
            <section class="dashboard-section">
                <h2>My Reviews</h2>
                ${isStudent ? `
                    <form id="review-form" class="card p-3 mb-4">
                        <h3>Write a Review</h3>
                        <div class="form-group">
                            <label for="appointment-select">Select a Completed Session</label>
                            <select id="appointment-select" class="form-control" required>
                                <option value="">-- Select a Session --</option>
                                ${reviewableAppointments.filter(appt => appt.tutor && appt.course).map(appt =>
                                    `<option value="${appt.appointment_id}">${appt.tutor.first_name} ${appt.tutor.last_name} - ${appt.course.course_name} (${new Date(appt.start_time).toLocaleDateString()})</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="rating-select">Rating (1-5)</label>
                            <select id="rating-select" class="form-control" required>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="review-comment">Comment</label>
                            <textarea id="review-comment" class="form-control" rows="4" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary mt-2">Submit Review</button>
                    </form>
                ` : ''}
                <div id="rev-list">Loading...</div>
            </section>
        `;

        // --- Event Listeners for Student Form ---
        if (isStudent) {
            document.getElementById('review-form').onsubmit = async (e) => {
                e.preventDefault();
                const appointmentId = document.getElementById('appointment-select').value;
                const rating = document.getElementById('rating-select').value;
                const comment = document.getElementById('review-comment').value;

                if (!appointmentId) { alert('Please select a session to review.'); return; }

                const selectedAppointment = reviewableAppointments.find(a => a.appointment_id == appointmentId);

                const { error } = await this.supabase.from('reviews').insert([{
                    student_id: this.currentUser.user_id,
                    tutor_id: selectedAppointment.tutor.user_id, // We need to get this from the appointment object
                    rating,
                    comment,
                    appointment_id: appointmentId
                }]);

                if (error) {
                    alert(`Error submitting review: ${error.message}`);
                } else {
                    alert('Review submitted successfully!');
                    this.renderMyReviews(container); // Re-render to show the new review and update the form
                }
            };
        }

        // --- Render Existing Reviews ---
        const list = document.getElementById('rev-list');
        if (!list) return;
        list.innerHTML = 'Loading...';

        try {
            // For displaying reviews, we need more detailed info
            const { data: reviews, error } = await this.supabase
                .from('reviews')
                .select('*, appointment:appointment_id(course:course_id(course_name))')
                .eq(isStudent ? 'student_id' : 'tutor_id', this.currentUser.user_id);

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                list.innerHTML = '<div class="info">No reviews found.</div>';
                return;
            }

            // Re-fetch tutor data to build a map for name lookup, fixing the regression.
            let tutorMap = {};
            if (isStudent) {
                const { data: tutors, error: rpcError } = await this.supabase.rpc('get_student_tutor_list');
                if (rpcError) {
                    console.error("Could not fetch tutor list for reviews:", rpcError);
                } else {
                    tutors.forEach(t => tutorMap[t.user_id] = t);
                }
            }

            list.innerHTML = reviews.map(r => {
                const courseName = r.appointment && r.appointment.course ? r.appointment.course.course_name : 'N/A';
                const isEdited = r.is_edited ? '<span class="text-muted">(edited)</span>' : '';
                let reviewSourceInfo = '';

                if (isStudent) {
                    const tutor = tutorMap[r.tutor_id];
                    const tutorName = tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Tutor no longer available';
                    reviewSourceInfo = ` | For: ${tutorName} | Course: ${courseName}`;
                } else {
                    // This part seems to have a bug in the original code, let's simplify for now.
                    // We need student name here, which we are not fetching yet.
                    reviewSourceInfo = ` | Course: ${courseName}`;
                }

                return `
                <div class="review-card p-3 mb-3 card">
                    <div class="review-header d-flex justify-between">
                        <span>★ ${r.rating} ${isEdited}${reviewSourceInfo}</span>
                        <span class="text-muted">${new Date(r.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <p class="mt-2">${r.comment}</p>
                    ${r.tutor_response ? `<div class="tutor-response p-2 mt-2 bg-light"><strong>Tutor Response:</strong> ${r.tutor_response}</div>` : ''}
                    <div class="d-flex mt-2">
                        ${isStudent ? `<button class="btn btn-sm btn-secondary edit-rev-btn" data-id="${r.review_id}">Edit</button>` : ''}
                        ${isStudent ? `<button class="btn btn-sm btn-danger ml-2 del-rev-btn" data-id="${r.review_id}">Delete</button>` : ''}
                    </div>
                    ${this.currentUser.role === 'Tutor' && !r.tutor_response ? `
                        <div class="mt-2">
                            <input type="text" id="reply-${r.review_id}" class="form-control" placeholder="Write a reply...">
                            <button class="btn btn-sm btn-primary mt-1 reply-btn" data-id="${r.review_id}">Reply</button>
                        </div>
                    ` : ''}
                    ${this.currentUser.role === 'Tutor' && !r.deletion_requested ? `<button class="btn btn-sm btn-danger mt-1 req-del" data-id="${r.review_id}">Request Deletion</button>` : ''}
                    ${r.deletion_requested ? `<span class="badge badge-warning mt-1">Deletion Requested</span>` : ''}
                </div>
            `}).join('');

            // --- Event Listeners for Existing Reviews ---
            if (isStudent) {
                list.querySelectorAll('.edit-rev-btn').forEach(b => b.onclick = () => {
                    const reviewToEdit = reviews.find(r => r.review_id == b.dataset.id);
                    this.showReviewEditModal(reviewToEdit, container);
                });
                list.querySelectorAll('.del-rev-btn').forEach(b => b.onclick = () => {
                    this.showConfirmationModal('Are you sure you want to permanently delete this review?', async () => {
                        const { error } = await this.supabase.from('reviews').delete().eq('review_id', b.dataset.id);
                        if (error) {
                            alert(`Error deleting review: ${error.message}`);
                        } else {
                            alert('Review deleted successfully.');
                            this.renderMyReviews(container);
                        }
                    });
                });
            } else { // Tutor view listeners
                list.querySelectorAll('.reply-btn').forEach(b => b.onclick = async () => {
                    const reply = document.getElementById(`reply-${b.dataset.id}`).value;
                    await this.supabase.from('reviews').update({ tutor_response: reply }).eq('review_id', b.dataset.id);
                    this.renderMyReviews(container);
                });

                list.querySelectorAll('.req-del').forEach(b => b.onclick = async () => {
                    await this.supabase.from('reviews').update({ deletion_requested: true }).eq('review_id', b.dataset.id);
                    alert('Requested!'); this.renderMyReviews(container);
                });
            }
        } catch (error) {
            console.error('Error rendering reviews list:', error);
            if (list) list.innerHTML = `<div class="error">Failed to load reviews: ${error.message}</div>`;
        }
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
        container.innerHTML = `<section class="dashboard-section"><h2>User Management</h2><div class="search-bar"><input type="text" id="user-search" placeholder="Search users..." class="form-control"></div><div id="user-list" class="mt-4"></div></section>`;
        const load = async () => {
            const { data: allUsers } = await this.supabase.from('users').select('*').order('role');
            const users = allUsers.filter(u => u.role !== 'Super Admin');

            const renderUsers = (userList) => {
                const pendingUsers = userList.filter(u => u.approval_status === 'Pending');
                const activeUsers = userList.filter(u => u.approval_status !== 'Pending');

                let html = '';

                if (pendingUsers.length > 0) {
                    html += `<h3>Pending Accounts</h3><table class="user-table">
                        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                        <tbody>${pendingUsers.map(u => `
                            <tr><td>${u.user_id}</td><td>${u.first_name} ${u.last_name}</td><td>${u.email}</td><td>${u.role}</td>
                            <td>
                                <button class="btn btn-sm btn-primary app-u" data-id="${u.user_id}">Approve</button>
                                <button class="btn btn-sm btn-danger del-u" data-id="${u.user_id}">Delete</button>
                            </td></tr>
                        `).join('')}</tbody></table>`;
                }

                if (activeUsers.length > 0) {
                    html += `<h3 class="mt-4">Active Accounts</h3><table class="user-table">
                        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                        <tbody>${activeUsers.map(u => `
                            <tr><td>${u.user_id}</td><td>${u.first_name} ${u.last_name}</td><td>${u.email}</td><td>${u.role}</td>
                            <td>
                                <button class="btn btn-sm btn-danger del-u" data-id="${u.user_id}">Delete</button>
                            </td></tr>
                        `).join('')}</tbody></table>`;
                }

                const listEl = document.getElementById('user-list');
                if (listEl) {
                    listEl.innerHTML = html;
                    listEl.querySelectorAll('.app-u').forEach(b => b.onclick = async () => { await this.supabase.from('users').update({ approval_status: 'Approved' }).eq('user_id', b.dataset.id); load(); });
                    listEl.querySelectorAll('.del-u').forEach(b => {
                        b.onclick = () => {
                            this.showConfirmationModal('Are you sure you want to delete this user?', async () => {
                                await this.supabase.rpc('delete_user', { p_user_id: b.dataset.id });
                                load();
                            });
                        };
                    });
                }
            };

            renderUsers(users || []);

            const searchInput = document.getElementById('user-search');
            if (searchInput) {
                searchInput.oninput = (e) => {
                    const term = e.target.value.toLowerCase();
                    renderUsers(users.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(term)));
                };
            }
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
                    <div class="form-group form-check" style="display: flex; align-items: center;">
                        <input type="checkbox" name="is_recurring" id="is_recurring" class="form-check-input" style="margin-right: 10px;">
                        <label for="is_recurring" class="form-check-label">Is Recurring</label>
                    </div>
                    <button type="submit" class="btn btn-primary mt-2">Create Event</button>
                </form>
                <div id="event-list"></div>
            </section>
        `;
        const load = async () => {
            const { data } = await this.supabase.from('system_events').select('*').order('start_date');
            const listEl = document.getElementById('event-list');
            if (!listEl) return;
            listEl.innerHTML = `<h3>Existing Events</h3>` + (data || []).map(e => `
                <div class="card mb-2 p-2" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${e.name}</strong> (${e.start_date} to ${e.end_date}) ${e.is_recurring ? '<span class="badge badge-secondary">Recurring</span>' : ''}
                    </div>
                    <button class="btn btn-sm btn-danger del-event" data-id="${e.event_id}">Delete</button>
                </div>
            `).join('');

            listEl.querySelectorAll('.del-event').forEach(b => {
                b.onclick = () => {
                    this.showConfirmationModal('Are you sure you want to delete this event?', async () => {
                        await this.supabase.from('system_events').delete().eq('event_id', b.dataset.id);
                        load();
                    });
                };
            });
        };
        load();
        document.getElementById('event-form').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const isRecurring = document.getElementById('is_recurring').checked;
            const { error } = await this.supabase.rpc('create_event_and_cancel_appointments', {
                p_name: fd.get('name'), p_start_date: fd.get('start'), p_end_date: fd.get('end'), 
                p_event_type: fd.get('type'), p_is_recurring: isRecurring
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
                            <div class="form-group mt-3">
                                <label for="course-select">Select a Course</label>
                                <select id="course-select" class="form-control" required>
                                    ${tutor.specializations.map(s => `<option value="${s.course_id}">${s.course_name}</option>`).join('')}
                                </select>
                            </div>
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
        let selectedSlots = [];

        dateInput.onchange = async () => {
            const selectedDate = new Date(dateInput.value + 'T00:00:00Z');
            if (!selectedDate) return;

            slotsContainer.innerHTML = '<div>Loading available times...</div>';
            confirmBtn.disabled = true;
            selectedSlots = [];
            feedbackEl.innerHTML = '';

            const dayOfWeek = selectedDate.getUTCDay();
            const { data: workingHours, error: whError } = await this.supabase
                .from('working_hours').select('start_time, end_time').eq('tutor_id', tutor.user_id).eq('day_of_week', dayOfWeek).single();

            const { data: appointments, error: apptError } = await this.supabase
                .from('appointments_enhanced').select('start_time')
                .eq('tutor_id', tutor.user_id)
                .gte('start_time', selectedDate.toISOString())
                .lt('start_time', new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString());

            if (whError || apptError) {
                console.error('Error fetching availability:', whError || apptError);
                slotsContainer.innerHTML = `<div class="error">Could not load availability. Please try again.</div>`;
                return;
            }

            if (!workingHours) {
                slotsContainer.innerHTML = '<div>Tutor has no working hours set for this day.</div>';
                return;
            }

            const bookedSlots = new Set(appointments.map(a => new Date(a.start_time).toISOString()));
            const availableSlots = [];
            const [startHour] = workingHours.start_time.split(':').map(Number);
            const [endHour] = workingHours.end_time.split(':').map(Number);

            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const slotTime = new Date(selectedDate);
                    slotTime.setUTCHours(hour, minute, 0, 0);
                    if (!bookedSlots.has(slotTime.toISOString())) {
                        availableSlots.push(slotTime);
                    }
                }
            }

            if (availableSlots.length === 0) {
                slotsContainer.innerHTML = '<div>No available time slots for this date.</div>';
                return;
            }

            slotsContainer.innerHTML = '';
            availableSlots.forEach((slot, index) => {
                const button = document.createElement('button');
                button.className = 'btn time-slot-btn';
                button.textContent = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
                button.dataset.slot = slot.toISOString();
                button.dataset.index = index;

                button.onclick = () => {
                    const clickedIndex = parseInt(button.dataset.index);
                    const lastSelectedIndex = selectedSlots.length > 0 ? parseInt(selectedSlots[selectedSlots.length - 1].dataset.index) : -1;

                    if (selectedSlots.length > 0 && clickedIndex !== lastSelectedIndex + 1) {
                        // If not contiguous, reset selection
                        selectedSlots.forEach(btn => btn.classList.remove('active'));
                        selectedSlots = [];
                    }
                    
                    button.classList.add('active');
                    selectedSlots.push(button);
                    confirmBtn.disabled = false;
                };
                slotsContainer.appendChild(button);
            });
        };

        confirmBtn.onclick = async () => {
            if (selectedSlots.length === 0) {
                feedbackEl.innerHTML = `<div class="error">Please select one or more time slots.</div>`;
                return;
            }

            confirmBtn.disabled = true;
            feedbackEl.innerHTML = `<div>Booking...</div>`;

            const startTime = new Date(selectedSlots[0].dataset.slot);
            const lastSlot = new Date(selectedSlots[selectedSlots.length - 1].dataset.slot);
            const endTime = new Date(lastSlot.getTime() + 30 * 60 * 1000);

            const courseId = document.getElementById('course-select').value;
            const { data, error } = await this.supabase.rpc('book_appointment', {
                p_student_id: this.currentUser.user_id,
                p_tutor_id: tutor.user_id,
                p_start_time: startTime.toISOString(),
                p_end_time: endTime.toISOString(),
                p_course_id: courseId
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

    showConfirmationModal(message, onConfirm) {
        const m = document.getElementById('modal-container');
        if (!m) return;

        m.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Confirm Action</h3>
                        <button onclick="document.getElementById('modal-container').innerHTML=''">×</button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <div class="mt-4 d-flex justify-end">
                            <button id="confirm-yes" class="btn btn-primary mr-2">Yes</button>
                            <button id="confirm-no" class="btn btn-secondary">No</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.getElementById('confirm-yes').onclick = () => {
            onConfirm();
            document.getElementById('modal-container').innerHTML = '';
        };
        document.getElementById('confirm-no').onclick = () => {
            document.getElementById('modal-container').innerHTML = '';
        };
    },

    showReviewEditModal(review, reviewsContainer) {
        const m = document.getElementById('modal-container');
        if (!m) return;

        m.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Edit Your Review</h3>
                        <button onclick="document.getElementById('modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="review-edit-form" class="modal-body">
                        <div class="form-group">
                            <label for="rating-edit-select">Rating (1-5)</label>
                            <select id="rating-edit-select" class="form-control" required>
                                <option ${review.rating == 5 ? 'selected' : ''} value="5">5 Stars</option>
                                <option ${review.rating == 4 ? 'selected' : ''} value="4">4 Stars</option>
                                <option ${review.rating == 3 ? 'selected' : ''} value="3">3 Stars</option>
                                <option ${review.rating == 2 ? 'selected' : ''} value="2">2 Stars</option>
                                <option ${review.rating == 1 ? 'selected' : ''} value="1">1 Star</option>
                            </select>
                        </div>
                        <div class="form-group mt-2">
                            <label for="review-edit-comment">Comment</label>
                            <textarea id="review-edit-comment" class="form-control" rows="4" required>${review.comment}</textarea>
                        </div>
                        <div class="mt-4 d-flex justify-end">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.getElementById('review-edit-form').onsubmit = async (e) => {
            e.preventDefault();
            const newRating = document.getElementById('rating-edit-select').value;
            const newComment = document.getElementById('review-edit-comment').value;

            const { error } = await this.supabase
                .from('reviews')
                .update({ rating: newRating, comment: newComment, is_edited: true })
                .eq('review_id', review.review_id);

            if (error) {
                alert(`Error updating review: ${error.message}`);
            } else {
                alert('Review updated successfully!');
                document.getElementById('modal-container').innerHTML = '';
                this.renderMyReviews(reviewsContainer);
            }
        };
    },

    async showReviewsModal(t) {
        const m = document.getElementById('modal-container');
        if (!m) return;
        m.innerHTML = `<div class="modal-backdrop"><div class="modal"><div class="modal-header"><h3>Reviews for ${t.first_name}</h3><button onclick="document.getElementById('modal-container').innerHTML=''">×</button></div><div id="m-rev" class="modal-body">Loading...</div></div></div>`;
        const { data } = await this.supabase.from('reviews').select('*').eq('tutor_id', t.user_id);
        document.getElementById('m-rev').innerHTML = (data || []).map(r => `<div class="review-card card p-2 mb-2">★ ${r.rating}<p>${r.comment}</p></div>`).join('') || 'No reviews yet.';
    },

    async showRescheduleModal(appt) {
        const m = document.getElementById('modal-container');
        if (!m) return;

        let selectedSlot = null;

        m.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal large">
                    <div class="modal-header">
                        <h3>Reschedule Appointment</h3>
                        <button onclick="document.getElementById('modal-container').innerHTML=''">×</button>
                    </div>
                    <div class="modal-body">
                        <p>Select a new date to see available 30-minute time slots.</p>
                        <div class="booking-form-container mt-4">
                            <input type="date" id="booking-date" class="form-control mb-2">
                            <div id="time-slots-container" class="time-slots-container mt-3"></div>
                            <button id="confirm-reschedule-btn" class="btn btn-primary mt-3" disabled>Confirm Reschedule</button>
                        </div>
                        <div id="booking-feedback" class="mt-3"></div>
                    </div>
                </div>
            </div>`;

        const dateInput = document.getElementById('booking-date');
        const slotsContainer = document.getElementById('time-slots-container');
        const confirmBtn = document.getElementById('confirm-reschedule-btn');
        const feedbackEl = document.getElementById('booking-feedback');

        dateInput.onchange = async () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            slotsContainer.innerHTML = '<div>Loading available times...</div>';
            confirmBtn.disabled = true;
            selectedSlot = null;
            feedbackEl.innerHTML = '';

            const { data: slots, error } = await this.supabase.rpc('get_tutor_availability_slots', {
                p_tutor_id: appt.tutor_id,
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
            feedbackEl.innerHTML = `<div>Rescheduling...</div>`;

            const startTime = new Date(selectedSlot);
            const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

            const { error } = await this.supabase.rpc('reschedule_appointment', {
                p_appointment_id: appt.appointment_id,
                p_new_start_time: startTime.toISOString(),
                p_new_end_time: endTime.toISOString()
            });

            if (error) {
                console.error('Reschedule RPC error:', error);
                feedbackEl.innerHTML = `<div class="error">Error rescheduling appointment: ${error.message}</div>`;
                confirmBtn.disabled = false;
            } else {
                feedbackEl.innerHTML = `<div class="success">Appointment rescheduled successfully!</div>`;
                setTimeout(() => {
                    document.getElementById('modal-container').innerHTML='';
                    this.loadView('my-appointments');
                }, 2000);
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
