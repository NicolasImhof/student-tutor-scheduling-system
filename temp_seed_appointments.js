const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

const supabaseUrl = "https://bycjjodkedhynxkckwtg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc";
const supabase = createClient(supabaseUrl, supabaseKey);

function getNextHalfHour(date) {
    const newDate = new Date(date);
    newDate.setSeconds(0, 0);
    if (newDate.getMinutes() >= 30) {
        newDate.setHours(newDate.getHours() + 1);
        newDate.setMinutes(0);
    } else {
        newDate.setMinutes(30);
    }
    return newDate;
}

async function seedAppointments() {
    console.log('Starting appointment seeding process...');

    try {
        console.log('Fetching initial data...');
        const [tutorsRes, studentsRes, coursesRes, workingHoursRes, eventsRes] = await Promise.all([
            supabase.from('users').select('user_id').eq('role', 'Tutor'),
            supabase.from('users').select('user_id').eq('role', 'Student'),
            supabase.from('courses').select('course_id'),
            supabase.from('working_hours').select('*'),
            supabase.from('system_events').select('*')
        ]);

        if (tutorsRes.error || studentsRes.error || coursesRes.error || workingHoursRes.error || eventsRes.error) {
            throw new Error('Failed to fetch initial data.');
        }

        const tutors = tutorsRes.data;
        const students = studentsRes.data;
        const courses = coursesRes.data;
        const workingHours = workingHoursRes.data;
        const systemEvents = eventsRes.data;

        if (!tutors.length || !students.length || !courses.length || !workingHours.length) {
            console.error("Missing essential data for seeding.");
            return;
        }

        const newAppointments = [];
        const today = new Date();

        console.log('Generating valid appointments...');
        for (let i = 0; i < 14; i++) {
            const targetDate = new Date();
            targetDate.setDate(today.getDate() - 7 + i);
            const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

            const tutorsWorkingToday = workingHours.filter(wh => wh.day_of_week === dayOfWeek && wh.is_working);

            for (const slot of tutorsWorkingToday) {
                const [startHour, startMinute] = slot.start_time.split(':').map(Number);
                const [endHour, endMinute] = slot.end_time.split(':').map(Number);

                let currentTime = new Date(targetDate);
                currentTime.setHours(startHour, startMinute, 0, 0);
                currentTime = getNextHalfHour(currentTime);

                const workingEndTime = new Date(targetDate);
                workingEndTime.setHours(endHour, endMinute, 0, 0);

                for (let j = 0; j < 2; j++) {
                    if (currentTime >= workingEndTime) break;

                    const duration = faker.helpers.arrayElement([30, 60, 90]);
                    const appointmentEnd = new Date(currentTime.getTime() + duration * 60000);
                    if (appointmentEnd > workingEndTime) continue;

                    // *** FINAL ATTEMPT: Check for overlaps within the batch being generated ***
                    const isLocallyOccupied = newAppointments.some(appt =>
                        appt.tutor_id === slot.tutor_id &&
                        (new Date(appt.start_time) < appointmentEnd && new Date(appt.end_time) > currentTime)
                    );

                    if (isLocallyOccupied) {
                        currentTime = getNextHalfHour(currentTime);
                        continue;
                    }

                    let status = 'Scheduled';
                    let reason_notes = null;
                    const conflictingEvent = systemEvents.find(event => {
                        const eventStart = new Date(event.start_date);
                        const eventEnd = new Date(event.end_date);
                        eventEnd.setHours(23, 59, 59);
                        return currentTime >= eventStart && currentTime <= eventEnd;
                    });

                    if (conflictingEvent) {
                        status = 'Canceled';
                        reason_notes = `Canceled due to system event: ${conflictingEvent.name}`;
                    } else if (currentTime < today) {
                        status = 'Completed';
                    }

                    newAppointments.push({
                        student_id: faker.helpers.arrayElement(students).user_id,
                        tutor_id: slot.tutor_id,
                        course_id: faker.helpers.arrayElement(courses).course_id,
                        start_time: currentTime.toISOString(),
                        end_time: appointmentEnd.toISOString(),
                        duration_minutes: duration,
                        status,
                        reason_notes,
                        topic: `Topic on ${faker.lorem.words(3)}`
                    });

                    currentTime = getNextHalfHour(appointmentEnd);
                }
            }
        }

        if (newAppointments.length > 0) {
            console.log(`Attempting to insert ${newAppointments.length} new appointments...`);
            const { error } = await supabase.from('appointments_enhanced').insert(newAppointments);
            if (error) {
                console.error('Error inserting new appointments:', error.message);
            } else {
                console.log('SUCCESS: Database has been seeded with new, valid appointments.');
            }
        } else {
            console.log('No new appointments were generated.');
        }

    } catch (error) {
        console.error('The seeding script failed:', error.message);
    }
}

seedAppointments();
