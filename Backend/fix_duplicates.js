require('dotenv').config();
const mongoose = require('mongoose');

async function fixDuplicates() {
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
    
    // Find the duplicates
    console.log('\nFinding duplicates in Submissions collection...');
    const duplicates = await submissions.aggregate([
      {
        $group: {
          _id: { 
            pillarId: '$pillarId', 
            indicatorId: '$indicatorId', 
            quarterId: '$quarterId', 
            month: '$month' 
          },
          count: { $sum: 1 },
          docs: { $push: { id: '$_id', timestamp: '$timestamp', value: '$value', submittedBy: '$submittedBy' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} duplicate groups:`);
    
    if (duplicates.length > 0) {
      for (const group of duplicates) {
        console.log(`\nDuplicate group: ${group._id.pillarId} + ${group._id.indicatorId} + ${group._id.quarterId} + ${group._id.month} (${group.count} entries)`);
        
        // Show all entries in this group
        group.docs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ID: ${doc.id}, Value: ${doc.value}, By: ${doc.submittedBy}, Time: ${doc.timestamp}`);
        });
        
        // Sort by timestamp (newest first)
        group.docs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Delete all except the newest one
        for (let i = 1; i < group.docs.length; i++) {
          await submissions.deleteOne({ _id: group.docs[i].id });
          console.log(`  ✗ Deleted duplicate: ${group.docs[i].id}`);
        }
        console.log(`  ✓ Kept newest: ${group.docs[0].id}`);
      }
      
      // Now create the unique index
      console.log('\nCreating unique index...');
      await submissions.createIndex(
        { pillarId: 1, indicatorId: 1, quarterId: 1, month: 1 },
        { unique: true, background: true }
      );
      console.log('✅ Unique index created successfully');
      
    } else {
      console.log('No duplicates found');
    }
    
    // Verify no more duplicates
    const remainingDuplicates = await submissions.aggregate([
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
    
    console.log(`\nVerification: ${remainingDuplicates.length} duplicate groups remaining`);
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDuplicates();
