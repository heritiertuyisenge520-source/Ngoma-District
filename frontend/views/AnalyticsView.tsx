import React, { useState, useMemo, useRef } from 'react';
import { INDICATORS, PILLARS, QUARTERS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { calculateQuarterProgress, calculateAnnualProgress, getIndicatorUnit, parseValue } from '../utils/progressUtils';
import { formatDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';

interface AnalyticsViewProps {
  entries: MonitoringEntry[];
  userType?: 'super_admin' | 'head' | 'employee';
}

const indicatorNumbering = new Map<string, number>();
let indicatorCounter = 1;
PILLARS.forEach(pillar => {
  pillar.outputs.forEach(output => {
    output.indicators.forEach(indicator => {
      indicatorNumbering.set(indicator.id, indicatorCounter++);
    });
  });
});

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ entries, userType }) => {
  const [selectedPillarId, setSelectedPillarId] = useState<string>(PILLARS[0].id);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(QUARTERS[0].id);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const isAdmin = userType === 'super_admin';

  // Download all submissions as CSV
  const handleDownloadCSV = () => {
    if (entries.length === 0) {
      alert('No submissions to download');
      return;
    }

    const headers = ['#', 'Pillar', 'Indicator', 'Quarter', 'Month', 'Value', 'Submitted By', 'Date', 'Comments'];
    const csvContent = [
      headers.join(','),
      ...entries.map((entry, idx) => {
        const pillar = PILLARS.find(p => p.name === entry.pillarId || p.id === entry.pillarId || p.name === entry.pillarName);
        const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === entry.indicatorId);
        const indicatorNum = indicatorNumbering.get(entry.indicatorId) || 0;
        const quarter = QUARTERS.find(q => q.id === entry.quarterId);

        return [
          idx + 1,
          `"${entry.pillarName || entry.pillarId || ''}"`,
          `"${indicatorNum}. ${indicator?.name || entry.indicatorName || ''}"`,
          quarter?.name || entry.quarterId,
          entry.month,
          entry.value,
          `"${(entry as any).submittedBy || 'Unknown'}"`,
          formatDate(entry.timestamp),
          `"${(entry.comments || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `All_Submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group entries by indicator for efficiency
  const entriesByIndicator = useMemo(() => {
    const grouped: Record<string, MonitoringEntry[]> = {};
    if (!Array.isArray(entries)) return grouped;
    
    entries.forEach(e => {
      if (!grouped[e.indicatorId]) grouped[e.indicatorId] = [];
      grouped[e.indicatorId].push(e);
    });
    return grouped;
  }, [entries]);

  const selectedQuarter = useMemo(() => QUARTERS.find(q => q.id === selectedQuarterId), [selectedQuarterId]);
  const selectedPillar = useMemo(() => PILLARS.find(p => p.id === selectedPillarId), [selectedPillarId]);

  // Pillar level stats
  const pillarStats = useMemo(() => {
    return PILLARS.map(pillar => {
      const pillarIndicators = pillar.outputs.flatMap(o => o.indicators || []);
      if (pillarIndicators.length === 0) return { ...pillar, q: 0, a: 0 };

      let totalQuarterPerf = 0;
      const quarterId = selectedQuarter?.id || 'q1';

      // Calculate individual indicator performances
      const indicatorPerformances = pillarIndicators.map(indicator => {
        const indicatorEntries = entriesByIndicator[indicator.id] || [];
        const qResult = calculateQuarterProgress({
          indicator,
          entries: indicatorEntries,
          quarterId,
          monthsInQuarter: selectedQuarter?.months || []
        });
        
        // Determine if indicator has target for this quarter
        let hasTarget = false;
        if (quarterId === 'q1') {
          const t1 = parseValue(indicator.targets.q1);
          hasTarget = t1 > 0;
        } else if (quarterId === 'q2') {
          const t1 = parseValue(indicator.targets.q1);
          const t2 = parseValue(indicator.targets.q2);
          hasTarget = (t1 + t2) > 0;
        } else if (quarterId === 'q3') {
          const t1 = parseValue(indicator.targets.q1);
          const t2 = parseValue(indicator.targets.q2);
          const t3 = parseValue(indicator.targets.q3);
          hasTarget = (t1 + t2 + t3) > 0;
        } else if (quarterId === 'q4') {
          const t1 = parseValue(indicator.targets.q1);
          const t2 = parseValue(indicator.targets.q2);
          const t3 = parseValue(indicator.targets.q3);
          const t4 = parseValue(indicator.targets.q4);
          hasTarget = (t1 + t2 + t3 + t4) > 0;
        }
        
        return {
          indicator,
          performance: qResult.performance,
          hasTarget: hasTarget
        };
      });

      // Filter indicators with targets for this quarter
      const indicatorsWithTargets = indicatorPerformances.filter(ind => ind.hasTarget);
      
      // Sum only the performances of indicators that HAVE targets for this quarter
      totalQuarterPerf = indicatorsWithTargets.reduce((sum, ind) => sum + ind.performance, 0);

      // Quarterly Pillar Progress: Count only indicators with targets
      const quarterlyDenominator = indicatorsWithTargets.length;

      // Annual Pillar Progress: Sum of ALL indicator progress / ALL indicators
      // According to formula: Sum of Q2 progress / number of All indicators
      const totalAnnualPerf = indicatorPerformances.reduce((sum, ind) => sum + ind.performance, 0);
      const annualDenominator = pillarIndicators.length;

      const quarterProgress = quarterlyDenominator > 0 ? (totalQuarterPerf / quarterlyDenominator) : 0;
      const annualProgress = annualDenominator > 0 ? (totalAnnualPerf / annualDenominator) : 0;

      // DEBUG: Log calculation details for Economic Transformation pillar
      if (pillar.name === 'Economic Transformation' && quarterId === 'q2') {
        console.log('=== Economic Transformation Q2 Debug ===');
        console.log('Total Quarter Performance:', totalQuarterPerf);
        console.log('Quarterly Denominator:', quarterlyDenominator);
        console.log('Annual Denominator:', annualDenominator);
        console.log('Individual Indicators:');
        indicatorPerformances.forEach((ind, idx) => {
          const t1 = parseValue(ind.indicator.targets.q1);
          const t2 = parseValue(ind.indicator.targets.q2);
          const hasCumulativeTarget = (t1 + t2) > 0;
          console.log(`  ${idx + 1}. ${ind.indicator.name}: Performance=${ind.performance.toFixed(1)}%, Q1=${t1}, Q2=${t2}, Cumulative=${(t1 + t2)}, Counted=${hasCumulativeTarget}`);
        });
        console.log('Quarter Progress Calculation:', `${totalQuarterPerf} / ${quarterlyDenominator} = ${quarterProgress.toFixed(1)}%`);
        console.log('Annual Progress Calculation:', `${totalQuarterPerf} / ${annualDenominator} = ${annualProgress.toFixed(1)}%`);
        console.log('================================');
      }

      return {
        ...pillar,
        q: quarterProgress,
        a: annualProgress
      };
    });
  }, [entriesByIndicator, selectedQuarter]);

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

  const getPerformanceColor = (percentage: number) => {
    if (percentage < 50) return 'red';
    if (percentage <= 75) return 'amber';
    return 'emerald';
  };

  const getHexForColor = (color: string) => {
    switch (color) {
      case 'red': return '#ef4444';
      case 'rose': return '#e11d48';
      case 'amber': return '#f59e0b';
      case 'emerald': return '#10b981';
    }
    return '#6366f1';
  };

  const getMonthlyValue = (monthName: string) => {
    const indicatorEntries = entriesByIndicator[selectedIndicatorId] || [];
    const monthEntries = indicatorEntries.filter(e => e.month === monthName);

    if (selectedIndicator?.subIndicatorIds) {
      return monthEntries.reduce((acc, curr) => {
        if (curr.subValues) {
          return acc + (Object.values(curr.subValues) as number[]).reduce((a: number, b: number) => a + b, 0);
        }
        return acc;
      }, 0);
    }

    return monthEntries.reduce((acc, curr) => acc + curr.value, 0);
  };

  const latestSubmission = useMemo(() => {
    const indicatorEntries = entriesByIndicator[selectedIndicatorId] || [];
    if (indicatorEntries.length === 0) return null;
    const sorted = [...indicatorEntries].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0];
  }, [entriesByIndicator, selectedIndicatorId]);

  const quarterStats = useMemo(() => {
    if (!selectedIndicator || !selectedQuarter) return null;

    const result = calculateQuarterProgress({
      indicator: selectedIndicator,
      entries: entriesByIndicator[selectedIndicator.id] || [],
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
  }, [selectedIndicator, selectedQuarter, entriesByIndicator]);

  const annualCompletion = useMemo(() => {
    if (!selectedIndicator) return 0;
    
    // Handle sub-indicators: calculate average of annual sub-indicator progress
    if (selectedIndicator.subIndicatorIds) {
      const allIndicatorEntries = entriesByIndicator[selectedIndicator.id] || [];
      // Filter entries by selected quarter only (same as quarterly calculation)
      const quarterEntries = allIndicatorEntries.filter(entry => 
        entry.quarterId === selectedQuarterId
      );
      const subMapping = selectedIndicator.subIndicatorIds;
      let subAnnualPerformances: number[] = [];

      Object.entries(subMapping).forEach(([key, subId]) => {
        const subIndicator = INDICATORS.find(i => i.id === subId);
        if (subIndicator) {
          let subActual = 0;
          let subTarget = 0;

          // Special handling for indicators 69, 99, 101 that have database targets
          if (['69', '99', '101'].includes(selectedIndicator.id)) {
            const values = quarterEntries.reduce((acc, curr) => {
              // Use the same special handling as in quarterly calculation
              let actual = 0;
              let target = 0;
              
              if (selectedIndicator.id === '69') {
                actual = curr.subValues?.[`${key}_enrolled`] || 0;
                target = curr.subValues?.[`${key}_target`] || 0;
              } else if (selectedIndicator.id === '99') {
                actual = curr.subValues?.[`${key}_accurate`] || 0;
                target = curr.subValues?.[`${key}_target`] || 0;
              } else if (selectedIndicator.id === '101') {
                actual = curr.subValues?.[`${key}_attending`] || 0;
                target = curr.subValues?.[`${key}_target`] || 0;
              }
              
              return {
                actual: acc.actual + actual,
                target: acc.target + target
              };
            }, {actual: 0, target: 0});
            
            subActual = values.actual;
            subTarget = values.target;
          } else {
            // Regular sub-indicator calculation
            subActual = quarterEntries.reduce((acc, curr) => {
              return acc + (curr.subValues?.[key] || 0);
            }, 0);
            subTarget = parseValue(subIndicator.targets.annual);
          }
          
          if (subTarget > 0) {
            let subPerf = 0;
            
            if (['69', '99', '101'].includes(selectedIndicator.id)) {
              // For percentage indicators: calculate actual percentage and compare to annual target percentage
              const calculatedPercentage = (subActual / subTarget) * 100;
              const annualTargetPercentage = parseValue(subIndicator.targets.annual);
              
              if (annualTargetPercentage > 0) {
                subPerf = Math.min((calculatedPercentage / annualTargetPercentage) * 100, 100);
              } else {
                subPerf = calculatedPercentage;
              }
            } else {
              // Regular calculation for other indicators
              subPerf = (subActual / subTarget) * 100;
              if (subIndicator.measurementType === 'decreasing') {
                subPerf = subActual > 0 ? (subTarget / subActual) * 100 : 100;
              }
            }
            
            subAnnualPerformances.push(Math.min(subPerf, 100));
          }
        }
      });

      if (subAnnualPerformances.length > 0) {
        // Return average of sub-indicator annual performances
        return subAnnualPerformances.reduce((a, b) => a + b, 0) / subAnnualPerformances.length;
      }
    }
    
    // Regular indicator (non-sub-indicator) logic
    // Get entries for the selected quarter only (not cumulative)
    const allIndicatorEntries = entriesByIndicator[selectedIndicator.id] || [];
    const quarterEntries = allIndicatorEntries.filter(entry => 
      entry.quarterId === selectedQuarterId
    );
    
    // For annual progress, use the current quarter's actual value divided by annual target
    // This matches the requirement: Q1 actual / annual target, Q2 actual / annual target, etc.
    const currentQuarterActual = quarterEntries.length > 0 
      ? Math.max(...quarterEntries.map(e => e.value)) // Use latest value in the quarter
      : 0;
    
    const annualTarget = parseValue(selectedIndicator.targets.annual);
    
    if (annualTarget === 0) return 0;
    
    const performance = (currentQuarterActual / annualTarget) * 100;
    return Math.min(performance, 100);
  }, [selectedIndicator, entriesByIndicator, selectedQuarterId, selectedQuarter]);

  const qColor = quarterStats ? getPerformanceColor(quarterStats.performance) : 'blue';

  // Download entire dashboard as PDF
  const handleDownloadDashboardPDF = async () => {
    setIsGeneratingReport(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dashboard Report', pageWidth / 2, 22, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${selectedQuarter?.name || 'Quarter'} Performance Summary`, pageWidth / 2, 34, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, 44, { align: 'center' });

      let yPos = 60;

      // Summary Stats
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Performance', 15, yPos);
      yPos += 8;

      const overallQuarter = pillarStats.reduce((acc, p) => acc + Math.min(p.q, 100), 0) / pillarStats.length;
      const overallAnnual = pillarStats.reduce((acc, p) => acc + Math.min(p.a, 100), 0) / pillarStats.length;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Quarter Progress', 25, yPos + 10);
      pdf.text('Annual Progress', 100, yPos + 10);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(overallQuarter >= 80 ? 16 : overallQuarter >= 50 ? 245 : 239, overallQuarter >= 80 ? 185 : overallQuarter >= 50 ? 158 : 68, overallQuarter >= 80 ? 129 : overallQuarter >= 50 ? 11 : 68);
      pdf.text(`${Math.round(overallQuarter)}%`, 25, yPos + 20);
      pdf.setTextColor(59, 130, 246);
      pdf.text(`${Math.round(overallAnnual)}%`, 100, yPos + 20);

      yPos += 35;

      // Pillar Details
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pillar Performance', 15, yPos);
      yPos += 8;

      pillarStats.forEach((pillar, idx) => {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = 20;
        }

        const q = Math.min(pillar.q, 100);
        const a = Math.min(pillar.a, 100);

        pdf.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        pdf.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, 'F');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 41, 59);
        pdf.text(`${idx + 1}. ${pillar.name}`, 20, yPos + 11);

        pdf.setFontSize(11);
        pdf.setTextColor(q >= 80 ? 16 : q >= 50 ? 245 : 239, q >= 80 ? 185 : q >= 50 ? 158 : 68, q >= 80 ? 129 : q >= 50 ? 11 : 68);
        pdf.text(`Q: ${Math.round(q)}%`, pageWidth - 60, yPos + 11);

        pdf.setTextColor(59, 130, 246);
        pdf.text(`A: ${Math.round(a)}%`, pageWidth - 35, yPos + 11);

        yPos += 20;
      });

      // Add new page for selected indicator details if available
      if (selectedIndicator && quarterStats) {
        pdf.addPage();
        yPos = 20;

        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Selected Indicator Details', 15, yPos);
        yPos += 10;

        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');

        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Indicator', 20, yPos + 10);
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(selectedIndicator.name, 20, yPos + 20);

        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Performance', 20, yPos + 28);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text(`${Math.round(Math.min(quarterStats.performance, 100))}%`, 55, yPos + 28);

        yPos += 45;

        // Monthly breakdown
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Monthly Values', 15, yPos);
        yPos += 8;

        quarterStats.months.forEach((month, idx) => {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 116, 139);
          pdf.text(`${month}:`, 20, yPos);
          pdf.setTextColor(30, 41, 59);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${quarterStats.monthlyValues[idx]?.toLocaleString() || 0}`, 50, yPos);
          yPos += 8;
        });
      }

      pdf.save(`Dashboard_Report_${selectedQuarter?.name || 'Q'}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating dashboard PDF:', error);
    }
    setIsGeneratingReport(false);
  };

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
      pdf.text(`Generated: ${formatDate(new Date())}`, pageWidth / 2, 38, { align: 'center' });

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
    <div ref={reportRef} className="space-y-8 w-full relative">
      {/* Top Right Controls - Quarter Select and Download Button */}
      <div className="fixed top-20 right-6 z-50 flex items-center gap-3">
        {/* Quarter Select */}
        <div className="relative">
          <select
            value={selectedQuarterId}
            onChange={(e) => setSelectedQuarterId(e.target.value)}
            className="h-11 px-4 pr-10 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-sm font-semibold shadow-lg hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none appearance-none cursor-pointer"
          >
            {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
          </select>
          <svg className="w-5 h-5 absolute right-3 top-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {/* PDF Download Icon Button */}
        <button
          onClick={handleDownloadDashboardPDF}
          disabled={isGeneratingReport}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:shadow-xl group"
          title={isGeneratingReport ? 'Generating PDF...' : 'Download Dashboard PDF'}
        >
          {isGeneratingReport ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </button>
      </div>

      {/* Part 1: Pillar Progress Overview (Pie Charts) */}
      <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="px-8 pt-6 pb-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-1">
              Pillar Progress
            </h2>
            <p className="text-xs text-slate-400 font-medium">Quarter-based progress updates instantly from the dropdown.</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {pillarStats.map((pillar, index) => {
            const qColor = getPerformanceColor(pillar.q);
            const aColor = getPerformanceColor(pillar.a);

            return (
              <div
                key={pillar.id}
                className="bg-slate-50 rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm animate-in slide-in-from-left hover:border-blue-300 transition-colors duration-300"
                style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{pillar.name}</h3>
                        <p className="text-sm text-slate-500">Quarter: {selectedQuarter?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 w-full justify-center lg:justify-end">
                    {/* Quarter Pie */}
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r="40" fill="none"
                            stroke={getHexForColor(qColor)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="251"
                            strokeDashoffset={251 - (251 * Math.min(pillar.q, 100)) / 100}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-black text-slate-800">{Math.round(Math.min(pillar.q, 100))}%</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Quarter</p>
                    </div>

                    {/* Annual Pie */}
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r="40" fill="none"
                            stroke={getHexForColor(aColor)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="251"
                            strokeDashoffset={251 - (251 * Math.min(pillar.a, 100)) / 100}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-black text-slate-800">{Math.round(Math.min(pillar.a, 100))}%</span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">Annual</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600 mb-2">
                      <span>Quarter Progress</span>
                      <span style={{ color: getHexForColor(qColor) }}>{Math.round(Math.min(pillar.q, 100))}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(pillar.q, 100)}%`, backgroundColor: getHexForColor(qColor) }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm font-semibold text-slate-600 mb-2">
                      <span>Annual Progress</span>
                      <span style={{ color: getHexForColor(aColor) }}>{Math.round(Math.min(pillar.a, 100))}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(pillar.a, 100)}%`, backgroundColor: getHexForColor(aColor) }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Quarter Filter Card */}
        <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm hover:border-blue-300 transition-colors duration-300">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Quarter</label>
            <select value={selectedQuarterId} onChange={(e) => setSelectedQuarterId(e.target.value)} className={inputClasses}>
              {QUARTERS.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
        </div>
        
        {/* Pillar Filter Card */}
        <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm hover:border-blue-300 transition-colors duration-300">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Pillar</label>
            <select value={selectedPillarId} onChange={(e) => setSelectedPillarId(e.target.value)} className={inputClasses}>
              {PILLARS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        
        {/* Indicator Filter Card */}
        <div className="bg-white rounded-xl p-4 border-2 border-slate-200 shadow-sm hover:border-blue-300 transition-colors duration-300 sm:col-span-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">Indicator</label>
            <select value={selectedIndicatorId} onChange={(e) => setSelectedIndicatorId(e.target.value)} className={inputClasses} disabled={availableIndicators.length === 0}>
              {availableIndicators.length === 0 ? (
                <option value="">-- No indicators available --</option>
              ) : (
                availableIndicators.map(i => <option key={i.id} value={i.id}>{indicatorNumbering.get(i.id)}. {i.name} {getIndicatorUnit(i as Indicator)}</option>)
              )}
            </select>
          </div>
        </div>
      </div>

      {quarterStats && selectedIndicator && (
        <div className="space-y-5">
          {/* Monthly Progress Chart - MOVED TO TOP with increased height */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Monthly Breakdown</p>
                  <h3 className="text-lg font-bold text-white">{selectedQuarter?.name}</h3>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 bg-white/10 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-white/80 font-semibold uppercase">Live</span>
                </div>
              </div>


              {/* Bar Chart - INCREASED HEIGHT */}
              {(() => {
                const getSubIndicatorMonthlyValues = (monthName: string) => {
                  if (!selectedIndicator?.subIndicatorIds) return [];
                  
                  const indicatorEntries = entriesByIndicator[selectedIndicatorId] || [];
                  const monthEntries = indicatorEntries.filter(e => e.month === monthName);
                  
                  return Object.entries(selectedIndicator.subIndicatorIds).map(([key, subId]) => {
                    const subIndicator = INDICATORS.find(ind => ind.id === subId);
                    const subMonthlyValue = monthEntries.reduce((acc, curr) => {
                      return acc + (curr.subValues?.[key] || 0);
                    }, 0);
                    
                    return {
                      id: subId,
                      name: subIndicator?.name || key,
                      value: subMonthlyValue,
                      color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Object.keys(selectedIndicator.subIndicatorIds).indexOf(key)]
                    };
                  });
                };
                
                const hasSubIndicators = selectedIndicator?.subIndicatorIds;
                
                return (
                  <div className="flex items-end justify-around gap-4 h-80">
                    {quarterStats.months.map((month, idx) => {
                      const val = quarterStats.monthlyValues[idx];
                      const maxVal = Math.max(...quarterStats.monthlyValues, 1);
                      const heightPercent = Math.max((val / maxVal) * 100, 10);
                      const expected = quarterStats.target / 3;
                      const mPerf = Math.min((val / expected) * 100, 100);
                      const mColor = getPerformanceColor(mPerf);
                      
                      const subValues = getSubIndicatorMonthlyValues(month);
                      
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center group cursor-pointer">
                          <div className="text-sm font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {val.toLocaleString()}
                          </div>
                          <div className="w-full flex items-end h-64">
                            {hasSubIndicators ? (
                              // Show stacked bars for sub-indicators
                              <div className="w-full flex flex-col justify-end">
                                {subValues.map((sub, subIdx) => {
                                  const subHeight = maxVal > 0 ? (sub.value / maxVal) * 100 : 0;
                                  return (
                                    <div
                                      key={sub.id}
                                      className="w-full transition-all duration-300 group-hover:scale-105" 
                                      style={{
                                        height: `${Math.max(subHeight, 2)}%`,
                                        backgroundColor: sub.color,
                                        opacity: 0.8
                                      }}
                                      title={`${sub.name}: ${sub.value.toLocaleString()}`}
                                    />
                                  );
                                })}
                              </div>
                            ) : (
                              // Show single bar for regular indicators
                              <div
                                className="w-full rounded-t-xl transition-all duration-300 group-hover:scale-105"
                                style={{
                                  height: `${heightPercent}%`,
                                  background: `linear-gradient(180deg, ${getHexForColor(mColor)} 0%, ${getHexForColor(mColor)}80 100%)`,
                                  boxShadow: `0 0 20px ${getHexForColor(mColor)}40`
                                }}
                              />
                            )}
                          </div>
                          <span className={`text-xs font-semibold mt-3 uppercase tracking-wide transition-colors ${hoveredMonth === month ? 'text-white' : 'text-slate-400'}`}
                            onMouseEnter={() => setHoveredMonth(month)}
                            onMouseLeave={() => setHoveredMonth(null)}>
                            {month.substring(0, 3)}
                          </span>
                          
                          {/* Sub-indicator legend */}
                          {hasSubIndicators && idx === 0 && (
                            <div className="mt-2 space-y-1">
                              {subValues.slice(0, 3).map((sub, subIdx) => (
                                <div key={sub.id} className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color }} />
                                  <span className="text-xs text-slate-400 truncate">{sub.name.split(' ').slice(0, 2).join(' ')}</span>
                                </div>
                              ))}
                              {subValues.length > 3 && <span className="text-xs text-slate-400">+{subValues.length - 3} more</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Quarter & Annual Progress Side by Side - NOW BELOW BAR CHART */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quarterly Progress - LEFT */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Quarter Progress</p>
              <div className="flex items-center gap-5">
                {/* Progress Ring - Smaller */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke={getHexForColor(qColor)}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (251 * Math.min(quarterStats.performance, 100)) / 100}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-800">{Math.round(Math.min(quarterStats.performance, 100))}%</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="flex-1 space-y-2">
                  {selectedIndicator?.subIndicatorIds ? (
                    // Parent indicator with sub-indicators - show average info instead of target
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-600 font-medium">Average of Sub-indicators</span>
                      <span className="text-sm font-bold text-blue-700">{Math.round(quarterStats.performance)}%</span>
                    </div>
                  ) : (
                    // Regular indicator - show target and actual
                    <>
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs text-slate-500">Target</span>
                        <span className="text-sm font-bold text-slate-700">{quarterStats.target.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs text-slate-500">Actual</span>
                        <span className="text-sm font-bold text-slate-700">{quarterStats.totalActual.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Annual Progress - RIGHT */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Annual Progress</p>
              <div className="flex items-center gap-5">
                {/* Progress Ring - Same size as Quarter */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="#6366f1"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="251"
                      strokeDashoffset={251 - (251 * Math.min(annualCompletion, 100)) / 100}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-800">{Math.round(annualCompletion)}%</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="flex-1 space-y-2">
                  {selectedIndicator?.subIndicatorIds ? (
                    // Parent indicator with sub-indicators - show average info instead of target
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                      <span className="text-xs text-blue-600 font-medium">Average of Sub-indicators</span>
                      <span className="text-sm font-bold text-blue-700">{Math.round(annualCompletion)}%</span>
                    </div>
                  ) : (
                    // Regular indicator - show target and actual
                    <>
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs text-slate-500">Target</span>
                        <span className="text-sm font-bold text-slate-700">{parseValue(selectedIndicator.targets.annual).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                        <span className="text-xs text-slate-500">Actual</span>
                        <span className="text-sm font-bold text-slate-700">{quarterStats.totalActual.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Info - Compact */}
          {latestSubmission && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {latestSubmission.submittedBy?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Submitted by</p>
                    <p className="text-sm font-semibold text-slate-700">{latestSubmission.submittedBy || 'Unknown'}</p>
                  </div>
                </div>
                {latestSubmission.comments && (
                  <div className="flex-1 min-w-0 px-4 border-l border-slate-100">
                    <p className="text-sm text-slate-600 truncate">"{latestSubmission.comments}"</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase">Date</p>
                  <p className="text-sm text-slate-500">{formatDate(latestSubmission.timestamp)}</p>
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
                      {Math.round(Math.min(sub.performance, 100))}%
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-slate-700 leading-snug mb-3 line-clamp-2">{sub.name}</h4>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-600 font-medium mb-1">Quarterly Progress</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${subColor}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(sub.performance, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {(() => {
                          const parentIndicator = INDICATORS.find(ind => 
                            ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
                          );
                          
                          // For percentage indicators 69, 99, 101, show calculated percentage
                          if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id)) {
                            const calculatedPercentage = sub.calculatedPercentage || 0;
                            return `${calculatedPercentage.toFixed(1)}% achieved`;
                          }
                          
                          return `${sub.actual.toLocaleString()} actual`;
                        })()}
                      </span>
                      <span>
                        {(() => {
                          const subIndicatorData = INDICATORS.find(ind => ind.id === sub.id);
                          const parentIndicator = INDICATORS.find(ind => 
                            ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
                          );
                          
                          // Check if this is a percentage sub-indicator from indicators 69, 99, or 101
                          if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id) && subIndicatorData) {
                            const quarterId = selectedQuarter?.id || 'q1';
                            const percentageTarget = parseValue((subIndicatorData.targets as any)[quarterId]);
                            return `${percentageTarget}% quarterly target`;
                          }
                          
                          return `${sub.target.toLocaleString()} quarterly target`;
                        })()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium mb-1 mt-2">Annual Progress</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      {(() => {
                        const subIndicatorData = INDICATORS.find(ind => ind.id === sub.id);
                        const parentIndicator = INDICATORS.find(ind => 
                          ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
                        );
                        
                        let subAnnualProgress = 0;
                        
                        // For percentage indicators 69, 99, 101, use calculated percentage vs annual target
                        if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id) && subIndicatorData) {
                          const calculatedPercentage = sub.calculatedPercentage || 0;
                          const annualTargetPercentage = parseValue(subIndicatorData.targets.annual || 0);
                          
                          if (annualTargetPercentage > 0) {
                            // Performance is how well the calculated percentage meets the annual target percentage
                            subAnnualProgress = Math.min((calculatedPercentage / annualTargetPercentage) * 100, 100);
                          } else {
                            subAnnualProgress = calculatedPercentage; // No annual target, show raw percentage
                          }
                        } else {
                          // Regular calculation for other indicators
                          const subAnnualTarget = parseValue(subIndicatorData?.targets.annual || 0);
                          subAnnualProgress = subAnnualTarget > 0 ? Math.min((sub.actual / subAnnualTarget) * 100, 100) : 0;
                        }
                        
                        const subAnnualColor = getPerformanceColor(subAnnualProgress);
                        return (
                          <div
                            className={`h-full bg-${subAnnualColor}-500 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(subAnnualProgress, 100)}%` }}
                          ></div>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>
                        {(() => {
                          const parentIndicator = INDICATORS.find(ind => 
                            ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
                          );
                          
                          // For percentage indicators 69, 99, 101, show calculated percentage
                          if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id)) {
                            const calculatedPercentage = sub.calculatedPercentage || 0;
                            return `${calculatedPercentage.toFixed(1)}% achieved`;
                          }
                          
                          return `${sub.actual.toLocaleString()} actual`;
                        })()}
                      </span>
                      <span>
                        {(() => {
                          const subIndicatorData = INDICATORS.find(ind => ind.id === sub.id);
                          const parentIndicator = INDICATORS.find(ind => 
                            ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
                          );
                          
                          // Check if this is a percentage sub-indicator from indicators 69, 99, or 101
                          if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id) && subIndicatorData) {
                            const annualTargetPercentage = parseValue(subIndicatorData.targets.annual || 0);
                            return `${annualTargetPercentage}% annual target`;
                          }
                          
                          const subAnnualTarget = parseValue(subIndicatorData?.targets.annual || 0);
                          return `${subAnnualTarget.toLocaleString()} annual target`;
                        })()}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Annual: {(() => {
                        const parentIndicator = INDICATORS.find(ind => 
                          ind.subIndicatorIds && Object.values(ind.subIndicatorIds).includes(sub.id)
                        );
                        
                        if (parentIndicator && ['69', '99', '101'].includes(parentIndicator.id)) {
                          // Use calculated percentage for indicators 69, 99, 101
                          const calculatedPercentage = sub.calculatedPercentage || 0;
                          const subIndicatorData = INDICATORS.find(ind => ind.id === sub.id);
                          const annualTargetPercentage = parseValue(subIndicatorData?.targets.annual || 0);
                          return `${calculatedPercentage.toFixed(1)}% of ${annualTargetPercentage}%`;
                        } else {
                          // Regular calculation for other indicators
                          const subIndicatorData = INDICATORS.find(ind => ind.id === sub.id);
                          const subAnnualTarget = parseValue(subIndicatorData?.targets.annual || 0);
                          const subAnnualProgress = subAnnualTarget > 0 ? Math.min(Math.round((sub.actual / subAnnualTarget) * 100), 100) : 0;
                          return `${subAnnualProgress}% of ${subAnnualTarget.toLocaleString()}`;
                        }
                      })()}</span>
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

