const mongoose = require('mongoose');
require('dotenv').config();

async function getAllIndicatorsSummary() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const indicatorsCollection = db.collection('indicators');
  
  const indicators = await indicatorsCollection.find({}).toArray();
  
  console.log('=== INDICATOR TARGETS VERIFICATION ===');
  console.log(`Total indicators: ${indicators.length}\n`);
  
  // Group by pillar
  const byPillar = {};
  indicators.forEach(indicator => {
    if (!byPillar[indicator.pillarId]) {
      byPillar[indicator.pillarId] = [];
    }
    byPillar[indicator.pillarId].push(indicator);
  });
  
  Object.keys(byPillar).forEach(pillarId => {
    console.log(`=== ${pillarId.toUpperCase()} PILLAR (${byPillar[pillarId].length} indicators) ===`);
    
    byPillar[pillarId].forEach((ind, index) => {
      console.log(`${index + 1}. [ID: ${ind.id}] ${ind.name}`);
      
      if (ind.isDual && ind.subIndicators && ind.subIndicators.length > 0) {
        console.log(`   Type: DUAL with ${ind.subIndicators.length} sub-indicators`);
        ind.subIndicators.forEach((sub, subIdx) => {
          console.log(`     ${subIdx + 1}. ${sub.name}`);
          console.log(`        Targets: Q1=${sub.targets.q1}, Q2=${sub.targets.q2}, Q3=${sub.targets.q3}, Q4=${sub.targets.q4}, Annual=${sub.targets.annual}`);
        });
      } else {
        console.log(`   Type: ${ind.measurementType || 'undefined'}`);
        if (ind.targets) {
          console.log(`   Targets: Q1=${ind.targets.q1}, Q2=${ind.targets.q2}, Q3=${ind.targets.q3}, Q4=${ind.targets.q4}, Annual=${ind.targets.annual}`);
        } else {
          console.log(`   Targets: NOT DEFINED`);
        }
      }
      console.log('');
    });
  });
  
  await mongoose.connection.close();
}

getAllIndicatorsSummary().catch(console.error);
