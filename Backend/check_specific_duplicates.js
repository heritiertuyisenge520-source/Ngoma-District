require('dotenv').config();
const mongoose = require('mongoose');

async function checkSpecificDuplicates() {
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
    
    // Check for the specific duplicates you mentioned
    console.log('\nChecking for specific duplicates...');
    const specificDuplicates = await submissions.find({
      pillarId: "Economic Transformation Pillar",
      indicatorId: "1", 
      quarterId: "q1",
      month: "July"
    }).toArray();
    
    console.log(`Found ${specificDuplicates.length} submissions for Economic Transformation Pillar + indicator 1 + q1 + July`);
    
    if (specificDuplicates.length > 0) {
      specificDuplicates.forEach((doc, index) => {
        console.log(`\nSubmission ${index + 1}:`);
        console.log(`  ID: ${doc._id}`);
        console.log(`  Value: ${doc.value}`);
        console.log(`  Timestamp: ${doc.timestamp}`);
        console.log(`  Submitted By: ${doc.submittedBy}`);
      });
      
      // If there are multiple, delete the older ones
      if (specificDuplicates.length > 1) {
        console.log('\nDeleting older duplicates...');
        specificDuplicates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Keep the first (newest), delete the rest
        for (let i = 1; i < specificDuplicates.length; i++) {
          await submissions.deleteOne({ _id: specificDuplicates[i]._id });
          console.log(`✗ Deleted: ${specificDuplicates[i]._id}`);
        }
        console.log(`✓ Kept: ${specificDuplicates[0]._id}`);
      }
    }
    
    // Check all submissions for any potential duplicates
    console.log('\nChecking for any duplicates across all data...');
    const allDuplicates = await submissions.aggregate([
      {
        $group: {
          _id: { 
            pillarId: '$pillarId', 
            indicatorId: '$indicatorId', 
            quarterId: '$quarterId', 
            month: '$month' 
          },
          count: { $sum: 1 },
          docs: { $push: { id: '$_id', timestamp: '$timestamp', value: '$value' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    if (allDuplicates.length > 0) {
      console.log(`Found ${allDuplicates.length} duplicate groups:`);
      allDuplicates.forEach(group => {
        console.log(`  - ${group._id.pillarId} + ${group._id.indicatorId} + ${group._id.quarterId} + ${group._id.month}: ${group.count} entries`);
      });
    } else {
      console.log('No duplicates found in the database');
    }
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecificDuplicates();
