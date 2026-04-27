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
        if (view === 'home') homeContent.classList.remove('hidden');
        else if (view === 'login') loginContent.classList.remove('hidden');
        else if (view === 'dashboard') dashboardContent.classList.remove('hidden');
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
            min-width: 250px;
            margin-top: 10px;
        `;
        
        if (role === 'Student') {
            functionPanel.innerHTML = `
                <h4>Book Appointment - ${date}</h4>
                ${dayAvailability ? `
                    <p>Available time slots:</p>
                    <div class="time-slots">
                        ${dayAvailability.slots.map(slot => `<button class="time-slot-btn" data-time="${slot}">${slot}</button>`).join('')}
                    </div>
                    <div style="margin-top: 1rem;">
                        <label>Reason for appointment:</label>
                        <textarea id="booking-reason" placeholder="Briefly describe what you need help with..." style="width: 100%; margin: 0.5rem 0;"></textarea>
                        <button id="confirm-booking-btn" class="primary-button">Book Appointment</button>
                    </div>
                ` : '<p>No availability on this date.</p>'}
                <button onclick="this.parentElement.remove()" style="float: right; margin-top: 0.5rem;">Close</button>
            `;
        } else if (role === 'Tutor') {
            functionPanel.innerHTML = `
                <h4>Manage Availability - ${date}</h4>
                <div>
                    <label>Day Status:</label>
                    <select id="day-status" style="width: 100%; margin: 0.5rem 0;">
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                    </select>
                </div>
                <div>
                    <label>Available Time Slots:</label>
                    <div class="time-slots">
                        ${['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(slot => `
                            <label style="display: block; margin: 0.25rem 0;">
                                <input type="checkbox" class="availability-slot" data-time="${slot}"> ${slot}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <button id="save-availability-btn" class="primary-button">Save Availability</button>
                <button onclick="this.parentElement.remove()" style="float: right; margin-top: 0.5rem;">Close</button>
            `;
        } else if (role === 'Admin' || role === 'Super Admin') {
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
                    const selectedSlots = functionPanel.querySelectorAll('.availability-slot:checked');
                    const dayStatus = functionPanel.querySelector('#day-status').value;
                    
                    const timeSlots = Array.from(selectedSlots).map(slot => slot.dataset.time);
                    
                    try {
                        const response = await fetch('/api/calendar-day-status', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                date: date,
                                day_type: dayStatus,
                                time_slots: timeSlots
                            })
                        });
                        
                        if (response.ok) {
                            alert('Availability updated successfully!');
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
                            alert('Failed to update availability');
                        }
                    } catch (error) {
                        console.error('Availability update error:', error);
                        alert('Error updating availability');
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
            mainNav.classList.add('hidden');
            dashboardNavContainer.classList.remove('hidden');
            document.getElementById('dashboard-title').textContent = `${currentUserRole} Dashboard`;
            loadDashboard(currentUserRole);
            showView('dashboard');
        } else {
            mainNav.classList.remove('hidden');
            dashboardNavContainer.classList.add('hidden');
            showView('home');
        }
    };

    // --- Dashboard Loading & Internal Nav ---
    const loadDashboard = async (role) => {
        const dashboardFile = `${role.toLowerCase().replace(' ', '-')}-dashboard.html`;
        try {
            const response = await fetch(dashboardFile);
            if (response.ok) {
                dashboardContent.innerHTML = await response.text();
                populateDashboardNav(role);
                initializeDashboard(role);
            } else {
                dashboardContent.innerHTML = `<p>Error loading dashboard.</p>`;
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            dashboardContent.innerHTML = `<p>Error loading dashboard.</p>`;
        }
    };
    
    const populateDashboardNav = (role) => {
        const dashboardNav = document.getElementById('dashboard-nav');
        dashboardNav.innerHTML = ''; // Clear existing links
        
        let navLinks = [];
        if (role === 'Student') {
            navLinks = ['Find a Tutor', 'My Appointments', 'My Profile', 'Calendar'];
        } else if (role === 'Tutor') {
            navLinks = ['My Availability', 'Appointments', 'My Profile', 'Calendar'];
        } else if (role === 'Admin') {
            navLinks = ['Approve Accounts', 'Manage Users', 'Schedule Rules', 'Calendar'];
        } else if (role === 'Super Admin') {
            navLinks = ['Manage All Users', 'System-Wide Schedule', 'Calendar'];
        }
        
        navLinks.forEach(linkText => {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.textContent = linkText;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleDashboardNavigation(linkText, role);
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
            }
        }
    };
    
    const showCalendarTab = (role) => {
        let calendarContainer = document.querySelector('.calendar-container');
        if (!calendarContainer) {
            calendarContainer = document.createElement('div');
            calendarContainer.className = 'calendar-container';
            document.querySelector('.dashboard-content-area').appendChild(calendarContainer);
        }
        
        calendarContainer.style.display = 'block';
        new Calendar(calendarContainer, { 
            role, 
            onDateSelect: (date, dayAvailability) => {
                handleCalendarDateSelection(date, dayAvailability, role);
            }
        });
    };
    
    const initializeDashboard = (role) => {
        // Calendar initialization is now handled by the Calendar tab
        const appointmentList = document.querySelector('.appointment-list');
        if(appointmentList) renderAppointments(appointmentList, role);

        const sections = document.querySelectorAll('.dashboard-section');
        const navLinks = document.querySelectorAll('#dashboard-nav .nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
                const targetId = e.target.textContent.toLowerCase().replace(/ /g, '-');
                sections.forEach(section => {
                    section.classList.toggle('hidden', section.id !== targetId);
                });
            });
        });
        
        // Set the first link as active by default
        if (navLinks.length > 0) {
            navLinks[0].classList.add('active');
            sections.forEach(section => {
                section.classList.toggle('hidden', section.id !== navLinks[0].textContent.toLowerCase().replace(/ /g, '-'));
            });
        }
    };

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
    const renderAppointments = (container, role) => {
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

        if (userAppointments.length === 0) {
            container.innerHTML = '<p>No appointments to display.</p>';
            return;
        }

        userAppointments.forEach(appt => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.innerHTML = `
                <p><strong>${role === 'Student' ? 'Tutor' : 'Student'}:</strong> ${role === 'Student' ? appt.tutor : appt.student}</p>
                <p><strong>Course:</strong> ${appt.course}</p>
                <p><strong>Date:</strong> ${new Date(appt.date).toLocaleString()}</p>
                <p><strong>Status:</strong> ${appt.status}</p>
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

    // --- Initial Load ---
    updateUserNav();
});