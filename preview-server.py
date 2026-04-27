# Simple HTTP server for preview demonstration
# Run this with: python -m http.server 8080

import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs
import datetime

PORT = 8080

# Mock data
mock_users = {
    'student@example.com': {'password': 'password', 'role': 'Student', 'name': 'John Student'},
    'tutor@example.com': {'password': 'password', 'role': 'Tutor', 'name': 'Jane Tutor'},
    'admin@example.com': {'password': 'password', 'role': 'Admin', 'name': 'Admin User'},
    'superadmin@example.com': {'password': 'password', 'role': 'Super Admin', 'name': 'Super Admin'}
}

mock_tutors = [
    {'id': 1, 'name': 'Jane Tutor', 'email': 'tutor@example.com', 'subject': 'Mathematics', 'bio': 'Experienced math tutor', 'hourly_rate': 50, 'rating': 4.8},
    {'id': 2, 'name': 'Admin Tutor', 'email': 'admin@example.com', 'subject': 'Physics', 'bio': 'Physics expert', 'hourly_rate': 60, 'rating': 4.9}
]

mock_holidays = ['2024-12-25', '2025-01-01', '2025-07-04']

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_url.path.startswith('/api/'):
            self.handle_api()
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        parsed_url = urlparse(self.path)
        
        if parsed_url.path.startswith('/api/'):
            self.handle_api()
        else:
            super().do_POST()
    
    def handle_api(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        if path == '/api/login':
            # Mock login
            response = {
                'token': 'mock-jwt-token',
                'user': {'email': 'student@example.com', 'role': 'Student', 'name': 'John Student'}
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif path == '/api/calendar-data':
            # Mock calendar data
            response = {
                'holidays': mock_holidays,
                'tutorAvailability': [
                    {'date': '2024-12-02', 'status': 'available', 'slots': ['09:00', '10:00', '11:00', '14:00', '15:00']},
                    {'date': '2024-12-03', 'status': 'busy', 'slots': ['10:00', '11:00']},
                    {'date': '2024-12-04', 'status': 'unavailable', 'slots': []}
                ],
                'dayStatuses': [
                    {'date': '2024-12-02', 'status': 'available', 'description': 'Fully available'},
                    {'date': '2024-12-03', 'status': 'busy', 'description': 'Limited availability'}
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif path == '/api/tutors':
            self.wfile.write(json.dumps(mock_tutors).encode())
        
        else:
            response = {'message': 'Mock API endpoint'}
            self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    print(f'🚀 Python server running at http://localhost:{PORT}')
    print('📁 Serving files from current directory')
    print('🔗 API endpoints available')
    print('')
    print('🌐 Website Preview URLs:')
    print(f'   Main page: http://localhost:{PORT}')
    print(f'   Student dashboard: http://localhost:{PORT}/student-dashboard.html')
    print(f'   Tutor dashboard: http://localhost:{PORT}/tutor-dashboard.html')
    print(f'   Admin dashboard: http://localhost:{PORT}/admin-dashboard.html')
    print('')
    print('🔑 Test login credentials:')
    print('   student@example.com / password')
    print('   tutor@example.com / password')
    print('   admin@example.com / password')
    print('   superadmin@example.com / password')
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        httpd.serve_forever()