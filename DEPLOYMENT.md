# Deployment Guide

## Supabase Deployment

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Note down your project URL and API keys

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Update with your Supabase credentials:
   ```
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-public-anon-key"
   SUPABASE_SERVICE_KEY="your-secret-service-role-key"
   JWT_SECRET="a-secure-random-string-for-jwt"
   ```

### 3. Deploy Database Schema
```bash
npm install
npm run setup-supabase
```

### 4. Start the Server
```bash
npm run start
```

## GitHub Deployment

### 1. Create GitHub Repository
1. Go to [github.com](https://github.com)
2. Create a new repository
3. Name it "student-tutor-scheduling"

### 2. Initialize Git and Push
```bash
git init
git add .
git commit -m "Initial commit with calendar tab functionality and Supabase integration"
git branch -M main
git remote add origin https://github.com/your-username/student-tutor-scheduling.git
git push -u origin main
```

### 3. Frontend Deployment Options

#### Option A: GitHub Pages (Static)
1. Create a `gh-pages` branch
2. Move frontend files to root
3. Enable GitHub Pages in repository settings

#### Option B: Netlify/Vercel (Recommended)
1. Connect your GitHub repository to Netlify or Vercel
2. Set build command: `npm install && npm run build`
3. Set publish directory: `dist` or `public`

#### Option C: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Project Structure for Deployment
```
├── frontend/          # Static frontend files
├── server-supabase.js # Backend server
├── package-supabase.json
├── setup-supabase.js
├── .env.example
├── schema.sql
├── migrations/
└── README.md
```

## Environment Variables for Production
Make sure to set these in your hosting platform:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `NODE_ENV=production`