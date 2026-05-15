# Student-to-Tutor Scheduling System: Local Installation Manual

This document provides a detailed, step-by-step guide for setting up and running the Student-to-Tutor Scheduling System on a local machine. This guide is intended for developers, testers, and anyone needing to run a local instance of the application.

## Part 1: System Prerequisites

Before you begin the installation process, please ensure your system meets the following requirements:

- **Git**: A distributed version control system. You will need this to clone the project repository. You can download it from [git-scm.com](https://git-scm.com/).
- **Visual Studio Code (or a similar code editor)**: While any code editor can be used, this guide will reference features available in VS Code.
- **Live Server Extension for VS Code**: This extension provides a simple, one-click web server for static files. You can install it from the Extensions view (`Ctrl+Shift+X`) in VS Code.
- **A Supabase Account**: The backend for this project is powered by Supabase. You will need a free account to create and manage your own backend instance. You can sign up at [supabase.com](https://supabase.com).

## Part 2: Backend Setup (Supabase)

This application requires a Supabase project to handle the database, user authentication, and API services.

### Step 2.1: Create a New Supabase Project

1.  Navigate to [supabase.com](https://supabase.com) and log in to your account.
2.  On your dashboard, click the **"New project"** button.
3.  Select the organization you want to create the project under.
4.  **Project Name**: Enter a name for your project, such as `student-tutor-local-instance`.
5.  **Database Password**: Create a strong password and **save it securely**. This password is required for direct database access but will not be needed for this guide.
6.  **Region**: Select the region closest to you for the best performance.
7.  Click **"Create new project"**. Please wait a few minutes for Supabase to provision your new backend infrastructure.

### Step 2.2: Apply Database Migrations

The database schema (tables, views, functions, and security policies) is defined in a series of SQL files. You must run these files against your new Supabase project to set up the database correctly.

1.  From your Supabase project dashboard, navigate to the **SQL Editor** by clicking the corresponding icon in the left-hand menu.
2.  In your local project files, locate the `supabase/migrations` directory.
3.  **This is a critical step**: You must execute these files **one by one, in chronological order** based on the timestamp in their filenames.
4.  For each file in the `migrations` directory:
    *   Open the file in your code editor.
    *   Select and copy the **entire SQL content**.
    *   Paste the content into the query window in the Supabase SQL Editor.
    *   Click the **RUN** button.
    *   Verify that you see a "Success. No rows returned" message before proceeding to the next file. If you encounter an error, stop and troubleshoot before continuing.

### Step 2.3: Obtain API Credentials

You need to get the API URL and a special key to allow your local frontend application to communicate with your Supabase backend.

1.  From your Supabase project dashboard, navigate to **Project Settings** by clicking the gear icon at the bottom of the left-hand menu.
2.  Select the **API** section.
3.  Under the "Project API keys" section, you will find:
    *   **Project URL**: This is the main URL for your backend.
    *   `anon` **public** key: This is a safe-to-use public key that allows your frontend to access the API.
4.  Copy both of these values. You will need them in the next part.

## Part 3: Frontend Setup

Now you will configure the frontend code to connect to your new backend.

### Step 3.1: Clone the Project Repository

1.  Open your terminal or a new terminal in VS Code (`Ctrl+\``).
2.  Navigate to the directory where you want to store the project.
3.  Run the following command to download the project files:
    ```bash
    git clone https://github.com/NicolasImhof/student-tutor-scheduling-system.git
    ```
4.  Navigate into the newly created project directory:
    ```bash
    cd student-tutor-scheduling-system
    ```

### Step 3.2: Configure the Supabase Client

1.  In VS Code, open the `script.js` file located in the root of the project.
2.  Near the top of the file, you will find the following lines:
    ```javascript
    const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    ```
3.  Replace the placeholder strings with the **Project URL** and `anon` **public** key you copied in Step 2.3.

## Part 4: Running the Application Locally

You are now ready to run the application.

1.  In VS Code, right-click on the `index.html` file in the file explorer.
2.  Select **"Open with Live Server"** from the context menu.
3.  Your default web browser should open automatically to a URL like `http://127.0.0.1:5500/index.html`.
4.  If it doesn't open automatically, you can open your browser and navigate to that URL yourself.

The Student-to-Tutor Scheduling System is now running on your local machine. You can proceed to create a new user account and test the application's features.