# Submission Storage Guide

## 📊 Overview

This document explains how submissions are stored in the MongoDB database, including the data structure, fields, indexes, and storage patterns.

---

## 🗄️ Database Collection

**Collection Name**: `Submissions`  
**Model**: `SubmissionModel`  
**Schema File**: `Backend/src/models.ts`

---

## 📋 Submission Schema Structure

### **Core Fields**

```typescript
{
  // Identification
  pillarId: string,              // Required: Pillar identifier
  pillarName: string,            // Optional: Human-readable pillar name
  indicatorId: string,           // Required: Indicator identifier (e.g., "1", "3", "8a")
  indicatorName: string,         // Optional: Human-readable indicator name
  quarterId: string,             // Required: 'q1', 'q2', 'q3', or 'q4'
  month: string,                 // Required: Month abbreviation (e.g., "Jul", "Aug", "Sep")
  
  // Values
  value: number,                 // Required: Main value (cumulative or percentage)
  targetValue: number,           // Optional: Target value for this period
  subValues: {                   // Optional: For composite/dual indicators
    [key: string]: number        // Key-value pairs for sub-indicators
  },
  
  // Metadata
  comments: string,              // Optional: Additional comments
  isNotApplicable: boolean,     // Default: false - N/A flag for 0/0 submissions
  submittedBy: string,          // Email of the user who submitted
  timestamp: Date,              // Default: Date.now() - Submission timestamp
  
  // Supporting Documents
  supportingDocuments: [{        // Array of uploaded documents
    url: string,                // Cloudinary URL
    publicId: string,           // Cloudinary public ID
    format: string,             // File format (pdf, jpg, etc.)
    originalName: string,       // Original filename
    uploadedAt: Date           // Default: Date.now()
  }],
  
  // Modification Tracking
  hasBeenModified: boolean,     // Default: false - Whether submission was modified
  modifiedAt: Date,             // Optional: When modification occurred
  modifiedBy: string,           // Optional: Email of modifier
  originalValue: number,        // Optional: Original value before modification
  originalSubValues: {          // Optional: Original subValues before modification
    [key: string]: number
  },
  originalComments: string,     // Optional: Original comments before modification
  modificationStatus: string,  // Enum: 'original' | 'pending_approval' | 'approved_modified'
  changeRequestId: string       // Optional: Reference to DataChangeRequest document
}
```

---

## 🔑 Unique Constraint

**Unique Index**: `{ pillarId: 1, indicatorId: 1, quarterId: 1, month: 1 }`

This ensures **only one submission per indicator per month per quarter**. If a user tries to submit for the same combination, the system will:
- **Find the existing submission** (if it exists)
- **Update it** with new values (replace, not create duplicate)

---

## 📝 Storage Patterns

### **1. Standard Indicator Submission**

**Example**: Single value indicator (e.g., "Ha of land meeting FOBASI criteria")

```javascript
{
  pillarId: "1",
  pillarName: "Economic Transformation",
  indicatorId: "1",
  indicatorName: "Ha of land meeting FOBASI operationalization criteria",
  quarterId: "q1",
  month: "Jul",
  value: 5000,                    // Cumulative value
  targetValue: 0,                 // Q1 target
  subValues: undefined,           // No sub-values
  comments: "Initial progress",
  isNotApplicable: false,
  submittedBy: "user@example.com",
  timestamp: ISODate("2024-07-15T10:30:00Z"),
  supportingDocuments: [],
  hasBeenModified: false,
  modificationStatus: "original"
}
```

---

### **2. Composite/Dual Indicator Submission**

**Example**: Indicator with sub-indicators (e.g., "Quantity of improved seed" with maize and soya)

```javascript
{
  pillarId: "1",
  pillarName: "Economic Transformation",
  indicatorId: "8",
  indicatorName: "Quantity of improved seed",
  quarterId: "q2",
  month: "Oct",
  value: 0,                       // Parent value (may be 0 for composite)
  targetValue: 0,
  subValues: {
    "maize": 50000,               // Maize seed quantity (Kg)
    "soya": 2000                  // Soya seed quantity (Kg)
  },
  comments: "Both seeds distributed",
  isNotApplicable: false,
  submittedBy: "user@example.com",
  timestamp: ISODate("2024-10-15T10:30:00Z"),
  supportingDocuments: [],
  hasBeenModified: false,
  modificationStatus: "original"
}
```

**Key Points**:
- `value` may be 0 or calculated percentage for composite indicators
- `subValues` contains key-value pairs matching `subIndicatorIds` from indicator definition
- Keys in `subValues` match the keys in `indicator.subIndicatorIds` (e.g., "maize", "soya")

---

### **3. Percentage Indicator Submission**

**Example**: "Percentage of works progress for constructions"

```javascript
{
  pillarId: "2",
  pillarName: "Social Development",
  indicatorId: "87",
  indicatorName: "Percentage of works progress for constructions of 15 classrooms and 24 toilets",
  quarterId: "q3",
  month: "Jan",
  value: 60,                      // Percentage value (0-100)
  targetValue: 60,                // Q3 target percentage
  subValues: {
    "classrooms_percentage": 60,  // Sub-indicator percentage
    "toilets_percentage": 60      // Sub-indicator percentage
  },
  comments: "Construction at 60% completion",
  isNotApplicable: false,
  submittedBy: "user@example.com",
  timestamp: ISODate("2024-01-15T10:30:00Z"),
  supportingDocuments: [
    {
      url: "https://res.cloudinary.com/.../construction.jpg",
      publicId: "construction_jan_2024",
      format: "jpg",
      originalName: "construction_progress.jpg",
      uploadedAt: ISODate("2024-01-15T10:35:00Z")
    }
  ],
  hasBeenModified: false,
  modificationStatus: "original"
}
```

---

### **4. Special Case: Indicators with Database Targets**

**Example**: Indicator 69 (NCD programs) stores targets in `subValues`

```javascript
{
  pillarId: "2",
  pillarName: "Social Development",
  indicatorId: "69",
  indicatorName: "Percentage of patients enrolled in NCD programs",
  quarterId: "q2",
  month: "Nov",
  value: 0,                       // Not used for this indicator type
  targetValue: 0,
  subValues: {
    "hypertension_target": 1000,      // Target from database
    "hypertension_enrolled": 850,     // Actual enrolled
    "diabetes_target": 500,           // Target from database
    "diabetes_enrolled": 420          // Actual enrolled
  },
  comments: "NCD enrollment progress",
  isNotApplicable: false,
  submittedBy: "user@example.com",
  timestamp: ISODate("2024-11-15T10:30:00Z"),
  supportingDocuments: [],
  hasBeenModified: false,
  modificationStatus: "original"
}
```

**Special Indicators**: 69, 99, 101 store both actual and target values in `subValues`

---

### **5. Not Applicable (N/A) Submission**

**Example**: When indicator is not applicable for a period

```javascript
{
  pillarId: "1",
  pillarName: "Economic Transformation",
  indicatorId: "3",
  indicatorName: "Ha of land use consolidation for priority crops",
  quarterId: "q1",
  month: "Jul",
  value: 0,
  targetValue: 0,
  subValues: {},
  comments: "Not applicable this period",
  isNotApplicable: true,         // N/A flag set to true
  submittedBy: "user@example.com",
  timestamp: ISODate("2024-07-15T10:30:00Z"),
  supportingDocuments: [],
  hasBeenModified: false,
  modificationStatus: "original"
}
```

**Effect**: When `isNotApplicable: true`, progress calculations return 0 for that period.

---

### **6. Modified Submission (Approval Workflow)**

**Example**: Submission that was edited and requires approval

```javascript
{
  pillarId: "1",
  pillarName: "Economic Transformation",
  indicatorId: "1",
  indicatorName: "Ha of land meeting FOBASI operationalization criteria",
  quarterId: "q4",
  month: "Apr",
  value: 15000,                   // New value (after edit)
  targetValue: 18713,
  subValues: undefined,
  comments: "Updated with final numbers",
  isNotApplicable: false,
  submittedBy: "user@example.com",
  timestamp: ISODate("2024-04-15T10:30:00Z"),
  supportingDocuments: [],
  
  // Modification tracking fields
  hasBeenModified: true,
  modifiedAt: ISODate("2024-04-20T14:00:00Z"),
  modifiedBy: "head@example.com",
  originalValue: 12000,           // Original value before edit
  originalSubValues: undefined,
  originalComments: "Initial submission",
  modificationStatus: "approved_modified",  // Status after approval
  changeRequestId: "507f1f77bcf86cd799439011"  // Reference to change request
}
```

**Modification Statuses**:
- `"original"`: Never modified, or modified directly (no approval needed)
- `"pending_approval"`: Edit/delete requested, awaiting head approval
- `"approved_modified"`: Modification approved by head

---

## 🔄 Submission Workflow

### **1. New Submission (No Duplicate)**

```javascript
// Frontend sends:
{
  pillarId: "1",
  indicatorId: "1",
  quarterId: "q1",
  month: "Jul",
  value: 5000,
  targetValue: 0,
  subValues: {},
  comments: "",
  isNotApplicable: false
}

// Backend creates:
const submission = new SubmissionModel(submissionData);
submission.submittedBy = req.user.email;
submission.modificationStatus = "original";
await submission.save();
```

---

### **2. Update Existing Submission (Increment/Replace)**

```javascript
// Frontend sends same structure with action: "increment"

// Backend finds existing:
const existing = await SubmissionModel.findOne({
  pillarId: submissionData.pillarId,
  indicatorId: submissionData.indicatorId,
  quarterId: submissionData.quarterId,
  month: submissionData.month
});

// Backend updates (replaces):
await SubmissionModel.findByIdAndUpdate(existing._id, {
  value: submissionData.value,
  subValues: submissionData.subValues,
  comments: submissionData.comments,
  timestamp: new Date(),
  modificationStatus: "original",
  hasBeenModified: false
});
```

**Note**: The system **replaces** the existing submission, it doesn't create a new one or increment values. The `value` field should already be cumulative.

---

### **3. Edit Submission (Direct Update)**

```javascript
// Frontend sends with action: "edit" and existingSubmissionId

// Backend updates directly:
await SubmissionModel.findByIdAndUpdate(existingSubmissionId, {
  value: submissionData.value,
  subValues: submissionData.subValues,
  comments: submissionData.comments,
  timestamp: new Date(),
  modificationStatus: "original",
  hasBeenModified: false
});
```

---

## 📊 Database Indexes

### **1. Unique Index (Prevents Duplicates)**
```javascript
{ pillarId: 1, indicatorId: 1, quarterId: 1, month: 1 }
```
- **Purpose**: Ensures one submission per indicator per month per quarter
- **Enforced**: MongoDB unique constraint
- **Query Performance**: Fast lookups for duplicate detection

### **2. Modification Status Index**
```javascript
{ modificationStatus: 1 }
```
- **Purpose**: Fast queries for pending approval requests
- **Use Case**: Finding all submissions with `modificationStatus: "pending_approval"`

### **3. Submitted By Index**
```javascript
{ submittedBy: 1 }
```
- **Purpose**: Fast queries for user-specific submissions
- **Use Case**: Finding all submissions by a specific user

---

## 🔍 Query Patterns

### **1. Get All Submissions for Dashboard**
```javascript
const submissions = await SubmissionModel.find({})
  .sort({ timestamp: -1 })
  .lean();
```

### **2. Get Submissions by User**
```javascript
const submissions = await SubmissionModel.find({
  submittedBy: "user@example.com"
})
  .sort({ timestamp: -1 });
```

### **3. Get Submissions for Specific Indicator**
```javascript
const submissions = await SubmissionModel.find({
  indicatorId: "1"
})
  .sort({ timestamp: 1 });  // Oldest first for cumulative calculations
```

### **4. Get Submissions for Quarter**
```javascript
const submissions = await SubmissionModel.find({
  quarterId: "q2"
})
  .sort({ month: 1 });
```

### **5. Check for Duplicate**
```javascript
const existing = await SubmissionModel.findOne({
  pillarId: "1",
  indicatorId: "1",
  quarterId: "q1",
  month: "Jul"
});
```

### **6. Get Pending Approval Requests**
```javascript
const pending = await SubmissionModel.find({
  modificationStatus: "pending_approval"
})
  .sort({ timestamp: -1 });
```

---

## 📦 SubValues Structure

### **Common Sub-Value Keys**

Based on indicator definitions, common keys include:

**Agriculture Indicators**:
- `"maize"`, `"cassava"`, `"rice"`, `"beans"`, `"soya"` - Crop areas/quantities
- `"dap"`, `"urea"`, `"npk"`, `"blender"`, `"lime"` - Fertilizer types

**Livestock Indicators**:
- `"bq"`, `"lsd"`, `"rvf"`, `"brucellosis"`, `"rabies"` - Disease types
- `"goats"`, `"sheep"`, `"cows"`, `"pig"`, `"chicken"` - Animal types

**Health Indicators**:
- `"hypertension_target"`, `"hypertension_enrolled"` - NCD program data
- `"diabetes_target"`, `"diabetes_enrolled"` - NCD program data

**Education Indicators**:
- `"primary_attending"`, `"secondary_attending"`, `"tvet_attending"` - Student attendance
- `"students_accurate"`, `"material_accurate"`, `"workers_accurate"` - Data accuracy

**Infrastructure Indicators**:
- `"classrooms_percentage"`, `"toilets_percentage"` - Construction progress

---

## 🎯 Data Validation

### **Required Fields**
- `pillarId`, `indicatorId`, `quarterId`, `month`, `value`, `submittedBy`

### **Type Validation**
- `value`: Must be a number
- `subValues`: Object with string keys and number values
- `quarterId`: Must be one of `'q1'`, `'q2'`, `'q3'`, `'q4'`
- `month`: String (typically 3-letter abbreviation)

### **Business Rules**
1. **Unique Constraint**: One submission per `(pillarId, indicatorId, quarterId, month)`
2. **Cumulative Values**: `value` should be cumulative (not incremental)
3. **Sub-Values**: Keys must match `indicator.subIndicatorIds` for composite indicators
4. **N/A Flag**: If `isNotApplicable: true`, `value` is typically 0

---

## 🔐 Data Security

### **User Attribution**
- `submittedBy`: Always set from authenticated user's email (`req.user.email`)
- Cannot be overridden by frontend

### **Timestamp**
- `timestamp`: Automatically set to current date/time on creation/update
- Used for sorting and tracking submission order

### **Modification Tracking**
- Original values stored in `originalValue`, `originalSubValues`, `originalComments`
- Modification history tracked via `hasBeenModified`, `modifiedAt`, `modifiedBy`

---

## 📈 Performance Considerations

### **Index Usage**
- Unique index ensures fast duplicate detection
- Status index speeds up approval workflow queries
- SubmittedBy index optimizes user-specific queries

### **Query Optimization**
- Use `.lean()` for read-only queries (faster, returns plain objects)
- Sort by `timestamp` for chronological order
- Filter by `quarterId` and `indicatorId` for specific calculations

### **Storage Efficiency**
- `subValues` stored as `Schema.Types.Mixed` (flexible structure)
- Supporting documents stored as array (can grow)
- Minimal redundancy (names stored for convenience, not required)

---

## 🔄 Migration & Data Integrity

### **Legacy Key Mapping**

The system supports legacy key names for backwards compatibility:

```javascript
const legacyKeyMap = {
  'chicken': ['poultry', 'chicken'],      // Indicator 31
  'maize': ['maize_kg', 'maize'],        // Indicator 8
  'soya': ['soya_kg', 'soya'],           // Indicator 8
  'lsd': ['lsd', 'bq']                   // Indicator 24
};
```

When reading `subValues`, the system checks both current and legacy keys.

---

## 📝 Example Queries

### **Get Latest Cumulative Value for Indicator**
```javascript
const latest = await SubmissionModel.findOne({
  indicatorId: "1"
})
  .sort({ timestamp: -1 })
  .select('value');
// Returns the most recent cumulative value
```

### **Get All Submissions for Q2**
```javascript
const q2Submissions = await SubmissionModel.find({
  quarterId: "q2"
})
  .sort({ month: 1, timestamp: 1 });
```

### **Get Submissions with Sub-Values**
```javascript
const withSubValues = await SubmissionModel.find({
  subValues: { $exists: true, $ne: {} }
});
```

### **Get Submissions Needing Approval**
```javascript
const needsApproval = await SubmissionModel.find({
  modificationStatus: "pending_approval"
})
  .populate('changeRequestId');  // If using references
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: Duplicate Submissions**
**Problem**: Multiple submissions for same indicator/month/quarter  
**Solution**: Unique index prevents duplicates. System updates existing instead of creating new.

### **Issue 2: Missing Sub-Values**
**Problem**: Composite indicator missing sub-indicator data  
**Solution**: Validate `subValues` keys match `indicator.subIndicatorIds` before saving.

### **Issue 3: Non-Cumulative Values**
**Problem**: User submits incremental values instead of cumulative  
**Solution**: Frontend should handle cumulative calculation, or backend should sum previous values.

### **Issue 4: Legacy Key Mismatch**
**Problem**: Old data uses different sub-value keys  
**Solution**: System checks both current and legacy keys when reading `subValues`.

---

## 📚 Related Collections

1. **DataChangeRequests**: Stores edit/delete approval requests
2. **DataDeleteRequests**: Stores delete approval requests
3. **IndicatorAssignments**: Maps indicators to users
4. **Users**: User information and authentication
5. **Pillars**: Pillar hierarchy and metadata

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")  
**Version**: 1.0.0
