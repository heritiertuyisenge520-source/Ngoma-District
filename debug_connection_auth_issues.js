/**
 * Debug Script for Connection and Authentication Issues
 * Analyzes the root causes and provides solutions
 */

console.log('=== Debugging Connection & Authentication Issues ===\n');

console.log('🔍 PROBLEM ANALYSIS:\n');

console.log('1. CONNECTION ISSUES (ERR_CONNECTION_REFUSED):');
console.log('   • Frontend trying to connect to: http://localhost:5000');
console.log('   • Backend server is NOT running on port 5000');
console.log('   • This causes "Failed to fetch" and connection refused errors\n');

console.log('2. AUTHENTICATION ISSUES (401 Unauthorized):');
console.log('   • Even when backend is running, requests get 401 errors');
console.log('   • This happens because authentication token is missing or invalid');
console.log('   • Token might not be stored properly or might be expired\n');

console.log('📁 CONFIGURATION ANALYSIS:\n');

console.log('FRONTEND CONFIGURATION (frontend/.env):');
console.log('   • VITE_API_URL=http://localhost:5000');
console.log('   • This means frontend expects backend at localhost:5000\n');

console.log('BACKEND CONFIGURATION (Backend/.env):');
console.log('   • NODE_ENV=development');
console.log('   • MONGO_URI=mongodb://127.0.0.1:27017/Imihigo_system');
console.log('   • FRONTEND_URL=http://localhost:3000/');
console.log('   • Backend expects to run on some port (likely 5000)\n');

console.log('🚨 ROOT CAUSES:\n');

console.log('CAUSE 1: Backend Server Not Running');
console.log('   • The backend server needs to be started manually');
console.log('   • Frontend expects it at http://localhost:5000');
console.log('   • Without backend, all API calls will fail\n');

console.log('CAUSE 2: Token Storage Issue');
console.log('   • User might have logged in before our token storage fix');
console.log('   • Old sessions don\'t have the authToken in localStorage');
console.log('   • Need to log out and log back in to get fresh token\n');

console.log('CAUSE 3: CORS or Network Configuration');
console.log('   • If backend is running but on different port/domain');
console.log('   • CORS headers might block the requests');
console.log('   • Need to ensure proper CORS setup in backend\n');

console.log('🔧 SOLUTIONS:\n');

console.log('SOLUTION 1: Start the Backend Server');
console.log('   • Navigate to Backend directory: cd Backend');
console.log('   • Install dependencies: npm install');
console.log('   • Start the server: npm run dev');
console.log('   • Server should start on http://localhost:5000\n');

console.log('SOLUTION 2: Verify Backend is Running');
console.log('   • Open browser and visit: http://localhost:5000');
console.log('   • Should see backend response or API documentation');
console.log('   • If not, backend is not running properly\n');

console.log('SOLUTION 3: Clear Old Session and Login Fresh');
console.log('   • Open browser developer tools (F12)');
console.log('   • Go to Application tab → Local Storage');
console.log('   • Clear all localStorage data');
console.log('   • Log out and log back in as admin');
console.log('   • This ensures fresh token is stored\n');

console.log('SOLUTION 4: Check Token in localStorage');
console.log('   • After logging in, check localStorage for "authToken"');
console.log('   • If missing, our token storage fix isn\'t working');
console.log('   • If present, copy it and test in Postman/Insomnia\n');

console.log('SOLUTION 5: Test API Directly');
console.log('   • Use Postman or Insomnia to test the API');
console.log('   • Send GET request to: http://localhost:5000/api/submissions');
console.log('   • Include Authorization header: Bearer <your_token>');
console.log('   • Should return list of submissions if working\n');

console.log('🧪 DEBUGGING STEPS:\n');

console.log('STEP 1: Check if Backend is Running');
console.log('   Command: curl http://localhost:5000');
console.log('   Expected: Should return some response');
console.log('   Actual: If "Connection refused", backend is not running\n');

console.log('STEP 2: Check MongoDB Connection');
console.log('   • Backend needs MongoDB running at: mongodb://127.0.0.1:27017');
console.log('   • If MongoDB not running, backend will fail to start');
console.log('   • Start MongoDB if needed\n');

console.log('STEP 3: Check Token Storage');
console.log('   JavaScript to run in browser console:');   console.log('   localStorage.getItem("authToken")');
console.log('   Expected: Should return a JWT token string');
console.log('   Actual: If null/undefined, token not stored properly\n');

console.log('STEP 4: Test Authentication Manually');
console.log('   JavaScript to test token:');   console.log('   const token = localStorage.getItem("authToken");');
console.log('   fetch("http://localhost:5000/api/submissions", {');
console.log('     headers: { Authorization: `Bearer ${token}` }');
console.log('   })');
console.log('   .then(r => r.json())');
console.log('   .then(console.log)');
console.log('   .catch(console.error);\n');

console.log('📋 COMMON ISSUES AND FIXES:\n');

console.log('ISSUE: Backend not starting');
console.log('   • Check MongoDB is running');
console.log('   • Check all dependencies installed (npm install)');
console.log('   • Check for port conflicts (kill process on port 5000)');
console.log('   • Check backend logs for errors\n');

console.log('ISSUE: Token not stored after login');
console.log('   • Verify login response contains token');
console.log('   • Check our token storage code in LoginView.tsx');
console.log('   • Ensure no JavaScript errors during login');
console.log('   • Try different browser or incognito mode\n');

console.log('ISSUE: 401 Unauthorized even with token');
console.log('   • Token might be expired');
console.log('   • User role might not be authorized');
console.log('   • Token format might be wrong');
console.log('   • Backend might have different JWT secret\n');

console.log('🎯 QUICK FIX CHECKLIST:\n');

console.log('✅ Start MongoDB database');
console.log('✅ Start backend server (npm run dev in Backend/)');
console.log('✅ Verify backend is accessible at http://localhost:5000');
console.log('✅ Clear browser localStorage');
console.log('✅ Log out and log back in as admin');
console.log('✅ Verify authToken is stored in localStorage');
console.log('✅ Test delete operation again');

console.log('\n💡 PRO TIP:');
console.log('   If you\'re using the production backend instead of localhost,');
console.log('   change VITE_API_URL in frontend/.env to:');
console.log('   VITE_API_URL=https://full-system-8.onrender.com');
console.log('   Then restart the frontend development server.');

console.log('\n🚀 Once backend is running and token is properly stored,');
console.log('   the delete functionality should work perfectly!');
