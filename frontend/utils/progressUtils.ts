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

    // For cumulative indicators, we use the LATEST cumulative value directly (no summing)
    // For percentage indicators, we take the average of the monthly percentages
    // The README confirms: "input of month / fixed target" - each month's input is cumulative

    let totalActual = 0;
    if (isPercentage) {
        // For percentage indicators, average the monthly percentages
        if (quarterEntries.length > 0) {
            totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0) / quarterEntries.length;
        }
    } else if (isCumulative) {
        // For cumulative indicators, use the latest (highest) cumulative value directly
        // This prevents double-counting since user inputs are already cumulative
        if (quarterEntries.length > 0) {
            totalActual = Math.max(...quarterEntries.map(e => e.value));
        }
    } else {
        // For other types, sum the values
        totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0);
    }

    // 2. Determine the Denominator (Target) - UPDATED TO MATCH USER REQUIREMENTS
    let targetDenominator = 0;

    const t1 = parseValue(indicator.targets.q1);
    const t2 = parseValue(indicator.targets.q2);
    const t3 = parseValue(indicator.targets.q3);
    const t4 = parseValue(indicator.targets.q4);

    if (isPercentage || isDecreasing) {
        // For percentage indicators, use current quarter target only (no summing)
        // This matches user requirement: "For the indicator with fixed quarterly targets which are in percentage,
        // we do not make the sum of the fixed targets to get the denominator"
        switch (quarterId) {
            case 'q1': targetDenominator = t1; break;
            case 'q2': targetDenominator = t2; break;
            case 'q3': targetDenominator = t3; break;
            case 'q4': targetDenominator = t4; break;
        }
    } else {
        // Standard Cumulative Logic (Summing Targets) - UPDATED TO MATCH USER REQUIREMENTS
        // User specified exact monthly calculation rules:
        // July, Aug, Sep: use Q1 target
        // Oct, Nov, Dec: use Q1 + Q2 targets
        // Jan, Feb, Mar: use Q1 + Q2 + Q3 targets
        // Apr, May, Jun: use Q1 + Q2 + Q3 + Q4 targets
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

    // 3. Calculate Performance - UPDATED TO MATCH USER REQUIREMENTS
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
                    // For percentage sub-indicators, use current quarter target only
                    switch (quarterId) {
                        case 'q1': subTarget = st1; break;
                        case 'q2': subTarget = st2; break;
                        case 'q3': subTarget = st3; break;
                        case 'q4': subTarget = st4; break;
                    }
                } else {
                    // For numeric sub-indicators, use cumulative targets
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
                        // For decreasing indicators, invert the calculation: target / actual
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
                    performance: Math.min(subPerf, 100) // Ensure no progress exceeds 100%
                });
            }
        });

        if (subIndicatorDetails.length > 0) {
            // Calculate average of sub-indicator performances
            // This matches user requirement: "use the progress of each sub indicator to calculate the average progress"
            const averageSubPerformance = subIndicatorDetails.reduce((sum, sub) => sum + sub.performance, 0) / subIndicatorDetails.length;
            performance = averageSubPerformance;
        } else {
            // Only calculate performance if targetDenominator > 0
            if (targetDenominator > 0) {
                performance = (totalActual / targetDenominator) * 100;
            }
        }
    } else {
        // Only calculate performance if targetDenominator > 0
        if (targetDenominator > 0) {
            performance = (totalActual / targetDenominator) * 100;
            if (isDecreasing) {
                // For decreasing indicators, invert the calculation: target / actual
                performance = totalActual > 0 ? (targetDenominator / totalActual) * 100 : 100;
            }
        }
    }

    // Ensure no progress exceeds 100% - IMPORTANT REQUIREMENT
    performance = Math.min(performance, 100);

    // Determine Trend (Where you are going)
    const nextQuarterId = quarterId === 'q1' ? 'q2' : quarterId === 'q2' ? 'q3' : quarterId === 'q3' ? 'q4' : 'q4';
    const nextTarget = parseValue((indicator.targets as any)[nextQuarterId]);

    return {
        totalActual,
        target: targetDenominator,
        performance: performance, // Already capped at 100
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

    // For cumulative indicators, use the latest cumulative value directly
    // For other types, sum the values
    const isPercentage = indicator.measurementType === 'percentage';
    const isDecreasing = indicator.measurementType === 'decreasing';
    const isCumulative = !isPercentage && !isDecreasing && !indicator.subIndicatorIds;

    let totalActual = 0;
    if (isCumulative && indicatorEntries.length > 0) {
        // For cumulative indicators, use the latest (highest) cumulative value directly
        totalActual = Math.max(...indicatorEntries.map(e => e.value));
    } else {
        // For other types, sum the values
        totalActual = indicatorEntries.reduce((acc, curr) => acc + curr.value, 0);
    }

    const annualTarget = parseValue(indicator.targets.annual);

    if (annualTarget === 0) return 0;

    let performance = (totalActual / annualTarget) * 100;
    if (isDecreasing) {
        performance = totalActual > 0 ? (annualTarget / totalActual) * 100 : 100;
    }

    return Math.min(performance, 100);
};

export const calculateMonthlyProgress = (indicator: Indicator, value: number, month: string, itemEntries?: any[]) => {
    const isPercentage = indicator.measurementType === 'percentage';
    const isDecreasing = indicator.measurementType === 'decreasing';
    const isStandardCumulative = !isPercentage && !isDecreasing && !indicator.subIndicatorIds;

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

    // UPDATED TO MATCH USER'S EXACT MONTHLY REQUIREMENTS:
    // July, Aug, Sep: use Q1 target
    // Oct, Nov, Dec: use Q1 + Q2 targets
    // Jan, Feb, Mar: use Q1 + Q2 + Q3 targets
    // Apr, May, Jun: use Q1 + Q2 + Q3 + Q4 targets

    if (isPercentage || isDecreasing) {
        // For percentage indicators, use current quarter target only
        // This matches user requirement: "For the indicator with fixed quarterly targets which are in percentage,
        // we do not make the sum of the fixed targets to get the denominator"
        const monthToQuarter: Record<string, string> = {
            'Jul': 'q1', 'Aug': 'q1', 'Sep': 'q1',
            'Oct': 'q2', 'Nov': 'q2', 'Dec': 'q2',
            'Jan': 'q3', 'Feb': 'q3', 'Mar': 'q3',
            'Apr': 'q4', 'May': 'q4', 'Jun': 'q4'
        };

        const quarterId = monthToQuarter[month] || 'q1';

        switch (quarterId) {
            case 'q1': targetDenominator = t1; break;
            case 'q2': targetDenominator = t2; break;
            case 'q3': targetDenominator = t3; break;
            case 'q4': targetDenominator = t4; break;
        }
    } else if (isStandardCumulative) {
        // UPDATED: Standard cumulative indicators use exact monthly denominator rules
        const monthToDenominator: Record<string, number> = {
            'Jul': t1,
            'Aug': t1,
            'Sep': t1,
            'Oct': t1 + t2,
            'Nov': t1 + t2,
            'Dec': t1 + t2,
            'Jan': t1 + t2 + t3,
            'Feb': t1 + t2 + t3,
            'Mar': t1 + t2 + t3,
            'Apr': t1 + t2 + t3 + t4,
            'May': t1 + t2 + t3 + t4,
            'Jun': t1 + t2 + t3 + t4
        };

        targetDenominator = monthToDenominator[month] || t1;
    } else {
        // Composite indicators - use current quarter target
        const monthToQuarter: Record<string, string> = {
            'Jul': 'q1', 'Aug': 'q1', 'Sep': 'q1',
            'Oct': 'q2', 'Nov': 'q2', 'Dec': 'q2',
            'Jan': 'q3', 'Feb': 'q3', 'Mar': 'q3',
            'Apr': 'q4', 'May': 'q4', 'Jun': 'q4'
        };

        const quarterId = monthToQuarter[month] || 'q1';

        switch (quarterId) {
            case 'q1': targetDenominator = t1; break;
            case 'q2': targetDenominator = t2; break;
            case 'q3': targetDenominator = t3; break;
            case 'q4': targetDenominator = t4; break;
        }
    }

    if (targetDenominator === 0) return 0;

    if (isDecreasing) {
        // For decreasing indicators, invert the calculation: target / actual
        return Math.min(value ? (targetDenominator / value) * 100 : 0, 100);
    }

    return Math.min((value / targetDenominator) * 100, 100);
};

// Get unit label for an indicator based on its name or measurement type
export const getIndicatorUnit = (indicator: Indicator): string => {
    const name = indicator.name.toLowerCase();

    // Currency indicators
    if (name.includes('frw') || name.includes('rwf') || name.includes('revenue') || name.includes('amount')) {
        return '(Frw)';
    }

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
