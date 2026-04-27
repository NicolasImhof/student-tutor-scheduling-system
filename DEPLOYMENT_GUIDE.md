# Student-Tutor Scheduling System - Deployment Guide

## Prerequisites

1. **Supabase Account**: Sign up at https://supabase.com
2. **GitHub Account**: For repository hosting
3. **Node.js**: Version 14 or higher
4. **Git**: For version control

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: `student-tutor-scheduling`
   - Database Password: Generate a strong password and save it
   - Region: Choose closest to your users
4. Wait for project to initialize (2-3 minutes)

### 1.2 Get Project Credentials
1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon public**: Your public API key
   - **service_role**: Your service role key (keep secret)

### 1.3 Configure Environment Variables
Create a `.env` file in your project root:

```env
# Supabase Project Details
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-public-anon-key"
SUPABASE_SERVICE_KEY="your-secret-service-role-key"

# JWT Secret (generate a random string)
JWT_SECRET="your-secure-random-string-here"

# Server Port
PORT=3000
```

## Step 2: Deploy Database Schema

### Option A: Using the Setup Script (Recommended)
1. Install dependencies:
```bash
npm install @supabase/supabase-js dotenv
```

2. Run the setup script:
```bash
node setup-supabase.js
```

### Option B: Manual SQL Execution
1. Go to your Supabase project → SQL Editor
2. Run the contents of `schema.sql` first
3. Then run the contents of `migrations/001_enhanced_calendar.sql`

## Step 3: Deploy Backend Server

### 3.1 Install Dependencies
```bash
npm install express cors bcryptjs jsonwebtoken @supabase/supabase-js dotenv
```

### 3.2 Start the Server
```bash
node server-supabase.js
```

### 3.3 Test the API
The server should be running on `http://localhost:3000`
Test endpoints:
- `GET /api/calendar-data` - Requires authentication
- `POST /api/login` - User authentication

## Step 4: Deploy Frontend

### Option A: GitHub Pages (Static Hosting)
1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Source: Deploy from a branch
4. Branch: main, folder: / (root)
5. Your site will be available at `https://[username].github.io/[repository-name]`

### Option B: Netlify (Recommended)
1. Go to https://netlify.com
2. Connect your GitHub repository
3. Build settings:
   - Build command: (leave empty for static site)
   - Publish directory: (leave empty for root)
4. Deploy automatically on push

### Option C: Vercel
1. Go to https://vercel.com
2. Import your GitHub repository
3. Deploy with default settings

## Step 5: Configure GitHub Actions (Optional)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
- Runs tests on push
- Deploys database changes to Supabase
- Deploys frontend to Netlify

To enable:
1. Add these secrets to your GitHub repository:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`

## Step 6: Initial Data Setup

### 6.1 Create Sample Users
Run this SQL in Supabase SQL Editor:

```sql
-- Insert sample users with different roles
INSERT INTO users (email, password, role, name) VALUES 
('student@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'John Student'),
('tutor@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Tutor', 'Jane Tutor'),
('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Admin User');

-- Insert sample tutors
INSERT INTO tutors (user_id, name, email, subject, bio, hourly_rate, rating) VALUES 
((SELECT id FROM users WHERE email = 'tutor@example.com'), 'Jane Tutor', 'tutor@example.com', 'Mathematics', 'Experienced math tutor with 5+ years of experience', 50.00, 4.8);

-- Insert sample availability
INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available) VALUES 
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 1, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 2, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 3, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 4, '09:00', '17:00', true),
((SELECT id FROM tutors WHERE email = 'tutor@example.com'), 5, '09:00', '17:00', true);
```

### 6.2 Add Sample Holidays
```sql
-- Insert sample holidays
INSERT INTO holidays (date, name, description) VALUES 
('2024-12-25', 'Christmas Day', 'Christmas holiday'),
('2024-01-01', 'New Year''s Day', 'New Year holiday'),
('2024-07-04', 'Independence Day', 'US Independence Day');
```

## Step 7: Testing

### 7.1 Test Authentication
1. Open your deployed frontend
2. Login with: `student@example.com` / `password`
3. Verify dashboard loads correctly

### 7.2 Test Calendar Functionality
1. Navigate to Calendar tab
2. Click on a date to see integrated functionality
3. Test booking (as student), availability setting (as tutor), holiday management (as admin)

### 7.3 Test Data Persistence
1. Create some bookings/availability
2. Refresh page
3. Verify data persists

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your backend server has CORS configured for your frontend domain
2. **Authentication Issues**: Check JWT secret and Supabase service role key
3. **Database Connection**: Verify Supabase credentials in `.env` file
4. **Calendar Not Loading**: Check browser console for JavaScript errors

### Support

For issues:
1. Check browser console for JavaScript errors
2. Verify all environment variables are set correctly
3. Ensure database schema is properly deployed
4. Check network tab for API request failures

## Security Notes

- Never commit `.env` file with real credentials
- Use environment variables for all sensitive data
- Enable Row Level Security (RLS) in Supabase for production
- Use HTTPS for production deployments
- Regularly update dependencies for security patches