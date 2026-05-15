window.Calendar = {
    supabase: null,
    currentUser: null,
    tutorId: null, 
    view: 'week', // 'month' or 'week'
    container: null,
    viewDate: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),
    onAppointmentClick: null,

    init(currentUser, tutorId, supabase, view, container, onAppointmentClick) {
        this.currentUser = currentUser;
        this.tutorId = tutorId; // This is for specific tutor booking view
        this.supabase = supabase;
        this.view = view || 'week';
        this.container = container;
        this.onAppointmentClick = onAppointmentClick;
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
        endOfWeek.setUTCHours(23, 59, 59, 999);

        document.getElementById('view-title').textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
        const gridContainer = document.getElementById('calendar-grid-container');
        
        let gridHtml = '<div class="calendar-grid-week">';
        gridHtml += '<div class="time-ruler"><div class="day-header"></div>';
        for (let hour = 0; hour < 24; hour++) {
            gridHtml += `<div class="time-label">${hour.toString().padStart(2, '0')}:00</div>`;
        }
        gridHtml += '</div>';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setUTCDate(startOfWeek.getUTCDate() + i);
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
            const dateString = date.toISOString().split('T')[0];
            
            gridHtml += `<div class="day-column ${isWeekend ? 'disabled' : ''}" data-date="${dateString}">`;
            gridHtml += `<div class="day-header">${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })} ${date.getUTCDate()}</div>`;
            for (let hour = 0; hour < 24; hour++) {
                gridHtml += `<div class="time-slot" data-hour="${hour}" style="grid-row: ${hour + 2}"></div>`;
            }
            gridHtml += '</div>';
        }
        gridHtml += '</div>';
        gridContainer.innerHTML = gridHtml;

        await this.fetchAllEvents(startOfWeek, endOfWeek, gridContainer.querySelector('.calendar-grid-week'));
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

        for (let i = 0; i < firstDay.getUTCDay(); i++) gridHtml += '<div class="day-cell other-month"></div>';

        for (let i = 1; i <= lastDay.getUTCDate(); i++) {
            const date = new Date(Date.UTC(this.viewDate.getUTCFullYear(), this.viewDate.getUTCMonth(), i));
            const dateString = date.toISOString().split('T')[0];
            const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
            gridHtml += `<div class="day-cell ${isWeekend ? 'disabled' : ''}" data-date="${dateString}"><div class="day-number">${i}</div><div class="events-list"></div></div>`;
        }
        grid.innerHTML = gridHtml;

        await this.fetchAllEvents(firstDay, lastDay, grid);
    },

    async fetchAllEvents(start, end, grid) {
        // Prepare filtering params for the new RPC
        const rpcParams = {
            start_date_in: start.toISOString(),
            end_date_in: end.toISOString(),
            p_user_id: this.currentUser.user_id,
            p_role: this.currentUser.role,
            p_category: this.currentUser.category
        };

        // If we are in a booking view for a specific tutor, override the filter
        if (this.tutorId) {
            rpcParams.p_user_id = this.tutorId;
            rpcParams.p_role = 'Tutor';
        }

        const promises = [
            this.supabase.rpc('get_calendar_appointments', rpcParams),
            this.supabase.rpc('get_calendar_events', {
                p_start_date: start.toISOString().split('T')[0],
                p_end_date: end.toISOString().split('T')[0],
                p_user_role: this.currentUser.role,
                p_user_category: this.currentUser.category
            })
        ];

        // Fetch working hours if looking at a specific tutor or if current user is a tutor
        const targetTutorId = this.tutorId || (this.currentUser.role === 'Tutor' ? this.currentUser.user_id : null);
        if (targetTutorId) {
            promises.push(this.supabase.rpc('get_working_hours_for_tutor', { tutor_id_in: targetTutorId }));
        }

        const [appointmentsRes, systemEventsRes, workingHoursRes] = await Promise.all(promises);
        const appointments = appointmentsRes.data || [];
        const systemEvents = systemEventsRes.data || [];
        const workingHours = workingHoursRes ? workingHoursRes.data || [] : [];


        // Render System Events
        systemEvents.forEach(event => {
            const evStart = new Date(event.start_date + 'T00:00:00Z');
            const evEnd = new Date(event.end_date + 'T00:00:00Z');
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

        // Render Appointments
        appointments.forEach(appt => {
            const apptStart = new Date(appt.start_time);
            const dateStr = apptStart.toISOString().split('T')[0];
            const cell = grid.querySelector(`[data-date="${dateStr}"]`);
            if (!cell || cell.classList.contains('system-event')) return;

            if (this.view === 'month') {
                const list = cell.querySelector('.events-list');
                if (list) {
                    const eventItem = document.createElement('div');
                    eventItem.className = `event-item ${appt.status.toLowerCase()}`;
                    eventItem.textContent = `${appt.tutor_first_name} & ${appt.student_first_name}`;
                    eventItem.onclick = () => this.onAppointmentClick(appt);
                    list.appendChild(eventItem);
                }
            } else {
                const apptEnd = new Date(appt.end_time);
                const startRow = Math.max(2, apptStart.getUTCHours() - 8 + 2);
                const endRow = Math.min(15, apptEnd.getUTCHours() - 8 + 2);
                if (startRow >= 15 || endRow <= 2) return;

                const block = document.createElement('div');
                block.className = `event-block ${appt.status.toLowerCase()}`;
                block.style.gridRow = `${startRow} / ${endRow}`;
                block.innerHTML = `<strong>${appt.tutor_first_name}</strong><br>${apptStart.getUTCHours()}:00`;
                block.onclick = () => this.onAppointmentClick(appt);
                cell.appendChild(block);
            }
        });

        // Render Working Hours for Tutors
        if (this.view === 'week' && workingHours.length > 0) {
            workingHours.forEach(wh => {
                const dayCols = grid.querySelectorAll(`.day-column`);
                dayCols.forEach(col => {
                    const date = new Date(col.dataset.date + 'T00:00:00Z');
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
};
