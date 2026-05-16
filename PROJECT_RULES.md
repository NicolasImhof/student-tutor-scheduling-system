# Project Rules and Requirements (v8.1)

This document outlines the core business logic, data schema, and operational rules for the Student-to-Tutor Scheduling and Availability Management System. This is for internal reference and should not be made public.

---

## 1. User Roles and Permissions

The system defines four distinct user roles, each with a specific set of views and capabilities.

### Navigation Structure
All users access features through a **sidebar navigation system** with role-specific tabs:

-   **Student**:
    -   **Tabs**: My Profile, Find a Tutor, My Appointments, My Reviews
    -   **Default View**: `Find a Tutor`
    -   **Capabilities**: View all tutors and their reviews, book appointments, view their own appointments and profile, write, and edit their own reviews for tutors.

-   **Tutor**:
    -   **Tabs**: My Profile, My Availability, My Appointments, My Reviews
    -   **Default View**: `My Availability`
    -   **Capabilities**: Manage their availability (as time frames), request time off, view their appointments and profile, view their reviews anonymously, and respond to reviews.

-   **Admin**:
    -   **Tabs**: My Profile, Admin Dashboard, My Appointments, Calendar Management, Review Management
    -   **Default View**: `Admin Dashboard`
    -   **Jurisdiction**: Admins oversee specific categories of tutors (e.g., "Science"). Their view and actions are restricted to tutors within their category.
    -   **Capabilities**: Approve/deny time-off requests for their tutors, make mass schedule adjustments (e.g., holidays) for their tutors, book meetings with their tutors, view all reviews for all tutors (with student details), and request review deletions from a Super Admin.
    -   **Restrictions**: Cannot create or delete user accounts.

-   **Super Admin**:
    -   **Tabs**: My Profile, Super Admin Dashboard, User Management, Calendar Management, Time-Off Override, Review Deletion Requests
    -   **Default View**: `Super Admin Dashboard`
    -   **Capabilities**: Complete control over the system. Can create, edit, and delete any user account; approves new user registration requests; sets system-wide holidays and default work hours; override admin time-off decisions; and approve review deletion requests.
    -   **Special Features**:
        - Dashboard shows system statistics and quick actions
        - Can override admin time-off decisions
        - Calendar management for system-wide events
        - User management with full CRUD operations
        - Review deletion request processing

---

## 2. Authentication & Account Management

1.  **Registration**: New users can register as a `Student` or `Tutor`. All new accounts are created with a `Pending` approval status.
2.  **Account Approval**: A `Super Admin` must approve all new accounts before the user can log in.
3.  **Login**: Users log in with an email and password. The system checks for a matching email and verifies that the account's `approval_status` is `Approved`.
4.  **Account Deletion**: When a user account is deleted, all associated data must be purged from the database to maintain data integrity. The only exception is student-written reviews, which are only deleted if the *tutor's* account is deleted.

---

## 3. Tutor Availability & Scheduling

-   **Tutor Availability**: Tutors define their availability as daily time frames (e.g., Monday 9:00 AM - 5:00 PM). The system should have a default time frame (e.g., 9 AM - 5 PM) that can be customized.
-   **Time-Off Requests**: Tutors can request time off (e.g., for vacation or sick leave). These requests must be approved by an `Admin` within their jurisdiction.
-   **System-Wide Events**: A `Super Admin` can set system-wide non-working days, such as holidays or school closures, which override all tutor availability.
-   **Student Booking**: When a student views a tutor's calendar, the system should display available slots by taking into account the tutor's general availability, existing appointments, approved time-off, and system-wide holidays.

---

## 4. Reviews System

1.  **Student-Written Reviews**: Students can write, view, and edit their own reviews for tutors they've had appointments with.
2.  **Tutor View**: Tutors can view all reviews written about them, but the student's identity will be anonymous. Tutors can post one public response to each review.
3.  **Admin View**: Admins can view all reviews for all tutors and see the identity of the student who wrote them.
4.  **Review Deletion**: An `Admin` can flag a review for removal by sending a deletion request to the `Super Admin`. The `Super Admin` has the final say on whether to delete the review.

---

## 5. Data Model & Architecture

-   **UI States**: The application has two primary states: logged-out (showing `#login-view`) and logged-in (showing `#dashboard-view`). The visibility of these containers is managed by adding/removing the `.hidden` utility class.
-   **Client-Side Routing**: The `App.loadDashboardView(view)` function acts as a client-side router.
-   **Database Schema**:
    -   `users`: Must include a `category` column for jurisdiction and an updated `role` enum (`Student`, `Tutor`, `Admin`, `Super Admin`).
    -   `courses`: A new table to store course information.
    -   `tutor_specializations`: A new join table to link tutors to the courses they specialize in.
    -   `reviews`: A new table to store tutor reviews, ratings, and tutor responses.
    -   `time_off_requests`: A new table to manage tutor leave requests and their approval status.
    -   `system_events`: A new table for system-wide holidays and closures.
-   **Data Integrity**: Use database foreign key constraints with `ON DELETE CASCADE` where appropriate to ensure that when a user or tutor is deleted, all their related data (appointments, time-off requests, etc.) is also removed.

---

## 6. Navigation and UI Structure

### Sidebar Navigation System
-   **Layout**: All dashboards use a **sidebar navigation** system with role-specific tabs
-   **Responsive**: The sidebar collapses on mobile devices for better usability
-   **Active States**: Current tab is highlighted with primary color background
-   **Quick Actions**: Super Admin dashboard includes quick action buttons for common tasks

### Dashboard Components
-   **Statistics Cards**: Super Admin dashboard shows key system metrics
-   **Management Sections**: Separate sections for different types of management tasks
-   **Status Indicators**: Color-coded status badges for approvals, requests, and reviews
-   **Action Buttons**: Context-specific action buttons for each management task

---

## 7. Time-Off Request Workflow

### Request Flow
1. **Tutor Submits**: Tutor submits time-off request with dates and reason
2. **Admin Review**: Admin within the tutor's category reviews and approves/denies
3. **Super Admin Override**: Super Admin can override admin decisions if needed
4. **System Updates**: Approved requests block booking availability for those dates

### Override Capabilities
-   **Super Admin Override**: Can change any admin's approval/denial decision
-   **Audit Trail**: All overrides are tracked with who made the change and when
-   **Notification**: Tutors are notified when their request status changes

---

## 9. UI/UX Overhaul (v9.1)

### Reviews System (Rate My Professor Style)
-   **Tutor Cards**: The "Find a Tutor" page displays tutors in a card format inspired by Rate My Professor. Each card shows the tutor's name, category, average star rating, and total number of reviews.
-   **Detailed Reviews Page**: Clicking "View Reviews" opens a dedicated page for that tutor, showing all their reviews. This page includes controls to sort reviews by date or rating, and to filter them by course.
-   **RPC for Ratings**: A PostgreSQL function (`get_tutors_with_ratings`) is used to efficiently calculate and retrieve the average ratings for all tutors in a single query.

### Scheduling System (MS Teams/Workday Style)
-   **Weekly View**: The calendar has been redesigned as a modern, weekly view, similar to the scheduling interfaces in MS Teams or Workday.
-   **Clear Time Slots**: Available, booked, and past time slots are clearly distinguished by color and style.
-   **Tutor Availability**: Tutors can easily set their weekly working hours, and this availability is immediately reflected in the calendar.

---

## 10. Data Seeding and Theming (v10.0)

### Comprehensive Seed Data
- **Rich Data Set**: The database must be seeded with a rich, interconnected set of data to allow for thorough testing of all application features.
- **Complete User Profiles**: Every user in the seed data should have at least one of every relevant interaction. For example:
    - Every tutor should have at least one review.
    - Every student should have made at least one review.
    - The database should contain at least one pending account request for a new tutor.
    - The database should contain at least one pending review deletion request.

### Role-Based Color Theming
- **Visual Distinction**: The UI will use a distinct color theme for each user role to provide immediate visual context to the user.
- **Color Palette**:
    - **Student**: Green
    - **Tutor**: Blue
    - **Admin**: Purple
    - **Super Admin**: Red
- **Implementation**: The color theme will be applied by adding a role-specific class to the `<body>` element upon login (e.g., `role-student`) and using CSS variables to theme key UI components like headers, buttons, and active navigation links.
