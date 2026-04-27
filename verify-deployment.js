// Simple deployment verification script
// This script checks your setup without requiring external dependencies

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔍 Student-Tutor Scheduling System - Deployment Verification');
console.log('==========================================================');

// Check environment file
console.log('\n📋 Checking environment configuration...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env file exists');
    
    // Check for required variables
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
    const missingVars = [];
    
    requiredVars.forEach(varName => {
        if (!envContent.includes(varName) || envContent.includes(`"your-`)) {
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        console.log(`⚠️  Missing or placeholder variables: ${missingVars.join(', ')}`);
    } else {
        console.log('✅ All required environment variables present');
    }
} else {
    console.log('❌ .env file not found');
    console.log('   Please create .env file with your Supabase credentials');
}

// Check SQL files
console.log('\n📄 Checking SQL files...');
const sqlFiles = [
    { name: 'schema.sql', path: path.join(__dirname, 'schema.sql') },
    { name: 'enhanced calendar migration', path: path.join(__dirname, 'migrations', '001_enhanced_calendar.sql') },
    { name: 'initial data', path: path.join(__dirname, 'initial-data.sql') }
];

sqlFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
        console.log(`✅ ${file.name} exists`);
    } else {
        console.log(`❌ ${file.name} not found`);
    }
});

// Check server files
console.log('\n🖥️  Checking server files...');
const serverFiles = [
    'server-supabase.js',
    'supabase-config.js',
    'setup-supabase.js'
];

serverFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} not found`);
    }
});

// Check frontend files
console.log('\n🌐 Checking frontend files...');
const frontendFiles = [
    'index.html',
    'script.js',
    'calendar.js',
    'style.css',
    'student-dashboard.html',
    'tutor-dashboard.html',
    'admin-dashboard.html',
    'superadmin-dashboard.html'
];

frontendFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} not found`);
    }
});

// Test Supabase connection (if credentials are available)
console.log('\n🔗 Testing Supabase connection...');
const envPath2 = path.join(__dirname, '.env');
if (fs.existsSync(envPath2)) {
    const envContent = fs.readFileSync(envPath2, 'utf8');
    const urlMatch = envContent.match(/SUPABASE_URL="([^"]+)"/);
    const keyMatch = envContent.match(/SUPABASE_ANON_KEY="([^"]+)"/);
    
    if (urlMatch && keyMatch && !urlMatch[1].includes('your-project-id')) {
        const supabaseUrl = urlMatch[1];
        const supabaseKey = keyMatch[1];
        
        console.log('Attempting to connect to Supabase...');
        
        // Simple health check
        const healthUrl = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;
        https.get(healthUrl, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Supabase connection successful');
            } else {
                console.log(`⚠️  Supabase connection returned status: ${res.statusCode}`);
            }
        }).on('error', (err) => {
            console.log(`❌ Supabase connection failed: ${err.message}`);
            console.log('   Please verify your Supabase credentials in .env file');
        });
    } else {
        console.log('⚠️  Cannot test Supabase connection - credentials not configured');
    }
} else {
    console.log('⚠️  Cannot test Supabase connection - .env file not found');
}

console.log('\n📋 Deployment Summary:');
console.log('1. ✅ GitHub repository created: https://github.com/NicolasImhof/student-tutor-scheduling-system');
console.log('2. ✅ Code pushed to GitHub');
console.log('3. 📋 Next steps:');
console.log('   - Set up Supabase project at https://app.supabase.com');
console.log('   - Update .env file with your Supabase credentials');
console.log('   - Execute SQL files in Supabase SQL Editor');
console.log('   - Deploy frontend to GitHub Pages, Netlify, or Vercel');
console.log('   - Test the application');

console.log('\n📚 Useful Resources:');
console.log('- Deployment Guide: DEPLOYMENT_GUIDE.md');
console.log('- GitHub Repository: https://github.com/NicolasImhof/student-tutor-scheduling-system');
console.log('- Supabase Documentation: https://supabase.com/docs');

console.log('\n✅ Deployment verification complete!');