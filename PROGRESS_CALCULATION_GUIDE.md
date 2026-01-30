# Progress Calculation Guide

## 📊 Overview

This document explains how progress is calculated for every indicator in the Imihigo Monitoring System. The calculation method depends on the indicator's `measurementType` and whether it has sub-indicators.

---

## 🎯 Indicator Types

### **1. Standard Cumulative Indicators** (Default)
- **Measurement Type**: `cumulative` (or not specified)
- **Description**: Values accumulate over time. User inputs are already cumulative.
- **Example**: "Ha of land meeting FOBASI operationalization criteria"

### **2. Percentage Indicators**
- **Measurement Type**: `percentage`
- **Description**: Fixed quarterly percentage targets. Each quarter has its own target percentage.
- **Example**: "Percentage of works progress for constructions"

### **3. Decreasing Indicators**
- **Measurement Type**: `decreasing`
- **Description**: Lower values are better. Progress increases as actual values stay below target.
- **Example**: "Maternal mortality rate" (lower is better)

### **4. Composite/Merged Indicators**
- **Has Sub-Indicators**: `subIndicatorIds` property exists
- **Description**: Parent indicator that combines multiple sub-indicators. Progress is the average of sub-indicator progress percentages.
- **Example**: "Quantity of improved seed" (combines maize and soya)

---

## 📅 Calculation Timeframes

### **Monthly Calculations**
Calculations are performed for each month within a quarter.

### **Quarterly Calculations**
Calculations aggregate data for Q1, Q2, Q3, or Q4.

### **Annual Calculations**
Calculations aggregate all data for the entire year.

---

## 🔢 Core Calculation Formulas

### **1. Standard Cumulative Indicators**

#### **Quarterly Progress**

**Step 1: Calculate Total Actual**
- For cumulative indicators: Use the **latest (highest) cumulative value** from the quarter
- Formula: `totalActual = Math.max(...quarterEntries.map(e => e.value))`
- **Reason**: User inputs are already cumulative, so we don't sum them (prevents double-counting)

**Step 2: Calculate Target Denominator**
The target denominator is cumulative based on the quarter:
- **Q1**: `targetDenominator = Q1_target`
- **Q2**: `targetDenominator = Q1_target + Q2_target`
- **Q3**: `targetDenominator = Q1_target + Q2_target + Q3_target`
- **Q4**: `targetDenominator = Q1_target + Q2_target + Q3_target + Q4_target`

**Step 3: Calculate Performance**
```
performance = (totalActual / targetDenominator) × 100
performance = Math.min(performance, 100)  // Cap at 100%
```

#### **Monthly Progress (Cumulative)**

Target denominator varies by month:
- **July, August, September**: Use Q1 target
- **October, November, December**: Use Q1 + Q2 targets
- **January, February, March**: Use Q1 + Q2 + Q3 targets
- **April, May, June**: Use Q1 + Q2 + Q3 + Q4 targets

```
performance = (monthlyCumulativeValue / monthTargetDenominator) × 100
```

#### **Annual Progress**

**Step 1: Calculate Total Actual**
- Use the **latest (highest) cumulative value** from all entries
- Formula: `totalActual = Math.max(...indicatorEntries.map(e => e.value))`

**Step 2: Calculate Performance**
```
performance = (totalActual / annualTarget) × 100
performance = Math.min(performance, 100)  // Cap at 100%
```

---

### **2. Percentage Indicators**

#### **Quarterly Progress**

**Step 1: Calculate Total Actual**
- Average the monthly percentage values in the quarter
- Formula: `totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0) / quarterEntries.length`

**Step 2: Calculate Target Denominator**
- Use **only the current quarter's target** (no summing)
- **Q1**: `targetDenominator = Q1_target`
- **Q2**: `targetDenominator = Q2_target`
- **Q3**: `targetDenominator = Q3_target`
- **Q4**: `targetDenominator = Q4_target`

**Step 3: Calculate Performance**
```
performance = (totalActual / targetDenominator) × 100
performance = Math.min(performance, 100)  // Cap at 100%
```

#### **Monthly Progress (Percentage)**

Target denominator is based on the quarter the month belongs to:
- **July, August, September**: Use Q1 target
- **October, November, December**: Use Q2 target
- **January, February, March**: Use Q3 target
- **April, May, June**: Use Q4 target

```
performance = (monthlyPercentageValue / quarterTarget) × 100
```

#### **Annual Progress**

**Step 1: Calculate Total Actual**
- Sum all monthly percentage values
- Formula: `totalActual = indicatorEntries.reduce((acc, curr) => acc + curr.value, 0)`

**Step 2: Calculate Performance**
```
performance = (totalActual / annualTarget) × 100
performance = Math.min(performance, 100)  // Cap at 100%
```

---

### **3. Decreasing Indicators**

#### **Quarterly Progress**

**Step 1: Calculate Total Actual**
- Same as cumulative indicators: Use the latest (highest) value from the quarter
- Formula: `totalActual = Math.max(...quarterEntries.map(e => e.value))`

**Step 2: Calculate Target Denominator**
- Use current quarter target only (no summing)
- **Q1**: `targetDenominator = Q1_target`
- **Q2**: `targetDenominator = Q2_target`
- **Q3**: `targetDenominator = Q3_target`
- **Q4**: `targetDenominator = Q4_target`

**Step 3: Calculate Performance (Inverted)**
```
if (totalActual > 0) {
    performance = (targetDenominator / totalActual) × 100
} else {
    performance = 100  // No actual value means perfect (0 is best)
}
performance = Math.min(performance, 100)  // Cap at 100%
```

**Logic**: Lower actual values result in higher performance. If target is 10 and actual is 5, performance = (10/5) × 100 = 200%, capped at 100%.

#### **Monthly Progress (Decreasing)**

Target denominator is based on the quarter:
- **July, August, September**: Use Q1 target
- **October, November, December**: Use Q2 target
- **January, February, March**: Use Q3 target
- **April, May, June**: Use Q4 target

```
if (value > 0) {
    performance = (target / value) × 100
} else {
    performance = 100
}
performance = Math.min(performance, 100)
```

#### **Annual Progress**

**Step 1: Calculate Total Actual**
- Use the latest (highest) value from all entries
- Formula: `totalActual = Math.max(...indicatorEntries.map(e => e.value))`

**Step 2: Calculate Performance (Inverted)**
```
if (totalActual > 0) {
    performance = (annualTarget / totalActual) × 100
} else {
    performance = 100
}
performance = Math.min(performance, 100)  // Cap at 100%
```

---

### **4. Composite/Merged Indicators (with Sub-Indicators)**

Composite indicators combine multiple sub-indicators. The parent indicator's progress is the **average of all sub-indicator progress percentages**.

#### **Quarterly Progress**

**Step 1: Calculate Each Sub-Indicator Progress**

For each sub-indicator:

1. **Calculate Sub-Actual**:
   - Sum the sub-values from all entries in the quarter
   - Formula: `subActual = quarterEntries.reduce((acc, curr) => acc + getSubValue(curr.subValues, key), 0)`

2. **Calculate Sub-Target**:
   - **For percentage/decreasing sub-indicators**: Use current quarter target only
     - Q1: `subTarget = Q1_target`
     - Q2: `subTarget = Q2_target`
     - Q3: `subTarget = Q3_target`
     - Q4: `subTarget = Q4_target`
   - **For cumulative sub-indicators**: Use cumulative targets
     - Q1: `subTarget = Q1_target`
     - Q2: `subTarget = Q1_target + Q2_target`
     - Q3: `subTarget = Q1_target + Q2_target + Q3_target`
     - Q4: `subTarget = Q1_target + Q2_target + Q3_target + Q4_target`

3. **Calculate Sub-Performance**:
   ```
   if (subTarget > 0) {
       subPerformance = (subActual / subTarget) × 100
       if (subIndicator.measurementType === 'decreasing') {
           subPerformance = subActual > 0 ? (subTarget / subActual) × 100 : 100
       }
   } else if (subActual > 0) {
       subPerformance = 100  // Exceeded no target
   } else {
       subPerformance = 0
   }
   subPerformance = Math.min(subPerformance, 100)  // Cap at 100%
   ```

**Step 2: Calculate Parent Indicator Progress**
```
parentPerformance = average of all subPerformance values
parentPerformance = Math.min(parentPerformance, 100)  // Cap at 100%
```

#### **Special Cases for Composite Indicators**

**Indicators 69, 99, 101** have special handling:
- These indicators store targets in the database (`subValues` contains both actual and target)
- Calculation: `calculatedPercentage = (subActual / subTarget) × 100`
- Then compare calculated percentage to target percentage:
  ```
  if (targetPercentage > 0) {
      subPerformance = (calculatedPercentage / targetPercentage) × 100
  }
  ```

#### **Annual Progress**

**Step 1: Calculate Each Sub-Indicator Annual Progress**

For each sub-indicator:
1. **Calculate Sub-Actual**: Sum all sub-values from all entries
   ```
   subActual = indicatorEntries.reduce((acc, curr) => acc + getSubValue(curr.subValues, key), 0)
   ```

2. **Calculate Sub-Target**: Use annual target
   ```
   subTarget = parseValue(subIndicator.targets.annual)
   ```

3. **Calculate Sub-Performance**:
   ```
   if (subTarget > 0) {
       subPerformance = (subActual / subTarget) × 100
       if (subIndicator.measurementType === 'decreasing') {
           subPerformance = subActual > 0 ? (subTarget / subActual) × 100 : 100
       }
   }
   subPerformance = Math.min(subPerformance, 100)  // Cap at 100%
   ```

**Step 2: Calculate Parent Indicator Annual Progress**
```
parentPerformance = average of all subPerformance values
parentPerformance = Math.min(parentPerformance, 100)  // Cap at 100%
```

---

## 📋 Monthly Target Denominator Rules

### **For Cumulative Indicators**

| Month | Target Denominator |
|-------|-------------------|
| July | Q1 target |
| August | Q1 target |
| September | Q1 target |
| October | Q1 + Q2 targets |
| November | Q1 + Q2 targets |
| December | Q1 + Q2 targets |
| January | Q1 + Q2 + Q3 targets |
| February | Q1 + Q2 + Q3 targets |
| March | Q1 + Q2 + Q3 targets |
| April | Q1 + Q2 + Q3 + Q4 targets |
| May | Q1 + Q2 + Q3 + Q4 targets |
| June | Q1 + Q2 + Q3 + Q4 targets |

### **For Percentage/Decreasing Indicators**

| Month | Target Denominator |
|-------|-------------------|
| July | Q1 target |
| August | Q1 target |
| September | Q1 target |
| October | Q2 target |
| November | Q2 target |
| December | Q2 target |
| January | Q3 target |
| February | Q3 target |
| March | Q3 target |
| April | Q4 target |
| May | Q4 target |
| June | Q4 target |

---

## 🚫 Not Applicable (N/A) Handling

If any entry in a quarter has `isNotApplicable = true`:
- **Quarterly Progress**: Returns `{ performance: 0, trend: 'on-track' }`
- **Annual Progress**: Returns `0`

This indicates the indicator is not applicable for that period.

---

## 📊 Progress Capping

**All progress calculations are capped at 100%**:
```javascript
performance = Math.min(performance, 100)
```

This ensures that exceeding targets doesn't show progress above 100%.

---

## 🔍 Special Indicator Cases

### **Indicator 69: Percentage of patients enrolled in NCD programs**
- Has sub-indicators: `hypertension`, `diabetes`
- Stores targets in database: `hypertension_target`, `diabetes_target`
- Calculation: `(enrolled / target) × 100`, then compare to target percentage

### **Indicator 99: Percentage of accurate data**
- Has sub-indicators: `students`, `material`, `workers`
- Stores targets in database: `students_target`, `material_target`, `workers_target`
- Similar calculation to Indicator 69

### **Indicator 101: Percentage of students attending**
- Has sub-indicators: `primary`, `secondary`, `tvet`
- Stores targets in database: `primary_target`, `secondary_target`, `tvet_target`
- Similar calculation to Indicator 69

---

## 📝 Calculation Examples

### **Example 1: Standard Cumulative Indicator**

**Indicator**: "Ha of land meeting FOBASI operationalization criteria"
- **Type**: Cumulative
- **Targets**: Q1: 0, Q2: 0, Q3: 0, Q4: 18713, Annual: 18713

**Q4 Calculation**:
- Entries: July: 5000, August: 8000, September: 12000
- `totalActual = Math.max(5000, 8000, 12000) = 12000`
- `targetDenominator = 0 + 0 + 0 + 18713 = 18713`
- `performance = (12000 / 18713) × 100 = 64.1%`

**Annual Calculation**:
- Latest cumulative value: 12000
- `performance = (12000 / 18713) × 100 = 64.1%`

---

### **Example 2: Percentage Indicator**

**Indicator**: "Percentage of works progress for constructions"
- **Type**: Percentage
- **Targets**: Q1: 0%, Q2: 0%, Q3: 60%, Q4: 100%, Annual: 100%

**Q3 Calculation**:
- Entries: July: 20%, August: 40%, September: 60%
- `totalActual = (20 + 40 + 60) / 3 = 40%`
- `targetDenominator = 60%`
- `performance = (40 / 60) × 100 = 66.7%`

**Q4 Calculation**:
- Entries: October: 70%, November: 85%, December: 100%
- `totalActual = (70 + 85 + 100) / 3 = 85%`
- `targetDenominator = 100%`
- `performance = (85 / 100) × 100 = 85%`

---

### **Example 3: Composite Indicator**

**Indicator**: "Quantity of improved seed"
- **Type**: Composite (has sub-indicators)
- **Sub-Indicators**:
  - Maize: Q1: 25122, Q2: 167762, Q3: 6040, Q4: 0, Annual: 198924
  - Soya: Q1: 2350, Q2: 5900, Q3: 6578, Q4: 0, Annual: 14828

**Q2 Calculation**:

1. **Maize Sub-Indicator**:
   - Entries: October: 50000, November: 100000, December: 150000
   - `subActual = 150000` (latest cumulative)
   - `subTarget = 25122 + 167762 = 192884`
   - `subPerformance = (150000 / 192884) × 100 = 77.8%`

2. **Soya Sub-Indicator**:
   - Entries: October: 2000, November: 4000, December: 6000
   - `subActual = 6000` (latest cumulative)
   - `subTarget = 2350 + 5900 = 8250`
   - `subPerformance = (6000 / 8250) × 100 = 72.7%`

3. **Parent Indicator**:
   - `parentPerformance = (77.8 + 72.7) / 2 = 75.25%`

---

### **Example 4: Decreasing Indicator**

**Indicator**: "Maternal mortality rate" (hypothetical)
- **Type**: Decreasing
- **Targets**: Q1: 10, Q2: 8, Q3: 6, Q4: 4, Annual: 4

**Q2 Calculation**:
- Entries: October: 9, November: 8, December: 7
- `totalActual = Math.max(9, 8, 7) = 9`
- `targetDenominator = 8`
- `performance = (8 / 9) × 100 = 88.9%`

**Logic**: Actual (9) is higher than target (8), so performance is less than 100%. Lower actual values would result in higher performance.

---

## 🔧 Implementation Details

### **Key Functions**

1. **`calculateQuarterProgress()`** - Frontend utility (`frontend/utils/progressUtils.ts`)
   - Calculates quarterly progress for any indicator type
   - Handles sub-indicators, N/A flags, and special cases

2. **`calculateAnnualProgress()`** - Frontend utility (`frontend/utils/progressUtils.ts`)
   - Calculates annual progress for any indicator type
   - Handles sub-indicators and N/A flags

3. **`calculateMonthlyProgress()`** - Frontend utility (`frontend/utils/progressUtils.ts`)
   - Calculates monthly progress for any indicator type
   - Uses month-to-quarter mapping for target denominators

4. **`calculateIndicatorProgress()`** - Backend utility (`Backend/src/utils/progressCalculator.ts`)
   - Backend calculation for employee progress tracking
   - Aggregates submissions by quarter

### **Data Structure**

**Submission Entry**:
```typescript
{
  indicatorId: string;
  quarterId: 'q1' | 'q2' | 'q3' | 'q4';
  month: string;
  value: number;  // Main value
  subValues?: {   // For composite indicators
    [key: string]: number
  };
  isNotApplicable?: boolean;
}
```

**Indicator Definition**:
```typescript
{
  id: string;
  name: string;
  targets: {
    q1: string | number;
    q2: string | number;
    q3: string | number;
    q4: string | number;
    annual: string | number;
  };
  measurementType?: 'cumulative' | 'percentage' | 'decreasing';
  subIndicatorIds?: Record<string, string>;  // {key: subIndicatorId}
}
```

---

## ✅ Validation Rules

1. **Progress is always capped at 100%**
2. **Zero targets**: If target is 0, performance is 0 (unless actual > 0 and no target, then 100%)
3. **N/A entries**: If any entry is N/A, progress is 0 for that period
4. **Cumulative values**: Never sum cumulative values, use the latest (highest) value
5. **Percentage indicators**: Average monthly percentages, don't sum them
6. **Composite indicators**: Average sub-indicator performances, don't sum actuals

---

## 📚 Related Files

- `frontend/utils/progressUtils.ts` - Main calculation utilities
- `Backend/src/utils/progressCalculator.ts` - Backend calculation utilities
- `Backend/src/utils/progressUtils.ts` - Backend utility functions
- `frontend/data.ts` - Indicator definitions and targets
- `frontend/views/ProgressCalculatorView.tsx` - UI for testing calculations

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd")
**Version**: 1.0.0
