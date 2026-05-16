window.Calendar = {
    supabase: null,
    currentUser: null,
    tutorId: null, 
    view: 'week', // 'month' or 'week'
    container: null,
    viewDate: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'),
    onAppointmentClick: null,
    getAppointmentDisplayName: null,

    toUTCDate(dateStr) {
        if (!dateStr) return new Date(new Date().toISOString());
        if (dateStr instanceof Date) return dateStr;
        if (typeof dateStr === 'string' && !dateStr.includes('T') && !dateStr.includes('Z')) {
            return new Date(dateStr.replace(' ', 'T') + 'Z');
        }
        return new Date(dateStr);
    },

    getUTCToday() {
        return new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z');
    },

    init(currentUser, tutorId, supabase, view, container, onAppointmentClick, getAppointmentDisplayName) {
        this.currentUser = currentUser;
        this.tutorId = tutorId; // This is for specific tutor booking view
        this.supabase = supabase;
        this.view = view || 'week';
        this.container = container;
        this.onAppointmentClick = onAppointmentClick;
        this.getAppointmentDisplayName = getAppointmentDisplayName || function(appt) { return 'Appointment'; };
        this.render();
    },

    async render() {
        if (!this.container) return;
        const headerHTML = `
            <div class="calendar-header">
                 <div class="calendar-nav">
                    <button id="prev-btn" class="btn btn-sm btn-secondary">&lt;</button>
                    <h3 id="view-title"></h3>
                    <button id="next-btn" class="btn btn-sm btn-secondary">&gt;</button>
                </div>
                <div class="calendar-view-toggle">
                    <button id="month-view-btn" class="btn btn-sm ${this.view === 'month' ? 'btn-primary' : 'btn-secondary'}">Month</button>
                    <button id="week-view-btn" class="btn btn-sm ${this.view === 'week' ? 'btn-primary' : 'btn-secondary'}">Week</button>
                </div>
            </div>
            <div id="calendar-grid-container"></div>
        `;
        this.container.innerHTML = `<div class="calendar-wrapper">${headerHTML}</div>`;
        
        this.addEventListeners();

        if (this.view === 'month') {
            await this.renderMonthView();
        } else {
            await this.renderWeekView();
        }
    },

    addEventListeners() {
        document.getElementById('prev-btn').onclick = () => this.navigate(-1);
        document.getElementById('next-btn').onclick = () => this.navigate(1);
        document.getElementById('month-view-btn').onclick = () => this.setView('month');
        document.getElementById('week-view-btn').onclick = () => this.setView('week');
    },

    setView(view) {
        this.view = view;
        this.render();
    },

    navigate(direction) {
        if (this.view === 'month') {
            this.viewDate.setMonth(this.viewDate.getMonth() + direction);
        } else {
            this.viewDate.setDate(this.viewDate.getDate() + (7 * direction));
        }
        this.render();
    },

    async renderWeekView() {
        const viewDate = new Date(this.viewDate.getTime());
        const startOfWeek = new Date(viewDate.setUTCDate(viewDate.getUTCDate() - viewDate.getUTCDay()));
        // Use local date for calculations

        const startOfWeek = new Date(viewDate);
        startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        document.getElementById('view-title').textContent = `${startOfWeek.toLocaleDateString('en-US', { timeZone: 'UTC' })} - ${endOfWeek.toLocaleDateString('en-US', { timeZone: 'UTC' })}`;
        const gridContainer = document.getElementById('calendar-grid-container');
        
        let gridHtml = '<div class="calendar-grid-week">';
        gridHtml += '<div class="time-ruler"><div class="day-header"></div>';
        for (let hour = 0; hour < 24; hour++) {
            gridHtml += `<div class="time-label">${hour.toString().padStart(2, '0')}:00</div>`;
        }
        gridHtml += '</div>';
        
        const today = this.getUTCToday();
        today.setUTCHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setUTCDate(startOfWeek.getUTCDate() + i);
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
            const isToday = date.getTime() === today.getTime();
            const dateString = date.toISOString().split('T')[0];
            
            gridHtml += `<div class="day-column ${isWeekend ? 'disabled' : ''} ${isToday ? 'today' : ''}" data-date="${dateString}">`;
            gridHtml += `<div class="day-header">${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} ${date.getUTCDate()}</div>`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = date.getTime() === today.getTime();
            const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            gridHtml += `<div class="day-column ${isWeekend ? 'disabled' : ''} ${isToday ? 'today' : ''}" data-date="${dateString}">`;
            gridHtml += `<div class="day-header">${date.toLocaleDateString('en-US', { weekday: 'short' })} ${date.getDate()}</div>`;
            for (let hour = 0; hour < 24; hour++) {
                gridHtml += `<div class="time-slot" data-hour="${hour}" style="grid-row: ${hour + 2}"></div>`;
            }
            gridHtml += '</div>';
        }
        gridHtml += '</div>';
        gridContainer.innerHTML = gridHtml;

        // Pass UTC dates to the RPC
        const fetchStart = new Date(startOfWeek);
        const fetchEnd = new Date(endOfWeek);
        await this.fetchAllEvents(fetchStart, fetchEnd, gridContainer.querySelector('.calendar-grid-week'));
    },

    async renderMonthView() {
        const firstDay = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
        const lastDay = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);

        document.getElementById('view-title').textContent = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
        const gridContainer = document.getElementById('calendar-grid-container');
        gridContainer.innerHTML = '<div class="calendar-grid-month"></div>';
        const grid = gridContainer.querySelector('.calendar-grid-month');

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let gridHtml = days.map(day => `<div class="day-header">${day}</div>`).join('');

        for (let i = 0; i < firstDay.getDay(); i++) gridHtml += '<div class="day-cell other-month"></div>';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const today = this.getUTCToday();
        today.setUTCHours(0, 0, 0, 0);

        for (let i = 1; i <= lastDay.getUTCDate(); i++) {
            const date = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), i));
            const dateString = date.toISOString().split('T')[0];
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), i);
            const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = date.getTime() === today.getTime();
            gridHtml += `<div class="day-cell ${isWeekend ? 'disabled' : ''} ${isToday ? 'today' : ''}" data-date="${dateString}"><div class="day-number">${i}</div><div class="events-list"></div></div>`;
        }
        grid.innerHTML = gridHtml;

        const fetchStart = new Date(firstDay);
        const fetchEnd = new Date(lastDay);
        await this.fetchAllEvents(fetchStart, fetchEnd, grid);
    },

    async fetchAllEvents(start, end, grid) {
        // 1. Fetch appointments and associated course data. User data (names) will be fetched separately.
        const appointmentColumns = '*, course:course_id(course_name)';
        let appointmentQuery = this.supabase.from('appointments_enhanced').select(appointmentColumns)
            .gte('start_time', start.toISOString())
            .lte('start_time', end.toISOString());

        // 2. Filter appointments based on the current user's role.
        if (this.currentUser.role === 'Student') {
            appointmentQuery = appointmentQuery.eq('student_id', this.currentUser.user_id);
        } else if (this.currentUser.role === 'Tutor') {
            appointmentQuery = appointmentQuery.eq('tutor_id', this.tutorId || this.currentUser.user_id);
        } // Admins and Super Admins see all appointments in the date range.

        // 3. Concurrently fetch appointments, system events, and working hours and time-off.

        // 2. Filter appointments based on the current user's role.
        if (this.currentUser.role === 'Student') {
            appointmentQuery = appointmentQuery.eq('student_id', this.currentUser.user_id);
        } else if (this.currentUser.role === 'Tutor') {
            appointmentQuery = appointmentQuery.eq('tutor_id', this.tutorId || this.currentUser.user_id);
        } // Admins and Super Admins see all appointments in the date range.

        // 3. Concurrently fetch appointments, system events, and (for week view) working hours.
        const promises = [
            appointmentQuery,
            this.supabase.from('system_events').select('*').gte('start_date', start.toISOString().split('T')[0]).lte('end_date', end.toISOString().split('T')[0])
        ];

        const targetTutorId = this.tutorId || (this.currentUser.role === 'Tutor' ? this.currentUser.user_id : null);
        if (targetTutorId) {
            promises.push(this.supabase.from('working_hours').select('*').eq('tutor_id', targetTutorId));
            promises.push(this.supabase.from('time_off_requests').select('*').eq('tutor_id', targetTutorId).eq('status', 'Approved').gte('end_date', start.toISOString().split('T')[0]).lte('start_date', end.toISOString().split('T')[0]));
        }

        const [appointmentsRes, systemEventsRes, workingHoursRes, timeOffRes] = await Promise.all(promises);

        if (appointmentsRes.error) {
            console.error("Error fetching appointments:", appointmentsRes.error);
            return;
        }

        if (this.view === 'week' && targetTutorId) {
            promises.push(this.supabase.from('working_hours').select('*').eq('tutor_id', targetTutorId));
        }

        const [appointmentsRes, systemEventsRes, workingHoursRes] = await Promise.all(promises);

        if (appointmentsRes.error) {
            console.error("Error fetching appointments:", appointmentsRes.error);
            return;
        }

        const appointments = appointmentsRes.data || [];
        const systemEvents = systemEventsRes.data || [];
        const workingHours = workingHoursRes ? workingHoursRes.data || [] : [];
        const timeOffRequests = timeOffRes ? timeOffRes.data || [] : [];

        // ... (existing code for rendering appointments) ...
        // 4. Collect all unique student and tutor IDs from the fetched appointments.
        const userIds = new Set();
        appointments.forEach(appt => {
            if (appt.student_id) userIds.add(appt.student_id);
            if (appt.tutor_id) userIds.add(appt.tutor_id);
        });

        // 5. Fetch all required user details in a single, secure RPC call.
        const userMap = new Map();
        if (userIds.size > 0) {
            // Supabase RPC expects array parameters in a specific string format: '{val1,val2,val3}'
            const ids = `{${[...userIds].join(',')}}`;
            const { data: users, error: usersError } = await this.supabase
                .rpc('get_users_by_ids', { p_user_ids: ids });

            if (usersError) {
                console.error("PULL ERROR: Failed to fetch user names.", usersError);
            } else if (users) {
                console.log('PULL SUCCESS: Fetched user data:', users);
                users.forEach(u => userMap.set(u.user_id, u));
            }
        }

        try {
            // 6. Augment appointment objects with full names and correct course name.
            const finalAppointments = appointments.map(appt => {
                const student = userMap.get(appt.student_id);
                const tutor = userMap.get(appt.tutor_id);
                return {
                    ...appt,
                    student_full_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
                    tutor_full_name: tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Tutor no longer available',
                    course_name: appt.course?.course_name || 'N/A'
                };
            });

            // Render appointments on the grid...
            finalAppointments.forEach(appt => {
                const apptStart = new Date(appt.start_time);
                const dateStr = `${apptStart.getFullYear()}-${(apptStart.getMonth() + 1).toString().padStart(2, '0')}-${apptStart.getDate().toString().padStart(2, '0')}`;
                const cell = grid.querySelector(`[data-date="${dateStr}"]`);
                if (!cell) return;

                if (this.view === 'month') {
                    const list = cell.querySelector('.events-list');
                    if (list) {
                        const eventItem = document.createElement('div');
                        eventItem.className = `event-item ${appt.status.toLowerCase()}`;
                        const displayName = this.getAppointmentDisplayName(appt);
                        eventItem.textContent = displayName;
                        eventItem.dataset.id = appt.appointment_id;
                        list.appendChild(eventItem);
                    }
                } else { // week view
                    const apptEnd = new Date(appt.end_time);
                    const startHour = apptStart.getHours();
                    const dayColumn = grid.querySelector(`[data-date="${dateStr}"]`);

                    if (dayColumn) {
                        const startSlot = dayColumn.querySelector(`[data-hour="${startHour}"]`);
                        if (startSlot) {
                            const block = document.createElement('div');
                            block.className = `event-block ${appt.status.toLowerCase()}`;
                            const duration = (apptEnd.getTime() - apptStart.getTime()) / (1000 * 60 * 60);
                            block.style.height = `calc(var(--time-slot-height) * ${duration})`;
                            const startHourLocal = apptStart.getHours().toString().padStart(2, '0');
                            const startMinuteLocal = apptStart.getMinutes().toString().padStart(2, '0');
                            const displayName = this.getAppointmentDisplayName(appt);
                            block.innerHTML = `<strong>${displayName}</strong><br>${startHourLocal}:${startMinuteLocal}`;
                            block.dataset.id = appt.appointment_id;
                            startSlot.appendChild(block);
                        }
                    }
                }
            });

            // Add delegated event listener for appointment clicks
            grid.addEventListener('click', (e) => {
                const eventEl = e.target.closest('.event-item, .event-block');
                if (eventEl && eventEl.dataset.id) {
                    const clickedAppt = finalAppointments.find(a => a.appointment_id.toString() === eventEl.dataset.id);
                    if (clickedAppt) {
                        this.onAppointmentClick(clickedAppt);
                    }
                }
            });
        } catch (e) {
            console.error("Error processing or rendering appointments:", e);
        }

        // Render System Events
        systemEvents.forEach(event => {
            const evStart = this.toUTCDate(event.start_date);
            const evEnd = this.toUTCDate(event.end_date);
            for (let d = new Date(evStart); d <= evEnd; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const cell = grid.querySelector(`[data-date="${dateStr}"]`);
                if (cell) {
                    cell.classList.add('system-event', 'disabled');
                    if (this.view === 'month') {
                        const list = cell.querySelector('.events-list');
                        if (list) list.innerHTML += `<div class="event-item system-event-label">${event.name}</div>`;
                    } else {
                        const label = document.createElement('div');
                        label.className = 'event-block system-event-week';
                        label.textContent = event.name;
                        label.style.gridRow = '2 / span 1';
                        cell.appendChild(label);
                    }
                }
            }
        });

        // Render Time Off Requests
        timeOffRequests.forEach(request => {
            const reqStart = this.toUTCDate(request.start_date);
            const reqEnd = this.toUTCDate(request.end_date);
            for (let d = new Date(reqStart); d <= reqEnd; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const cell = grid.querySelector(`[data-date="${dateStr}"]`);
                if (cell) {
                    cell.classList.add('time-off-event', 'disabled');
                    if (this.view === 'month') {
                        const list = cell.querySelector('.events-list');
                        if (list) list.innerHTML += `<div class="event-item time-off-label">Time Off</div>`;
                    } else {
                        const label = document.createElement('div');
                        label.className = 'event-block system-event-week time-off-label';
                        label.textContent = 'Time Off';
                        label.style.gridRow = '2 / span 1';
                        cell.appendChild(label);
                    }
                }
            }
        });

        // 4. Collect all unique student and tutor IDs from the fetched appointments.
        const userIds = new Set();
        appointments.forEach(appt => {
            if (appt.student_id) userIds.add(appt.student_id);
            if (appt.tutor_id) userIds.add(appt.tutor_id);
        });

        // 5. Fetch all required user details in a single, secure RPC call.
        const userMap = new Map();
        if (userIds.size > 0) {
            // Supabase RPC expects array parameters in a specific string format: '{val1,val2,val3}'
            const ids = `{${[...userIds].join(',')}}`;
            const { data: users, error: usersError } = await this.supabase
                .rpc('get_users_by_ids', { p_user_ids: ids });

            if (usersError) {
                console.error("PULL ERROR: Failed to fetch user names.", usersError);
            } else if (users) {
                console.log('PULL SUCCESS: Fetched user data:', users);
                users.forEach(u => userMap.set(u.user_id, u));
            }
        }

        try {
            // 6. Augment appointment objects with full names and correct course name.
            const finalAppointments = appointments.map(appt => {
                const student = userMap.get(appt.student_id);
                const tutor = userMap.get(appt.tutor_id);
                return {
                    ...appt,
                    student_full_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
                    tutor_full_name: tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Tutor no longer available',
                    course_name: appt.course?.course_name || 'N/A'
                };
            });

            // Render appointments on the grid...
            finalAppointments.forEach(appt => {
                const apptStart = this.toUTCDate(appt.start_time);
                const dateStr = apptStart.toISOString().split('T')[0];
                const cell = grid.querySelector(`[data-date="${dateStr}"]`);
                if (!cell) return;

                if (this.view === 'month') {
                    const list = cell.querySelector('.events-list');
                    if (list) {
                        const eventItem = document.createElement('div');
                        eventItem.className = `event-item ${appt.status.toLowerCase()}`;
                        const displayName = this.getAppointmentDisplayName(appt);
                        eventItem.textContent = displayName;
                        eventItem.dataset.id = appt.appointment_id;
                        list.appendChild(eventItem);
                    }
                } else { // week view
                    const apptEnd = this.toUTCDate(appt.end_time);
                    const startHour = apptStart.getUTCHours();
                    const dayColumn = grid.querySelector(`[data-date="${dateStr}"]`);

                    if (dayColumn) {
                        const startSlot = dayColumn.querySelector(`[data-hour="${startHour}"]`);
                        if (startSlot) {
                            const block = document.createElement('div');
                            block.className = `event-block ${appt.status.toLowerCase()}`;
                            // Appointment lasts 30 minutes, which is half of one hour row (40px)
                            block.style.height = '20px'; 
                            block.style.marginTop = apptStart.getUTCMinutes() === 30 ? '20px' : '0px';
                            
                            const startHourLocal = apptStart.getUTCHours().toString().padStart(2, '0');
                            const startMinuteLocal = apptStart.getUTCMinutes().toString().padStart(2, '0');
                            const displayName = this.getAppointmentDisplayName(appt);
                            block.innerHTML = `<strong>${displayName}</strong> ${startHourLocal}:${startMinuteLocal}`;
                            block.dataset.id = appt.appointment_id;
                            startSlot.appendChild(block);
                        }
                    }
                }
            });

            // Add delegated event listener for appointment clicks
            grid.addEventListener('click', (e) => {
                const eventEl = e.target.closest('.event-item, .event-block');
                if (eventEl && eventEl.dataset.id) {
                    const clickedAppt = finalAppointments.find(a => a.appointment_id.toString() === eventEl.dataset.id);
                    if (clickedAppt) {
                        this.onAppointmentClick(clickedAppt);
                    }
                }
            });
        } catch (e) {
            console.error("Error processing or rendering appointments:", e);
        }

        // Render System Events
        systemEvents.forEach(event => {
            const evStart = this.toUTCDate(event.start_date);
            const evEnd = this.toUTCDate(event.end_date);
            for (let d = new Date(evStart); d <= evEnd; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const cell = grid.querySelector(`[data-date="${dateStr}"]`);
                if (cell) {
                    cell.classList.add('system-event', 'disabled');
                    if (this.view === 'month') {
                        const list = cell.querySelector('.events-list');
                        if (list) list.innerHTML += `<div class="event-item system-event-label">${event.name}</div>`;
                    } else {
                        const label = document.createElement('div');
                        label.className = 'event-block system-event-week';
                        label.textContent = event.name;
                        label.style.gridRow = '2 / span 1';
                        cell.appendChild(label);
                    }
                }
            }
        });

        // Render Working Hours for Tutors
        if (this.view === 'week' && workingHours.length > 0) {
            workingHours.forEach(wh => {
                const dayCols = grid.querySelectorAll(`.day-column`);
                dayCols.forEach(col => {
                    const date = new Date(col.dataset.date + 'T00:00:00.000Z');
                    if (date.getUTCDay() === wh.day_of_week && !col.classList.contains('system-event')) {
                        const startH = parseInt(wh.start_time.split(':')[0]);
                        const endH = parseInt(wh.end_time.split(':')[0]);
                        for (let h = startH; h < endH; h++) {
                            const slot = col.querySelector(`[data-hour="${h}"]`);
                            if (slot) slot.classList.add('working-hours');
                        }
                    }
                });
            });
        }
    },

    getAppointmentDisplayName(appt) {
        // This is a fallback. The main implementation is in script.js
        if (this.currentUser.role === 'Tutor') {
            return appt.student_full_name || 'Unknown Student';
        } else {
            return appt.tutor_full_name || 'Tutor no longer available';
        }
    },
};
