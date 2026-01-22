import React, { useState, useEffect } from 'react';
import { authGet, authPut, authDelete } from '../utils/authFetch';
import { PILLARS, INDICATORS } from '../data';
 import { MonitoringEntry } from '../types';

interface UserSubmittedViewProps {
  user: {
    email: string;
    name: string;
    userType: string;
  };
}

const UserSubmittedView: React.FC<UserSubmittedViewProps> = ({ user }) => {
  const [userEntries, setUserEntries] = useState<MonitoringEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEntry, setEditingEntry] = useState<MonitoringEntry | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Handle edit functionality
  const handleEdit = (entry: MonitoringEntry) => {
    setEditingEntry(entry);
  };

  const handleDownloadPdf = async (entry: MonitoringEntry) => {
    const id = entry._id;
    if (!id) return;

    setDownloadingId(id);
    try {
      const token = localStorage.getItem('authToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://full-system-8.onrender.com';
      const url = `${baseUrl}/api/submissions/${id}/pdf`;

      const response = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to download PDF:', response.status, response.statusText, errorText);
        alert(`Failed to download PDF: ${response.statusText}`);
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (entry.indicatorName || 'submission').toString().replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 60);
      a.href = objectUrl;
      a.download = `${safeName}_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle delete functionality
  const handleDelete = async (entryId: string) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        console.log('Attempting to delete submission:', entryId);
        const deleteUrl = `/api/submissions/${entryId}`;
        console.log('Delete URL:', deleteUrl);
        console.log('Full delete URL:', `${import.meta.env.VITE_API_URL || 'https://full-system-8.onrender.com'}${deleteUrl}`);
        
        const response = await authDelete(deleteUrl);
        console.log('Delete response status:', response.status);
        console.log('Delete response ok:', response.ok);
        
        if (response.ok) {
          // Remove from local state
          setUserEntries(prev => prev.filter(entry => entry._id !== entryId));
          console.log('Submission deleted successfully');
        } else {
          const errorText = await response.text();
          console.error('Failed to delete submission:', response.status, response.statusText);
          console.error('Error response:', errorText);
          alert(`Failed to delete submission: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error deleting submission:', error);
        alert('Error deleting submission. Please try again.');
      }
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    try {
      console.log('Attempting to update submission:', editingEntry._id);
      const updateUrl = `/api/submissions/${editingEntry._id}`;
      console.log('Update URL:', updateUrl);
      console.log('Full update URL:', `${import.meta.env.VITE_API_URL || 'https://full-system-8.onrender.com'}${updateUrl}`);
      console.log('Update data:', editingEntry);
      
      const response = await authPut(updateUrl, {
        ...editingEntry,
        // Update timestamp
        timestamp: new Date().toISOString()
      });
      
      console.log('Update response status:', response.status);
      console.log('Update response ok:', response.ok);
      
      if (response.ok) {
        const updatedData = await response.json();
        console.log('Updated submission data:', updatedData);
        
        // Update local state
        setUserEntries(prev => prev.map(entry => 
          entry._id === editingEntry._id ? updatedData : entry
        ));
        setEditingEntry(null);
        console.log('Submission updated successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to update submission:', response.status, response.statusText);
        console.error('Error response:', errorText);
        alert(`Failed to update submission: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      alert('Error updating submission. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUserEntries = async () => {
      try {
        console.log('=== USER SUBMITTED VIEW DEBUG ===');
        console.log('Current user email:', user.email);
        
        const response = await authGet('/api/submissions');
        console.log('Calling API URL:', '/api/submissions');
        console.log('Full API URL:', `${import.meta.env.VITE_API_URL || 'https://full-system-8.onrender.com'}/api/submissions`);
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          let allEntries;
          try {
            allEntries = JSON.parse(responseText);
            console.log('Parsed JSON successfully:', allEntries.length, 'entries');
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response starts with:', responseText.substring(0, 200));
            allEntries = [];
          }
          
          console.log('Total entries received:', allEntries.length);
          console.log('Sample entry structure:', allEntries[0]);
          
          // Debug: Show all entries with their submittedBy values
          console.log('All entries with submittedBy:');
          allEntries.forEach((entry: any, index: number) => {
            console.log(`Entry ${index}: submittedBy = "${entry.submittedBy}", email = "${user.email}", match = ${entry.submittedBy === user.email}`);
          });
          
          // Filter entries by current user's email
          const filteredEntries = allEntries.filter((entry: any) => entry.submittedBy === user.email);
          console.log('Filtered entries count:', filteredEntries.length);
          console.log('Filtered entries:', filteredEntries);
          
          setUserEntries(filteredEntries);
        } else {
          console.error('API response not ok:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching user submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEntries();
  }, [user.email]);

  // Helper function to map pillar name to ID
  const mapPillarNameToId = (pillarName: string): string => {
    const pillar = PILLARS.find(p => p.name === pillarName);
    return pillar ? pillar.id : pillarName;
  };

  // Filter entries based on search term
  const filteredEntries = userEntries.filter(entry => {
    const pillar = PILLARS.find(p => p.id === entry.pillarId || p.name === entry.pillarId);
    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
    
    const searchStr = `${pillar?.name || entry.pillarName || ''} ${indicator?.name || entry.indicatorName || ''} ${entry.month || ''} ${entry.value || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">My Submitted Responses</h1>
        <p className="text-slate-600">View and manage your submitted monitoring data</p>
      </header>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search your submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'No matching submissions found' : 'No submissions yet'}
            </h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start submitting data to see your responses here'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group submissions by date */}
            {(
              Object.entries(
                filteredEntries.reduce((groups, entry) => {
                  const date = new Date(entry.timestamp || Date.now());
                  const dateKey = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  
                  if (!groups[dateKey]) {
                    groups[dateKey] = [];
                  }
                  groups[dateKey].push(entry);
                  return groups;
                }, {} as Record<string, MonitoringEntry[]>)
              ) as Array<[string, MonitoringEntry[]]>
            ).map(([date, entries]) => (
              <div key={date} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Date Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{date}</h3>
                        <p className="text-sm text-slate-600">{entries.length} submission{entries.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                      {entries[0]?.quarterId?.toUpperCase() || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Submissions for this date */}
                <div className="divide-y divide-slate-100">
                  {entries.map((entry, idx) => {
                    const pillar = PILLARS.find(p => p.id === entry.pillarId || p.name === entry.pillarId);
                    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);

                    return (
                      <div key={idx} className="p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left side - Indicator info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                {pillar?.name || entry.pillarName || 'Unknown Pillar'}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {entry.quarterId?.toUpperCase() || 'N/A'}
                              </span>
                              <span className="text-xs text-slate-500">
                                {entry.month}
                              </span>
                            </div>
                            
                            <h4 className="text-base font-semibold text-slate-900 mb-3 leading-tight">
                              {indicator?.name || entry.indicatorName || 'Unknown Indicator'}
                            </h4>

                            {/* Values Display */}
                            <div className="flex flex-wrap gap-3 mb-3">
                              {entry.subValues && Object.keys(entry.subValues).length > 0 ? (
                                Object.entries(entry.subValues).map(([key, value]) => {
                                  // Hide percentage fields from display
                                  if (key.includes('_percentage')) {
                                    return null;
                                  }
                                  
                                  // Check if this value has a corresponding percentage
                                  const baseName = key.replace(/^(target_|achieved_)/, '').toLowerCase();
                                  const percentageKey = Object.keys(entry.subValues).find(k => k.includes(`${baseName}_percentage`));
                                  const percentage = percentageKey ? entry.subValues[percentageKey] : null;
                                  
                                  return (
                                    <div key={key} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-600 capitalize">{key}:</span>
                                        <span className="text-sm font-bold text-blue-700">{value?.toLocaleString() || '0'}</span>
                                        {percentage && (
                                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                                            {percentage}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600">Value:</span>
                                    <span className="text-sm font-bold text-blue-700">{entry.value?.toLocaleString() || '0'}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Comments */}
                            {entry.comments && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs text-amber-800">
                                  <span className="font-semibold">Note:</span> {entry.comments}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right side - Timestamp and Actions */}
                          <div className="flex flex-col items-end gap-2">
                            {/* Action Buttons */}
                            <div className="flex gap-2 mb-2">
                              {/* Download - always allowed */}
                              <button
                                onClick={() => handleDownloadPdf(entry)}
                                disabled={downloadingId === entry._id}
                                className={`inline-flex items-center px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors ${downloadingId === entry._id ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M4 7a4 4 0 014-4h8a4 4 0 014 4v10a4 4 0 01-4 4H8a4 4 0 01-4-4V7z" />
                                </svg>
                                {downloadingId === entry._id ? 'Downloading...' : 'Download PDF'}
                              </button>

                              {/* Edit - show for all, but employees get a notice */}
                              <button
                                onClick={() => {
                                  if (user.userType === 'head' || user.userType === 'super_admin') {
                                    handleEdit(entry);
                                  } else {
                                    alert('Only the head of unit can edit submitted data. Please contact your unit head to make changes.');
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>

                              {/* Delete - only for head or super_admin */}
                              {(user.userType === 'head' || user.userType === 'super_admin') && (
                                <button
                                  onClick={() => handleDelete(entry._id)}
                                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m0-6l5 4m-5 4h14a2 2 0 002-2V9a2 2 0 00-2-2h-4a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                })
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Submissions</p>
              <p className="text-2xl font-bold text-slate-900">{userEntries.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">This Quarter</p>
              <p className="text-2xl font-bold text-slate-900">
                {userEntries.filter(e => e.quarterId === 'q1' || e.quarterId === 'q2' || e.quarterId === 'q3' || e.quarterId === 'q4').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Unique Indicators</p>
              <p className="text-2xl font-bold text-slate-900">
                {new Set(userEntries.map(e => e.indicatorId)).size}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Edit Submission</h2>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Edit Form */}
            <div className="space-y-4">
              {/* Indicator Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-2">
                  {editingEntry.indicatorName}
                </h3>
                <p className="text-sm text-slate-600">
                  {editingEntry.month} ({editingEntry.quarterId?.toUpperCase() || 'N/A'})
                </p>
              </div>

              {/* Values */}
              <div className="space-y-3">
                {editingEntry.subValues && Object.keys(editingEntry.subValues).length > 0 ? (
                  Object.entries(editingEntry.subValues).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="text-sm font-medium text-slate-700 w-32 capitalize">
                        {key}:
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => {
                          const updatedEntry = { ...editingEntry };
                          updatedEntry.subValues = { ...editingEntry.subValues!, [key]: Number(e.target.value) };
                          setEditingEntry(updatedEntry);
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700 w-32">
                      Value:
                    </label>
                    <input
                      type="number"
                      value={editingEntry.value}
                      onChange={(e) => {
                        const updatedEntry = { ...editingEntry, value: Number(e.target.value) };
                        setEditingEntry(updatedEntry);
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={editingEntry.comments || ''}
                  onChange={(e) => {
                    const updatedEntry = { ...editingEntry, comments: e.target.value };
                    setEditingEntry(updatedEntry);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes or comments..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubmittedView;
