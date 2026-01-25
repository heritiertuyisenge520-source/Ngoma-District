/**
 * Script to clear all submissions from the database
 * Run this to reset your data to 0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/imihigo';

const clearSubmissions = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully!');

        // Get the submissions collection
        const db = mongoose.connection.db;
        const submissionsCollection = db?.collection('submissions');

        if (!submissionsCollection) {
            console.error('Submissions collection not found!');
            return;
        }

        // Count existing submissions
        const count = await submissionsCollection.countDocuments();
        console.log(`Found ${count} submissions in the database`);

        if (count === 0) {
            console.log('Database is already empty!');
            await mongoose.disconnect();
            return;
        }

        // Ask for confirmation (in a real scenario, you'd use readline)
        console.log('\n⚠️  WARNING: This will delete ALL submissions!');
        console.log('If you want to proceed, the script will delete all data...\n');

        // Delete all submissions
        const result = await submissionsCollection.deleteMany({});
        console.log(`✅ Successfully deleted ${result.deletedCount} submissions!`);
        console.log('Your database is now empty and all progress should show 0%');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error clearing submissions:', error);
        process.exit(1);
    }
};

clearSubmissions();
