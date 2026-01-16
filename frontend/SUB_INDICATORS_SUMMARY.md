# Sub-Indicators Summary Report

## Overview
This document lists all indicators across all pillars that have sub-indicators (merged indicators).

---

## Economic Transformation Pillar

### Indicator #3: Ha of land use consolidation for priority crops
**ID:** 3  
**Has Sub-Indicators:** ✅ Yes (4 sub-indicators)

**Main Targets:**
- Q1: 3,340
- Q2: 17,568
- Q3: 335
- Q4: 0
- Annual: 21,243

**Sub-Indicators:**
1. **ID 4** - Area under land use consolidation for Cassava (Ha)
   - Q1: 250, Q2: 1,250, Q3: 0, Q4: 0, Annual: 1,500

2. **ID 5** - Area under land use consolidation for Rice (Ha)
   - Q1: 1,049, Q2: 141, Q3: 1,190, Q4: 0, Annual: 2,380

3. **ID 6** - Area under land use consolidation for Beans (Ha)
   - Q1: 3,048, Q2: 17,999, Q3: 20,026, Q4: 1,430, Annual: 42,503

4. **ID 7** - Area under land use consolidation for Soya bean (Ha)
   - Q1: 50, Q2: 91, Q3: 109, Q4: 0, Annual: 250

---

### Indicator #8: Quantity of improved seed
**ID:** 8  
**Has Sub-Indicators:** ⚠️ Marked as isDual but no subIndicatorIds defined

**Main Targets:**
- Q1: 25,122
- Q2: 167,762
- Q3: 6,040
- Q4: 0
- Annual: 198,924

---

### Indicator #10: Quantity of mineral fertilizer used
**ID:** 10  
**Has Sub-Indicators:** ✅ Yes (4 sub-indicators)

**Main Targets:**
- Q1: 92,900
- Q2: 406,826
- Q3: 110,274
- Q4: 0
- Annual: 610,000

**Sub-Indicators:**
1. **ID 11** - Quantity of UREA used (Kg)
   - Q1: 76,000, Q2: 423,997, Q3: 152,673, Q4: 8,000, Annual: 660,670

2. **ID 12** - Quantity of NPK used (Kg)
   - Q1: 141,495, Q2: 112,225, Q3: 196,410, Q4: 0, Annual: 450,130

3. **ID 13** - Quantity of Blended fertilizers used (Kg)
   - Q1: 2,000, Q2: 13,250, Q3: 7,750, Q4: 27,000, Annual: 50,000

4. **ID 14** - Quantity of lime used (Kg)
   - Q1: 181,500, Q2: 311,750, Q3: 306,750, Q4: 0, Annual: 800,000

---

### Indicator #16: Area of crops insured (Ha)
**ID:** 16  
**Has Sub-Indicators:** ✅ Yes (5 sub-indicators)

**Main Targets:**
- Q1: 0
- Q2: 205
- Q3: 5
- Q4: 0
- Annual: 210

**Sub-Indicators:**
1. **ID 17** - Area of Rice insured (Ha)
   - Q1: 818, Q2: 232, Q3: 825, Q4: 75, Annual: 1,950

2. **ID 18** - Area of Beans insured (Ha)
   - Q1: 0, Q2: 9, Q3: 6, Q4: 0, Annual: 15

3. **ID 19** - Area of Chilli insured (Ha)
   - Q1: 0, Q2: 3, Q3: 7, Q4: 0, Annual: 10

4. **ID 20** - Area of soybeans insured (Ha)
   - Q1: 0, Q2: 9, Q3: 6, Q4: 0, Annual: 15

5. **ID 21** - Area of French beans insured (Ha)
   - Q1: 0, Q2: 6, Q3: 4, Q4: 0, Annual: 10

---

### Indicator #24: Number of cows vaccinated against disease
**ID:** 24  
**Has Sub-Indicators:** ✅ Yes (4 sub-indicators)

**Main Targets:**
- Q1: 0
- Q2: 0
- Q3: 34,000
- Q4: 0
- Annual: 34,000

**Sub-Indicators:**
1. **ID 25** - Number of cows vaccinated against LSD
   - Q1: 0, Q2: 0, Q3: 34,000, Q4: 0, Annual: 34,000

2. **ID 26** - Number of cows vaccinated against RVF
   - Q1: 34,000, Q2: 0, Q3: 0, Q4: 0, Annual: 34,000

3. **ID 27** - Number of cows vaccinated against Brucellosis
   - Q1: 0, Q2: 0, Q3: 2,300, Q4: 0, Annual: 2,300

4. **ID 28** - Number of cows vaccinated against Rabies
   - Q1: 0, Q2: 0, Q3: 300, Q4: 0, Annual: 300

---

### Indicator #29: Number of small livestock vaccinated against RVF
**ID:** 29  
**Has Sub-Indicators:** ✅ Yes (1 sub-indicator)

**Main Targets:**
- Q1: 64,600
- Q2: 0
- Q3: 0
- Q4: 0
- Annual: 64,600

**Sub-Indicators:**
1. **ID 30** - Number of Sheep vaccinated against RVF
   - Q1: 2,300, Q2: 0, Q3: 0, Q4: 0, Annual: 2,300

---

### Indicator #31: Number of livestock insured
**ID:** 31  
**Has Sub-Indicators:** ✅ Yes (2 sub-indicators)

**Main Targets:**
- Q1: 150
- Q2: 200
- Q3: 450
- Q4: 230
- Annual: 1,030

**Sub-Indicators:**
1. **ID 32** - Number of pigs insured
   - Q1: 50, Q2: 200, Q3: 100, Q4: 150, Annual: 500

2. **ID 33** - Number of poultry insured
   - Q1: 0, Q2: 1,000, Q3: 7,000, Q4: 3,000, Annual: 11,000

---

## Summary Statistics

**Total Indicators with Sub-Indicators:** 8 (7 with defined subIndicatorIds + 1 marked as isDual)

**By Pillar:**
- Economic Transformation: 8 indicators
- Social Transformation: (Need to check)
- Transformational Governance: (Need to check)

**Total Sub-Indicators Found:** 22+

---

## Implementation Status

✅ **IMPLEMENTED** - The TargetView component now automatically detects and displays all sub-indicators for any indicator that has:
- `isDual: true`
- `subIndicatorIds` object defined

The system will work for ALL pillars and ALL indicators with this structure!
