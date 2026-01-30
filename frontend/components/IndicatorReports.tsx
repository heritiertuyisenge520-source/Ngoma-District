import React, { useState, useEffect, useMemo } from 'react';
import { INDICATORS, PILLARS } from '../data';
import { calculateQuarterProgress, calculateAnnualProgress } from '../utils/progressUtils';

interface IndicatorReport {
  id: string;
  name: string;
  monthlyProgress: number;
  annualProgress: number;
  monthlyTarget: number;
  annualTarget: number;
  measurementType: string;
}

interface IndicatorReportsProps {
  entries: any[];
}

const IndicatorReports: React.FC<IndicatorReportsProps> = ({ entries }) => {
  const [selectedPillar, setSelectedPillar] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Get unique pillars from PILLARS structure
  const pillars = useMemo(() => {
    return PILLARS.map(pillar => pillar.name);
  }, []);

  // Get months for the selected year
  const months = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames;
  }, []);

  // Get years (current year and previous year)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear.toString(), (currentYear - 1).toString()];
  }, []);

  // Filter indicators by selected pillar
  const pillarIndicators = useMemo(() => {
    if (!selectedPillar) return [];
    
    const pillar = PILLARS.find(p => p.name === selectedPillar);
    if (!pillar) return [];
    
    // Extract all indicators from this pillar's outputs
    return pillar.outputs.flatMap(output => output.indicators || []);
  }, [selectedPillar]);

  // Calculate progress for each indicator
  const indicatorReports = useMemo(() => {
    if (!selectedPillar || !selectedMonth || !selectedYear) return [];

    return pillarIndicators.map(indicator => {
      // Get entries for this indicator
      const indicatorEntries = entries.filter(entry => 
        entry.indicatorId === indicator.id &&
        entry.month === selectedMonth &&
        entry.year === selectedYear
      );

      // Calculate monthly progress
      let monthlyProgress = 0;
      let monthlyTarget = 0;

      if (indicatorEntries.length > 0) {
        const latestEntry = indicatorEntries[indicatorEntries.length - 1];
        monthlyTarget = latestEntry.targetValue || 0;
        
        if (monthlyTarget > 0) {
          monthlyProgress = Math.min((latestEntry.value / monthlyTarget) * 100, 100);
        }
      }

      // Calculate annual progress
      const annualEntries = entries.filter(entry => 
        entry.indicatorId === indicator.id &&
        entry.year === selectedYear
      );
      
      const annualProgress = calculateAnnualProgress(indicator, annualEntries);
      const annualTarget = indicator.targets.annual;

      return {
        id: indicator.id,
        name: indicator.name,
        monthlyProgress,
        annualProgress,
        monthlyTarget,
        annualTarget,
        measurementType: indicator.measurementType
      };
    });
  }, [pillarIndicators, selectedMonth, selectedYear, entries]);

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'green';
    if (progress >= 70) return 'yellow';
    return 'red';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Indicator Reports</h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Pillar
            </label>
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a pillar...</option>
              {pillars.map(pillar => (
                <option key={pillar} value={pillar}>{pillar}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a month...</option>
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {selectedPillar && selectedMonth && selectedYear && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedPillar} - {selectedMonth} {selectedYear}
          </h2>

          {indicatorReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No indicators found for this pillar or no data available for the selected period.
            </div>
          ) : (
            <div className="space-y-4">
              {indicatorReports.map((report) => (
                <div key={report.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900 flex-1">{report.name}</h3>
                    <span className="text-xs text-gray-500 ml-4">ID: {report.id}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Monthly Progress</span>
                        <span className={`text-sm font-bold ${
                          report.monthlyProgress >= 90 ? 'text-green-600' :
                          report.monthlyProgress >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {report.monthlyProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            report.monthlyProgress >= 90 ? 'bg-green-500' :
                            report.monthlyProgress >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(report.monthlyProgress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Target: {report.monthlyTarget.toLocaleString()}
                      </div>
                    </div>

                    {/* Annual Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Annual Progress</span>
                        <span className={`text-sm font-bold ${
                          report.annualProgress >= 90 ? 'text-green-600' :
                          report.annualProgress >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {report.annualProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            report.annualProgress >= 90 ? 'bg-green-500' :
                            report.annualProgress >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(report.annualProgress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Target: {report.annualTarget.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IndicatorReports;
