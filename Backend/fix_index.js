require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
  try {
    // Use the same MONGO_URI as your application
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ngoma-district';
    console.log('Connecting to:', mongoUri);
    
    // Connect to your database
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get the Submissions collection
    const db = mongoose.connection.db;
    const submissions = db.collection('Submissions');
    
    // Drop the existing index
    console.log('\nDropping existing index...');
    try {
      await submissions.dropIndex('pillarId_1_indicatorId_1_quarterId_1_month_1');
      console.log('✅ Existing index dropped');
    } catch (error) {
      console.log('Index might not exist or already dropped');
    }
    
    // Create the unique index
    console.log('Creating unique index...');
    await submissions.createIndex(
      { pillarId: 1, indicatorId: 1, quarterId: 1, month: 1 },
      { unique: true, background: true }
    );
    console.log('✅ Unique index created successfully');
    
    // Verify the index
    console.log('\nVerifying indexes...');
    const indexes = await submissions.indexes();
    const uniqueIndex = indexes.find(idx => idx.unique === true);
    
    if (uniqueIndex) {
      console.log('✅ Unique index is active:', uniqueIndex.name);
    } else {
      console.log('❌ Unique index not found');
    }
    
    // Test the unique constraint
    console.log('\nTesting unique constraint...');
    const testDoc = {
      pillarId: "Economic Transformation Pillar",
      indicatorId: "1",
      quarterId: "q1", 
      month: "July",
      value: 999,
      submittedBy: "test@example.com",
      timestamp: new Date()
    };
    
    try {
      await submissions.insertOne(testDoc);
      console.log('❌ Test insertion succeeded - index might not be working');
      await submissions.deleteOne(testDoc); // Clean up
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint is working - duplicate prevented!');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIndex();
