// API Configuration
// Change this URL based on your environment

// For production (cPanel), use your backend URL
// For development, use localhost:5000

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://uyho.org/api'  // Production: Your domain + /api
  : 'http://localhost:5000'; // Development

export default API_BASE_URL;
