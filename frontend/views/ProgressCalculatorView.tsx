
import React, { useState, useMemo } from 'react';
import { PILLARS, QUARTERS, INDICATORS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { calculateQuarterProgress, calculateMonthlyProgress, parseValue, getIndicatorUnit } from '../utils/progressUtils';

interface ProgressCalculatorViewProps {
    entries: MonitoringEntry[];
}

const ProgressCalculatorView: React.FC<ProgressCalculatorViewProps> = ({ entries }) => {
    const [pillarId, setPillarId] = useState('');
    const [indicatorId, setIndicatorId] = useState('');
    const [timelineId, setTimelineId] = useState('q1');
    const [showPercentageOnly, setShowPercentageOnly] = useState(false);

    const selectedPillar = useMemo(() => PILLARS.find(p => p.id === pillarId), [pillarId]);
    const indicators = useMemo(() =>
        selectedPillar?.outputs?.flatMap(output => output.indicators || []) || [],
        [selectedPillar]
    );
    const selectedIndicator = useMemo(() => indicators.find(i => i.id === indicatorId), [indicators, indicatorId]);

    const isAnnual = timelineId === 'annual';
    const activeMonths = useMemo(() => {
        if (isAnnual) return QUARTERS.flatMap(q => q.months);
        return QUARTERS.find(q => q.id === timelineId)?.months || [];
    }, [timelineId, isAnnual]);

    // Filter entries by BOTH indicatorId AND quarterId
    // User data is ALREADY cumulative, so we only show the selected quarter's entries
    const indicatorEntries = useMemo(() =>
        entries.filter(e =>
            e.indicatorId === indicatorId &&
            (isAnnual ? true : e.quarterId === timelineId)  // For annual, show all; otherwise only selected quarter
        ),
        [entries, indicatorId, timelineId, isAnnual]
    );

    // Helper to get sub-indicators
    const getSubIndicators = (indicator: Indicator) => {
        if (!indicator.isDual || !indicator.subIndicatorIds) return [];
        const subIds = Object.values(indicator.subIndicatorIds);
        return INDICATORS.filter(ind => subIds.includes(ind.id));
    };

    const subIndicators = useMemo(() => {
        if (!selectedIndicator) return [];
        return getSubIndicators(selectedIndicator);
    }, [selectedIndicator]);

    const hasSubIndicators = subIndicators.length > 0;

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

    // Calculate sub-indicator progress
    const subIndicatorProgress = useMemo(() => {
        if (!hasSubIndicators || !selectedIndicator?.subIndicatorIds) return [];

        return subIndicators.map(subInd => {
            const subKey = Object.keys(selectedIndicator.subIndicatorIds!).find(
                key => selectedIndicator.subIndicatorIds![key] === subInd.id
            );

            // Get entries for this sub-indicator with legacy key fallback
            // For annual, include all entries; for quarterly, filter by timeline
            const relevantEntries = isAnnual ? 
                entries.filter(e => e.indicatorId === indicatorId) :
                indicatorEntries;
            
            console.log('🔍 DEBUG - Sub-indicator calculation:', {
                subIndicatorName: subInd.name,
                isAnnual,
                totalEntries: entries.length,
                relevantEntriesCount: relevantEntries.length,
                subKey
            });
                
            const subActual = relevantEntries.reduce((acc, curr) => {
                const val = getSubValue(curr.subValues, subKey || '');
                return acc + val;
            }, 0);

            // Calculate target based on timeline
            let subTarget = 0;
            const st1 = parseValue(subInd.targets?.q1);
            const st2 = parseValue(subInd.targets?.q2);
            const st3 = parseValue(subInd.targets?.q3);
            const st4 = parseValue(subInd.targets?.q4);

            if (isAnnual) {
                subTarget = parseValue(subInd.targets?.annual) || (st1 + st2 + st3 + st4);
                console.log('🔍 DEBUG - Annual target calculation:', {
                    subIndicatorName: subInd.name,
                    annualTarget: subInd.targets?.annual,
                    parsedAnnualTarget: parseValue(subInd.targets?.annual),
                    quarterlySum: st1 + st2 + st3 + st4,
                    finalSubTarget: subTarget
                });
            } else {
                switch (timelineId) {
                    case 'q1': subTarget = st1; break;
                    case 'q2': subTarget = st1 + st2; break;
                    case 'q3': subTarget = st1 + st2 + st3; break;
                    case 'q4': subTarget = st1 + st2 + st3 + st4; break;
                }
            }

            const performance = subTarget > 0 ? (subActual / subTarget) * 100 : 0;

            console.log('🔍 DEBUG - Final sub-indicator performance:', {
                subIndicatorName: subInd.name,
                subActual,
                subTarget,
                performance: Math.min(performance, 100)
            });

            return {
                id: subInd.id,
                name: subInd.name,
                actual: subActual,
                target: subTarget,
                performance: Math.min(performance, 100)
            };
        });
    }, [subIndicators, indicatorEntries, entries, indicatorId, timelineId, isAnnual, selectedIndicator, hasSubIndicators]);

    const calcResult = useMemo(() => {
        if (!selectedIndicator) return null;

        if (isAnnual) {
            if (hasSubIndicators && subIndicatorProgress.length > 0) {
                const avgPerf = subIndicatorProgress.reduce((a, b) => a + b.performance, 0) / subIndicatorProgress.length;
                const totalActual = subIndicatorProgress.reduce((a, b) => a + b.actual, 0);
                const totalTarget = subIndicatorProgress.reduce((a, b) => a + b.target, 0);
                
                console.log('🔍 DEBUG - Composite annual calculation:', {
                    indicatorName: selectedIndicator.name,
                    subIndicatorProgress: subIndicatorProgress.map(s => ({
                        name: s.name,
                        performance: s.performance,
                        actual: s.actual,
                        target: s.target
                    })),
                    avgPerf,
                    totalActual,
                    totalTarget
                });
                
                // Ensure we don't return 0 if sub-indicators have valid progress
                const finalPerformance = avgPerf > 0 ? avgPerf : 
                    (totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0);
                    
                console.log('🔍 DEBUG - Final composite result:', {
                    finalPerformance: Math.min(finalPerformance, 100),
                    avgPerf,
                    fallbackPerformance: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
                });
                
                return { totalActual, target: totalTarget, performance: Math.min(finalPerformance, 100) };
            }

            const totalActual = entries.filter(e => e.indicatorId === indicatorId).reduce((acc, curr) => acc + parseValue(curr.value), 0);
            const annualTarget = parseValue(selectedIndicator.targets?.annual);
            const performance = annualTarget > 0 ? (totalActual / annualTarget) * 100 : 0;
            return { totalActual, target: annualTarget, performance: Math.min(performance, 100) };
        }

        return calculateQuarterProgress({
            indicator: selectedIndicator,
            entries: indicatorEntries,
            quarterId: timelineId,
            monthsInQuarter: activeMonths
        });
    }, [selectedIndicator, indicatorEntries, entries, indicatorId, timelineId, activeMonths, isAnnual, hasSubIndicators, subIndicatorProgress]);

    const formulaExplanation = useMemo(() => {
        if (!selectedIndicator) return null;

        // Special explanation for composite/merged indicators
        if (hasSubIndicators) {
            return {
                title: 'Composite Indicator Formula',
                math: 'Average of Sub-Indicator Percentages',
                desc: 'Each sub-indicator is calculated separately, then the parent indicator progress equals the average of all sub-indicator progress percentages.'
            };
        }

        if (isAnnual) {
            return {
                title: 'Annual Performance Formula',
                math: '(Total Year Achievement / Annual Fixed Target) × 100',
                desc: 'Calculated using the total sum of all reported months against the overall annual goal.'
            };
        }
        if (selectedIndicator.measurementType === 'percentage') {
            return {
                title: 'Percentage Indicator Formula',
                math: '(Actual Value % / Fixed Quarter Target %) × 100',
                desc: 'Progress is calculated against the specific target for this quarter.'
            };
        }
        if (selectedIndicator.measurementType === 'decreasing') {
            return {
                title: 'Decreasing Rate Formula',
                math: '(Fixed Target / Actual Value) × 100',
                desc: 'Lower values are better. Progress increases as actual values stay below target.'
            };
        }
        return {
            title: 'Standard Formula (Recalibrated)',
            math: '(Input / Target) × 100',
            desc: 'Uses input directly with target up to the current quarter. July, August, September all use Q1 target; October, November, December use Q1+Q2 targets, etc.'
        };
    }, [selectedIndicator, isAnnual, hasSubIndicators]);
<task_progress>
- [x] Examine progress calculation utilities
- [x] Check formula implementations
- [x] Understand what needs recalibration
- [x] Get clarification on specific recalibration requirements
- [x] Confirm formula logic with user
- [x] Check indicator data structure
- [x] Create implementation plan
- [x] Implement formula recalibration
- [x] Update monthly progress calculation
- [x] Update quarter progress calculation
- [ ] Update ProgressCalculatorView display
</task_progress>

    const inputClasses = "w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer";

    const getPerformanceColor = (perf: number) => {
        if (perf >= 100) return 'emerald';
        if (perf >= 75) return 'blue';
        if (perf >= 50) return 'amber';
        return 'rose';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Progress Calculator</h1>
                    <p className="text-slate-500 font-medium text-sm">Analyze how progress percentages are derived from your data.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selection Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Select Context</h3>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Pillar</label>
                            <select
                                value={pillarId}
                                onChange={(e) => { setPillarId(e.target.value); setIndicatorId(''); }}
                                className={inputClasses}
                            >
                                <option value="">-- Select Pillar --</option>
                                {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Indicator</label>
                            <select
                                value={indicatorId}
                                onChange={(e) => setIndicatorId(e.target.value)}
                                disabled={!pillarId}
                                className={inputClasses}
                            >
                                <option value="">-- Select Indicator --</option>
                                {indicators.map(i => <option key={i.id} value={i.id}>{i.name} {getIndicatorUnit(i)}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Timeline</label>
                            <select
                                value={timelineId}
                                onChange={(e) => setTimelineId(e.target.value)}
                                className={inputClasses}
                            >
                                {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                <option value="annual" className="font-bold text-blue-600">Full Year (Annual)</option>
                            </select>
                        </div>

                        {/* Percentage Only Toggle - Only show for percentage-based indicators */}
                        {selectedIndicator?.measurementType === 'percentage' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Display Format</label>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setShowPercentageOnly(false)}
                                        className={`flex-1 p-2 rounded-lg text-xs font-semibold transition-colors ${!showPercentageOnly ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        Show Full Format
                                    </button>
                                    <button
                                        onClick={() => setShowPercentageOnly(true)}
                                        className={`flex-1 p-2 rounded-lg text-xs font-semibold transition-colors ${showPercentageOnly ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                                    >
                                        Percentage Only
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                        {formulaExplanation && (
                        <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white space-y-3">
                            <h3 className="font-bold text-blue-100 text-xs uppercase tracking-widest">{formulaExplanation.title}</h3>
                            <div className="bg-blue-700/50 p-3 rounded-xl font-mono text-sm border border-blue-400/30">
                                {formulaExplanation.math}
                            </div>
                            <p className="text-xs text-blue-100 leading-relaxed font-medium">
                                {formulaExplanation.desc}
                            </p>
                            <div className="text-xs text-blue-200 mt-2 space-y-1">
                            </div>
                        </div>
                    )}
                </div>

                {/* Calculation Table */}
                <div className="lg:col-span-2">
                    {!selectedIndicator ? (
                        <div className="bg-slate-100 rounded-3xl h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <h3 className="font-bold text-slate-900">No Indicator Selected</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">Please pick a pillar and indicator to view the step-by-step progress calculation.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Main Indicator Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-sm tracking-tight">{selectedIndicator.name}</h3>
                                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded uppercase tracking-tighter">
                                                    Type: {selectedIndicator.measurementType || 'Cumulative'}
                                                </span>
                                                {hasSubIndicators && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded uppercase tracking-tighter">
                                                        Composite ({subIndicators.length} sub-indicators)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Show monthly breakdown only for non-composite indicators */}
                                {!hasSubIndicators && (
                                    <div className="p-6 overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                                    <th className="pb-3 px-2">Timeline</th>
                                                    <th className="pb-3 px-2">Achievement</th>
                                                    <th className="pb-3 px-2">{isAnnual ? 'Annual Target' : 'Quarter Target'}</th>
                                                    <th className="pb-3 px-2">Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm font-semibold text-slate-700">
                                                {activeMonths.map(month => {
                                                    const entry = indicatorEntries.find(e => e.month === month);
                                                    const value = entry?.value || 0;

                                                    let displayTarget = '0';
                                                    let rowProgress = 0;

                                                    if (isAnnual) {
                                                        displayTarget = String(selectedIndicator.targets?.annual || 0);
                                                        const tVal = parseValue(displayTarget);
                                                        rowProgress = tVal > 0 ? (value / tVal) * 100 : 0;
                                                    } else {
                                                        displayTarget = String(
                                                            timelineId === 'q1' ? selectedIndicator.targets?.q1 :
                                                                timelineId === 'q2' ? selectedIndicator.targets?.q2 :
                                                                    timelineId === 'q3' ? selectedIndicator.targets?.q3 :
                                                                        selectedIndicator.targets?.q4
                                                        );
                                                        rowProgress = calculateMonthlyProgress(selectedIndicator, value, timelineId);
                                                    }

                                                    return (
                                                        <tr key={month} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                            <td className="py-4 px-2 text-slate-900">{month}</td>
                                                            <td className="py-2 px-2">
                                                                <span className="font-mono">{value.toLocaleString()}</span>
                                                            </td>
                                                            <td className="py-2 px-2 text-slate-400 font-medium">
                                                                {displayTarget}
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                <span className={`inline-block px-2 py-0.5 rounded-lg ${rowProgress >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {rowProgress.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Summary Footer */}
                                <div className="p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                                    {!showPercentageOnly ? (
                                        <div className="space-y-1 text-center md:text-left">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                                {hasSubIndicators ? 'Combined Total' : isAnnual ? 'Year Total' : 'Quarter Total'}
                                            </p>
                                            <div className="flex items-baseline space-x-2 justify-center md:justify-start">
                                                <span className="text-3xl font-black">{calcResult?.totalActual?.toLocaleString() || 0}</span>
                                                <span className="text-slate-500 font-bold">/ {calcResult?.target?.toLocaleString() || 0}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 text-center md:text-left">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                                {hasSubIndicators ? 'Combined Total' : isAnnual ? 'Year Total' : 'Quarter Total'}
                                            </p>
                                            <div className="text-3xl font-black text-blue-500">
                                                {calcResult?.performance?.toFixed(1) || 0}%
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-6">
                                        <div className="h-16 w-[1px] bg-slate-800 hidden md:block"></div>
                                        <div className="text-center md:text-right">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                                                {hasSubIndicators ? 'Average Progress' : isAnnual ? 'Overall Annual Progress' : 'Final Quarter Progress'}
                                            </p>
                                            <div className="text-4xl font-black text-blue-500">{calcResult?.performance?.toFixed(1) || 0}%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Calculation Breakdown */}
                                <div className="bg-slate-50 p-6 border-t border-slate-100">
                                    <h3 className="font-bold text-slate-800 text-sm mb-3">🔢 Calculation Breakdown</h3>
                                    <div className="space-y-2 text-xs">
                                        {hasSubIndicators ? (
                                            <>
                                                <p><span className="font-bold">Step 1:</span> Calculate each sub-indicator progress separately</p>
                                                <p><span className="font-bold">Step 2:</span> Average all sub-indicator percentages</p>
                                                <p><span className="font-bold">Step 3:</span> Parent progress = ({subIndicatorProgress.map(s => s.performance.toFixed(1)).join(' + ')}) / {subIndicatorProgress.length} = {calcResult?.performance?.toFixed(1)}%</p>
                                            </>
                                        ) : isAnnual ? (
                                            <>
                                                <p><span className="font-bold">Formula:</span> (Total Achievement / Annual Target) × 100</p>
                                                <p><span className="font-bold">Calculation:</span> ({calcResult?.totalActual?.toLocaleString() || 0} / {calcResult?.target?.toLocaleString() || 0}) × 100 = {calcResult?.performance?.toFixed(1)}%</p>
                                            </>
                                        ) : selectedIndicator?.measurementType === 'decreasing' ? (
                                            <>
                                                <p><span className="font-bold">Formula:</span> (Target / Achievement) × 100</p>
                                                <p><span className="font-bold">Calculation:</span> ({calcResult?.target?.toLocaleString() || 0} / {calcResult?.totalActual?.toLocaleString() || 0}) × 100 = {calcResult?.performance?.toFixed(1)}%</p>
                                                <p><span className="text-blue-600 font-medium">ⓘ Lower achievement = higher progress for decreasing indicators</span></p>
                                            </>
                                        ) : (
                                            <>
                                                <p><span className="font-bold">Formula:</span> (Achievement / Target) × 100</p>
                                                <p><span className="font-bold">Calculation:</span> ({calcResult?.totalActual?.toLocaleString() || 0} / {calcResult?.target?.toLocaleString() || 0}) × 100 = {calcResult?.performance?.toFixed(1)}%</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sub-Indicators Breakdown - Only show for composite indicators */}
                            {hasSubIndicators && (
                                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="font-bold text-slate-800 text-sm">Sub-Indicator Breakdown</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Parent progress = Average of {subIndicators.length} sub-indicator percentages
                                        </p>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {subIndicatorProgress.map((sub, idx) => {
                                            const color = getPerformanceColor(sub.performance);
                                            return (
                                                <div key={sub.id} className="border border-slate-200 rounded-2xl p-5 hover:border-blue-200 transition-colors">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <span className="text-xs font-bold text-slate-400 uppercase">Sub #{idx + 1}</span>
                                                            <h4 className="text-sm font-semibold text-slate-800 mt-1">{sub.name}</h4>
                                                        </div>
                                                        <span className={`text-lg font-black text-${color}-600`}>
                                                            {sub.performance.toFixed(1)}%
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                                                        <div
                                                            className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
                                                            style={{ width: `${Math.min(sub.performance, 100)}%` }}
                                                        ></div>
                                                    </div>

                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-500">
                                                            Achievement: <span className="font-bold text-slate-700">{sub.actual.toLocaleString()}</span>
                                                        </span>
                                                        <span className="text-slate-500">
                                                            Target: <span className="font-bold text-slate-700">{sub.target.toLocaleString()}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Average Calculation Explanation */}
                                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 uppercase">Calculation</p>
                                                <p className="text-sm text-slate-600 mt-1">
                                                    ({subIndicatorProgress.map(s => s.performance.toFixed(1) + '%').join(' + ')}) ÷ {subIndicatorProgress.length}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-500 uppercase">Parent Progress</p>
                                                <p className="text-2xl font-black text-blue-600">{calcResult?.performance?.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProgressCalculatorView;
