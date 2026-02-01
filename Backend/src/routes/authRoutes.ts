import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { UserModel, IndicatorAssignmentModel, DataChangeRequestModel, DataDeleteRequestModel, SubmissionPeriodModel, SubmissionModel, UNITS } from '../models';
import { generateAuthToken, authenticate, authorize, PERMISSIONS, authorizeUnitAccess, authorizeSubmissionAccess } from '../middleware/auth';

const router = express.Router();

// Super Admin email constant
const SUPER_ADMIN_EMAIL = 'baptise.nduwayezu@ngoma.gov.rw';

// Register a new user (requires admin approval)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, firstName, lastName, unit } = req.body;

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine user type and approval status based on role and unit
        const isSuperAdmin = email === SUPER_ADMIN_EMAIL;
        const isAuditUnit = unit === 'Department of audit';
        const isLeadersUnit = unit === 'District leaders';

        let userType = 'employee';
        let isApproved = false;

        if (isSuperAdmin) {
            userType = 'super_admin';
            isApproved = true;
        } else if (isAuditUnit) {
            userType = 'employee';
            // Audit department users are auto-approved
            isApproved = true;
        } else if (isLeadersUnit) {
            userType = 'leader';
            // District leaders are auto-approved
            isApproved = true;
        }

        const user = new UserModel({
            email,
            password: hashedPassword,
            name,
            firstName,
            lastName,
            role: role || 'viewer',
            unit: unit || null,
            isApproved,
            userType,
            isActive: true
        });

        await user.save();

        // If auto-approved (super admin, audit, or leaders), return with token
        if (isApproved) {
            const token = generateAuthToken(user._id.toString());
            return res.status(201).json({
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isApproved: true,
                    userType,
                    unit: user.unit
                },
                token
            });
        }

        // For regular users, return pending approval message
        res.status(201).json({
            message: `Thank you for registering on Ngoma District Imihigo Tracking Tool. Please wait for admin (${SUPER_ADMIN_EMAIL}) to approve your account.`,
            pending: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isApproved: false,
                userType
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: 'Error creating user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await UserModel.findOne({ email });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is approved (super admin is always approved)
        if (!user.isApproved && email !== SUPER_ADMIN_EMAIL) {
            return res.status(403).json({
                message: `Your account is pending approval. Please wait for admin (${SUPER_ADMIN_EMAIL}) to approve your account.`,
                pendingApproval: true
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateAuthToken(user._id.toString());

        // Get assigned indicators if user is an employee
        let assignedIndicators: any[] = [];
        if (user.userType === 'employee') {
            assignedIndicators = await IndicatorAssignmentModel.find({
                userEmail: user.email,
                isActive: true
            });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isApproved: user.isApproved,
                userType: user.userType,
                unit: user.unit
            },
            assignedIndicators,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ message: 'Error logging in' });
    }
});

// Get pending users (admin only)
router.get('/pending-users', authenticate, authorize(PERMISSIONS.APPROVE_USERS), async (req, res) => {
    try {
        const pendingUsers = await UserModel.find({
            isApproved: false,
            email: { $ne: SUPER_ADMIN_EMAIL }
        }).select('-password').sort({ createdAt: -1 });

        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Error fetching pending users' });
    }
});

// Get all approved users (for head of unit to see their team members)
router.get('/approved-users', authenticate, authorizeUnitAccess, async (req, res) => {
    try {
        const { unit } = req.query;

        const query: any = { isApproved: true };
        if (unit) {
            query.unit = unit;
        }

        const users = await UserModel.find(query)
            .select('-password')
            .sort({ name: 1 });

        res.json(users);
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Approve user (admin only)
router.post('/approve-user', authenticate, authorize(PERMISSIONS.APPROVE_USERS), async (req, res) => {
    try {
        const { userId, unit, userType, approverEmail } = req.body;

        if (!userId || !unit || !userType) {
            return res.status(400).json({ message: 'Missing required fields: userId, unit, userType' });
        }

        // Validate unit
        if (!UNITS.includes(unit)) {
            return res.status(400).json({ message: 'Invalid unit specified' });
        }

        // Validate userType
        if (!['head', 'employee'].includes(userType)) {
            return res.status(400).json({ message: 'Invalid userType. Must be "head" or "employee"' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isApproved = true;
        user.approvedAt = new Date();
        user.approvedBy = approverEmail;
        user.unit = unit;
        user.userType = userType;

        await user.save();

        res.json({
            message: 'User approved successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                unit: user.unit,
                userType: user.userType,
                isApproved: true
            }
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Error approving user' });
    }
});

// Reject/Delete user (admin only)
router.delete('/reject-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await UserModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User rejected and removed successfully' });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ message: 'Error rejecting user' });
    }
});

// Get units list
router.get('/units', async (req, res) => {
    res.json(UNITS);
});

// Assign indicator to user (head of unit only)
router.post('/assign-indicator', authenticate, authorize(PERMISSIONS.MANAGE_INDICATORS), async (req, res) => {
    try {
        const { userId, userEmail, userName, pillarId, pillarName, indicatorId, indicatorName, assignedBy, assignedByEmail, unit } = req.body;

        // Check if already assigned
        const existing = await IndicatorAssignmentModel.findOne({
            userEmail,
            indicatorId,
            isActive: true
        });

        if (existing) {
            return res.status(400).json({ message: 'This indicator is already assigned to this user' });
        }

        const assignment = new IndicatorAssignmentModel({
            userId,
            userEmail,
            userName,
            pillarId,
            pillarName,
            indicatorId,
            indicatorName,
            assignedBy,
            assignedByEmail,
            unit,
            isActive: true
        });

        await assignment.save();

        res.status(201).json({
            message: 'Indicator assigned successfully',
            assignment
        });
    } catch (error) {
        console.error('Error assigning indicator:', error);
        res.status(500).json({ message: 'Error assigning indicator' });
    }
});

// Get assigned indicators for a user
router.get('/assigned-indicators/:userEmail', authenticate, authorizeUnitAccess, async (req, res) => {
    try {
        const { userEmail } = req.params;

        const assignments = await IndicatorAssignmentModel.find({
            userEmail,
            isActive: true
        });

        res.json(assignments);
    } catch (error) {
        console.error('Error fetching assigned indicators:', error);
        res.status(500).json({ message: 'Error fetching assigned indicators' });
    }
});

// Remove indicator assignment
router.delete('/unassign-indicator/:assignmentId', async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await IndicatorAssignmentModel.findByIdAndUpdate(
            assignmentId,
            { isActive: false },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json({ message: 'Indicator unassigned successfully' });
    } catch (error) {
        console.error('Error unassigning indicator:', error);
        res.status(500).json({ message: 'Error unassigning indicator' });
    }
});

// Get all assignments for a unit (for head of unit)
router.get('/unit-assignments/:unit', authenticate, authorizeUnitAccess, async (req, res) => {
    try {
        const { unit } = req.params;

        const assignments = await IndicatorAssignmentModel.find({
            unit,
            isActive: true
        });

        res.json(assignments);
    } catch (error) {
        console.error('Error fetching unit assignments:', error);
        res.status(500).json({ message: 'Error fetching unit assignments' });
    }
});

// Password reset endpoint
router.post('/reset-password', async (req, res) => {
    try {
        const { email, role, newPassword } = req.body;

        // Find user by email and role
        const user = await UserModel.findOne({ email, role });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email and role combination' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password reset successfully! You can now login with your new password.' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// Verify user exists (for password reset form)
router.post('/verify-user', async (req, res) => {
    try {
        const { email, role } = req.body;
        const user = await UserModel.findOne({ email, role });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ exists: true, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying user' });
    }
});

// Get user profile by email
router.get('/user-profile/:email', authenticate, async (req, res) => {
    try {
        const { email } = req.params;
        const user = await UserModel.findOne({ email, isActive: true }).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            email: user.email,
            name: user.name,
            role: user.role,
            userType: user.userType,
            unit: user.unit,
            firstName: user.firstName,
            lastName: user.lastName,
            lastLogin: user.lastLogin,
            isApproved: user.isApproved
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Error fetching user profile' });
    }
});

// ============ DATA CHANGE REQUEST ROUTES ============

// Create a data change request (employee wants to edit submission)
router.post('/data-change-request', async (req, res) => {
    try {
        const {
            submissionId, requestedBy, requestedByName, indicatorId, indicatorName,
            pillarName, quarterId, month, oldValue, newValue, oldSubValues,
            newSubValues, oldComments, newComments, unit
        } = req.body;

        const request = new DataChangeRequestModel({
            submissionId, requestedBy, requestedByName, indicatorId, indicatorName,
            pillarName, quarterId, month, oldValue, newValue, oldSubValues,
            newSubValues, oldComments, newComments, unit, status: 'pending'
        });

        await request.save();

        res.status(201).json({
            message: 'Your edit request has been submitted. Please wait for the Head of Unit to approve your changes.',
            request
        });
    } catch (error) {
        console.error('Error creating data change request:', error);
        res.status(500).json({ message: 'Error submitting change request' });
    }
});

// Get pending change requests for a unit (head of unit)
router.get('/data-change-requests/:unit', async (req, res) => {
    try {
        const { unit } = req.params;
        const { status } = req.query;

        const query: any = { unit };
        if (status) {
            query.status = status;
        }

        const requests = await DataChangeRequestModel.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching change requests:', error);
        res.status(500).json({ message: 'Error fetching change requests' });
    }
});

// Approve a data change request (head of unit)
router.post('/approve-change-request/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewedBy, reviewedByName, reviewComment } = req.body;

        const request = await DataChangeRequestModel.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Change request not found' });
        }

        // Update the actual submission
        const submission = await SubmissionModel.findById(request.submissionId);
        if (submission) {
            // Store original values before updating
            submission.originalValue = submission.value;
            submission.originalSubValues = submission.subValues;
            submission.originalComments = submission.comments;
            
            // Update with new values
            submission.value = request.newValue;
            if (request.newSubValues) {
                submission.subValues = request.newSubValues;
            }
            if (request.newComments) {
                submission.comments = request.newComments;
            }
            
            // Update modification tracking fields
            submission.hasBeenModified = true;
            submission.modifiedAt = new Date();
            submission.modifiedBy = request.requestedBy;
            submission.modificationStatus = 'approved_modified';
            submission.changeRequestId = request._id.toString();
            
            await submission.save();
        }

        // Update the change request status
        request.status = 'approved';
        request.reviewedBy = reviewedBy;
        request.reviewedByName = reviewedByName;
        request.reviewedAt = new Date();
        request.reviewComment = reviewComment || '';
        await request.save();

        res.json({
            message: 'Change request approved. The data has been updated in the database.',
            request
        });
    } catch (error) {
        console.error('Error approving change request:', error);
        res.status(500).json({ message: 'Error approving change request' });
    }
});

// Reject a data change request (head of unit)
router.post('/reject-change-request/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewedBy, reviewedByName, reviewComment } = req.body;

        const request = await DataChangeRequestModel.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Change request not found' });
        }

        // Reset submission status back to original
        const submission = await SubmissionModel.findById(request.submissionId);
        if (submission) {
            submission.modificationStatus = 'original';
            submission.changeRequestId = undefined;
            await submission.save();
        }

        request.status = 'rejected';
        request.reviewedBy = reviewedBy;
        request.reviewedByName = reviewedByName;
        request.reviewedAt = new Date();
        request.reviewComment = reviewComment || 'Request was rejected';
        await request.save();

        res.json({
            message: 'Change request rejected.',
            request
        });
    } catch (error) {
        console.error('Error rejecting change request:', error);
        res.status(500).json({ message: 'Error rejecting change request' });
    }
});

// Get user's own change requests
router.get('/my-change-requests/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const requests = await DataChangeRequestModel.find({ requestedBy: email }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching user change requests:', error);
        res.status(500).json({ message: 'Error fetching change requests' });
    }
});

// ============ DATA DELETE REQUEST ROUTES ============

// Create a data delete request (employee wants to delete submission)
router.post('/data-delete-request', async (req, res) => {
    try {
        const {
            submissionId, requestedBy, requestedByName, indicatorId, indicatorName,
            pillarName, quarterId, month, oldValue, oldSubValues, oldComments, unit
        } = req.body;

        const request = new DataDeleteRequestModel({
            submissionId, requestedBy, requestedByName, indicatorId, indicatorName,
            pillarName, quarterId, month, oldValue, oldSubValues, oldComments, unit, status: 'pending'
        });

        await request.save();

        res.status(201).json({
            message: 'Your delete request has been submitted. Please wait for the Head of Unit to approve the deletion.',
            request
        });
    } catch (error) {
        console.error('Error creating data delete request:', error);
        res.status(500).json({ message: 'Error submitting delete request' });
    }
});

// Get pending delete requests for a unit (head of unit)
router.get('/data-delete-requests/:unit', async (req, res) => {
    try {
        const { unit } = req.params;
        const { status } = req.query;

        const query: any = { unit };
        if (status) {
            query.status = status;
        }

        const requests = await DataDeleteRequestModel.find(query).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching delete requests:', error);
        res.status(500).json({ message: 'Error fetching delete requests' });
    }
});

// Approve a data delete request (head of unit)
router.post('/approve-delete-request/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewedBy, reviewedByName, reviewComment } = req.body;

        const request = await DataDeleteRequestModel.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Delete request not found' });
        }

        // Delete the actual submission
        const submission = await SubmissionModel.findByIdAndDelete(request.submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found for deletion' });
        }

        // Update the delete request status
        request.status = 'approved';
        request.reviewedBy = reviewedBy;
        request.reviewedByName = reviewedByName;
        request.reviewedAt = new Date();
        request.reviewComment = reviewComment || '';
        await request.save();

        res.json({
            message: 'Delete request approved. The data has been removed from the database.',
            request
        });
    } catch (error) {
        console.error('Error approving delete request:', error);
        res.status(500).json({ message: 'Error approving delete request' });
    }
});

// Reject a data delete request (head of unit)
router.post('/reject-delete-request/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { reviewedBy, reviewedByName, reviewComment } = req.body;

        const request = await DataDeleteRequestModel.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Delete request not found' });
        }

        request.status = 'rejected';
        request.reviewedBy = reviewedBy;
        request.reviewedByName = reviewedByName;
        request.reviewedAt = new Date();
        request.reviewComment = reviewComment || 'Request was rejected';
        await request.save();

        res.json({
            message: 'Delete request rejected.',
            request
        });
    } catch (error) {
        console.error('Error rejecting delete request:', error);
        res.status(500).json({ message: 'Error rejecting delete request' });
    }
});

// Get user's own delete requests
router.get('/my-delete-requests/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const requests = await DataDeleteRequestModel.find({ requestedBy: email }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching user delete requests:', error);
        res.status(500).json({ message: 'Error fetching delete requests' });
    }
});

// ============ SUBMISSION PERIOD ROUTES ============

// Get active submission period
router.get('/submission-period/active', async (req, res) => {
    try {
        const now = new Date();
        const activePeriod = await SubmissionPeriodModel.findOne({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });
        res.json(activePeriod || null);
    } catch (error) {
        console.error('Error fetching active submission period:', error);
        res.status(500).json({ message: 'Error fetching submission period' });
    }
});

// Get current submission period (for countdown display)
router.get('/submission-period/current', async (req, res) => {
    try {
        const activePeriod = await SubmissionPeriodModel.findOne({ isActive: true }).sort({ createdAt: -1 });
        res.json(activePeriod || null);
    } catch (error) {
        console.error('Error fetching current submission period:', error);
        res.status(500).json({ message: 'Error fetching submission period' });
    }
});

// Get all submission periods (admin)
router.get('/submission-periods', authenticate, authorize(PERMISSIONS.MANAGE_PERIODS), async (req, res) => {
    try {
        const periods = await SubmissionPeriodModel.find().sort({ createdAt: -1 });
        res.json(periods);
    } catch (error) {
        console.error('Error fetching submission periods:', error);
        res.status(500).json({ message: 'Error fetching submission periods' });
    }
});

// Create/Update submission period (admin only)
router.post('/submission-period', authenticate, authorize(PERMISSIONS.MANAGE_PERIODS), async (req, res) => {
    try {
        const { description, startDate, endDate, createdBy, createdByName } = req.body;

        // Deactivate all previous periods
        await SubmissionPeriodModel.updateMany({}, { isActive: false });

        const period = new SubmissionPeriodModel({
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: true,
            createdBy,
            createdByName
        });

        await period.save();

        res.status(201).json({
            message: 'Submission period created successfully',
            period
        });
    } catch (error) {
        console.error('Error creating submission period:', error);
        res.status(500).json({ message: 'Error creating submission period' });
    }
});

// Update submission period (admin)
router.patch('/submission-period/:id', authenticate, authorize(PERMISSIONS.MANAGE_PERIODS), async (req, res) => {
    try {
        const { id } = req.params;
        const { description, startDate, endDate, isActive } = req.body;

        const period = await SubmissionPeriodModel.findByIdAndUpdate(
            id,
            {
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                isActive
            },
            { new: true }
        );

        if (!period) {
            return res.status(404).json({ message: 'Submission period not found' });
        }

        res.json({ message: 'Submission period updated', period });
    } catch (error) {
        console.error('Error updating submission period:', error);
        res.status(500).json({ message: 'Error updating submission period' });
    }
});

// Delete submission period (admin)
router.delete('/submission-period/:id', authenticate, authorize(PERMISSIONS.MANAGE_PERIODS), async (req, res) => {
    try {
        const { id } = req.params;

        const period = await SubmissionPeriodModel.findByIdAndDelete(id);
        if (!period) {
            return res.status(404).json({ message: 'Submission period not found' });
        }

        res.json({ message: 'Submission period deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission period:', error);
        res.status(500).json({ message: 'Error deleting submission period' });
    }
});

// ============ ADMIN USER MANAGEMENT ROUTES ============

// Get all users (admin only)
router.get('/all-users', authenticate, authorize(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const users = await UserModel.find({ email: { $ne: SUPER_ADMIN_EMAIL } })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update user (admin only)
router.patch('/update-user/:userId', authenticate, authorize(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, role, unit, userType, isApproved, isActive } = req.body;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (unit) user.unit = unit;
        if (userType) user.userType = userType;
        if (typeof isApproved === 'boolean') user.isApproved = isApproved;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                unit: user.unit,
                userType: user.userType,
                isApproved: user.isApproved,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user (admin only)
router.delete('/delete-user/:userId', authenticate, authorize(PERMISSIONS.MANAGE_USERS), async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting super admin
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === SUPER_ADMIN_EMAIL) {
            return res.status(403).json({ message: 'Cannot delete super admin' });
        }

        // Also delete any indicator assignments
        await IndicatorAssignmentModel.deleteMany({ userEmail: user.email });
        await UserModel.findByIdAndDelete(userId);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// ============ INDICATORS ROUTES ============

// Get all indicators from database
router.get('/indicators', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const indicators = await db.collection('indicators').find({}).sort({ pillarId: 1, order: 1 }).toArray();
        res.json(indicators);
    } catch (error) {
        console.error('Error fetching indicators:', error);
        res.status(500).json({ message: 'Error fetching indicators' });
    }
});

// Get indicators grouped by pillars
router.get('/pillars', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ message: 'Database not connected' });
        }

        const indicators = await db.collection('indicators').find({}).sort({ pillarId: 1, order: 1 }).toArray();
        
        // Group indicators by pillar
        const pillars = {
            economic: {
                id: "economic",
                name: "Economic Transformation Pillar",
                outputs: [{
                    id: "economic-output-1",
                    name: "Economic Development Indicators",
                    indicators: indicators.filter((ind: any) => ind.pillarId === 'economic')
                }]
            },
            social: {
                id: "social", 
                name: "Social Transformation Pillar",
                outputs: [{
                    id: "social-output-1",
                    name: "Social Development Indicators", 
                    indicators: indicators.filter((ind: any) => ind.pillarId === 'social')
                }]
            },
            governance: {
                id: "governance",
                name: "Transformational Governance Pillar",
                outputs: [{
                    id: "governance-output-1",
                    name: "Governance Indicators",
                    indicators: indicators.filter((ind: any) => ind.pillarId === 'governance')
                }]
            }
        };

        res.json(Object.values(pillars));
    } catch (error) {
        console.error('Error fetching pillars:', error);
        res.status(500).json({ message: 'Error fetching pillars' });
    }
});

export default router;
