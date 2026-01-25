# Leader Role Implementation Guide

## Step 1: Backend Changes

### Update User Model (Backend/src/models.ts)
**Find line 68:**
```typescript
userType?: 'super_admin' | 'head' | 'employee'; // Role type within the system
```

**Replace with:**
```typescript
userType?: 'super_admin' | 'leader' | 'head' | 'employee'; // Role type within the system
```

## Step 2: Frontend Changes

### Update Sidebar (frontend/components/Sidebar.tsx)
**Find the "Submit Progress" button and wrap it with this condition:**

```typescript
{/* Hide "Submit Progress" for leaders */}
{user.userType !== 'leader' && (
  <button
    onClick={() => onNavClick('fill')}
    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
      activeView === 'fill' 
        ? 'bg-blue-600 text-white' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <div className="flex items-center space-x-3">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span>Submit Progress</span>
    </div>
  </button>
)}
```

### Update App.tsx User Type
**Find the UserInfo interface and update it:**

```typescript
interface UserInfo {
  email: string;
  name: string;
  role: string;
  userType?: 'super_admin' | 'leader' | 'head' | 'employee';
  unit?: string;
}
```

### Update LoginView.tsx Registration
**Find the userType selection and add 'leader' option:**

```typescript
const positions = [
  'Mayor',
  'Vice-Mayor in charge of Economic Development',
  'Vice-Mayor in charge of Social Affairs',
  'Executive Secretary of District',
  'Corporates Services Division Manager',
  'Director of Finance',
  'Investment Promotion and Financial Services Officer',
  'Director of Public Health',
  // ... other positions
];

// Add leader userType option in registration form
<select
  value={userType}
  onChange={(e) => setUserType(e.target.value as any)}
  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
>
  <option value="">Select User Type</option>
  <option value="super_admin">Super Admin</option>
  <option value="leader">Leader</option>
  <option value="head">Head of Unit</option>
  <option value="employee">Employee</option>
</select>
```

## Step 3: Permission Updates

### Update App.tsx Navigation Logic
**Add permission checks for leaders:**

```typescript
// Leaders can see all responses like admins
const canViewAllResponses = user.userType === 'super_admin' || user.userType === 'leader';

// Leaders can manage users like admins  
const canManageUsers = user.userType === 'super_admin' || user.userType === 'leader';

// Leaders cannot submit progress
const canSubmitProgress = user.userType !== 'leader';
```

## Step 4: Role Capabilities Summary

### Super Admin:
- ✅ Dashboard
- ✅ All Responses
- ✅ Submit Progress
- ✅ Manage Users
- ✅ Monitor Submissions
- ✅ Assign Indicators
- ✅ All Features

### Leader:
- ✅ Dashboard
- ✅ All Responses
- ❌ Submit Progress (Hidden)
- ✅ Manage Users
- ✅ Monitor Submissions
- ❌ Assign Indicators
- ✅ View Analytics

### Head of Unit:
- ✅ Dashboard
- ✅ Unit Responses Only
- ✅ Submit Progress
- ❌ Manage Users
- ✅ Monitor Submissions
- ✅ Assign Indicators
- ✅ View Analytics

### Employee:
- ✅ Dashboard (Limited)
- ❌ All Responses
- ✅ Submit Progress (Assigned Only)
- ❌ Manage Users
- ❌ Monitor Submissions
- ❌ Assign Indicators
- ✅ View Analytics (Limited)

## Step 5: Testing

1. Create a new user with userType 'leader'
2. Login as leader
3. Verify "Submit Progress" is hidden from sidebar
4. Verify leader can see all responses
5. Verify leader can manage users
6. Verify leader cannot assign indicators

## Files to Modify:
1. Backend/src/models.ts
2. frontend/components/Sidebar.tsx
3. frontend/App.tsx
4. frontend/views/LoginView.tsx
5. Any permission checks throughout the app
