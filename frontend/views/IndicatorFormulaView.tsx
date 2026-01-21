import React, { useState, useMemo } from 'react';
import { PILLARS, INDICATORS, Indicator } from '../data';

interface IndicatorFormulaViewProps {
    entries?: any[];
}

const IndicatorFormulaView: React.FC<IndicatorFormulaViewProps> = ({ entries }) => {
    const [pillarId, setPillarId] = useState('');
    const [indicatorId, setIndicatorId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [achievementValue, setAchievementValue] = useState(0);
    const [formulaType, setFormulaType] = useState('monthly');
    const [measurementType, setMeasurementType] = useState<'cumulative' | 'percentage' | 'decreasing'>('cumulative');
    const [monthlyInputs, setMonthlyInputs] = useState({ achievement: 0, target: 0 });
    const [quarterlyInputs, setQuarterlyInputs] = useState({
        selectedQuarter: 'q1',
        q1Achievement: 0,
        q1Target: 0,
        q2Achievement: 0,
        q2Target: 0,
        q3Achievement: 0,
        q3Target: 0,
        q4Achievement: 0,
        q4Target: 0
    });
    const [annualInputs, setAnnualInputs] = useState({ totalAchievement: 0, annualTarget: 0 });

    // Debug: Log when indicator changes
    React.useEffect(() => {
        console.log('=== INDICATOR SELECTION DEBUG ===');
        console.log('Pillar ID:', pillarId);
        console.log('Indicator ID:', indicatorId);
        console.log('Selected Month:', selectedMonth);
        console.log('================================');
    }, [pillarId, indicatorId, selectedMonth]);

    const selectedPillar = useMemo(() => PILLARS.find(p => p.id === pillarId), [pillarId]);
    const indicators = useMemo(() => {
        const inds = selectedPillar?.outputs?.flatMap(output => output.indicators || []) || [];
        console.log('Selected pillar:', selectedPillar);
        console.log('Indicators from pillar:', inds);
        return inds;
    }, [selectedPillar]);
    const selectedIndicator = useMemo(() => {
        const indicator = indicators.find(i => i.id === indicatorId);
        console.log('Looking for indicator with ID:', indicatorId);
        console.log('Available indicators:', indicators);
        console.log('Found indicator:', indicator);
        if (indicator) {
            console.log('Indicator has subIndicatorIds:', !!indicator.subIndicatorIds);
            console.log('Indicator targets:', indicator.targets);
        }
        return indicator;
    }, [indicators, indicatorId]);

    // Get sub-indicators for selected indicator
    const subIndicators = useMemo(() => {
        if (!selectedIndicator?.subIndicatorIds) {
            console.log('No subIndicatorIds found');
            return [];
        }
        
        console.log('Found subIndicatorIds:', selectedIndicator.subIndicatorIds);
        console.log('Total INDICATORS available:', INDICATORS.length);
        console.log('First few INDICATORS:', INDICATORS.slice(0, 5));
        
        const subs = Object.entries(selectedIndicator.subIndicatorIds).map(([key, subId]) => {
            console.log(`Looking for sub-indicator ${subId}...`);
            console.log('INDICATORS includes this ID?', INDICATORS.some(i => i.id === subId));
            const subIndicator = INDICATORS.find(i => i.id === subId);
            console.log(`Found sub-indicator ${subId}:`, subIndicator);
            return {
                key,
                indicator: subIndicator
            };
        }).filter(item => item.indicator);
        
        console.log('Final sub-indicators:', subs);
        return subs;
    }, [selectedIndicator]);

    // Get specific month for quarterly progress
    const getQuarterlyMonth = (quarter: string) => {
        const quarterToMonth: Record<string, string> = {
            'q1': 'September',    // Latest month of Q1
            'q2': 'December',   // Latest month of Q2  
            'q3': 'March',       // Latest month of Q3
            'q4': 'June'         // Latest month of Q4 (also used for annual)
        };
        return quarterToMonth[quarter] || 'June';
    };

    // Get available months based on quarter
    const getAvailableMonths = () => {
        const monthToQuarter: Record<string, string> = {
            'July': 'q1', 'August': 'q1', 'September': 'q1',
            'October': 'q2', 'November': 'q2', 'December': 'q2',
            'January': 'q3', 'February': 'q3', 'March': 'q3',
            'April': 'q4', 'May': 'q4', 'June': 'q4'
        };
        
        if (!selectedIndicator) {
            console.log('No selected indicator');
            return [];
        }
        
        console.log('getAvailableMonths called for indicator:', selectedIndicator.name);
        console.log('Indicator targets:', selectedIndicator.targets);
        
        const months = [];
        
        // Check if targets exist and are valid
        const targets = selectedIndicator.targets;
        console.log('Targets object:', targets);
        
        if (targets && targets.q1 && targets.q1 !== '0' && targets.q1 !== '') {
            console.log('Adding Q1 months because q1 target is:', targets.q1);
            months.push('July', 'August', 'September');
        }
        if (targets && targets.q2 && targets.q2 !== '0' && targets.q2 !== '') {
            console.log('Adding Q2 months because q2 target is:', targets.q2);
            months.push('October', 'November', 'December');
        }
        if (targets && targets.q3 && targets.q3 !== '0' && targets.q3 !== '') {
            console.log('Adding Q3 months because q3 target is:', targets.q3);
            months.push('January', 'February', 'March');
        }
        if (targets && targets.q4 && targets.q4 !== '0' && targets.q4 !== '') {
            console.log('Adding Q4 months because q4 target is:', targets.q4);
            months.push('April', 'May', 'June');
        }
        
        console.log('Final available months:', months);
        return months;
    };

    // Calculate progress based on selected month
    const progressResult = useMemo(() => {
        if (!selectedIndicator || !selectedMonth) return null;

        const monthToQuarter: Record<string, string> = {
            'July': 'q1', 'August': 'q1', 'September': 'q1',
            'October': 'q2', 'November': 'q2', 'December': 'q2',
            'January': 'q3', 'February': 'q3', 'March': 'q3',
            'April': 'q4', 'May': 'q4', 'June': 'q4'
        };

        const quarter = monthToQuarter[selectedMonth];
        const target = selectedIndicator.targets[quarter as keyof typeof selectedIndicator.targets];
        
        if (target === 0 || target === '') return null;

        const numericTarget = typeof target === 'string' ? parseFloat(target) : target;
        if (numericTarget === 0) return null;

        let progress = 0;
        if (selectedIndicator.measurementType === 'decreasing') {
            progress = numericTarget > 0 ? (numericTarget / achievementValue) * 100 : 0;
        } else {
            progress = numericTarget > 0 ? (achievementValue / numericTarget) * 100 : 0;
        }

        return {
            month: selectedMonth,
            quarter: quarter,
            achievement: achievementValue,
            target: numericTarget,
            progress: Math.min(progress, 999),
            measurementType: selectedIndicator.measurementType || 'cumulative'
        };
    }, [selectedIndicator, selectedMonth, achievementValue]);

    const inputClasses = "w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none";
    const selectClasses = "w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none cursor-pointer";

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'emerald';
        if (progress >= 75) return 'blue';
        if (progress >= 50) return 'amber';
        return 'rose';
    };

    const getFormulaText = () => {
        if (!selectedIndicator) {
            console.log('No selected indicator');
            return '';
        }
        
        console.log('Selected indicator:', selectedIndicator);
        console.log('Measurement type:', selectedIndicator.measurementType);
        
        const baseFormula = selectedIndicator.measurementType === 'decreasing' 
            ? '(Target / Achievement) × 100' 
            : '(Achievement / Target) × 100';
        
        console.log('Base formula:', baseFormula);
        return baseFormula;
    };

    // Calculate monthly progress
    const monthlyProgress = useMemo(() => {
        const { achievement, target } = monthlyInputs;
        
        if (target === 0) return 0;
        
        switch (measurementType) {
            case 'percentage':
                return (achievement / target) * 100;
            case 'decreasing':
                return target > 0 ? (target / achievement) * 100 : 0;
            default:
                return (achievement / target) * 100;
        }
    }, [monthlyInputs, measurementType]);

    // Calculate quarterly progress based on latest month of each quarter
    const quarterlyProgress = useMemo(() => {
        if (!selectedIndicator) return [];

        const quarters = ['q1', 'q2', 'q3', 'q4'];
        return quarters.map(quarter => {
            const targetMonth = getQuarterlyMonth(quarter);
            const target = selectedIndicator.targets?.[quarter as keyof typeof selectedIndicator.targets];
            
            const numericTarget = target && target !== 0 && target !== '' 
                ? (typeof target === 'string' ? parseFloat(target.replace('%', '')) || 0 : target)
                : 0;
            
            // For now, use achievementValue as achievement (this should come from actual data entries)
            const achievement = achievementValue || 0;
            
            let progress = 0;
            if (numericTarget > 0 && selectedIndicator.measurementType === 'decreasing') {
                progress = (numericTarget / achievement) * 100;
            } else if (numericTarget > 0) {
                progress = (achievement / numericTarget) * 100;
            }

            return {
                quarter: quarter.toUpperCase(),
                month: targetMonth,
                target: numericTarget,
                achievement: achievement,
                progress: Math.min(progress, 999)
            };
        });
    }, [selectedIndicator, achievementValue]);

    // Calculate annual progress based on June (Q4) data
    const annualProgress = useMemo(() => {
        if (!selectedIndicator) return null;
        
        const q4Target = selectedIndicator.targets?.q4;
        const annualTarget = selectedIndicator.targets?.annual;
        
        if (!q4Target || q4Target === 0 || q4Target === '' || !annualTarget || annualTarget === 0 || annualTarget === '') {
            return null;
        }

        const numericQ4Target = typeof q4Target === 'string' ? parseFloat(q4Target.replace('%', '')) || 0 : q4Target;
        const numericAnnualTarget = typeof annualTarget === 'string' ? parseFloat(annualTarget.replace('%', '')) || 0 : annualTarget;
        
        // Use achievementValue as achievement for June
        const achievement = achievementValue || 0;
        
        let progress = 0;
        if (selectedIndicator.measurementType === 'decreasing') {
            progress = numericAnnualTarget > 0 ? (numericAnnualTarget / achievement) * 100 : 0;
        } else {
            progress = numericAnnualTarget > 0 ? (achievement / numericAnnualTarget) * 100 : 0;
        }

        return {
            month: 'June',
            quarter: 'Q4',
            achievement: achievement,
            annualTarget: numericAnnualTarget,
            q4Target: numericQ4Target,
            progress: Math.min(progress, 999)
        };
    }, [selectedIndicator, achievementValue]);

    const getFormulaExplanation = () => {
        const baseFormula = measurementType === 'decreasing' 
            ? '(Target / Achievement) × 100' 
            : '(Achievement / Target) × 100';

        switch (formulaType) {
            case 'monthly':
                return {
                    title: 'Monthly Progress Formula',
                    formula: baseFormula,
                    description: 'Calculates progress for a single month against the monthly target.',
                    example: measurementType === 'decreasing' 
                        ? `(${monthlyInputs.target} / ${monthlyInputs.achievement}) × 100 = ${monthlyProgress.toFixed(1)}%`
                        : `(${monthlyInputs.achievement} / ${monthlyInputs.target}) × 100 = ${monthlyProgress.toFixed(1)}%`
                };
            case 'quarterly':
                const { selectedQuarter } = quarterlyInputs;
                let achievementSum = 0;
                let targetSum = 0;
                
                switch (selectedQuarter) {
                    case 'q1':
                        achievementSum = quarterlyInputs.q1Achievement;
                        targetSum = quarterlyInputs.q1Target;
                        break;
                    case 'q2':
                        achievementSum = quarterlyInputs.q1Achievement + quarterlyInputs.q2Achievement;
                        targetSum = quarterlyInputs.q1Target + quarterlyInputs.q2Target;
                        break;
                    case 'q3':
                        achievementSum = quarterlyInputs.q1Achievement + quarterlyInputs.q2Achievement + quarterlyInputs.q3Achievement;
                        targetSum = quarterlyInputs.q1Target + quarterlyInputs.q2Target + quarterlyInputs.q3Target;
                        break;
                    case 'q4':
                        achievementSum = quarterlyInputs.q1Achievement + quarterlyInputs.q2Achievement + quarterlyInputs.q3Achievement + quarterlyInputs.q4Achievement;
                        targetSum = quarterlyInputs.q1Target + quarterlyInputs.q2Target + quarterlyInputs.q3Target + quarterlyInputs.q4Target;
                        break;
                }

                return {
                    title: 'Quarterly Progress Formula',
                    formula: `(Cumulative Achievement / Cumulative Target) × 100`,
                    description: 'Sums up achievements and targets for all months up to the selected quarter.',
                    example: measurementType === 'decreasing'
                        ? `(${targetSum} / ${achievementSum}) × 100 = ${quarterlyProgress.toFixed(1)}%`
                        : `(${achievementSum} / ${targetSum}) × 100 = ${quarterlyProgress.toFixed(1)}%`
                };
            case 'annual':
                return {
                    title: 'Annual Progress Formula',
                    formula: baseFormula,
                    description: 'Calculates yearly progress using total achievement against the annual target.',
                    example: measurementType === 'decreasing'
                        ? `(${annualInputs.annualTarget} / ${annualInputs.totalAchievement}) × 100 = ${annualProgress.toFixed(1)}%`
                        : `(${annualInputs.totalAchievement} / ${annualInputs.annualTarget}) × 100 = ${annualProgress.toFixed(1)}%`
                };
            default:
                return {
                    title: 'Progress Formula',
                    formula: baseFormula,
                    description: 'Calculates progress based on achievement against target.',
                    example: measurementType === 'decreasing'
                        ? '(Target / Achievement) × 100 = Progress%'
                        : '(Achievement / Target) × 100 = Progress%'
                };
        }
    };

    const formulaExplanation = getFormulaExplanation();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Indicator Formula Calculator</h1>
                    <p className="text-slate-500 font-medium text-sm">Select an indicator and input values to see progress calculations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selection Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">1. Select Indicator</h3>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Pillar</label>
                            <select
                                value={pillarId}
                                onChange={e => { setPillarId(e.target.value); setIndicatorId(''); }}
                                className={selectClasses}
                            >
                                <option value="">-- Select Pillar --</option>
                                {PILLARS.map(pillar => (
                                    <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Indicator</label>
                            <select
                                value={indicatorId}
                                onChange={e => setIndicatorId(e.target.value)}
                                disabled={!pillarId}
                                className={selectClasses}
                            >
                                <option value="">-- Select Indicator --</option>
                                {indicators.map(indicator => (
                                    <option key={indicator.id} value={indicator.id}>{indicator.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Indicator Targets Display */}
                    {selectedIndicator && (
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white space-y-3">
                            <h3 className="font-bold text-blue-100 text-xs uppercase tracking-widest">Fixed Targets</h3>
                            
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span>Q1 Target:</span>
                                    <span className="font-mono font-bold">
                                        {selectedIndicator.targets.q1 ? selectedIndicator.targets.q1 : 'Not Set'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Q2 Target:</span>
                                    <span className="font-mono font-bold">
                                        {selectedIndicator.targets.q2 ? selectedIndicator.targets.q2 : 'Not Set'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Q3 Target:</span>
                                    <span className="font-mono font-bold">
                                        {selectedIndicator.targets.q3 ? selectedIndicator.targets.q3 : 'Not Set'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Q4 Target:</span>
                                    <span className="font-mono font-bold">
                                        {selectedIndicator.targets.q4 ? selectedIndicator.targets.q4 : 'Not Set'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-blue-400/30">
                                    <span>Annual Target:</span>
                                    <span className="font-mono font-bold text-lg">
                                        {selectedIndicator.targets.annual ? selectedIndicator.targets.annual : 'Not Set'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-800/30 p-3 rounded-xl border border-blue-400/20 mt-3">
                                <p className="text-xs font-mono text-blue-100">
                                    {getFormulaText()}
                                </p>
                                <p className="text-xs text-blue-200 mt-1">
                                    Type: {selectedIndicator.measurementType || 'cumulative'}
                                </p>
                            </div>

                            {/* Sub-indicators Section */}
                            {subIndicators.length > 0 && (
                                <div className="mt-4 space-y-3">
                                    <h4 className="font-bold text-blue-100 text-xs uppercase tracking-wider">Sub-indicators</h4>
                                    {subIndicators.map(({ key, indicator: subIndicator }) => (
                                        <div key={subIndicator.id} className="bg-blue-700/40 p-3 rounded-xl border border-blue-400/20">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-medium text-blue-100">{subIndicator.name}</span>
                                                <span className="text-xs font-mono text-blue-200 capitalize">{key}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-blue-300">Q1:</span>
                                                    <span className="font-mono text-blue-100 ml-1">
                                                        {subIndicator.targets.q1 ? subIndicator.targets.q1 : 'Not Set'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-blue-300">Q2:</span>
                                                    <span className="font-mono text-blue-100 ml-1">
                                                        {subIndicator.targets.q2 ? subIndicator.targets.q2 : 'Not Set'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-blue-300">Q3:</span>
                                                    <span className="font-mono text-blue-100 ml-1">
                                                        {subIndicator.targets.q3 ? subIndicator.targets.q3 : 'Not Set'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-blue-300">Q4:</span>
                                                    <span className="font-mono text-blue-100 ml-1">
                                                        {subIndicator.targets.q4 ? subIndicator.targets.q4 : 'Not Set'}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 pt-1 border-t border-blue-400/30">
                                                    <span className="text-blue-300">Annual:</span>
                                                    <span className="font-mono text-blue-100 ml-1">
                                                        {subIndicator.targets.annual ? subIndicator.targets.annual : 'Not Set'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Sub-indicator Achievement Input */}
                                            <div className="mt-3 pt-3 border-t border-blue-400/30">
                                                <label className="text-[10px] font-bold text-blue-200 uppercase tracking-widest pl-1">
                                                    {key} Achievement Value
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full p-2 rounded-lg border border-blue-400/30 bg-blue-800/50 text-blue-100 text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all outline-none appearance-none"
                                                    placeholder={`Enter ${key} achievement`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Input and Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedIndicator ? (
                        <>
                            {/* Monthly Progress Calculator */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 text-sm">2. Monthly Progress Calculator</h3>
                                    <p className="text-xs text-slate-500 mt-1">Select month and enter achievement to calculate progress</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                                Select Month
                                            </label>
                                            <select
                                                value={selectedMonth}
                                                onChange={e => setSelectedMonth(e.target.value)}
                                                className={selectClasses}
                                            >
                                                <option value="">-- Select Month --</option>
                                                {getAvailableMonths().map(month => (
                                                    <option key={month} value={month}>{month}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                                                Achievement Value
                                            </label>
                                            <input
                                                type="number"
                                                value={achievementValue}
                                                onChange={e => setAchievementValue(Number(e.target.value) || 0)}
                                                className={inputClasses}
                                                placeholder="Enter achievement value"
                                            />
                                        </div>
                                    </div>

                                    {/* Monthly Progress Result */}
                                    {progressResult && (
                                        <div className="bg-slate-900 text-white p-6 rounded-2xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
                                                        {progressResult.month} Progress
                                                    </p>
                                                    <div className="text-4xl font-black text-blue-500">
                                                        {progressResult.progress.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-slate-400 mb-1">Achievement / Target</div>
                                                    <div className="text-lg font-mono">
                                                        {progressResult.achievement.toLocaleString()} / {progressResult.target.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="mt-4 w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500`}
                                                    style={{ width: `${Math.min(progressResult.progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quarterly Progress Summary */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 text-sm">3. Quarterly Progress Summary</h3>
                                    <p className="text-xs text-slate-500 mt-1">Progress based on latest month of each quarter (Sep, Dec, Mar, Jun)</p>
                                </div>

                                <div className="p-6">
                                    {quarterlyProgress && quarterlyProgress.length > 0 ? (
                                        <div className="space-y-4">
                                            {quarterlyProgress.map((quarter, index) => (
                                                <div key={quarter.quarter} className="border border-slate-200 rounded-2xl p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800">{quarter.quarter}</h4>
                                                            <p className="text-xs text-slate-500">{quarter.month}</p>
                                                        </div>
                                                        <div className={`text-lg font-black text-${getProgressColor(quarter.progress)}-600`}>
                                                            {quarter.progress.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-slate-500">Target:</span>
                                                            <span className="font-mono font-bold">{quarter.target.toLocaleString()}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500">Achievement:</span>
                                                            <span className="font-mono font-bold">{quarter.achievement.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-${getProgressColor(quarter.progress)}-500 rounded-full transition-all duration-500`}
                                                            style={{ width: `${Math.min(quarter.progress, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>No quarterly data available for this indicator</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Annual Progress Summary */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 text-sm">4. Annual Progress Summary</h3>
                                    <p className="text-xs text-slate-500 mt-1">Year-to-date performance</p>
                                </div>

                                <div className="p-6">
                                    {annualProgress ? (
                                        <div className="bg-slate-900 text-white p-6 rounded-2xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">
                                                        Annual Progress
                                                    </p>
                                                    <div className="text-4xl font-black text-blue-500">
                                                        {annualProgress.progress.toFixed(1)}%
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-slate-400 mb-1">Year Achievement / Target</div>
                                                    <div className="text-lg font-mono">
                                                        {annualProgress.achievement.toLocaleString()} / {annualProgress.annualTarget.toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="mt-4 w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500`}
                                                    style={{ width: `${Math.min(annualProgress.progress, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>No annual data available for this indicator</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
                            <div className="bg-slate-100 rounded-2xl p-8">
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 0 2-2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9a2 2 0 00-1.414 1.414L11.586 9H9z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Select an Indicator</h3>
                                <p className="text-slate-600">Choose a pillar and indicator to view progress calculations</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IndicatorFormulaView;
