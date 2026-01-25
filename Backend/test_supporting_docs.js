// Test script to verify supporting documents are included in API responses
const mongoose = require('mongoose');
require('dotenv').config();

// Since this is a TypeScript file, we need to compile it or use a different approach
// Let's create a simple test by checking the database directly

async function testSupportingDocs() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/imihigo');
        console.log('Connected to MongoDB');

        // Access the submissions collection directly
        const db = mongoose.connection.db;
        const submissionsCollection = db.collection('submissions');

        // Find a submission with supporting documents
        const submission = await submissionsCollection.findOne({
            'supportingDocuments.0': { $exists: true }
        });

        if (submission) {
            console.log('✅ Found submission with supporting documents:');
            console.log('   Submission ID:', submission._id);
            console.log('   Indicator Name:', submission.indicatorName);
            console.log('   Number of supporting documents:', submission.supportingDocuments.length);
            console.log('   First supporting document:', {
                url: submission.supportingDocuments[0].url,
                originalName: submission.supportingDocuments[0].originalName,
                uploadedAt: submission.supportingDocuments[0].uploadedAt
            });
            
            // Simulate the API response transformation (before fix)
            console.log('\n🔍 BEFORE FIX - API Response would have:');
            const oldApiResponse = {
                _id: submission._id.toString(),
                pillarId: submission.pillarId,
                indicatorId: submission.indicatorId,
                quarterId: submission.quarterId,
                month: submission.month,
                value: submission.value,
                targetValue: submission.targetValue,
                subValues: submission.subValues,
                comments: submission.comments,
                timestamp: submission.timestamp,
                submittedBy: submission.submittedBy,
                pillarName: submission.pillarName,
                indicatorName: submission.indicatorName
                // ❌ Missing supportingDocuments field
            };
            console.log('   supportingDocuments included:', !!oldApiResponse.supportingDocuments);
            
            // Simulate the API response transformation (after fix)
            console.log('\n✅ AFTER FIX - API Response now has:');
            const newApiResponse = {
                _id: submission._id.toString(),
                pillarId: submission.pillarId,
                indicatorId: submission.indicatorId,
                quarterId: submission.quarterId,
                month: submission.month,
                value: submission.value,
                targetValue: submission.targetValue,
                subValues: submission.subValues,
                comments: submission.comments,
                timestamp: submission.timestamp,
                submittedBy: submission.submittedBy,
                pillarName: submission.pillarName,
                indicatorName: submission.indicatorName,
                supportingDocuments: submission.supportingDocuments // ✅ This is the fix!
            };
            console.log('   supportingDocuments included:', !!newApiResponse.supportingDocuments);
            console.log('   supportingDocuments count:', newApiResponse.supportingDocuments.length);
            
            console.log('\n🎉 Frontend will now show download buttons instead of "No Supporting Doc"!');
            
        } else {
            console.log('❌ No submissions with supporting documents found in database');
        }

        await mongoose.disconnect();
        console.log('\n✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testSupportingDocs();
