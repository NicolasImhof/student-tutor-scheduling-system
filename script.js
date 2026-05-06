/**
 * @file Main application logic for the Student-to-Tutor Scheduling System.
 * @author Gemini Code Assistant
 */

window.App = {
    supabase: null,
    currentUser: null,

    // 1. INITIALIZATION
    init() {
        const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTYzODAsImV4cCI6MjA4NjA3MjM4MH0.mrCDflIMgQvJ0fIEaRJao_pdzLgafgsrlUSDQRCiPqc';
        this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);
        this.addEventListeners();
        this.showLoginView();
    },

    // 2. EVENT LISTENERS
    addEventListeners() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            this.login(email, password);
        });

        document.getElementById('logout-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        const navContainer = document.getElementById('dashboard-nav');
        if (navContainer) {
            navContainer.addEventListener('click', (e) => {
                if (e.target.matches('a.nav-link')) {
                    e.preventDefault();
                    const view = e.target.getAttribute('href').substring(1);
                    this.loadDashboardView(view);
                }
            });
        }

        const dashboardContent = document.getElementById('dashboard-content');
        if (dashboardContent) {
            dashboardContent.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;

                const userId = target.dataset.userId;
                const appointmentId = target.dataset.appointmentId;
                const reviewId = target.dataset.reviewId;
                const requestId = target.dataset.requestId;

                if (target.matches('.view-reviews-btn')) {
                    this.tutorReviewsId = userId; // Store the ID for the view to use
                    this.loadDashboardView('tutor-reviews');
                }
                else if (target.matches('.book-now-btn')) this.startBookingProcess(userId);
                else if (target.matches('.approve-btn')) this.approveUser(userId);
                else if (target.matches('.deny-btn')) this.denyUser(userId);
                else if (target.matches('.edit-btn')) this.editUserModal(userId);
                else if (target.matches('.delete-btn')) this.deleteUserConfirm(userId);
                else if (target.matches('.write-review-btn')) this.openReviewModal(appointmentId);
                else if (target.matches('.edit-review-btn')) this.openReviewModal(appointmentId, reviewId);
                else if (target.matches('.respond-btn') || target.matches('.edit-response-btn')) this.openTutorResponseModal(reviewId);
                else if (target.id === 'request-time-off-btn') this.openTimeOffRequestModal();
                else if (target.matches('.approve-time-off-btn')) this.approveTimeOffRequest(requestId);
                else if (target.matches('.deny-time-off-btn')) this.denyTimeOffRequest(requestId);
                else if (target.id === 'set-availability-btn') this.showSetAvailabilityModal();
            });
        }
    },

    // 3. AUTHENTICATION & VIEW MANAGEMENT
    async login(email, password) {
        console.log(`Attempting to login with email: ${email}`);
        const { data, error } = await this.supabase.from('users').select('*').eq('email', email).eq('approval_status', 'Approved').single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                console.log('Login failed: User not found or not approved.');
                this.showModal('Login Failed', '<p class="error">Invalid email, password, or account not approved.</p>');
            } else {
                console.error('Login error:', error);
                this.showModal('Login Error', `<p class="error">An error occurred: ${error.message}</p>`);
            }
            return;
        }

        console.log('User data from DB:', data);
        // NOTE: This is a mock password check. Real applications must use a secure auth provider.
        if (data && data.password === password) {
            console.log('Password matches. Login successful.');
            this.currentUser = data;
            this.showDashboardView();
        } else {
            console.log('Login failed: Invalid email or password.');
            this.showModal('Login Failed', '<p class="error">Invalid email or password.</p>');
        }
    },

    logout() {
        this.currentUser = null;
        this.showLoginView();
    },

    async showLoginView() {
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
        await this.fetchAndDisplayDemoCredentials();
    },

    showDashboardView() {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        document.getElementById('dashboard-title').textContent = `${this.currentUser.first_name}'s Dashboard`;
        this.loadDashboardNav();
        const defaultView = {
            'Student': 'find-tutor',
            'Tutor': 'my-availability',
            'Admin': 'admin-dashboard'
        }[this.currentUser.role];
        this.loadDashboardView(defaultView);
    },

    async fetchAndDisplayDemoCredentials() {
        const roles = ['Student', 'Tutor', 'Admin', 'Super Admin'];
        let demoHtml = '<h4>Demo Credentials</h4>';
        
        for (const role of roles) {
            try {
                const { data, error } = await this.supabase
                    .from('users')
                    .select('email, password')
                    .eq('role', role)
                    .eq('approval_status', 'Approved')
                    .limit(1)
                    .single();

                if (error) throw error;

                if (data) {
                    demoHtml += `<p><strong>${role}:</strong> ${data.email} / ${data.password}</p>`;
                } else {
                    demoHtml += `<p><strong>${role}:</strong> No approved user available.</p>`;
                }
            } catch (err) {
                demoHtml += `<p><strong>${role}:</strong> Error loading credentials.</p>`;
            }
        }
        document.getElementById('demo-credentials').innerHTML = demoHtml;
    },

    // 4. DASHBOARD NAVIGATION & VIEW ROUTING
    loadDashboardNav() {
        const nav = document.getElementById('dashboard-nav');
        if (!nav) return;
        
        let navLinks = '<a href="#my-profile" class="nav-link">My Profile</a>';
        
        switch (this.currentUser.role) {
            case 'Student':
                navLinks += '<a href="#find-tutor" class="nav-link">Find a Tutor</a>';
                navLinks += '<a href="#my-appointments" class="nav-link">My Appointments</a>';
                navLinks += '<a href="#my-reviews" class="nav-link">My Reviews</a>';
                break;
                
            case 'Tutor':
                navLinks += '<a href="#my-availability" class="nav-link">My Availability</a>';
                navLinks += '<a href="#my-appointments" class="nav-link">My Appointments</a>';
                navLinks += '<a href="#my-reviews" class="nav-link">My Reviews</a>';
                break;
                
            case 'Admin':
                navLinks += '<a href="#admin-dashboard" class="nav-link">Admin Dashboard</a>';
                navLinks += '<a href="#my-appointments" class="nav-link">My Appointments</a>';
                navLinks += '<a href="#calendar-management" class="nav-link">Calendar Management</a>';
                navLinks += '<a href="#review-management" class="nav-link">Review Management</a>';
                break;
                
            case 'Super Admin':
                navLinks += '<a href="#super-admin-dashboard" class="nav-link">Super Admin Dashboard</a>';
                navLinks += '<a href="#user-management" class="nav-link">User Management</a>';
                navLinks += '<a href="#calendar-management" class="nav-link">Calendar Management</a>';
                navLinks += '<a href="#time-off-override" class="nav-link">Time-Off Override</a>';
                navLinks += '<a href="#review-deletion-requests" class="nav-link">Review Deletion Requests</a>';
                break;
        }
        
        nav.innerHTML = navLinks;
    },

    loadDashboardView(view) {
        const dashboardContent = document.getElementById('dashboard-content');
        const calendarContainer = document.getElementById('calendar-container');
        if (!dashboardContent || !calendarContainer) return;

        // Clear both containers
        dashboardContent.innerHTML = '';
        calendarContainer.innerHTML = '';

        document.querySelectorAll('#dashboard-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${view}`) link.classList.add('active');
        });

        // The calendar is now loaded dynamically by the specific views that need it.
        // This avoids showing it on pages like 'My Profile' or 'My Reviews'.

        switch (view) {
            case 'admin-dashboard': this.loadAdminDashboard(); break;
            case 'super-admin-dashboard': this.loadSuperAdminDashboard(); break;
            case 'user-management': this.loadUserManagementView(); break;
            case 'calendar-management': this.loadCalendarManagementView(); break;
            case 'time-off-override': this.loadTimeOffOverrideView(); break;
            case 'review-deletion-requests': this.loadReviewDeletionRequestsView(); break;
            case 'review-management': this.loadReviewManagementView(); break;
            case 'find-tutor': this.loadFindTutorView(); break;
            case 'my-appointments': this.loadMyAppointmentsView(); break;
            case 'my-availability': this.loadMyAvailabilityView(); break;
            case 'my-reviews': this.loadMyReviewsView(); break;
            case 'tutor-reviews': this.loadTutorReviewsView(); break;
            case 'my-profile': this.loadMyProfileView(); break;
            default: dashboardContent.innerHTML = `<h2>Under Construction</h2>`; break;
        }
    },

    // 5. VIEW IMPLEMENTATIONS
    loadMyProfileView() {
        let content = `<h2>My Profile</h2><div class="profile-card"><p><strong>Name:</strong> ${this.currentUser.first_name} ${this.currentUser.last_name}</p><p><strong>Email:</strong> ${this.currentUser.email}</p><p><strong>Role:</strong> ${this.currentUser.role}</p>`;
        if (this.currentUser.role === 'Student' && this.currentUser.major) {
            content += `<p><strong>Major:</strong> ${this.currentUser.major}</p>`;
        }
        content += '</div>';
        document.getElementById('dashboard-content').innerHTML = content;
    },

    async loadMyReviewsView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>My Reviews</h2><p>This section is under construction. You will be able to see reviews from students here.</p>';
        // TODO: Implement fetching and displaying reviews for the current user (both for tutors and students).
    },

    async loadMyAvailabilityView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = `
            <div class="view-header">
                <h2>My Availability</h2>
                <button id="set-availability-btn" class="btn btn-primary">Set My Weekly Hours</button>
                <button id="request-time-off-btn" class="btn btn-secondary">Request Time Off</button>
            </div>
            <div id="tutor-calendar-container"></div>
            <div id="time-off-requests-container"></div>
        `;
        
        const calendarContainer = document.getElementById('tutor-calendar-container');
        window.Calendar.init(this.currentUser, this.currentUser, this.supabase, null, calendarContainer);

        this.loadTimeOffRequests();
    },

    async showSetAvailabilityModal() {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let formHtml = '<form id="availability-form">';

        const { data: currentHours, error } = await this.supabase
            .from('working_hours')
            .select('*')
            .eq('tutor_id', this.currentUser.user_id);

        if (error) {
            this.showModal('Error', '<p>Could not load current availability.</p>');
            return;
        }

        for (const day of daysOfWeek) {
            const hours = currentHours.find(h => h.day_of_week === day) || { start_time: '09:00', end_time: '17:00', is_working: true };
            formHtml += `
                <div class="day-availability-row">
                    <label class="day-label">${day}</label>
                    <input type="checkbox" name="is_working_${day}" ${hours.is_working ? 'checked' : ''}>
                    <input type="time" name="start_time_${day}" value="${hours.start_time}">
                    <span>-</span>
                    <input type="time" name="end_time_${day}" value="${hours.end_time}">
                </div>
            `;
        }
        formHtml += '<button type="submit" class="btn btn-primary">Save Availability</button></form>';

        this.showModal('Set Weekly Availability', formHtml);

        document.getElementById('availability-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const upserts = [];
            for (const day of daysOfWeek) {
                const is_working = e.target[`is_working_${day}`].checked;
                const start_time = e.target[`start_time_${day}`].value;
                const end_time = e.target[`end_time_${day}`].value;
                upserts.push({ tutor_id: this.currentUser.user_id, day_of_week: day, start_time, end_time, is_working });
            }
            
            const { error: deleteError } = await this.supabase.from('working_hours').delete().eq('tutor_id', this.currentUser.user_id);
            if(deleteError) { return this.showModal('Error', `<p>Failed to update: ${deleteError.message}</p>`); }

            const { error: upsertError } = await this.supabase.from('working_hours').insert(upserts);
            if (upsertError) { return this.showModal('Error', `<p>Failed to save: ${upsertError.message}</p>`); }

            this.closeModal();
            this.showModal('Success', '<p>Your availability has been updated.</p>');
            this.loadMyAvailabilityView();
        });
    },

    async loadMyAppointmentsView() {
        const contentEl = document.getElementById('dashboard-content');
        const isStudent = this.currentUser.role === 'Student';

        try {
            let query = this.supabase.from('appointments_enhanced').select(`
                *,
                student:users!student_id(first_name, last_name),
                tutor:users!tutor_id(first_name, last_name),
                reviews(*)
            `);

            if (isStudent) {
                query = query.eq('student_id', this.currentUser.user_id);
            } else if (this.currentUser.role === 'Tutor') {
                query = query.eq('tutor_id', this.currentUser.user_id);
            }

            const { data, error } = await query.order('start_time', { ascending: false });

            if (error) {
                throw error;
            }

            let appointmentsHTML = data.map(appt => {
                const opponent = isStudent ? `${appt.tutor.first_name} ${appt.tutor.last_name}` : `${appt.student.first_name} ${appt.student.last_name}`;
                let reviewButton = '';

                if (isStudent && appt.status === 'Completed') {
                    const existingReview = appt.reviews && appt.reviews.length > 0 ? appt.reviews[0] : null;
                    if (existingReview) {
                        reviewButton = `<button class="btn btn-sm btn-secondary edit-review-btn" data-appointment-id="${appt.appointment_id}" data-review-id="${existingReview.review_id}">Edit Review</button>`;
                    } else {
                        reviewButton = `<button class="btn btn-sm btn-primary write-review-btn" data-appointment-id="${appt.appointment_id}">Write Review</button>`;
                    }
                }

                return `<tr>
                            <td>${new Date(appt.start_time).toLocaleString()}</td>
                            <td>${opponent}</td>
                            <td><span class="status-${appt.status.toLowerCase()}">${appt.status}</span></td>
                            <td>${reviewButton}</td>
                        </tr>`;
            }).join('');

            const opponentRole = isStudent ? 'Tutor' : 'Student';
            contentEl.innerHTML = `
                <h2>My Appointments</h2>
                <div class="table-responsive">
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>${opponentRole}</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>${appointmentsHTML}</tbody>
                    </table>
                </div>`;

        } catch (err) {
            console.error('Error loading appointments:', err);
            contentEl.innerHTML = '<p class="error">Failed to load appointments.</p>';
        }
    },

    async loadFindTutorView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = `<h2>Find a Tutor</h2><div id="tutor-list-container">Loading...</div>`;

        const { data, error } = await this.supabase.rpc('get_tutors_with_ratings');

        if (error) {
            console.error('Error fetching tutors with ratings:', error);
            contentEl.innerHTML = '<p class="error">Failed to load tutors.</p>';
            return;
        }

        const tutorsHTML = data.map(tutor => {
            const avgRating = tutor.average_rating ? tutor.average_rating.toFixed(1) : 'N/A';
            const starRating = tutor.average_rating ? '★'.repeat(Math.round(tutor.average_rating)) + '☆'.repeat(5 - Math.round(tutor.average_rating)) : 'No reviews yet';

            return `
                <div class="tutor-card-ratemyprof">
                    <div class="tutor-main-info">
                        <h3>${tutor.first_name} ${tutor.last_name}</h3>
                        <div class="tutor-category">${tutor.category}</div>
                    </div>
                    <div class="tutor-rating-summary">
                        <div class="rating-box"><span>${avgRating}</span> / 5</div>
                        <div class="star-display">${starRating}</div>
                        <div class="review-count">Based on ${tutor.review_count} reviews</div>
                    </div>
                    <div class="tutor-actions">
                        <button class="btn btn-primary view-reviews-btn" data-tutor-id="${tutor.user_id}">View Reviews</button>
                        <button class="btn btn-secondary book-now-btn" data-tutor-id="${tutor.user_id}">Book Now</button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('tutor-list-container').innerHTML = `<div class="tutor-grid-ratemyprof">${tutorsHTML}</div>`;
    },

    async loadSuperAdminDashboard() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Super Admin Dashboard</h2><p>System Overview and Quick Actions</p>';

        // Quick stats
        const { data: users, error: usersError } = await this.supabase.from('users').select('*');
        const { data: pendingTimeOff, error: timeOffError } = await this.supabase
            .from('time_off_requests')
            .select('*')
            .eq('status', 'Pending');
        const { data: reviewRequests, error: reviewError } = await this.supabase
            .from('reviews')
            .select('*')
            .eq('deletion_requested', true);

        if (usersError || timeOffError || reviewError) {
            contentEl.innerHTML += '<p class="error">Failed to load dashboard data.</p>';
            return;
        }

        const pendingUsers = users.filter(user => user.approval_status === 'Pending');
        const totalUsers = users.length;

        let html = '<div class="stats-grid">';
        html += `<div class="stat-card"><h3>${totalUsers}</h3><p>Total Users</p></div>`;
        html += `<div class="stat-card"><h3>${pendingUsers.length}</h3><p>Pending Approvals</p></div>`;
        html += `<div class="stat-card"><h3>${pendingTimeOff.length}</h3><p>Pending Time-Off</p></div>`;
        html += `<div class="stat-card"><h3>${reviewRequests.length}</h3><p>Review Deletion Requests</p></div>`;
        html += '</div>';

        html += '<div class="quick-actions">';
        html += '<h3>Quick Actions</h3>';
        html += '<button class="btn btn-primary" onclick="App.loadDashboardView(\'user-management\')">Manage Users</button>';
        html += '<button class="btn btn-primary" onclick="App.loadDashboardView(\'calendar-management\')">Manage Calendar</button>';
        html += '<button class="btn btn-primary" onclick="App.loadDashboardView(\'time-off-override\')">Review Time-Off</button>';
        html += '<button class="btn btn-primary" onclick="App.loadDashboardView(\'review-deletion-requests\')">Review Deletion Requests</button>';
        html += '</div>';

        // Show recent pending users
        if (pendingUsers.length > 0) {
            html += '<h3>Recent Pending Approvals</h3>';
            html += this.createUsersTable(pendingUsers.slice(0, 5), true);
            if (pendingUsers.length > 5) {
                html += '<p><a href="#" onclick="App.loadDashboardView(\'user-management\'); return false;">View all pending approvals...</a></p>';
            }
        }

        contentEl.innerHTML += html;
    },

    async loadAdminDashboard() {
        const contentEl = document.getElementById('dashboard-content');
        const adminCategory = this.currentUser.category;
        contentEl.innerHTML = `<h2>Admin Dashboard (${adminCategory})</h2>`;

        // Fetch tutors in the admin's category
        const { data: tutors, error } = await this.supabase.from('users').select('*').eq('role', 'Tutor').eq('category', adminCategory);
        if (error || !tutors.length) {
            contentEl.innerHTML += '<p>No tutors found in your category.</p>';
            return;
        }

        let html = '<div class="admin-controls">';
        html += '<label for="tutor-select">View Schedule For:</label>';
        html += '<select id="tutor-select"><option value="">Select a Tutor</option>';
        tutors.forEach(tutor => {
            html += `<option value="${tutor.user_id}">${tutor.first_name} ${tutor.last_name}</option>`;
        });
        html += '</select></div>';
        html += '<div id="admin-calendar-container"></div>';
        contentEl.innerHTML += html;

        document.getElementById('tutor-select').addEventListener('change', async (e) => {
            const tutorId = e.target.value;
            const calendarContainer = document.getElementById('admin-calendar-container');
            if (!tutorId) {
                calendarContainer.innerHTML = '';
                return;
            }
            const selectedTutor = tutors.find(t => t.user_id == tutorId);
            window.Calendar.init(selectedTutor, this.currentUser, this.supabase, null, calendarContainer);
        });
    },
    async approveUser(userId) {
        const { error } = await this.supabase
            .from('users')
            .update({ approval_status: 'Approved' })
            .eq('user_id', userId);

        if (error) {
            this.showModal('Error', `<p class="error">Failed to approve user: ${error.message}</p>`);
        } else {
            this.showModal('Success', '<p>User has been approved.</p>');
            this.loadAdminDashboard(); // Refresh the dashboard
        }
    },

    async denyUser(userId) {
        const { error } = await this.supabase
            .from('users')
            .update({ approval_status: 'Denied' })
            .eq('user_id', userId);

        if (error) {
            this.showModal('Error', `<p class="error">Failed to deny user: ${error.message}</p>`);
        } else {
            this.showModal('Success', '<p>User has been denied.</p>');
            this.loadAdminDashboard(); // Refresh the dashboard
        }
    },

    async openReviewModal(appointmentId, reviewId = null) {
        let existingReview = { rating: 5, comment: '' };
        if (reviewId) {
            const { data, error } = await this.supabase.from('reviews').select('*').eq('review_id', reviewId).single();
            if (error) {
                this.showModal('Error', '<p>Could not load existing review.</p>');
                return;
            }
            existingReview = data;
        }

        const stars = [5, 4, 3, 2, 1].map(i => `
            <input type="radio" id="star${i}" name="rating" value="${i}" ${existingReview.rating === i ? 'checked' : ''} />
            <label for="star${i}">★</label>
        `).join('');

        const content = `
            <form id="review-form">
                <div class="form-group rating-group">
                    <label>Rating</label>
                    <div class="star-rating">
                        ${stars}
                    </div>
                </div>
                <div class="form-group">
                    <label for="comment">Comment</label>
                    <textarea id="comment" name="comment" rows="4">${existingReview.comment}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                </div>
            </form>
        `;

        this.showModal(reviewId ? 'Edit Your Review' : 'Write a Review', content);

        document.getElementById('review-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const rating = document.querySelector('input[name="rating"]:checked').value;
            const comment = document.getElementById('comment').value;
            this.saveReview(appointmentId, reviewId, rating, comment);
        });
    },

    async saveReview(appointmentId, reviewId, rating, comment) {
        const { data: appointment } = await this.supabase
            .from('appointments_enhanced')
            .select('tutor_id')
            .eq('appointment_id', appointmentId)
            .single();

        const reviewData = {
            appointment_id: appointmentId,
            student_id: this.currentUser.user_id,
            tutor_id: appointment.tutor_id,
            rating: parseInt(rating),
            comment: comment,
        };

        if (reviewId) {
            reviewData.review_id = reviewId;
        }

        const { error } = await this.supabase.from('reviews').upsert(reviewData);

        if (error) {
            this.showModal('Error', `<p>Failed to save review: ${error.message}</p>`);
        } else {
            this.closeModal();
            this.showModal('Success', '<p>Your review has been saved!</p>');
            this.loadMyAppointmentsView(); // Refresh the view
        }
    },

    // 6. MODAL & WORKFLOW IMPLEMENTATIONS
    async startBookingProcess(tutorId) {
        const { data: tutor, error } = await this.supabase.from('users').select('*').eq('user_id', tutorId).single();
        if (error) { return this.showModal('Error', '<p class="error">Could not fetch tutor details.</p>'); }
        
        this.showModal(`Book an Appointment with ${tutor.first_name}`, '<div id="booking-calendar-container"></div>');
        const calendarContainer = document.getElementById('booking-calendar-container');
        
        // The last argument is the callback that runs when a student clicks a slot
        window.Calendar.init(tutor, this.currentUser, this.supabase, (tutor, date, time) => {
            this.confirmBooking(tutor, date, time);
        }, calendarContainer);
    },

    // ... other functions

    confirmBooking(tutor, date, slot) {
        const content = `<p>You are booking an appointment with <strong>${tutor.first_name} ${tutor.last_name}</strong> on <strong>${date}</strong> at <strong>${slot}</strong>.</p><div class="modal-actions"><button id="confirm-booking-btn" class="btn btn-primary">Confirm</button><button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button></div>`;
        this.showModal('Confirm Your Appointment', content);
        document.getElementById('confirm-booking-btn').addEventListener('click', async () => {
            const { error } = await this.supabase.from('appointments_enhanced').insert({ student_id: this.currentUser.user_id, tutor_id: tutor.user_id, start_time: new Date(`${date}T${slot}`).toISOString(), end_time: new Date(new Date(`${date}T${slot}`).getTime() + 60 * 60 * 1000).toISOString(), status: 'Scheduled' });
            if (error) {
                this.showModal('Error', `<p class="error">Failed to book appointment: ${error.message}</p>`);
            } else {
                this.closeModal();
                this.showModal('Success', '<p>Appointment booked successfully!</p>');
                this.loadDashboardView('my-appointments');
            }
        });
    },

    async editUserModal(userId) {
        const { data: user, error } = await this.supabase.from('users').select('*').eq('user_id', userId).single();
        if (error) { return this.showModal('Error', '<p class="error">Could not fetch user details.</p>'); }
        const content = `<form id="edit-user-form"><div class="form-group"><label>First Name:</label><input type="text" name="first_name" value="${user.first_name}" required></div><div class="form-group"><label>Last Name:</label><input type="text" name="last_name" value="${user.last_name}" required></div><div class="form-group"><label>Email:</label><input type="email" name="email" value="${user.email}" required></div><div class="form-group"><label>Role:</label><select name="role"><option value="Student" ${user.role === 'Student' ? 'selected' : ''}>Student</option><option value="Tutor" ${user.role === 'Tutor' ? 'selected' : ''}>Tutor</option><option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option></select></div><div class="form-group"><label>Status:</label><select name="approval_status"><option value="Pending" ${user.approval_status === 'Pending' ? 'selected' : ''}>Pending</option><option value="Approved" ${user.approval_status === 'Approved' ? 'selected' : ''}>Approved</option><option value="Denied" ${user.approval_status === 'Denied' ? 'selected' : ''}>Denied</option></select></div><div class="modal-actions"><button type="submit" class="btn btn-primary">Save</button></div></form>`;
        this.showModal(`Edit ${user.first_name}`, content);
        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updates = Object.fromEntries(formData.entries());
            const { error } = await this.supabase.from('users').update(updates).eq('user_id', userId);
            if (error) {
                this.showModal('Error', `<p class="error">Failed to update user: ${error.message}</p>`);
            } else {
                this.closeModal();
                this.showModal('Success', '<p>User updated successfully!</p>');
                this.loadAdminDashboard();
            }
        });
    },

    deleteUserConfirm(userId) {
        const content = `<p>Are you sure you want to delete this user?</p><div class="modal-actions"><button id="confirm-delete-btn" class="btn btn-danger">Delete</button><button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button></div>`;
        this.showModal('Confirm Deletion', content);
        document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
            const { error } = await this.supabase.from('users').delete().eq('user_id', userId);
            if (error) {
                this.showModal('Error', `<p class="error">Failed to delete user: ${error.message}</p>`);
            } else {
                this.closeModal();
                this.showModal('Success', '<p>User deleted successfully!</p>');
                this.loadAdminDashboard();
            }
        });
    },

    // 7. UTILITY FUNCTIONS
    showModal(title, contentHTML) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        modalContainer.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal">
                    <div class="modal-header"><h2>${title}</h2><button class="modal-close-btn" onclick="App.closeModal()">&times;</button></div>
                    <div class="modal-content">${contentHTML}</div>
                </div>
            </div>
        `;
    },

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
