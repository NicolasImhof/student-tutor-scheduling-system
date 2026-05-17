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

        // Calculate start of week, ensuring it handles UTC correctly
        const startOfWeek = new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), viewDate.getUTCDate()));
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay() + (startOfWeek.getUTCDay() === 0 ? -6 : 1)); // Adjust so Monday is the first day
        startOfWeek.setUTCHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
        endOfWeek.setUTCHours(23, 59, 59, 999);

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
        const firstDay = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), 1));
        const lastDay = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth() + 1, 0));
        lastDay.setUTCHours(23, 59, 59, 999);

        document.getElementById('view-title').textContent = firstDay.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        const gridContainer = document.getElementById('calendar-grid-container');
        gridContainer.innerHTML = '<div class="calendar-grid-month"></div>';
        const grid = gridContainer.querySelector('.calendar-grid-month');

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let gridHtml = days.map(day => `<div class="day-header">${day}</div>`).join('');

        for (let i = 0; i < firstDay.getDay(); i++) gridHtml += '<div class="day-cell other-month"></div>';



        const today = this.getUTCToday();
        today.setUTCHours(0, 0, 0, 0);

        for (let i = 1; i <= lastDay.getUTCDate(); i++) {
            const date = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), i));
            const dateString = date.toISOString().split('T')[0];
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

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



        // 3. Concurrently fetch appointments, system events, and working hours and time-off.
        const promises = [
            appointmentQuery,
            this.supabase.from('system_events').select('*').gte('start_date', start.toISOString().split('T')[0]).lte('end_date', end.toISOString().split('T')[0]),
            this.supabase.from('working_hours').select('*'),
            this.supabase.from('time_off_requests').select('*').eq('status', 'Approved')
        ];

        const [appointmentsRes, systemEventsRes, workingHoursRes, timeOffRes] = await Promise.all(promises);

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
            const dateStr = apptStart.toISOString().split('T')[0];;
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
                    const dateStr = apptStart.toISOString().split('T')[0];
                    const dayColumn = grid.querySelector(`[data-date="${dateStr}"]`);

                    if (dayColumn) {
                        const startHour = apptStart.getUTCHours();
                        const startSlot = dayColumn.querySelector(`[data-hour="${startHour}"]`);
                        if (startSlot) {
                            const block = document.createElement('div');
                            block.className = `event-block ${appt.status.toLowerCase()}`;
                            
                            const durationInHours = (apptEnd.getTime() - apptStart.getTime()) / (1000 * 60 * 60);
                            const startMinutes = apptStart.getUTCMinutes();
                            
                            block.style.height = `calc(var(--time-slot-height) * ${durationInHours})`;
                            block.style.top = `calc(var(--time-slot-height) * (${startMinutes} / 60))`;
                            block.style.position = 'absolute';
                            block.style.width = '100%';
                            
                            const displayName = this.getAppointmentDisplayName(appt);
                            block.innerHTML = `<strong>${displayName}</strong>`;
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

        // Render Time Off Requests (only for current tutor if viewing their schedule)
        const tutorTimeOff = timeOffRequests.filter(req => req.tutor_id === (this.tutorId || this.currentUser.user_id));
        tutorTimeOff.forEach(request => {
            const reqStart = this.toUTCDate(request.start_date);
            const reqEnd = this.toUTCDate(request.end_date);
            for (let d = new Date(reqStart); d <= reqEnd; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const cell = grid.querySelector(`[data-date="${dateStr}"]`);
                if (cell) {
                    cell.classList.add('time-off-event', 'disabled');
                    if (this.view === 'month') {
                        const list = cell.querySelector('.events-list');
                        if (list) list.innerHTML += `<div class="event-item time-off-label" style="background-color: yellow; color: black;">Time Off</div>`;
                    } else {
                        const label = document.createElement('div');
                        label.className = 'event-block system-event-week time-off-label';
                        label.textContent = 'Time Off';
                        label.style.gridRow = '2 / span 1';
                        label.style.backgroundColor = 'yellow';
                        label.style.color = 'black';
                        cell.appendChild(label);
                    }
                }
            }
        });

        // Render Working Hours
        if (this.view === 'week') {
            const tutorWorkingHours = workingHours.filter(wh => wh.tutor_id === (this.tutorId || this.currentUser.user_id));
            tutorWorkingHours.forEach(wh => {
                // Find column for this day of week (Monday=1, Sunday=0)
                const dayOffset = wh.day_of_week === 0 ? 6 : wh.day_of_week - 1;
                const date = new Date(start);
                date.setUTCDate(start.getUTCDate() + dayOffset);
                const dateStr = date.toISOString().split('T')[0];
                const column = grid.querySelector(`[data-date="${dateStr}"]`);
                
                if (column && wh.is_working) {
                    const startHour = parseInt(wh.start_time.split(':')[0]);
                    const endHour = parseInt(wh.end_time.split(':')[0]);
                    for (let h = startHour; h < endHour; h++) {
                        const slot = column.querySelector(`[data-hour="${h}"]`);
                        if (slot) slot.classList.add('working-hour');
                    }
                }
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
