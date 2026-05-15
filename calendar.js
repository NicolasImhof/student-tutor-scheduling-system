window.Calendar = {
    supabase: null,
    currentUser: null,
    tutorId: null, 
    view: 'week', // 'month' or 'week'
    container: null,
    viewDate: new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z'),
    onAppointmentClick: null,
    getAppointmentDisplayName: null,

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
        // Use local date for calculations
        const viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), this.viewDate.getDate());
        const startOfWeek = new Date(viewDate);
        startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

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
            date.setDate(startOfWeek.getDate() + i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            gridHtml += `<div class="day-column ${isWeekend ? 'disabled' : ''}" data-date="${dateString}">`;
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

        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), i);
            const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            gridHtml += `<div class="day-cell ${isWeekend ? 'disabled' : ''}" data-date="${dateString}"><div class="day-number">${i}</div><div class="events-list"></div></div>`;
        }
        grid.innerHTML = gridHtml;

        const fetchStart = new Date(firstDay);
        const fetchEnd = new Date(lastDay);
        await this.fetchAllEvents(fetchStart, fetchEnd, grid);
    },

    async fetchAllEvents(start, end, grid) {
        // Prepare filtering params for the new RPC
        const rpcParams = {
            start_date_in: start.toISOString(),
            end_date_in: end.toISOString(),
            p_user_id: this.currentUser.user_id,
            p_role: this.currentUser.role
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

        // As per the user's direction, we will replicate the logic from the working `renderMyReviews` function.
        let tutorMap = {};
        const { data: tutors, error: tutorsError } = await this.supabase.rpc('get_student_tutor_list');
        if (tutorsError) {
            console.error("Could not fetch tutor list:", tutorsError);
        } else {
            tutors.forEach(t => {
                tutorMap[t.user_id] = t;
            });
        }

        const finalAppointments = appointments.map(appt => {
            const tutor = tutorMap[appt.tutor_id];
            return {
                ...appt,
                tutor_first_name: tutor ? tutor.first_name : 'Tutor',
                tutor_last_name: tutor ? tutor.last_name : 'N/A',
            };
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
        finalAppointments.forEach(appt => {
            const apptStart = new Date(appt.start_time); // Date from DB is UTC
            const dateStr = `${apptStart.getFullYear()}-${(apptStart.getMonth() + 1).toString().padStart(2, '0')}-${apptStart.getDate().toString().padStart(2, '0')}`;
            const cell = grid.querySelector(`[data-date="${dateStr}"]`);
            if (!cell || cell.classList.contains('system-event')) return;

            if (this.view === 'month') {
                const list = cell.querySelector('.events-list');
                if (list) {
                    const eventItem = document.createElement('div');
                    eventItem.className = `event-item ${appt.status.toLowerCase()}`;
                    eventItem.textContent = this.getAppointmentDisplayName(appt);
                    eventItem.dataset.id = appt.appointment_id;
                    list.appendChild(eventItem);
                }
            } else {
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
                        block.innerHTML = `<strong>${this.getAppointmentDisplayName(appt)}</strong><br>${startHourLocal}:${startMinuteLocal}`;
                        block.dataset.id = appt.appointment_id;
                        startSlot.appendChild(block);
                    }
                }
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

    getAppointmentDisplayName(appt) {
        if (this.currentUser.role === 'Tutor') {
            return appt.student_first_name;
        } else {
            return appt.tutor_first_name;
        }
    },
};
