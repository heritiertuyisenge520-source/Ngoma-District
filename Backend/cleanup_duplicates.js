require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupDuplicates() {
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
    
    // Find all duplicates
    console.log('Finding duplicates...');
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
          docs: { $push: { id: '$_id', timestamp: '$timestamp', pillarId: '$pillarId', indicatorId: '$indicatorId', quarterId: '$quarterId', month: '$month' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    console.log('Found', duplicates.length, 'duplicate groups');
    
    if (duplicates.length > 0) {
      // Clean up duplicates (keep newest)
      for (const group of duplicates) {
        console.log(`\nDuplicate group: ${group._id.pillarId} + ${group._id.indicatorId} + ${group._id.quarterId} + ${group._id.month} (${group.count} entries)`);
        
        // Sort by timestamp (newest first)
        group.docs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Keep the newest one, delete the rest
        for (let i = 1; i < group.docs.length; i++) {
          await submissions.deleteOne({ _id: group.docs[i].id });
          console.log(`  ✗ Deleted duplicate: ${group.docs[i].id} (timestamp: ${group.docs[i].timestamp})`);
        }
        console.log(`  ✓ Kept newest: ${group.docs[0].id} (timestamp: ${group.docs[0].timestamp})`);
      }
      console.log('\n✅ Cleanup completed!');
    } else {
      console.log('✅ No duplicates found');
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
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
