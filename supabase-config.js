// Supabase configuration for deployment
const supabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://your-project-id.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  serviceKey: process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
};

// Export for use in server.js
module.exports = supabaseConfig;