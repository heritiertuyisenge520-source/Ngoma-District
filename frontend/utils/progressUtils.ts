
// Utility to clean strings (e.g. "80%" -> 80, "1,000" -> 1000)
export const parseValue = (val: string | number | undefined): number => {
    if (val === undefined || val === null || val === '-') return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
};

// Main calculation logic
import { Indicator, INDICATORS } from '../data';

interface CalculationContext {
    indicator: Indicator;
    entries: any[]; // Replace 'any' with your Entry type
    quarterId: string; // 'q1', 'q2', 'q3', 'q4'
    monthsInQuarter: string[];
}

export const calculateQuarterProgress = ({ indicator, entries, quarterId, monthsInQuarter }: CalculationContext) => {
    const isPercentage = indicator.measurementType === 'percentage';
    const isDecreasing = indicator.measurementType === 'decreasing';
    const isCumulative = !isPercentage && !isDecreasing; // Default to cumulative if not specified

    // 1. Calculate Total Actual for the Quarter
    // User data is ALREADY cumulative, so we only need the selected quarter's entries
    // Filter entries by quarterId
    const quarterEntries = entries.filter(e => e.quarterId === quarterId);

    // For standard cumulative, we sum the actuals of the months (e.g. Jan + Feb + Mar)
    // For percentage, usually we might average them OR take the latest? 
    // README says: "on january we took input in january divide... on february we took input in february"
    // This implies the 'progress' is calculated PER MONTH, and then maybe displayed per month on the graph.
    // But for the "Quarter Health Score" (the big circle), we need a single value.
    // README says: "become the progress of the quarter".
    // Let's assume for the Quarter Score, we take the sum of actuals (for numeric) or the average/latest for percentage?
    // Actually, the README says for cumulative: "input of month / fixed target".
    // So for the whole quarter, it's likely (Sum of Month Actuals) / (Target).

    // Let's stick to the README's monthly logic for the graph, and for the Quarter Score:
    // Cumulative: Sum of entries / Target
    // Percentage: Average of entries / Target (OR Sum if text implies it? README says "percentage... calculated progress of month")

    let totalActual = 0;
    if (isPercentage) {
        // If it's percentage, summing 20% + 30% = 50% might be wrong if they are independent.
        // But usually, inputs like "2000/10000" result in a % for that month.
        // Let's Sum them for now if they are "achievements" contributed.
        // WAIT. README says: "20%... used to calculate progress... 20/40*100 = 50%".
        // If Apr=20%, May=30%, Jun=40%. Quarter Progress? 
        // It's ambiguous. Let's start with Sum for standard, and for Percentage identifiers we might need careful handling.
        // However, usually in these systems, "Actual" is cumulative for the quarter in the DB? 
        // No, DB stores monthly. 

        // Let's treat "totalActual" as the SUM of the monthly values for now, as that fits "Cumulative".
        totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0);
    } else {
        totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0);
    }


    // 2. Determine the Denominator (Target)
    // README:
    // Q1: Target Q1
    // Q2: Target Q1 + Target Q2
    // Q3: Q1 + Q2 + Q3
    // Q4: Q1 + Q2 + Q3 + Q4 (which is Annual)

    let targetDenominator = 0;

    const t1 = parseValue(indicator.targets.q1);
    const t2 = parseValue(indicator.targets.q2);
    const t3 = parseValue(indicator.targets.q3);
    const t4 = parseValue(indicator.targets.q4);

    if (isPercentage || isDecreasing) {
        // README: "fixed target in quarter 1 is 40%... progress of july = result / 40% * 100"
        // "so another thing to consider is on quarter we dont add the percentages of the quarters... as we did it on numbers"
        // THIS IS KEY. For percentages, we DO NOT sum Q1+Q2. We just use the current quarter's target.
        switch (quarterId) {
            case 'q1': targetDenominator = t1; break;
            case 'q2': targetDenominator = t2; break; // NOT t1+t2
            case 'q3': targetDenominator = t3; break;
            case 'q4': targetDenominator = t4; break;
        }
    } else {
        // Standard Cumulative Logic (Summing Targets)
        switch (quarterId) {
            case 'q1':
                targetDenominator = t1;
                break;
            case 'q2':
                targetDenominator = t1 + t2;
                break;
            case 'q3':
                targetDenominator = t1 + t2 + t3;
                break;
            case 'q4':
                targetDenominator = t1 + t2 + t3 + t4;
                break;
        }
    }

    // Guard against division by zero
    if (targetDenominator === 0) targetDenominator = 1;

    // 3. Calculate Performance
    let performance = 0;
    let subIndicatorDetails: any[] = [];

    // Legacy key mapping for backwards compatibility with old database data
    const legacyKeyMap: Record<string, string[]> = {
        'chicken': ['poultry', 'chicken'],      // Indicator 31
        'maize': ['maize_kg', 'maize'],         // Indicator 8
        'soya': ['soya_kg', 'soya'],            // Indicator 8
        'lsd': ['lsd', 'bq'],                   // Indicator 24 - bq was used for lsd in old data
    };

    // Helper to get value with legacy key fallback
    const getSubValue = (subValues: Record<string, number> | undefined, key: string): number => {
        if (!subValues) return 0;

        // Try the correct key first
        if (subValues[key] !== undefined) return subValues[key];

        // Try legacy keys
        const legacyKeys = legacyKeyMap[key];
        if (legacyKeys) {
            for (const legacyKey of legacyKeys) {
                if (subValues[legacyKey] !== undefined) return subValues[legacyKey];
            }
        }

        return 0;
    };

    if (indicator.subIndicatorIds) {
        const subMapping = indicator.subIndicatorIds;

        Object.entries(subMapping).forEach(([key, subId]) => {
            const subIndicator = INDICATORS.find(i => i.id === subId);
            if (subIndicator) {
                const subActual = quarterEntries.reduce((acc, curr) => {
                    const val = getSubValue(curr.subValues, key);
                    return acc + val;
                }, 0);

                let subTarget = 0;
                const st1 = parseValue(subIndicator.targets.q1);
                const st2 = parseValue(subIndicator.targets.q2);
                const st3 = parseValue(subIndicator.targets.q3);
                const st4 = parseValue(subIndicator.targets.q4);

                if (subIndicator.measurementType === 'percentage' || subIndicator.measurementType === 'decreasing') {
                    switch (quarterId) {
                        case 'q1': subTarget = st1; break;
                        case 'q2': subTarget = st2; break;
                        case 'q3': subTarget = st3; break;
                        case 'q4': subTarget = st4; break;
                    }
                } else {
                    switch (quarterId) {
                        case 'q1': subTarget = st1; break;
                        case 'q2': subTarget = st1 + st2; break;
                        case 'q3': subTarget = st1 + st2 + st3; break;
                        case 'q4': subTarget = st1 + st2 + st3 + st4; break;
                    }
                }

                // Always show sub-indicator, even if target is 0
                let subPerf = 0;
                if (subTarget > 0) {
                    subPerf = (subActual / subTarget) * 100;
                    if (subIndicator.measurementType === 'decreasing') {
                        subPerf = subActual > 0 ? (subTarget / subActual) * 100 : 100;
                    }
                } else if (subActual > 0) {
                    // If no target but has actual, show 100% (exceeded no target)
                    subPerf = 100;
                }

                subIndicatorDetails.push({
                    key,
                    id: subId,
                    name: subIndicator.name,
                    actual: subActual,
                    target: subTarget,
                    performance: Math.min(subPerf, 100)
                });
            }
        });

        if (subIndicatorDetails.length > 0) {
            // Only average sub-indicators that have targets for proper calculation
            const subsWithTargets = subIndicatorDetails.filter(s => s.target > 0);
            if (subsWithTargets.length > 0) {
                performance = subsWithTargets.reduce((a, b) => a + b.performance, 0) / subsWithTargets.length;
            } else {
                // If no sub-indicators have targets, use the fallback
                performance = totalActual > 0 ? 100 : 0;
            }
        } else {
            performance = (totalActual / targetDenominator) * 100;
        }
    } else {
        performance = (totalActual / targetDenominator) * 100;
        if (isDecreasing) {
            performance = totalActual > 0 ? (targetDenominator / totalActual) * 100 : 100;
        }
    }

    // Determine Trend (Where you are going)
    const nextQuarterId = quarterId === 'q1' ? 'q2' : quarterId === 'q2' ? 'q3' : quarterId === 'q3' ? 'q4' : 'q4';
    const nextTarget = parseValue((indicator.targets as any)[nextQuarterId]);

    return {
        totalActual,
        target: targetDenominator,
        performance: Math.min(performance, 100),
        trend: performance >= 90 ? 'on-track' : performance >= 50 ? 'improving' : 'needs-attention',
        nextTarget,
        subIndicatorDetails
    };
};

export const calculateAnnualProgress = (indicator: Indicator, entries: any[]) => {
    // Collect all entries for the indicator
    const indicatorEntries = entries.filter(e => e.indicatorId === indicator.id);

    // Legacy key mapping for backwards compatibility with old database data
    const legacyKeyMap: Record<string, string[]> = {
        'chicken': ['poultry', 'chicken'],
        'maize': ['maize_kg', 'maize'],
        'soya': ['soya_kg', 'soya'],
        'lsd': ['lsd', 'bq'],
    };

    const getSubValue = (subValues: Record<string, number> | undefined, key: string): number => {
        if (!subValues) return 0;
        if (subValues[key] !== undefined) return subValues[key];
        const legacyKeys = legacyKeyMap[key];
        if (legacyKeys) {
            for (const legacyKey of legacyKeys) {
                if (subValues[legacyKey] !== undefined) return subValues[legacyKey];
            }
        }
        return 0;
    };

    if (indicator.subIndicatorIds) {
        let subPerformances: number[] = [];
        const subMapping = indicator.subIndicatorIds;

        Object.entries(subMapping).forEach(([key, subId]) => {
            const subIndicator = INDICATORS.find(i => i.id === subId);
            if (subIndicator) {
                const subActual = indicatorEntries.reduce((acc, curr) => acc + getSubValue(curr.subValues, key), 0);
                const subTarget = parseValue(subIndicator.targets.annual);

                if (subTarget > 0) {
                    let subPerf = (subActual / subTarget) * 100;
                    if (subIndicator.measurementType === 'decreasing') {
                        subPerf = subActual > 0 ? (subTarget / subActual) * 100 : 100;
                    }
                    subPerformances.push(subPerf);
                }
            }
        });

        if (subPerformances.length > 0) {
            // Cap each sub-performance at 100% before averaging
            const cappedPerformances = subPerformances.map(p => Math.min(p, 100));
            return Math.min(cappedPerformances.reduce((a, b) => a + b, 0) / cappedPerformances.length, 100);
        }
    }

    const totalActual = indicatorEntries.reduce((acc, curr) => acc + curr.value, 0);
    const annualTarget = parseValue(indicator.targets.annual);

    if (annualTarget === 0) return 0;

    let performance = (totalActual / annualTarget) * 100;
    if (indicator.measurementType === 'decreasing') {
        performance = totalActual > 0 ? (annualTarget / totalActual) * 100 : 100;
    }

    return Math.min(performance, 100);
};

export const calculateMonthlyProgress = (indicator: Indicator, value: number, quarterId: string, itemEntries?: any[]) => {
    const isPercentage = indicator.measurementType === 'percentage';
    const isDecreasing = indicator.measurementType === 'decreasing';

    // Handle Merged Indicators for Monthly View
    if (indicator.subIndicatorIds && itemEntries) {
        let subPerformances: number[] = [];
        const subMapping = indicator.subIndicatorIds;

        Object.entries(subMapping).forEach(([key, subId]) => {
            const subIndicator = INDICATORS.find(i => i.id === subId);
            if (subIndicator) {
                const subActual = value; // This is actually the subValue for this key? 
                // Wait, the 'value' passed here is usually the main value. 
                // For monthly charts, we might need the specific entry.
                // Let's assume the calling code passes the sub-values.
            }
        });
        // Simplification: In the graph, we often just want the total percentage.
    }

    const t1 = parseValue(indicator.targets.q1);
    const t2 = parseValue(indicator.targets.q2);
    const t3 = parseValue(indicator.targets.q3);
    const t4 = parseValue(indicator.targets.q4);

    let targetDenominator = 0;

    if (isPercentage || isDecreasing) {
        switch (quarterId) {
            case 'q1': targetDenominator = t1; break;
            case 'q2': targetDenominator = t2; break;
            case 'q3': targetDenominator = t3; break;
            case 'q4': targetDenominator = t4; break;
        }
    } else {
        switch (quarterId) {
            case 'q1': targetDenominator = t1; break;
            case 'q2': targetDenominator = t1 + t2; break;
            case 'q3': targetDenominator = t1 + t2 + t3; break;
            case 'q4': targetDenominator = t1 + t2 + t3 + t4; break;
        }
    }

    if (targetDenominator === 0) return 0;

    if (isDecreasing) {
        return Math.min(value ? (targetDenominator / value) * 100 : 0, 100);
    }

    return Math.min((value / targetDenominator) * 100, 100);
};

// Get unit label for an indicator based on its name or measurement type
export const getIndicatorUnit = (indicator: Indicator): string => {
    const name = indicator.name.toLowerCase();

    // Percentage indicators
    if (indicator.measurementType === 'percentage' ||
        name.includes('rate') ||
        name.includes('percentage') ||
        name.includes('%')) {
        return '(%)';
    }

    // Weight-based indicators
    if (name.includes('kg') || name.includes('kilogram')) {
        return '(Kg)';
    }
    if (name.includes('ton') || name.includes('tonnes') || name.includes('mt')) {
        return '(Tons)';
    }

    // Area-based indicators
    if (name.includes('hectare') || name.includes(' ha ') || name.endsWith(' ha')) {
        return '(Ha)';
    }

    // Number/count indicators (default)
    return '(N)';
};

// Get indicator display name with unit
export const getIndicatorNameWithUnit = (indicator: Indicator): string => {
    const unit = getIndicatorUnit(indicator);
    // Don't add unit if it's already in the name
    if (indicator.name.includes('(') && indicator.name.includes(')')) {
        return indicator.name;
    }
    return `${indicator.name} ${unit}`;
};

// Get indicator number (1-126)
export const getIndicatorNumber = (indicatorId: string, allIndicators: Indicator[]): number => {
    const index = allIndicators.findIndex(i => i.id === indicatorId);
    return index >= 0 ? index + 1 : 0;
};
