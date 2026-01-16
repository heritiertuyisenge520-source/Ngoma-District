
import React, { useState, useMemo } from 'react';
import { PILLARS, INDICATORS } from '../data';
import { Indicator } from '../types';

const TargetView: React.FC = () => {
  const [pillarId, setPillarId] = useState('');

  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === pillarId), [pillarId]);

  // Get all indicators for the selected pillar
  const allIndicators = useMemo(() => {
    if (!selectedPillar) return [];
    return selectedPillar.indicators || [];
  }, [selectedPillar]);

  // Helper function to get sub-indicators
  const getSubIndicators = (indicator: Indicator) => {
    if (!indicator.isDual || !indicator.subIndicatorIds) return [];
    const subIds = Object.values(indicator.subIndicatorIds);
    return INDICATORS.filter(ind => subIds.includes(ind.id));
  };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header Section */}
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Fixed Targets Registry</h1>
        <p className="text-base md:text-lg text-slate-500 mt-2">Browse quarterly goals across the framework</p>
      </header>

      {/* Filter Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Pillar</label>
        <div className="max-w-md">
          <div className="relative">
            <select
              value={pillarId}
              onChange={(e) => setPillarId(e.target.value)}
              className="w-full h-12 px-4 pr-10 rounded-lg border border-slate-300 bg-white text-slate-800 text-base font-medium hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer"
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
      </div>

      {/* Display Section */}
      {pillarId && allIndicators.length > 0 ? (
        <div className="space-y-6">
          {/* Pillar Header */}
          <div className="bg-blue-600 text-white p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl md:text-2xl font-bold">{selectedPillar?.name}</h2>
            <p className="text-blue-100 mt-1">{allIndicators.length} indicator{allIndicators.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Indicators List */}
          <div className="space-y-6">
            {allIndicators.map((indicator) => {
              const subIndicators = getSubIndicators(indicator);
              const hasSubIndicators = subIndicators.length > 0;

              return (
                <div key={indicator.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {/* Indicator Header */}
                  <div className="p-6 md:p-8 bg-slate-800 text-white">
                    <h3 className="text-lg md:text-xl font-bold leading-relaxed">{indicator.name}</h3>

                    {/* Only show targets for indicators WITHOUT sub-indicators */}
                    {!hasSubIndicators && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        {[
                          { label: 'Q1', val: indicator.targets?.q1 },
                          { label: 'Q2', val: indicator.targets?.q2 },
                          { label: 'Q3', val: indicator.targets?.q3 },
                          { label: 'Q4', val: indicator.targets?.q4 },
                          { label: 'Annual', val: indicator.targets?.annual, isAnnual: true },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`p-4 rounded-xl ${item.isAnnual
                                ? 'bg-blue-600'
                                : 'bg-slate-700'
                              }`}
                          >
                            <p className="text-xs font-semibold text-slate-300 uppercase mb-1">{item.label}</p>
                            <p className="text-xl md:text-2xl font-bold text-white">
                              {typeof item.val === 'number' ? item.val.toLocaleString() : item.val || '0'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sub-Indicators Section */}
                  {hasSubIndicators && (
                    <div className="p-6 md:p-8 bg-slate-50">
                      <h4 className="text-base font-bold text-slate-700 mb-5">
                        Sub-Indicators ({subIndicators.length})
                      </h4>

                      <div className="space-y-4">
                        {subIndicators.map((subInd) => (
                          <div key={subInd.id} className="bg-white rounded-xl border border-slate-200 p-5">
                            <h5 className="text-base font-semibold text-slate-800 mb-4">{subInd.name}</h5>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {[
                                { label: 'Q1', val: subInd.targets?.q1 },
                                { label: 'Q2', val: subInd.targets?.q2 },
                                { label: 'Q3', val: subInd.targets?.q3 },
                                { label: 'Q4', val: subInd.targets?.q4 },
                                { label: 'Annual', val: subInd.targets?.annual, isAnnual: true },
                              ].map((item) => (
                                <div
                                  key={item.label}
                                  className={`p-3 rounded-lg ${item.isAnnual
                                      ? 'bg-blue-50 border border-blue-200'
                                      : 'bg-slate-50 border border-slate-200'
                                    }`}
                                >
                                  <p className={`text-xs font-semibold uppercase mb-1 ${item.isAnnual ? 'text-blue-600' : 'text-slate-500'
                                    }`}>
                                    {item.label}
                                  </p>
                                  <p className={`text-lg font-bold ${item.isAnnual ? 'text-blue-700' : 'text-slate-800'
                                    }`}>
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
        <div className="bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-16 text-center">
          <div className="max-w-sm mx-auto">
            <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">Select a Pillar</h3>
            <p className="text-sm text-slate-500">Choose a pillar from the dropdown above to view indicators and targets.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetView;
