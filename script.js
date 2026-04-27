document.addEventListener('DOMContentLoaded', () => {
    // --- Main Page Elements ---
    const homeLink = document.getElementById('home-link');
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const homeContent = document.getElementById('home-content');
    const loginContent = document.getElementById('login-content');
    const dashboardContent = document.getElementById('dashboard-content');
    const loginForm = document.getElementById('login-form');

    // --- Modal Elements (Removed - using integrated calendar instead) --

    // --- App State ---
    let currentUserRole = null;

    // --- Views ---
    const showView = (view) => {
        homeContent.classList.add('hidden');
        loginContent.classList.add('hidden');
        dashboardContent.classList.add('hidden');
        document.body.classList.remove('login-view');

        if (view === 'home') {
            homeContent.classList.remove('hidden');
        } else if (view === 'login') {
            loginContent.classList.remove('hidden');
            document.body.classList.add('login-view');
        } else if (view === 'dashboard') {
            dashboardContent.classList.remove('hidden');
        }
    };
    
    // Admin Tutor Management Functions
    let selectedTutorEmail = null;
    
    const renderTutorList = async () => {
        try {
            const response = await fetch('/api/admin/tutors', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch tutors');
            }
            
            const tutors = await response.json();
            const tutorGrid = document.getElementById('tutor-grid');
            if (!tutorGrid) return;
            
            const statusFilter = document.getElementById('tutor-status-filter')?.value || 'all';
            
            let filteredTutors = tutors;
            if (statusFilter !== 'all') {
                filteredTutors = tutors.filter(tutor => {
                    if (statusFilter === 'active') {
                        return tutor.workingHours && Object.values(tutor.workingHours.weeklySchedule).some(day => day.working);
                    } else if (statusFilter === 'inactive') {
                        return !tutor.workingHours || !Object.values(tutor.workingHours.weeklySchedule).some(day => day.working);
                    }
                    return true;
                });
            }
            
            tutorGrid.innerHTML = '';
            filteredTutors.forEach(tutor => {
                const tutorCard = document.createElement('div');
                tutorCard.className = 'tutor-card';
                tutorCard.innerHTML = `
                    <h4>${tutor.name}</h4>
                    <p>${tutor.email}</p>
                    <button class="view-tutor-btn" data-tutor-email="${tutor.email}">View Details</button>
                `;
                tutorGrid.appendChild(tutorCard);
            });
        } catch (error) {
            console.error('Error loading tutors:', error);
            alert('Error loading tutors. Please try again.');
        }
    };
    
    const showTutorDetails = async (tutorEmail) => {
        selectedTutorEmail = tutorEmail;
        const tutorList = document.querySelector('.tutor-list');
        const tutorDetails = document.getElementById('tutor-details');
        
        if (!tutorList || !tutorDetails) return;
        
        try {
            const response = await fetch('/api/admin/tutors', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch tutor details');
            }
            
            const tutors = await response.json();
            const tutor = tutors.find(t => t.email === tutorEmail);
            
            if (!tutor) {
                alert('Tutor not found');
                return;
            }
            
            document.getElementById('selected-tutor-name').textContent = tutor.name;
            document.getElementById('selected-tutor-email').textContent = tutor.email;
            
            const isActive = tutor.workingHours && Object.values(tutor.workingHours.weeklySchedule).some(day => day.working);
            document.getElementById('selected-tutor-status').textContent = isActive ? 'Active' : 'Inactive';
            
            // Render working hours requests (simplified - in real app would be separate requests)
            const workingHoursRequest = document.getElementById('working-hours-request');
            if (workingHoursRequest) {
                if (tutor.workingHours && tutor.workingHours.pendingChanges) {
                    workingHoursRequest.innerHTML = `
                        <p>Pending working hours changes:</p>
                        <ul>
                            ${Object.entries(tutor.workingHours.pendingChanges).map(([day, schedule]) => 
                                `<li>${day}: ${schedule.start} - ${schedule.end} (${schedule.working ? 'Working' : 'Off'})</li>`
                            ).join('')}
                        </ul>
                    `;
                    document.getElementById('approve-hours-btn').style.display = 'inline-block';
                    document.getElementById('reject-hours-btn').style.display = 'inline-block';
                } else {
                    workingHoursRequest.innerHTML = '<p>No pending working hours requests.</p>';
                    document.getElementById('approve-hours-btn').style.display = 'none';
                    document.getElementById('reject-hours-btn').style.display = 'none';
                }
            }
            
            // Render vacation requests
            const vacationRequests = document.getElementById('vacation-requests');
            if (vacationRequests) {
                const tutorVacationRequests = tutor.availability ? 
                    Object.entries(tutor.availability).filter(([date, data]) => data.status === 'vacation' && !data.approved) : [];
                
                if (tutorVacationRequests.length > 0) {
                    vacationRequests.innerHTML = `
                        <p>Pending vacation requests:</p>
                        <ul>
                            ${tutorVacationRequests.map(([date, data]) => 
                                `<li>${date}: ${data.reason || 'Vacation request'}</li>`
                            ).join('')}
                        </ul>
                    `;
                    document.getElementById('approve-vacation-btn').style.display = 'inline-block';
                    document.getElementById('reject-vacation-btn').style.display = 'inline-block';
                } else {
                    vacationRequests.innerHTML = '<p>No pending vacation requests.</p>';
                    document.getElementById('approve-vacation-btn').style.display = 'none';
                    document.getElementById('reject-vacation-btn').style.display = 'none';
                }
            }
            
            tutorList.style.display = 'none';
            tutorDetails.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading tutor details:', error);
            alert('Error loading tutor details. Please try again.');
        }
    };
    
    const handleTutorApproval = async (type, action) => {
        if (!selectedTutorEmail) return;
        
        try {
            if (type === 'hours') {
                const response = await fetch('/api/admin/approve-hours', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        tutorEmail: selectedTutorEmail,
                        action: action
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
                }
            } else if (type === 'vacation') {
                const response = await fetch('/api/admin/approve-vacation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({
                        tutorEmail: selectedTutorEmail,
                        action: action
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
                }
            }
            
            showTutorDetails(selectedTutorEmail);
            renderTutorList();
        } catch (error) {
            console.error('Error processing approval:', error);
            alert('Error processing approval. Please try again.');
        }
    };
    
    // Admin User Management Functions
    const renderUserManagement = async () => {
        try {
            console.log('Loading user management...');
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
            }
            
            const users = await response.json();
            console.log('Users loaded:', users);
            const userManagementSection = document.getElementById('manage-users');
            if (!userManagementSection) return;
            
            // Create user management UI
            userManagementSection.innerHTML = `
                <h2>User Management</h2>
                <div class="user-management-container">
                    <div class="user-filters">
                        <select id="user-role-filter">
                            <option value="all">All Roles</option>
                            <option value="Student">Students</option>
                            <option value="Tutor">Tutors</option>
                            <option value="Admin">Admins</option>
                        </select>
                        <select id="user-status-filter">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div class="user-grid" id="user-grid"></div>
                </div>
            `;
            
            const userGrid = document.getElementById('user-grid');
            if (!userGrid) return;
            
            // Filter and display users
            const roleFilter = document.getElementById('user-role-filter');
            const statusFilter = document.getElementById('user-status-filter');
            
            const filterUsers = () => {
                const roleValue = roleFilter?.value || 'all';
                const statusValue = statusFilter?.value || 'all';
                
                let filteredUsers = users;
                
                if (roleValue !== 'all') {
                    filteredUsers = filteredUsers.filter(user => user.role === roleValue);
                }
                
                if (statusValue !== 'all') {
                    filteredUsers = filteredUsers.filter(user => {
                        if (statusValue === 'active') return user.approval_status === 'Approved';
                        if (statusValue === 'pending') return user.approval_status === 'Pending';
                        if (statusValue === 'suspended') return user.approval_status === 'Suspended';
                        return true;
                    });
                }
                
                userGrid.innerHTML = '';
                filteredUsers.forEach(user => {
                    const userCard = document.createElement('div');
                    userCard.className = 'user-card';
                    userCard.innerHTML = `
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                        <p>Role: ${user.role}</p>
                        <p>Status: ${user.approval_status}</p>
                        <div class="user-actions">
                            <button class="edit-user-btn" data-user-email="${user.email}">Edit</button>
                            <button class="toggle-user-status-btn" data-user-email="${user.email}" data-current-status="${user.approval_status}">
                                ${user.approval_status === 'Approved' ? 'Suspend' : 'Approve'}
                            </button>
                        </div>
                    `;
                    userGrid.appendChild(userCard);
                });
                
                // Add event listeners for user actions
                document.querySelectorAll('.edit-user-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const userEmail = e.target.dataset.userEmail;
                        editUser(userEmail);
                    });
                });
                
                document.querySelectorAll('.toggle-user-status-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const userEmail = e.target.dataset.userEmail;
                        const currentStatus = e.target.dataset.currentStatus;
                        toggleUserStatus(userEmail, currentStatus);
                    });
                });
            };
            
            // Initial filter
            filterUsers();
            
            // Add filter event listeners
            roleFilter?.addEventListener('change', filterUsers);
            statusFilter?.addEventListener('change', filterUsers);
            
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Error loading users. Please try again.');
        }
    };
    
    const editUser = async (userEmail) => {
        // Placeholder for user edit functionality
        alert(`Edit user: ${userEmail}`);
    };
    
    const toggleUserStatus = async (userEmail, currentStatus) => {
        try {
            const newStatus = currentStatus === 'Approved' ? 'Suspended' : 'Approved';
            const response = await fetch('/api/admin/toggle-user-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    userEmail: userEmail,
                    newStatus: newStatus
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                renderUserManagement(); // Refresh the list
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Error toggling user status. Please try again.');
        }
    };
    
    // Admin Schedule Rules Functions
    const renderScheduleRules = () => {
        const scheduleRulesSection = document.getElementById('schedule-rules');
        if (!scheduleRulesSection) return;
        
        scheduleRulesSection.innerHTML = `
            <h2>Schedule Rules</h2>
            <div class="schedule-rules-container">
                <div class="rule-types">
                    <h3>Holiday Management</h3>
                    <p>Click on dates in the calendar below to mark them as holidays.</p>
                    <div class="holiday-list" id="holiday-list"></div>
                </div>
                <div class="rule-configuration">
                    <h3>Schedule Configuration</h3>
                    <div class="config-form">
                        <label for="max-appointments-per-day">Max Appointments Per Day:</label>
                        <input type="number" id="max-appointments-per-day" value="8" min="1" max="20">
                        
                        <label for="appointment-duration">Default Appointment Duration (minutes):</label>
                        <select id="appointment-duration">
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60" selected>1 hour</option>
                            <option value="90">1.5 hours</option>
                            <option value="120">2 hours</option>
                        </select>
                        
                        <label for="buffer-time">Buffer Time Between Appointments (minutes):</label>
                        <select id="buffer-time">
                            <option value="0">No buffer</option>
                            <option value="15" selected>15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                        </select>
                        
                        <button id="save-schedule-config" class="save-config-btn">Save Configuration</button>
                    </div>
                </div>
                <div class="calendar-integration">
                    <h3>Calendar Integration</h3>
                    <div class="calendar-container" id="admin-calendar"></div>
                </div>
            </div>
        `;
        
        // Load existing holidays
        loadHolidays();
        
        // Add event listener for configuration save
        document.getElementById('save-schedule-config')?.addEventListener('click', saveScheduleConfig);
        
        // Initialize admin calendar
        initializeAdminCalendar();
    };
    
    const loadHolidays = async () => {
        try {
            const response = await fetch('/api/admin/holidays', {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const holidays = await response.json();
                const holidayList = document.getElementById('holiday-list');
                if (holidayList) {
                    holidayList.innerHTML = '<h4>Current Holidays:</h4>';
                    holidays.forEach(holiday => {
                        const holidayItem = document.createElement('div');
                        holidayItem.className = 'holiday-item';
                        holidayItem.innerHTML = `
                            <span>${holiday.date}: ${holiday.name}</span>
                            <button class="remove-holiday-btn" data-holiday-id="${holiday.id}">Remove</button>
                        `;
                        holidayList.appendChild(holidayItem);
                    });
                    
                    // Add event listeners for remove buttons
                    document.querySelectorAll('.remove-holiday-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const holidayId = e.target.dataset.holidayId;
                            removeHoliday(holidayId);
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading holidays:', error);
        }
    };
    
    const initializeAdminCalendar = () => {
        const adminCalendarContainer = document.getElementById('admin-calendar');
        if (!adminCalendarContainer) return;
        
        // Create a simple calendar for holiday management
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const calendar = new Calendar(adminCalendarContainer, {
            month: currentMonth,
            year: currentYear,
            role: 'Admin',
            holidays: holidays,
            availability: {},
            appointments: [],
            onDateSelect: (date, dayAvailability, role) => {
                // Admin can click dates to add/remove holidays
                addHoliday(date);
            }
        });
        
        calendar.render();
    };
    
    const addHoliday = async (date) => {
        const holidayName = prompt(`Enter holiday name for ${date}:`);
        if (!holidayName) return;
        
        try {
            const response = await fetch('/api/admin/holidays', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    date: date,
                    name: holidayName
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                loadHolidays(); // Refresh the holiday list
                initializeAdminCalendar(); // Refresh the calendar
            }
        } catch (error) {
            console.error('Error adding holiday:', error);
            alert('Error adding holiday. Please try again.');
        }
    };
    
    const removeHoliday = async (holidayId) => {
        if (!confirm('Are you sure you want to remove this holiday?')) return;
        
        try {
            const response = await fetch(`/api/admin/holidays/${holidayId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                loadHolidays(); // Refresh the holiday list
                initializeAdminCalendar(); // Refresh the calendar
            }
        } catch (error) {
            console.error('Error removing holiday:', error);
            alert('Error removing holiday. Please try again.');
        }
    };
    
    const saveScheduleConfig = async () => {
        const maxAppointments = document.getElementById('max-appointments-per-day')?.value;
        const appointmentDuration = document.getElementById('appointment-duration')?.value;
        const bufferTime = document.getElementById('buffer-time')?.value;
        
        try {
            const response = await fetch('/api/admin/schedule-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    maxAppointmentsPerDay: parseInt(maxAppointments),
                    appointmentDuration: parseInt(appointmentDuration),
                    bufferTime: parseInt(bufferTime)
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                alert(result.message);
            }
        } catch (error) {
            console.error('Error saving schedule configuration:', error);
            alert('Error saving configuration. Please try again.');
        }
    };

    // --- Integrated Calendar Date Selection ---
    const handleCalendarDateSelection = (date, dayAvailability, role) => {
        // Remove any existing date function panels
        const existingPanels = document.querySelectorAll('.calendar-function-panel');
        existingPanels.forEach(panel => panel.remove());
        
        // Create function panel based on role
        const functionPanel = document.createElement('div');
        functionPanel.className = 'calendar-function-panel';
        functionPanel.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 300px; /* Increased width */
            margin-top: 10px;
        `;

        if (role === 'Tutor') {
            const currentAvailability = dayAvailability || { status: 'unavailable', slots: [] };
            functionPanel.innerHTML = `
                <h4>Manage Availability - ${date}</h4>
                <div class="form-group">
                    <label>Day Status:</label>
                    <select id="day-status" class="day-status-select">
                        <option value="available" ${currentAvailability.status === 'available' ? 'selected' : ''}>Available</option>
                        <option value="unavailable" ${currentAvailability.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
                        <option value="sick">Mark as Sick</option>
                        <option value="vacation">Request Vacation</option>
                    </select>
                </div>
                <div id="time-slots-container" class="${currentAvailability.status === 'available' ? '' : 'hidden'}">
                    <label>Available Time Slots:</label>
                    <div class="time-slots-grid">
                        ${['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(slot => `
                            <label class="time-slot-label">
                                <input type="checkbox" class="availability-slot" data-time="${slot}" ${currentAvailability.slots.includes(slot) ? 'checked' : ''}> ${slot}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button id="save-availability-btn" class="primary-button">Save</button>
                    <button onclick="this.parentElement.parentElement.remove()" class="secondary-button">Close</button>
                </div>
            `;

            // Attach event listener for the status dropdown
            setTimeout(() => {
                const statusSelect = functionPanel.querySelector('#day-status');
                const timeSlotsContainer = functionPanel.querySelector('#time-slots-container');
                if (statusSelect) {
                    statusSelect.addEventListener('change', (e) => {
                        if (e.target.value === 'available') {
                            timeSlotsContainer.classList.remove('hidden');
                        } else {
                            timeSlotsContainer.classList.add('hidden');
                        }
                    });
                }
            }, 0);

        } else if (role === 'Student') {
            const isHoliday = holidays.includes(date);
            functionPanel.innerHTML = `
                <h4>Manage Date - ${date}</h4>
                <p>Current status: ${isHoliday ? 'Holiday' : 'Regular Day'}</p>
                <button id="toggle-holiday-btn" class="primary-button">
                    ${isHoliday ? 'Remove Holiday' : 'Mark as Holiday'}
                </button>
                <button onclick="this.parentElement.remove()" style="float: right; margin-top: 0.5rem;">Close</button>
            `;
        }
        
        // Position the panel relative to the clicked date
        const calendarContainer = document.querySelector('.calendar-container');
        calendarContainer.style.position = 'relative';
        calendarContainer.appendChild(functionPanel);
        
        // Add event listeners for the function buttons
        if (role === 'Student') {
            const timeSlotBtns = functionPanel.querySelectorAll('.time-slot-btn');
            const confirmBtn = functionPanel.querySelector('#confirm-booking-btn');
            
            timeSlotBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    timeSlotBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                });
            });
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', async () => {
                    const selectedTime = functionPanel.querySelector('.time-slot-btn.selected');
                    const reason = functionPanel.querySelector('#booking-reason').value;
                    
                    if (!selectedTime) {
                        alert('Please select a time slot');
                        return;
                    }
                    
                    try {
                        const response = await fetch('/api/appointments', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                date: date,
                                time: selectedTime.dataset.time,
                                reason: reason
                            })
                        });
                        
                        if (response.ok) {
                            alert('Appointment booked successfully!');
                            functionPanel.remove();
                            // Refresh calendar
                            const calendarContainer = document.querySelector('.calendar-container');
                            new Calendar(calendarContainer, { 
                                role: currentUserRole, 
                                onDateSelect: (date, dayAvailability) => {
                                    handleCalendarDateSelection(date, dayAvailability, currentUserRole);
                                }
                            });
                        } else {
                            alert('Failed to book appointment');
                        }
                    } catch (error) {
                        console.error('Booking error:', error);
                        alert('Error booking appointment');
                    }
                });
            }
        } else if (role === 'Tutor') {
            const saveBtn = functionPanel.querySelector('#save-availability-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    const dayStatus = functionPanel.querySelector('#day-status').value;
                    const selectedSlots = Array.from(functionPanel.querySelectorAll('.availability-slot:checked')).map(cb => cb.dataset.time);

                    if (dayStatus === 'sick') {
                        const today = new Date();
                        const selectedDate = new Date(date);
                        const diffTime = selectedDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays < -1 || diffDays > 0) {
                            alert('Sick days can only be marked for today or yesterday.');
                            return;
                        }
                    }

                    if (dayStatus === 'vacation') {
                        alert('Vacation request sent for approval.');
                    }

                    try {
                        const response = await fetch('/api/availability', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({ date, status: dayStatus, slots: selectedSlots })
                        });

                        if (response.ok) {
                            alert('Availability saved!');
                            functionPanel.remove();
                            // Re-render calendar to show new status
                            const calendarContainer = document.querySelector('.calendar-container');
                            if (calendarContainer) {
                                new Calendar(calendarContainer, {
                                    role: currentUserRole, 
                                    onDateSelect: (date, dayAvailability) => {
                                        handleCalendarDateSelection(date, dayAvailability, currentUserRole);
                                    }
                                });
                            }
                        } else {
                            alert('Failed to save availability.');
                        }
                    } catch (error) {
                        console.error('Error saving availability:', error);
                        alert('An error occurred while saving availability.');
                    }
                });
            }
        } else if (role === 'Admin' || role === 'Super Admin') {
            const toggleBtn = functionPanel.querySelector('#toggle-holiday-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const isHoliday = holidays.includes(date);
                    if (isHoliday) {
                        const index = holidays.indexOf(date);
                        holidays.splice(index, 1);
                    } else {
                        holidays.push(date);
                    }
                    alert(`Date ${isHoliday ? 'removed from' : 'marked as'} holiday`);
                    functionPanel.remove();
                    // Refresh calendar
                    const calendarContainer = document.querySelector('.calendar-container');
                    new Calendar(calendarContainer, { 
                        role: currentUserRole, 
                        onDateSelect: (date, dayAvailability) => {
                            handleCalendarDateSelection(date, dayAvailability, currentUserRole);
                        }
                    });
                });
            }
        }
    };

    // --- Navigation ---
    const updateUserNav = () => {
        currentUserRole = sessionStorage.getItem('userRole');
        const mainNav = document.getElementById('main-nav');
        const dashboardNavContainer = document.getElementById('dashboard-nav-container');
        
        if (currentUserRole) {
            document.body.classList.add('dashboard-view');
            mainNav.classList.add('hidden');
            dashboardNavContainer.classList.remove('hidden');
            document.getElementById('dashboard-title').textContent = `${currentUserRole} Dashboard`;
            loadDashboard(currentUserRole);
            showView('dashboard');
        } else {
            document.body.classList.remove('dashboard-view');
            mainNav.classList.remove('hidden');
            dashboardNavContainer.classList.add('hidden');
            showView('home');
        }
    };

    // --- Dashboard Loading & Internal Nav ---
    const loadDashboard = async (role) => {
        const dashboardFile = `${role.toLowerCase().replace(' ', '-')}-dashboard.html`;
        const dashboardContainer = document.getElementById('dashboard-content');
        try {
            const response = await fetch(dashboardFile);
            if (response.ok) {
                dashboardContainer.innerHTML = await response.text();
                populateDashboardNav(role);
                initializeDashboard(role);
            } else {
                dashboardContainer.innerHTML = `<p>Error: Could not load dashboard. Status: ${response.status}</p>`;
            }
        } catch (error) {
            console.error('An exception occurred while fetching the dashboard:', error);
            dashboardContainer.innerHTML = `<p>An exception occurred while loading the dashboard. Please check the browser console for details.</p>`;
        }
    };
    
    const populateDashboardNav = (role) => {
        const dashboardNav = document.getElementById('dashboard-nav');
        dashboardNav.innerHTML = ''; // Clear existing links
        
        const navItems = {
            Student: [
                { text: 'Find a Tutor', target: 'find-tutor' },
                { text: 'My Appointments', target: 'my-appointments' },
                { text: 'My Profile', target: 'my-profile' },
                { text: 'Calendar', target: 'calendar' }
            ],
            Tutor: [
                { text: 'Upcoming Appointments', target: 'appointments' },
                { text: 'All Appointments', target: 'all-appointments' },
                { text: 'Working Hours', target: 'working-hours' },
                { text: 'My Profile', target: 'my-profile' },
                { text: 'Calendar', target: 'calendar' }
            ],
            Admin: [
                { text: 'Approve Accounts', target: 'approve-accounts' },
                { text: 'Manage Tutors', target: 'manage-tutors' },
                { text: 'Manage Users', target: 'manage-users' },
                { text: 'Schedule Rules', target: 'schedule-rules' },
                { text: 'Calendar', target: 'calendar' }
            ],
            'Super Admin': [
                { text: 'Manage All Users', target: 'manage-all-users' },
                { text: 'System-Wide Schedule', target: 'system-wide-schedule' },
                { text: 'Calendar', target: 'calendar' }
            ]
        };

        const items = navItems[role] || [];
        items.forEach(item => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.textContent = item.text;
            link.dataset.target = item.target;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleDashboardNavigation(item.text, role);
            });
            dashboardNav.appendChild(link);
        });
    };
    
    const handleDashboardNavigation = (section, role) => {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.querySelectorAll('.calendar-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Show selected section
        if (section === 'Calendar') {
            showCalendarTab(role);
        } else {
            const sectionId = section.toLowerCase().replace(/\s+/g, '-');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                
                // Handle specific sections
                if (section === 'Upcoming Appointments') {
                    const appointmentList = targetSection.querySelector('.appointment-list');
                    if (appointmentList) {
                        renderUpcomingAppointments(appointmentList, role);
                    }
                } else if (section === 'All Appointments') {
                    const allAppointmentsList = targetSection.querySelector('.all-appointments-list');
                    if (allAppointmentsList) {
                        renderAppointments(allAppointmentsList, role, true);
                    }
                } else if (section === 'Working Hours') {
                    renderWorkingHours();
                    initializeWorkingHoursForm();
                } else if (section === 'Manage Tutors') {
                    renderTutorList();
                } else if (section === 'Manage Users') {
                    renderUserManagement();
                } else if (section === 'Schedule Rules') {
                    renderScheduleRules();
                }
            }
        }
    };
    
    const showCalendarTab = (role) => {
        let calendarContainer = document.querySelector('.calendar-container');
        if (!calendarContainer) {
            calendarContainer = document.createElement('div');
            calendarContainer.className = 'calendar-container';
            // Find the calendar section and append to it
            const calendarSection = document.getElementById('calendar');
            if (calendarSection) {
                calendarSection.appendChild(calendarContainer);
            } else {
                // Fallback to dashboard content area
                const dashboardContent = document.getElementById('dashboard-content');
                if (dashboardContent) {
                    dashboardContent.appendChild(calendarContainer);
                }
            }
        }
        
        calendarContainer.style.display = 'block';
        new Calendar(calendarContainer, { 
            role, 
            onDateSelect: (date, dayAvailability) => {
                handleCalendarDateSelection(date, dayAvailability, role);
            }
        });
    };
    
    // --- Centralized Dashboard Initialization ---
    function initializeDashboard(role) {
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            new Calendar(calendarContainer, {
                role: role,
                onDateSelect: handleCalendarDateSelection
            });
        }

        // Add other dashboard-specific initializations here
        // For example, attaching event listeners to forms, buttons, etc.
        const findTutorForm = document.querySelector('#find-tutor .search-form');
        if (findTutorForm) {
            findTutorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Searching for tutors...');
            });
        }

        const appointmentList = document.querySelector('.appointment-list');
        if(appointmentList) renderAppointments(appointmentList, role);

        const sections = document.querySelectorAll('.dashboard-section');
        const navLinks = document.querySelectorAll('#dashboard-nav .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                const targetId = e.target.dataset.target;
                sections.forEach(section => {
                    section.classList.toggle('hidden', section.id !== targetId);
                });
            });
        });

        if (navLinks.length > 0) {
            navLinks[0].classList.add('active');
            const defaultTargetId = navLinks[0].dataset.target;
            sections.forEach(section => {
                section.classList.toggle('hidden', section.id !== defaultTargetId);
            });
        }
    }

    // --- Calendar Class (previously in calendar.js) ---
    class Calendar {
        constructor(container, options = {}) {
            this.container = container;
            this.role = options.role || 'student';
            this.today = new Date();
            this.currentMonth = this.today.getMonth();
            this.currentYear = this.today.getFullYear();
            this.onDateSelect = (date, dayAvailability) => options.onDateSelect(date, dayAvailability, this.role);
            this.selectedDate = null;
            this.calendarData = {};
            this.loadCalendarData();
        }

        async loadCalendarData() {
            try {
                const response = await fetch('/api/calendar-data');
                if (response.ok) {
                    this.calendarData = await response.json();
                    // Enhance data based on user role
                    await this.enhanceCalendarData();
                } else {
                    this.calendarData = this.getMockCalendarData();
                }
            } catch (error) {
                console.error('Error loading calendar data:', error);
                this.calendarData = this.getMockCalendarData();
            }
            this.render();
        }
        
        async enhanceCalendarData() {
            const userEmail = sessionStorage.getItem('userEmail');
            const userRole = sessionStorage.getItem('userRole');
            
            // Add working hours for tutors
            if (userRole === 'Tutor' && workingHours[userEmail]) {
                this.calendarData.workingHours = workingHours[userEmail];
            }
            
            // Add vacation requests for tutors
            if (userRole === 'Tutor' && vacationRequests[userEmail]) {
                this.calendarData.vacationRequests = vacationRequests[userEmail];
            }
            
            // Add all appointments for the user
            if (appointments[userEmail]) {
                this.calendarData.userAppointments = appointments[userEmail];
            }
            
            // For students, add available tutors and their appointments
            if (userRole === 'Student') {
                // Get all available tutors
                const availableTutors = Object.keys(mockUsers).filter(email => 
                    mockUsers[email].role === 'Tutor'
                );
                this.calendarData.availableTutors = availableTutors;
                
                // Get student appointments
                if (appointments[userEmail]) {
                    this.calendarData.studentAppointments = appointments[userEmail];
                }
            }
            
            // For admins, add all tutor data
            if (userRole === 'Admin') {
                this.calendarData.allTutors = Object.keys(mockUsers)
                    .filter(email => mockUsers[email].role === 'Tutor')
                    .map(email => ({
                        email: email,
                        name: mockUsers[email].name,
                        workingHours: workingHours[email] || {},
                        availability: mockAvailability[email] || {},
                        appointments: appointments[email] || []
                    }));
            }
        }

        getMockCalendarData() {
            return {
                holidays: window.holidays || [],
                availability: window.availability || {},
                appointments: window.appointments || []
            };
        }

        render() {
            this.container.innerHTML = '';
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.innerHTML = `
                <button id="prev-month">&lt;</button>
                <h2>${new Date(this.currentYear, this.currentMonth).toLocaleString('default', { month: 'long' })} ${this.currentYear}</h2>
                <button id="next-month">&gt;</button>
            `;
            this.container.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'calendar-grid';

            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            days.forEach(day => {
                const dayName = document.createElement('div');
                dayName.className = 'day-name';
                dayName.textContent = day;
                grid.appendChild(dayName);
            });

            const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
            const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

            for (let i = 0; i < firstDay; i++) {
                grid.appendChild(document.createElement('div'));
            }

            for (let i = 1; i <= daysInMonth; i++) {
                const dayCell = document.createElement('div');
                dayCell.className = 'calendar-day';
                dayCell.textContent = i;
                const date = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const dayOfWeek = new Date(this.currentYear, this.currentMonth, i).getDay();
                const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

                if (i === this.today.getDate() && this.currentMonth === this.today.getMonth() && this.currentYear === this.today.getFullYear()) {
                    dayCell.classList.add('current-day');
                }
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayCell.classList.add('weekend');
                }
                if (this.calendarData.holidays && this.calendarData.holidays.includes(date)) {
                    dayCell.classList.add('holiday');
                }
                
                // Role-specific calendar enhancements
                const userEmail = sessionStorage.getItem('userEmail');
                const userRole = sessionStorage.getItem('userRole');
                
                if (userRole === 'Tutor') {
                    // Show tutor-specific information
                    const workingHoursData = workingHours[userEmail];
                    if (workingHoursData && workingHoursData.weeklySchedule && workingHoursData.weeklySchedule[dayName]) {
                        const daySchedule = workingHoursData.weeklySchedule[dayName];
                        if (daySchedule.working) {
                            dayCell.classList.add('working-day');
                        }
                    }
                    
                    // Show availability status
                    const dayAvailability = this.getDayAvailability(date);
                    if (dayAvailability) {
                        if (dayAvailability.status === 'busy') {
                            dayCell.classList.add('busy');
                        } else if (dayAvailability.status === 'available') {
                            dayCell.classList.add('available');
                        } else if (dayAvailability.status === 'sick') {
                            dayCell.classList.add('sick');
                        } else if (dayAvailability.status === 'vacation') {
                            dayCell.classList.add('vacation');
                        } else if (dayAvailability.status === 'unavailable') {
                            dayCell.classList.add('unavailable');
                        }
                    }
                    
                    // Show appointments
                    const dayAppointments = this.getDayAppointments(date);
                    if (dayAppointments.length > 0) {
                        dayCell.classList.add('has-appointment');
                        const appointmentCount = document.createElement('div');
                        appointmentCount.className = 'appointment-count';
                        appointmentCount.textContent = dayAppointments.length;
                        dayCell.appendChild(appointmentCount);
                    }
                    
                } else if (userRole === 'Student') {
                    // Show student-specific information
                    // Show days with available tutors
                    const availableTutors = this.getAvailableTutorsForDate(date);
                    if (availableTutors.length > 0) {
                        dayCell.classList.add('tutors-available');
                        const tutorCount = document.createElement('div');
                        tutorCount.className = 'tutor-count';
                        tutorCount.textContent = `${availableTutors.length} tutors`;
                        dayCell.appendChild(tutorCount);
                    }
                    
                    // Show student appointments
                    const studentAppointments = this.getStudentAppointmentsForDate(date);
                    if (studentAppointments.length > 0) {
                        dayCell.classList.add('has-student-appointment');
                        const appointmentCount = document.createElement('div');
                        appointmentCount.className = 'appointment-count';
                        appointmentCount.textContent = studentAppointments.length;
                        dayCell.appendChild(appointmentCount);
                    }
                    
                } else if (userRole === 'Admin') {
                    // Show admin-specific information
                    // Show holidays
                    if (this.calendarData.holidays && this.calendarData.holidays.includes(date)) {
                        dayCell.classList.add('holiday');
                    }
                    
                    // Show tutor availability overview
                    const tutorAvailability = this.getTutorAvailabilityForDate(date);
                    if (tutorAvailability.available > 0) {
                        dayCell.classList.add('tutors-available');
                        const tutorCount = document.createElement('div');
                        tutorCount.className = 'tutor-count';
                        tutorCount.textContent = `${tutorAvailability.available}/${tutorAvailability.total} tutors`;
                        dayCell.appendChild(tutorCount);
                    }
                }
                if (this.selectedDate === date) {
                    dayCell.classList.add('selected');
                }
                dayCell.addEventListener('click', () => this.selectDate(date, dayAvailability));
                grid.appendChild(dayCell);
            }
            this.container.appendChild(grid);
            document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
            document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
        }

        getDayAvailability(date) {
            if (this.calendarData.availability && this.calendarData.availability[date]) {
                return this.calendarData.availability[date];
            }
            return null;
        }
        
        getDayAppointments(date) {
            if (this.calendarData.appointments) {
                return this.calendarData.appointments.filter(appt => {
                    const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
                    return appointmentDate === date;
                });
            }
            return [];
        }
        
        getAvailableTutorsForDate(date) {
            const availableTutors = [];
            if (this.calendarData.availableTutors) {
                this.calendarData.availableTutors.forEach(tutorEmail => {
                    const tutorAvailability = this.calendarData.availability && this.calendarData.availability[tutorEmail];
                    if (tutorAvailability && tutorAvailability[date] && tutorAvailability[date].status === 'available') {
                        availableTutors.push(tutorEmail);
                    }
                });
            }
            return availableTutors;
        }
        
        getStudentAppointmentsForDate(date) {
            if (this.calendarData.studentAppointments) {
                return this.calendarData.studentAppointments.filter(appt => {
                    const appointmentDate = new Date(appt.date).toISOString().split('T')[0];
                    return appointmentDate === date;
                });
            }
            return [];
        }
        
        getTutorAvailabilityForDate(date) {
            const result = { available: 0, total: 0 };
            if (this.calendarData.allTutors) {
                this.calendarData.allTutors.forEach(tutor => {
                    result.total++;
                    const tutorAvailability = tutor.availability && tutor.availability[date];
                    if (tutorAvailability && tutorAvailability.status === 'available') {
                        result.available++;
                    }
                });
            }
            return result;
        }

        selectDate(date, dayAvailability) {
            this.selectedDate = date;
            this.onDateSelect(date, dayAvailability);
            this.render();
        }

        changeMonth(direction) {
            this.currentMonth += direction;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            } else if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.render();
        }
    }

    // --- Calendar Interaction Logic (Removed old modal-based approach) --

    // --- Enhanced Calendar Feature Handlers ---
    const initializeCalendarFeatures = () => {
        // Function disabled - using integrated calendar approach instead
        return;
        // Student booking feature
        const bookingFeature = document.getElementById('student-booking-feature');
        if (bookingFeature) {
            const timeSlots = bookingFeature.querySelectorAll('.time-slot');
            const confirmButton = document.getElementById('confirm-booking');
            
            timeSlots.forEach(slot => {
                slot.addEventListener('click', () => {
                    timeSlots.forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                });
            });
            
            if (confirmButton) {
                confirmButton.addEventListener('click', async () => {
                    const selectedTime = bookingFeature.querySelector('.time-slot.selected');
                    const reason = document.getElementById('booking-reason').value;
                    
                    if (!selectedTime) {
                        alert('Please select a time slot');
                        return;
                    }
                    
                    try {
                        const response = await fetch('/api/appointments', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                date: bookingFeature.querySelector('.selected-date').textContent,
                                time: selectedTime.dataset.time,
                                reason: reason
                            })
                        });
                        
                        if (response.ok) {
                            alert('Appointment booked successfully!');
                            bookingFeature.classList.add('hidden');
                            // Refresh calendar
                            const calendarContainer = document.querySelector('.calendar-container');
                            new Calendar(calendarContainer, { role: currentUserRole, onDateSelect });
                        } else {
                            alert('Failed to book appointment');
                        }
                    } catch (error) {
                        console.error('Booking error:', error);
                        alert('Error booking appointment');
                    }
                });
            }
        }
        
        // Tutor availability feature
        const availabilityFeature = document.getElementById('tutor-availability-feature');
        if (availabilityFeature) {
            const saveButton = document.getElementById('save-availability');
            
            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    const selectedSlots = availabilityFeature.querySelectorAll('.availability-slot:checked');
                    const dayStatus = document.getElementById('day-status').value;
                    const selectedDate = availabilityFeature.querySelector('.selected-date').textContent;
                    
                    const timeSlots = Array.from(selectedSlots).map(slot => slot.dataset.time);
                    
                    try {
                        const response = await fetch('/api/calendar-day-status', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                date: selectedDate,
                                day_type: dayStatus,
                                time_slots: timeSlots
                            })
                        });
                        
                        if (response.ok) {
                            alert('Availability updated successfully!');
                            availabilityFeature.classList.add('hidden');
                            // Refresh calendar
                            const calendarContainer = document.querySelector('.calendar-container');
                            new Calendar(calendarContainer, { role: currentUserRole, onDateSelect });
                        } else {
                            alert('Failed to update availability');
                        }
                    } catch (error) {
                        console.error('Availability update error:', error);
                        alert('Error updating availability');
                    }
                });
            }
        }
        
        // Admin holiday feature
        const adminFeature = document.getElementById('admin-holiday-feature');
        if (adminFeature) {
            const markButton = document.getElementById('mark-holiday');
            const removeButton = document.getElementById('remove-holiday');
            
            if (markButton) {
                markButton.addEventListener('click', async () => {
                    const holidayName = document.getElementById('holiday-name').value;
                    const holidayDescription = document.getElementById('holiday-description').value;
                    const holidayType = document.getElementById('holiday-type').value;
                    const selectedDate = adminFeature.querySelector('.selected-date').textContent;
                    
                    if (!holidayName) {
                        alert('Please enter a holiday name');
                        return;
                    }
                    
                    try {
                        const response = await fetch('/api/holidays', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                date: selectedDate,
                                name: holidayName,
                                description: holidayDescription,
                                type: holidayType
                            })
                        });
                        
                        if (response.ok) {
                            alert('Holiday marked successfully!');
                            adminFeature.classList.add('hidden');
                            // Refresh calendar
                            const calendarContainer = document.querySelector('.calendar-container');
                            new Calendar(calendarContainer, { role: currentUserRole, onDateSelect });
                        } else {
                            alert('Failed to mark holiday');
                        }
                    } catch (error) {
                        console.error('Holiday marking error:', error);
                        alert('Error marking holiday');
                    }
                });
            }
            
            if (removeButton) {
                removeButton.addEventListener('click', async () => {
                    const selectedDate = adminFeature.querySelector('.selected-date').textContent;
                    
                    if (!confirm(`Remove holiday status for ${selectedDate}?`)) {
                        return;
                    }
                    
                    try {
                        const response = await fetch(`/api/holidays/${selectedDate}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            }
                        });
                        
                        if (response.ok) {
                            alert('Holiday removed successfully!');
                            adminFeature.classList.add('hidden');
                            // Refresh calendar
                            const calendarContainer = document.querySelector('.calendar-container');
                            new Calendar(calendarContainer, { role: currentUserRole, onDateSelect });
                        } else {
                            alert('Failed to remove holiday');
                        }
                    } catch (error) {
                        console.error('Holiday removal error:', error);
                        alert('Error removing holiday');
                    }
                });
            }
        }
    };

    // --- Dynamic Content Rendering ---
    
    // Pagination functionality for appointments
    let currentPage = 1;
    let allAppointmentsCurrentPage = 1;
    const itemsPerPage = 10;
    
    const paginateArray = (array, page, perPage) => {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return array.slice(start, end);
    };
    
    const updatePaginationControls = (totalItems, currentPage, perPage, containerId, pageInfoId, prevBtnId, nextBtnId) => {
        const totalPages = Math.ceil(totalItems / perPage);
        const pageInfo = document.getElementById(pageInfoId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    };
    
    // Working hours functionality
    const renderWorkingHours = () => {
        const userEmail = sessionStorage.getItem('userEmail');
        const tutorWorkingHours = workingHours[userEmail];
        const scheduleGrid = document.getElementById('current-schedule-grid');
        
        if (!scheduleGrid || !tutorWorkingHours) return;
        
        scheduleGrid.innerHTML = '';
        const weeklySchedule = tutorWorkingHours.weeklySchedule;
        
        Object.keys(weeklySchedule).forEach(day => {
            const daySchedule = weeklySchedule[day];
            const dayElement = document.createElement('div');
            dayElement.className = `schedule-day ${daySchedule.working ? 'working' : 'not-working'}`;
            
            const hoursText = daySchedule.working 
                ? `${daySchedule.start} - ${daySchedule.end}` 
                : 'Not working';
            
            dayElement.innerHTML = `
                <span class="day-name">${day}</span>
                <span class="day-hours">${hoursText}</span>
            `;
            
            scheduleGrid.appendChild(dayElement);
        });
    };
    
    const initializeWorkingHoursForm = () => {
        const userEmail = sessionStorage.getItem('userEmail');
        const tutorWorkingHours = workingHours[userEmail];
        
        if (!tutorWorkingHours) return;
        
        const weeklySchedule = tutorWorkingHours.weeklySchedule;
        
        Object.keys(weeklySchedule).forEach(day => {
            const daySchedule = weeklySchedule[day];
            const dayElement = document.querySelector(`[data-day="${day}"]`);
            
            if (dayElement) {
                const workingCheckbox = dayElement.querySelector('.day-working');
                const startTimeInput = dayElement.querySelector('.start-time');
                const endTimeInput = dayElement.querySelector('.end-time');
                
                if (workingCheckbox) workingCheckbox.checked = daySchedule.working;
                if (startTimeInput) startTimeInput.value = daySchedule.start || '09:00';
                if (endTimeInput) endTimeInput.value = daySchedule.end || '17:00';
            }
        });
    };
    
    const handleWorkingHoursSave = (e) => {
        e.preventDefault();
        const userEmail = sessionStorage.getItem('userEmail');
        
        if (!workingHours[userEmail]) {
            workingHours[userEmail] = { weeklySchedule: {} };
        }
        
        const daySchedules = document.querySelectorAll('.day-schedule');
        const newSchedule = {};
        
        daySchedules.forEach(dayElement => {
            const day = dayElement.dataset.day;
            const working = dayElement.querySelector('.day-working').checked;
            const start = dayElement.querySelector('.start-time').value;
            const end = dayElement.querySelector('.end-time').value;
            
            newSchedule[day] = {
                working: working,
                start: start,
                end: end
            };
        });
        
        workingHours[userEmail].weeklySchedule = newSchedule;
        renderWorkingHours();
        alert('Working hours updated successfully!');
        
        // Update calendar to reflect new working days
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            const role = sessionStorage.getItem('userRole');
            showCalendarTab(role);
        }
    };
    
    // Enhanced appointment rendering with pagination
    const renderAppointments = (container, role, isAllAppointments = false) => {
        container.innerHTML = '';
        const userEmail = sessionStorage.getItem('userEmail');
        let userAppointments = [];

        if (role === 'Student') {
            userAppointments = appointments.filter(a => a.student === userEmail);
        } else if (role === 'Tutor') {
            userAppointments = appointments.filter(a => a.tutor === userEmail);
        } else { // Admins and Super Admins see all
            userAppointments = appointments;
        }

        // Apply filters for all appointments view
        if (isAllAppointments) {
            const statusFilter = document.getElementById('appointment-status-filter')?.value;
            const dateFilter = document.getElementById('appointment-date-filter')?.value;
            
            if (statusFilter && statusFilter !== 'all') {
                userAppointments = userAppointments.filter(a => a.status.toLowerCase() === statusFilter.toLowerCase());
            }
            
            if (dateFilter) {
                userAppointments = userAppointments.filter(a => {
                    const appointmentDate = new Date(a.date).toISOString().split('T')[0];
                    return appointmentDate === dateFilter;
                });
            }
        }

        if (userAppointments.length === 0) {
            container.innerHTML = '<p>No appointments to display.</p>';
            if (isAllAppointments) {
                updatePaginationControls(0, 1, itemsPerPage, 'all-appointments-list', 'all-page-info', 'all-prev-page-btn', 'all-next-page-btn');
            } else {
                updatePaginationControls(0, 1, itemsPerPage, 'appointment-list', 'page-info', 'prev-page-btn', 'next-page-btn');
            }
            return;
        }

        // Sort appointments by date (newest first)
        userAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply pagination
        const currentPageNum = isAllAppointments ? allAppointmentsCurrentPage : currentPage;
        const paginatedAppointments = paginateArray(userAppointments, currentPageNum, itemsPerPage);
        
        // Update pagination controls
        if (isAllAppointments) {
            updatePaginationControls(userAppointments.length, allAppointmentsCurrentPage, itemsPerPage, 'all-appointments-list', 'all-page-info', 'all-prev-page-btn', 'all-next-page-btn');
        } else {
            updatePaginationControls(userAppointments.length, currentPage, itemsPerPage, 'appointment-list', 'page-info', 'prev-page-btn', 'next-page-btn');
        }

        paginatedAppointments.forEach(appt => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            
            const appointmentDate = new Date(appt.date);
            const dateStr = appointmentDate.toLocaleDateString();
            const timeStr = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            card.innerHTML = `
                <div class="appointment-header">
                    <h4>${appt.course}</h4>
                    <span class="appointment-status status-${appt.status.toLowerCase()}">${appt.status}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>${role === 'Student' ? 'Tutor' : 'Student'}:</strong> ${role === 'Student' ? appt.tutor : appt.student}</p>
                    <p><strong>Date:</strong> ${dateStr} at ${timeStr}</p>
                    <p><strong>Duration:</strong> ${appt.duration} minutes</p>
                    ${appt.notes ? `<p><strong>Notes:</strong> ${appt.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    ${role === 'Tutor' && appt.status === 'Scheduled' ? `
                        <button class="complete-appointment-btn" data-id="${appt.id}">Complete</button>
                        <button class="cancel-appointment-btn" data-id="${appt.id}">Cancel</button>
                    ` : ''}
                    ${role === 'Tutor' ? `
                        <button class="view-appointment-btn" data-id="${appt.id}">View Details</button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    };
    
    // Separate function for upcoming appointments (only future appointments)
    const renderUpcomingAppointments = (container, role) => {
        container.innerHTML = '';
        const userEmail = sessionStorage.getItem('userEmail');
        const now = new Date();
        
        let upcomingAppointments = [];
        if (role === 'Student') {
            upcomingAppointments = appointments.filter(a => a.student === userEmail && new Date(a.date) > now);
        } else if (role === 'Tutor') {
            upcomingAppointments = appointments.filter(a => a.tutor === userEmail && new Date(a.date) > now);
        }
        
        // Sort by date (closest first)
        upcomingAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (upcomingAppointments.length === 0) {
            container.innerHTML = '<p>No upcoming appointments.</p>';
            updatePaginationControls(0, 1, itemsPerPage, 'appointment-list', 'page-info', 'prev-page-btn', 'next-page-btn');
            return;
        }
        
        const paginatedAppointments = paginateArray(upcomingAppointments, currentPage, itemsPerPage);
        updatePaginationControls(upcomingAppointments.length, currentPage, itemsPerPage, 'appointment-list', 'page-info', 'prev-page-btn', 'next-page-btn');
        
        paginatedAppointments.forEach(appt => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            
            const appointmentDate = new Date(appt.date);
            const dateStr = appointmentDate.toLocaleDateString();
            const timeStr = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            card.innerHTML = `
                <div class="appointment-header">
                    <h4>${appt.course}</h4>
                    <span class="appointment-status status-${appt.status.toLowerCase()}">${appt.status}</span>
                </div>
                <div class="appointment-details">
                    <p><strong>${role === 'Student' ? 'Tutor' : 'Student'}:</strong> ${role === 'Student' ? appt.tutor : appt.student}</p>
                    <p><strong>Date:</strong> ${dateStr} at ${timeStr}</p>
                    <p><strong>Duration:</strong> ${appt.duration} minutes</p>
                    ${appt.notes ? `<p><strong>Notes:</strong> ${appt.notes}</p>` : ''}
                </div>
                <div class="appointment-actions">
                    ${role === 'Tutor' && appt.status === 'Scheduled' ? `
                        <button class="complete-appointment-btn" data-id="${appt.id}">Complete</button>
                        <button class="cancel-appointment-btn" data-id="${appt.id}">Cancel</button>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });
    };

    // --- Event Listeners ---
    homeLink.addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
    loginLink.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });
    
    const logout = (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        window.location.reload();
    };
    
    logoutLink.addEventListener('click', logout);
    document.getElementById('dashboard-logout-link').addEventListener('click', logout);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.token);
                sessionStorage.setItem('userRole', data.user.role);
                sessionStorage.setItem('userEmail', data.user.email);
                sessionStorage.setItem('userId', data.user.userId);
                updateUserNav();
            } else {
                const error = await response.json();
                alert(error.error || 'Invalid email or password.');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback to mock data for development
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                sessionStorage.setItem('userRole', user.role);
                sessionStorage.setItem('userEmail', user.email);
                updateUserNav();
            } else {
                alert('Invalid email or password.');
            }
        }
    });

    // Modal events removed - using integrated calendar approach

    // --- Pagination and Working Hours Event Listeners ---
    document.addEventListener('click', (e) => {
        // Pagination controls for upcoming appointments
        if (e.target.id === 'prev-page-btn') {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                const appointmentList = document.querySelector('.appointment-list');
                if (appointmentList) {
                    renderUpcomingAppointments(appointmentList, sessionStorage.getItem('userRole'));
                }
            }
        } else if (e.target.id === 'next-page-btn') {
            e.preventDefault();
            const appointmentList = document.querySelector('.appointment-list');
            if (appointmentList) {
                const totalAppointments = appointments.filter(appt => {
                    const appointmentDate = new Date(appt.date);
                    return appointmentDate >= new Date() && appt.tutor === sessionStorage.getItem('userEmail');
                }).length;
                const totalPages = Math.ceil(totalAppointments / itemsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    renderUpcomingAppointments(appointmentList, sessionStorage.getItem('userRole'));
                }
            }
        }
        
        // Pagination controls for all appointments
        if (e.target.id === 'all-prev-page-btn') {
            e.preventDefault();
            if (allAppointmentsCurrentPage > 1) {
                allAppointmentsCurrentPage--;
                const allAppointmentsList = document.querySelector('.all-appointments-list');
                if (allAppointmentsList) {
                    renderAppointments(allAppointmentsList, sessionStorage.getItem('userRole'), true);
                }
            }
        } else if (e.target.id === 'all-next-page-btn') {
            e.preventDefault();
            const allAppointmentsList = document.querySelector('.all-appointments-list');
            if (allAppointmentsList) {
                const totalAppointments = appointments.filter(appt => appt.tutor === sessionStorage.getItem('userEmail')).length;
                const totalPages = Math.ceil(totalAppointments / itemsPerPage);
                if (allAppointmentsCurrentPage < totalPages) {
                    allAppointmentsCurrentPage++;
                    renderAppointments(allAppointmentsList, sessionStorage.getItem('userRole'), true);
                }
            }
        }
    });

    // Working hours form submission
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'working-hours-form') {
            e.preventDefault();
            handleWorkingHoursSave(e);
        }
    });

    // Appointment filters for all appointments
    document.addEventListener('change', (e) => {
        if (e.target.id === 'appointment-status-filter' || e.target.id === 'appointment-date-filter') {
            const allAppointmentsList = document.querySelector('.all-appointments-list');
            if (allAppointmentsList) {
                allAppointmentsCurrentPage = 1; // Reset to first page when filtering
                renderAppointments(allAppointmentsList, sessionStorage.getItem('userRole'), true);
            }
        }
        
        // Tutor status filter for admin
        if (e.target.id === 'tutor-status-filter') {
            renderTutorList();
        }
    });

    // Tutor management event listeners
    document.addEventListener('click', (e) => {
        // View tutor details
        if (e.target.classList.contains('view-tutor-btn')) {
            const tutorEmail = e.target.dataset.tutorEmail;
            if (tutorEmail) {
                showTutorDetails(tutorEmail);
            }
        }
        
        // Back to tutor list
        if (e.target.id === 'back-to-tutor-list') {
            const tutorList = document.querySelector('.tutor-list');
            const tutorDetails = document.getElementById('tutor-details');
            if (tutorList && tutorDetails) {
                tutorList.style.display = 'block';
                tutorDetails.classList.add('hidden');
            }
        }
        
        // Approve/reject working hours
        if (e.target.id === 'approve-hours-btn') {
            handleTutorApproval('hours', 'approve');
        } else if (e.target.id === 'reject-hours-btn') {
            handleTutorApproval('hours', 'reject');
        }
        
        // Approve/reject vacation requests
        if (e.target.id === 'approve-vacation-btn') {
            handleTutorApproval('vacation', 'approve');
        } else if (e.target.id === 'reject-vacation-btn') {
            handleTutorApproval('vacation', 'reject');
        }
    });

    // --- Initial Load ---
    updateUserNav();
});