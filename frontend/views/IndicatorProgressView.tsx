import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { authGet } from '../utils/authFetch';

interface IndicatorProgress {
  indicatorId: string;
  indicatorName: string;
  pillarName: string;
  quarterlyProgress: {
    q1: { actual: number; target: number; percentage: number };
    q2: { actual: number; target: number; percentage: number };
    q3: { actual: number; target: number; percentage: number };
    q4: { actual: number; target: number; percentage: number };
  };
  annualProgress: {
    actual: number;
    target: number;
    percentage: number;
  };
  status: 'completed' | 'on-track' | 'behind' | 'not-started';
}

interface IndicatorProgressViewProps {
  user: {
    email: string;
    userType: 'super_admin' | 'head' | 'employee';
  };
}

const IndicatorProgressView: React.FC<IndicatorProgressViewProps> = ({ user }) => {
  const [progressData, setProgressData] = useState<IndicatorProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorProgress | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authGet(`/api/analytics/employee-progress/${user.email}`);
      
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      } else {
        throw new Error('Failed to fetch progress data');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching progress data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'on-track':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'behind':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'not-started':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchProgressData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Indicator Progress</h1>
          <p className="text-gray-600">Track your assigned indicators' performance by quarter and annually</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Indicators</div>
            <div className="text-2xl font-bold text-gray-900">{progressData.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {progressData.filter(p => p.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">On Track</div>
            <div className="text-2xl font-bold text-blue-600">
              {progressData.filter(p => p.status === 'on-track').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Behind</div>
            <div className="text-2xl font-bold text-red-600">
              {progressData.filter(p => p.status === 'behind').length}
            </div>
          </div>
        </div>

        {/* Indicators List */}
        <div className="space-y-4">
          {progressData.map((indicator) => (
            <div
              key={indicator.indicatorId}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedIndicator(indicator)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{indicator.indicatorName}</h3>
                    <p className="text-sm text-gray-600">{indicator.pillarName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(indicator.status)}`}>
                    {indicator.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Annual Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Annual Progress</span>
                    <span className="text-sm font-bold text-gray-900">
                      {indicator.annualProgress.actual} / {indicator.annualProgress.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(indicator.annualProgress.percentage)}`}
                      style={{ width: `${Math.min(indicator.annualProgress.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs font-medium text-gray-600">
                      {formatPercentage(indicator.annualProgress.percentage)}
                    </span>
                  </div>
                </div>

                {/* Quarterly Progress */}
                <div className="grid grid-cols-4 gap-2">
                  {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => {
                    const progress = indicator.quarterlyProgress[quarter];
                    return (
                      <div key={quarter} className="text-center">
                        <div className="text-xs font-medium text-gray-500 mb-1 uppercase">{quarter}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mb-1">
                          <div
                            className={`h-1 rounded-full ${getProgressColor(progress.percentage)}`}
                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          {progress.actual}/{progress.target}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatPercentage(progress.percentage)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedIndicator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedIndicator.indicatorName}</h2>
                    <p className="text-gray-600">{selectedIndicator.pillarName}</p>
                  </div>
                  <button
                    onClick={() => setSelectedIndicator(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Annual Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Performance</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedIndicator.status)}`}>
                        {selectedIndicator.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Achievement</span>
                      <span className="text-lg font-bold text-gray-900">
                        {selectedIndicator.annualProgress.actual} / {selectedIndicator.annualProgress.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedIndicator.annualProgress.percentage)}`}
                        style={{ width: `${Math.min(selectedIndicator.annualProgress.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPercentage(selectedIndicator.annualProgress.percentage)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quarterly Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => {
                      const progress = selectedIndicator.quarterlyProgress[quarter];
                      return (
                        <div key={quarter} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900 uppercase">{quarter}</span>
                            <span className="text-sm font-bold text-gray-900">
                              {formatPercentage(progress.percentage)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {progress.actual} of {progress.target} achieved
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(progress.percentage)}`}
                              style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndicatorProgressView;
