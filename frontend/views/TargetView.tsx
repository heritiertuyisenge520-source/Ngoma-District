
import React, { useState, useMemo } from 'react';
import { PILLARS, INDICATORS, Indicator } from '../data';
import { getIndicatorUnit } from '../utils/progressUtils';

// Global indicator numbering (1-126)
const indicatorNumbering = new Map<string, number>();
let indicatorCounter = 1;
PILLARS.forEach(pillar => {
  pillar.outputs.forEach(output => {
    output.indicators.forEach(indicator => {
      indicatorNumbering.set(indicator.id, indicatorCounter++);
    });
  });
});

const TargetView: React.FC = () => {
  const [pillarId, setPillarId] = useState('');
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);

  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === pillarId), [pillarId]);

  const allIndicators = useMemo(() => {
    if (!selectedPillar) return [];
    return selectedPillar.outputs?.flatMap(output => output.indicators || []) || [];
  }, [selectedPillar]);

  const getSubIndicators = (indicator: Indicator) => {
    if (!indicator.isDual || !indicator.subIndicatorIds) return [];
    const subIds = Object.values(indicator.subIndicatorIds);
    return INDICATORS.filter(ind => subIds.includes(ind.id));
  };

  const toggleExpand = (id: string) => {
    setExpandedIndicator(expandedIndicator === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-500">
      {/* Header Section */}
      <header className="flex items-center gap-4 pb-5 border-b border-slate-100">
        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Indicators Target</h1>
          <p className="text-sm text-slate-500 font-medium">View quarterly goals and annual targets</p>
        </div>
      </header>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Select Pillar</label>
        <div className="relative max-w-md">
          <select
            value={pillarId}
            onChange={(e) => setPillarId(e.target.value)}
            className="w-full h-12 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:border-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="">-- Select a Pillar --</option>
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Display Section */}
      {pillarId && allIndicators.length > 0 ? (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Pillar Header */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">Selected Pillar</p>
                <h2 className="text-xl font-bold">{selectedPillar?.name}</h2>
              </div>
              <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <span className="text-2xl font-black">{allIndicators.length}</span>
                <span className="text-violet-200 text-xs ml-1">Indicators</span>
              </div>
            </div>
          </div>

          {/* Indicators List */}
          <div className="space-y-4">
            {allIndicators.map((indicator, index) => {
              const subIndicators = getSubIndicators(indicator);
              const hasSubIndicators = subIndicators.length > 0;
              const isExpanded = expandedIndicator === indicator.id;

              return (
                <div
                  key={indicator.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Indicator Header */}
                  <div
                    className={`p-5 cursor-pointer transition-colors ${hasSubIndicators ? 'hover:bg-slate-50' : ''}`}
                    onClick={() => hasSubIndicators && toggleExpand(indicator.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center text-violet-600 font-bold text-sm shrink-0">
                          {indicatorNumbering.get(indicator.id) || index + 1}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 leading-relaxed">{indicator.name} <span className="text-blue-600">{getIndicatorUnit(indicator)}</span></h3>
                          {hasSubIndicators && (
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              {subIndicators.length} sub-indicators
                            </p>
                          )}
                        </div>
                      </div>

                      {hasSubIndicators && (
                        <button className={`p-2 rounded-lg transition-all duration-300 ${isExpanded ? 'bg-violet-100 text-violet-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Targets for indicators WITHOUT sub-indicators */}
                    {!hasSubIndicators && (
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {[
                          { label: 'Q1', val: indicator.targets?.q1, color: 'slate' },
                          { label: 'Q2', val: indicator.targets?.q2, color: 'slate' },
                          { label: 'Q3', val: indicator.targets?.q3, color: 'slate' },
                          { label: 'Q4', val: indicator.targets?.q4, color: 'slate' },
                          { label: 'Annual', val: indicator.targets?.annual, color: 'violet' },
                        ].map((item, i) => (
                          <div
                            key={item.label}
                            className={`p-3 rounded-xl text-center transition-all duration-300 hover:scale-105 ${item.color === 'violet'
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                              : 'bg-slate-50 hover:bg-slate-100'
                              }`}
                            style={{ animationDelay: `${i * 50}ms` }}
                          >
                            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${item.color === 'violet' ? 'text-violet-200' : 'text-slate-400'}`}>
                              {item.label}
                            </p>
                            <p className={`text-lg font-black ${item.color === 'violet' ? 'text-white' : 'text-slate-700'}`}>
                              {typeof item.val === 'number' ? item.val.toLocaleString() : item.val || '0'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sub-Indicators Section */}
                  {hasSubIndicators && (
                    <div className={`overflow-hidden transition-all duration-500 ease-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4 bg-slate-50/50">
                        {subIndicators.map((subInd, subIdx) => (
                          <div
                            key={subInd.id}
                            className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow transition-all duration-300"
                            style={{ animationDelay: `${subIdx * 100}ms` }}
                          >
                            <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                              <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-xs font-bold">
                                {subIdx + 1}
                              </span>
                              {subInd.name}
                            </h5>

                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { label: 'Q1', val: subInd.targets?.q1 },
                                { label: 'Q2', val: subInd.targets?.q2 },
                                { label: 'Q3', val: subInd.targets?.q3 },
                                { label: 'Q4', val: subInd.targets?.q4 },
                                { label: 'Annual', val: subInd.targets?.annual, isAnnual: true },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className={`p-2.5 rounded-lg text-center transition-all duration-200 hover:scale-105 ${item.isAnnual
                                    ? 'bg-violet-50 border border-violet-200'
                                    : 'bg-slate-50'
                                    }`}
                                >
                                  <p className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${item.isAnnual ? 'text-violet-500' : 'text-slate-400'}`}>
                                    {item.label}
                                  </p>
                                  <p className={`text-base font-bold ${item.isAnnual ? 'text-violet-600' : 'text-slate-700'}`}>
                                    {typeof item.val === 'number' ? item.val.toLocaleString() : item.val || '0'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center animate-in fade-in duration-500">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Select a Pillar</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Choose a pillar from the dropdown above to view indicators and their quarterly targets.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetView;
