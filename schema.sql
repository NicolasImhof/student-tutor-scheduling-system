
CREATE TYPE user_role AS ENUM ('Student', 'Tutor', 'Admin', 'Super Admin');
CREATE TYPE approval_status AS ENUM ('Pending', 'Approved', 'Denied');
CREATE TYPE appointment_status AS ENUM ('Scheduled', 'Rescheduled', 'Canceled', 'Completed');
CREATE TYPE rule_type AS ENUM ('allowed_hours', 'holiday');

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    approval_status approval_status NOT NULL DEFAULT 'Pending'
);

CREATE TABLE StudentProfiles (
    user_id INT PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    gpa DECIMAL(3, 2),
    year_in_school INT
);

CREATE TABLE TutorProfiles (
    user_id INT PRIMARY KEY REFERENCES Users(user_id) ON DELETE CASCADE,
    rating_summary DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0
);

CREATE TABLE Courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Student_Courses (
    student_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    course_id INT REFERENCES Courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, course_id)
);

CREATE TABLE Tutor_Courses (
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    course_id INT REFERENCES Courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, course_id)
);

CREATE TABLE Availabilities (
    availability_id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL
);

CREATE TABLE Appointments (
    appointment_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'Scheduled',
    reason_notes TEXT
);

CREATE TABLE Reviews (
    review_id SERIAL PRIMARY KEY,
    appointment_id INT NOT NULL REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    student_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    tutor_id INT REFERENCES Users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
);

CREATE TABLE ScheduleRules (
    rule_id SERIAL PRIMARY KEY,
    rule_type rule_type NOT NULL,
    name VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_by INT REFERENCES Users(user_id),
    last_modified_by INT REFERENCES Users(user_id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_modified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
