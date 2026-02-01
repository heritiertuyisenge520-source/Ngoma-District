import React, { useState, useMemo, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import { PILLARS, INDICATORS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { API_ENDPOINTS, getSubmissionUrl } from '../config/api';
import { getIndicatorUnit } from '../utils/progressUtils';
import { authFetch, authPost } from '../utils/authFetch';
import { formatDate } from '../utils/dateUtils';

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

interface IndicatorAssignment {
  _id: string;
  indicatorId: string;
  indicatorName: string;
  pillarId: string;
  pillarName: string;
}

interface SubmissionPeriod {
  _id: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface FillFormViewProps {
  entries: MonitoringEntry[];
  onAddEntry: (entry: MonitoringEntry) => void;
  onClear: () => void;
  initialEntry?: MonitoringEntry | null;
  onCancelEdit?: () => void;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  userType?: 'super_admin' | 'head' | 'employee';
  userUnit?: string;
  assignedIndicators?: IndicatorAssignment[];
}

const FillFormView: React.FC<FillFormViewProps> = ({ entries, onAddEntry, onClear, initialEntry, onCancelEdit, userEmail, userName, userRole, userType, userUnit, assignedIndicators = [] }) => {
  const [selectedPillar, setSelectedPillar] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [quarterId, setQuarterId] = useState('');
  const [month, setMonth] = useState('');
  const [value, setValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [comments, setComments] = useState('');
  const [subValues, setSubValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditing, setIsEditing] = useState(!!initialEntry);
  const [isNotApplicable, setIsNotApplicable] = useState(false);

  // NEW: System status state
  const [systemStatus, setSystemStatus] = useState({
    isOpen: false,
    activePeriod: null as SubmissionPeriod | null,
    loading: true,
    checked: false
  });

  const selectedPillarData = PILLARS.find(p => p.id === selectedPillar);
  const selectedOutputData = selectedPillarData?.outputs.find(o => o.id === selectedOutput);
  const selectedIndicatorData = selectedOutputData?.indicators.find(i => i.id === selectedIndicator);

  // Check system status on component mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.SUBMISSION_PERIODS);
      if (response.ok) {
        const periods = await response.json();
        const now = new Date();
        const activePeriod = periods.find((p: SubmissionPeriod) => 
          p.isActive && 
          new Date(p.startDate) <= now && 
          new Date(p.endDate) >= now
        );

        setSystemStatus({
          isOpen: !!activePeriod,
          activePeriod: activePeriod,
          loading: false,
          checked: true
        });
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus(prev => ({ ...prev, loading: false, checked: true }));
    }
  };

  useEffect(() => {
    if (initialEntry) {
      setSelectedPillar(initialEntry.pillarId || '');
      setSelectedOutput(initialEntry.outputId || '');
      setSelectedIndicator(initialEntry.indicatorId || '');
      setQuarterId(initialEntry.quarterId || '');
      setMonth(initialEntry.month || '');
      setValue(initialEntry.value?.toString() || '');
      setTargetValue(initialEntry.targetValue?.toString() || '');
      setComments(initialEntry.comments || '');
      setSubValues(initialEntry.subValues ? Object.fromEntries(
        Object.entries(initialEntry.subValues).map(([k, v]) => [k, v.toString()])
      ) : {});
      setIsEditing(true);
    }
  }, [initialEntry]);

  const handleSubValueChange = (subIndicatorId: string, value: string) => {
    setSubValues(prev => ({
      ...prev,
      [subIndicatorId]: value
    }));
  };

  const handleNotApplicableChange = (checked: boolean) => {
    console.log('🔍 N/A Checkbox Debug:', {
      checked,
      currentValue: value,
      currentTargetValue: targetValue,
      currentSubValues: subValues
    });
    
    setIsNotApplicable(checked);
    if (checked) {
      // When N/A is checked, set both values to 0
      setValue('0');
      setTargetValue('0');
      // Also set all sub-values to 0 if they exist
      const resetSubValues: Record<string, string> = {};
      Object.keys(subValues).forEach(key => {
        resetSubValues[key] = '0';
      });
      setSubValues(resetSubValues);
      
      console.log('✅ N/A Applied - Values set to 0:', {
        newValue: '0',
        newTargetValue: '0',
        newSubValues: resetSubValues
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check system status first
    if (!systemStatus.isOpen) {
      setErrorMessage('Submissions are currently closed by the administrator. Please try again later.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const entryData: MonitoringEntry = {
        pillarId: selectedPillar,
        outputId: selectedOutput,
        indicatorId: selectedIndicator,
        quarterId,
        month,
        value: parseFloat(value) || 0,
        targetValue: parseFloat(targetValue) || 0,
        comments,
        timestamp: new Date().toISOString(),
        submittedBy: userEmail || '',
        pillarName: selectedPillarData?.name || '',
        indicatorName: selectedIndicatorData?.name || '',
        subValues: Object.fromEntries(
          Object.entries(subValues).map(([k, v]: [string, string]) => [k, parseFloat(v) || 0] as [string, number])
        ),
        isNotApplicable // Add the N/A flag to the submission
      };

      const response = await authPost(API_ENDPOINTS.SUBMISSIONS, entryData);

      if (response.ok) {
        setSuccessMessage('Progress data submitted successfully!');
        onAddEntry(entryData);
        resetForm();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to submit data. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      setErrorMessage('Error connecting to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPillar('');
    setSelectedOutput('');
    setSelectedIndicator('');
    setQuarterId('');
    setMonth('');
    setValue('');
    setTargetValue('');
    setComments('');
    setSubValues({});
    setIsNotApplicable(false); // Reset N/A checkbox
    setIsEditing(false);
    setErrorMessage('');
    if (onCancelEdit) onCancelEdit();
  };

  const assignedIndicatorsMap = useMemo(() => {
    const map = new Map<string, IndicatorAssignment>();
    assignedIndicators.forEach(assignment => {
      map.set(assignment.indicatorId, assignment);
    });
    return map;
  }, [assignedIndicators]);

  const filteredIndicators = useMemo(() => {
    if (userType === 'super_admin') return selectedOutputData?.indicators || [];
    
    return selectedOutputData?.indicators.filter(indicator => 
      assignedIndicatorsMap.has(indicator.id)
    ) || [];
  }, [selectedOutputData, userType, assignedIndicatorsMap]);

  // System Status Warning Component
  const SystemStatusWarning = () => {
    if (systemStatus.loading) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full"></div>
            <div>
              <h3 className="text-amber-800 font-bold">Checking System Status</h3>
              <p className="text-amber-700 text-sm">Verifying if submissions are currently allowed...</p>
            </div>
          </div>
        </div>
      );
    }

    if (!systemStatus.isOpen) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-red-800 font-bold text-lg">Submissions Closed</h3>
              <p className="text-red-700 mt-1">
                Submissions are currently closed by the administrator at this time. You cannot submit any progress data until the system is reopened.
              </p>
              {systemStatus.activePeriod && (
                <div className="mt-3 bg-red-100 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-medium">
                    Last submission period: {systemStatus.activePeriod.description}
                  </p>
                  <p className="text-red-700 text-xs">
                    Ended: {formatDate(systemStatus.activePeriod.endDate)}
                  </p>
                </div>
              )}
              <div className="mt-4 flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 text-sm">
                  Please contact your administrator if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="bg-emerald-100 rounded-full p-3 flex-shrink-0">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-emerald-800 font-bold text-lg">Submissions Open</h3>
            <p className="text-emerald-700 mt-1">
              The system is currently open for submissions. You can submit your progress data below.
            </p>
            {systemStatus.activePeriod && (
              <div className="mt-3 bg-emerald-100 rounded-lg p-3">
                <p className="text-emerald-800 text-sm font-medium">
                  Current submission period: {systemStatus.activePeriod.description}
                </p>
                <p className="text-emerald-700 text-xs">
                  Closes: {formatDate(systemStatus.activePeriod.endDate)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isEditing ? 'Edit Progress Data' : 'Submit Progress'}
          </h1>
          <p className="mt-2 text-slate-600 font-medium">
            {isEditing 
              ? 'Update your existing progress data entry below.'
              : 'Enter your progress data for the selected indicator and time period.'
            }
          </p>
        </div>
      </header>

      {/* System Status Warning */}
      <SystemStatusWarning />

      {/* Success Message */}
      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Success!</h3>
            <p className="text-slate-600">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage('')}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form - Only show if system is open or user is admin */}
      {(systemStatus.isOpen || userType === 'super_admin') ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pillar Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Pillar</label>
              <select
                value={selectedPillar}
                onChange={(e) => {
                  setSelectedPillar(e.target.value);
                  setSelectedOutput('');
                  setSelectedIndicator('');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                required
              >
                <option value="">Select a pillar</option>
                {PILLARS.map(pillar => (
                  <option key={pillar.id} value={pillar.id}>{pillar.name}</option>
                ))}
              </select>
            </div>

            {/* Output Selection */}
            {selectedPillar && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Output</label>
                <select
                  value={selectedOutput}
                  onChange={(e) => {
                    setSelectedOutput(e.target.value);
                    setSelectedIndicator('');
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                >
                  <option value="">Select an output</option>
                  {selectedPillarData?.outputs.map(output => (
                    <option key={output.id} value={output.id}>{output.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Indicator Selection */}
            {selectedOutput && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Indicator</label>
                <select
                  value={selectedIndicator}
                  onChange={(e) => setSelectedIndicator(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                >
                  <option value="">Select an indicator</option>
                  {filteredIndicators.map(indicator => (
                    <option key={indicator.id} value={indicator.id}>
                      {indicatorNumbering.get(indicator.id)}. {indicator.name}
                    </option>
                  ))}
                </select>
                {userType === 'employee' && filteredIndicators.length === 0 && (
                  <p className="text-amber-600 text-sm mt-2">
                    You haven't been assigned any indicators under this output.
                  </p>
                )}
              </div>
            )}

            {/* Period Selection */}
            {selectedIndicator && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Quarter</label>
                  <select
                    value={quarterId}
                    onChange={(e) => setQuarterId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  >
                    <option value="">Select quarter</option>
                    <option value="q1">Q1</option>
                    <option value="q2">Q2</option>
                    <option value="q3">Q3</option>
                    <option value="q4">Q4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    required
                  >
                    <option value="">Select month</option>
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>
              </div>
            )}

            {/* N/A Checkbox - Show as soon as indicator is selected */}
            {(() => {
              console.log('🔍 N/A Checkbox Rendering Debug:', {
                selectedIndicator,
                quarterId,
                month,
                shouldShow: !!selectedIndicator
              });
              return selectedIndicator;
            })() && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 shadow-md mb-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={isNotApplicable}
                    onChange={(e) => handleNotApplicableChange(e.target.checked)}
                    className="w-6 h-6 text-amber-600 border-2 border-amber-400 rounded focus:ring-4 focus:ring-amber-500 focus:ring-offset-2"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-amber-900 text-lg">🚫 N/A - Not Applicable (0/0 Progress)</span>
                    <p className="text-sm text-amber-800 mt-2 font-medium">
                      Use this ONLY when both numerator and denominator are 0. This will automatically calculate 0% progress.
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Perfect for indicators with no activity during this period.
                    </p>
                  </div>
                </div>
                
                {/* Show calculated progress when N/A is checked */}
                {isNotApplicable && (
                  <div className="mt-4 bg-amber-100 rounded-lg p-4 border-2 border-amber-400">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-amber-900">✅ Auto-Calculated Progress:</span>
                      <span className="text-2xl font-black text-amber-600">0%</span>
                    </div>
                    <div className="text-sm text-amber-800 mt-2 font-medium">
                      Numerator: 0 ÷ Denominator: 0 = 0% (N/A Status)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Value Input */}
            {selectedIndicator && quarterId && month && (
              <div>
                {selectedIndicatorData?.subIndicatorIds && Object.keys(selectedIndicatorData.subIndicatorIds).length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700">
                      Sub-Indicator Values {isNotApplicable && <span className="text-blue-600">(Auto-set to 0)</span>}
                    </h4>
                    {Object.entries(selectedIndicatorData.subIndicatorIds).map(([shortName, subIndicatorId]) => {
                      const subIndicator = INDICATORS.find(i => i.id === subIndicatorId);
                      return (
                        <div key={subIndicatorId}>
                          <label className="block text-sm font-medium text-slate-600 mb-1">
                            {shortName}: {subIndicator?.name}
                          </label>
                          <input
                            type="number"
                            value={subValues[subIndicatorId] || ''}
                            onChange={(e) => handleSubValueChange(subIndicatorId, e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="Enter value"
                            required
                            disabled={isNotApplicable}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Achieved Value {isNotApplicable && <span className="text-blue-600">(Auto-set to 0)</span>}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                      placeholder="Enter achieved value"
                      required
                      disabled={isNotApplicable}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Target Value */}
            {selectedIndicator && quarterId && month && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Target Value {isNotApplicable && <span className="text-blue-600">(Auto-set to 0)</span>}
                </label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Enter target value"
                  disabled={isNotApplicable}
                />
              </div>
            )}

            {/* Comments */}
            {selectedIndicator && quarterId && month && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Comments (Optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  rows={3}
                  placeholder="Add any comments or notes about this submission..."
                />
              </div>
            )}

            {/* Submit Buttons */}
            {selectedIndicator && quarterId && month && (
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  {isEditing ? 'Cancel Edit' : 'Clear Form'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!systemStatus.isOpen && userType !== 'super_admin')}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{isEditing ? 'Update Entry' : 'Submit Progress'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        !systemStatus.loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Form Unavailable</h3>
            <p className="text-slate-500 text-sm mt-2">
              The submission form is not available at this time.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default FillFormView;
