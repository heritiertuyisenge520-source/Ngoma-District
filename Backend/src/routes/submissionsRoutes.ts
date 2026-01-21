import express from 'express';
import { SubmissionModel, EntryModel } from '../models';
import { authenticate, authorize, PERMISSIONS, authorizeUnitAccess, authorizeSubmissionAccess, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all submissions
router.get('/', authenticate, authorizeSubmissionAccess, async (req: AuthenticatedRequest, res) => {
    try {
        let query: any = {};
        
        // Apply role-based filtering
        if (req.user?.userType === 'employee') {
            // Employees can only see their own submissions
            query.submittedBy = req.user.email;
        } else if (req.user?.userType === 'head') {
            // Heads can see submissions from their unit
            // We'll need to add unit field to submissions for this to work properly
            // For now, heads can see all submissions (will be filtered on frontend)
        }
        // Super admins can see all submissions (no filtering)

        const submissions = await SubmissionModel.find(query)
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
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
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
router.post('/', authenticate, authorize(PERMISSIONS.SUBMIT_DATA), async (req: AuthenticatedRequest, res) => {
    try {
        const submissionData = req.body;

        // DEBUG: Log incoming submission data
        console.log('INCOMING SUBMISSION DATA:', {
            indicatorId: submissionData.indicatorId,
            indicatorName: submissionData.indicatorName,
            value: submissionData.value,
            hasSubValues: submissionData.subValues && Object.keys(submissionData.subValues).length > 0,
            subValues: submissionData.subValues,
            submittedBy: submissionData.submittedBy
        });

        const submission = new SubmissionModel(submissionData);
        await submission.save();

        // DEBUG: Log saved submission
        console.log('SAVED SUBMISSION:', {
            _id: submission._id,
            indicatorId: submission.indicatorId,
            value: submission.value,
            hasSubValues: submission.subValues && Object.keys(submission.subValues).length > 0,
            subValues: submission.subValues
        });

        res.status(201).json(submission);
    } catch (error: any) {
        console.error('Error creating submission:', error);
        res.status(400).json({ message: 'Error creating submission', error: error.message });
    }
});

// Update a submission
router.put('/:id', authenticate, authorize(PERMISSIONS.EDIT_OWN_DATA), async (req: AuthenticatedRequest, res) => {
    try {
        // DEBUG: Log update data
        console.log('UPDATE SUBMISSION DATA:', {
            submissionId: req.params.id,
            updateData: req.body,
            hasSubValues: req.body.subValues && Object.keys(req.body.subValues).length > 0
        });

        const submission = await SubmissionModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        // DEBUG: Log updated submission
        console.log('UPDATED SUBMISSION:', {
            _id: submission._id,
            hasSubValues: submission.subValues && Object.keys(submission.subValues).length > 0,
            subValues: submission.subValues
        });

        res.json(submission);
    } catch (error: any) {
        console.error('Error updating submission:', error);
        res.status(400).json({ message: 'Error updating submission', error: error.message });
    }
});

// Delete a submission
router.delete('/:id', authenticate, authorize(PERMISSIONS.DELETE_DATA), async (req: AuthenticatedRequest, res) => {
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
router.get('/by-quarter', authenticate, async (req: AuthenticatedRequest, res) => {
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
