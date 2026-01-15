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

// User Interface
export interface IUser extends Document {
    email: string;
    password: string;
    role: 'Assign employee' | 'Planning director' | 'Unity director' | 'admin' | 'editor' | 'viewer';
    name: string;
    lastLogin?: Date;
    isActive?: boolean;
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
    role: { type: String, enum: ['Assign employee', 'Planning director', 'Unity director', 'admin', 'editor', 'viewer'], default: 'Assign employee' },
    name: { type: String, required: true },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

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
    submittedBy: { type: String },
    timestamp: { type: Date, default: Date.now }
});

export const SubmissionModel = mongoose.model('Submission', SubmissionSchema, 'Submissions');

