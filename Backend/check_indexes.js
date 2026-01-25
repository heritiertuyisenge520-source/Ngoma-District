require('dotenv').config();
const mongoose = require('mongoose');

async function checkIndexes() {
  try {
    // Use the same MONGO_URI as your application
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ngoma-district';
    console.log('Connecting to:', mongoUri);
    
    // Connect to your database
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get the submissions collection
    const db = mongoose.connection.db;
    const submissions = db.collection('submissions');
    
    // Check existing indexes
    console.log('\nChecking existing indexes...');
    const indexes = await submissions.indexes();
    
    indexes.forEach(index => {
      console.log(`Index: ${index.name}`);
      console.log(`  Key:`, index.key);
      console.log(`  Unique: ${index.unique || false}`);
      console.log('---');
    });
    
    // Check if our unique index exists
    const uniqueIndex = indexes.find(idx => 
      idx.name && idx.name.includes('pillarId') && idx.unique === true
    );
    
    if (uniqueIndex) {
      console.log('✅ Unique index found and active');
    } else {
      console.log('❌ Unique index not found - creating it...');
      await submissions.createIndex(
        { pillarId: 1, indicatorId: 1, quarterId: 1, month: 1 },
        { unique: true, background: true }
      );
      console.log('✅ Unique index created successfully');
    }
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIndexes();
