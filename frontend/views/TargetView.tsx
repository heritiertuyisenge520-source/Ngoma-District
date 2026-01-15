
import React, { useState, useMemo } from 'react';
import { PILLARS } from '../data';
import { Indicator } from '../types';

const TargetView: React.FC = () => {
  const [pillarId, setPillarId] = useState('');
  const [outputId, setOutputId] = useState('');
  const [indicatorId, setIndicatorId] = useState('');

  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === pillarId), [pillarId]);
  const selectedOutput = useMemo(() => selectedPillar?.outputs.find(o => o.id === outputId), [selectedPillar, outputId]);
  
  const selectedIndicator = useMemo(() => 
    selectedOutput?.indicators.find(i => i.id === indicatorId), 
    [selectedOutput, indicatorId]
  );

  const inputClasses = "w-full h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none appearance-none cursor-pointer";

  const chevronIcon = (
    <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Fixed Targets Registry</h1>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600 font-medium">Browse quarterly goals across the framework.</p>
      </header>

      {/* Filter Section */}
      <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <div className="space-y-1.5 md:space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-tighter">1. Pillar</label>
            <div className="relative">
              <select 
                value={pillarId} 
                onChange={(e) => {
                  setPillarId(e.target.value);
                  setOutputId('');
                  setIndicatorId('');
                }}
                className={inputClasses}
              >
                <option value="" className="text-slate-400">-- All Pillars --</option>
                {PILLARS.map(p => <option key={p.id} value={p.id} className="text-slate-900 font-medium">{p.name}</option>)}
              </select>
              {chevronIcon}
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-tighter">2. Output</label>
            <div className="relative">
              <select 
                value={outputId} 
                onChange={(e) => {
                  setOutputId(e.target.value);
                  setIndicatorId('');
                }}
                disabled={!pillarId}
                className={inputClasses}
              >
                <option value="" className="text-slate-400">-- Choose Output --</option>
                {selectedPillar?.outputs.map(o => <option key={o.id} value={o.id} className="text-slate-900 font-medium">{o.name}</option>)}
              </select>
              {chevronIcon}
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2 sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-tighter">3. Indicator</label>
            <div className="relative">
              <select 
                value={indicatorId} 
                onChange={(e) => setIndicatorId(e.target.value)}
                disabled={!outputId}
                className={inputClasses}
              >
                <option value="" className="text-slate-400">-- Choose Indicator --</option>
                {selectedOutput?.indicators.map(i => <option key={i.id} value={i.id} className="text-slate-900 font-medium">{i.name}</option>)}
              </select>
              {chevronIcon}
            </div>
          </div>
        </div>
      </div>

      {/* Display Section */}
      {selectedIndicator ? (
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-[10px] md:text-xs font-black mb-1.5 opacity-60 uppercase tracking-widest text-blue-400">Target Profile</h2>
              <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 leading-tight">{selectedIndicator.name}</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                {[
                  { label: 'Q1', val: selectedIndicator.targets?.q1 },
                  { label: 'Q2', val: selectedIndicator.targets?.q2 },
                  { label: 'Q3', val: selectedIndicator.targets?.q3 },
                  { label: 'Q4', val: selectedIndicator.targets?.q4 },
                  { label: 'Annual', val: selectedIndicator.targets?.annual, highlight: true },
                ].map((item, idx) => (
                  <div key={idx} className={`p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-sm transition-transform hover:scale-[1.02] ${
                    item.highlight ? 'bg-blue-600/30 border-blue-500/50' : 'bg-slate-800 border-slate-700'
                  }`}>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{item.label}</p>
                    <p className="text-lg md:text-2xl font-black truncate">{item.val || '0'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="px-6 py-4 md:px-8 md:py-6 bg-slate-50 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm md:text-base">Metadata Alignment</h4>
             </div>
             <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                <div>
                   <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Pillar Context</p>
                   <p className="font-bold text-slate-800 text-sm md:text-base leading-snug">{selectedPillar?.name}</p>
                </div>
                <div>
                   <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Output Category</p>
                   <p className="font-bold text-slate-800 text-sm md:text-base leading-snug">{selectedOutput?.name}</p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 rounded-2xl md:rounded-3xl border-2 border-dashed border-slate-300 p-12 md:p-24 text-center">
          <div className="flex flex-col items-center opacity-40 max-w-sm mx-auto">
            <svg className="w-12 h-12 md:w-16 md:h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="text-lg md:text-xl font-bold">Indicator Selection Required</p>
            <p className="text-xs md:text-sm font-medium mt-1">Select a pillar, output, and indicator above to view official quarterly targets and annual objectives.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetView;
