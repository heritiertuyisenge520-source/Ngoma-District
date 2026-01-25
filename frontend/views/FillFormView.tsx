import React, { useState, useMemo, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import { PILLARS, INDICATORS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { API_ENDPOINTS, getSubmissionUrl } from '../config/api';
import { getIndicatorUnit } from '../utils/progressUtils';
import { authFetch, authPost } from '../utils/authFetch';

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
  const [pillarName, setPillarName] = useState('');
  const [indicatorId, setIndicatorId] = useState('');
  const [quarterId, setQuarterId] = useState('');
  const [month, setMonth] = useState('');
  const [targetValue, setTargetValue] = useState<string>('');
  const [achievementValue, setAchievementValue] = useState<string>('');
  const [comments, setComments] = useState('');
  const [showPercentageOnlyInput, setShowPercentageOnlyInput] = useState(false);

  // Set default to percentage-only for percentage-based indicators
  useEffect(() => {
    // This effect will run after the component renders and selectedIndicator is available
    // We need to check if selectedIndicator exists first
    if (selectedIndicator?.measurementType === 'percentage' &&
      !['74', '83', '87', '88', '101', '132', '69', '99', '67', '89', '43'].includes(indicatorId)) {
      setShowPercentageOnlyInput(false); // Force 3-box system for non-construction percentage indicators
    }
  }, [indicatorId]); // Remove selectedIndicator from dependencies to avoid the initialization issue

  // Submission period state
  const [submissionPeriod, setSubmissionPeriod] = useState<SubmissionPeriod | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(true);
  const [isLoadingSubmissionPeriod, setIsLoadingSubmissionPeriod] = useState(true);
  const [submissionPeriodError, setSubmissionPeriodError] = useState<string | null>(null);

  // Success message state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Duplicate submission detection state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<'edit' | 'increment' | null>(null);
  
  // Modal interaction state
  const [modalEditMode, setModalEditMode] = useState(false);
  const [modalValue, setModalValue] = useState('');
  const [modalComments, setModalComments] = useState('');
  const [modalSubValues, setModalSubValues] = useState<Record<string, string>>({});

  // Supporting documents state
  const [supportingDocuments, setSupportingDocuments] = useState<Array<{ url: string, publicId: string, format: string, originalName: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Fetch submission period on mount
  useEffect(() => {
    const fetchSubmissionPeriod = async () => {
      try {
        setIsLoadingSubmissionPeriod(true);
        setSubmissionPeriodError(null);
        const response = await fetch(API_ENDPOINTS.SUBMISSION_PERIOD_CURRENT);
        if (response.ok) {
          const data = await response.json();
          setSubmissionPeriod(data);
        } else {
          setSubmissionPeriodError('Failed to load submission period. Please refresh the page.');
        }
      } catch (error) {
        console.error('Error fetching submission period:', error);
        setSubmissionPeriodError('Error connecting to server. Please check your connection and refresh.');
      } finally {
        setIsLoadingSubmissionPeriod(false);
      }
    };
    fetchSubmissionPeriod();
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!submissionPeriod) return;

    const updateCountdown = () => {
      const now = new Date();
      const start = new Date(submissionPeriod.startDate);
      const end = new Date(submissionPeriod.endDate);

      if (now < start) {
        // setIsSubmissionOpen(false); // Enable submission always
        const diff = start.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setCountdown(`Opens in ${days}d ${hours}h`);
      } else if (now > end) {
        // setIsSubmissionOpen(false); // Enable submission always
        setCountdown('Submission period ended');
      } else {
        setIsSubmissionOpen(true);
        const diff = end.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`${days}d ${hours}h ${minutes}m remaining`);
      }
    };

    // Initial update
    updateCountdown();

    // Set up interval
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [submissionPeriod]);

  // Effect to handle editing mode
  useEffect(() => {
    if (initialEntry) {
      setPillarName(initialEntry.pillarName || initialEntry.pillarId);
      setIndicatorId(initialEntry.indicatorId);
      setQuarterId(initialEntry.quarterId);
      setMonth(initialEntry.month);
      setAchievementValue(initialEntry.value.toString());
      setComments(initialEntry.comments || '');

      // Handle sub-values if they exist and convert numbers to strings
      if (initialEntry.subValues) {
        const subs: Record<string, string> = {};
        Object.entries(initialEntry.subValues).forEach(([k, v]) => {
          subs[k] = v.toString();
        });
        setSubValues(subs);
      }
    }
  }, [initialEntry]);

  // Hierarchy Stats
  const stats = useMemo(() => {
    const pillarsCount = PILLARS.length;
    const outputsCount = PILLARS.reduce((acc, p) => acc + p.outputs.length, 0);
    const indicatorsCount = PILLARS.reduce((acc, p) => acc + p.outputs.flatMap(o => o.indicators).length, 0);
    return { pillarsCount, outputsCount, indicatorsCount };
  }, []);

  const selectedPillar = useMemo(() => PILLARS.find(p => p.name === pillarName), [pillarName]);

  // Get indicators - filter for employees based on assignments
  const indicators = useMemo(() => {
    if (!selectedPillar) return [];

    const allIndicators = selectedPillar.outputs.flatMap(o => o.indicators).map(indicator => ({
      id: indicator.id,
      name: indicator.name,
      isDual: indicator.isDual,
      measurementType: indicator.measurementType
    }));

    // If user is an employee, only show assigned indicators
    if (userType === 'employee' && assignedIndicators.length > 0) {
      const assignedIds = assignedIndicators.map(a => a.indicatorId);
      return allIndicators.filter(ind => assignedIds.includes(ind.id));
    }

    return allIndicators;
  }, [selectedPillar, userType, assignedIndicators]);

  const selectedIndicator = useMemo(() =>
    indicators.find(i => i.id === indicatorId),
    [indicators, indicatorId]
  );

  // Helper function to get sub-indicator target by sub-indicator ID
  const getSubIndicatorTarget = (subIndicatorId: string): number | string => {
    if (!quarterId) return 0;
    // Find the sub-indicator in the global INDICATORS array
    const subInd = INDICATORS.find(ind => ind.id === subIndicatorId);
    if (subInd && subInd.targets) {
      return subInd.targets[quarterId as keyof typeof subInd.targets] || 0;
    }
    return 0;
  };

  // Simple quarter and month data
  const QUARTERS = [
    { id: 'q1', name: 'Quarter 1', months: ['July', 'August', 'September'] },
    { id: 'q2', name: 'Quarter 2', months: ['October', 'November', 'December'] },
    { id: 'q3', name: 'Quarter 3', months: ['January', 'February', 'March'] },
    { id: 'q4', name: 'Quarter 4', months: ['April', 'May', 'June'] }
  ];

  const selectedQuarter = useMemo(() => QUARTERS.find(q => q.id === quarterId), [quarterId]);
  const months = useMemo(() => selectedQuarter?.months || [], [selectedQuarter]);

  const [subValues, setSubValues] = useState<Record<string, string>>({});

  const handleSubValueChange = (label: string, value: string) => {
    setSubValues(prev => ({
      ...prev,
      [label]: value
    }));
  };

  // Handle file upload for supporting documents
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress('Uploading...');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file: File) => {
        formData.append('files', file);
      });

      const response = await fetch(API_ENDPOINTS.UPLOAD_MULTIPLE, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSupportingDocuments(prev => [...prev, ...data.files]);
        setUploadProgress(`${data.files.length} file(s) uploaded successfully!`);
        setTimeout(() => setUploadProgress(''), 3000);
      } else {
        const err = await response.json();
        setUploadProgress(`Upload failed: ${err.message}`);
        setTimeout(() => setUploadProgress(''), 5000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(''), 5000);
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  // Remove uploaded document
  const handleRemoveDocument = (index: number) => {
    setSupportingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Check for duplicate submission
  const checkDuplicateSubmission = async (pillarId: string, indicatorId: string, quarterId: string, month: string) => {
    try {
      const response = await authPost(`${API_ENDPOINTS.SUBMISSIONS}/check-duplicate`, {
        pillarId,
        indicatorId,
        quarterId,
        month
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error checking duplicate submission:', error);
    }
    return { hasDuplicate: false };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillarName || !indicatorId || !quarterId || !month) {
      alert("Please fill all required fields");
      return;
    }

    // Validation for dual indicators can be enhanced here if needed
    if (!selectedIndicator?.isDual && achievementValue === '') {
      return;
    }

    // Check for duplicate submission first
    const duplicateCheck = await checkDuplicateSubmission(pillarName, indicatorId, quarterId, month);
    
    if (duplicateCheck.hasDuplicate) {
      setExistingSubmission(duplicateCheck.existingSubmission);
      setShowDuplicateModal(true);
      return;
    }

    // If no duplicate, proceed with normal submission
    await submitData('increment');
  };

  const submitData = async (action: 'edit' | 'increment', existingSubmissionId?: string) => {

    let finalValue = achievementValue !== '' ? Number(achievementValue) : 0;

    // Convert subValues to numbers for storage/payload
    const numericSubValues: Record<string, number> = {};
    Object.keys(subValues).forEach(key => {
      numericSubValues[key] = subValues[key] !== '' ? Number(subValues[key]) : 0;
    });

    // Auto-calculate percentage if using the 2-step input
    if (selectedIndicator?.measurementType === 'percentage' &&
      subValues['target_pop'] !== undefined &&
      subValues['achieved_pop'] !== undefined) {
      finalValue = (numericSubValues['achieved_pop'] / numericSubValues['target_pop']) * 100;
      // Also store the calculated percentage in subValues
      numericSubValues['achieved_pop_percentage'] = finalValue;
    }

    // Handle other percentage calculations (target_x/achieved_x patterns)
    Object.keys(numericSubValues).forEach(key => {
      if (key.startsWith('target_') && !key.includes('_percentage')) {
        const baseName = key.replace('target_', '');
        const achievedKey = `achieved_${baseName}`;
        
        if (numericSubValues[achievedKey] !== undefined) {
          const percentage = (numericSubValues[achievedKey] / numericSubValues[key]) * 100;
          numericSubValues[`${achievedKey}_percentage`] = percentage;
        }
      }
    });

    const payload = {
      pillarId: pillarName,
      pillarName: pillarName,
      indicatorId,
      indicatorName: selectedIndicator?.name || '',
      quarterId,
      month,
      value: finalValue,
      targetValue: targetValue ? Number(targetValue) : 0,
      subValues: selectedIndicator?.isDual || selectedIndicator?.measurementType === 'percentage' ? numericSubValues : undefined,
      comments,
      supportingDocuments: supportingDocuments.map(doc => ({
        url: doc.url,
        publicId: doc.publicId,
        format: doc.format,
        originalName: doc.originalName,
        uploadedAt: new Date().toISOString()
      })),
      submittedBy: userEmail,
      timestamp: new Date().toISOString(),
      action, // Add action field for backend processing
      existingSubmissionId // Add existing submission ID for edit workflow
    };

    // DEBUG: Log the payload being sent
    console.log('SUBMISSION PAYLOAD:', {
      indicatorId,
      indicatorName: selectedIndicator?.name,
      isDual: selectedIndicator?.isDual,
      measurementType: selectedIndicator?.measurementType,
      value: finalValue,
      subValues: payload.subValues,
      hasSubValues: !!payload.subValues && Object.keys(payload.subValues).length > 0
    });

    try {
      const response = await authPost(API_ENDPOINTS.SUBMISSIONS, payload);

      if (response.ok) {
        const savedData = await response.json();

        // DEBUG: Log the response from server
        console.log('SUBMISSION RESPONSE:', {
          status: response.status,
          savedData,
          hasSubValuesInResponse: savedData.subValues && Object.keys(savedData.subValues).length > 0
        });

        // Show appropriate success message based on action
        if (savedData.requiresApproval) {
          setSuccessMessage('Edit request submitted for approval! It will be reviewed by an administrator.');
        } else {
          setSuccessMessage(action === 'edit' ? 'Data updated successfully!' : 'Data submitted successfully!');
        }
        setShowSuccessModal(true);

        // Close duplicate modal if it's open
        setShowDuplicateModal(false);
        setExistingSubmission(null);
        setSelectedAction(null);

        // Also update local list if needed, or just clear form
        onAddEntry({
          ...payload,
          _id: (savedData as any)._id || (initialEntry as any)?._id,
          outputId: '',
        } as any);

        if (action !== 'edit') {
          setIndicatorId('');
          setTargetValue('');
          setAchievementValue('');
          setSubValues({});
          setComments('');
          setSupportingDocuments([]);
        } else if (onCancelEdit) {
          setTimeout(() => {
            onCancelEdit();
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        console.error("Submission failed:", errorData);
        
        // Check if it's a duplicate key error (multiple possible formats)
        const errorMessage = errorData.message || errorData.error || '';
        const isDuplicateError = 
          errorMessage.includes('duplicate key') ||
          errorMessage.includes('E11000') ||
          errorMessage.includes('dup key') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('duplicate') ||
          errorData.code === 11000;
        
        if (isDuplicateError) {
          console.log('Duplicate error detected, showing modal...');
          // Find the existing submission for this month
          try {
            const existingResponse = await authPost(API_ENDPOINTS.SUBMISSIONS + '/check-duplicate', {
              pillarId: pillarName,
              indicatorId,
              quarterId,
              month
            });
            
            if (existingResponse.ok) {
              const duplicateData = await existingResponse.json();
              if (duplicateData.hasDuplicate) {
                setExistingSubmission(duplicateData.existingSubmission);
                setShowDuplicateModal(true);
                return; // Don't show error modal, show duplicate modal instead
              }
            }
          } catch (duplicateCheckError) {
            console.error('Error checking duplicate:', duplicateCheckError);
          }
          
          // Fallback: Show duplicate modal even if we can't fetch existing data
          setExistingSubmission({
            indicatorName: selectedIndicator?.name || 'Unknown',
            pillarName: pillarName,
            month: month,
            quarterId: quarterId,
            value: 0,
            comments: ''
          });
          setShowDuplicateModal(true);
          return;
        }
        
        setSuccessMessage(`Failed to submit data: ${errorMessage}`);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      
      // Check if it's a duplicate key error (multiple possible formats)
      const errorMessage = error.message || error.toString() || '';
      const isDuplicateError = 
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('E11000') ||
        errorMessage.includes('dup key') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('duplicate') ||
        error.code === 11000;
      
      if (isDuplicateError) {
        console.log('Duplicate error detected in catch, showing modal...');
        // Find the existing submission for this month
        authPost(API_ENDPOINTS.SUBMISSIONS + '/check-duplicate', {
          pillarId: pillarName,
          indicatorId,
          quarterId,
          month
        }).then(existingResponse => {
          if (existingResponse.ok) {
            return existingResponse.json();
          }
          throw new Error('Failed to check duplicate');
        }).then(duplicateData => {
          if (duplicateData.hasDuplicate) {
            setExistingSubmission(duplicateData.existingSubmission);
            setShowDuplicateModal(true);
            return;
          }
          // Fallback: Show duplicate modal even if we can't fetch existing data
          setExistingSubmission({
            indicatorName: selectedIndicator?.name || 'Unknown',
            pillarName: pillarName,
            month: month,
            quarterId: quarterId,
            value: 0,
            comments: ''
          });
          setShowDuplicateModal(true);
        }).catch(() => {
          // Fallback: Show duplicate modal even if we can't fetch existing data
          setExistingSubmission({
            indicatorName: selectedIndicator?.name || 'Unknown',
            pillarName: pillarName,
            month: month,
            quarterId: quarterId,
            value: 0,
            comments: ''
          });
          setShowDuplicateModal(true);
        });
      } else {
        setSuccessMessage('Error connecting to server. Please check your connection.');
        setShowSuccessModal(true);
      }
    }
  };

  // Improved Input Classes for better visibility and contrast
  const inputClasses = "w-full h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 cursor-pointer appearance-none text-sm ring-offset-2";

  const chevronIcon = (
    <div className="absolute right-4 top-4 pointer-events-none text-slate-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md text-center animate-in zoom-in duration-300">
            <div className={`w-16 h-16 ${successMessage.includes('success') ? 'bg-emerald-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {successMessage.includes('success') ? (
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {successMessage.includes('success') ? 'Success!' : 'Oops!'}
            </h3>
            <p className="text-slate-600">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className={`mt-4 px-6 py-2 ${successMessage.includes('success') ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-xl font-semibold transition-colors`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Submission Modal */}
      {showDuplicateModal && existingSubmission && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Submission Exists</h3>
                    <p className="text-sm opacity-90">{existingSubmission.month} ({existingSubmission.quarterId?.toUpperCase()})</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setExistingSubmission(null);
                    setSelectedAction(null);
                    setModalEditMode(false);
                  }}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!modalEditMode ? (
                // View Mode
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-600">Current Value</span>
                      <span className="text-lg font-bold text-slate-900">{existingSubmission.value?.toLocaleString()}</span>
                    </div>
                    {existingSubmission.comments && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Comments:</span> {existingSubmission.comments}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-slate-600 text-center">
                    <p className="font-medium mb-2">What would you like to do?</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setModalEditMode(true);
                        setModalValue(existingSubmission.value?.toString() || '');
                        setModalComments(existingSubmission.comments || '');
                        setSelectedAction('edit');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold py-3 px-4 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Modify Existing Data</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setModalEditMode(true);
                        setModalValue('');
                        setModalComments('');
                        setSelectedAction('increment');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold py-3 px-4 transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add New Data</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">
                      {selectedAction === 'edit' ? 'Update existing submission' : 'Add new submission'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Value</label>
                    <input
                      type="number"
                      value={modalValue}
                      onChange={(e) => setModalValue(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none"
                      placeholder="Enter value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Comments</label>
                    <textarea
                      value={modalComments}
                      onChange={(e) => setModalComments(e.target.value)}
                      className="w-full h-24 px-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-semibold shadow-sm hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none"
                      placeholder="Add comments..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setModalEditMode(false);
                        setModalValue('');
                        setModalComments('');
                      }}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold py-3 px-4 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        // Submit the modal data
                        const payload = {
                          pillarId: pillarName,
                          pillarName: pillarName,
                          indicatorId,
                          indicatorName: selectedIndicator?.name || '',
                          quarterId,
                          month,
                          value: modalValue !== '' ? Number(modalValue) : 0,
                          targetValue: targetValue ? Number(targetValue) : 0,
                          comments: modalComments,
                          submittedBy: userEmail,
                          timestamp: new Date().toISOString(),
                          action: selectedAction,
                          existingSubmissionId: existingSubmission._id
                        };

                        try {
                          const response = await authPost(API_ENDPOINTS.SUBMISSIONS, payload);
                          if (response.ok) {
                            setSuccessMessage(selectedAction === 'edit' ? 'Data updated successfully!' : 'Data submitted successfully!');
                            setShowSuccessModal(true);
                            setShowDuplicateModal(false);
                            setExistingSubmission(null);
                            setSelectedAction(null);
                            setModalEditMode(false);
                            setModalValue('');
                            setModalComments('');
                          } else {
                            const errorData = await response.json();
                            setSuccessMessage(`Failed to submit data: ${errorData.message || 'Unknown error'}`);
                            setShowSuccessModal(true);
                          }
                        } catch (error) {
                          setSuccessMessage('Error connecting to server. Please check your connection.');
                          setShowSuccessModal(true);
                        }
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold py-3 px-4 transition-colors"
                    >
                      {selectedAction === 'edit' ? 'Update' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          {userRole === 'Assign employee' ? 'Submit the indicators' : 'Performance Entry'}
        </h1>
        <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600 font-medium">Reporting monitoring data for Imihigo 2025-2026.</p>
      </header>

      {/* Loading State */}
      {isLoadingSubmissionPeriod && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-blue-800 mb-2">Loading Submission Period</h3>
          <p className="text-blue-600">Please wait while we fetch the current submission period...</p>
        </div>
      )}

      {/* Error State */}
      {submissionPeriodError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{submissionPeriodError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      )}

      {/* Submission Period Countdown Banner */}
      {submissionPeriod && !isLoadingSubmissionPeriod && !submissionPeriodError && (
        <div className={`rounded-2xl p-4 flex items-center justify-between ${isSubmissionOpen
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
          : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
          }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubmissionOpen ? 'bg-white/20' : 'bg-white/20'
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">{submissionPeriod.description}</p>
              <p className="text-xs opacity-90">
                {new Date(submissionPeriod.startDate).toLocaleDateString()} - {new Date(submissionPeriod.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80 uppercase font-semibold">Deadline</p>
            <p className="font-bold text-lg">{countdown}</p>
          </div>
        </div>
      )}



      {/* System Hierarchy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <SummaryCard
          title="Total Pillars"
          value={stats.pillarsCount}
          color="bg-indigo-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <SummaryCard
          title="Monitored Indicators"
          value={stats.indicatorsCount}
          color="bg-blue-600"
          icon={<svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
        />
      </div>

      <div className="w-full">
        {/* Main Form Section */}
        <div className="order-1">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden w-full">
            <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900">{initialEntry ? 'Edit Entry' : 'Data Entry'}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Provide monthly performance data for specific indicators.</p>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                    Submitting as: {userEmail}
                  </span>
                </div>
              </div>
              {initialEntry && onCancelEdit && (
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6 w-full">
              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">1. Pillar</label>
                <div className="relative">
                  <select
                    value={pillarName}
                    onChange={(e) => {
                      setPillarName(e.target.value);
                      setIndicatorId('');
                    }}
                    className={inputClasses}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Pillar --</option>
                    {PILLARS.map(p => <option key={p.name} value={p.name} className="text-slate-900 font-medium">{p.name}</option>)}
                  </select>
                  {chevronIcon}
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">2. Indicator</label>
                <div className="relative">
                  <select
                    value={indicatorId}
                    onChange={(e) => {
                      setIndicatorId(e.target.value);
                      setTargetValue('');
                      setAchievementValue('');
                    }}
                    disabled={!pillarName}
                    className={inputClasses}
                    required
                  >
                    <option value="" className="text-slate-400">-- Choose Indicator --</option>
                    {indicators.length === 0 ? (
                      <option value="" className="text-slate-400" disabled>-- No indicators available for this pillar --</option>
                    ) : (
                      indicators.map(i => <option key={i.id} value={i.id} className="text-slate-900 font-medium">{indicatorNumbering.get(i.id) || '?'}. {i.name} {getIndicatorUnit(i as Indicator)}</option>)
                    )}
                  </select>
                  {chevronIcon}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">3. Quarter</label>
                  <div className="relative">
                    <select
                      value={quarterId}
                      onChange={(e) => {
                        setQuarterId(e.target.value);
                        setMonth('');
                      }}
                      className={inputClasses}
                      required
                    >
                      <option value="" className="text-slate-400">-- Select Quarter --</option>
                      {QUARTERS.map(q => <option key={q.id} value={q.id} className="text-slate-900 font-medium">{q.name}</option>)}
                    </select>
                    {chevronIcon}
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">4. Month</label>
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      disabled={!quarterId}
                      className={inputClasses}
                      required
                    >
                      <option value="" className="text-slate-400">-- Select Month --</option>
                      {months.map(m => <option key={m} value={m} className="text-slate-900 font-medium">{m}</option>)}
                    </select>
                    {chevronIcon}
                  </div>
                </div>
              </div>

              {/* DYNAMIC VALUE SECTION */}
              <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border-2 border-slate-200 space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between items-center">
                  <span>achievements</span>
                  {selectedIndicator && quarterId && !selectedIndicator.isDual && (
                    <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 italic normal-case tracking-normal">
                      Fixed Target: {selectedPillar?.outputs.flatMap(o => o.indicators).find(i => i.id === indicatorId)?.targets[quarterId as keyof Indicator['targets']] || 0}
                    </span>
                  )}
                </h4>
                {/* Percentage Only Toggle - REMOVED to force 3-box system for non-construction percentage indicators */}
                {selectedIndicator?.measurementType === 'percentage' &&
                  !['74', '83', '87', '88', '101', '132', '69', '99'].includes(indicatorId) && (
                    <div className="flex items-center space-x-2">
                      {/* Toggle button removed - now always showing 3-box system */}
                    </div>
                  )}

                {selectedIndicator?.isDual ? (
                  <div className="space-y-4">
                    {/* Sub-indicator specific inputs */}
                    {indicatorId === '3' && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Maize (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('3a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['maize'] ?? ''}
                            onChange={(e) => handleSubValueChange('maize', e.target.value)}
                            placeholder="Maize"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Cassava (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('4')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['cassava'] ?? ''}
                            onChange={(e) => handleSubValueChange('cassava', e.target.value)}
                            placeholder="Cassava"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Rice (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('5')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['rice'] ?? ''}
                            onChange={(e) => handleSubValueChange('rice', e.target.value)}
                            placeholder="Rice"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Beans (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('6')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['beans'] ?? ''}
                            onChange={(e) => handleSubValueChange('beans', e.target.value)}
                            placeholder="Beans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Soya (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('7')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['soya'] ?? ''}
                            onChange={(e) => handleSubValueChange('soya', e.target.value)}
                            placeholder="Soya"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '8' && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Maize Seeds (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('8a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['maize'] ?? ''}
                            onChange={(e) => handleSubValueChange('maize', e.target.value)}
                            placeholder="Maize seeds"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Soya Seeds (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('9')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['soya'] ?? ''}
                            onChange={(e) => handleSubValueChange('soya', e.target.value)}
                            placeholder="Soya seeds"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '10' && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>DAP (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('10a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['dap'] ?? ''}
                            onChange={(e) => handleSubValueChange('dap', e.target.value)}
                            placeholder="DAP"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>UREA (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('11')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['urea'] ?? ''}
                            onChange={(e) => handleSubValueChange('urea', e.target.value)}
                            placeholder="UREA"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>NPK (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('12')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['npk'] ?? ''}
                            onChange={(e) => handleSubValueChange('npk', e.target.value)}
                            placeholder="NPK"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Blender (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('13')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['blender'] ?? ''}
                            onChange={(e) => handleSubValueChange('blender', e.target.value)}
                            placeholder="Blender"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Lime (Kg)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('14')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['lime'] ?? ''}
                            onChange={(e) => handleSubValueChange('lime', e.target.value)}
                            placeholder="Lime"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '16' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Maize (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('16a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['maize'] ?? ''}
                            onChange={(e) => handleSubValueChange('maize', e.target.value)}
                            placeholder="Maize"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Rice (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('17')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['rice'] ?? ''}
                            onChange={(e) => handleSubValueChange('rice', e.target.value)}
                            placeholder="Rice"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Beans (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('18')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['beans'] ?? ''}
                            onChange={(e) => handleSubValueChange('beans', e.target.value)}
                            placeholder="Beans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Chilli (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('19')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['chilli'] ?? ''}
                            onChange={(e) => handleSubValueChange('chilli', e.target.value)}
                            placeholder="Chilli"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Soybeans (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('20')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['soybeans'] ?? ''}
                            onChange={(e) => handleSubValueChange('soybeans', e.target.value)}
                            placeholder="Soybeans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>French beans (Ha)</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('21')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['french_beans'] ?? ''}
                            onChange={(e) => handleSubValueChange('french_beans', e.target.value)}
                            placeholder="French beans"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '24' && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>BQ</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('24a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['bq'] ?? ''}
                            onChange={(e) => handleSubValueChange('bq', e.target.value)}
                            placeholder="Black quarter"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>LSD</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('25')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['lsd'] ?? ''}
                            onChange={(e) => handleSubValueChange('lsd', e.target.value)}
                            placeholder="LSD"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>RVF</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('26')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['rvf'] ?? ''}
                            onChange={(e) => handleSubValueChange('rvf', e.target.value)}
                            placeholder="RVF"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Brucellosis</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('27')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['brucellosis'] ?? ''}
                            onChange={(e) => handleSubValueChange('brucellosis', e.target.value)}
                            placeholder="Brucellosis"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Rabies</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('28')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['rabies'] ?? ''}
                            onChange={(e) => handleSubValueChange('rabies', e.target.value)}
                            placeholder="Rabies"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '29' && (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Goats</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('30a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['goats'] ?? ''}
                            onChange={(e) => handleSubValueChange('goats', e.target.value)}
                            placeholder="Goats"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Sheep</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('30')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['sheep'] ?? ''}
                            onChange={(e) => handleSubValueChange('sheep', e.target.value)}
                            placeholder="Sheep"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}

                    {indicatorId === '31' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Cows Insured</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('33a')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['cows'] ?? ''}
                            onChange={(e) => handleSubValueChange('cows', e.target.value)}
                            placeholder="Number of cows"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Pigs Insured</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('32')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['pig'] ?? ''}
                            onChange={(e) => handleSubValueChange('pig', e.target.value)}
                            placeholder="Number of pigs"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex justify-between items-center text-[10px] font-bold text-blue-700 uppercase">
                            <span>Poultry Insured</span>
                            <span className="text-red-500 text-[9px]">Target: {getSubIndicatorTarget('33')}</span>
                          </label>
                          <input
                            type="number"
                            value={subValues['chicken'] ?? ''}
                            onChange={(e) => handleSubValueChange('chicken', e.target.value)}
                            placeholder="Number of poultry"
                            className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                          />
                        </div>
                      </div>
                    )}


                    {/* Hypertension and Diabetes Tracking (Indicator 69) */}
                    {indicatorId === '69' && (
                      <div className="space-y-6 bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl border-2 border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <h4 className="font-bold text-red-800 text-sm">Hypertension & Diabetes Tracking</h4>
                        </div>

                        {/* Hypertension Section */}
                        <div className="space-y-4 bg-white p-4 rounded-lg border border-red-100">
                          <h5 className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Hypertension Enrollment
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Hypertension - Target Population */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider">
                                Target Population
                              </label>
                              <input
                                type="number"
                                value={subValues['hypertension_target'] ?? ''}
                                onChange={(e) => handleSubValueChange('hypertension_target', e.target.value)}
                                placeholder="e.g. 1000"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="1"
                              />
                              <p className="text-[9px] text-slate-500">Total screened for hypertension</p>
                            </div>

                            {/* Hypertension - Enrolled */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-red-700 uppercase tracking-wider">
                                Enrolled in Care
                              </label>
                              <input
                                type="number"
                                value={subValues['hypertension_enrolled'] ?? ''}
                                onChange={(e) => handleSubValueChange('hypertension_enrolled', e.target.value)}
                                placeholder="e.g. 800"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="0"
                              />
                              <p className="text-[9px] text-slate-500">Number enrolled in treatment</p>
                            </div>

                            {/* Hypertension - Calculated Percentage */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Enrollment Rate
                              </label>
                              <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['hypertension_target']) > 0
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-slate-100'
                                } flex items-center`}>
                                <span className={`text-xl font-black ${Number(subValues['hypertension_target']) > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                                  }`}>
                                  {Number(subValues['hypertension_target']) > 0 && subValues['hypertension_enrolled'] !== undefined
                                    ? ((Number(subValues['hypertension_enrolled']) / Number(subValues['hypertension_target'])) * 100).toFixed(1)
                                    : '0.0'}%
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                            </div>
                          </div>
                        </div>

                        {/* Diabetes Section */}
                        <div className="space-y-4 bg-white p-4 rounded-lg border border-blue-100">
                          <h5 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Diabetes Enrollment
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Diabetes - Target Population */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Target Population
                              </label>
                              <input
                                type="number"
                                value={subValues['diabetes_target'] ?? ''}
                                onChange={(e) => handleSubValueChange('diabetes_target', e.target.value)}
                                placeholder="e.g. 500"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="1"
                              />
                              <p className="text-[9px] text-slate-500">Total screened for diabetes</p>
                            </div>

                            {/* Diabetes - Enrolled */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Enrolled in Care
                              </label>
                              <input
                                type="number"
                                value={subValues['diabetes_enrolled'] ?? ''}
                                onChange={(e) => handleSubValueChange('diabetes_enrolled', e.target.value)}
                                placeholder="e.g. 400"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="0"
                              />
                              <p className="text-[9px] text-slate-500">Number enrolled in treatment</p>
                            </div>

                            {/* Diabetes - Calculated Percentage */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Enrollment Rate
                              </label>
                              <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['diabetes_target']) > 0
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-slate-100'
                                } flex items-center`}>
                                <span className={`text-xl font-black ${Number(subValues['diabetes_target']) > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                                  }`}>
                                  {Number(subValues['diabetes_target']) > 0 && subValues['diabetes_enrolled'] !== undefined
                                    ? ((Number(subValues['diabetes_enrolled']) / Number(subValues['diabetes_target'])) * 100).toFixed(1)
                                    : '0.0'}%
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                            </div>
                          </div>
                        </div>

                        {/* Combined Summary */}
                        <div className="mt-4 p-3 bg-white/70 rounded-lg border border-slate-200">
                          <p className="text-[10px] text-slate-600 font-semibold">
                            <span className="font-black text-slate-800">Note:</span> This indicator tracks both hypertension and diabetes enrollment separately. The overall progress will be calculated as the average of both enrollment rates.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Education Information Accuracy (Indicator 99) */}
                    {indicatorId === '99' && (
                      <div className="space-y-6 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                          </svg>
                          <h4 className="font-bold text-purple-800 text-sm">Education Information Accuracy</h4>
                        </div>

                        {/* Students Section */}
                        <div className="space-y-4 bg-white p-4 rounded-lg border border-purple-100">
                          <h5 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            Students Data Accuracy
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Students - Target Population */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                Target Population
                              </label>
                              <input
                                type="number"
                                value={subValues['students_target'] ?? ''}
                                onChange={(e) => handleSubValueChange('students_target', e.target.value)}
                                placeholder="e.g. 5000"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="1"
                              />
                              <p className="text-[9px] text-slate-500">Total student records</p>
                            </div>

                            {/* Students - Accurate Records */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                Accurate Records
                              </label>
                              <input
                                type="number"
                                value={subValues['students_accurate'] ?? ''}
                                onChange={(e) => handleSubValueChange('students_accurate', e.target.value)}
                                placeholder="e.g. 4500"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="0"
                              />
                              <p className="text-[9px] text-slate-500">Records with accurate data</p>
                            </div>

                            {/* Students - Calculated Percentage */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Accuracy Rate
                              </label>
                              <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['students_target']) > 0
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-slate-100'
                                } flex items-center`}>
                                <span className={`text-xl font-black ${Number(subValues['students_target']) > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                                  }`}>
                                  {Number(subValues['students_target']) > 0 && subValues['students_accurate'] !== undefined
                                    ? ((Number(subValues['students_accurate']) / Number(subValues['students_target'])) * 100).toFixed(1)
                                    : '0.0'}%
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                            </div>
                          </div>
                        </div>

                        {/* Material and Buildings Section */}
                        <div className="space-y-4 bg-white p-4 rounded-lg border border-blue-100">
                          <h5 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Material & Buildings Accuracy
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Material - Target Population */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Target Records
                              </label>
                              <input
                                type="number"
                                value={subValues['material_target'] ?? ''}
                                onChange={(e) => handleSubValueChange('material_target', e.target.value)}
                                placeholder="e.g. 200"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="1"
                              />
                              <p className="text-[9px] text-slate-500">Total infrastructure records</p>
                            </div>

                            {/* Material - Accurate Records */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Accurate Records
                              </label>
                              <input
                                type="number"
                                value={subValues['material_accurate'] ?? ''}
                                onChange={(e) => handleSubValueChange('material_accurate', e.target.value)}
                                placeholder="e.g. 180"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="0"
                              />
                              <p className="text-[9px] text-slate-500">Records with accurate data</p>
                            </div>

                            {/* Material - Calculated Percentage */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Accuracy Rate
                              </label>
                              <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['material_target']) > 0
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-slate-100'
                                } flex items-center`}>
                                <span className={`text-xl font-black ${Number(subValues['material_target']) > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                                  }`}>
                                  {Number(subValues['material_target']) > 0 && subValues['material_accurate'] !== undefined
                                    ? ((Number(subValues['material_accurate']) / Number(subValues['material_target'])) * 100).toFixed(1)
                                    : '0.0'}%
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                            </div>
                          </div>
                        </div>

                        {/* Workers Section */}
                        <div className="space-y-4 bg-white p-4 rounded-lg border border-green-100">
                          <h5 className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Workers Data Accuracy
                          </h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Workers - Target Population */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                Target Records
                              </label>
                              <input
                                type="number"
                                value={subValues['workers_target'] ?? ''}
                                onChange={(e) => handleSubValueChange('workers_target', e.target.value)}
                                placeholder="e.g. 500"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="1"
                              />
                              <p className="text-[9px] text-slate-500">Total staff records</p>
                            </div>

                            {/* Workers - Accurate Records */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                Accurate Records
                              </label>
                              <input
                                type="number"
                                value={subValues['workers_accurate'] ?? ''}
                                onChange={(e) => handleSubValueChange('workers_accurate', e.target.value)}
                                placeholder="e.g. 475"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="0"
                              />
                              <p className="text-[9px] text-slate-500">Records with accurate data</p>
                            </div>

                            {/* Workers - Calculated Percentage */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Accuracy Rate
                              </label>
                              <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['workers_target']) > 0
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-slate-100'
                                } flex items-center`}>
                                <span className={`text-xl font-black ${Number(subValues['workers_target']) > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                                  }`}>
                                  {Number(subValues['workers_target']) > 0 && subValues['workers_accurate'] !== undefined
                                    ? ((Number(subValues['workers_accurate']) / Number(subValues['workers_target'])) * 100).toFixed(1)
                                    : '0.0'}%
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                            </div>
                          </div>
                        </div>

                        {/* Combined Summary */}
                        <div className="mt-4 p-3 bg-white/70 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Overall SDMS Accuracy:</span>
                            <span className="text-lg font-black text-indigo-600">
                              {subValues['students_target'] && subValues['students_accurate'] &&
                                subValues['material_target'] && subValues['material_accurate'] &&
                                subValues['workers_target'] && subValues['workers_accurate']
                                ? (
                                  (
                                    (Number(subValues['students_accurate']) / Number(subValues['students_target'])) * 100 +
                                    (Number(subValues['material_accurate']) / Number(subValues['material_target'])) * 100 +
                                    (Number(subValues['workers_accurate']) / Number(subValues['workers_target'])) * 100
                                  ) / 3
                                ).toFixed(1)
                                : '0.0'}%
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500">
                            Average accuracy rate across all three categories (Students, Material & Buildings, Workers)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Construction Indicators - Percentage Only */}
                    {indicatorId === '74' && (
                      <div className="space-y-4 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h4 className="font-bold text-amber-800 text-sm">Construction Progress - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of construction work completed (0-100)</p>
                        </div>
                      </div>
                    )}

                    {indicatorId === '83' && (
                      <div className="space-y-4 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h4 className="font-bold text-amber-800 text-sm">ECD Construction Progress - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of ECD construction work completed (0-100)</p>
                        </div>
                      </div>
                    )}

                    {indicatorId === '87' && (
                      <div className="space-y-4 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h4 className="font-bold text-amber-800 text-sm">Classroom & Toilet Construction Progress</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Overall Construction Progress (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter overall percentage of construction work completed for both 15 classrooms and 24 toilets (0-100)</p>
                        </div>
                      </div>
                    )}

                    {indicatorId === '88' && (
                      <div className="space-y-4 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h4 className="font-bold text-amber-800 text-sm">Toilet Construction Progress - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of toilet construction work completed (0-100)</p>
                        </div>
                      </div>
                    )}

                    {/* Retaining Walls Construction Indicators - Percentage Only */}
                    {indicatorId === '67' && (
                      <div className="space-y-4 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h4 className="font-bold text-amber-800 text-sm">Retaining Walls Construction Progress - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of retaining walls construction work completed (0-100)</p>
                        </div>
                      </div>
                    )}

                    {indicatorId === '89' && (
                      <div className="space-y-4 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <h4 className="font-bold text-amber-800 text-sm">Retaining Walls Construction Progress - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-amber-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of retaining walls construction work completed (0-100)</p>
                        </div>
                      </div>
                    )}


                    {/* Feeder Road Rehabilitation - Percentage Only */}
                    {indicatorId === '43' && (
                      <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <h4 className="font-bold text-blue-800 text-sm">Feeder Road Rehabilitation - Percentage Only</h4>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                            Percentage Completed
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={subValues['percentage'] ?? ''}
                              onChange={(e) => handleSubValueChange('percentage', e.target.value)}
                              placeholder="e.g. 75"
                              className={`${inputClasses} placeholder:text-slate-300 bg-white flex-1`}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-xl font-black text-blue-700">%</span>
                          </div>
                          <p className="text-[9px] text-slate-500">Enter percentage of feeder road rehabilitation work completed (0-100)</p>
                        </div>
                      </div>
                    )}
                    {/* Student Attendance Indicator - Complex Calculation */}
                    {indicatorId === '101' && (
                      <div className="space-y-6 bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                          </svg>
                          <h4 className="font-bold text-green-800 text-sm">Student Attendance</h4>
                        </div>

                        <div className="space-y-4">
                          {/* Primary School */}
                          <div className="space-y-2 bg-white p-4 rounded-lg border border-green-100">
                            <h5 className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Primary School Attendance
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Target Students
                                </label>
                                <input
                                  type="number"
                                  value={subValues['primary_target'] ?? ''}
                                  onChange={(e) => handleSubValueChange('primary_target', e.target.value)}
                                  placeholder="e.g. 5000"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="1"
                                />
                                <p className="text-[9px] text-slate-500">Total primary students</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Attending Students
                                </label>
                                <input
                                  type="number"
                                  value={subValues['primary_attending'] ?? ''}
                                  onChange={(e) => handleSubValueChange('primary_attending', e.target.value)}
                                  placeholder="e.g. 4800"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="0"
                                />
                                <p className="text-[9px] text-slate-500">Students attending</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  Attendance Rate
                                </label>
                                <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['primary_target']) > 0
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-slate-200 bg-slate-100'
                                  } flex items-center`}>
                                  <span className={`text-xl font-black ${Number(subValues['primary_target']) > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                    }`}>
                                    {Number(subValues['primary_target']) > 0 && subValues['primary_attending'] !== undefined
                                      ? ((Number(subValues['primary_attending']) / Number(subValues['primary_target'])) * 100).toFixed(1)
                                      : '0.0'}%
                                  </span>
                                </div>
                                <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                              </div>
                            </div>
                          </div>

                          {/* Secondary School */}
                          <div className="space-y-2 bg-white p-4 rounded-lg border border-green-100">
                            <h5 className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Secondary School Attendance
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Target Students
                                </label>
                                <input
                                  type="number"
                                  value={subValues['secondary_target'] ?? ''}
                                  onChange={(e) => handleSubValueChange('secondary_target', e.target.value)}
                                  placeholder="e.g. 3000"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="1"
                                />
                                <p className="text-[9px] text-slate-500">Total secondary students</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Attending Students
                                </label>
                                <input
                                  type="number"
                                  value={subValues['secondary_attending'] ?? ''}
                                  onChange={(e) => handleSubValueChange('secondary_attending', e.target.value)}
                                  placeholder="e.g. 2850"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="0"
                                />
                                <p className="text-[9px] text-slate-500">Students attending</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  Attendance Rate
                                </label>
                                <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['secondary_target']) > 0
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-slate-200 bg-slate-100'
                                  } flex items-center`}>
                                  <span className={`text-xl font-black ${Number(subValues['secondary_target']) > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                    }`}>
                                    {Number(subValues['secondary_target']) > 0 && subValues['secondary_attending'] !== undefined
                                      ? ((Number(subValues['secondary_attending']) / Number(subValues['secondary_target'])) * 100).toFixed(1)
                                      : '0.0'}%
                                  </span>
                                </div>
                                <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                              </div>
                            </div>
                          </div>

                          {/* TVET */}
                          <div className="space-y-2 bg-white p-4 rounded-lg border border-green-100">
                            <h5 className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              TVET Attendance
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Target Students
                                </label>
                                <input
                                  type="number"
                                  value={subValues['tvet_target'] ?? ''}
                                  onChange={(e) => handleSubValueChange('tvet_target', e.target.value)}
                                  placeholder="e.g. 1500"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="1"
                                />
                                <p className="text-[9px] text-slate-500">Total TVET students</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-green-700 uppercase tracking-wider">
                                  Attending Students
                                </label>
                                <input
                                  type="number"
                                  value={subValues['tvet_attending'] ?? ''}
                                  onChange={(e) => handleSubValueChange('tvet_attending', e.target.value)}
                                  placeholder="e.g. 1450"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="0"
                                />
                                <p className="text-[9px] text-slate-500">Students attending</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  Attendance Rate
                                </label>
                                <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['tvet_target']) > 0
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-slate-200 bg-slate-100'
                                  } flex items-center`}>
                                  <span className={`text-xl font-black ${Number(subValues['tvet_target']) > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                    }`}>
                                    {Number(subValues['tvet_target']) > 0 && subValues['tvet_attending'] !== undefined
                                      ? ((Number(subValues['tvet_attending']) / Number(subValues['tvet_target'])) * 100).toFixed(1)
                                      : '0.0'}%
                                  </span>
                                </div>
                                <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Average */}
                        <div className="mt-4 p-3 bg-white/70 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-green-700 uppercase">Overall Attendance Rate:</span>
                            <span className="text-lg font-black text-green-600">
                              {subValues['primary_target'] && subValues['primary_attending'] &&
                                subValues['secondary_target'] && subValues['secondary_attending'] &&
                                subValues['tvet_target'] && subValues['tvet_attending']
                                ? (
                                  (
                                    (Number(subValues['primary_attending']) / Number(subValues['primary_target'])) * 100 +
                                    (Number(subValues['secondary_attending']) / Number(subValues['secondary_target'])) * 100 +
                                    (Number(subValues['tvet_attending']) / Number(subValues['tvet_target'])) * 100
                                  ) / 3
                                ).toFixed(1)
                                : '0.0'}%
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500">
                            Average attendance rate across Primary, Secondary, and TVET
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Marriage and Divorce Indicator - Complex Calculation */}
                    {indicatorId === '132' && (
                      <div className="space-y-6 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                          </svg>
                          <h4 className="font-bold text-purple-800 text-sm">Marriage & Divorce Recording - Dual Calculation</h4>
                        </div>

                        <div className="space-y-4">
                          {/* Marriage */}
                          <div className="space-y-2 bg-white p-4 rounded-lg border border-purple-100">
                            <h5 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              Marriage Events
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                  Target Events
                                </label>
                                <input
                                  type="number"
                                  value={subValues['marriage_target'] ?? ''}
                                  onChange={(e) => handleSubValueChange('marriage_target', e.target.value)}
                                  placeholder="e.g. 500"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="1"
                                />
                                <p className="text-[9px] text-slate-500">Total marriage events</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                  Recorded Events
                                </label>
                                <input
                                  type="number"
                                  value={subValues['marriage_recorded'] ?? ''}
                                  onChange={(e) => handleSubValueChange('marriage_recorded', e.target.value)}
                                  placeholder="e.g. 480"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="0"
                                />
                                <p className="text-[9px] text-slate-500">Events recorded</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  Recording Rate
                                </label>
                                <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['marriage_target']) > 0
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-slate-200 bg-slate-100'
                                  } flex items-center`}>
                                  <span className={`text-xl font-black ${Number(subValues['marriage_target']) > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                    }`}>
                                    {Number(subValues['marriage_target']) > 0 && subValues['marriage_recorded'] !== undefined
                                      ? ((Number(subValues['marriage_recorded']) / Number(subValues['marriage_target'])) * 100).toFixed(1)
                                      : '0.0'}%
                                  </span>
                                </div>
                                <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                              </div>
                            </div>
                          </div>

                          {/* Divorce */}
                          <div className="space-y-2 bg-white p-4 rounded-lg border border-purple-100">
                            <h5 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              Divorce Events
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                  Target Events
                                </label>
                                <input
                                  type="number"
                                  value={subValues['divorce_target'] ?? ''}
                                  onChange={(e) => handleSubValueChange('divorce_target', e.target.value)}
                                  placeholder="e.g. 100"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="1"
                                />
                                <p className="text-[9px] text-slate-500">Total divorce events</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                                  Recorded Events
                                </label>
                                <input
                                  type="number"
                                  value={subValues['divorce_recorded'] ?? ''}
                                  onChange={(e) => handleSubValueChange('divorce_recorded', e.target.value)}
                                  placeholder="e.g. 95"
                                  className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                  min="0"
                                />
                                <p className="text-[9px] text-slate-500">Events recorded</p>
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                  Recording Rate
                                </label>
                                <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['divorce_target']) > 0
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-slate-200 bg-slate-100'
                                  } flex items-center`}>
                                  <span className={`text-xl font-black ${Number(subValues['divorce_target']) > 0
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
                                    }`}>
                                    {Number(subValues['divorce_target']) > 0 && subValues['divorce_recorded'] !== undefined
                                      ? ((Number(subValues['divorce_recorded']) / Number(subValues['divorce_target'])) * 100).toFixed(1)
                                      : '0.0'}%
                                  </span>
                                </div>
                                <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Average */}
                        <div className="mt-4 p-3 bg-white/70 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-purple-700 uppercase">Overall Recording Rate:</span>
                            <span className="text-lg font-black text-purple-600">
                              {subValues['marriage_target'] && subValues['marriage_recorded'] &&
                                subValues['divorce_target'] && subValues['divorce_recorded']
                                ? (
                                  (
                                    (Number(subValues['marriage_recorded']) / Number(subValues['marriage_target'])) * 100 +
                                    (Number(subValues['divorce_recorded']) / Number(subValues['divorce_target'])) * 100
                                  ) / 2
                                ).toFixed(1)
                                : '0.0'}%
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500">
                            Average recording rate across Marriage and Divorce events
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Generic Percentage Calculation for other percentage indicators */}
                    {selectedIndicator?.measurementType === 'percentage' &&
                      !['74', '83', '87', '88', '101', '132', '69', '99', '67', '89', '43'].includes(indicatorId) && (
                        <div className="space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <h4 className="font-bold text-blue-800 text-sm">Percentage Calculation</h4>
                          </div>

                          {/* FORCE 3-BOX SYSTEM - Always show denominator, numerator, and auto-calculated percentage */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Denominator (Target) */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Denominator (Target)
                              </label>
                              <input
                                type="number"
                                value={subValues['target_pop'] ?? ''}
                                onChange={(e) => handleSubValueChange('target_pop', e.target.value)}
                                placeholder="e.g. 10000"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="1"
                                required
                              />
                              <p className="text-[9px] text-slate-500">Total target population</p>
                            </div>

                            {/* Numerator (Achieved) */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Numerator (Achieved)
                              </label>
                              <input
                                type="number"
                                value={subValues['achieved_pop'] ?? ''}
                                onChange={(e) => handleSubValueChange('achieved_pop', e.target.value)}
                                placeholder="e.g. 2000"
                                className={`${inputClasses} placeholder:text-slate-300 bg-white`}
                                min="0"
                                required
                              />
                              <p className="text-[9px] text-slate-500">Number achieved so far</p>
                            </div>

                            {/* Calculated Percentage */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Calculated Percentage
                              </label>
                              <div className={`h-12 px-4 rounded-xl border-2 ${Number(subValues['target_pop']) > 0
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-slate-100'
                                } flex items-center`}>
                                <span className={`text-xl font-black ${Number(subValues['target_pop']) > 0
                                  ? 'text-emerald-600'
                                  : 'text-slate-400'
                                  }`}>
                                  {Number(subValues['target_pop']) > 0 && subValues['achieved_pop'] !== undefined
                                    ? ((Number(subValues['achieved_pop']) / Number(subValues['target_pop'])) * 100).toFixed(1)
                                    : '0.0'}%
                                </span>
                              </div>
                              <p className="text-[9px] text-emerald-600 font-bold">Auto-calculated from inputs</p>
                            </div>
                          </div>

                          <div className="mt-3 p-3 bg-white/70 rounded-lg border border-blue-100">
                            <p className="text-[10px] text-blue-700 font-semibold">
                              <span className="font-black">Formula:</span> (Numerator ÷ Denominator) × 100 = Percentage
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1">
                              This calculated percentage will be compared against the fixed target for progress tracking.
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="block text-[10px] font-bold text-blue-700 uppercase">Value Recorded</label>
                    <input
                      type="number"
                      value={achievementValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Ensure input is 0 or greater as per user requirement
                        if (value === '' || Number(value) >= 0) {
                          setAchievementValue(value);
                        }
                      }}
                      placeholder="e.g. 500"
                      className={`${inputClasses} placeholder:text-slate-300 placeholder:font-normal`}
                      disabled={!indicatorId}
                      required
                      min="0"
                    />
                  </div>
                )}

                <div className="space-y-1.5 md:space-y-2">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">Add Comment to this Indicator</label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Briefly explain any deviations or key notes..."
                    className="w-full min-h-[100px] p-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all outline-none resize-none placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>

                {/* Supporting Documents Upload */}
                <div className="space-y-3 mt-4">
                  <label className="block text-xs md:text-sm font-bold text-slate-800 tracking-tight uppercase">
                    Supporting Documents (Optional)
                  </label>
                  <p className="text-xs text-slate-500">Upload images or PDFs to support your submission (max 5 files, 10MB each)</p>

                  {/* Upload Button */}
                  <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isUploading ? 'border-slate-300 bg-slate-50 cursor-not-allowed' : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100'}`}>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-semibold text-blue-700">
                        {isUploading ? 'Uploading...' : 'Upload Files'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    {uploadProgress && (
                      <span className={`text-sm font-medium ${uploadProgress.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                        {uploadProgress}
                      </span>
                    )}
                  </div>

                  {/* Uploaded Files Preview */}
                  {supportingDocuments.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                      {supportingDocuments.map((doc, index) => (
                        <div key={index} className="relative group bg-slate-100 rounded-xl p-3 border border-slate-200">
                          {doc.format === 'pdf' ? (
                            <div className="flex flex-col items-center justify-center h-24">
                              <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9 14c0-.6.4-1 1-1h4c.6 0 1 .4 1 1s-.4 1-1 1h-4c-.6 0-1-.4-1-1z" />
                              </svg>
                              <span className="text-xs font-semibold text-slate-600 mt-1 truncate max-w-full">PDF</span>
                            </div>
                          ) : (
                            <img
                              src={doc.url}
                              alt={doc.originalName}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          )}
                          <p className="text-xs text-slate-500 mt-2 truncate">{doc.originalName}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 md:pt-4">
                <button
                  type="submit"
                  className={`w-full h-14 rounded-2xl ${initialEntry ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-3 group ring-offset-2 focus:ring-4 focus:ring-slate-900/20`}
                >
                  <span>{initialEntry ? 'Update Changes' : 'Submit Achievement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FillFormView;
