# Student-to-Tutor Scheduling and Availability Management System

A comprehensive web-based platform designed to streamline tutoring operations, session scheduling, and performance feedback between students and tutors.

## Overview
This system provides an integrated solution for academic institutions to manage tutor-student relationships, appointment scheduling, and performance feedback. It features multi-role dashboards (Student, Tutor, Admin, Super Admin), a real-time availability calendar, a robust review system, and administrative control over department-specific events and tutor time-off requests.

## Key Features

### Scheduling & Availability
- **Real-time Conflict Checking**: Automated validation against tutor availability, global holidays, and department-specific events using PostgreSQL RPC functions.
- **Dynamic Scheduling**: Supports 30-minute booking intervals across a 24-hour scale, preventing overlaps and enforcing tutor-specific working hours.
- **Tutor Time-Off**: Tutors can submit time-off requests. Once approved, the system automatically cancels overlapping appointments and prevents new bookings during the requested dates.
- **Departmental Events**: Admins can create events that apply only to specific department categories, automatically canceling affected appointments for tutors within those departments.

### User Roles & Dashboards
- **Student Dashboard**: Browse available tutors, book appointments, and review completed sessions.
- **Tutor Dashboard**: Manage weekly availability, respond to student reviews, and mark appointments as completed.
- **Admin Dashboard**: Oversee tutors in a specific department, approve/deny time-off requests, and manage department-scoped events.
- **Super Admin Dashboard**: System-wide oversight, including reversing admin decisions on time-off, global user management, and system-wide event creation.

### Review & Feedback System
- **Review Submission**: Students can rate and comment on completed tutoring sessions.
- **Tutor Response**: Tutors can respond once to reviews, enhancing feedback loops.
- **Review Anonymity**: Tutor reviews are anonymized for the tutor's view (names of students are omitted).
- **Review Management**: Administrative moderation tools to handle review deletion requests.

---

## Technical Architecture

### Tech Stack
- **Frontend**: Vanilla JavaScript and CSS (Modular structure).
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions).
- **Database Logic**: Business logic is centralized in PostgreSQL RPC functions and triggers to ensure strict relational integrity across users, appointments, and reviews.

### Setup & Installation
1.  **Environment Configuration**: Clone the repository. Copy `.env.example` to `.env` and configure `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
2.  **Install Dependencies**: Run `npm install` to set up local dev tooling.
3.  **Run Development Server**: Execute `npm run dev`. The application will be available at `http://localhost:8000`.
4.  **Database Migration**: Use the Supabase CLI (`supabase db push`) to apply the schema contained within the `supabase/migrations/` directory.

---

## Database Schema Highlights
- **`users`**: Manages profile information and role assignment.
- **`appointments_enhanced`**: The primary view/table for session management, linked to `courses` and `users`.
- **`reviews`**: Stores ratings, comments, and the tutor's response.
- **`time_off_requests`**: Manages tutor availability constraints.
- **`system_events`**: Stores global or department-specific closures.

## Development Standards
- **Strict Scheduling**: Enforced by `book_appointment` and `get_tutor_availability_slots` RPC functions.
- **Security**: Access is governed by role-based Row Level Security (RLS) policies.
- **Maintenance**: All schema changes are tracked in the `supabase/migrations/` directory.
