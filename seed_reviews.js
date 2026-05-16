const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bycjjodkedhynxkckwtg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5Y2pqb2RrZWRoeW54a2Nrd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5NjM4MCwiZXhwIjoyMDg2MDcyMzgwfQ.pa_hi4XFbHLJOszZEGBcM7USY67tuJ2Y23MeA0eRyhc';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedReviews() {
    console.log('Starting review seeding (direct reviews)...');

    try {
        // 1. Fetch valid IDs
        const { data: students } = await supabase.from('users').select('user_id').eq('role', 'Student').limit(3);
        const { data: tutors } = await supabase.from('users').select('user_id').eq('role', 'Tutor').limit(3);

        if (!students || !tutors || students.length === 0 || tutors.length === 0) {
            console.error('Missing essential data (students or tutors) for seeding.');
            return;
        }

        const reviewComments = [
            "Excellent session! The tutor was very helpful and explained concepts clearly.",
            "Great tutor. I feel much more confident about the subject now.",
            "The session was good, but we ran out of time for some topics.",
            "Very professional and knowledgeable. Highly recommended!",
            "Patient and kind. Made difficult topics easy to understand.",
            "Super helpful! Answered all my questions thoroughly.",
            "Informative session. I learned a lot of new techniques.",
            "The tutor was punctual and well-prepared. 5 stars!",
            "A bit fast-paced, but overall very useful.",
            "Wonderful teaching style. I'll definitely book again."
        ];

        console.log('Seeding reviews directly (without appointment_id)...');

        const reviews = [];
        for (let i = 0; i < 10; i++) {
            const student = students[i % students.length];
            const tutor = tutors[i % tutors.length];
            
            reviews.push({
                student_id: student.user_id,
                tutor_id: tutor.user_id,
                rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
                comment: reviewComments[i % reviewComments.length],
                created_at: new Date().toISOString()
            });
        }

        const { data, error } = await supabase
            .from('reviews')
            .insert(reviews);

        if (error) throw error;

        console.log('Successfully seeded 10 reviews!');
    } catch (err) {
        console.error('Error seeding reviews:', err.message);
    }
}

seedReviews();
