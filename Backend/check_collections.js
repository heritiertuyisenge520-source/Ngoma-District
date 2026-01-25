require('dotenv').config();
const mongoose = require('mongoose');

async function checkCollections() {
  try {
    // Use the same MONGO_URI as your application
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ngoma-district';
    console.log('Connecting to:', mongoUri);
    
    // Connect to your database
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('\nChecking all collections in database...');
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Check for submissions collection variations
    const submissionCollections = collections.filter(c => 
      c.name.toLowerCase().includes('submission')
    );
    
    if (submissionCollections.length > 0) {
      console.log('\nFound submission-related collections:');
      submissionCollections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
      
      // Check the first submission collection
      const submissionsCollection = db.collection(submissionCollections[0].name);
      const count = await submissionsCollection.countDocuments();
      console.log(`\nDocument count in ${submissionCollections[0].name}: ${count}`);
      
      if (count > 0) {
        // Check for duplicates in this collection
        const duplicates = await submissionsCollection.aggregate([
          {
            $group: {
              _id: { 
                pillarId: '$pillarId', 
                indicatorId: '$indicatorId', 
                quarterId: '$quarterId', 
                month: '$month' 
              },
              count: { $sum: 1 }
            }
          },
          {
            $match: { count: { $gt: 1 } }
          }
        ]).toArray();
        
        console.log(`Found ${duplicates.length} duplicate groups in ${submissionCollections[0].name}`);
      }
    } else {
      console.log('\nNo submission collections found');
    }
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCollections();
