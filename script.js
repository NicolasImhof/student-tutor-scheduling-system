/* jshint esversion: 11 */

/**
 * @file Main application logic for the Student-to-Tutor Scheduling System.
 * @author Gemini Code Assistant
 */

window.App = {
    supabase: null,
    currentUser: null,
    viewPermissions: {
        'find-tutor': ['Student'],
        'my-appointments': ['Student', 'Tutor', 'Admin'],
        'my-reviews': ['Student', 'Tutor'],
        'my-availability': ['Tutor'],
        'schedule-and-availability': ['Tutor'],
        'admin-dashboard': ['Admin', 'Super Admin'],
        'super-admin-dashboard': ['Super Admin'],
        'user-management': ['Super Admin'],
        'calendar-management': ['Admin', 'Super Admin'],
        'time-off-override': ['Super Admin'],
        'review-deletion-requests': ['Admin', 'Super Admin'],
        'review-management': ['Admin', 'Super Admin'],
        'tutor-reviews': ['Student'],
        'my-profile': ['Student', 'Tutor', 'Admin', 'Super Admin'],
    },

    // USER MANAGEMENT FUNCTIONS
    getUserActions(user) {
        if (user.approval_status === 'Pending') {
            return `
                <button class="btn btn-sm btn-primary approve-btn" data-user-id="${user.user_id}">Approve</button>
                <button class="btn btn-sm btn-danger deny-btn" data-user-id="${user.user_id}">Deny</button>
            `;
        } else if (user.approval_status === 'Approved') {
            return `
                <button class="btn btn-sm btn-danger" onclick="App.deactivateUser('${user.user_id}')">Deactivate</button>
            `;
        } else if (user.approval_status === 'Denied') {
            return `
                <button class="btn btn-sm btn-primary approve-btn" data-user-id="${user.user_id}">Approve</button>
            `;
        } else if (user.approval_status === 'Inactive') {
            return `
                <button class="btn btn-sm btn-primary" onclick="App.activateUser('${user.user_id}')">Activate</button>
            `;
        }
        return '';
    },

    async loadUserManagementView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>User Management</h2><div id="users-container">Loading...</div>';
        
        try {
            const { data: users, error } = await this.supabase.rpc('get_users_for_management');
            
            if (error) {
                throw error;
            }
            const pendingUsers = users.filter(user => user.approval_status === 'Pending');
            const otherUsers = users.filter(user => user.approval_status !== 'Pending');

            let usersHTML = '';

            if (pendingUsers.length > 0) {
                usersHTML += `
                    <h3>Pending Approvals</h3>
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pendingUsers.map(user => `
                                <tr>
                                    <td>${user.first_name} ${user.last_name}</td>
                                    <td>${user.email}</td>
                                    <td>${user.role}</td>
                                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>${this.getUserActions(user)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }

            if (otherUsers.length > 0) {
                usersHTML += `
                    <h3>All Users</h3>
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${otherUsers.map(user => `
                                <tr>
                                    <td>${user.first_name} ${user.last_name}</td>
                                    <td>${user.email}</td>
                                    <td>${user.role}</td>
                                    <td><span class="status-${user.approval_status.toLowerCase()}">${user.approval_status}</span></td>
                                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>${this.getUserActions(user)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
            
            document.getElementById('users-container').innerHTML = usersHTML;
            
        } catch (err) {
            console.error('Error loading user management:', err);
            contentEl.innerHTML = '<p class="error">Failed to load user management.</p>';
        }
    },

    async approveUser(userId) {
        this.showConfirmationModal('Approve User', 'Are you sure you want to approve this user?', async () => {
            try {
                const { error } = await this.supabase
                    .from('users')
                    .update({ approval_status: 'Approved' })
                    .eq('user_id', userId);
                
                if (error) {
                    throw error;
                }
                
                this.showModal('Success', '<p>User approved successfully.</p>');
                this.loadUserManagementView();
                
            } catch (err) {
                console.error('Error approving user:', err);
                this.showModal('Error', '<p>Failed to approve user.</p>');
            }
        });
    },

    async denyUser(userId) {
        this.showConfirmationModal('Deny User', 'Are you sure you want to deny this user?', async () => {
            try {
                const { error } = await this.supabase
                    .from('users')
                    .update({ approval_status: 'Denied' })
                    .eq('user_id', userId);
                
                if (error) {
                    throw error;
                }
                
                this.showModal('Success', '<p>User denied successfully.</p>');
                this.loadUserManagementView();
                
            } catch (err) {
                console.error('Error denying user:', err);
                this.showModal('Error', '<p>Failed to deny user.</p>');
            }
        });
    },

    async deactivateUser(userId) {
        this.showConfirmationModal('Deactivate User', 'Are you sure you want to deactivate this user?', async () => {
            try {
                const { error } = await this.supabase
                    .from('users')
                    .update({ approval_status: 'Inactive' })
                    .eq('user_id', userId);
                
                if (error) {
                    throw error;
                }
                
                this.showModal('Success', '<p>User deactivated successfully.</p>');
                this.loadUserManagementView();
                
            } catch (err) {
                console.error('Error deactivating user:', err);
                this.showModal('Error', '<p>Failed to deactivate user.</p>');
            }
        });
    },

    async activateUser(userId) {
        this.showConfirmationModal('Activate User', 'Are you sure you want to activate this user?', async () => {
            try {
                const { error } = await this.supabase
                    .from('users')
                    .update({ approval_status: 'Approved' })
                    .eq('user_id', userId);
                
                if (error) {
                    throw error;
                }
                
                this.showModal('Success', '<p>User activated successfully.</p>');
                this.loadUserManagementView();
                
            } catch (err) {
                console.error('Error activating user:', err);
                this.showModal('Error', '<p>Failed to activate user.</p>');
            }
        });
    },

    getTimeOffActions(request) {
        if (request.status === 'Pending') {
            return `
                <button class="btn btn-sm btn-primary approve-time-off-btn" data-request-id="${request.request_id}">Approve</button>
                <button class="btn btn-sm btn-danger deny-time-off-btn" data-request-id="${request.request_id}">Deny</button>
            `;
        } else if (request.status === 'Approved') {
            return `
                <button class="btn btn-sm btn-danger deny-time-off-btn" data-request-id="${request.request_id}">Deny</button>
            `;
        } else if (request.status === 'Denied') {
            return `
                <button class="btn btn-sm btn-primary approve-time-off-btn" data-request-id="${request.request_id}">Approve</button>
            `;
        }
        return '';
    },

    // ADMIN DASHBOARD FUNCTIONS
    async loadAdminDashboard() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Admin Dashboard</h2><div id="admin-metrics">Loading...</div><div id="pending-approvals">Loading...</div>';
        
        try {
            // Get metrics
            const { data: totalAppointments } = await this.supabase
                .from('appointments_enhanced')
                .select('appointment_id', { count: 'exact' });
            
            const { data: pendingTimeOff } = await this.supabase
                .from('time_off_requests')
                .select('*')
                .eq('status', 'Pending');
            
            const metricsHTML = `
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Total Appointments</h3>
                        <p class="metric-value">${totalAppointments ? totalAppointments.length : 0}</p>
                    </div>
                    <div class="metric-card">
                        <h3>Pending Time Off</h3>
                        <p class="metric-value">${pendingTimeOff ? pendingTimeOff.length : 0}</p>
                    </div>
                </div>
            `;
            
            document.getElementById('admin-metrics').innerHTML = metricsHTML;
            
        } catch (err) {
            console.error('Error loading admin dashboard:', err);
            contentEl.innerHTML = '<p class="error">Failed to load admin dashboard.</p>';
        }
    },

    async loadSuperAdminDashboard() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Super Admin Dashboard</h2><div id="super-admin-metrics">Loading...</div>';
        
        try {
            // Get comprehensive metrics
            const { data: totalUsers } = await this.supabase
                .from('users')
                .select('user_id', { count: 'exact' });
            
            const { data: totalAppointments } = await this.supabase
                .from('appointments_enhanced')
                .select('appointment_id', { count: 'exact' });
            
            const { data: totalReviews } = await this.supabase
                .from('reviews')
                .select('review_id', { count: 'exact' });
            
            const { data: totalCourses } = await this.supabase
                .from('courses')
                .select('course_id', { count: 'exact' });
            
            const { data: pendingDeletionRequests } = await this.supabase
                .from('review_deletion_requests')
                .select('*')
                .eq('status', 'Pending');

            const { data: pendingTimeOff } = await this.supabase
                .from('time_off_requests')
                .select('*')
                .eq('status', 'Pending');
            
            const metricsHTML = `
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Total Users</h3>
                        <p class="metric-value">${totalUsers ? totalUsers.length : 0}</p>
                    </div>
                    <div class="metric-card">
                        <h3>Total Appointments</h3>
                        <p class="metric-value">${totalAppointments ? totalAppointments.length : 0}</p>
                    </div>
                    <div class="metric-card">
                        <h3>Total Reviews</h3>
                        <p class="metric-value">${totalReviews ? totalReviews.length : 0}</p>
                    </div>
                    <div class="metric-card">
                        <h3>Total Courses</h3>
                        <p class="metric-value">${totalCourses ? totalCourses.length : 0}</p>
                    </div>
                    <div class="metric-card">
                        <h3>Pending Deletion Requests</h3>
                        <p class="metric-value">${pendingDeletionRequests ? pendingDeletionRequests.length : 0}</p>
                    </div>
                    <div class="metric-card">
                        <h3>Pending Time Off</h3>
                        <p class="metric-value">${pendingTimeOff ? pendingTimeOff.length : 0}</p>
                    </div>
                </div>
            `;
            
            document.getElementById('super-admin-metrics').innerHTML = metricsHTML;
            
        } catch (err) {
            console.error('Error loading super admin dashboard:', err);
            contentEl.innerHTML = '<p class="error">Failed to load super admin dashboard.</p>';
        }
    },

    // REVIEW MODAL FUNCTIONS
    async showWriteReviewModal(appointmentId) {
        const { data: appointment, error } = await this.supabase
            .from('appointments_enhanced')
            .select('*, tutor:users!tutor_id(first_name, last_name)')
            .eq('appointment_id', appointmentId)
            .single();

        if (error || !appointment) {
            this.showModal('Error', '<p>Could not load appointment details.</p>');
            return;
        }

        const modalContent = `
            <form id="write-review-form">
                <input type="hidden" id="appointment-id" value="${appointmentId}">
                <div class="form-group">
                    <label for="review-rating">Rating:</label>
                    <select id="review-rating" class="form-control" required>
                        <option value="">Select Rating</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Very Good</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="review-comment">Comment:</label>
                    <textarea id="review-comment" class="form-control" rows="4" required placeholder="Share your experience with ${appointment.tutor.first_name}..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Write a Review', modalContent);

        document.getElementById('write-review-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview();
        });
    },

    async showEditReviewModal(appointmentId, reviewId) {
        const { data: review, error } = await this.supabase
            .from('reviews')
            .select('*')
            .eq('review_id', reviewId)
            .single();

        if (error || !review) {
            this.showModal('Error', '<p>Could not load review details.</p>');
            return;
        }

        const modalContent = `
            <form id="edit-review-form">
                <input type="hidden" id="review-id" value="${reviewId}">
                <div class="form-group">
                    <label for="review-rating">Rating:</label>
                    <select id="review-rating" class="form-control" required>
                        <option value="5" ${review.rating === 5 ? 'selected' : ''}>5 - Excellent</option>
                        <option value="4" ${review.rating === 4 ? 'selected' : ''}>4 - Very Good</option>
                        <option value="3" ${review.rating === 3 ? 'selected' : ''}>3 - Good</option>
                        <option value="2" ${review.rating === 2 ? 'selected' : ''}>2 - Fair</option>
                        <option value="1" ${review.rating === 1 ? 'selected' : ''}>1 - Poor</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="review-comment">Comment:</label>
                    <textarea id="review-comment" class="form-control" rows="4" required>${review.comment}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Update Review</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Edit Review', modalContent);

        document.getElementById('edit-review-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateReview();
        });
    },

    async showTutorReviewsModal(tutorId) {
        const { data: reviews, error } = await this.supabase
            .rpc('get_reviews_for_tutor', { tutor_id_in: tutorId });

        if (error) {
            console.error('Error fetching tutor reviews:', error);
            this.showModal('Error', '<p>Could not load tutor reviews.</p>');
            return;
        }

        // The function returns JSON, so reviews might be null or an array
        const reviewArray = reviews || [];
        
        if (reviewArray.length === 0) {
            this.showModal('Reviews', '<p>This tutor has not received any reviews yet.</p>');
            return;
        }

        const reviewsHTML = reviewArray.map(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            return `
                <div class="review-card">
                    <div class="review-header">
                        <h4>${review.student_name}</h4>
                        <div class="review-meta">
                            <span class="star-rating">${stars}</span>
                            <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.comment}</p>
                    </div>
                </div>
            `;
        }).join('');

        this.showModal('Tutor Reviews', `<div class="reviews-list">${reviewsHTML}</div>`);
    },

    async submitReview() {
        const appointmentId = document.getElementById('appointment-id').value;
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value;

        if (!rating || !comment) {
            alert('Please fill in all fields.');
            return;
        }

        const { data: appointment } = await this.supabase
            .from('appointments')
            .select('*')
            .eq('appointment_id', appointmentId)
            .single();

        const { error } = await this.supabase
            .from('reviews')
            .insert({
                appointment_id: appointmentId,
                student_id: this.currentUser.user_id,
                tutor_id: appointment.tutor_id,
                rating: parseInt(rating),
                comment: comment
            });

        if (error) {
            alert('Failed to submit review. Please try again.');
            return;
        }

        this.closeModal();
        this.loadMyAppointmentsView();
        this.showModal('Success', '<p>Your review has been submitted successfully!</p>');
    },

    async updateReview() {
        const reviewId = document.getElementById('review-id').value;
        const rating = document.getElementById('review-rating').value;
        const comment = document.getElementById('review-comment').value;

        if (!rating || !comment) {
            alert('Please fill in all fields.');
            return;
        }

        const { error } = await this.supabase
            .from('reviews')
            .update({
                rating: parseInt(rating),
                comment: comment,
                last_updated_by: this.currentUser.role
            })
            .eq('review_id', reviewId);

        if (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review. Please try again.');
            return;
        }

        this.closeModal();
        this.loadMyAppointmentsView();
        this.showModal('Success', '<p>Your review has been updated successfully!</p>');
    },

    async showRequestDeletionModal(reviewId) {
        const modalContent = `
            <form id="request-deletion-form">
                <input type="hidden" id="review-id" value="${reviewId}">
                <div class="form-group">
                    <label for="deletion-reason">Reason for Deletion Request:</label>
                    <textarea id="deletion-reason" class="form-control" rows="4" required 
                        placeholder="Please explain why you want this review deleted..."></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Submit Deletion Request</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Request Review Deletion', modalContent);

        document.getElementById('request-deletion-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitDeletionRequest();
        });
    },

    async submitDeletionRequest() {
        const reviewId = document.getElementById('review-id').value;
        const reason = document.getElementById('deletion-reason').value;

        if (!reason) {
            alert('Please provide a reason for the deletion request.');
            return;
        }

        try {
            let rpc_call = 'request_review_deletion';
            let params = {
                p_review_id: parseInt(reviewId),
                p_reason: reason
            };

            if(this.currentUser.role === 'Tutor') {
                rpc_call = 'tutor_request_review_deletion';
                params.p_tutor_id = this.currentUser.user_id;
            } else {
                params.p_student_id = this.currentUser.user_id;
            }

            const { data, error } = await this.supabase.rpc(rpc_call, params);

            if (error) throw error;

            if (data.success) {
                this.closeModal();
                this.loadMyReviewsView();
                this.showModal('Success', '<p>Your deletion request has been submitted and will be reviewed by an administrator.</p>');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Error submitting deletion request:', err);
            alert('Failed to submit deletion request. Please try again.');
        }
    },

    async showRespondToReviewModal(reviewId) {
        const { data: review, error } = await this.supabase
            .from('reviews')
            .select('*')
            .eq('review_id', reviewId)
            .single();

        if (error || !review) {
            this.showModal('Error', '<p>Could not load review details.</p>');
            return;
        }

        const modalContent = `
            <form id="respond-review-form">
                <input type="hidden" id="review-id" value="${reviewId}">
                <div class="form-group">
                    <label for="tutor-response">Your Response:</label>
                    <textarea id="tutor-response" class="form-control" rows="4" required 
                        placeholder="Write your response to this review...">${review.tutor_response || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">${review.tutor_response ? 'Update Response' : 'Submit Response'}</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal(`${review.tutor_response ? 'Edit Your Response' : 'Respond to Review'}`, modalContent);

        document.getElementById('respond-review-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitTutorResponse();
        });
    },

    async submitTutorResponse() {
        const reviewId = document.getElementById('review-id').value;
        const response = document.getElementById('tutor-response').value;

        if (!response) {
            alert('Please provide a response.');
            return;
        }

        try {
            const { error } = await this.supabase
                .from('reviews')
                .update({
                    tutor_response: response,
                    response_created_at: new Date().toISOString(),
                    last_updated_by: 'Tutor'
                })
                .eq('review_id', reviewId);

            if (error) throw error;

            this.closeModal();
            this.loadTutorReviewsView();
            this.showModal('Success', '<p>Your response has been submitted successfully!</p>');
        } catch (err) {
            console.error('Error submitting tutor response:', err);
            alert('Failed to submit response. Please try again.');
        }
    },

    async deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('reviews')
                .delete()
                .eq('review_id', reviewId);

            if (error) throw error;

            this.loadReviewManagementView();
            this.showModal('Success', '<p>Review has been deleted successfully.</p>');
        } catch (err) {
            console.error('Error deleting review:', err);
            alert('Failed to delete review. Please try again.');
        }
    },

    showTimeOffRequestModal() {
        const modalContent = `
            <form id="time-off-request-form">
                <div class="form-group">
                    <label for="start-date">Start Date</label>
                    <input type="date" id="start-date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="end-date">End Date</label>
                    <input type="date" id="end-date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="reason">Reason (optional)</label>
                    <textarea id="reason" class="form-control" rows="3"></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Submit Request</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;
        this.showModal('Request Time Off', modalContent);

        document.getElementById('time-off-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitTimeOffRequest();
        });
    },

    async submitTimeOffRequest() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const reason = document.getElementById('reason').value;

        if (!startDate || !endDate) {
            this.showModal('Error', '<p>Please select a start and end date.</p>');
            return;
        }

        const { error } = await this.supabase.from('time_off_requests').insert({
            tutor_id: this.currentUser.user_id,
            start_date: startDate,
            end_date: endDate,
            reason: reason,
            status: 'Pending'
        });

        if (error) {
            console.error('Error submitting time-off request:', error);
            this.showModal('Error', '<p>Could not submit your request. Please try again.</p>');
            return;
        }

        this.closeModal();
        this.showModal('Success', '<p>Your time-off request has been submitted for approval.</p>');
        this.loadTimeOffRequests(); // Refresh the list
    },

    // 1. INITIALIZATION
    init() {
        const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTYzODAsImV4cCI6MjA4NjA3MjM4MH0.mrCDflIMgQvJ0fIEaRJao_pdzLgafgsrlUSDQRCiPqc';
        this.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

        this.supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.handleSignedIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.handleSignedOut();
            }
        });

        this.addEventListeners();
        this.checkUser(); // Initial check on page load
    },

    // 2. EVENT LISTENERS
    addEventListeners() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            this.login(email, password);
        });

        // Add event listener for the Create Account button
        const createAccountBtn = document.querySelector('a[href="register.html"]');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }
    },



    // 3. AUTHENTICATION & VIEW MANAGEMENT
    async login(email, password) {
        const loginButton = document.querySelector('#login-form button');
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner"></span> Logging In...';

        const { error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            this.showModal('Login Failed', `<p class="error">${error.message}</p>`);
            loginButton.disabled = false;
            loginButton.innerHTML = 'Login';
            return;
        }
        // Successful login is handled by onAuthStateChange
    },

    async handleSignedIn(session) {
        console.log('handleSignedIn triggered. Session:', session);
        const { user } = session;
        if (user) {
            console.log('User object found:', user);
            console.log('Attempting to fetch profile for auth_uuid:', user.id);
            const { data, error } = await this.supabase.rpc('get_user_profile', { user_uuid: user.id });
            
            if (error) {
                console.error('Error fetching user profile via RPC:', error);
                this.showModal('Error', '<p>Could not fetch your user profile.</p>');
                await this.supabase.auth.signOut();
                return;
            }

            if (data && data.length > 0) {
                this.currentUser = data[0].j;
                this.showDashboardView();
            } else if (data) {
                this.showModal('Login Failed', '<p class="error">Your account is not yet approved. Please check back later.</p>');
                await this.supabase.auth.signOut();
            } else {
                 this.showModal('Login Failed', '<p class="error">Could not find a user profile associated with this account.</p>');
                 await this.supabase.auth.signOut();
            }
        }
    },

    handleSignedOut() {
        this.currentUser = null;
        this.showLoginView();
    },

    async checkUser() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.handleSignedIn(session);
        } else {
            this.handleSignedOut();
        }
    },

    showRegisterModal() {
        const modalContent = `
            <form id="register-form">
                <div class="form-group">
                    <label for="register-first-name">First Name</label>
                    <input type="text" id="register-first-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-last-name">Last Name</label>
                    <input type="text" id="register-last-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input type="email" id="register-email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" class="form-control" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="register-confirm-password">Confirm Password</label>
                    <input type="password" id="register-confirm-password" class="form-control" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="register-role">I am a:</label>
                    <select id="register-role" class="form-control" required>
                        <option value="Student">Student</option>
                        <option value="Tutor">Tutor</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Create Account</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;
        this.showModal('Create a New Account', modalContent);

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });
    },

    async register() {
        const firstName = document.getElementById('register-first-name').value;
        const lastName = document.getElementById('register-last-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const role = document.getElementById('register-role').value;

        if (password !== confirmPassword) {
            this.showModal('Error', '<p>Passwords do not match.</p>');
            return;
        }

        const { data: authData, error: authError } = await this.supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            this.showModal('Registration Failed', `<p class="error">${authError.message}</p>`);
            return;
        }

        if (authData.user) {
            const { error: profileError } = await this.supabase.from('users').insert([
                { auth_uuid: authData.user.id, first_name: firstName, last_name: lastName, email: email, role: role }
            ]);

            if (profileError) {
                this.showModal('Registration Failed', `<p class="error">Could not create user profile: ${profileError.message}</p>`);
                // Optionally, delete the auth user if profile creation fails
                await this.supabase.auth.admin.deleteUser(authData.user.id);
                return;
            }

            this.closeModal();
            this.showModal('Registration Successful', '<p>Your account has been created. Please check your email to verify your account. Once verified, an administrator will review your account for approval.</p>');
        } else {
             this.showModal('Registration Failed', '<p class="error">An unknown error occurred during registration.</p>');
        }
    },

    async confirmSignUp(email, token) {
        try {
            const { data, error } = await this.supabase.auth.verifyOtp({
                email: email,
                token: token,
                type: 'signup'
            });

            if (error) {
                throw error;
            }

            this.showModal('Success', '<p>Your email has been confirmed! You can now log in.</p>');
            return data;
        } catch (error) {
            console.error('Error confirming sign up:', error);
            this.showModal('Error', `<p>Failed to confirm email: ${error.message}</p>`);
            return null;
        }
    },

    async logout() {
        await this.supabase.auth.signOut();
    },

    showLoginView() {
        document.body.className = '';
        document.getElementById('dashboard-container').innerHTML = '';
        document.getElementById('login-view').classList.remove('hidden');
    },

    showDashboardView() {
        document.body.className = `role-${this.currentUser.role.toLowerCase().replace(' ', '-')}`;
        document.getElementById('login-view').classList.add('hidden');
        this.renderDashboard();
        document.getElementById('dashboard-title').textContent = `${this.currentUser.first_name}'s Dashboard`;
        this.loadDashboardNav();
        const defaultView = {
            'Student': 'find-tutor',
            'Tutor': 'my-availability',
            'Admin': 'admin-dashboard',
            'Super Admin': 'super-admin-dashboard'
        }[this.currentUser.role];
        this.loadDashboardView(defaultView);
    },

    async approveTimeOff(requestId) {
        this.showConfirmationModal('Approve Time Off', 'Are you sure you want to approve this time-off request?', async () => {
            try {
                const { error } = await this.supabase
                    .from('time_off_requests')
                    .update({ status: 'Approved', reviewed_by: this.currentUser.user_id })
                    .eq('request_id', requestId);

                if (error) throw error;

                this.showModal('Success', '<p>Time-off request has been approved.</p>');
                this.loadTimeOffOverrideView(); // Refresh the view
            } catch (err) {
                console.error('Error approving time-off:', err);
                this.showModal('Error', '<p>Failed to approve the request.</p>');
            }
        });
    },

    showDenyTimeOffModal(requestId) {
        const modalContent = `
            <form id="deny-time-off-form">
                <div class="form-group">
                    <label for="denial-reason">Reason for Denial</label>
                    <textarea id="denial-reason" class="form-control" rows="3" required></textarea>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Deny Request</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;
        this.showModal('Deny Time Off Request', modalContent);

        document.getElementById('deny-time-off-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const reason = document.getElementById('denial-reason').value;
            this.denyTimeOff(requestId, reason);
        });
    },

    async denyTimeOff(requestId, reason) {
        this.showConfirmationModal('Deny Time Off', 'Are you sure you want to deny this time-off request?', async () => {
            try {
                const { error } = await this.supabase
                    .from('time_off_requests')
                    .update({ status: 'Denied', reviewed_by: this.currentUser.user_id, denial_reason: reason })
                    .eq('request_id', requestId);

                if (error) throw error;

                this.closeModal(); // Close the reason modal
                this.showModal('Success', '<p>Time-off request has been denied.</p>');
                this.loadTimeOffOverrideView(); // Refresh the view
            } catch (err) {
                console.error('Error denying time-off:', err);
                this.showModal('Error', '<p>Failed to deny the request.</p>');
            }
        });
    },

    async approveReviewDeletion(requestId, reviewId) {
        this.showConfirmationModal('Approve Review Deletion', 'Are you sure you want to delete this review?', async () => {
            try {
                // In a transaction, delete the review, then update the request
                const { error: deleteError } = await this.supabase.from('reviews').delete().eq('review_id', reviewId);
                if (deleteError) throw deleteError;

                const { error: updateError } = await this.supabase
                    .from('review_deletion_requests')
                    .update({ status: 'Approved', reviewed_by: this.currentUser.user_id })
                    .eq('request_id', requestId);
                if (updateError) throw updateError;

                this.showModal('Success', '<p>The review has been deleted.</p>');
                this.loadReviewDeletionRequestsView();
            } catch (err) {
                console.error('Error approving review deletion:', err);
                this.showModal('Error', '<p>Failed to delete the review.</p>');
            }
        });
    },

    async denyReviewDeletion(requestId) {
        this.showConfirmationModal('Deny Review Deletion', 'Are you sure you want to deny this review deletion request?', async () => {
            try {
                const { error } = await this.supabase
                    .from('review_deletion_requests')
                    .update({ status: 'Denied', reviewed_by: this.currentUser.user_id })
                    .eq('request_id', requestId);

                if (error) throw error;

                this.showModal('Success', '<p>The review deletion request has been denied.</p>');
                this.loadReviewDeletionRequestsView();
            } catch (err) {
                console.error('Error denying review deletion:', err);
                this.showModal('Error', '<p>Failed to deny the request.</p>');
            }
        });
    },

    // 4. DASHBOARD & VIEW RENDERING
    renderDashboard() {
        const dashboardContainer = document.getElementById('dashboard-container');
        dashboardContainer.innerHTML = `
            <div id="dashboard-view">
                <header><h1>Student-to-Tutor Scheduling</h1><nav id="main-nav"><a href="#" id="logout-link">Logout</a></nav></header>
                <div id="dashboard-nav-container"><h2 id="dashboard-title"></h2><nav id="dashboard-nav"></nav></div>
                <main><div id="dashboard-content"></div><div id="calendar-container"></div></main>
                <footer><p>&copy; 2026 Student-to-Tutor Scheduling</p></footer>
            </div>
        `;
        document.getElementById('logout-link').addEventListener('click', (e) => { e.preventDefault(); this.logout(); });
        document.getElementById('dashboard-nav-container').addEventListener('click', (e) => {
            if (e.target.matches('a.nav-link')) {
                e.preventDefault();
                this.loadDashboardView(e.target.getAttribute('href').substring(1));
            }
        });
         document.getElementById('dashboard-content').addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const userId = target.dataset.userId;
            if (target.classList.contains('approve-btn')) {
                this.approveUser(userId);
            } else if (target.classList.contains('deny-btn')) {
                this.denyUser(userId);
            } else if (target.classList.contains('write-review-btn')) {
                const appointmentId = target.dataset.appointmentId;
                this.showWriteReviewModal(appointmentId);
            } else if (target.classList.contains('edit-review-btn')) {
                const appointmentId = target.dataset.appointmentId;
                const reviewId = target.dataset.reviewId;
                this.showEditReviewModal(appointmentId, reviewId);
            } else if (target.classList.contains('view-reviews-btn')) {
                const tutorId = target.dataset.tutorId;
                this.showTutorReviewsModal(tutorId);
            } else if (target.classList.contains('approve-btn')) {
                this.approveUser(userId);
            } else if (target.classList.contains('deny-btn')) {
                this.denyUser(userId);
            } else if (target.classList.contains('approve-time-off-btn')) {
                const requestId = target.dataset.requestId;
                this.approveTimeOff(requestId);
            } else if (target.classList.contains('deny-time-off-btn')) {
                const requestId = target.dataset.requestId;
                this.showDenyTimeOffModal(requestId);
            } else if (target.classList.contains('approve-deletion-btn')) {
                const requestId = target.dataset.requestId;
                const reviewId = target.dataset.reviewId;
                this.approveReviewDeletion(requestId, reviewId);
            } else if (target.classList.contains('deny-deletion-btn')) {
                const requestId = target.dataset.requestId;
                this.denyReviewDeletion(requestId);
            } else if (target.classList.contains('edit-review-btn')) {
                const reviewId = target.dataset.reviewId;
                const appointmentId = target.dataset.appointmentId;
                this.showEditReviewModal(appointmentId, reviewId);
            } else if (target.classList.contains('request-deletion-btn')) {
                const reviewId = target.dataset.reviewId;
                this.showRequestDeletionModal(reviewId);
            } else if (target.classList.contains('respond-review-btn')) {
                const reviewId = target.dataset.reviewId;
                this.showRespondToReviewModal(reviewId);
            } else if (target.classList.contains('delete-review-btn')) {
                const reviewId = target.dataset.reviewId;
                this.deleteReview(reviewId);
            } else if (target.classList.contains('remove-system-event-btn')) {
                const eventId = target.dataset.eventId;
                this.removeSystemEvent(eventId);
            }
        });
    },

    loadDashboardNav() {
        const nav = document.getElementById('dashboard-nav');
        if (!nav) return;
        let navLinks = '<a href="#my-profile" class="nav-link">My Profile</a>';
        const contentEl = document.getElementById('dashboard-content');

        switch (this.currentUser.role) {
            case 'Student':
                navLinks += '<a href="#find-tutor" class="nav-link">Find a Tutor</a>';
                navLinks += '<a href="#my-appointments" class="nav-link">My Appointments</a>';
                navLinks += '<a href="#my-reviews" class="nav-link">My Reviews</a>';
                break;
            case 'Tutor':
                navLinks += '<a href="#schedule-and-availability" class="nav-link">Schedule & Availability</a>';
                navLinks += '<a href="#my-reviews" class="nav-link">My Reviews</a>';
                break;
            case 'Admin':
                contentEl.innerHTML = `
                    <h2>Admin Dashboard</h2>
                    <div id="admin-metrics"></div>
                    <div id="pending-approvals"></div>
                `;
                navLinks += '<a href="#admin-dashboard" class="nav-link">Admin Dashboard</a>';
                navLinks += '<a href="#my-appointments" class="nav-link">My Appointments</a>';
                navLinks += '<a href="#calendar-management" class="nav-link">Calendar Management</a>';
                navLinks += '<a href="#review-management" class="nav-link">Review Management</a>';
                navLinks += '<a href="#review-deletion-requests" class="nav-link">Deletion Requests</a>';
                break;
            case 'Super Admin':
                contentEl.innerHTML = `
                    <h2>Super Admin Dashboard</h2>
                    <div id="super-admin-metrics"></div>
                `;
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
        // Check permissions
        if (!this.viewPermissions[view] || !this.viewPermissions[view].includes(this.currentUser.role)) {
            document.getElementById('dashboard-content').innerHTML = '<h2>Access Denied</h2><p>You do not have permission to view this page.</p>';
            return;
        }

        // Hide calendar by default
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer) {
            calendarContainer.innerHTML = '';
            calendarContainer.style.display = 'none';
        }

        // Load the view
        switch (view) {
            case 'my-profile':
                this.loadMyProfileView();
                break;
            case 'find-tutor':
                this.loadFindTutorView();
                break;
            case 'my-appointments':
                this.loadMyAppointmentsView();
                calendarContainer.style.display = 'block';
                this.loadCalendar('appointments');
                break;
            case 'my-reviews':
                this.loadMyReviewsView();
                break;
            case 'my-availability':
                this.loadMyAvailabilityView();
                break;
            case 'schedule-and-availability':
                this.loadScheduleAndAvailabilityView();
                break;
            case 'admin-dashboard':
                this.loadAdminDashboard();
                break;
            case 'super-admin-dashboard':
                this.loadSuperAdminDashboard();
                break;
            case 'user-management':
                this.loadUserManagementView();
                break;
            case 'calendar-management':
                this.loadCalendarManagementView();
                calendarContainer.style.display = 'block';
                this.loadCalendar('management');
                break;
            case 'time-off-override':
                this.loadTimeOffOverrideView();
                break;
            case 'review-deletion-requests':
                this.loadReviewDeletionRequestsView();
                break;
            case 'review-management':
                this.loadReviewManagementView();
                break;
            case 'tutor-reviews':
                this.loadTutorReviewsView();
                break;
            default:
                document.getElementById('dashboard-content').innerHTML = '<h2>Page Not Found</h2>';
                break;
        }

        // Update active nav link
        document.querySelectorAll('#dashboard-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${view}`) {
                link.classList.add('active');
            }
        });
    },

    loadCalendar(view) {
        const calendarContainer = document.getElementById('calendar-container');
        let tutorId = null;
        if (this.currentUser.role === 'Tutor') {
            tutorId = this.currentUser.user_id;
        }
        // In a real app, you might have a way to select a tutor to view their calendar
        // For now, we'll just show the current user's calendar if they are a tutor
        window.Calendar.init(this.currentUser, tutorId, this.supabase, view, calendarContainer);
    },



    // 5. VIEW IMPLEMENTATIONS
    loadMyProfileView() {
        let content = `<h2>My Profile</h2><div class="profile-card"><p><strong>Name:</strong> ${this.currentUser.first_name} ${this.currentUser.last_name}</p><p><strong>Email:</strong> ${this.currentUser.email}</p><p><strong>Role:</strong> ${this.currentUser.role}</p>`;
        if (this.currentUser.role === 'Student') {
            content += `<p><strong>Major:</strong> ${this.currentUser.major || 'N/A'}</p>`;
        }
        content += '</div>';
        document.getElementById('dashboard-content').innerHTML = content;
    },



    async loadMyAppointmentsTable(containerSelector) {
        const container = document.querySelector(containerSelector);
        container.innerHTML = '<div id="appointments-container">Loading...</div>';

        if (!this.currentUser || !this.currentUser.auth_uuid) {
            container.innerHTML = '<p class="error">Failed to load appointments: User authentication data is missing.</p>';
            return;
        }

        const isStudent = this.currentUser.role === 'Student';

        try {
            const { data: appointments, error } = await this.supabase
                .rpc('get_appointments_for_user', { user_uuid: this.currentUser.auth_uuid });

            if (error) throw error;

            if (!appointments || appointments.length === 0) {
                container.innerHTML = '<p>You have no appointments.</p>';
                return;
            }

            // Sort appointments by start time
            appointments.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

            const appointmentsHtml = `
                <table class="appointments-table">
                    <thead>
                        <tr>
                            <th>${isStudent ? 'Tutor' : 'Student'}</th>
                            <th>Date & Time</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appointments.map(apt => {
                            const otherParty = isStudent ? 
                                `${apt.tutor_first_name} ${apt.tutor_last_name}` : 
                                `${apt.student_first_name} ${apt.student_last_name}`;
                            
                            const startTime = new Date(apt.start_time);
                            const endTime = new Date(apt.end_time);
                            const dateStr = startTime.toLocaleDateString();
                            const timeStr = `${startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                            
                            let actions = '';
                            if (apt.status === 'Scheduled') {
                                if (!isStudent) {
                                    actions = `
                                        <button class="btn btn-sm btn-warning" onclick="App.rescheduleAppointment(${apt.appointment_id})">Reschedule</button>
                                        <button class="btn btn-sm btn-danger" onclick="App.cancelAppointment(${apt.appointment_id})">Cancel</button>
                                    `;
                                }
                            } else if (apt.status === 'Cancelled' && !isStudent) {
                                actions = `
                                    <button class="btn btn-sm btn-warning" onclick="App.rescheduleAppointment(${apt.appointment_id})">Reschedule</button>
                                `;
                            }
                            
                            return `
                                <tr>
                                    <td>${otherParty}</td>
                                    <td>${dateStr}<br>${timeStr}</td>
                                    <td>${apt.subject}</td>
                                    <td><span class="status-${apt.status.toLowerCase()}">${apt.status}</span></td>
                                    <td>${actions}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;

            container.innerHTML = appointmentsHtml;

        } catch (err) {
            console.error('Error loading appointments:', err);
            container.innerHTML = '<p class="error">Failed to load appointments.</p>';
        }
    },

    async loadTimeOffRequests() {
        const container = document.getElementById('time-off-requests-container');
        container.innerHTML = '<h3>My Time Off Requests</h3><div id="time-off-list">Loading...</div>';
        const { data, error } = await this.supabase.from('time_off_requests').select('*').eq('tutor_id', this.currentUser.user_id).order('start_date', { ascending: false });
        if (error) {
            document.getElementById('time-off-list').innerHTML = '<p class="error">Could not load requests.</p>';
            return;
        }
        if (data.length === 0) {
            document.getElementById('time-off-list').innerHTML = '<p>You have no time off requests.</p>';
            return;
        }
        const requestsHtml = data.map(req => `<div class="time-off-request-card"><p><strong>Dates:</strong> ${req.start_date} to ${req.end_date}</p><p><strong>Reason:</strong> ${req.reason || 'N/A'}</p><p><strong>Status:</strong> <span class="status-${req.status.toLowerCase()}">${req.status}</span></p></div>`).join('');
        document.getElementById('time-off-list').innerHTML = requestsHtml;
    },

    async loadMyAvailabilityView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = `<div class="view-header"><h2>My Availability</h2><button id="set-availability-btn" class="btn btn-primary">Set My Weekly Hours</button><button id="request-time-off-btn" class="btn btn-secondary">Request Time Off</button></div><div id="tutor-calendar-container"></div><div id="time-off-requests-container"></div>`;
        const calendarContainer = document.getElementById('tutor-calendar-container');
        window.Calendar.init(this.currentUser, this.currentUser.user_id, this.supabase, null, calendarContainer);

        document.getElementById('set-availability-btn').addEventListener('click', () => this.showSetAvailabilityModal());
        document.getElementById('request-time-off-btn').addEventListener('click', () => this.showTimeOffRequestModal());

        this.loadTimeOffRequests();
    },

    async showSetAvailabilityModal() {
        const { data: currentHours, error } = await this.supabase
            .rpc('get_working_hours_for_tutor', { tutor_id_in: this.currentUser.user_id });

        if (error) {
            this.showModal('Error', '<p>Could not load your current availability.</p>');
            return;
        }

        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let hoursHTML = daysOfWeek.map((day, index) => {
            const hours = currentHours.find(h => h.day_of_week == index);
            const isWeekend = index === 0 || index === 6;
            return `
                <div class="day-availability-row ${isWeekend ? 'disabled' : ''}">
                    <label class="day-label">${day}</label>
                    <input type="checkbox" class="is-working-checkbox" data-day="${index}" ${hours && hours.is_available ? 'checked' : ''} ${isWeekend ? 'disabled' : ''}>
                    <label>Start:</label>
                    <input type="time" class="start-time-input" data-day="${index}" value="${hours ? hours.start_time : '09:00'}" step="1800" ${isWeekend ? 'disabled' : ''}>
                    <label>End:</label>
                    <input type="time" class="end-time-input" data-day="${index}" value="${hours ? hours.end_time : '17:00'}" step="1800" ${isWeekend ? 'disabled' : ''}>
                </div>
            `;
        }).join('');

        const modalContent = `
            <form id="set-availability-form">
                <div class="availability-grid">${hoursHTML}</div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Save Availability</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;

        this.showModal('Set Weekly Availability', modalContent);

        document.getElementById('set-availability-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAvailability();
        });
    },

    async submitAvailability() {
        const availabilityData = [];
        const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // Sunday - Saturday

        daysOfWeek.forEach(dayIndex => {
            const isWorking = document.querySelector(`.is-working-checkbox[data-day="${dayIndex}"]`).checked;
            const startTime = document.querySelector(`.start-time-input[data-day="${dayIndex}"]`).value;
            const endTime = document.querySelector(`.end-time-input[data-day="${dayIndex}"]`).value;

            // Only include days that are marked as working
            if (isWorking) {
                availabilityData.push({
                    day_of_week: dayIndex,
                    start_time: startTime,
                    end_time: endTime,
                    is_working: isWorking
                });
            }
        });

        try {
            // First, clear existing working hours for this tutor
            const { error: deleteError } = await this.supabase
                .from('working_hours')
                .delete()
                .eq('tutor_id', this.currentUser.user_id);

            if (deleteError) throw deleteError;

            // Then insert the new working hours (only checked days)
            if (availabilityData.length > 0) {
                const { error: insertError } = await this.supabase.rpc('set_working_hours', { 
                    tutor_id_in: this.currentUser.user_id,
                    hours_in: availabilityData
                });

                if (insertError) throw insertError;
            }

            this.closeModal();
            this.showModal('Success', '<p>Your availability has been updated successfully.</p>');
            this.loadMyAvailabilityView(); // Refresh the view

        } catch (err) {
            console.error('Error saving availability:', err);
            this.showModal('Error', '<p>Could not save your availability. Please try again.</p>');
        }
    },
    
    // ... other view functions like loadMyAppointmentsView, loadFindTutorView, etc. need to be fully implemented here
    async loadMyAppointmentsView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>My Appointments</h2><div id="appointments-container">Loading...</div>';

        if (!this.currentUser || !this.currentUser.auth_uuid) {
            contentEl.innerHTML = '<p class="error">Failed to load appointments: User authentication data is missing.</p>';
            return;
        }

        const isStudent = this.currentUser.role === 'Student';

        try {
            if (typeof this.currentUser.auth_uuid !== 'string' || this.currentUser.auth_uuid.length < 36) {
                throw new Error(`Invalid user_uuid: ${this.currentUser.auth_uuid}`);
            }

            const { data: appointments, error: appointmentsError } = await this.supabase
                .rpc('get_appointments_for_user', { user_uuid: this.currentUser.auth_uuid });

            if (appointmentsError) {
                throw appointmentsError;
            }
            
            if (!appointments || appointments.length === 0) {
                contentEl.innerHTML = `<h2>My Appointments</h2><p>You have no upcoming or past appointments.</p>`;
                return;
            }

            // Get IDs of completed appointments to check for existing reviews
            const completedAppointmentIds = appointments
                .filter(a => a.status === 'Completed')
                .map(a => a.appointment_id);

            let existingReviews = new Set();
            if (isStudent && completedAppointmentIds.length > 0) {
                const { data: reviews, error: reviewsError } = await this.supabase
                    .from('reviews')
                    .select('appointment_id')
                    .in('appointment_id', completedAppointmentIds);
                
                if (reviewsError) {
                    // Non-critical error, so we don't throw, just log it.
                } else {
                    existingReviews = new Set(reviews.map(r => r.appointment_id));
                }
            }

            let appointmentsHTML = appointments.map(appt => {
                const opponent = isStudent ? `${appt.tutor_first_name} ${appt.tutor_last_name}` : `${appt.student_first_name} ${appt.student_last_name}`;
                let reviewButton = '';
                let actionButtons = '';

                if (isStudent && appt.status === 'Completed' && !existingReviews.has(appt.appointment_id)) {
                    reviewButton = `<button class="btn btn-sm btn-primary write-review-btn" data-appointment-id="${appt.appointment_id}">Write Review</button>`;
                }

                // Add tutor action buttons for scheduled and cancelled appointments
                if (!isStudent && (appt.status === 'Scheduled' || appt.status === 'Cancelled')) {
                    actionButtons = `
                        <button class="btn btn-sm btn-warning reschedule-btn" data-appointment-id="${appt.appointment_id}">Reschedule</button>
                        <button class="btn btn-sm btn-danger cancel-btn" data-appointment-id="${appt.appointment_id}">Cancel</button>
                    `;
                }

                return `<tr><td>${new Date(appt.start_time).toLocaleString()}</td><td>${opponent}</td><td><span class="status-${appt.status.toLowerCase()}">${appt.status}</span></td><td>${reviewButton}${actionButtons}</td></tr>`;
            }).join('');

            const opponentRole = isStudent ? 'Tutor' : 'Student';
            contentEl.innerHTML = `<h2>My Appointments</h2><div class="table-responsive"><table class="user-table"><thead><tr><th>Date & Time</th><th>${opponentRole}</th><th>Status</th><th>Actions</th></tr></thead><tbody>${appointmentsHTML}</tbody></table></div>`;

            // Add event listeners for tutor action buttons
            if (!isStudent) {
                document.querySelectorAll('.cancel-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const appointmentId = e.target.dataset.appointmentId;
                        this.cancelAppointment(appointmentId);
                    });
                });

                document.querySelectorAll('.reschedule-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const appointmentId = e.target.dataset.appointmentId;
                        this.rescheduleAppointment(appointmentId);
                    });
                });
            }

        } catch (err) {
            console.error('Error loading appointments:', err);
            contentEl.innerHTML = '<p class="error">Failed to load appointments.</p>';
        }
    },

    async loadScheduleAndAvailabilityView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = `
            <h2>My Appointments</h2>
            <div id="appointments-table-container"></div>
            <hr>
            <h2>My Availability</h2>
            <div class="calendar-controls">
                <button id="set-availability-btn" class="btn btn-primary">Set My Weekly Hours</button>
                <button id="request-time-off-btn" class="btn btn-secondary">Request Time Off</button>
            </div>
            <div id="tutor-calendar-container"></div>
            <div id="time-off-requests-container"></div>
        `;

        // Load appointments table
        await this.loadMyAppointmentsTable('#appointments-table-container');

        // Load calendar
        const calendarContainer = document.getElementById('tutor-calendar-container');
        window.Calendar.init(this.currentUser, this.currentUser.user_id, this.supabase, 'week', calendarContainer);

        // Add event listeners
        document.getElementById('set-availability-btn').addEventListener('click', () => this.showSetAvailabilityModal());
        document.getElementById('request-time-off-btn').addEventListener('click', () => this.showTimeOffRequestModal());

        // Load time off requests
        this.loadTimeOffRequests();
    },

    async loadFindTutorView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Find a Tutor</h2><div id="tutor-list-container">Loading...</div>';

        try {
            const { data, error } = await this.supabase.rpc('get_tutor_page_data');

            if (error) throw error;

            const { tutors, specializations, reviews } = data;

            if (!tutors || tutors.length === 0) {
                contentEl.innerHTML = '<h2>Find a Tutor</h2><p>No tutors are available at this time.</p>';
                return;
            }

            const reviewStats = reviews.reduce((acc, review) => {
                if (!acc[review.tutor_id]) {
                    acc[review.tutor_id] = { total_rating: 0, count: 0 };
                }
                acc[review.tutor_id].total_rating += review.rating;
                acc[review.tutor_id].count++;
                return acc;
            }, {});

            const tutorSpecializations = specializations.reduce((acc, spec) => {
                if (!acc[spec.tutor_id]) {
                    acc[spec.tutor_id] = [];
                }
                acc[spec.tutor_id].push(spec.course_name);
                return acc;
            }, {});

            const tutorsHtml = tutors.map(tutor => {
                const specs = tutorSpecializations[tutor.user_id] || [];
                const stats = reviewStats[tutor.user_id] || { total_rating: 0, count: 0 };
                const avgRating = stats.count > 0 ? (stats.total_rating / stats.count).toFixed(1) : 'N/A';
                const stars = stats.count > 0 ? '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating)) : 'No reviews yet';
                const viewReviewsButton = stats.count > 0 ? `<button class="btn btn-sm btn-secondary view-reviews-btn" data-tutor-id="${tutor.user_id}">View Reviews</button>` : '';

                return `
                    <div class="tutor-card">
                        <div class="tutor-card-header">
                            <h3>${tutor.first_name} ${tutor.last_name}</h3>
                            <span class="tutor-category">${tutor.category}</span>
                        </div>
                        <div class="tutor-card-body">
                            <h4>Specializations:</h4>
                            <ul class="specializations-list">
                                ${specs.length > 0 ? specs.map(s => `<li>${s}</li>`).join('') : '<li>No specializations listed.</li>'}
                            </ul>
                        </div>
                        <div class="tutor-card-footer">
                             <div class="tutor-review-summary">
                                <span class="star-rating">${stars}</span>
                                <span>${avgRating} (${stats.count} reviews)</span>
                            </div>
                            <button class="btn btn-sm btn-primary schedule-btn" data-tutor-id="${tutor.user_id}" data-tutor-name="${tutor.first_name} ${tutor.last_name}">Schedule</button>
                            ${viewReviewsButton}
                        </div>
                    </div>
                `;
            }).join('');

            document.getElementById('tutor-list-container').innerHTML = tutorsHtml;

            // Add event listeners for schedule buttons
            document.getElementById('tutor-list-container').addEventListener('click', (e) => {
                if (e.target.classList.contains('schedule-btn')) {
                    const tutorId = e.target.dataset.tutorId;
                    const tutorName = e.target.dataset.tutorName;
                    this.showScheduleModal(tutorId, tutorName);
                }
            });

        } catch (err) {
            console.error('Error loading tutors:', err);
            contentEl.innerHTML = '<h2>Find a Tutor</h2><p class="error">Could not load available tutors.</p>';
        }
    },

    async cancelAppointment(appointmentId) {
        this.showConfirmationModal('Cancel Appointment', 'Are you sure you want to cancel this appointment?', async () => {
            try {
                const { data: result, error } = await this.supabase
                    .rpc('cancel_appointment', {
                        appointment_id_in: appointmentId,
                        tutor_id_in: this.currentUser.user_id
                    });

                if (error) throw error;

                if (result && result.success) {
                    this.showModal('Success', `<p>${result.error_message}</p>`);
                    // Refresh the appointments view
                    this.loadMyAppointmentsView();
                } else {
                    this.showModal('Error', `<p>${result.error_message || 'Failed to cancel appointment.'}</p>`);
                }

            } catch (err) {
                console.error('Error cancelling appointment:', err);
                this.showModal('Error', '<p>An error occurred while cancelling the appointment.</p>');
            }
        });
    },

    async rescheduleAppointment(appointmentId) {
        // First, get the appointment details
        try {
            const { data: appointments, error } = await this.supabase
                .rpc('get_appointments_for_user', { user_uuid: this.currentUser.auth_uuid });

            if (error) throw error;

            const appointment = appointments.find(a => a.appointment_id == appointmentId);
            if (!appointment) {
                this.showModal('Error', '<p>Appointment not found.</p>');
                return;
            }

            // Show reschedule modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Reschedule Appointment</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Current appointment: ${new Date(appointment.start_time).toLocaleString()} - ${new Date(appointment.end_time).toLocaleString()}</p>
                        <form id="reschedule-form">
                            <div class="form-group">
                                <label for="new-date">New Date:</label>
                                <input type="date" id="new-date" required min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label for="new-time">New Start Time:</label>
                                <select id="new-time" required>
                                    <option value="">Select a time slot</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="new-duration">New Duration (minutes):</label>
                                <select id="new-duration" required>
                                    <option value="30">30 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="90">1.5 hours</option>
                                    <option value="120">2 hours</option>
                                </select>
                            </div>
                            <div id="reschedule-slots-info"></div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-reschedule">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirm-reschedule">Reschedule</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';

            // Close modal handlers
            const closeModal = () => {
                document.body.removeChild(modal);
            };

            modal.querySelector('.modal-close').addEventListener('click', closeModal);
            modal.querySelector('#cancel-reschedule').addEventListener('click', closeModal);

            // Load available time slots when date changes
            const dateInput = modal.querySelector('#new-date');
            const timeSelect = modal.querySelector('#new-time');
            const slotsInfo = modal.querySelector('#reschedule-slots-info');

            dateInput.addEventListener('change', async () => {
                if (!dateInput.value) return;
                
                try {
                    timeSelect.innerHTML = '<option value="">Loading available slots...</option>';
                    
                    // Get available slots for the selected date
                    const { data: slots, error } = await this.supabase
                        .rpc('get_available_slots', { 
                            tutor_id_in: appointment.tutor_id, 
                            date_in: dateInput.value 
                        });

                    if (error) throw error;

                    timeSelect.innerHTML = '<option value="">Select a time slot</option>';
                    
                    if (!slots || slots.length === 0) {
                        slotsInfo.innerHTML = '<p class="error">No available time slots for this date.</p>';
                        return;
                    }

                    // Generate 30-minute time slots within available hours
                    slots.forEach(slot => {
                        const startTime = new Date(slot.slot_start);
                        const endTime = new Date(slot.slot_end);
                        
                        // Generate slots every 30 minutes
                        for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
                            const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const value = time.toISOString();
                            
                            const option = document.createElement('option');
                            option.value = value;
                            option.textContent = timeString;
                            timeSelect.appendChild(option);
                        }
                    });

                    slotsInfo.innerHTML = '<p class="info">Select a time slot from the dropdown above.</p>';

                } catch (err) {
                    console.error('Error loading time slots:', err);
                    slotsInfo.innerHTML = '<p class="error">Could not load available time slots.</p>';
                    timeSelect.innerHTML = '<option value="">Error loading slots</option>';
                }
            });

            // Handle reschedule confirmation
            modal.querySelector('#confirm-reschedule').addEventListener('click', async () => {
                const date = dateInput.value;
                const startTime = timeSelect.value;
                const duration = modal.querySelector('#new-duration').value;

                if (!date || !startTime || !duration) {
                    slotsInfo.innerHTML = '<p class="error">Please fill in all fields.</p>';
                    return;
                }

                try {
                    // Reschedule the appointment
                    const { data: result, error } = await this.supabase
                        .rpc('reschedule_appointment', {
                            appointment_id_in: appointmentId,
                            tutor_id_in: this.currentUser.user_id,
                            new_start_time: startTime,
                            new_duration_minutes: parseInt(duration)
                        });

                    if (error) throw error;

                    if (result && result.success) {
                        this.showModal('Success', `<p>${result.error_message}</p>`);
                        closeModal();
                        // Refresh the appointments view
                        this.loadMyAppointmentsView();
                    } else {
                        slotsInfo.innerHTML = `<p class="error">${result.error_message || 'Failed to reschedule appointment.'}</p>`;
                    }

                } catch (err) {
                    console.error('Error rescheduling appointment:', err);
                    slotsInfo.innerHTML = '<p class="error">An error occurred while rescheduling the appointment.</p>';
                }
            });

        } catch (err) {
            console.error('Error loading appointment for reschedule:', err);
            this.showModal('Error', '<p>Could not load appointment details.</p>');
        }
    },

    async showScheduleModal(tutorId, tutorName) {
        // Remove any existing modals first
        const existingModal = document.querySelector('.modal-backdrop');
        if (existingModal) {
            existingModal.remove();
        }

        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Schedule Appointment with ${tutorName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="schedule-form">
                        <div class="form-group">
                            <label for="appointment-date">Date:</label>
                            <input type="date" id="appointment-date" required min="${new Date().toISOString().split('T')[0]}">
                            <small class="form-text text-muted">Weekends are not available for scheduling.</small>
                        </div>
                        <div class="form-group">
                            <label for="appointment-time">Start Time:</label>
                            <input type="hidden" id="appointment-time" required>
                            <div id="time-slots-container"></div>
                        </div>
                        <div class="form-group">
                            <label for="appointment-duration">Duration (minutes):</label>
                            <select id="appointment-duration" required>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="90">1.5 hours</option>
                                <option value="120">2 hours</option>
                            </select>
                        </div>
                        <div id="available-slots-info"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-schedule">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirm-schedule">Schedule Appointment</button>
                </div>
            </div>
        `;

        modalContainer.appendChild(modal);
        document.body.appendChild(modalContainer);

        // Close modal handlers
        const closeModal = () => {
            document.body.removeChild(modalContainer);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-schedule').addEventListener('click', closeModal);

        // Load available time slots when date changes
        const dateInput = modal.querySelector('#appointment-date');
        const timeSelect = modal.querySelector('#appointment-time');
        const slotsInfo = modal.querySelector('#available-slots-info');
        const timeSlotsContainer = modal.querySelector('#time-slots-container');

        // Set initial date to next available weekday if today is weekend
        const today = new Date();
        let initialDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        if (initialDate.getUTCDay() === 0) { // Sunday
            initialDate.setUTCDate(initialDate.getUTCDate() + 1); // Monday
        } else if (initialDate.getUTCDay() === 6) { // Saturday
            initialDate.setUTCDate(initialDate.getUTCDate() + 2); // Monday
        }
        dateInput.value = initialDate.toISOString().split('T')[0];

        // Load schedule for initial date
        if (initialDate.getUTCDay() !== 0 && initialDate.getUTCDay() !== 6) {
            setTimeout(() => {
                dateInput.dispatchEvent(new Event('change'));
            }, 100); // Small delay to ensure DOM is ready
        }

        // Handle date changes - combine weekend filtering and schedule loading
        dateInput.addEventListener('change', async () => {
            if (!dateInput.value) return;
            
            const selectedDate = new Date(dateInput.value + 'T00:00:00Z');
            const dayOfWeek = selectedDate.getUTCDay();
            
            // Prevent weekend selection (0 = Sunday, 6 = Saturday)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                slotsInfo.innerHTML = '<p class="error">Weekends are not available for scheduling. Please select a weekday.</p>';
                timeSlotsContainer.innerHTML = '';
                timeSelect.value = '';
                modal.querySelector('#confirm-schedule').disabled = true;
                return;
            } else {
                modal.querySelector('#confirm-schedule').disabled = false;
            }
            
            try {
                slotsInfo.innerHTML = '<p>Loading schedule...</p>';

                const [workingHoursRes, appointmentsRes, systemEventsRes] = await Promise.all([
                    this.supabase.rpc('get_working_hours_for_tutor', { tutor_id_in: tutorId }),
                    this.supabase.rpc('get_appointments_for_calendar', { 
                        start_date: selectedDate.toISOString(), 
                        end_date: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
                    }),
                    this.supabase.rpc('get_events_for_month', { p_year: selectedDate.getFullYear(), p_month: selectedDate.getMonth() + 1 })
                ]);

                const workingHours = workingHoursRes.data.find(wh => wh.day_of_week === dayOfWeek);
                const appointments = appointmentsRes.data;
                const systemEvents = systemEventsRes.data;

                // Check for system events on this day
                const hasSystemEvent = systemEvents.some(event => {
                    const eventStart = new Date(event.start_date + 'T00:00:00Z');
                    const eventEnd = new Date(event.end_date + 'T23:59:59Z');
                    return selectedDate >= eventStart && selectedDate <= eventEnd;
                });

                if (hasSystemEvent) {
                    const eventName = systemEvents.find(event => {
                        const eventStart = new Date(event.start_date + 'T00:00:00Z');
                        const eventEnd = new Date(event.end_date + 'T23:59:59Z');
                        return selectedDate >= eventStart && selectedDate <= eventEnd;
                    })?.name || 'System Event';
                    slotsInfo.innerHTML = `<p class="error">This day is unavailable due to: ${eventName}</p>`;
                    timeSlotsContainer.innerHTML = '';
                } else if (!workingHours || !workingHours.is_working) {
                    slotsInfo.innerHTML = '<p>This tutor is not available on this day.</p>';
                    timeSlotsContainer.innerHTML = '';
                } else {
                    const startTime = new Date('1970-01-01T' + workingHours.start_time + 'Z');
                    const endTime = new Date('1970-01-01T' + workingHours.end_time + 'Z');

                    let scheduleHtml = '<div class="daily-schedule-grid">';

                    for (let time = new Date(startTime); time < endTime; time.setUTCMinutes(time.getUTCMinutes() + 30)) {
                        const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const slotTime = new Date(selectedDate);
                        slotTime.setUTCHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0);

                        let slotClass = 'available';
                        let slotText = 'Available';

                        // Check for conflicting appointments
                        const conflictingAppointment = appointments.find(appt => {
                            const apptStart = new Date(appt.start_time + 'Z');
                            const apptEnd = new Date(appt.end_time + 'Z');
                            return slotTime >= apptStart && slotTime < apptEnd;
                        });

                        if (conflictingAppointment) {
                            slotClass = 'booked';
                            slotText = 'Booked';
                        }

                        // Check for system events
                        const conflictingEvent = systemEvents.find(event => {
                            const eventStart = new Date(event.start_date + 'T00:00:00Z');
                            const eventEnd = new Date(event.end_date + 'T23:59:59Z');
                            return slotTime >= eventStart && slotTime <= eventEnd;
                        });

                        if (conflictingEvent) {
                            slotClass = 'unavailable';
                            slotText = `Unavailable (${conflictingEvent.name})`;
                        }

                        scheduleHtml += `
                            <div class="time-slot-option ${slotClass}" data-time="${slotTime.toISOString()}">
                                <span>${timeString}</span>
                                <span>${slotText}</span>
                            </div>
                        `;
                    }

                    scheduleHtml += '</div>';
                    slotsInfo.innerHTML = '<p>Select a time slot:</p>';
                    timeSlotsContainer.innerHTML = scheduleHtml;

                    // Add event listeners to the new time slot options
                    timeSlotsContainer.querySelectorAll('.time-slot-option.available').forEach(option => {
                        option.addEventListener('click', () => {
                            // Remove active class from any previously selected option
                            timeSlotsContainer.querySelectorAll('.time-slot-option.active').forEach(active => active.classList.remove('active'));
                            // Add active class to the clicked option
                            option.classList.add('active');
                            // Set the value of the hidden time select
                            timeSelect.value = option.dataset.time;
                        });
                    });
                }
            } catch (err) {
                console.error('Error loading schedule:', err);
                slotsInfo.innerHTML = '<p class="error">Could not load the tutor\'s schedule.</p>';
            }
        });

        // Handle schedule confirmation
        modal.querySelector('#confirm-schedule').addEventListener('click', async () => {
            const date = dateInput.value;
            const startTime = timeSelect.value;
            const duration = modal.querySelector('#appointment-duration').value;

            if (!date || !startTime || !duration) {
                slotsInfo.innerHTML = '<p class="error">Please fill in all fields.</p>';
                return;
            }

            try {
                // Book the appointment
                const { data: result, error } = await this.supabase
                    .rpc('book_appointment', {
                        student_id_in: this.currentUser.user_id,
                        tutor_id_in: tutorId,
                        start_time_in: startTime,
                        duration_minutes_in: parseInt(duration)
                    });

                if (error) throw error;

                if (result && result.success) {
                    this.showModal('Success', `<p>Appointment scheduled successfully! Appointment ID: ${result.appointment_id}</p>`);
                    closeModal();
                    // Refresh the appointments view if it's currently open
                    if (window.location.hash === '#my-appointments') {
                        this.loadMyAppointmentsView();
                    }
                } else {
                    slotsInfo.innerHTML = `<p class="error">${result.error_message || 'Failed to schedule appointment.'}</p>`;
                }

            } catch (err) {
                console.error('Error scheduling appointment:', err);
                slotsInfo.innerHTML = '<p class="error">An error occurred while scheduling the appointment.</p>';
            }
        });
    },

    async loadCalendarManagementView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = `
            <h2>Calendar Management</h2>
            <p>View all scheduled appointments, tutor availability, and system-wide events.</p>
            <div class="view-header">
                <button id="add-system-event-btn" class="btn btn-primary">Add Holiday/Event</button>
            </div>
            <div id="system-events-container"></div>
        `;
        this.loadSystemEvents();
        document.getElementById('add-system-event-btn').addEventListener('click', () => this.showAddSystemEventModal());
    },

    async loadSystemEvents() {
        const container = document.getElementById('system-events-container');
        container.innerHTML = '<h3>System Events</h3><div id="system-events-list">Loading...</div>';

        const { data, error } = await this.supabase.from('system_events').select('*').order('start_date', { ascending: false });

        if (error) {
            console.error('Error loading system events:', error);
            document.getElementById('system-events-list').innerHTML = '<p class="error">Could not load system events.</p>';
            return;
        }

        if (data.length === 0) {
            document.getElementById('system-events-list').innerHTML = '<p>There are no system events scheduled.</p>';
            return;
        }

        const eventsHtml = data.map(event => {
            const startDate = new Date(event.start_date + 'T00:00:00Z');
            const endDate = new Date(event.end_date + 'T00:00:00Z');
            const dateString = startDate.toLocaleDateString() === endDate.toLocaleDateString() 
                ? startDate.toLocaleDateString() 
                : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

            let removeButton = '';
            if (this.currentUser.role === 'Super Admin' || (this.currentUser.role === 'Admin' && this.currentUser.category === event.category)) {
                removeButton = `<button class="btn btn-sm btn-danger remove-system-event-btn" data-event-id="${event.event_id}">Remove</button>`;
            }

            return `
            <div class="system-event-card">
                <p><strong>${event.name}</strong> (${event.event_type}) - ${dateString}</p>
                <p><em>Category: ${event.category || 'Global'}</em></p>
                ${removeButton}
            </div>
        `}).join('');

        document.getElementById('system-events-list').innerHTML = eventsHtml;
    },

    showAddSystemEventModal() {
        const modalContent = `
            <form id="add-system-event-form">
                <div class="form-group">
                    <label for="event-name">Event Name</label>
                    <input type="text" id="event-name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="start-date">Start Date</label>
                    <input type="date" id="start-date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="end-date">End Date</label>
                    <input type="date" id="end-date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="event-type">Event Type</label>
                    <select id="event-type" class="form-control" required>
                        <option value="Holiday">Holiday</option>
                        <option value="Closure">School Closure</option>
                        <option value="Event">Special Event</option>
                    </select>
                </div>
                <div class="form-group form-check">
                    <input type="checkbox" id="is-recurring" class="form-check-input">
                    <label class="form-check-label" for="is-recurring">Recurring Holiday (applies every year)</label>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary">Add Event</button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                </div>
            </form>
        `;
        this.showModal('Add System Event', modalContent);

        document.getElementById('add-system-event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSystemEvent();
        });
    },

    async addSystemEvent() {
        const eventName = document.getElementById('event-name').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const eventType = document.getElementById('event-type').value;
        const isRecurring = document.getElementById('is-recurring').checked;

        if (!eventName || !startDate || !endDate || !eventType) {
            this.showModal('Error', '<p>Please fill in all fields.</p>');
            return;
        }

        const { error } = await this.supabase.rpc('create_system_event_and_cancel_appointments', {
            p_event_name: eventName,
            p_start_date: startDate,
            p_end_date: endDate,
            p_event_type: eventType,
            p_is_recurring: isRecurring
        });

        if (error) {
            console.error('Error creating system event:', error);
            this.showModal('Error', '<p>Could not create the system event. Please try again.</p>');
            return;
        }

        this.closeModal();
        this.showModal('Success', '<p>The system event has been added, and any conflicting appointments have been cancelled.</p>');
        this.loadSystemEvents();
    },

    async removeSystemEvent(eventId) {
        if (!confirm('Are you sure you want to remove this system event? This action cannot be undone.')) {
            return;
        }

        const { error } = await this.supabase.from('system_events').delete().eq('event_id', eventId);

        if (error) {
            console.error('Error removing system event:', error);
            this.showModal('Error', '<p>Could not remove the system event. Please try again.</p>');
            return;
        }

        this.showModal('Success', '<p>The system event has been removed.</p>');
        this.loadSystemEvents();
    },

    async loadTimeOffOverrideView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Time-Off Override</h2><div id="time-off-requests-container">Loading...</div>';

        try {
            const { data: requests, error } = await this.supabase
                .from('time_off_requests')
                .select('*, tutor:users!fk_tutor(first_name, last_name), reviewed_by:users!fk_reviewed_by(first_name, last_name)')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!requests || requests.length === 0) {
                contentEl.innerHTML = '<h2>Time-Off Override</h2><p>There are no pending time-off requests.</p>';
                return;
            }

            const requestsHtml = `
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Tutor</th>
                            <th>Dates Requested</th>
                            <th>Reason</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Reviewed By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(req => `
                            <tr>
                                <td>${req.tutor.first_name} ${req.tutor.last_name}</td>
                                <td>${new Date(req.start_date).toLocaleDateString()} - ${new Date(req.end_date).toLocaleDateString()}</td>
                                <td>${req.reason || 'N/A'}</td>
                                <td>${new Date(req.created_at).toLocaleString()}</td>
                                <td><span class="status-${req.status.toLowerCase()}">${req.status}</span></td>
                                <td>${req.reviewed_by ? `${req.reviewed_by.first_name} ${req.reviewed_by.last_name}` : 'N/A'}</td>
                                <td>${this.getTimeOffActions(req)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            document.getElementById('time-off-requests-container').innerHTML = requestsHtml;

        } catch (err) {
            console.error('Error loading time-off requests:', err);
            contentEl.innerHTML = '<h2>Time-Off Override</h2><p class="error">Could not load time-off requests.</p>';
        }
    },

    async loadReviewDeletionRequestsView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Review Deletion Requests</h2><div id="requests-container">Loading...</div>';

        try {
            const { data: requests, error } = await this.supabase.rpc('get_review_deletion_requests');

            if (error) throw error;

            if (!requests || requests.length === 0) {
                contentEl.innerHTML = '<h2>Review Deletion Requests</h2><p>There are no pending review deletion requests.</p>';
                return;
            }

            const requestsHtml = `
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Tutor</th>
                            <th>Review Comment</th>
                            <th>Requested At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(req => `
                            <tr>
                                <td>${req.student_name}</td>
                                <td>${req.tutor_name}</td>
                                <td class="review-comment-cell">${req.review_comment}</td>
                                <td>${new Date(req.requested_at).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary approve-deletion-btn" data-request-id="${req.request_id}" data-review-id="${req.review_id}">Approve Deletion</button>
                                    <button class="btn btn-sm btn-danger deny-deletion-btn" data-request-id="${req.request_id}">Deny Request</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            document.getElementById('requests-container').innerHTML = requestsHtml;

        } catch (err) {
            console.error('Error loading review deletion requests:', err);
            contentEl.innerHTML = '<h2>Review Deletion Requests</h2><p class="error">Could not load requests.</p>';
        }
    },

    async loadMyReviewsView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>My Reviews</h2><div id="reviews-container">Loading...</div>';

        try {
            const { data: reviews, error } = await this.supabase
                .rpc('get_reviews_for_user', { user_uuid: this.currentUser.auth_uuid });

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                contentEl.innerHTML = '<h2>My Reviews</h2><p>You have not written any reviews yet.</p>';
                return;
            }

            const reviewsHTML = reviews.map(review => {
                const isStudent = review.student_id === this.currentUser.user_id;
                const opponent = isStudent ? 
                    `${review.tutor_first_name} ${review.tutor_last_name}` : 
                    `${review.student_first_name} ${review.student_last_name}`;
                const role = isStudent ? 'Tutor' : 'Student';
                
                let actions = '';
                if (isStudent) {
                    actions = `
                        <button class="btn btn-sm btn-secondary edit-review-btn" 
                            data-review-id="${review.review_id}" 
                            data-appointment-id="${review.appointment_id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-review-btn" 
                            data-review-id="${review.review_id}">Delete</button>
                    `;
                } else { // Tutor view
                    actions = `
                        <button class="btn btn-sm btn-danger request-deletion-btn" 
                            data-review-id="${review.review_id}">Request Deletion</button>
                    `;
                }

                return `
                    <div class="review-card">
                        <div class="review-header">
                            <h4>Review for ${role}: ${opponent}</h4>
                            <div class="review-rating">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</div>
                        </div>
                        <div class="review-body">
                            <p>${review.comment}</p>
                            <small class="review-date">${new Date(review.created_at).toLocaleDateString()}</small>
                        </div>
                        ${review.tutor_response ? `
                        <div class="tutor-response">
                            <h5>Tutor Response:</h5>
                            <p>${review.tutor_response}</p>
                            <small>${new Date(review.response_created_at).toLocaleDateString()}</small>
                        </div>
                        ` : ''}
                        <div class="review-actions">
                            ${actions}
                        </div>
                    </div>
                `;
            }).join('');

            contentEl.innerHTML = `<h2>My Reviews</h2><div class="reviews-container">${reviewsHTML}</div>`;

        } catch (err) {
            console.error('Error loading reviews:', err);
            contentEl.innerHTML = '<h2>My Reviews</h2><p class="error">Failed to load reviews.</p>';
        }
    },

    async loadReviewManagementView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = `
            <h2>Review Management</h2>
            <div class="review-stats">
                <div class="stat-card">
                    <h3>Total Reviews</h3>
                    <p id="total-reviews">Loading...</p>
                </div>
                <div class="stat-card">
                    <h3>Average Rating</h3>
                    <p id="avg-rating">Loading...</p>
                </div>
            </div>
            <div id="reviews-list-container">
                <h3>All Reviews</h3>
                <div id="reviews-list">Loading...</div>
            </div>
        `;

        try {
            // Get review statistics
            const { data: stats, error: statsError } = await this.supabase
                .rpc('get_tutor_review_counts');

            if (statsError) throw statsError;

            const totalReviews = stats.reduce((sum, stat) => sum + parseInt(stat.review_count), 0);
            const totalRating = stats.reduce((sum, stat) => sum + parseInt(stat.rating_sum || 0), 0);
            const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 'N/A';

            document.getElementById('total-reviews').textContent = totalReviews;
            document.getElementById('avg-rating').textContent = avgRating;

            // Get all reviews
            const { data: reviews, error: reviewsError } = await this.supabase
                .from('reviews')
                .select(`
                    *,
                    student:users!student_id(first_name, last_name),
                    tutor:users!tutor_id(first_name, last_name)
                `)
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;

            if (!reviews || reviews.length === 0) {
                document.getElementById('reviews-list').innerHTML = '<p>No reviews found.</p>';
                return;
            }

            const reviewsHTML = reviews.map(review => `
                <div class="review-card admin-review-card">
                    <div class="review-header">
                        <h4>${review.student.first_name} ${review.student.last_name} → ${review.tutor.first_name} ${review.tutor.last_name}</h4>
                        <div class="review-rating">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</div>
                    </div>
                    <div class="review-body">
                        <p>${review.comment}</p>
                        <small class="review-date">${new Date(review.created_at).toLocaleDateString()}</small>
                    </div>
                    ${review.tutor_response ? `
                    <div class="tutor-response">
                        <h5>Tutor Response:</h5>
                        <p>${review.tutor_response}</p>
                        <small>${new Date(review.response_created_at).toLocaleDateString()}</small>
                    </div>
                    ` : ''}
                    <div class="review-actions">
                        <button class="btn btn-sm btn-danger delete-review-btn" data-review-id="${review.review_id}">Delete Review</button>
                    </div>
                </div>
            `).join('');

            document.getElementById('reviews-list').innerHTML = reviewsHTML;

        } catch (err) {
            console.error('Error loading review management:', err);
            contentEl.innerHTML = '<h2>Review Management</h2><p class="error">Failed to load review management data.</p>';
        }
    },

    async loadReviewDeletionRequestsView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>Review Deletion Requests</h2><div id="requests-container">Loading...</div>';

        try {
            const { data: requests, error } = await this.supabase.rpc('get_review_deletion_requests');

            if (error) throw error;

            if (!requests || requests.length === 0) {
                contentEl.innerHTML = '<h2>Review Deletion Requests</h2><p>There are no pending review deletion requests.</p>';
                return;
            }

            const requestsHtml = `
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Tutor</th>
                            <th>Review Comment</th>
                            <th>Reason for Deletion</th>
                            <th>Requested At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(req => `
                            <tr>
                                <td>${req.student_name}</td>
                                <td>${req.tutor_name}</td>
                                <td class="review-comment-cell">${req.review_comment}</td>
                                <td class="review-comment-cell">${req.reason}</td>
                                <td>${new Date(req.requested_at).toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary approve-deletion-btn" data-request-id="${req.request_id}" data-review-id="${req.review_id}">Approve</button>
                                    <button class="btn btn-sm btn-danger deny-deletion-btn" data-request-id="${req.request_id}">Deny</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            document.getElementById('requests-container').innerHTML = requestsHtml;

        } catch (err) {
            console.error('Error loading review deletion requests:', err);
            contentEl.innerHTML = '<h2>Review Deletion Requests</h2><p class="error">Could not load requests.</p>';
        }
    },

    async loadTutorReviewsView() {
        const contentEl = document.getElementById('dashboard-content');
        contentEl.innerHTML = '<h2>My Tutor Reviews</h2><div id="reviews-container">Loading...</div>';

        try {
            const { data: reviews, error } = await this.supabase
                .rpc('get_reviews_for_tutor', { tutor_id_in: this.currentUser.user_id });

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                contentEl.innerHTML = '<h2>My Tutor Reviews</h2><p>You have not received any reviews yet.</p>';
                return;
            }

            const reviewsHTML = reviews.map(review => {
                let updatedByStudentNotification = '';
                if (review.last_updated_by === 'Student') {
                    updatedByStudentNotification = '<span class="badge bg-warning text-dark">Edited by Student</span>';
                }

                return `
                <div class="review-card">
                    <div class="review-header">
                        <h4>Review from ${review.student_name} ${updatedByStudentNotification}</h4>
                        <div class="review-rating">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</div>
                    </div>
                    <div class="review-body">
                        <p>${review.comment}</p>
                        <small class="review-date">${new Date(review.created_at).toLocaleDateString()}</small>
                    </div>
                    ${review.tutor_response ? `
                        <div class="tutor-response">
                            <h5>Tutor Response:</h5>
                            <p>${review.tutor_response}</p>
                            <small>${new Date(review.response_created_at).toLocaleDateString()}</small>
                        </div>
                    ` : ''}
                    <div class="review-actions">
                        <button class="btn btn-sm btn-secondary respond-review-btn" 
                            data-review-id="${review.review_id}">${review.tutor_response ? 'Edit Response' : 'Respond to Review'}</button>
                        <button class="btn btn-sm btn-danger request-deletion-btn" 
                            data-review-id="${review.review_id}">Request Deletion</button>
                    </div>
                </div>
            `}).join('');

            contentEl.innerHTML = `<h2>My Tutor Reviews</h2><div class="reviews-container">${reviewsHTML}</div>`;

        } catch (err) {
            console.error('Error loading tutor reviews:', err);
            contentEl.innerHTML = '<h2>My Tutor Reviews</h2><p class="error">Failed to load reviews.</p>';
        }
    },

    // 6. HELPER & MODAL FUNCTIONS
    showModal(title, contentHTML) {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        modalContainer.innerHTML = `<div class="modal-backdrop"><div class="modal"><div class="modal-header"><h2>${title}</h2><button class="modal-close-btn" onclick="App.closeModal()">&times;</button></div><div class="modal-content">${contentHTML}</div></div></div>`;
    },

    showConfirmationModal(title, message, onConfirm) {
        const modalContent = `
            <p>${message}</p>
            <div class="modal-actions">
                <button id="confirm-yes-btn" class="btn btn-primary">Yes</button>
                <button id="confirm-no-btn" class="btn btn-secondary">No</button>
            </div>
        `;
        this.showModal(title, modalContent);

        document.getElementById('confirm-yes-btn').addEventListener('click', () => {
            onConfirm();
            this.closeModal();
        });

        document.getElementById('confirm-no-btn').addEventListener('click', () => {
            this.closeModal();
        });
    },

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = '';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Prevent app initialization on test pages
    if (!document.body.classList.contains('test-page')) {
        App.init();
    }
});
