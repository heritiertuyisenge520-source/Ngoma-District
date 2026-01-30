# Pillar Progress Feature - Implementation Plan

## 📋 Overview

Create a new "Pillar Progress" view that allows users to:
1. Select a **Pillar**
2. Select a **Quarter** (Q1, Q2, Q3, Q4)
3. Select a **Month** (within the selected quarter)
4. View **all indicators** in that pillar for the selected month
5. See **monthly progress** and **annual progress** for each indicator

---

## 🎯 Feature Requirements

### **User Interface**
- **Filters Section**: Three dropdown selectors (Pillar, Quarter, Month)
- **Indicators List**: Table/list showing all indicators with their progress
- **Progress Display**: Monthly and Annual progress percentages for each indicator
- **Visual Indicators**: Color-coded progress bars or badges

### **Data Display**
- Indicator name/number
- Monthly progress percentage
- Annual progress percentage
- Actual value (for the selected month)
- Target value (cumulative up to that month)
- Status indicator (on-track, behind, completed)

---

## 📁 Files to Create/Modify

### **1. New View Component**
- **File**: `frontend/views/PillarProgressView.tsx`
- **Purpose**: Main component for the Pillar Progress feature

### **2. Update Sidebar**
- **File**: `frontend/components/Sidebar.tsx`
- **Action**: Add "Pillar Progress" menu item to all roles

### **3. Update App.tsx**
- **File**: `frontend/App.tsx`
- **Action**: Add route handler for `pillar-progress` view

---

## 🏗️ Component Structure

### **PillarProgressView Component**

```typescript
interface PillarProgressViewProps {
  entries: MonitoringEntry[];
  user?: UserInfo;
}

interface IndicatorProgressRow {
  indicatorId: string;
  indicatorNumber: number;
  indicatorName: string;
  monthlyProgress: number;
  annualProgress: number;
  monthlyActual: number;
  monthlyTarget: number;
  annualActual: number;
  annualTarget: number;
  status: 'completed' | 'on-track' | 'behind' | 'not-started';
  hasSubIndicators: boolean;
  subIndicators?: SubIndicatorProgress[];
}
```

---

## 🔧 Implementation Steps

### **Step 1: Create PillarProgressView Component**

#### **1.1 Component State**
```typescript
const [selectedPillarId, setSelectedPillarId] = useState<string>('');
const [selectedQuarterId, setSelectedQuarterId] = useState<string>('');
const [selectedMonth, setSelectedMonth] = useState<string>('');
```

#### **1.2 Data Filtering**
- Filter entries by:
  - `pillarId` (matches selected pillar)
  - `quarterId` (matches selected quarter)
  - `month` (matches selected month)

#### **1.3 Progress Calculation**
For each indicator:
- **Monthly Progress**: Use `calculateMonthlyProgress()` from `progressUtils.ts`
- **Annual Progress**: Use `calculateAnnualProgress()` from `progressUtils.ts`

#### **1.4 Indicator List Generation**
- Get all indicators from selected pillar
- For each indicator:
  - Find entries matching the selected month
  - Calculate monthly and annual progress
  - Determine status based on progress percentage

---

### **Step 2: UI Layout**

#### **2.1 Filter Section**
```
┌─────────────────────────────────────────┐
│  Pillar Progress                        │
├─────────────────────────────────────────┤
│  [Pillar Dropdown ▼]                    │
│  [Quarter Dropdown ▼]                   │
│  [Month Dropdown ▼]                     │
└─────────────────────────────────────────┘
```

#### **2.2 Indicators Table**
```
┌─────────────────────────────────────────────────────────────┐
│ # │ Indicator Name │ Monthly │ Annual │ Status │ Actions   │
├───┼────────────────┼─────────┼────────┼────────┼───────────┤
│ 1 │ Indicator 1    │ 75%     │ 68%    │ 🟢     │ [View]    │
│ 2 │ Indicator 2    │ 90%     │ 85%    │ 🟢     │ [View]    │
│ 3 │ Indicator 3    │ 45%     │ 50%    │ 🟡     │ [View]    │
└───┴────────────────┴─────────┴────────┴────────┴───────────┘
```

#### **2.3 Progress Display Options**
- **Option A**: Progress bars with percentages
- **Option B**: Badge/icon with percentage
- **Option C**: Color-coded cells (green/yellow/red)

---

### **Step 3: Progress Calculation Logic**

#### **3.1 Monthly Progress**
```typescript
const calculateMonthlyProgress = (indicator: Indicator, entries: MonitoringEntry[], month: string) => {
  // Filter entries for this indicator and month
  const monthEntries = entries.filter(e => 
    e.indicatorId === indicator.id && 
    e.month === month
  );
  
  // Use calculateMonthlyProgress from progressUtils
  return calculateMonthlyProgress(indicator, value, month, monthEntries);
};
```

#### **3.2 Annual Progress**
```typescript
const calculateAnnualProgress = (indicator: Indicator, entries: MonitoringEntry[]) => {
  // Filter entries for this indicator (all months)
  const indicatorEntries = entries.filter(e => 
    e.indicatorId === indicator.id
  );
  
  // Use calculateAnnualProgress from progressUtils
  return calculateAnnualProgress(indicator, indicatorEntries);
};
```

#### **3.3 Status Determination**
```typescript
const getStatus = (progress: number): 'completed' | 'on-track' | 'behind' | 'not-started' => {
  if (progress >= 100) return 'completed';
  if (progress >= 75) return 'on-track';
  if (progress > 0) return 'behind';
  return 'not-started';
};
```

---

### **Step 4: Data Structure**

#### **4.1 Filtered Entries**
```typescript
const filteredEntries = useMemo(() => {
  return entries.filter(entry => {
    const matchesPillar = !selectedPillarId || entry.pillarId === selectedPillarId;
    const matchesQuarter = !selectedQuarterId || entry.quarterId === selectedQuarterId;
    const matchesMonth = !selectedMonth || entry.month === selectedMonth;
    
    return matchesPillar && matchesQuarter && matchesMonth;
  });
}, [entries, selectedPillarId, selectedQuarterId, selectedMonth]);
```

#### **4.2 Indicators with Progress**
```typescript
const indicatorsWithProgress = useMemo(() => {
  if (!selectedPillarId) return [];
  
  const pillar = PILLARS.find(p => p.id === selectedPillarId);
  if (!pillar) return [];
  
  const pillarIndicators = pillar.outputs.flatMap(o => o.indicators || []);
  
  return pillarIndicators.map((indicator, index) => {
    // Get entries for this indicator
    const indicatorEntries = entries.filter(e => e.indicatorId === indicator.id);
    
    // Calculate monthly progress (for selected month)
    const monthlyProgress = selectedMonth 
      ? calculateMonthlyProgressForIndicator(indicator, indicatorEntries, selectedMonth)
      : 0;
    
    // Calculate annual progress
    const annualProgress = calculateAnnualProgress(indicator, indicatorEntries);
    
    return {
      indicatorId: indicator.id,
      indicatorNumber: index + 1,
      indicatorName: indicator.name,
      monthlyProgress,
      annualProgress,
      status: getStatus(annualProgress),
      // ... other fields
    };
  });
}, [selectedPillarId, selectedMonth, entries]);
```

---

### **Step 5: UI Components**

#### **5.1 Filter Dropdowns**
- Use existing dropdown components from other views
- Style consistently with Tailwind CSS
- Add validation (month must be in selected quarter)

#### **5.2 Indicators Table**
- Use table component or custom list
- Sortable columns (optional)
- Responsive design (mobile-friendly)
- Pagination if many indicators (optional)

#### **5.3 Progress Display**
- Progress bars with percentages
- Color coding:
  - Green: 75-100%
  - Yellow: 50-74%
  - Red: 0-49%
  - Gray: No data

---

## 📊 Data Flow

```
User Selection
    ↓
[Pillar] → Filter PILLARS
    ↓
[Quarter] → Filter QUARTERS
    ↓
[Month] → Filter months in quarter
    ↓
Get All Indicators in Pillar
    ↓
For Each Indicator:
    ├─ Filter entries by indicatorId + month
    ├─ Calculate Monthly Progress
    ├─ Calculate Annual Progress
    └─ Determine Status
    ↓
Display in Table/List
```

---

## 🎨 UI/UX Considerations

### **1. Default Selections**
- Default pillar: First pillar in list
- Default quarter: Current quarter (or Q1)
- Default month: First month in selected quarter

### **2. Validation**
- Month must belong to selected quarter
- Show error if no data available
- Disable month dropdown until quarter is selected

### **3. Loading States**
- Show loading spinner while calculating
- Show "No data" message if no entries found

### **4. Empty States**
- "Please select a pillar, quarter, and month"
- "No indicators found for selected criteria"
- "No submissions found for this period"

---

## 🔍 Helper Functions Needed

### **1. Get Months in Quarter**
```typescript
const getMonthsInQuarter = (quarterId: string): string[] => {
  const quarterMap: Record<string, string[]> = {
    'q1': ['Jul', 'Aug', 'Sep'],
    'q2': ['Oct', 'Nov', 'Dec'],
    'q3': ['Jan', 'Feb', 'Mar'],
    'q4': ['Apr', 'May', 'Jun']
  };
  return quarterMap[quarterId] || [];
};
```

### **2. Calculate Monthly Progress for Indicator**
```typescript
const calculateMonthlyProgressForIndicator = (
  indicator: Indicator,
  entries: MonitoringEntry[],
  month: string
): number => {
  // Find entry for this month
  const monthEntry = entries.find(e => e.month === month);
  if (!monthEntry) return 0;
  
  // Use calculateMonthlyProgress utility
  return calculateMonthlyProgress(
    indicator,
    monthEntry.value,
    month,
    entries
  );
};
```

### **3. Format Progress Display**
```typescript
const formatProgress = (progress: number): string => {
  return `${Math.round(progress)}%`;
};

const getProgressColor = (progress: number): string => {
  if (progress >= 100) return 'text-emerald-600';
  if (progress >= 75) return 'text-blue-600';
  if (progress >= 50) return 'text-amber-600';
  return 'text-red-600';
};
```

---

## 📝 Component Template Structure

```typescript
const PillarProgressView: React.FC<PillarProgressViewProps> = ({ entries, user }) => {
  // State
  const [selectedPillarId, setSelectedPillarId] = useState<string>('');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Memoized data
  const availableMonths = useMemo(() => {
    return getMonthsInQuarter(selectedQuarterId);
  }, [selectedQuarterId]);

  const indicatorsWithProgress = useMemo(() => {
    // Calculate progress for each indicator
  }, [selectedPillarId, selectedQuarterId, selectedMonth, entries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Pillar Progress</h1>
        <p>View progress for all indicators in a pillar</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar Dropdown */}
        {/* Quarter Dropdown */}
        {/* Month Dropdown */}
      </div>

      {/* Indicators Table */}
      <div>
        {/* Table/List of indicators with progress */}
      </div>
    </div>
  );
};
```

---

## 🚀 Implementation Checklist

### **Phase 1: Basic Structure**
- [ ] Create `PillarProgressView.tsx` component
- [ ] Add state management for filters
- [ ] Add filter dropdowns (Pillar, Quarter, Month)
- [ ] Add basic layout structure

### **Phase 2: Data Processing**
- [ ] Implement indicator filtering by pillar
- [ ] Implement entry filtering by month/quarter
- [ ] Implement monthly progress calculation
- [ ] Implement annual progress calculation

### **Phase 3: Display**
- [ ] Create indicators table/list
- [ ] Display monthly progress
- [ ] Display annual progress
- [ ] Add status indicators
- [ ] Add progress bars/visualizations

### **Phase 4: Integration**
- [ ] Add menu item to Sidebar
- [ ] Add route handler in App.tsx
- [ ] Test with different user roles
- [ ] Add error handling

### **Phase 5: Polish**
- [ ] Add loading states
- [ ] Add empty states
- [ ] Add validation
- [ ] Improve styling
- [ ] Add responsive design

---

## 🎯 Success Criteria

1. ✅ User can select pillar, quarter, and month
2. ✅ All indicators in selected pillar are displayed
3. ✅ Monthly progress is calculated correctly for selected month
4. ✅ Annual progress is calculated correctly
5. ✅ Progress is displayed clearly (percentage + visual)
6. ✅ Status indicators are accurate
7. ✅ Works for all user roles
8. ✅ Responsive on mobile devices

---

## 📚 Dependencies

### **Existing Utilities**
- `calculateMonthlyProgress()` from `progressUtils.ts`
- `calculateAnnualProgress()` from `progressUtils.ts`
- `parseValue()` from `progressUtils.ts`
- `PILLARS` from `data.ts`
- `INDICATORS` from `data.ts`
- `QUARTERS` from `data.ts`

### **Data Sources**
- `entries` prop (MonitoringEntry[])
- `user` prop (UserInfo)

---

## 🔄 Future Enhancements (Optional)

1. **Export to PDF/Excel**: Download progress report
2. **Sorting**: Sort by progress, indicator name, etc.
3. **Filtering**: Filter by status, progress range
4. **Comparison**: Compare progress across months
5. **Charts**: Visual charts for progress trends
6. **Sub-indicators**: Expand to show sub-indicator details
7. **Historical View**: View progress for past months

---

## 📋 File Locations

### **New Files**
- `frontend/views/PillarProgressView.tsx`

### **Modified Files**
- `frontend/components/Sidebar.tsx` (add menu item)
- `frontend/App.tsx` (add route handler)

---

## 🎨 Design Mockup

```
┌─────────────────────────────────────────────────────────────┐
│  Pillar Progress                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filters:                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Pillar: [▼]  │  │ Quarter: [▼] │  │ Month: [▼]   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ # │ Indicator Name        │ Monthly │ Annual │ Status│   │
│  ├───┼───────────────────────┼─────────┼────────┼───────┤   │
│  │ 1 │ Indicator 1           │ 75% ▓▓▓ │ 68% ▓▓ │ 🟢   │   │
│  │ 2 │ Indicator 2           │ 90% ▓▓▓ │ 85% ▓▓ │ 🟢   │   │
│  │ 3 │ Indicator 3           │ 45% ▓▓  │ 50% ▓▓ │ 🟡   │   │
│  └───┴───────────────────────┴─────────┴────────┴───────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Ready to implement?** This plan provides a complete roadmap for building the Pillar Progress feature. Should we proceed with implementation?
