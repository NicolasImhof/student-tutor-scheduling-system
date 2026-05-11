window.Calendar = {
    supabase: null,
    currentUser: null,
    tutorId: null, 
    view: 'month', // 'month' or 'week'
    container: null,
    viewDate: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),

    init(currentUser, tutorId, supabase, view, container) {
        this.currentUser = currentUser;
        this.tutorId = tutorId;
        this.supabase = supabase;
        this.view = view || 'week'; // Default to week view
        this.container = container;
        this.render();
    },

    async render() {
        const headerHTML = `
            <div class="calendar-header">
                 <div class="calendar-nav">
                    <button id="prev-btn">&lt;</button>
                    <h3 id="view-title"></h3>
                    <button id="next-btn">&gt;</button>
                </div>
                <div class="calendar-view-toggle">
                    <button id="month-view-btn" class="${this.view === 'month' ? 'active' : ''}">Month</button>
                    <button id="week-view-btn" class="${this.view === 'week' ? 'active' : ''}">Week</button>
                </div>
            </div>
            <div id="calendar-grid-container"></div>
        `;
        this.container.innerHTML = `<div class="calendar-container">${headerHTML}</div>`;
        
        this.addEventListeners();

        if (this.view === 'month') {
            this.renderMonthView();
        } else {
            this.renderWeekView();
        }
    },

    addEventListeners() {
        document.getElementById('prev-btn').addEventListener('click', () => this.navigate(-1));
        document.getElementById('next-btn').addEventListener('click', () => this.navigate(1));
        document.getElementById('month-view-btn').addEventListener('click', () => this.setView('month'));
        document.getElementById('week-view-btn').addEventListener('click', () => this.setView('week'));
    },

    setView(view) {
        this.view = view;
        this.render();
    },

    navigate(direction) {
        if (this.view === 'month') {
            this.viewDate.setUTCMonth(this.viewDate.getUTCMonth() + direction);
        } else {
            this.viewDate.setUTCDate(this.viewDate.getUTCDate() + (7 * direction));
        }
        this.render();
    },

    async renderWeekView() {
        const startOfWeek = new Date(this.viewDate);
        startOfWeek.setUTCDate(this.viewDate.getUTCDate() - this.viewDate.getUTCDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

        document.getElementById('view-title').textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        const gridContainer = document.getElementById('calendar-grid-container');
        
        // Create the grid structure
        let gridHtml = '<div class="calendar-grid-week">';
        
        // Add time ruler (first column)
        gridHtml += '<div class="time-ruler">';
        gridHtml += '<div class="day-header"></div>'; // Empty corner cell
        for (let hour = 0; hour < 24; hour++) {
            gridHtml += `<div class="time-label">${hour}:00</div>`;
        }
        gridHtml += '</div>';
        
        // Add day columns
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setUTCDate(startOfWeek.getUTCDate() + i);
            days.push(date);
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
            const dateString = date.toISOString().split('T')[0];
            
            gridHtml += `<div class="day-column ${isWeekend ? 'disabled' : ''}" data-date="${dateString}">`;
            gridHtml += `<div class="day-header">${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} ${date.getUTCDate()}</div>`;
            
            // The rest of the column is for events, and the time-slots are just for visual lines
            for (let hour = 0; hour < 24; hour++) {
                gridHtml += `<div class="time-slot" style="grid-row: ${hour + 2}"></div>`;
            }
            gridHtml += '</div>';
        }
        gridHtml += '</div>';
        gridContainer.innerHTML = gridHtml;

        await this.fetchAllEvents(startOfWeek, endOfWeek, gridContainer.querySelector('.calendar-grid-week'));
    },

    async renderMonthView() {
        document.getElementById('view-title').textContent = new Date(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth()).toLocaleString('default', { month: 'long', year: 'numeric' });
        const gridContainer = document.getElementById('calendar-grid-container');
        gridContainer.innerHTML = '<div class="calendar-grid-month"></div>';
        const grid = gridContainer.querySelector('.calendar-grid-month');

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let gridHtml = days.map(day => `<div class="day-header">${day}</div>`).join('');

        const firstDay = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), 1));
        const lastDay = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth() + 1, 0));

        // Add blank cells for days before the 1st of the month
        for (let i = 0; i < firstDay.getUTCDay(); i++) {
            gridHtml += '<div class="day-cell other-month"></div>';
        }

        // Add cells for each day of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), i));
            const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
            gridHtml += `<div class="day-cell ${isToday ? 'today' : ''} ${isWeekend ? 'disabled' : ''}" data-date="${date.toISOString().split('T')[0]}"><div class="day-number">${i}</div><div class="events-list"></div></div>`;
        }

        // Add blank cells for days after the end of the month
        const lastDayOfWeek = lastDay.getUTCDay();
        for (let i = lastDayOfWeek; i < 6; i++) {
            gridHtml += '<div class="day-cell other-month"></div>';
        }

        grid.innerHTML = gridHtml;

        await this.fetchAllEvents(firstDay, lastDay, grid);
    },

    async fetchAllEvents(start, end, grid) {
        // Fetch all data in parallel
        const promises = [
            this.supabase.rpc('get_appointments_for_calendar', { start_date: start.toISOString(), end_date: end.toISOString() }),
            this.supabase.rpc('get_events_for_month', { p_year: start.getFullYear(), p_month: start.getMonth() + 1 })
        ];

        if (this.tutorId) {
            promises.push(this.supabase.rpc('get_working_hours_for_tutor', { tutor_id_in: this.tutorId }));
        } else {
            promises.push(Promise.resolve({ data: [] })); // Add an empty promise to maintain array structure
        }

        const [appointmentsRes, systemEventsRes, workingHoursRes] = await Promise.all(promises);

        console.log('--- DEBUGGING SYSTEM EVENTS ---');
        console.log('1. Raw Supabase Response:', JSON.stringify(systemEventsRes, null, 2));

        const systemEvents = systemEventsRes.data || [];
        const appointments = appointmentsRes.data || [];
        
        console.log('2. Extracted Events Array:', JSON.stringify(systemEvents, null, 2));
        console.log('3. Appointments Array:', JSON.stringify(appointments, null, 2));

        // Clear previous events
        grid.querySelectorAll('.event-block, .system-event-label').forEach(el => el.remove());
        grid.querySelectorAll('.system-event').forEach(el => el.classList.remove('system-event', 'disabled'));

        // Create a set of dates with system events for quick lookup
        const eventDates = new Set();
        systemEvents.forEach(event => {
            const startDate = new Date(event.start_date + 'T00:00:00Z');
            const endDate = new Date(event.end_date + 'T00:00:00Z');

            for (let d = startDate; d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                eventDates.add(d.toISOString().split('T')[0]);
            }
        });

        // Render System Events (Holidays)
        systemEvents.forEach(event => {
            const startDate = new Date(event.start_date + 'T00:00:00Z');
            const endDate = new Date(event.end_date + 'T00:00:00Z');

            for (let d = startDate; d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                const dateString = d.toISOString().split('T')[0];
                if (this.view === 'month') {
                    const dayCell = grid.querySelector(`.day-cell[data-date="${dateString}"]`);
                    if (dayCell) {
                        dayCell.classList.add('disabled', 'system-event');
                        const eventsList = dayCell.querySelector('.events-list');
                        if (eventsList) {
                            const eventBlock = document.createElement('div');
                            eventBlock.className = 'event-item system-event-label';
                            eventBlock.textContent = event.name;
                            eventsList.appendChild(eventBlock);
                        }
                    }
                } else { // Week view
                    const dayColumn = grid.querySelector(`.day-column[data-date="${dateString}"]`);
                    if (dayColumn) {
                        dayColumn.classList.add('disabled', 'system-event');
                        const eventBlock = document.createElement('div');
                        eventBlock.className = 'event-block system-event-week';
                        eventBlock.textContent = event.name;
                        // Position the event at the top of the time grid (after the header)
                        eventBlock.style.gridRow = '2 / span 1';
                        // Add tooltip with event details
                        eventBlock.title = `${event.name}\n${event.start_date} to ${event.end_date}`;
                        dayColumn.appendChild(eventBlock);
                    }
                }
            }
        });

        // Render Appointments (skip dates with system events)
        if (this.view === 'month') {
            appointments.forEach(appt => {
                const appointmentDate = appt.start_time.split('T')[0];
                // Skip appointments on dates with system events
                if (eventDates.has(appointmentDate)) return;
                
                const dayCell = grid.querySelector(`.day-cell[data-date="${appointmentDate}"] .events-list`);
                if (!dayCell) return;

                const eventBlock = document.createElement('div');
                eventBlock.className = `event-item ${appt.status || 'scheduled'}`;
                eventBlock.textContent = `${appt.tutor_first_name} & ${appt.student_first_name}`;
                dayCell.appendChild(eventBlock);
            });
        } else { // Week view rendering
            appointments.forEach(appt => {
                const appointmentDate = appt.start_time.split('T')[0];
                // Skip appointments on dates with system events
                if (eventDates.has(appointmentDate)) return;
                
                const dayColumn = grid.querySelector(`.day-column[data-date="${appointmentDate}"]`);
                if (!dayColumn) return;

                const apptStart = new Date(appt.start_time);
                const apptEnd = new Date(appt.end_time);
                
                const startRow = Math.floor((apptStart.getUTCHours() * 60 + apptStart.getUTCMinutes()) / 60) + 2; // +2 to account for header row
                const endRow = Math.ceil((apptEnd.getUTCHours() * 60 + apptEnd.getUTCMinutes()) / 60) + 2;

                const eventBlock = document.createElement('div');
                eventBlock.className = `event-block ${appt.status || 'scheduled'}`;
                eventBlock.style.gridRowStart = startRow;
                eventBlock.style.gridRowEnd = endRow;
                eventBlock.innerHTML = `<strong>${appt.tutor_first_name} & ${appt.student_first_name}</strong><br>${apptStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})}`;
                dayColumn.appendChild(eventBlock);
            });

            // Render Tutor Availability (skip dates with system events)
            const workingHours = workingHoursRes.data || [];
            workingHours.forEach(wh => {
                const dayColumns = grid.querySelectorAll(`.day-column`);
                dayColumns.forEach(dayColumn => {
                    const date = new Date(dayColumn.dataset.date + 'T00:00:00Z');
                    const dateString = date.toISOString().split('T')[0];
                    
                    // Skip dates with system events
                    if (eventDates.has(dateString)) return;
                    
                    if (date.getUTCDay() == wh.day_of_week) {
                        const start = new Date('1970-01-01T' + wh.start_time + 'Z');
                        const end = new Date('1970-01-01T' + wh.end_time + 'Z');
                        
                        for (let hour = start.getUTCHours(); hour < end.getUTCHours(); hour++) {
                            const timeSlot = dayColumn.querySelector(`[style="grid-row: ${hour + 2}"]`);
                            if (timeSlot) {
                                timeSlot.classList.add('working-hours');
                            }
                        }
                    }
                });
            });
        }

        // Render Tutor Availability (if applicable)
        if (this.view === 'my-availability' || this.view === 'calendar-management') {
            // This logic needs to be more sophisticated, creating available slots
            // based on working hours and subtracting appointments and system events.
        }
    }
};