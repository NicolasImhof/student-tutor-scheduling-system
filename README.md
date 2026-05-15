# Student-to-Tutor Scheduling System

A comprehensive scheduling and availability management system built with modern web technologies. This platform provides a seamless experience for students to book appointments, for tutors to manage their schedules, and for administrators to oversee the entire system.

## 🌟 Key Features

- **Interactive Calendar**: A dynamic, role-based calendar that serves as the central hub for all scheduling.
- **Role-Based Dashboards**: Tailored views and permissions for Students, Tutors, Admins, and Super Admins.
- **Secure Authentication**: Robust user authentication and session management powered by Supabase.
- **Automated Scheduling Logic**: Smart database functions handle appointment conflicts, cancellations, and data integrity.

## ✨ Recent Updates

This project has undergone a significant overhaul of the calendar system, including:

- **Critical Bug Fixes**: Resolved a crash on login and the persistent "unknown user" bug.
- **Data Integrity**: Implemented a series of data cleanup and validation scripts to ensure all appointments are valid and correctly scheduled.
- **UI/UX Enhancements**: The calendar now clearly highlights the current day with a personalized, theme-colored outline.

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend & Database**: Supabase (PostgreSQL, Authentication, and Auto-generating APIs)

## 🚀 Getting Started

1.  **Clone the repository.**
2.  **Set up your Supabase project**: Create a new project on [supabase.com](https://supabase.com) and add your project URL and `anon` key to `script.js`.
3.  **Apply Migrations**: Use the Supabase CLI or the in-browser SQL editor to apply all the migrations in the `supabase/migrations` directory.
4.  **Run the application**: Serve the project files with a simple HTTP server (like Python's `http.server` or the Live Server VS Code extension).
