# Pillar Progress Calculation Guide

## 📊 Overview

This document explains how progress is calculated at the **pillar level** by aggregating individual indicator progress within each pillar. Pillar progress represents the overall performance of all indicators belonging to a specific pillar.

---

## 🏗️ Pillar Structure

**Hierarchy**: `Pillar → Output → Indicator`

Each pillar contains multiple outputs, and each output contains multiple indicators. Pillar progress aggregates all indicators within that pillar.

---

## 📈 Calculation Methods

There are **two main approaches** used in the system:

### **Method 1: Frontend Analytics View** (Primary Method)
- Used in: `AnalyticsView.tsx`
- **Quarterly**: Excludes indicators without cumulative targets
- **Annual**: Uses all indicators in pillar

### **Method 2: PowerPoint View** (Stricter Exclusion)
- Used in: `PowerPointView.tsx`
- Excludes indicators with no targets in any quarter
- Excludes indicators without cumulative targets for specific quarter

---

## 🔢 Core Calculation Formula

### **Basic Formula**

```
Pillar Progress = (Sum of All Indicator Performances) / (Number of Valid Indicators)
```

**Where**:
- **Indicator Performance**: Each indicator's progress percentage (0-100%)
- **Valid Indicators**: Indicators that have targets for the calculation period

---

## 📅 Quarterly Pillar Progress

### **Step 1: Calculate Individual Indicator Performances**

For each indicator in the pillar:
```javascript
const indicatorPerformance = calculateQuarterProgress({
  indicator,
  entries: indicatorEntries,
  quarterId: 'q1', // or 'q2', 'q3', 'q4'
  monthsInQuarter: ['Jul', 'Aug', 'Sep'] // or appropriate months
});
```

This returns a performance percentage (0-100%) for each indicator.

### **Step 2: Sum All Indicator Performances**

```javascript
const totalQuarterPerf = indicatorPerformances.reduce(
  (sum, ind) => sum + ind.performance, 
  0
);
```

### **Step 3: Determine Valid Indicators (Denominator)**

**Valid indicators** are those that have **cumulative targets** up to the selected quarter:

#### **Q1 (July, August, September)**
```javascript
quarterlyDenominator = indicators.filter(ind => {
  const t1 = parseValue(ind.targets.q1);
  return t1 > 0;  // Must have Q1 target
}).length;
```

#### **Q2 (October, November, December)**
```javascript
quarterlyDenominator = indicators.filter(ind => {
  const t1 = parseValue(ind.targets.q1);
  const t2 = parseValue(ind.targets.q2);
  return (t1 + t2) > 0;  // Must have Q1 + Q2 targets
}).length;
```

#### **Q3 (January, February, March)**
```javascript
quarterlyDenominator = indicators.filter(ind => {
  const t1 = parseValue(ind.targets.q1);
  const t2 = parseValue(ind.targets.q2);
  const t3 = parseValue(ind.targets.q3);
  return (t1 + t2 + t3) > 0;  // Must have Q1 + Q2 + Q3 targets
}).length;
```

#### **Q4 (April, May, June)**
```javascript
quarterlyDenominator = indicators.filter(ind => {
  const t1 = parseValue(ind.targets.q1);
  const t2 = parseValue(ind.targets.q2);
  const t3 = parseValue(ind.targets.q3);
  const t4 = parseValue(ind.targets.q4);
  return (t1 + t2 + t3 + t4) > 0;  // Must have all quarterly targets
}).length;
```

### **Step 4: Calculate Quarterly Pillar Progress**

```javascript
const quarterProgress = quarterlyDenominator > 0 
  ? (totalQuarterPerf / quarterlyDenominator) 
  : 0;
```

---

## 📊 Annual Pillar Progress

### **Step 1: Calculate Individual Indicator Performances**

Same as quarterly - calculate each indicator's performance for the selected quarter.

### **Step 2: Sum All Indicator Performances**

```javascript
const totalQuarterPerf = indicatorPerformances.reduce(
  (sum, ind) => sum + ind.performance, 
  0
);
```

### **Step 3: Use All Indicators as Denominator**

**Important**: Annual progress uses **ALL indicators in the pillar**, regardless of targets:

```javascript
const annualDenominator = pillarIndicators.length;
```

### **Step 4: Calculate Annual Pillar Progress**

```javascript
const annualProgress = annualDenominator > 0 
  ? (totalQuarterPerf / annualDenominator) 
  : 0;
```

**Note**: Annual progress uses the same `totalQuarterPerf` (sum of quarterly performances) but divides by all indicators, not just those with targets.

---

## 🚫 Indicator Exclusion Rules

### **Method 1: Analytics View (Standard)**

**Quarterly Exclusion**:
- Indicators without cumulative targets for the quarter are excluded from denominator
- But their performance (if calculated) is still included in the sum

**Annual Exclusion**:
- No exclusion - all indicators are included

### **Method 2: PowerPoint View (Stricter)**

**Step 1: Exclude Indicators with No Targets**
```javascript
const indicatorsWithNoTargets = indicators.filter(indicator => {
  return Object.values(indicator.targets).every(t =>
    t === 0 || t === '-' || t === undefined || t === null || t === ''
  );
});
```

**Step 2: Exclude Indicators Without Cumulative Targets for Quarter**
```javascript
// Q1: exclude if no Q1 target
// Q2: exclude if no Q1+Q2 targets
// Q3: exclude if no Q1+Q2+Q3 targets
// Q4: exclude if no Q1+Q2+Q3+Q4 targets

const indicatorsToExclude = indicators.filter(indicator => {
  if (indicatorsWithNoTargets.includes(indicator)) return true;
  
  const relevantTargets = {
    q1: indicator.targets.q1,
    q2: quarter.id === 'q2' ? indicator.targets.q2 : null,
    q3: quarter.id === 'q3' ? indicator.targets.q3 : null,
    q4: quarter.id === 'q4' ? indicator.targets.q4 : null
  };
  
  return Object.values(relevantTargets).every(t =>
    t === 0 || t === '-' || t === undefined || t === null || t === ''
  );
});
```

**Step 3: Calculate Only for Valid Indicators**
```javascript
const validIndicators = indicators.filter(ind =>
  !indicatorsToExclude.includes(ind) &&
  !indicatorsWithNoTargets.includes(ind)
);
```

---

## 📋 Complete Calculation Example

### **Example: Economic Transformation Pillar - Q2**

**Assumptions**:
- Pillar has 30 indicators
- 25 indicators have Q1 + Q2 targets
- 5 indicators have no targets or only Q1 target

**Step 1: Calculate Individual Performances**

| Indicator | Q1 Target | Q2 Target | Performance |
|-----------|-----------|-----------|-------------|
| Indicator 1 | 1000 | 2000 | 75% |
| Indicator 2 | 500 | 1000 | 80% |
| Indicator 3 | 0 | 0 | 0% (excluded) |
| ... | ... | ... | ... |
| Indicator 30 | 200 | 400 | 90% |

**Step 2: Sum Performances**
```
totalQuarterPerf = 75 + 80 + 0 + ... + 90 = 2000%
```

**Step 3: Count Valid Indicators**
```
quarterlyDenominator = 25  // Only indicators with Q1+Q2 targets
```

**Step 4: Calculate Quarterly Progress**
```
quarterProgress = 2000 / 25 = 80%
```

**Step 5: Calculate Annual Progress**
```
annualDenominator = 30  // All indicators in pillar
annualProgress = 2000 / 30 = 66.67%
```

---

## 🔍 Backend API Calculation

### **Endpoint**: `GET /api/analytics/progress`

**Implementation** (`Backend/src/routes/analyticsRoutes.ts`):

```javascript
// For each pillar
pillars.map(async (pillar) => {
  // Get all indicators for this pillar
  const pillarIndicators = pillarData.outputs.flatMap(
    output => output.indicators
  );
  
  // Get all submissions for this pillar
  const entries = await SubmissionModel.find({
    pillarId: pillar.id
  });
  
  // Calculate for each quarter
  for (const qId of ['q1', 'q2', 'q3', 'q4']) {
    let indicatorProgressSum = 0;
    
    // Calculate each indicator's progress
    for (const indicator of pillarIndicators) {
      const indicatorEntries = entries.filter(e => 
        e.indicatorId === indicator.id && e.quarterId === qId
      );
      
      if (indicatorEntries.length > 0) {
        const progressResult = calculateQuarterProgress({
          indicator,
          entries: indicatorEntries,
          quarterId: qId,
          monthsInQuarter: [...]
        });
        
        indicatorProgressSum += progressResult.performance;
      }
    }
    
    // Calculate pillar progress
    const pillarProgress = pillarIndicatorCount > 0 
      ? (indicatorProgressSum / pillarIndicatorCount) 
      : 0;
    
    // Calculate annual progress
    const annualProgress = totalIndicatorsAcrossAllPillars > 0 
      ? (indicatorProgressSum / totalIndicatorsAcrossAllPillars) 
      : 0;
  }
});
```

**Note**: Backend uses **all indicators in pillar** as denominator (doesn't exclude based on targets).

---

## 📊 Key Differences Between Methods

| Aspect | Analytics View | PowerPoint View | Backend API |
|--------|----------------|-----------------|-------------|
| **Quarterly Denominator** | Indicators with cumulative targets | Indicators with cumulative targets | All indicators |
| **Annual Denominator** | All indicators | All indicators | All indicators |
| **Exclusion Logic** | Excludes from denominator only | Excludes from both sum and denominator | No exclusion |
| **Performance Sum** | Includes all indicators | Only valid indicators | Includes all indicators |

---

## 🎯 Important Rules

### **1. Indicator Performance Capping**
- Each indicator's performance is capped at 100%
- Pillar progress can exceed 100% if multiple indicators exceed targets (but typically capped in display)

### **2. Zero Targets**
- Indicators with zero targets are excluded from quarterly denominator
- But may still be included in annual calculation

### **3. Missing Data**
- If an indicator has no submissions, its performance is 0%
- This 0% is still included in the sum

### **4. Composite Indicators**
- Composite indicators (with sub-indicators) return a single performance percentage
- This percentage is treated the same as any other indicator in pillar calculation

---

## 📈 Calculation Flow Diagram

```
┌─────────────────────────────────────┐
│   Pillar (e.g., Economic Transform) │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Get All Indicators  │
    │  in Pillar           │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  For Each Indicator: │
    │  Calculate Progress  │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Sum All Performances│
    └──────────┬───────────┘
               │
               ├─────────────────┬─────────────────┐
               ▼                 ▼                 ▼
    ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Quarterly        │ │ Annual       │ │ Overall      │
    │ Progress         │ │ Progress     │ │ Progress     │
    │                  │ │              │ │              │
    │ Sum / Valid      │ │ Sum / All    │ │ Sum / All    │
    │ Indicators       │ │ Indicators   │ │ Indicators   │
    └──────────────────┘ └──────────────┘ └──────────────┘
```

---

## 🔧 Implementation Details

### **Frontend: AnalyticsView.tsx**

```typescript
const pillarStats = useMemo(() => {
  return PILLARS.map(pillar => {
    const pillarIndicators = pillar.outputs.flatMap(o => o.indicators || []);
    
    // Calculate individual indicator performances
    const indicatorPerformances = pillarIndicators.map(indicator => {
      const indicatorEntries = entriesByIndicator[indicator.id] || [];
      const qResult = calculateQuarterProgress({
        indicator,
        entries: indicatorEntries,
        quarterId,
        monthsInQuarter: selectedQuarter?.months || []
      });
      return {
        indicator,
        performance: qResult.performance,
        hasTarget: qResult.target > 0
      };
    });
    
    // Sum all performances
    const totalQuarterPerf = indicatorPerformances.reduce(
      (sum, ind) => sum + ind.performance, 
      0
    );
    
    // Calculate quarterly denominator (indicators with cumulative targets)
    let quarterlyDenominator = 0;
    if (quarterId === 'q1') {
      quarterlyDenominator = indicatorPerformances.filter(ind => {
        const t1 = parseValue(ind.indicator.targets.q1);
        return t1 > 0;
      }).length;
    } else if (quarterId === 'q2') {
      quarterlyDenominator = indicatorPerformances.filter(ind => {
        const t1 = parseValue(ind.indicator.targets.q1);
        const t2 = parseValue(ind.indicator.targets.q2);
        return (t1 + t2) > 0;
      }).length;
    }
    // ... similar for Q3 and Q4
    
    // Annual denominator (all indicators)
    const annualDenominator = pillarIndicators.length;
    
    // Calculate progress
    const quarterProgress = quarterlyDenominator > 0 
      ? (totalQuarterPerf / quarterlyDenominator) 
      : 0;
    const annualProgress = annualDenominator > 0 
      ? (totalQuarterPerf / annualDenominator) 
      : 0;
    
    return {
      ...pillar,
      q: quarterProgress,
      a: annualProgress
    };
  });
}, [entriesByIndicator, selectedQuarter]);
```

---

## 📝 Special Cases

### **Case 1: Pillar with No Submissions**
- All indicator performances = 0%
- Sum = 0%
- Progress = 0%

### **Case 2: Pillar with Some Indicators Having No Targets**
- Indicators without targets excluded from quarterly denominator
- But their 0% performance still included in sum
- Annual calculation includes all indicators

### **Case 3: All Indicators Exceed Targets**
- Each indicator = 100% (capped)
- Sum = (number of indicators) × 100%
- Progress = 100% (if denominator equals number of indicators)

### **Case 4: Mixed Performance**
- Some indicators at 50%, some at 100%, some at 0%
- Sum = sum of all percentages
- Progress = average of all valid indicators

---

## 🚨 Common Issues & Solutions

### **Issue 1: Pillar Progress Seems Too Low**
**Problem**: Many indicators have no targets, reducing denominator  
**Solution**: Check if indicators should have targets, or adjust exclusion logic

### **Issue 2: Quarterly vs Annual Mismatch**
**Problem**: Quarterly progress different from annual for same data  
**Solution**: This is expected - quarterly excludes indicators without targets, annual includes all

### **Issue 3: Progress Exceeds 100%**
**Problem**: Sum of performances exceeds denominator  
**Solution**: This can happen if many indicators exceed targets. Consider capping at 100% in display

### **Issue 4: Missing Indicators in Calculation**
**Problem**: Some indicators not included in pillar progress  
**Solution**: Check if indicators have targets for the selected quarter

---

## 📚 Related Calculations

1. **Indicator Progress**: See `PROGRESS_CALCULATION_GUIDE.md`
2. **Submission Storage**: See `SUBMISSION_STORAGE_GUIDE.md`
3. **Overall System Progress**: Aggregates all pillars (similar logic)

---

## 🔍 Debugging

### **Enable Debug Logging**

In `AnalyticsView.tsx`, debug logging is enabled for "Economic Transformation" pillar:

```javascript
if (pillar.name === 'Economic Transformation' && quarterId === 'q2') {
  console.log('=== Economic Transformation Q2 Debug ===');
  console.log('Total Quarter Performance:', totalQuarterPerf);
  console.log('Quarterly Denominator:', quarterlyDenominator);
  console.log('Annual Denominator:', annualDenominator);
  console.log('Individual Indicators:');
  indicatorPerformances.forEach((ind, idx) => {
    console.log(`  ${idx + 1}. ${ind.indicator.name}: Performance=${ind.performance.toFixed(1)}%`);
  });
}
```

---

## 📊 Example Output

### **Pillar Progress Data Structure**

```javascript
{
  pillarId: "1",
  pillarName: "Economic Transformation",
  q: 75.5,        // Quarterly progress
  a: 68.2,        // Annual progress
  outputs: [...], // Output structure
  indicators: [...] // Indicator structure
}
```

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")  
**Version**: 1.0.0
