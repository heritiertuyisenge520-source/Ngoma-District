/**
 * Quick script to check what data is in the database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/imihigo';

const checkData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully!\n');

        const db = mongoose.connection.db;

        // Check submissions
        const submissionsCollection = db?.collection('submissions');
        const submissionsCount = await submissionsCollection?.countDocuments() || 0;
        console.log(`📊 Submissions: ${submissionsCount}`);

        if (submissionsCount > 0) {
            const samples = await submissionsCollection?.find({}).limit(5).toArray();
            console.log('\nSample submissions:');
            samples?.forEach((sub: any, idx: number) => {
                console.log(`  ${idx + 1}. Indicator: ${sub.indicatorName}, Value: ${sub.value}, Quarter: ${sub.quarterId}`);
            });
        }

        // Check users
        const usersCollection = db?.collection('users');
        const usersCount = await usersCollection?.countDocuments() || 0;
        console.log(`\n👥 Users: ${usersCount}`);

        await mongoose.disconnect();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkData();
