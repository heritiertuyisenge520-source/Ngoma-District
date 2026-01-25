console.log('Starting debug test...');

try {
  console.log('Loading dotenv...');
  const dotenv = require('dotenv');
  const result = dotenv.config();
  console.log('Dotenv result:', result.error ? result.error.message : 'Success');
  
  console.log('Environment variables:');
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  console.log('PORT:', process.env.PORT || 'Not set');
  
  console.log('Loading mongoose...');
  const mongoose = require('mongoose');
  
  console.log('Attempting to connect to database...');
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test')
    .then(() => {
      console.log('Database connection successful');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database connection failed:', err.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('Error in debug test:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
