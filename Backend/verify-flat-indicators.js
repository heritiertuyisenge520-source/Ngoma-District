const mongoose = require('mongoose');
require('dotenv').config();

async function verifyFlatIndicators() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const indicatorsCollection = db.collection('indicators');
    
    // Check if indicators collection exists
    const collections = await db.listCollections({ name: 'indicators' }).toArray();
    if (collections.length === 0) {
      console.log('Indicators collection not found');
      process.exit(1);
    }
    
    const indicators = await indicatorsCollection.find({}).toArray();
    console.log(`\nFound ${indicators.length} indicators in flat structure:`);
    
    // Group by pillar
    const byPillar = {};
    indicators.forEach(indicator => {
      if (!byPillar[indicator.pillarId]) {
        byPillar[indicator.pillarId] = [];
      }
      byPillar[indicator.pillarId].push(indicator);
    });
    
    Object.keys(byPillar).forEach(pillarId => {
      console.log(`\n${pillarId.toUpperCase()} PILLAR (${byPillar[pillarId].length} indicators):`);
      
      // Show first few indicators as sample
      byPillar[pillarId].slice(0, 5).forEach((ind, index) => {
        console.log(`  ${index + 1}. [${ind.id}] ${ind.name}`);
        console.log(`     Type: ${ind.measurementType}, Order: ${ind.order}`);
        if (ind.isDual) {
          console.log(`     Dual: Yes (${ind.subIndicators ? ind.subIndicators.length : 0} sub-indicators)`);
          if (ind.subIndicators && ind.subIndicators.length > 0) {
            ind.subIndicators.slice(0, 2).forEach(sub => {
              console.log(`       - ${sub.key}: ${sub.name}`);
            });
            if (ind.subIndicators.length > 2) {
              console.log(`       ... and ${ind.subIndicators.length - 2} more`);
            }
          }
        }
        console.log(`     Targets: Q1=${ind.targets.q1}, Q2=${ind.targets.q2}, Q3=${ind.targets.q3}, Q4=${ind.targets.q4}, Annual=${ind.targets.annual}`);
      });
      
      if (byPillar[pillarId].length > 5) {
        console.log(`  ... and ${byPillar[pillarId].length - 5} more indicators`);
      }
    });
    
    // Show detailed example of a dual indicator
    const dualIndicator = indicators.find(ind => ind.isDual && ind.subIndicators);
    if (dualIndicator) {
      console.log(`\n=== DETAILED EXAMPLE OF DUAL INDICATOR ===`);
      console.log(`ID: ${dualIndicator.id}`);
      console.log(`Name: ${dualIndicator.name}`);
      console.log(`Pillar: ${dualIndicator.pillarId}`);
      console.log(`Measurement Type: ${dualIndicator.measurementType}`);
      console.log(`Order: ${dualIndicator.order}`);
      console.log(`Is Dual: ${dualIndicator.isDual}`);
      console.log(`Sub-Indicators (${dualIndicator.subIndicators.length}):`);
      dualIndicator.subIndicators.forEach((sub, index) => {
        console.log(`  ${index + 1}. ${sub.key}: ${sub.name}`);
        console.log(`     Targets: Q1=${sub.targets.q1}, Q2=${sub.targets.q2}, Q3=${sub.targets.q3}, Q4=${sub.targets.q4}, Annual=${sub.targets.annual}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyFlatIndicators();
