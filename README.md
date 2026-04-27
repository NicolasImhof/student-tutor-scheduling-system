# Student-to-Tutor Scheduling System

A comprehensive scheduling and availability management system built with modern web technologies, featuring an integrated calendar with role-based functionality.

## 🌟 Features

### Calendar System
- **Selectable Calendar Tab**: Calendar is now accessible as a dedicated tab rather than being ever-present
- **Integrated Date Functions**: All date-related features work directly within the calendar
- **Color-coded Days**:
  - 🟡 Yellow: Weekends
  - 🟢 Green: Busy but available days
  - 🔴 Red: Holidays
  - 🔵 Blue: Available days
- **Role-based Functionality**:
  - **Students**: Book appointments directly by selecting dates and time slots
  - **Tutors**: Manage availability and time slots
  - **Admins**: Manage holidays and system-wide scheduling

### User Management
- Multi-role authentication system (Student, Tutor, Admin, Super Admin)
- Secure JWT-based authentication
- Role-based dashboard access

### Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (local) / Supabase (cloud)
- **Authentication**: JWT (JSON Web Tokens)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/student-tutor-scheduling.git
   cd student-tutor-scheduling
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up local database** (PostgreSQL)
   ```bash
   # Create database
   createdb tutor_scheduling
   
   # Apply schema
   psql -d tutor_scheduling -f schema.sql
   psql -d tutor_scheduling -f migrations/001_enhanced_calendar.sql
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open http://localhost:3000 in your browser

### Cloud Deployment (Supabase)

1. **Create Supabase project**
   - Visit [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Update with your Supabase credentials
   ```

3. **Deploy database**
   ```bash
   npm run setup-supabase
   ```

4. **Start cloud server**
   ```bash
   npm run start
   ```

## 📁 Project Structure

```
├── index.html              # Main application entry point
├── script.js               # Frontend JavaScript logic
├── calendar.js              # Calendar component
├── style.css               # Application styles
├── server.js               # Local development server
├── server-supabase.js      # Supabase cloud server
├── schema.sql              # Database schema
├── migrations/             # Database migrations
├── .github/workflows/      # CI/CD deployment
└── docs/                   # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database (Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tutor_scheduling
DB_USER=postgres
DB_PASSWORD=your_password

# Supabase (Cloud)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-jwt-secret

# Server
PORT=3000
```

## 👥 User Roles

### Student
- View available tutors
- Book appointments
- Manage personal appointments
- View calendar with availability

### Tutor
- Set availability schedules
- Manage time slots
- View booked appointments
- Update calendar availability

### Admin
- Approve user accounts
- Manage system-wide holidays
- View all appointments
- Configure scheduling rules

### Super Admin
- Full system access
- User management
- System configuration
- Advanced scheduling controls

## 🗓️ Calendar Features

### Date Selection
- Click any date to reveal role-specific functions
- Integrated booking/availability management
- Real-time calendar updates

### Time Slot Management
- Visual time slot selection
- Availability status indicators
- Conflict prevention

### Holiday Management
- System-wide holiday marking
- Automatic conflict detection
- Holiday calendar integration

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Secure password hashing (bcrypt)
- CORS protection

## 🚀 Deployment Options

### Option 1: Supabase + Netlify (Recommended)
- Database: Supabase PostgreSQL
- Frontend: Netlify static hosting
- Backend: Supabase Edge Functions or separate server

### Option 2: Traditional Hosting
- Database: PostgreSQL
- Frontend: Static hosting (GitHub Pages, Vercel, etc.)
- Backend: Node.js server (Heroku, DigitalOcean, etc.)

### Option 3: Full Cloud Stack
- Database: Supabase
- Frontend: Vercel/Netlify
- Backend: Supabase Edge Functions

## 📊 API Endpoints

### Authentication
- `POST /api/login` - User authentication

### Calendar
- `GET /api/calendar-data` - Get calendar data
- `POST /api/calendar-day-status` - Update day status
- `POST /api/appointments` - Book appointment
- `POST /api/holidays` - Create holiday
- `DELETE /api/holidays/:date` - Remove holiday

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the deployment guide [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔄 Changelog

### Version 2.0.0
- ✅ Calendar converted to selectable tab
- ✅ Integrated date-specific functions
- ✅ Removed modal-based interactions
- ✅ Supabase cloud deployment ready
- ✅ Enhanced user experience

### Version 1.0.0
- ✅ Basic scheduling functionality
- ✅ Multi-role authentication
- ✅ Calendar with color-coding
- ✅ Local database support