import React, { useState } from 'react';
import { PILLARS, INDICATORS } from '../data';
import { MonitoringEntry } from '../types';
import { formatDate } from '../utils/dateUtils';

interface UserInfo {
  email: string;
  name: string;
  role: string;
  userType?: 'super_admin' | 'head' | 'employee';
  unit?: string;
}

interface ResponsesViewProps {
  entries: MonitoringEntry[];
  user: UserInfo;
  onEdit: (entry: MonitoringEntry) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onViewUserProfile?: (email: string) => void;
}

const ResponsesView: React.FC<ResponsesViewProps> = ({ entries, user, onEdit, onDelete, onViewUserProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { value: string; comments: string; subValues?: Record<string, string> }>>({});

  const filteredEntries = entries.filter(entry => {
    // More flexible pillar lookup - check both ID and name
    const pillar = PILLARS.find(p => p.id === entry.pillarId || p.name === entry.pillarId);
    const indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
    const searchStr = `${pillar?.name || entry.pillarName || ''} ${indicator?.name || entry.indicatorName || ''} ${entry.month} ${entry.comments || ''}`.toLowerCase();
    
    // Apply filters
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesPillar = !selectedPillar || entry.pillarName === selectedPillar || pillar?.name === selectedPillar;
    const matchesMonth = !selectedMonth || entry.month === selectedMonth;
    const matchesQuarter = !selectedQuarter || entry.quarterId?.toLowerCase() === selectedQuarter.toLowerCase();
    
    return matchesSearch && matchesPillar && matchesMonth && matchesQuarter;
  });

  // Get unique pillars from entries
  const availablePillars = Array.from(new Set(entries.map(entry => entry.pillarName || 'Unknown'))).sort();
  
  // Get unique months from entries
  const availableMonths = Array.from(new Set(entries.map(entry => entry.month))).sort();
  
  // Get unique quarters from entries
  const availableQuarters = Array.from(new Set(entries.map(entry => entry.quarterId).filter(Boolean))).sort();

  const handleEditClick = (entry: MonitoringEntry) => {
    setEditingId((entry as any)._id);
    setEditValues({
      ...editValues,
      [(entry as any)._id]: {
        value: entry.value.toString(),
        comments: entry.comments || '',
        subValues: entry.subValues ? { ...entry.subValues } : undefined
      }
    });
  };

  const handleSaveClick = async (entry: MonitoringEntry) => {
    const entryId = (entry as any)._id;
    if (!entryId) return;

    const updatedEntry = {
      ...entry,
      value: Number(editValues[entryId]?.value || entry.value),
      comments: editValues[entryId]?.comments || entry.comments,
      subValues: editValues[entryId]?.subValues || entry.subValues
    };

    await onEdit(updatedEntry);
    setEditingId(null);
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  const handleSubValueChange = (entryId: string, subIndicatorName: string, value: string) => {
    setEditValues({
      ...editValues,
      [entryId]: {
        ...editValues[entryId],
        subValues: {
          ...editValues[entryId]?.subValues,
          [subIndicatorName]: value
        }
      }
    });
  };

  const handleDownloadDocument = async (document: any) => {
  try {
    // Get file extension from original name or URL
    const originalName = document.originalName || 'supporting-document';
    const fileUrl = document.url;
    
    // Fetch the file to get the correct blob and type
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    
    // Create a blob URL with the correct MIME type
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const link = window.document.createElement('a');
    link.href = blobUrl;
    link.download = originalName;
    link.style.display = 'none';
    
    // Append to body, click, and remove
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    // Clean up the blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    // Fallback: open in new tab if download fails
    try {
      window.open(document.url, '_blank');
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      alert('Error downloading document. Please try again.');
    }
  }
};

  const handleDownloadPdf = async (entry: MonitoringEntry) => {
    const entryId = (entry as any)._id;
    if (!entryId) return;

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();

      // Set up fonts and colors
      pdf.setFont('helvetica');
      const primaryColor = [59, 130, 246]; // blue-600
      const secondaryColor = [107, 114, 128]; // gray-500
      
      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('NGOMA DISTRICT', 105, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text('Performance Indicator Report', 105, 30, { align: 'center' });
      
      // Submission Details
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date: ${formatDate(new Date())}`, 20, 50);
      pdf.text(`Submitted By: ${entry.submittedBy || 'Unknown'}`, 20, 60);
      pdf.text(`Period: ${entry.month} (${entry.quarterId?.toUpperCase()})`, 20, 70);
      
      // Pillar and Indicator Info
      pdf.setFontSize(14);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('Pillar Information', 20, 90);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Pillar: ${entry.pillarName || 'Unknown'}`, 20, 100);
      pdf.text(`Indicator: ${entry.indicatorName || 'Unknown'}`, 20, 110);
      
      // Performance Data
      pdf.setFontSize(14);
      pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.text('Performance Data', 20, 130);
      
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      let currentY = 140;
      
      if (entry.subValues && Object.keys(entry.subValues).length > 0) {
        // Sub-indicators
        pdf.text('Sub-indicator Performance:', 20, currentY);
        currentY += 10;
        
        Object.entries(entry.subValues).forEach(([subIndicatorName, subIndicatorValue]) => {
          const formattedName = subIndicatorName.charAt(0).toUpperCase() + subIndicatorName.slice(1);
          pdf.text(`${formattedName}:`, 25, currentY);
          pdf.text(`Achievement: ${subIndicatorValue?.toLocaleString()}`, 35, currentY + 6);
          pdf.text(`Target: ${entry.targetValue?.toLocaleString() || 'Not set'}`, 35, currentY + 12);
          currentY += 20;
        });
      } else {
        // Single indicator
        pdf.text('Achievement:', 20, currentY);
        pdf.setFontSize(12);
        pdf.text(`${entry.value?.toLocaleString() || '0'}`, 60, currentY);
        currentY += 10;
        
        pdf.setFontSize(11);
        pdf.text('Target:', 20, currentY);
        pdf.setFontSize(12);
        pdf.text(`${entry.targetValue?.toLocaleString() || 'Not set'}`, 60, currentY);
        currentY += 10;
      }
      
      // Comments
      if (entry.comments) {
        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('Comments', 20, currentY + 10);
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        const splitComments = pdf.splitTextToSize(entry.comments, 170);
        pdf.text(splitComments, 20, currentY + 20);
      }
      
      // Supporting Documents
      if ((entry as any).supportingDocuments && (entry as any).supportingDocuments.length > 0) {
        const docsY = entry.comments ? currentY + 40 : currentY + 20;
        pdf.setFontSize(14);
        pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.text('Supporting Documents', 20, docsY);
        
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${(entry as any).supportingDocuments.length} file(s) attached`, 20, docsY + 10);
      }
      
      // Footer
      pdf.setFontSize(10);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text('Generated by Ngoma District Imihigo Tracking System', 105, 280, { align: 'center' });
      
      // Save the PDF
      const fileName = `${entry.pillarName?.replace(/\s+/g, '_')}_${entry.indicatorName?.replace(/\s+/g, '_')}_${entry.month}_${entry.quarterId}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const canEdit = user.userType === 'super_admin' || user.userType === 'head';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col space-y-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
            Submitted Responses
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-normal">Review, edit, and manage all submitted entries.</p>
        </div>
        
        {/* Filters Section */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search responses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Pillar Filter */}
          <div className="relative">
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
              className="h-12 px-4 pr-10 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm appearance-none cursor-pointer"
            >
              <option value="">All Pillars</option>
              {availablePillars.map(pillar => (
                <option key={pillar} value={pillar}>{pillar}</option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {/* Month Filter */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-12 px-4 pr-10 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm appearance-none cursor-pointer"
            >
              <option value="">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {/* Quarter Filter */}
          <div className="relative">
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="h-12 px-4 pr-10 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm appearance-none cursor-pointer"
            >
              <option value="">All Quarters</option>
              {availableQuarters.map(quarter => (
                <option key={quarter} value={quarter}>{quarter.toUpperCase()}</option>
              ))}
            </select>
            <svg className="w-5 h-5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {/* Clear Filters Button */}
          {(selectedPillar || selectedMonth || selectedQuarter || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPillar('');
                setSelectedMonth('');
                setSelectedQuarter('');
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </header>

      {/* Stats Summary - Single Compact Card */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 rounded-xl shadow-md border border-blue-200/50 p-4 transition-all duration-500 ease-out hover:shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Submissions */}
          <div className="group hover:bg-blue-50 rounded-lg p-2 transition-all duration-300 hover:shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Total</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums group-hover:text-blue-600 transition-colors duration-300">{filteredEntries.length}</p>
          </div>
          
          {/* Modified */}
          <div className="group hover:bg-purple-50 rounded-lg p-2 transition-all duration-300 hover:shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Modified</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums group-hover:text-purple-600 transition-colors duration-300">{filteredEntries.filter(e => (e as any).hasBeenModified).length}</p>
          </div>
          
          {/* This Month */}
          <div className="group hover:bg-emerald-50 rounded-lg p-2 transition-all duration-300 hover:shadow-sm">
            <p className="text-xs text-slate-500 font-medium">This Month</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">{filteredEntries.filter(e => e.month === new Date().toLocaleString('default', { month: 'long' })).length}</p>
          </div>
          
          {/* Unique Indicators */}
          <div className="group hover:bg-amber-50 rounded-lg p-2 transition-all duration-300 hover:shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Indicators</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums group-hover:text-amber-600 transition-colors duration-300">{new Set(filteredEntries.map(e => e.indicatorId)).size}</p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry, idx) => {
            const isModified = (entry as any).hasBeenModified && (entry as any).modificationStatus === 'approved_modified';
            // More flexible pillar lookup - check both ID and name
            const pillar = PILLARS.find(p => p.id === entry.pillarId || p.name === entry.pillarId);
            // Try to find indicator in the found pillar, or search all pillars if not found
            let indicator = pillar?.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
            if (!indicator) {
              // Search all pillars for the indicator
              for (const p of PILLARS) {
                indicator = p.outputs.flatMap(o => o.indicators).find(i => i.id === entry.indicatorId);
                if (indicator) break;
              }
            }
            
            return (
              <div 
                key={idx}
                className={`relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border ${
                  isModified ? 'border-purple-300 shadow-purple-50' : 'border-slate-200'
                }`}
              >
                {/* Modification Badge */}
                {isModified && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Modified</span>
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {pillar?.name || entry.pillarName || 'Unknown Pillar'}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {indicator?.name || entry.indicatorName || 'Unknown Indicator'}
                    </h3>
                  </div>
                  
                  {/* Period */}
                  <div className="mb-3">
                    <span className="inline-block bg-slate-100 text-xs font-medium text-slate-700 px-2 py-1 rounded">
                      {entry.month} ({entry.quarterId?.toUpperCase()})
                    </span>
                  </div>
                  
                  {/* Achievement Values */}
                  <div className={`mb-3 p-2 rounded-lg ${isModified ? 'bg-purple-50' : 'bg-slate-50'}`}>
                    {editingId === (entry as any)._id ? (
                      // Edit Mode
                      <div className="space-y-2">
                        {indicator?.isDual || (entry.subValues && Object.keys(entry.subValues).length > 0) ? (
                          <div className="space-y-1">
                            {Object.entries(entry.subValues || {}).map(([subIndicatorName, subIndicatorValue]) => (
                              <div key={subIndicatorName} className="text-xs">
                                <div className="font-medium text-slate-700 mb-1">
                                  {subIndicatorName.charAt(0).toUpperCase() + subIndicatorName.slice(1).replace(/_/g, ' ')}:
                                </div>
                                <input
                                  type="number"
                                  value={editValues[(entry as any)._id]?.subValues?.[subIndicatorName] || subIndicatorValue}
                                  onChange={(e) => {
                                    const newSubValues = {
                                      ...editValues[(entry as any)._id]?.subValues,
                                      [subIndicatorName]: e.target.value
                                    };
                                    setEditValues({
                                      ...editValues,
                                      [(entry as any)._id]: {
                                        ...editValues[(entry as any)._id],
                                        subValues: newSubValues
                                      }
                                    });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="number"
                              value={editValues[(entry as any)._id]?.value || entry.value}
                              onChange={(e) => setEditValues({
                                ...editValues,
                                [(entry as any)._id]: {
                                  ...editValues[(entry as any)._id],
                                  value: e.target.value
                                }
                              })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        
                        {/* Comments Edit */}
                        <div>
                          <textarea
                            value={editValues[(entry as any)._id]?.comments || entry.comments}
                            onChange={(e) => setEditValues({
                              ...editValues,
                              [(entry as any)._id]: {
                                ...editValues[(entry as any)._id],
                                comments: e.target.value
                              }
                            })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={2}
                            placeholder="Add comments..."
                          />
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        {indicator?.isDual || (entry.subValues && Object.keys(entry.subValues).length > 0) ? (
                          <div className="space-y-1">
                            {Object.entries(entry.subValues || {}).map(([subIndicatorName, subIndicatorValue]) => (
                              <div key={subIndicatorName} className="text-xs">
                                <div className="font-medium text-slate-700">
                                  {subIndicatorName.charAt(0).toUpperCase() + subIndicatorName.slice(1).replace(/_/g, ' ')}: 
                                  <span className={`font-bold ${isModified ? 'text-purple-700' : 'text-blue-700'}`}>
                                    {subIndicatorValue?.toLocaleString()}
                                  </span>
                                </div>
                                {/* Show percentage for achieved values */}
                                {subIndicatorName.startsWith('achieved_') && (entry as any).subValues?.[`${subIndicatorName}_percentage`] && (
                                  <div className="text-xs text-green-600">
                                    ({(entry as any).subValues[`${subIndicatorName}_percentage`].toFixed(1)}%)
                                  </div>
                                )}
                                {/* Show numerator/denominator for percentage indicators */}
                                {subIndicatorName.includes('percentage') && (
                                  <div className="text-xs text-slate-500">
                                    {subIndicatorName.replace('_percentage', '')}: {subIndicatorValue}%
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className={`text-lg font-bold ${isModified ? 'text-purple-700' : 'text-blue-700'}`}>
                              {entry.value?.toLocaleString()}
                            </div>
                            {indicator?.measurementType === 'percentage' && (
                              <div className="text-xs text-slate-500 mt-1">
                                {entry.subValues?.achieved_pop && entry.subValues?.target_pop ? (
                                  <span>({entry.subValues.achieved_pop.toLocaleString()} / {entry.subValues.target_pop.toLocaleString()})</span>
                                ) : (
                                  <span>Percentage indicator</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Comments */}
                  {entry.comments && editingId !== (entry as any)._id && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 rounded p-2">
                        {entry.comments}
                      </p>
                    </div>
                  )}
                  
                  {/* Supporting Documents */}
                  <div className="mb-3">
                    {(entry as any).supportingDocuments && (entry as any).supportingDocuments.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-green-600 bg-green-50 rounded p-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium">{(entry as any).supportingDocuments.length} Supporting Doc{(entry as any).supportingDocuments.length > 1 ? 's' : ''}</span>
                        </div>
                        {/* Download buttons for each document */}
                        <div className="space-y-1">
                          {(entry as any).supportingDocuments.map((doc: any, docIndex: number) => (
                            <button
                              key={docIndex}
                              onClick={() => handleDownloadDocument(doc)}
                              className="w-full flex items-center justify-between text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded px-2 py-1.5 transition-colors"
                            >
                              <span className="truncate flex-1 text-left">{doc.originalName || `Document ${docIndex + 1}`}</span>
                              <svg className="w-3 h-3 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-xs text-amber-600 bg-amber-50 rounded p-2 border border-amber-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">No Supporting Doc</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Modification Details */}
                  {isModified && (
                    <div className="mb-3 bg-purple-50 rounded-lg p-2 border border-purple-200">
                      <div className="text-xs text-purple-700">
                        <div className="font-medium">Modified by: {(entry as any).modifiedBy || 'Unknown'}</div>
                        <div>Date: {(entry as any).modifiedAt ? formatDate((entry as any).modifiedAt) : 'Unknown'}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>{formatDate(entry.timestamp || '')}</span>
                    {entry.submittedBy ? (
                      <button
                        onClick={() => onViewUserProfile?.(entry.submittedBy!)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                        title={`View ${entry.submittedBy}'s profile`}
                      >
                        {entry.submittedBy.split('@')[0]}
                      </button>
                    ) : (
                      <span>Unknown</span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {editingId === (entry as any)._id ? (
                      // Edit Mode Buttons
                      <>
                        <button
                          onClick={() => handleSaveClick(entry)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold py-1.5 px-2 text-xs transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => handleCancelClick()}
                          className="flex-1 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold py-1.5 px-2 text-xs transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </button>
                      </>
                    ) : (
                      // View Mode Buttons
                      <>
                        <button
                          onClick={() => handleEditClick(entry)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold py-1.5 px-2 text-xs transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(entry)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold py-1.5 px-2 text-xs transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => onDelete((entry as any)._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold py-1.5 px-2 text-xs transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No submissions found</h3>
            <p className="text-slate-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResponsesView;
