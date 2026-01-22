// Utility to clean strings (e.g. "80%" -> 80, "1,000" -> 1000)
export const parseValue = (val: string | number | undefined): number => {
    if (val === undefined || val === null || val === '-') return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
};

interface Indicator {
    id: string;
    name: string;
    targets: {
        q1: string | number;
        q2: string | number;
        q3: string | number;
        q4: string | number;
        annual: string | number;
    };
    isDual?: boolean;
    measurementType?: 'cumulative' | 'percentage' | 'decreasing';
    subIndicatorIds?: Record<string, string>;
    baseline?: number;
}

interface CalculationContext {
    indicator: Indicator;
    entries: any[];
    quarterId: string;
    monthsInQuarter: string[];
}

export const calculateQuarterProgress = ({ indicator, entries, quarterId, monthsInQuarter }: CalculationContext) => {
    const isPercentage = indicator.measurementType === 'percentage';
    const isDecreasing = indicator.measurementType === 'decreasing';
    const isCumulative = !isPercentage && !isDecreasing;

    const quarterEntries = entries.filter(e => e.quarterId === quarterId);

    let totalActual = 0;
    if (isPercentage) {
        if (quarterEntries.length > 0) {
            totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0) / quarterEntries.length;
        }
    } else if (isCumulative) {
        if (quarterEntries.length > 0) {
            totalActual = Math.max(...quarterEntries.map(e => e.value));
        }
    } else {
        totalActual = quarterEntries.reduce((acc, curr) => acc + curr.value, 0);
    }

    let targetDenominator = 0;
    const t1 = parseValue(indicator.targets.q1);
    const t2 = parseValue(indicator.targets.q2);
    const t3 = parseValue(indicator.targets.q3);
    const t4 = parseValue(indicator.targets.q4);

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

    if (targetDenominator === 0) targetDenominator = 1;

    let performance = (totalActual / targetDenominator) * 100;
    if (isDecreasing) {
        performance = totalActual > 0 ? (targetDenominator / totalActual) * 100 : 100;
    }

    performance = Math.min(performance, 100);

    return {
        totalActual,
        target: targetDenominator,
        performance: performance,
        trend: performance >= 90 ? 'on-track' : performance >= 50 ? 'improving' : 'needs-attention'
    };
};
