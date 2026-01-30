import express from 'express';

import mongoose from 'mongoose';

import { SubmissionModel, EntryModel, DataChangeRequestModel } from '../models';

import { authenticate, authorize, PERMISSIONS, authorizeUnitAccess, authorizeSubmissionAccess, AuthenticatedRequest } from '../middleware/auth';

import { generateSubmissionIdQR } from '../utils/qrGenerator';

import jsPDF from 'jspdf';



const router = express.Router();



// Get all submissions for dashboard (employees get aggregated view)

router.get('/dashboard', authenticate, async (req: AuthenticatedRequest, res) => {

    try {

        let query: any = {};

        

        // Apply role-based filtering for dashboard

        if (req.user?.userType === 'employee') {

            // Employees see all submissions but without sensitive user info

            // Remove the submittedBy filter to show all data for dashboard

            // We'll handle user privacy in response transformation

        } else if (req.user?.userType === 'head') {

            // Heads can see submissions from their unit

            // We'll need to add unit field to submissions for this to work properly

            // For now, heads can see all submissions (will be filtered on frontend)

        }

        // Super admins can see all submissions (no filtering)



        const submissions = await SubmissionModel.find(query)

            .sort({ timestamp: -1 })

            .lean();



        // Transform submissions for dashboard view

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

            // For employees, hide or anonymize submitter info

            submittedBy: req.user?.userType === 'employee' ? 'Employee' : sub.submittedBy,

            pillarName: sub.pillarName,

            indicatorName: sub.indicatorName,

            supportingDocuments: sub.supportingDocuments,

            isNotApplicable: sub.isNotApplicable || false // Include N/A flag

        }));



        res.json(entries);

    } catch (error: any) {

        console.error('Error fetching dashboard submissions:', error);

        res.status(500).json({ message: 'Error fetching dashboard submissions', error: error.message });

    }

});



// Get all submissions (with role-based filtering for individual views)

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

            indicatorName: sub.indicatorName,

            supportingDocuments: sub.supportingDocuments

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



// Check for duplicate submission

router.post('/check-duplicate', authenticate, async (req: AuthenticatedRequest, res) => {

    try {

        const { pillarId, indicatorId, quarterId, month } = req.body;

        

        const existingSubmission = await SubmissionModel.findOne({

            pillarId,

            indicatorId,

            quarterId,

            month,

            modificationStatus: { $ne: 'pending_approval' } // Don't count pending approvals as duplicates

        }).lean();



        if (existingSubmission) {

            return res.json({

                hasDuplicate: true,

                existingSubmission: {

                    _id: existingSubmission._id,

                    pillarName: existingSubmission.pillarName,

                    indicatorName: existingSubmission.indicatorName,

                    value: existingSubmission.value,

                    subValues: existingSubmission.subValues,

                    comments: existingSubmission.comments,

                    timestamp: existingSubmission.timestamp,

                    submittedBy: existingSubmission.submittedBy,

                    modificationStatus: existingSubmission.modificationStatus,

                    hasBeenModified: existingSubmission.hasBeenModified

                }

            });

        }



        res.json({ hasDuplicate: false });

    } catch (error: any) {

        console.error('Error checking duplicate submission:', error);

        res.status(500).json({ message: 'Error checking duplicate submission', error: error.message });

    }

});



// Create a new submission

router.post('/', authenticate, authorize(PERMISSIONS.SUBMIT_DATA), async (req: AuthenticatedRequest, res) => {

    try {

        const submissionData = req.body;

        const { action, existingSubmissionId } = req.body; // 'edit' or 'increment'



        // Handle edit workflow - directly update existing submission

        if (action === 'edit' && existingSubmissionId) {

            const existingSubmission = await SubmissionModel.findById(existingSubmissionId);

            if (!existingSubmission) {

                return res.status(404).json({ message: 'Existing submission not found' });

            }



            // Directly update the existing submission

            await SubmissionModel.findByIdAndUpdate(existingSubmissionId, {

                value: submissionData.value,

                targetValue: submissionData.targetValue,

                comments: submissionData.comments,

                subValues: submissionData.subValues,

                submittedBy: req.user?.email,

                timestamp: new Date(),

                modificationStatus: 'original',

                hasBeenModified: false,

                changeRequestId: undefined

            });



            return res.status(200).json({

                message: 'Submission updated successfully',

                submission: await SubmissionModel.findById(existingSubmissionId),

                requiresApproval: false

            });

        }



        // Handle increment workflow - replace existing submission with new data

        if (action === 'increment' || !action) {

            // Find and replace the existing submission

            const existingSubmission = await SubmissionModel.findOne({

                pillarId: submissionData.pillarId,

                indicatorId: submissionData.indicatorId,

                quarterId: submissionData.quarterId,

                month: submissionData.month

            });



            if (existingSubmission) {

                // Update the existing submission with new values

                await SubmissionModel.findByIdAndUpdate(existingSubmission._id, {

                    value: submissionData.value,

                    targetValue: submissionData.targetValue,

                    comments: submissionData.comments,

                    subValues: submissionData.subValues,

                    submittedBy: req.user?.email,

                    timestamp: new Date(),

                    modificationStatus: 'original',

                    hasBeenModified: false,

                    changeRequestId: undefined

                });



                return res.status(200).json({

                    message: 'Submission updated successfully',

                    submission: await SubmissionModel.findById(existingSubmission._id),

                    requiresApproval: false

                });

            } else {

                // Create new submission if none exists

                submissionData.submittedBy = req.user?.email;

                submissionData.modificationStatus = 'original';

                

                const submission = new SubmissionModel(submissionData);

                await submission.save();



                return res.status(201).json({

                    message: 'New submission created successfully',

                    submission,

                    requiresApproval: false

                });

            }

        }



        res.status(400).json({ message: 'Invalid action specified' });

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



// Generate PDF with QR code for a submission

router.get('/:id/pdf', authenticate, async (req: AuthenticatedRequest, res) => {

    try {

        const submission = await SubmissionModel.findById(req.params.id);

        if (!submission) {

            return res.status(404).json({ message: 'Submission not found' });

        }



        // Create PDF document

        const pdf = new jsPDF();

        

        // Generate QR code

        const qrCodeDataUrl = await generateSubmissionIdQR(submission._id.toString());

        

        // PDF Content

        const pageWidth = pdf.internal.pageSize.getWidth();

        const pageHeight = pdf.internal.pageSize.getHeight();

        

        // Header

        pdf.setFontSize(20);

        pdf.setFont('helvetica', 'bold');

        pdf.text('Imihigo Monitoring System', pageWidth / 2, 20, { align: 'center' });

        

        pdf.setFontSize(16);

        pdf.text('Submission Report', pageWidth / 2, 30, { align: 'center' });

        

        // Submission Details

        pdf.setFontSize(12);

        pdf.setFont('helvetica', 'normal');

        let yPos = 50;

        

        pdf.text(`Submission ID: ${submission._id}`, 20, yPos);

        yPos += 10;

        pdf.text(`Indicator: ${submission.indicatorName}`, 20, yPos);

        yPos += 10;

        pdf.text(`Pillar: ${submission.pillarName}`, 20, yPos);

        yPos += 10;

        pdf.text(`Quarter: ${submission.quarterId}`, 20, yPos);

        yPos += 10;

        pdf.text(`Month: ${submission.month}`, 20, yPos);

        yPos += 10;

        pdf.text(`Value: ${submission.value}`, 20, yPos);

        yPos += 10;

        pdf.text(`Submitted by: ${submission.submittedBy}`, 20, yPos);

        yPos += 10;

        

        if (submission.comments) {

            pdf.text(`Comments: ${submission.comments}`, 20, yPos);

            yPos += 10;

        }

        

        pdf.text(`Date: ${submission.timestamp.toLocaleDateString()}`, 20, yPos);

        yPos += 20;

        

        // Add QR Code

        pdf.text('Scan QR Code to View Submission:', 20, yPos);

        yPos += 10;

        

        // Add QR code image

        try {

            pdf.addImage(qrCodeDataUrl, 'PNG', pageWidth - 60, yPos - 5, 40, 40);

        } catch (error) {

            console.error('Error adding QR code to PDF:', error);

        }

        

        // Footer

        pdf.setFontSize(10);

        pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        

        // Set response headers

        res.setHeader('Content-Type', 'application/pdf');

        res.setHeader('Content-Disposition', `attachment; filename="submission_${submission._id}.pdf"`);

        

        // Send PDF

        const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

        res.send(pdfBuffer);

        

    } catch (error: any) {

        console.error('Error generating PDF:', error);

        res.status(500).json({ message: 'Error generating PDF', error: error.message });

    }

});



export default router;

