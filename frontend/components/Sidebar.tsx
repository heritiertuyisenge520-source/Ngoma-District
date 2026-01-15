import React, { useMemo } from 'react';
import { PILLARS, QUARTERS } from '../data';
import { MonitoringEntry } from '../types';
import { calculateQuarterProgress } from '../utils/progressUtils';

interface SidebarProps {
  activeView: 'fill' | 'preview' | 'analytics' | 'targets' | 'ppt' | 'calculator' | 'responses';
  entries: MonitoringEntry[];
  user: { email: string; name: string; role: string } | null;
  onLogout: () => void;
  setActiveView: (view: 'fill' | 'preview' | 'analytics' | 'targets' | 'ppt' | 'calculator' | 'responses') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, entries, user, onLogout, setActiveView }) => {
  // Calculate Global Progress for the latest reported month or current quarter
  const globalProgress = useMemo(() => {
    if (entries.length === 0) return 0;

    // For simplicity, let's calculate the average progress across all indicators for the most recent quarter reported
    const latestEntry = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const targetQuarterId = latestEntry?.quarterId || 'q1';
    const targetQuarter = QUARTERS.find(q => q.id === targetQuarterId)!;

    let totalPerf = 0;
    let count = 0;

    PILLARS.forEach(p => {
      p.indicators.forEach(i => {
        const indEntries = entries.filter(e => e.indicatorId === i.id);
        if (indEntries.length > 0) {
          const stats = calculateQuarterProgress({
            indicator: i,
            entries: indEntries,
            quarterId: targetQuarterId,
            monthsInQuarter: targetQuarter.months
          });
          totalPerf += stats.performance;
          count++;
        }
      });
    });

    return count > 0 ? Math.round(totalPerf / count) : 0;
  }, [entries]);

  const menuItems = [
    {
      id: 'fill',
      label: user?.role === 'Assign employee' ? 'Submit the indicators' : 'Fill the Form',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: 'responses',
      label: 'Response',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    ...(user?.role !== 'Assign employee' ? [
      {
        id: 'calculator',
        label: 'Progress Calculator',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        id: 'targets',
        label: 'Fixed Targets',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      {
        id: 'ppt',
        label: 'Prepare PPT',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        ),
      },
      {
        id: 'preview',
        label: 'Form Preview',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      }
    ] : []),
  ];

  return (
    <div className="w-64 h-full bg-slate-900 text-white flex flex-col shadow-2xl transition-all">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">I</div>
        <span className="text-xl font-bold tracking-tight text-slate-100 uppercase">Imihigo MS</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as any)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === item.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}

        {/* Global Progress Widget */}
        <div className="mt-8 pt-8 border-t border-slate-800 px-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Goal Achievement</p>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-200 bg-blue-900">
                  Quarter Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-200">
                  {globalProgress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-800">
              <div
                style={{ width: `${Math.min(globalProgress, 100)}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"
              ></div>
            </div>
            <p className="text-[9px] text-slate-500 leading-tight italic">
              Calculated based on cumulative monthly reported data vs fixed targets.
            </p>
          </div>
        </div>
      </nav>

      <div className="p-6 mt-auto border-t border-slate-800 bg-slate-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg border border-white/10">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate w-24">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate w-24">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors group"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Live System</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium">v1.2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
