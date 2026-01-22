import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { FlatIndicatorModel } from '../models';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const verifyIndicator = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB...');

        const indicator = await FlatIndicatorModel.findOne({ id: '3' });
        if (!indicator) {
            console.log('Indicator 3 not found');
            process.exit(1);
        }

        console.log('=== Indicator 3 Verification ===');
        console.log('ID:', indicator.id);
        console.log('Name:', indicator.name);
        console.log('Pillar ID:', indicator.pillarId);
        console.log('Has targets:', !!indicator.targets);
        console.log('Has measurementType:', !!indicator.measurementType);
        console.log('Is dual:', indicator.isDual);
        console.log('Subindicators count:', indicator.subIndicators?.length || 0);
        
        if (indicator.subIndicators && indicator.subIndicators.length > 0) {
            console.log('\n=== Subindicators ===');
            indicator.subIndicators.forEach((sub: any, index: number) => {
                console.log(`${index + 1}. ${sub.name}`);
                console.log(`   Targets:`, sub.targets);
            });
        }

        console.log('\n=== Full Indicator Object ===');
        console.log(JSON.stringify(indicator.toObject(), null, 2));

        process.exit(0);
    } catch (error: any) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

verifyIndicator();
