
// V10 Calendar - Weekly List View
window.Calendar = {
    supabase: null,
    tutor: null,
    viewingAs: null, // The user object of the person viewing the calendar (e.g., a student or admin)
    onSlotSelect: null, 
    container: null,
    viewDate: new Date(),

    init(tutor, viewingAs, supabase, onSlotSelectCallback, container) {
        this.tutor = tutor;
        this.viewingAs = viewingAs;
        this.supabase = supabase;
        this.onSlotSelect = onSlotSelectCallback;
        this.container = container;
        this.render();
    },

    async render() {
        this.container.innerHTML = `
            <div class="calendar-container-v10">
                <div class="calendar-header-v10">
                    <button id="prev-week-btn-v10">&lt; Prev Week</button>
                    <h3 id="week-display-v10"></h3>
                    <button id="next-week-btn-v10">Next Week &gt;</button>
                </div>
                <div id="calendar-grid-v10" class="calendar-grid-v10"></div>
            </div>
        `;
        this.addEventListeners();
        this.renderWeekView();
    },

    addEventListeners() {
        document.getElementById('prev-week-btn-v10').addEventListener('click', () => {
            this.viewDate.setDate(this.viewDate.getDate() - 7);
            this.renderWeekView();
        });

        document.getElementById('next-week-btn-v10').addEventListener('click', () => {
            this.viewDate.setDate(this.viewDate.getDate() + 7);
            this.renderWeekView();
        });

        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('booking-slot-btn')) {
                if (this.onSlotSelect) {
                    const date = e.target.dataset.date;
                    const time = e.target.dataset.time;
                    this.onSlotSelect(this.tutor, date, time);
                }
            }
        });
    },

    async renderWeekView() {
        const grid = this.container.querySelector('.calendar-grid-v10');
        const weekDisplay = this.container.querySelector('#week-display-v10');
        
        const startOfWeek = new Date(this.viewDate);
        startOfWeek.setDate(this.viewDate.getDate() - this.viewDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        weekDisplay.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;

        let gridHtml = '<div class="time-ruler"></div>'; // Time labels column
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
            gridHtml += `<div class="day-column-v10" data-date="${date.toISOString().split('T')[0]}">
                            <div class="day-header-v10">${date.toLocaleDateString('en-US', { weekday: 'short' })}<br>${date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</div>
                         </div>`;
        }
        grid.innerHTML = gridHtml;

        // Render time ruler
        const timeRuler = grid.querySelector('.time-ruler');
        let timeRulerHtml = '<div class="day-header-v10">Time</div>';
        for (let hour = 0; hour < 24; hour++) {
            timeRulerHtml += `<div class="time-label">${hour}:00</div>`;
        }
        timeRuler.innerHTML = timeRulerHtml;

        // Fetch data for the week
        const { data: workingHours } = await this.supabase.from('working_hours').select('*').eq('tutor_id', this.tutor.user_id);
        const { data: appointments } = await this.supabase.from('appointments_enhanced').select('*').eq('tutor_id', this.tutor.user_id);

        // Render availability and appointments
        for (const day of days) {
            const dayStr = day.toISOString().split('T')[0];
            const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'long' });
            const dayColumn = grid.querySelector(`.day-column-v10[data-date="${dayStr}"]`);
            
            const hours = workingHours.find(h => h.day_of_week === dayOfWeek);
            if (!hours || !hours.is_working) continue; // Skip if not a working day

            const startHour = parseInt(hours.start_time.split(':')[0]);
            const endHour = parseInt(hours.end_time.split(':')[0]);
            const top = (startHour * 60) / 1440 * 100; // 1440 minutes in a day
            const height = ((endHour - startHour) * 60) / 1440 * 100;

            const availabilityBlock = document.createElement('div');
            availabilityBlock.className = 'availability-block';
            availabilityBlock.style.top = `${top}%`;
            availabilityBlock.style.height = `${height}%`;
            dayColumn.appendChild(availabilityBlock);

            // Render booking slots if the viewer is a student
            if (this.viewingAs.role === 'Student') {
                for (let h = startHour; h < endHour; h++) {
                    for (let m = 0; m < 60; m += 30) {
                        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        const slotTop = ((h * 60 + m) / 1440) * 100;
                        const isBooked = appointments.some(appt => new Date(appt.start_time).getTime() === new Date(`${dayStr}T${time}`).getTime());

                        if (!isBooked) {
                            const slotButton = document.createElement('button');
                            slotButton.className = 'booking-slot-btn';
                            slotButton.dataset.date = dayStr;
                            slotButton.dataset.time = time;
                            slotButton.style.top = `${slotTop}%`;
                            slotButton.textContent = time;
                            dayColumn.appendChild(slotButton);
                        }
                    }
                }
            }

            // Render existing appointments
            appointments.filter(a => a.start_time.startsWith(dayStr)).forEach(appt => {
                const apptStart = new Date(appt.start_time);
                const apptEnd = new Date(appt.end_time);
                const apptTop = ((apptStart.getHours() * 60 + apptStart.getMinutes()) / 1440) * 100;
                const apptHeight = ((apptEnd - apptStart) / 60000) / 1440 * 100;

                const appointmentBlock = document.createElement('div');
                appointmentBlock.className = 'appointment-block';
                appointmentBlock.style.top = `${apptTop}%`;
                appointmentBlock.style.height = `${apptHeight}%`;
                appointmentBlock.textContent = `Booked`;
                dayColumn.appendChild(appointmentBlock);
            });
        }
    }
};
