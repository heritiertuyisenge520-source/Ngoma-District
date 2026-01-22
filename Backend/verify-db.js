const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\nCollections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check pillars collection specifically
    const pillarsCollection = db.collection('pillars');
    const pillars = await pillarsCollection.find({}).toArray();
    
    console.log(`\nFound ${pillars.length} pillars:`);
    
    pillars.forEach((pillar, index) => {
      console.log(`\n${index + 1}. Pillar: ${pillar.name}`);
      console.log(`   ID: ${pillar.id}`);
      console.log(`   Outputs: ${pillar.outputs ? pillar.outputs.length : 0}`);
      
      if (pillar.outputs) {
        let totalIndicators = 0;
        pillar.outputs.forEach(output => {
          if (output.indicators) {
            totalIndicators += output.indicators.length;
          }
        });
        console.log(`   Total indicators: ${totalIndicators}`);
        
        // Show sample indicators
        pillar.outputs.slice(0, 2).forEach((output, outputIndex) => {
          console.log(`   Output ${outputIndex + 1}: ${output.name}`);
          if (output.indicators && output.indicators.length > 0) {
            console.log(`     Sample indicators:`);
            output.indicators.slice(0, 3).forEach((indicator, indIndex) => {
              console.log(`       ${indIndex + 1}. ${indicator.name}`);
            });
            if (output.indicators.length > 3) {
              console.log(`       ... and ${output.indicators.length - 3} more`);
            }
          }
        });
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyDB();
