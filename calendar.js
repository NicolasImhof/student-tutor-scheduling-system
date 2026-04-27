class Calendar {
    constructor(container, options = {}) {
        this.container = container;
        this.role = options.role || 'student'; // student, tutor, admin
        this.today = new Date();
        this.currentMonth = this.today.getMonth();
        this.currentYear = this.today.getFullYear();
        this.onDateSelect = options.onDateSelect || function() {};
        this.selectedDate = null;
        this.calendarData = {};
        
        this.loadCalendarData();
    }

    async loadCalendarData() {
        try {
            const response = await fetch('/api/calendar-data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (response.ok) {
                this.calendarData = await response.json();
            }
        } catch (error) {
            console.error('Error loading calendar data:', error);
            // Fallback to mock data if API fails
            this.calendarData = this.getMockCalendarData();
        }
        this.render();
    }

    getMockCalendarData() {
        // This will be replaced with actual database data
        return {
            holidays: holidays || [],
            availability: availability || {},
            appointments: appointments || []
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
            const emptyCell = document.createElement('div');
            grid.appendChild(emptyCell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = i;
            const date = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayOfWeek = new Date(this.currentYear, this.currentMonth, i).getDay();

            // Current day highlighting
            if (i === this.today.getDate() && this.currentMonth === this.today.getMonth() && this.currentYear === this.today.getFullYear()) {
                dayCell.classList.add('current-day');
            }

            // Weekend highlighting (Saturday=6, Sunday=0)
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayCell.classList.add('weekend');
            }
            
            // Holiday checking
            if (this.calendarData.holidays && this.calendarData.holidays.includes(date)) {
                dayCell.classList.add('holiday');
            }

            // Availability and busy status checking
            const dayAvailability = this.getDayAvailability(date);
            if (dayAvailability) {
                if (dayAvailability.status === 'busy') {
                    dayCell.classList.add('busy');
                } else if (dayAvailability.status === 'available') {
                    dayCell.classList.add('available');
                }
            }

            // Selected date highlighting
            if (this.selectedDate === date) {
                dayCell.classList.add('selected');
            }
            
            // Add click event with selection logic
            dayCell.addEventListener('click', () => this.selectDate(date, dayAvailability));
            grid.appendChild(dayCell);
        }

        this.container.appendChild(grid);

        document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    }

    getDayAvailability(date) {
        // Check if date is in the calendar data
        if (this.calendarData.availability && this.calendarData.availability[date]) {
            return this.calendarData.availability[date];
        }
        
        // Fallback to mock data structure for compatibility
        const mockAvailability = availability['tutor@example.com']?.find(a => a.date === date);
        if (mockAvailability) {
            return { status: 'available', ...mockAvailability };
        }
        
        return null;
    }

    selectDate(date, dayAvailability) {
        // Update selected date
        this.selectedDate = date;
        
        // Trigger the integrated callback for direct calendar functionality
        this.onDateSelect(date, dayAvailability, this.role);
        
        // Re-render to show selection
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
