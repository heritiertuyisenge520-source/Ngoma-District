import mongoose, { Document, Schema } from 'mongoose';

// Interface for Indicator reference data
export interface IIndicator extends Document {
    id: string; // The ID from data.ts (e.g. "1")
    name: string;
    isDual: boolean;
    targets: {
        q1: string | number;
        q2: string | number;
        q3: string | number;
        q4: string | number;
        annual: string | number;
    };
}

// Interface for Monitor Entry (Transactional)
export interface IMonitoringEntry extends Document {
    pillarId: string;
    outputId: string;
    indicatorId: string;
    quarterId: string;
    month: string;
    value: number;
    targetValue?: number;
    subValues?: Record<string, number>; // For consolidated indicators: {maize: 100, cassava: 50, ...}
    comments?: string;
    timestamp: Date;
    createdBy?: string;
    updatedBy?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
}

// Unit definitions for classification
export const UNITS = [
    'Agriculture And Natural Resource Unit',
    'Business Development And Employment Unit',
    'Infrastructure One Stop Center',
    'Social Development Unit',
    'Health Unit',
    'Education Unit',
    'Good Governance Unit',
    'Planning, Monitoring and Evaluation Unit',
    'HR and Administration Unit',
    'Finance Unit',
    'Internal Audit'
] as const;

export type UnitType = typeof UNITS[number];

// User Interface
export interface IUser extends Document {
    email: string;
    password: string;
    role: string; // Position title - flexible to accept any position
    name: string;
    firstName?: string;
    lastName?: string;
    lastLogin?: Date;
    isActive?: boolean;
    // New fields for approval workflow
    isApproved?: boolean;
    approvedAt?: Date;
    approvedBy?: string;
    unit?: string; // Unit assignment (e.g., "Agriculture And Natural Resource Unit")
    userType?: 'super_admin' | 'head' | 'employee'; // Role type within the system
}

// Indicator Assignment Interface
export interface IIndicatorAssignment extends Document {
    userId: string;
    userEmail: string;
    userName: string;
    pillarId: string;
    pillarName: string;
    indicatorId: string;
    indicatorName: string;
    assignedBy: string;
    assignedByEmail: string;
    unit: string;
    assignedAt: Date;
    isActive: boolean;
}

// Audit Log Interface
export interface IAuditLog {
    action: string;
    collection: string;
    documentId: string;
    userId?: string;
    changes?: any;
    timestamp: Date;
}

// Indicator Schema (Embedded in Pillar/Output context usually, but stored flat here for reference if needed,
// OR we can store the whole Pillar hierarchy. Let's store the Hierarchy for simplicity in metadata).

// Better approach for Metadata: Store the whole Pillar tree structure in one config document
// OR store individual Pillars. Storing individual Pillars is cleaner.

const IndicatorSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    isDual: { type: Boolean, default: false },
    targets: {
        q1: { type: Schema.Types.Mixed, default: 0 },
        q2: { type: Schema.Types.Mixed, default: 0 },
        q3: { type: Schema.Types.Mixed, default: 0 },
        q4: { type: Schema.Types.Mixed, default: 0 },
        annual: { type: Schema.Types.Mixed, default: 0 }
    }
});

const OutputSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    indicators: [IndicatorSchema]
});

const PillarSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    outputs: [OutputSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add pre-save hook to update the updatedAt field
PillarSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const PillarModel = mongoose.model<any>('Pillar', PillarSchema);

// Entry Schema
const MonitoringEntrySchema = new Schema({
    pillarId: { type: String, required: true },
    outputId: { type: String, required: true },
    indicatorId: { type: String, required: true, index: true },
    quarterId: { type: String, required: true },
    month: { type: String, required: true },
    value: { type: Number, required: true },
    targetValue: { type: Number },
    subValues: { type: Schema.Types.Mixed }, // Store sub-indicator values as key-value pairs
    comments: { type: String },
    timestamp: { type: Date, default: Date.now },
    createdBy: { type: String },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
});

// Add indexes for better query performance
MonitoringEntrySchema.index({ pillarId: 1, quarterId: 1 });
MonitoringEntrySchema.index({ indicatorId: 1, timestamp: -1 });

// Add pre-save hook to update the updatedAt field
MonitoringEntrySchema.pre('save', function (next) {
    (this as any).updatedAt = new Date();
    next();
});

export const EntryModel = mongoose.model<IMonitoringEntry>('Entry', MonitoringEntrySchema);

// User Schema
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // Position title
    name: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    // Approval workflow fields
    isApproved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedBy: { type: String },
    unit: { type: String }, // Unit assignment
    userType: { type: String, enum: ['super_admin', 'head', 'employee'], default: 'employee' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add index for querying pending users
UserSchema.index({ isApproved: 1 });

// Add pre-save hook to update the updatedAt field
UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

// Audit Log Schema
const AuditLogSchema = new Schema({
    action: { type: String, required: true },
    collection: { type: String, required: true },
    documentId: { type: String, required: true },
    userId: { type: String },
    changes: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
});

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

// Submission Schema (as requested by user)
const SubmissionSchema = new Schema({
    pillarId: { type: String, required: true },
    pillarName: { type: String }, // Populated from frontend
    indicatorId: { type: String, required: true },
    indicatorName: { type: String }, // Populated from frontend
    quarterId: { type: String, required: true },
    month: { type: String, required: true },
    value: { type: Number, required: true },
    targetValue: { type: Number },
    subValues: { type: Schema.Types.Mixed }, // For dual indicators
    comments: { type: String },
    supportingDocuments: [{
        url: { type: String },
        publicId: { type: String },
        format: { type: String },
        originalName: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],
    submittedBy: { type: String },
    timestamp: { type: Date, default: Date.now }
});

export const SubmissionModel = mongoose.model('Submission', SubmissionSchema, 'Submissions');

// Indicator Assignment Schema - for tracking which indicators are assigned to which users
const IndicatorAssignmentSchema = new Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    pillarId: { type: String, required: true },
    pillarName: { type: String, required: true },
    indicatorId: { type: String, required: true },
    indicatorName: { type: String, required: true },
    assignedBy: { type: String, required: true }, // User ID of assigner
    assignedByEmail: { type: String, required: true },
    unit: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

// Indexes for efficient queries
IndicatorAssignmentSchema.index({ userId: 1, isActive: 1 });
IndicatorAssignmentSchema.index({ userEmail: 1 });
IndicatorAssignmentSchema.index({ indicatorId: 1 });
IndicatorAssignmentSchema.index({ unit: 1 });

export const IndicatorAssignmentModel = mongoose.model<IIndicatorAssignment>('IndicatorAssignment', IndicatorAssignmentSchema, 'IndicatorAssignments');

// Data Change Request Interface - for employee edit approval workflow
export interface IDataChangeRequest extends Document {
    submissionId: string;
    requestedBy: string; // email of the employee
    requestedByName: string;
    indicatorId: string;
    indicatorName: string;
    pillarName: string;
    quarterId: string;
    month: string;
    oldValue: number;
    newValue: number;
    oldSubValues?: Record<string, number>;
    newSubValues?: Record<string, number>;
    oldComments?: string;
    newComments?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedByName?: string;
    reviewedAt?: Date;
    reviewComment?: string;
    createdAt: Date;
    unit: string;
    requestType: 'edit' | 'delete';
}

// Data Delete Request Interface - for employee delete approval workflow
export interface IDataDeleteRequest extends Document {
    submissionId: string;
    requestedBy: string; // email of the employee
    requestedByName: string;
    indicatorId: string;
    indicatorName: string;
    pillarName: string;
    quarterId: string;
    month: string;
    oldValue: number;
    oldSubValues?: Record<string, number>;
    oldComments?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedByName?: string;
    reviewedAt?: Date;
    reviewComment?: string;
    createdAt: Date;
    unit: string;
}

// Data Change Request Schema
const DataChangeRequestSchema = new Schema({
    submissionId: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedByName: { type: String, required: true },
    indicatorId: { type: String, required: true },
    indicatorName: { type: String, required: true },
    pillarName: { type: String, required: true },
    quarterId: { type: String, required: true },
    month: { type: String, required: true },
    oldValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    oldSubValues: { type: Schema.Types.Mixed },
    newSubValues: { type: Schema.Types.Mixed },
    oldComments: { type: String },
    newComments: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: String },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
    reviewComment: { type: String },
    createdAt: { type: Date, default: Date.now },
    unit: { type: String, required: true },
    requestType: { type: String, enum: ['edit', 'delete'], default: 'edit' }
});

// Indexes for efficient queries
DataChangeRequestSchema.index({ status: 1, unit: 1 });
DataChangeRequestSchema.index({ requestedBy: 1 });
DataChangeRequestSchema.index({ submissionId: 1 });

export const DataChangeRequestModel = mongoose.model<IDataChangeRequest>('DataChangeRequest', DataChangeRequestSchema, 'DataChangeRequests');

// Data Delete Request Schema
const DataDeleteRequestSchema = new Schema({
    submissionId: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedByName: { type: String, required: true },
    indicatorId: { type: String, required: true },
    indicatorName: { type: String, required: true },
    pillarName: { type: String, required: true },
    quarterId: { type: String, required: true },
    month: { type: String, required: true },
    oldValue: { type: Number, required: true },
    oldSubValues: { type: Schema.Types.Mixed },
    oldComments: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: String },
    reviewedByName: { type: String },
    reviewedAt: { type: Date },
    reviewComment: { type: String },
    createdAt: { type: Date, default: Date.now },
    unit: { type: String, required: true }
});

// Indexes for efficient queries
DataDeleteRequestSchema.index({ status: 1, unit: 1 });
DataDeleteRequestSchema.index({ requestedBy: 1 });
DataDeleteRequestSchema.index({ submissionId: 1 });

export const DataDeleteRequestModel = mongoose.model<IDataDeleteRequest>('DataDeleteRequest', DataDeleteRequestSchema, 'DataDeleteRequests');

// Submission Period Interface - for admin to control submission window
export interface ISubmissionPeriod extends Document {
    description: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdBy: string;
    createdByName: string;
    createdAt: Date;
    updatedAt: Date;
}

// Submission Period Schema
const SubmissionPeriodSchema = new Schema({
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the updatedAt field
SubmissionPeriodSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const SubmissionPeriodModel = mongoose.model<ISubmissionPeriod>('SubmissionPeriod', SubmissionPeriodSchema, 'SubmissionPeriods');
