import express from 'express';
import { SubmissionModel, EntryModel } from '../models';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get all submissions
router.get('/', async (req, res) => {
    try {
        const submissions = await SubmissionModel.find({})
            .sort({ timestamp: -1 })
            .lean();
        
        // Transform submissions to match MonitoringEntry format expected by frontend
        const entries = submissions.map(sub => ({
            _id: sub._id.toString(),
            pillarId: sub.pillarId,
            outputId: '', // Not in SubmissionModel, will need to be added if needed
            indicatorId: sub.indicatorId,
            quarterId: sub.quarterId,
            month: sub.month,
            value: sub.value,
            targetValue: sub.targetValue,
            subValues: sub.subValues,
            comments: sub.comments,
            timestamp: sub.timestamp,
            submittedBy: sub.submittedBy,
            pillarName: sub.pillarName,
            indicatorName: sub.indicatorName
        }));

        res.json(entries);
    } catch (error: any) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
});

// Get submission by ID
router.get('/:id', async (req, res) => {
    try {
        const submission = await SubmissionModel.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json(submission);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching submission', error: error.message });
    }
});

// Create a new submission
router.post('/', async (req, res) => {
    try {
        const submissionData = req.body;
        const submission = new SubmissionModel(submissionData);
        await submission.save();
        res.status(201).json(submission);
    } catch (error: any) {
        console.error('Error creating submission:', error);
        res.status(400).json({ message: 'Error creating submission', error: error.message });
    }
});

// Update a submission
router.put('/:id', authenticate, authorize(['super_admin']), async (req, res) => {
    try {
        const submission = await SubmissionModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json(submission);
    } catch (error: any) {
        res.status(400).json({ message: 'Error updating submission', error: error.message });
    }
});

// Delete a submission
router.delete('/:id', authenticate, authorize(['super_admin']), async (req, res) => {
    try {
        const submission = await SubmissionModel.findByIdAndDelete(req.params.id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json({ message: 'Submission deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting submission', error: error.message });
    }
});

// Get submissions by quarter
router.get('/by-quarter', async (req, res) => {
    try {
        const { quarterId } = req.query;
        const query: any = {};
        if (quarterId) {
            query.quarterId = quarterId;
        }
        const submissions = await SubmissionModel.find(query).sort({ timestamp: -1 });
        res.json(submissions);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching submissions by quarter', error: error.message });
    }
});

export default router;
