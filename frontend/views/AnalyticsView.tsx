
import React, { useState, useMemo, useRef } from 'react';
import { PILLARS, QUARTERS } from '../data';
import { MonitoringEntry } from '../types';
import { calculateQuarterProgress, calculateAnnualProgress } from '../utils/progressUtils';
import jsPDF from 'jspdf';

interface AnalyticsViewProps {
  entries: MonitoringEntry[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ entries }) => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>(PILLARS[0].id);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(QUARTERS[0].id);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === selectedPillarId), [selectedPillarId]);
  const availableIndicators = useMemo(() => 
    selectedPillar?.outputs?.flatMap(output => output.indicators || []) || [], 
    [selectedPillar]
  );

  useMemo(() => {
    if (availableIndicators.length > 0 && !availableIndicators.find(i => i.id === selectedIndicatorId)) {
      setSelectedIndicatorId(availableIndicators[0].id);
    }
  }, [availableIndicators, selectedIndicatorId]);

  const selectedIndicator = useMemo(() => availableIndicators.find(i => i.id === selectedIndicatorId), [availableIndicators, selectedIndicatorId]);
  const selectedQuarter = useMemo(() => QUARTERS.find(q => q.id === selectedQuarterId), [selectedQuarterId]);

  const getPerformanceColor = (percentage: number) => {
    if (percentage < 50) return 'rose';
    if (percentage <= 75) return 'amber';
    return 'emerald';
  };

  const getHexForColor = (color: string) => {
    switch (color) {
      case 'rose': return '#e11d48';
      case 'amber': return '#f59e0b';
      case 'emerald': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getMonthlyValue = (monthName: string) => {
    const monthEntries = entries.filter(e => e.indicatorId === selectedIndicatorId && e.month === monthName);
    return monthEntries.reduce((acc, curr) => acc + curr.value, 0);
  };

  const latestSubmission = useMemo(() => {
    const indicatorEntries = entries.filter(e => e.indicatorId === selectedIndicatorId);
    if (indicatorEntries.length === 0) return null;
    const sorted = [...indicatorEntries].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0];
  }, [entries, selectedIndicatorId]);

  const quarterStats = useMemo(() => {
    if (!selectedIndicator || !selectedQuarter) return null;

    const result = calculateQuarterProgress({
      indicator: selectedIndicator,
      entries: entries.filter(e => e.indicatorId === selectedIndicator.id),
      quarterId: selectedQuarter.id,
      monthsInQuarter: selectedQuarter.months
    });

    const monthlyValues = selectedQuarter.months.map(m => getMonthlyValue(m));

    return {
      totalActual: result.totalActual,
      target: result.target,
      performance: result.performance,
      trend: result.trend,
      nextTarget: result.nextTarget,
      monthlyValues,
      months: selectedQuarter.months,
      subIndicatorDetails: result.subIndicatorDetails
    };
  }, [selectedIndicator, selectedQuarter, entries]);

  const annualCompletion = useMemo(() => {
    if (!selectedIndicator) return 0;
    return calculateAnnualProgress(selectedIndicator, entries);
  }, [selectedIndicator, entries]);

  const qColor = quarterStats ? getPerformanceColor(quarterStats.performance) : 'blue';

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 45, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Progress Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${selectedIndicator?.name || 'Indicator'} - ${selectedQuarter?.name || 'Quarter'}`, pageWidth / 2, 30, { align: 'center' });

      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 38, { align: 'center' });

      let yPos = 55;

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Performance Summary', 15, yPos);
      yPos += 10;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('Quarterly Progress', 25, yPos + 12);
      pdf.text('Annual Progress', 105, yPos + 12);

      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      const perfColor = getHexForColor(qColor);
      const rgb = parseInt(perfColor.slice(1), 16);
      pdf.setTextColor((rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255);
      pdf.text(`${Math.round(quarterStats?.performance || 0)}%`, 25, yPos + 28);

      pdf.setTextColor(59, 130, 246);
      pdf.text(`${Math.round(annualCompletion)}%`, 105, yPos + 28);

      yPos += 45;

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Monthly Progress', 15, yPos);
      yPos += 10;

      const barWidth = 40;
      const maxBarHeight = 40;
      const chartStartX = 25;
      const maxVal = Math.max(...(quarterStats?.monthlyValues || [1]), 1);

      quarterStats?.months.forEach((month, idx) => {
        const val = quarterStats.monthlyValues[idx];
        const barHeight = (val / maxVal) * maxBarHeight;
        const x = chartStartX + (idx * (barWidth + 20));

        pdf.setFillColor(226, 232, 240);
        pdf.roundedRect(x, yPos + (maxBarHeight - barHeight), barWidth, barHeight || 2, 2, 2, 'F');

        const mPerf = (val / (quarterStats.target / 3)) * 100;
        const mColor = getPerformanceColor(mPerf);
        const barColorHex = getHexForColor(mColor);
        const barRgb = parseInt(barColorHex.slice(1), 16);
        pdf.setFillColor((barRgb >> 16) & 255, (barRgb >> 8) & 255, barRgb & 255);
        pdf.roundedRect(x, yPos + (maxBarHeight - barHeight), barWidth, barHeight || 2, 2, 2, 'F');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 116, 139);
        pdf.text(month.substring(0, 3).toUpperCase(), x + barWidth / 2, yPos + maxBarHeight + 8, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text(val.toLocaleString(), x + barWidth / 2, yPos - 5, { align: 'center' });
      });

      yPos += maxBarHeight + 25;

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Target vs Achievement', 15, yPos);
      yPos += 10;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, yPos, (pageWidth - 40) / 2, 25, 3, 3, 'F');
      pdf.roundedRect(25 + (pageWidth - 40) / 2, yPos, (pageWidth - 40) / 2, 25, 3, 3, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text('TARGET', 25, yPos + 8);
      pdf.text('ACTUAL', 35 + (pageWidth - 40) / 2, yPos + 8);

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text((quarterStats?.target || 0).toLocaleString(), 25, yPos + 20);
      pdf.text((quarterStats?.totalActual || 0).toLocaleString(), 35 + (pageWidth - 40) / 2, yPos + 20);

      yPos += 35;

      if (latestSubmission) {
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Latest Submission', 15, yPos);
        yPos += 10;

        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(15, yPos, pageWidth - 30, 30, 3, 3, 'F');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Submitted by: ${latestSubmission.submittedBy || 'Unknown'}`, 25, yPos + 12);

        if (latestSubmission.comments) {
          pdf.text(`Comment: "${latestSubmission.comments}"`, 25, yPos + 22);
        }
      }

      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 277, pageWidth, 20, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Imihigo Management System - Ngoma District', pageWidth / 2, 287, { align: 'center' });

      pdf.save(`Progress_Report_${selectedIndicator?.name?.replace(/\s+/g, '_') || 'Indicator'}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }

    setIsGeneratingReport(false);
  };

  const inputClasses = "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium shadow-sm hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none appearance-none cursor-pointer";

  return (
    <div ref={reportRef} className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Clean Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Progress</h1>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={isGeneratingReport || !quarterStats}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingReport ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span>Download Report</span>
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Pillar</label>
          <select value={selectedPillarId} onChange={(e) => setSelectedPillarId(e.target.value)} className={inputClasses}>
            {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Indicator</label>
          <select value={selectedIndicatorId} onChange={(e) => setSelectedIndicatorId(e.target.value)} className={inputClasses} disabled={availableIndicators.length === 0}>
            {availableIndicators.length === 0 ? (
              <option value="">-- No indicators available --</option>
            ) : (
              availableIndicators.map(i => <option key={i.id} value={i.id}>{i.name}</option>)
            )}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Quarter</label>
          <select value={selectedQuarterId} onChange={(e) => setSelectedQuarterId(e.target.value)} className={inputClasses}>
            {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
        </div>
      </div>

      {quarterStats && selectedIndicator && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

          {/* Monthly Progress Chart - Dark Professional Design */}
          <div className="xl:col-span-8 relative overflow-hidden rounded-2xl shadow-xl">
            {/* Rich Dark Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>

            {/* Glowing orbs for depth */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <div className="relative z-10 p-6 lg:p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Monthly Progress</p>
                  <h3 className="text-xl font-bold text-white">{selectedQuarter?.name}</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                  <span className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse`}></span>
                  <span className="text-[11px] text-white/80 font-semibold uppercase tracking-wide">Live</span>
                </div>
              </div>

              {/* Chart Area */}
              <div className="relative h-52 lg:h-60">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-full h-px bg-white/10"></div>
                  ))}
                </div>

                {/* Trend Line */}
                <svg className="absolute inset-0 w-full h-full overflow-visible z-10 pointer-events-none" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={getHexForColor(qColor)} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={getHexForColor(qColor)} stopOpacity="0.05" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Area fill */}
                  <path
                    d={`${quarterStats.months.map((_, i) => {
                      const val = quarterStats.monthlyValues[i];
                      const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                      const x = 10 + (i / (quarterStats.months.length - 1 || 1)) * 80;
                      const y = 90 - (val / maxVal) * 70;
                      return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                    }).join(' ')} L 90% 90% L 10% 90% Z`}
                    fill="url(#areaGradient)"
                  />

                  {/* Glowing Line */}
                  <path
                    d={quarterStats.months.map((_, i) => {
                      const val = quarterStats.monthlyValues[i];
                      const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                      const x = 10 + (i / (quarterStats.months.length - 1 || 1)) * 80;
                      const y = 90 - (val / maxVal) * 70;
                      return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke={getHexForColor(qColor)}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                  />

                  {/* Data points with glow */}
                  {quarterStats.months.map((_, i) => {
                    const val = quarterStats.monthlyValues[i];
                    const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                    const x = 10 + (i / (quarterStats.months.length - 1 || 1)) * 80;
                    const y = 90 - (val / maxVal) * 70;
                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="6"
                        fill={getHexForColor(qColor)}
                        stroke="white"
                        strokeWidth="2"
                        filter="url(#glow)"
                      />
                    );
                  })}
                </svg>

                {/* Bar Chart */}
                <div className="absolute inset-0 flex items-end justify-around px-6 lg:px-12 gap-4 lg:gap-6 z-20">
                  {quarterStats.months.map((month, idx) => {
                    const val = quarterStats.monthlyValues[idx];
                    const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                    const heightPercent = Math.max((val / maxVal) * 70, 8);
                    const expected = quarterStats.target / 3;
                    const mPerf = (val / expected) * 100;
                    const mColor = getPerformanceColor(mPerf);

                    return (
                      <div
                        key={month}
                        className="flex-1 flex flex-col items-center group cursor-pointer max-w-[70px]"
                        onMouseEnter={() => setHoveredMonth(month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        {/* Tooltip */}
                        <div className={`absolute bottom-[calc(100%-10px)] opacity-0 group-hover:opacity-100 transition-all duration-200 z-40 pointer-events-none transform group-hover:scale-100 scale-95`}>
                          <div className="bg-white text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-center border border-slate-100">
                            <p className="text-slate-400 text-[10px] uppercase font-semibold tracking-wide">{month}</p>
                            <p className="text-xl font-black">{val.toLocaleString()}</p>
                          </div>
                          <div className="w-3 h-3 bg-white rotate-45 mx-auto -mt-1.5 border-b border-r border-slate-100"></div>
                        </div>

                        {/* Bar */}
                        <div className="w-full relative h-[170px] flex items-end">
                          <div
                            className={`w-full rounded-lg transition-all duration-500 ease-out group-hover:scale-105`}
                            style={{
                              height: `${heightPercent}%`,
                              background: `linear-gradient(180deg, ${getHexForColor(mColor)} 0%, ${getHexForColor(mColor)}80 100%)`,
                              boxShadow: `0 0 20px ${getHexForColor(mColor)}50, 0 0 40px ${getHexForColor(mColor)}20`
                            }}
                          />
                        </div>

                        {/* Month Label */}
                        <span className={`text-[11px] font-bold mt-3 uppercase tracking-wider transition-all duration-200 ${hoveredMonth === month ? 'text-white scale-110' : 'text-slate-400'}`}>
                          {month.substring(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quarterly Progress */}
          <div className="xl:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Quarterly Progress</p>

            <div className="flex flex-col items-center">
              {/* Progress Ring */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={getHexForColor(qColor)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * Math.min(quarterStats.performance, 100)) / 100}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-800">{Math.round(quarterStats.performance)}%</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Achieved</span>
                </div>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Target</p>
                  <p className="text-lg font-bold text-slate-800">{quarterStats.target.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Actual</p>
                  <p className="text-lg font-bold text-slate-800">{quarterStats.totalActual.toLocaleString()}</p>
                </div>
              </div>

              {/* Yearly Progress - Compact */}
              <div className="w-full mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="#6366f1"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (251 * annualCompletion) / 100}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-indigo-600">{Math.round(annualCompletion)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Annual</p>
                    <p className="text-sm font-semibold text-slate-700">Yearly Goal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Info - Clean & Professional */}
          {latestSubmission && (
            <div className="xl:col-span-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5">
                {/* Submitter */}
                <div className="flex items-center gap-3 md:pr-6 md:border-r md:border-slate-100">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    {latestSubmission.submittedBy?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Submitted by</p>
                    <p className="text-sm font-semibold text-slate-700">{latestSubmission.submittedBy || 'Unknown'}</p>
                  </div>
                </div>

                {/* Comment */}
                {latestSubmission.comments && (
                  <div className="flex-1 md:px-6 md:border-r md:border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Comment</p>
                    <p className="text-sm text-slate-600 leading-relaxed">"{latestSubmission.comments}"</p>
                  </div>
                )}

                {/* Date */}
                <div className="md:pl-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Date</p>
                  <p className="text-sm font-medium text-slate-500">
                    {new Date(latestSubmission.timestamp).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-indicators */}
      {quarterStats && quarterStats.subIndicatorDetails && quarterStats.subIndicatorDetails.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-base font-bold text-slate-700">Sub-indicator Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {quarterStats.subIndicatorDetails.map((sub: any, idx: number) => {
              const subColor = getPerformanceColor(sub.performance);
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-slate-200 transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`w-7 h-7 rounded-lg bg-${subColor}-50 text-${subColor}-600 flex items-center justify-center font-semibold text-xs`}>
                      {idx + 1}
                    </span>
                    <span className={`text-sm font-bold text-${subColor}-600`}>
                      {Math.round(sub.performance)}%
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-slate-700 leading-snug mb-3 line-clamp-2">{sub.name}</h4>

                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${subColor}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(sub.performance, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{sub.actual.toLocaleString()} actual</span>
                      <span>{sub.target.toLocaleString()} target</span>
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
