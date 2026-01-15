
import React, { useState } from 'react';
import { PILLARS } from '../data';
import { MonitoringEntry } from '../types';

interface PreviewViewProps {
  entries: MonitoringEntry[];
}

const PreviewView: React.FC<PreviewViewProps> = ({ entries }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(entry => {
    const pillar = PILLARS.find(p => p.id === entry.pillarId);
    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
    const searchStr = `${pillar?.name} ${indicator?.name} ${entry.month}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Form Audit</h1>
          <p className="mt-2 text-slate-600 font-medium">Review all historical entries for this reporting period.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search entries..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 h-12 pl-12 pr-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-left">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Pillar</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Indicator</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Period</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-right">Target</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-right">Achievement</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => {
                  const pillar = PILLARS.find(p => p.id === entry.pillarId);
                  const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
                  return (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-900">{pillar?.name.split(' ')[0]}...</span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{indicator?.name}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600">{entry.month} ({entry.quarterId.toUpperCase()})</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-amber-600">
                          {entry.targetValue !== undefined ? entry.targetValue.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-blue-700">{entry.value.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 tracking-wider border border-emerald-200">Verified</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <p className="text-slate-500 font-bold">No matching records found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreviewView;
