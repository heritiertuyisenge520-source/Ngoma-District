
import React, { useState, useMemo } from 'react';
import { PILLARS, QUARTERS } from '../data';
import { MonitoringEntry } from '../types';
import { calculateQuarterProgress, calculateAnnualProgress } from '../utils/progressUtils';

interface AnalyticsViewProps {
  entries: MonitoringEntry[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ entries }) => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>(PILLARS[0].id);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(QUARTERS[0].id);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === selectedPillarId), [selectedPillarId]);
  const availableIndicators = useMemo(() => selectedPillar?.indicators || [], [selectedPillar]);

  // Auto-select first indicator when pillar changes
  useMemo(() => {
    if (availableIndicators.length > 0 && !availableIndicators.find(i => i.id === selectedIndicatorId)) {
      setSelectedIndicatorId(availableIndicators[0].id);
    }
  }, [availableIndicators, selectedIndicatorId]);

  const selectedIndicator = useMemo(() => availableIndicators.find(i => i.id === selectedIndicatorId), [availableIndicators, selectedIndicatorId]);
  const selectedQuarter = useMemo(() => QUARTERS.find(q => q.id === selectedQuarterId), [selectedQuarterId]);

  const getPerformanceColor = (percentage: number) => {
    if (percentage < 50) return 'rose'; // Red
    if (percentage <= 75) return 'amber'; // Yellow
    return 'emerald'; // Green
  };

  const getHexForColor = (color: string) => {
    switch (color) {
      case 'rose': return '#a5092b8f';
      case 'amber': return '#f59e0b';
      case 'emerald': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getMonthlyValue = (monthName: string) => {
    const monthEntries = entries.filter(e => e.indicatorId === selectedIndicatorId && e.month === monthName);
    return monthEntries.reduce((acc, curr) => acc + curr.value, 0);
  };

  // Stats for the selected quarter
  const quarterStats = useMemo(() => {
    if (!selectedIndicator || !selectedQuarter) return null;

    const result = calculateQuarterProgress({
      indicator: selectedIndicator,
      entries: entries.filter(e => e.indicatorId === selectedIndicator.id),
      quarterId: selectedQuarter.id,
      monthsInQuarter: selectedQuarter.months
    });

    // We also need monthly break downs for the graph
    const monthlyValues = selectedQuarter.months.map(m => getMonthlyValue(m));

    // For graph display, we might want "Progress %" per month, not just raw value?
    // The previous code mapped raw values to height.
    // README says: "progress of july... input / target * 100".
    // So the graph is likely nicer if it shows Progress % or just Actuals? 
    // The previous code showed Actuals vs Target/3. 
    // Let's keep showing Actuals for the bars (val), but maybe use the calculated progress for the color/tooltip?

    return {
      totalActual: result.totalActual,
      target: result.target,
      performance: result.performance,
      trend: result.trend,
      nextTarget: result.nextTarget,
      monthlyValues,
      months: selectedQuarter.months,
      subIndicatorDetails: result.subIndicatorDetails // Pass through to UI
    };
  }, [selectedIndicator, selectedQuarter, entries]);

  const annualCompletion = useMemo(() => {
    if (!selectedIndicator) return 0;
    return calculateAnnualProgress(selectedIndicator, entries);
  }, [selectedIndicator, entries]);

  const inputClasses = "w-full h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-bold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none appearance-none cursor-pointer";

  const qColor = quarterStats ? getPerformanceColor(quarterStats.performance) : 'blue';

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in zoom-in-95 duration-700 pb-24">
      {/* Header with Filters */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center">
          <div className={`w-14 h-14 bg-${qColor}-600 rounded-2xl flex items-center justify-center mr-6 shadow-2xl transition-colors duration-1000`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">Performance Engine</h1>
            <p className="mt-2 text-slate-500 font-medium">Real-time sectoral analysis and quarterly variance tracking.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Pillar</label>
            <select value={selectedPillarId} onChange={(e) => setSelectedPillarId(e.target.value)} className={inputClasses}>
              {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 min-w-[220px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Indicator</label>
            <select value={selectedIndicatorId} onChange={(e) => setSelectedIndicatorId(e.target.value)} className={inputClasses}>
              {availableIndicators.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Reporting Period</label>
            <select value={selectedQuarterId} onChange={(e) => setSelectedQuarterId(e.target.value)} className={inputClasses}>
              {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
        </div>
      </header>

      {quarterStats && selectedIndicator && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main 3-Month Interactive Graph */}
          <div className="lg:col-span-8 bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <svg width="100%" height="100%"><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" /></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
            </div>

            <div className="flex justify-between items-start mb-16 relative z-10">
              <div>
                <h3 className={`text-[11px] font-black text-${qColor}-400 uppercase tracking-[0.4em] mb-2 transition-colors duration-1000`}>Monthly Performance Stream</h3>
                <p className="text-white text-2xl font-bold tracking-tight">{selectedQuarter?.name} Breakdown</p>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                <div className={`w-3 h-3 rounded-full bg-${qColor}-500 animate-pulse`}></div>
                <span className="text-[10px] text-white/70 font-black uppercase tracking-widest">Live Audit</span>
              </div>
            </div>

            <div className="relative h-80 md:h-[400px] w-full mt-12">
              {/* Dynamic SVG Trendline */}
              <svg className="absolute inset-0 w-full h-full overflow-visible z-20 pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <marker id="trendArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L0,8 L8,4 Z" fill={getHexForColor(qColor)} />
                  </marker>
                </defs>
                <path
                  d={quarterStats.months.map((_, i) => {
                    const val = quarterStats.monthlyValues[i];
                    const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                    const x = (i / (quarterStats.months.length - 1)) * 100;
                    const y = 100 - (val / maxVal) * 70 - 15;
                    return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke={getHexForColor(qColor)}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd="url(#trendArrow)"
                  className="animate-draw-graph shadow-2xl"
                />
                <style>{`
                  .animate-draw-graph {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                    animation: drawPath 2s ease-out forwards;
                  }
                  @keyframes drawPath { to { stroke-dashoffset: 0; } }
                `}</style>
              </svg>

              {/* Monthly Interactive Pillars */}
              <div className="absolute inset-0 flex items-end justify-between gap-12 px-12">
                {quarterStats.months.map((month, idx) => {
                  const val = quarterStats.monthlyValues[idx];
                  const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                  const h = (val / maxVal) * 70;

                  const expected = quarterStats.target / 3;
                  const mPerf = (val / expected) * 100;
                  const mColor = getPerformanceColor(mPerf);

                  return (
                    <div
                      key={month}
                      className="flex-1 flex flex-col items-center group h-full justify-end relative z-10"
                      onMouseEnter={() => setHoveredMonth(month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      {/* Floating Data Badge */}
                      <div className={`absolute opacity-0 group-hover:opacity-100 transition-all bg-white text-slate-900 px-4 py-2 rounded-2xl text-[11px] font-black shadow-2xl pointer-events-none transform -translate-y-4 group-hover:translate-y-0 z-40 flex flex-col items-center border border-slate-100`} style={{ bottom: `${h + 5}%` }}>
                        <span className="text-slate-400 uppercase text-[8px] mb-0.5">{month}</span>
                        <span>{val.toLocaleString()}</span>
                      </div>

                      {/* Pillar Visual */}
                      <div
                        className={`w-full bg-gradient-to-t from-${mColor}-900/50 to-${mColor}-500/30 group-hover:from-${mColor}-600 group-hover:to-${mColor}-400 rounded-2xl transition-all duration-700 delay-[var(--d)] group-hover:scale-x-110 group-hover:z-30 border-t-2 border-white/10 group-hover:border-white/30 shadow-2xl`}
                        style={{ height: `${Math.max(h, 10)}%`, '--d': `${idx * 150}ms` } as any}
                      >
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
                      </div>

                      <span className={`text-[12px] font-black mt-8 uppercase tracking-[0.3em] transition-all ${hoveredMonth === month ? 'text-white scale-110' : 'text-slate-500'}`}>
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quarter Pulse Card */}
          <div className="lg:col-span-4 bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col relative overflow-hidden group">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Quarter Health Score</h3>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke={getHexForColor(qColor)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="276.5"
                    strokeDashoffset={276.5 - (276.5 * Math.min(quarterStats.performance, 100)) / 100}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black text-${qColor}-600 tracking-tighter`}>{Math.round(quarterStats.performance)}%</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Achievement</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-16 pt-10 border-t border-slate-50">
                <div className="text-center p-5 bg-slate-50 rounded-[2rem]">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Target</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{quarterStats.target.toLocaleString()}</p>
                </div>
                <div className="text-center p-5 bg-slate-50 rounded-[2rem]">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Actual</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">{quarterStats.totalActual.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Annual Performance Mirror */}
          <div className="lg:col-span-12 bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-12">
            <div className="shrink-0 relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" strokeDasharray="289" strokeDashoffset={289 - (289 * annualCompletion) / 100} className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tighter text-slate-900">{Math.round(annualCompletion)}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Yearly Goal</span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] mb-3">Strategic Alignment Context</h4>
                <p className="text-slate-500 font-medium text-xl leading-relaxed">
                  Performance for <span className="font-black text-slate-900">"{selectedIndicator.name}"</span> in <span className="font-black text-slate-900">{selectedQuarter?.name}</span> is currently
                  <span className={`px-5 py-2 ml-3 rounded-full text-white text-[11px] font-black bg-${qColor}-500 shadow-xl inline-flex items-center`}>
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    {quarterStats.trend?.toUpperCase() || (qColor === 'rose' ? 'ACTION REQUIRED' : qColor === 'amber' ? 'STABLE PROGRESS' : 'STANDARDS MET')}
                  </span>.
                </p>
                <div className="mt-6 flex items-start space-x-8">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 min-w-[200px]">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Where you are going</h5>
                    <div className="flex items-end space-x-2">
                      <p className="text-3xl font-black text-slate-900">{quarterStats.nextTarget.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400 font-bold mb-1">Fixed Target</span>
                    </div>
                  </div>
                  <p className="mt-4 text-slate-400 text-sm font-medium flex-1">
                    The cumulative variance for this reporting cycle shows a {quarterStats.totalActual > quarterStats.target ? 'surplus' : 'deviation'} against the fixed benchmark of {quarterStats.target.toLocaleString()} units set for {selectedQuarter?.name}.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl">Download Quarter Audit</button>
                <button className="bg-white border-2 border-slate-200 text-slate-900 px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95">Internal Review</button>
              </div>
            </div>
          </div>

          {/* RAG Legend with Polished Design */}
          <div className="lg:col-span-12 flex items-center justify-center space-x-16 py-10 px-12 bg-slate-50 rounded-[2.5rem] border border-slate-200/50">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 rounded-full bg-rose-500 shadow-lg shadow-rose-200 ring-4 ring-white"></div>
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Critical (&lt;50%)</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 rounded-full bg-amber-500 shadow-lg shadow-amber-200 ring-4 ring-white"></div>
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Improving (50-75%)</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200 ring-4 ring-white"></div>
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Target Met (&gt;75%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Merged Indicator Breakdown Section */}
      {quarterStats && quarterStats.subIndicatorDetails && quarterStats.subIndicatorDetails.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-1.5 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight lowercase first-letter:uppercase">Sub-indicator Performance Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {quarterStats.subIndicatorDetails.map((sub: any, idx: number) => {
              const subColor = getPerformanceColor(sub.performance);
              return (
                <div key={sub.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 group hover:border-blue-200 transition-all duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`w-10 h-10 rounded-xl bg-${subColor}-50 text-${subColor}-600 flex items-center justify-center font-black text-xs`}>
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] font-black text-${subColor}-600 bg-${subColor}-50 px-3 py-1 rounded-full uppercase tracking-widest`}>
                      {Math.round(sub.performance)}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 leading-tight mb-4 min-h-[2.5rem]">{sub.name}</h4>

                  <div className="space-y-4">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${subColor}-500 rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.min(sub.performance, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Achievement</p>
                        <p className="text-sm font-bold text-slate-900">{sub.actual.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fixed Target</p>
                        <p className="text-sm font-bold text-slate-400">{sub.target.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
