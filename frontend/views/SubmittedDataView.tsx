import React, { useState } from 'react';
import { PILLARS, INDICATORS } from '../data';
import { MonitoringEntry } from '../types';

interface UserInfo {
  email: string;
  name: string;
  role: string;
  userType?: 'super_admin' | 'head' | 'employee';
  unit?: string;
}

interface SubmittedDataViewProps {
  entries: MonitoringEntry[];
  user: UserInfo;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (entry: MonitoringEntry) => Promise<void>;
  onDownload?: (entry: MonitoringEntry) => void;
}

const EditModal: React.FC<{
  entry: MonitoringEntry;
  onSave: (updatedEntry: MonitoringEntry) => Promise<void>;
  onCancel: () => void;
}> = ({ entry, onSave, onCancel }) => {
  const [value, setValue] = useState(entry.value.toString());
  const [comments, setComments] = useState(entry.comments || '');
  const [subValues, setSubValues] = useState<Record<string, string>>(entry.subValues || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find sub-indicators for this entry
  const entryIndicator = INDICATORS.find(i => i.id === entry.indicatorId);
  const subIndicators = entryIndicator?.subIndicatorIds || {};
  const hasSubIndicators = Object.keys(subIndicators).length > 0;

  const handleSubValueChange = (subIndicatorId: string, value: string) => {
    setSubValues({
      ...subValues,
      [subIndicatorId]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Transform subValues to use subIndicator IDs as keys for backend compatibility
      let transformedSubValues = { ...subValues };

      // If this entry has subindicators, ensure we're using the correct key format
      if (hasSubIndicators && Object.keys(subValues).length > 0) {
        const transformed: Record<string, string> = {};

        // Map short names to subindicator IDs
        Object.entries(subIndicators).forEach(([key, subIndicatorId]) => {
          if (subValues[key]) {
            transformed[subIndicatorId] = subValues[key];
          } else if (subValues[subIndicatorId]) {
            transformed[subIndicatorId] = subValues[subIndicatorId];
          }
        });

        transformedSubValues = transformed;
      }

      const updatedEntry = {
        ...entry,
        value: parseFloat(value) || 0,
        comments: comments,
        subValues: Object.keys(transformedSubValues).length > 0 ? transformedSubValues : undefined
      };

      await onSave(updatedEntry);
      setIsSaving(false);
    } catch (err) {
      setError('Failed to update entry. Please try again.');
      setIsSaving(false);
    }
  };

  // Simple modal for indicators with subindicators - just show subindicator inputs
  if (hasSubIndicators) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Sub-Indicators</h3>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={isSaving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                {entry.indicatorName || 'Unknown'}
              </p>

              <div className="space-y-2">
                {Object.entries(subIndicators).map(([key, subIndicatorId]) => {
                  const subIndicatorObj = INDICATORS.find(i => i.id === subIndicatorId);
                  // Use the short key (maize, cassava, etc.) and get the current value
                  const currentValue = subValues?.[key] || subValues?.[subIndicatorId] || '';

                  return (
                    <div key={subIndicatorId} className="space-y-1">
                      <label className="block text-xs font-medium text-slate-600">
                        {key} {/* Show just the short name like "maize", "cassava", etc. */}
                      </label>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleSubValueChange(key, e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        min="0"
                        step="0.01"
                        placeholder="Enter value"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Regular modal for indicators without subindicators
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-slate-900">Edit Entry</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSaving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Indicator</label>
            <input
              type="text"
              value={entry.indicatorName || 'Unknown'}
              readOnly
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-900 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Current Value</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Add comments..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SubmittedDataView: React.FC<SubmittedDataViewProps> = (props) => {
  const { entries, user, onDelete, onEdit, onDownload } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<MonitoringEntry | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditClick = (entry: MonitoringEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = async (updatedEntry: MonitoringEntry) => {
    try {
      if (onEdit) {
        await onEdit(updatedEntry);
        setEditSuccess(true);
        setTimeout(() => setEditSuccess(false), 3000);
        setEditingEntry(null);
      }
    } catch (error) {
      setEditError('Failed to update entry. Please try again.');
      setTimeout(() => setEditError(null), 3000);
    }
  };

  // Debug: Log entries to see what data we're receiving
  console.log('=== SUBMITTED DATA VIEW DEBUG ===');
  console.log('Received entries count:', entries.length);
  console.log('Received entries:', entries);
  console.log('Sample entry structure:', entries[0]);
  
  // Check if entries have the expected structure
  if (entries.length > 0) {
    const firstEntry = entries[0];
    console.log('First entry analysis:', {
      _id: firstEntry._id,
      pillarId: firstEntry.pillarId,
      pillarName: firstEntry.pillarName,
      indicatorId: firstEntry.indicatorId,
      indicatorName: firstEntry.indicatorName,
      hasSubValues: firstEntry.subValues && Object.keys(firstEntry.subValues).length > 0,
      subValues: firstEntry.subValues,
      hasSupportingDocs: firstEntry.supportingDocuments && firstEntry.supportingDocuments.length > 0,
      supportingDocuments: firstEntry.supportingDocuments
    });
  }

  // If no entries, use some sample data for testing
  const entriesWithFallback = entries.length > 0 ? entries : [
    {
      _id: 'sample-1',
      pillarId: 'economic',
      indicatorId: '1',
      quarterId: 'q1',
      month: 'July',
      value: 1000,
      targetValue: 1500,
      comments: 'Sample economic indicator'
    },
    {
      _id: 'sample-2',
      pillarId: 'social',
      indicatorId: '52',
      quarterId: 'q2',
      month: 'October',
      value: 500,
      targetValue: 800,
      comments: 'Sample social indicator'
    }
  ];

  // Map pillar names to IDs for database compatibility
  const mapPillarNameToId = (pillarName: string): string => {
    const pillarMap: Record<string, string> = {
      'Economic Transformation Pillar': 'economic',
      'Social Transformation Pillar': 'social',
      'Transformational Governance Pillar': 'governance'
    };
    return pillarMap[pillarName] || pillarName.toLowerCase();
  };

  const filteredEntries = entriesWithFallback.filter(entry => {
    // Handle both short IDs and full names for pillarId
    const effectivePillarId = typeof entry.pillarId === 'string' && entry.pillarId.includes(' ')
      ? mapPillarNameToId(entry.pillarId)
      : entry.pillarId;

    const pillar = PILLARS.find(p => p.id === effectivePillarId);
    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);

    // Enhanced debug logging for each entry
    console.log(`Entry ${entry._id} debug:`, {
      originalPillarId: entry.pillarId,
      effectivePillarId: effectivePillarId,
      pillarId: entry.indicatorId,
      foundPillar: pillar ? pillar.name : 'NOT FOUND',
      foundIndicator: indicator ? indicator.name : 'NOT FOUND',
      entryPillarName: entry.pillarName,
      entryIndicatorName: entry.indicatorName,
      willBeIncluded: pillar && indicator
    });

    // More permissive filtering - include entry if pillar OR indicator is found
    // Also include entries that have pillarName/indicatorName from database
    const hasPillarData = pillar || entry.pillarName;
    const hasIndicatorData = indicator || entry.indicatorName;
    
    if (!hasPillarData || !hasIndicatorData) {
      console.warn(`Entry ${entry._id} has missing data:`, {
        hasPillarData,
        hasIndicatorData,
        pillarName: entry.pillarName,
        indicatorName: entry.indicatorName
      });
    }

    // Search functionality - include entries that match search terms
    const searchStr = `${pillar?.name || entry.pillarName || ''} ${indicator?.name || entry.indicatorName || ''} ${entry.month || ''} ${entry.value || ''} ${entry.submittedBy || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    
    // Include entry if it has data and matches search
    const shouldInclude = hasPillarData && hasIndicatorData && matchesSearch;
    
    console.log(`Entry ${entry._id} final decision:`, { shouldInclude, matchesSearch });
    
    return shouldInclude;
  });

  // Debug: Log filtered results
  console.log('SubmittedDataView - Filtered entries:', filteredEntries);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Submitted Data</h1>
          <p className="mt-2 text-slate-600 font-medium">View all submitted indicators with pillar and sub-indicator relationships</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search submitted data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 h-12 pl-12 pr-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
      </header>

      {/* Success/Error notifications */}
      {editSuccess && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Entry updated successfully!</span>
          </div>
        </div>
      )}

      {editError && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="font-medium">{editError}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-left">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Pillar</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Indicator</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Period</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-right">Value / Target</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Comments</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Supporting Docs</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Submitted By</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-700 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry, idx) => {
                  const entryId = (entry as any)._id;

                  // Apply the same pillar mapping logic for display
                  const effectivePillarId = typeof entry.pillarId === 'string' && entry.pillarId.includes(' ')
                    ? mapPillarNameToId(entry.pillarId)
                    : entry.pillarId;

                  const pillar = PILLARS.find(p => p.id === effectivePillarId);
                  const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);

                  // Find parent indicator if this is a sub-indicator
                  const parentIndicator = INDICATORS.find(parent =>
                    parent.subIndicatorIds && Object.values(parent.subIndicatorIds).includes(indicator?.id || '')
                  );

                  // Determine if this indicator has sub-indicators
                  const hasSubIndicators = indicator?.subIndicatorIds && Object.keys(indicator.subIndicatorIds).length > 0;

                  return (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-900">
                          {pillar?.name || entry.pillarName || 'Unknown Pillar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="text-sm font-semibold text-slate-900">
                          <p className="line-clamp-1">{indicator?.name || entry.indicatorName || 'Unknown Indicator'}</p>
                          {/* Show if this indicator has sub-indicators */}
                          {hasSubIndicators && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              Has sub-indicators
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600">
                          {entry.month} ({entry.quarterId?.toUpperCase() || 'N/A'})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="space-y-1">
                          {/* Only show main indicator value if there are no sub-indicators */}
                          {!entry.subValues || Object.keys(entry.subValues).length === 0 ? (
                            <div>
                              <span className="text-sm font-black text-blue-700">
                                {entry.value?.toLocaleString() || '0'}
                              </span>
                              {entry.targetValue !== undefined && entry.targetValue !== null && (
                                <div className="text-xs text-slate-500">
                                  Target: {entry.targetValue.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            // Show sub-indicator values if they exist
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs font-bold text-blue-800 mb-1">Sub-indicator Values:</p>
                              {Object.entries(entry.subValues).map(([subIndicatorId, subValue]) => {
                                // Find the sub-indicator name from INDICATORS
                                const subIndicator = INDICATORS.find(i => i.id === subIndicatorId);

                                // Also try to find by short name if direct ID lookup fails
                                const entryIndicator = INDICATORS.find(i => i.id === entry.indicatorId);
                                const subIndicators = entryIndicator?.subIndicatorIds || {};
                                const subIndicatorKey = Object.keys(subIndicators).find(key => subIndicators[key] === subIndicatorId) || subIndicatorId;

                                return (
                                  <div key={subIndicatorId} className="text-xs text-blue-700">
                                    <span className="font-medium">{subIndicatorKey}:</span>
                                    <span className="ml-1 font-bold">{Number(subValue).toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-xs text-slate-600">
                          <p className="line-clamp-2">{entry.comments || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-600">
                          {entry.supportingDocuments && entry.supportingDocuments.length > 0 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                              {entry.supportingDocuments.length} file(s)
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600">
                          {entry.submittedBy || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {user.userType === 'super_admin' || user.userType === 'head' ? (
                            <>
                              <button
                                onClick={() => onDelete && onDelete((entry as any)._id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleEditClick(entry)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => onDownload && onDownload(entry)}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Download
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <p className="text-slate-500 font-bold">No submitted data found</p>
                      <p className="text-sm text-slate-400">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onSave={handleSaveEdit}
          onCancel={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
};

export default SubmittedDataView;
