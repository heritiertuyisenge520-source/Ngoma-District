import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Extract indicators directly from the original seed data structure
const extractIndicatorsFromSeed = (): any[] => {
  // This will read the original seed.ts and extract all indicators
  const fs = require('fs');
  const path = require('path');
  
  const seedFilePath = path.join(__dirname, 'seed.ts');
  const seedContent = fs.readFileSync(seedFilePath, 'utf8');
  
  // Parse the PILLARS_DATA from seed.ts
  const pillarsDataMatch = seedContent.match(/const PILLARS_DATA = \[([\s\S]*?)\];/ms);
  if (!pillarsDataMatch) {
    throw new Error('Could not find PILLARS_DATA in seed.ts');
  }
  
  // Extract and evaluate the pillars data
  const pillarsData: any[] = eval(`[${pillarsDataMatch[1]}]`);
  
  const flatIndicators: any[] = [];
  let orderCounter = 1;
  
  pillarsData.forEach((pillar: any) => {
    pillar.outputs.forEach((output: any) => {
      output.indicators.forEach((indicator: any) => {
        const flatIndicator: any = {
          id: indicator.id,
          name: indicator.name.replace(/^\d+\.\s*/, ''), // Remove numbering like "1. ", "2. " etc.
          pillarId: pillar.id,
          measurementType: indicator.targets && Object.values(indicator.targets).some((val: any) => typeof val === 'string' && val.includes('%')) ? 'percentage' : 'cumulative',
          targets: indicator.targets,
          order: orderCounter++,
          createdAt: new Date("2024-01-15T10:30:00.000Z"),
          updatedAt: new Date("2024-01-15T10:30:00.000Z")
        };
        
        // Add isDual flag if present
        if (indicator.isDual) {
          flatIndicator.isDual = true;
        }
        
        flatIndicators.push(flatIndicator);
      });
    });
  });
  
  return flatIndicators;
};

const buildIndicators = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to MongoDB...');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Drop existing indicators collection if it exists
    const collections = await db.listCollections({ name: 'indicators' }).toArray();
    if (collections.length > 0) {
      await db.collection('indicators').drop();
      console.log('Dropped existing indicators collection.');
    }

    // Create indicators collection without schema validation for now
    await db.createCollection('indicators');

    // Extract indicators from original seed data
    const indicatorsData = extractIndicatorsFromSeed();
    console.log(`Extracted ${indicatorsData.length} indicators from original seed data.`);

    // Insert indicators data
    await db.collection('indicators').insertMany(indicatorsData);
    console.log(`Successfully inserted ${indicatorsData.length} indicators into indicators collection.`);

    // Create indexes for better performance
    await db.collection('indicators').createIndex({ pillarId: 1, order: 1 });
    await db.collection('indicators').createIndex({ id: 1 });
    console.log('Created indexes for efficient querying.');

    process.exit(0);
  } catch (error: any) {
    console.error('Error building indicators:', error.message);
    process.exit(1);
  }
};

buildIndicators();
