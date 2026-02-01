import React, { useState, useMemo } from 'react';
import { PILLARS, QUARTERS, INDICATORS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { calculateMonthlyProgress, calculateAnnualProgress, parseValue } from '../utils/progressUtils';
import { formatDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';

interface PillarProgressViewProps {
  entries: MonitoringEntry[];
  user?: {
    email: string;
    name: string;
    role: string;
    userType?: 'super_admin' | 'leader' | 'head' | 'employee';
    unit?: string;
  };
}

interface SubIndicatorProgress {
  id: string;
  name: string;
  key: string;
  monthlyProgress: number;
  annualProgress: number;
  monthlyActual: number;
  monthlyTarget: number;
  annualActual: number;
  annualTarget: number;
}

interface IndicatorProgressRow {
  indicatorId: string;
  indicatorNumber: number;
  indicatorName: string;
  monthlyProgress: number;
  annualProgress: number;
  monthlyActual: number;
  monthlyTarget: number;
  annualActual: number;
  annualTarget: number;
  status: 'completed' | 'on-track' | 'behind' | 'not-started';
  hasSubIndicators: boolean;
  subIndicators: SubIndicatorProgress[];
}

// Map full month names to abbreviations
const monthNameToAbbr: Record<string, string> = {
  'July': 'Jul',
  'August': 'Aug',
  'September': 'Sep',
  'October': 'Oct',
  'November': 'Nov',
  'December': 'Dec',
  'January': 'Jan',
  'February': 'Feb',
  'March': 'Mar',
  'April': 'Apr',
  'May': 'May',
  'June': 'Jun'
};

const PillarProgressView: React.FC<PillarProgressViewProps> = ({ entries, user }) => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>(PILLARS[0]?.id || '');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(QUARTERS[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set());

  // Get available months for selected quarter
  const availableMonths = useMemo(() => {
    const quarter = QUARTERS.find(q => q.id === selectedQuarterId);
    return quarter?.months || [];
  }, [selectedQuarterId]);

  // Update selected month when quarter changes
  React.useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Get selected pillar data
  const selectedPillar = useMemo(() => {
    return PILLARS.find(p => p.id === selectedPillarId);
  }, [selectedPillarId]);

  // Get all indicators in selected pillar
  const pillarIndicators = useMemo(() => {
    if (!selectedPillar) return [];
    return selectedPillar.outputs.flatMap(output => output.indicators || []);
  }, [selectedPillar]);

  // Calculate indicator numbering
  const indicatorNumbering = useMemo(() => {
    const numbering = new Map<string, number>();
    let counter = 1;
    PILLARS.forEach(pillar => {
      pillar.outputs.forEach(output => {
        output.indicators.forEach(indicator => {
          numbering.set(indicator.id, counter++);
        });
      });
    });
    return numbering;
  }, []);

  // Helper function to get status
  const getStatus = (progress: number): 'completed' | 'on-track' | 'behind' | 'not-started' => {
    if (progress >= 100) return 'completed';
    if (progress >= 75) return 'on-track';
    if (progress > 0) return 'behind';
    return 'not-started';
  };

  // Helper function to get monthly actual value
  const getMonthlyActual = (indicator: Indicator, monthAbbr: string, monthFull: string): number => {
    // Try both abbreviation and full name formats
    const monthEntries = entries.filter(e => 
      e.indicatorId === indicator.id && 
      (e.month === monthAbbr || e.month === monthFull)
    );
    
    if (monthEntries.length === 0) return 0;
    
    // For cumulative indicators, use the latest value
    // For percentage indicators, use the average
    const isPercentage = indicator.measurementType === 'percentage';
    
    if (isPercentage) {
      return monthEntries.reduce((sum, e) => sum + e.value, 0) / monthEntries.length;
    } else {
      return Math.max(...monthEntries.map(e => e.value));
    }
  };

  // Helper function to get monthly target
  const getMonthlyTarget = (indicator: Indicator, monthAbbr: string): number => {
    const t1 = parseValue(indicator.targets.q1);
    const t2 = parseValue(indicator.targets.q2);
    const t3 = parseValue(indicator.targets.q3);
    const t4 = parseValue(indicator.targets.q4);
    
    const isPercentage = indicator.measurementType === 'percentage';
    const isDecreasing = indicator.measurementType === 'decreasing';
    
    if (isPercentage || isDecreasing) {
      // For percentage/decreasing, use current quarter target
      const monthToQuarter: Record<string, string> = {
        'Jul': 'q1', 'Aug': 'q1', 'Sep': 'q1',
        'Oct': 'q2', 'Nov': 'q2', 'Dec': 'q2',
        'Jan': 'q3', 'Feb': 'q3', 'Mar': 'q3',
        'Apr': 'q4', 'May': 'q4', 'Jun': 'q4'
      };
      const quarterId = monthToQuarter[monthAbbr] || 'q1';
      switch (quarterId) {
        case 'q1': return t1;
        case 'q2': return t2;
        case 'q3': return t3;
        case 'q4': return t4;
        default: return 0;
      }
    } else {
      // For cumulative, use cumulative targets
      const monthToTarget: Record<string, number> = {
        'Jul': t1, 'Aug': t1, 'Sep': t1,
        'Oct': t1 + t2, 'Nov': t1 + t2, 'Dec': t1 + t2,
        'Jan': t1 + t2 + t3, 'Feb': t1 + t2 + t3, 'Mar': t1 + t2 + t3,
        'Apr': t1 + t2 + t3 + t4, 'May': t1 + t2 + t3 + t4, 'Jun': t1 + t2 + t3 + t4
      };
      return monthToTarget[monthAbbr] || 0;
    }
  };

  // Calculate progress for each indicator
  const indicatorsWithProgress = useMemo(() => {
    if (!selectedPillar || !selectedMonth) return [];

    const monthAbbr = monthNameToAbbr[selectedMonth] || selectedMonth;

    return pillarIndicators.map((indicator): IndicatorProgressRow => {
      // Get entries for this indicator
      const indicatorEntries = entries.filter(e => e.indicatorId === indicator.id);
      
      // Get monthly entry (try both formats)
      const monthlyEntry = indicatorEntries.find(e => 
        e.month === monthAbbr || e.month === selectedMonth
      );
      
      // Calculate sub-indicator progress if this is a composite indicator
      const subIndicators: SubIndicatorProgress[] = [];
      let monthlyProgress = 0;
      let annualProgress = 0;
      let monthlyActual = 0;
      let monthlyTarget = 0;
      let annualActual = 0;
      let annualTarget = 0;
      
      if (indicator.subIndicatorIds && Object.keys(indicator.subIndicatorIds).length > 0) {
        Object.entries(indicator.subIndicatorIds).forEach(([key, subId]) => {
          const subIndicator = INDICATORS.find(i => i.id === subId);
          if (subIndicator) {
            // Get sub-indicator values from parent indicator entries' subValues field
            // Helper to get sub-value from entry's subValues
            const getSubValue = (entry: MonitoringEntry, subKey: string): number => {
              if (!entry.subValues) return 0;
              return entry.subValues[subKey] || 0;
            };
            
            // Get monthly entry for parent indicator
            const monthlyEntry = indicatorEntries.find(e => 
              e.month === monthAbbr || e.month === selectedMonth
            );
            
            // Calculate monthly progress for sub-indicator
            let subMonthlyProgress = 0;
            let subMonthlyActual = 0;
            let subMonthlyTarget = 0;
            
            if (monthlyEntry) {
              subMonthlyActual = getSubValue(monthlyEntry, key);
              subMonthlyTarget = getMonthlyTarget(subIndicator, monthAbbr);
              
              if (subMonthlyTarget > 0) {
                subMonthlyProgress = (subMonthlyActual / subMonthlyTarget) * 100;
                if (subIndicator.measurementType === 'decreasing') {
                  subMonthlyProgress = subMonthlyActual > 0 ? (subMonthlyTarget / subMonthlyActual) * 100 : 100;
                }
                subMonthlyProgress = Math.min(subMonthlyProgress, 100);
              } else if (subMonthlyActual > 0) {
                subMonthlyProgress = 100; // Exceeded no target
              }
            }
            
            // Calculate annual progress for sub-indicator
            // For annual, we need to get the latest cumulative value or sum depending on type
            const subIsCumulative = !subIndicator.measurementType || subIndicator.measurementType === 'cumulative';
            let subAnnualActual = 0;
            
            if (subIsCumulative) {
              // For cumulative, use the maximum value across all entries
              subAnnualActual = Math.max(...indicatorEntries.map(e => getSubValue(e, key)));
            } else {
              // For percentage or other types, sum the values
              subAnnualActual = indicatorEntries.reduce((sum, e) => sum + getSubValue(e, key), 0);
            }
            
            const subAnnualTarget = parseValue(subIndicator.targets.annual);
            let subAnnualProgress = 0;
            
            if (subAnnualTarget > 0) {
              subAnnualProgress = (subAnnualActual / subAnnualTarget) * 100;
              if (subIndicator.measurementType === 'decreasing') {
                subAnnualProgress = subAnnualActual > 0 ? (subAnnualTarget / subAnnualActual) * 100 : 100;
              }
              subAnnualProgress = Math.min(subAnnualProgress, 100);
            } else if (subAnnualActual > 0) {
              subAnnualProgress = 100; // Exceeded no target
            }
            
            subIndicators.push({
              id: subId,
              name: subIndicator.name,
              key: key,
              monthlyProgress: subMonthlyProgress,
              annualProgress: subAnnualProgress,
              monthlyActual: subMonthlyActual,
              monthlyTarget: subMonthlyTarget,
              annualActual: subAnnualActual,
              annualTarget: subAnnualTarget
            });
          }
        });
        
        // For composite indicators, parent progress is the average of sub-indicator performances
        if (subIndicators.length > 0) {
          monthlyProgress = subIndicators.reduce((sum, sub) => sum + sub.monthlyProgress, 0) / subIndicators.length;
          annualProgress = subIndicators.reduce((sum, sub) => sum + sub.annualProgress, 0) / subIndicators.length;
          monthlyActual = subIndicators.reduce((sum, sub) => sum + sub.monthlyActual, 0);
          monthlyTarget = subIndicators.reduce((sum, sub) => sum + sub.monthlyTarget, 0);
          annualActual = subIndicators.reduce((sum, sub) => sum + sub.annualActual, 0);
          annualTarget = subIndicators.reduce((sum, sub) => sum + sub.annualTarget, 0);
        }
      } else {
        // For non-composite indicators, calculate progress normally
        monthlyActual = getMonthlyActual(indicator, monthAbbr, selectedMonth);
        monthlyTarget = getMonthlyTarget(indicator, monthAbbr);
        
        // Calculate monthly progress
        if (monthlyEntry) {
          // Filter entries for this month (both formats)
          const monthEntries = indicatorEntries.filter(e => 
            e.month === monthAbbr || e.month === selectedMonth
          );
          monthlyProgress = calculateMonthlyProgress(
            indicator,
            monthlyEntry.value,
            monthAbbr,
            monthEntries
          );
        }
        
        // Calculate annual progress
        annualProgress = calculateAnnualProgress(indicator, indicatorEntries);
        
        // Get annual actual and target
        const isCumulative = !indicator.measurementType || indicator.measurementType === 'cumulative';
        annualActual = isCumulative && indicatorEntries.length > 0
          ? Math.max(...indicatorEntries.map(e => e.value))
          : indicatorEntries.reduce((sum, e) => sum + e.value, 0);
        annualTarget = parseValue(indicator.targets.annual);
      }
      
      return {
        indicatorId: indicator.id,
        indicatorNumber: indicatorNumbering.get(indicator.id) || 0,
        indicatorName: indicator.name,
        monthlyProgress,
        annualProgress,
        monthlyActual,
        monthlyTarget,
        annualActual,
        annualTarget,
        status: getStatus(annualProgress),
        hasSubIndicators: !!indicator.subIndicatorIds && Object.keys(indicator.subIndicatorIds).length > 0,
        subIndicators
      };
    });
  }, [selectedPillar, selectedMonth, entries, pillarIndicators, indicatorNumbering]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'on-track':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'behind':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Get progress bar color
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Download CSV Dataset
  const handleDownloadCSV = () => {
    if (!selectedPillar || !selectedMonth || indicatorsWithProgress.length === 0) {
      alert('Please select a pillar, quarter, and month first');
      return;
    }

    const headers = [
      'Indicator #',
      'Indicator Name',
      'Type',
      'Monthly Progress (%)',
      'Monthly Actual',
      'Monthly Target',
      'Annual Progress (%)',
      'Annual Actual',
      'Annual Target',
      'Sub-Indicator Name',
      'Sub-Indicator Monthly Progress (%)',
      'Sub-Indicator Monthly Actual',
      'Sub-Indicator Monthly Target',
      'Sub-Indicator Annual Progress (%)',
      'Sub-Indicator Annual Actual',
      'Sub-Indicator Annual Target'
    ];

    const rows: string[] = [headers.join(',')];

    indicatorsWithProgress.forEach((row) => {
      // Add parent indicator row
      const parentRow = [
        row.indicatorNumber,
        `"${row.indicatorName.replace(/"/g, '""')}"`,
        row.hasSubIndicators ? 'Composite' : 'Standard',
        row.monthlyProgress.toFixed(2),
        row.monthlyActual,
        row.monthlyTarget,
        row.annualProgress.toFixed(2),
        row.annualActual,
        row.annualTarget,
        '', '', '', '', '', '', ''
      ];
      rows.push(parentRow.join(','));

      // Add sub-indicator rows if they exist
      if (row.hasSubIndicators && row.subIndicators.length > 0) {
        row.subIndicators.forEach((sub) => {
          const subRow = [
            '', '', '', '', '', '', '', '', '', '',
            `"${sub.name.replace(/"/g, '""')}"`,
            sub.monthlyProgress.toFixed(2),
            sub.monthlyActual,
            sub.monthlyTarget,
            sub.annualProgress.toFixed(2),
            sub.annualActual,
            sub.annualTarget
          ];
          rows.push(subRow.join(','));
        });
      }
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const fileName = `${selectedPillar.name.replace(/[^a-z0-9]/gi, '_')}_${selectedMonth}_${selectedQuarterId}_progress_data.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PDF Report
  const handleDownloadPDF = async () => {
    if (!selectedPillar || !selectedMonth || indicatorsWithProgress.length === 0) {
      alert('Please select a pillar, quarter, and month first');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // Header with dark background
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 50, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pillar Progress Report', pageWidth / 2, 25, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${selectedPillar.name}`, pageWidth / 2, 35, { align: 'center' });
      pdf.text(`${selectedMonth} - ${QUARTERS.find(q => q.id === selectedQuarterId)?.name || ''}`, pageWidth / 2, 42, { align: 'center' });

      pdf.setFontSize(9);
      pdf.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, 48, { align: 'center' });

      yPos = 60;

      // Summary Statistics
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Statistics', 15, yPos);
      yPos += 8;

      const totalIndicators = indicatorsWithProgress.length;
      const avgMonthlyProgress = indicatorsWithProgress.reduce((sum, r) => sum + r.monthlyProgress, 0) / totalIndicators;
      const avgAnnualProgress = indicatorsWithProgress.reduce((sum, r) => sum + r.annualProgress, 0) / totalIndicators;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Total Indicators: ${totalIndicators}`, 15, yPos);
      pdf.text(`Average Monthly Progress: ${avgMonthlyProgress.toFixed(1)}%`, 100, yPos);
      yPos += 6;
      pdf.text(`Average Annual Progress: ${avgAnnualProgress.toFixed(1)}%`, 15, yPos);
      yPos += 15;

      // Progress Chart
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Overall Progress Chart', 15, yPos);
      yPos += 8;

      const chartWidth = pageWidth - 30;
      const chartHeight = 40;
      const chartX = 15;
      const chartY = yPos;

      // Draw chart background
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, 'F');

      // Draw progress bars for top 10 indicators
      const topIndicators = [...indicatorsWithProgress]
        .sort((a, b) => b.monthlyProgress - a.monthlyProgress)
        .slice(0, 10);

      const barHeight = chartHeight / Math.max(topIndicators.length, 1);
      topIndicators.forEach((indicator, idx) => {
        const barY = chartY + (idx * barHeight);
        const barWidth = (indicator.monthlyProgress / 100) * (chartWidth - 60);
        
        // Bar color based on progress
        if (indicator.annualProgress >= 100) {
          pdf.setFillColor(16, 185, 129);
        } else if (indicator.annualProgress >= 75) {
          pdf.setFillColor(59, 130, 246);
        } else if (indicator.annualProgress > 0) {
          pdf.setFillColor(245, 158, 11);
        } else {
          pdf.setFillColor(148, 163, 184);
        }

        pdf.rect(chartX + 5, barY + 2, barWidth, barHeight - 4, 'F');

        // Indicator name and percentage
        pdf.setFontSize(7);
        pdf.setTextColor(30, 41, 59);
        const name = indicator.indicatorName.length > 35 
          ? indicator.indicatorName.substring(0, 32) + '...' 
          : indicator.indicatorName;
        pdf.text(`${indicator.indicatorNumber}. ${name}`, chartX + 8, barY + barHeight / 2 + 2);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${indicator.monthlyProgress.toFixed(1)}%`, chartX + chartWidth - 25, barY + barHeight / 2 + 2);
        pdf.setFont('helvetica', 'normal');
      });

      yPos += chartHeight + 15;

      // Detailed Indicator List
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text('Detailed Indicator Progress', 15, yPos);
      yPos += 10;

      indicatorsWithProgress.forEach((row, idx) => {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = 20;
        }

        // Indicator header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(`${row.indicatorNumber}. ${row.indicatorName}`, 15, yPos);
        yPos += 6;

        if (row.hasSubIndicators) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Composite Indicator (${row.subIndicators.length} sub-indicators)`, 20, yPos);
          yPos += 5;
        }

        // Progress metrics
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Monthly Progress:', 20, yPos);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(`${row.monthlyProgress.toFixed(1)}%`, 70, yPos);
        pdf.text(`${row.monthlyActual.toLocaleString()} / ${row.monthlyTarget.toLocaleString()}`, 90, yPos);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 116, 139);
        pdf.text('Annual Progress:', 20, yPos + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(`${row.annualProgress.toFixed(1)}%`, 70, yPos + 5);
        pdf.text(`${row.annualActual.toLocaleString()} / ${row.annualTarget.toLocaleString()}`, 90, yPos + 5);

        yPos += 10;

        // Sub-indicators if they exist
        if (row.hasSubIndicators && row.subIndicators.length > 0) {
          row.subIndicators.forEach((sub) => {
            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = 20;
            }

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 116, 139);
            pdf.text(`  • ${sub.name}`, 25, yPos);
            pdf.text(`Monthly: ${sub.monthlyProgress.toFixed(1)}% (${sub.monthlyActual}/${sub.monthlyTarget})`, 100, yPos);
            pdf.text(`Annual: ${sub.annualProgress.toFixed(1)}% (${sub.annualActual}/${sub.annualTarget})`, 140, yPos);
            yPos += 5;
          });
        }

        yPos += 5;
      });

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      const fileName = `${selectedPillar.name.replace(/[^a-z0-9]/gi, '_')}_${selectedMonth}_${selectedQuarterId}_progress_report.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Pillar Progress
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            View progress for all indicators in a pillar by month and quarter
          </p>
        </div>
        {selectedMonth && selectedPillar && indicatorsWithProgress.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Dataset
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Pillar
            </label>
            <select
              value={selectedPillarId}
              onChange={(e) => {
                setSelectedPillarId(e.target.value);
                setSelectedMonth('');
              }}
              className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            >
              {PILLARS.map(pillar => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quarter Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Quarter
            </label>
            <select
              value={selectedQuarterId}
              onChange={(e) => {
                setSelectedQuarterId(e.target.value);
                setSelectedMonth('');
              }}
              className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            >
              {QUARTERS.map(quarter => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={availableMonths.length === 0}
              className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select Month</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Indicators Table */}
      {selectedMonth && selectedPillar ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">
              {selectedPillar.name} - {selectedMonth} Progress
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {indicatorsWithProgress.length} indicators
            </p>
          </div>

          {indicatorsWithProgress.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 font-medium">No indicators found for this pillar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                      Indicator Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Monthly Progress
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Annual Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {indicatorsWithProgress.map((row) => (
                    <React.Fragment key={row.indicatorId}>
                      <tr 
                        className={`hover:bg-slate-50 transition-colors ${row.hasSubIndicators ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (row.hasSubIndicators) {
                            setExpandedIndicators(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(row.indicatorId)) {
                                newSet.delete(row.indicatorId);
                              } else {
                                newSet.add(row.indicatorId);
                              }
                              return newSet;
                            });
                          }
                        }}
                      >
                        <td className="px-4 py-3 text-xs font-semibold text-slate-900 font-sans">
                          {row.indicatorNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className="text-xs font-medium text-slate-900 font-sans leading-tight">
                                {row.indicatorName}
                              </div>
                              {row.hasSubIndicators && (
                                <span className="text-[10px] text-slate-400 mt-0.5 block font-sans">
                                  (Composite - {row.subIndicators.length} sub-indicators)
                                </span>
                              )}
                            </div>
                            {row.hasSubIndicators && (
                              <svg 
                                className={`w-3 h-3 text-slate-400 transition-transform ${expandedIndicators.has(row.indicatorId) ? 'rotate-90' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center space-y-0.5">
                          <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(row.monthlyProgress)}`}
                              style={{ width: `${Math.min(row.monthlyProgress, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold font-sans ${getProgressColor(row.monthlyProgress).replace('bg-', 'text-')}`}>
                            {row.monthlyProgress.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {row.monthlyActual.toLocaleString()} / {row.monthlyTarget.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center space-y-0.5">
                          <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(row.annualProgress)}`}
                              style={{ width: `${Math.min(row.annualProgress, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold font-sans ${getProgressColor(row.annualProgress).replace('bg-', 'text-')}`}>
                            {row.annualProgress.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {row.annualActual.toLocaleString()} / {row.annualTarget.toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Sub-indicator rows */}
                    {row.hasSubIndicators && expandedIndicators.has(row.indicatorId) && row.subIndicators.map((sub, subIdx) => (
                      <tr key={`${row.indicatorId}-${sub.id}`} className="bg-slate-50/50 hover:bg-slate-100 transition-colors">
                        <td className="px-4 py-2 text-xs text-slate-500 font-sans">
                          <span className="ml-6 text-[10px]">•</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-xs font-medium text-slate-700 ml-6 font-sans leading-tight">
                            {sub.name}
                            <span className="text-[10px] text-slate-400 ml-1.5">(Sub)</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col items-center space-y-0.5">
                            <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(sub.monthlyProgress)}`}
                                style={{ width: `${Math.min(sub.monthlyProgress, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold font-sans ${getProgressColor(sub.monthlyProgress).replace('bg-', 'text-')}`}>
                              {sub.monthlyProgress.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {sub.monthlyActual.toLocaleString()} / {sub.monthlyTarget.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col items-center space-y-0.5">
                            <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(sub.annualProgress)}`}
                                style={{ width: `${Math.min(sub.annualProgress, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold font-sans ${getProgressColor(sub.annualProgress).replace('bg-', 'text-')}`}>
                              {sub.annualProgress.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {sub.annualActual.toLocaleString()} / {sub.annualTarget.toLocaleString()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500 font-medium">
            Please select a pillar, quarter, and month to view progress
          </p>
        </div>
      )}
    </div>
  );
};

export default PillarProgressView;
