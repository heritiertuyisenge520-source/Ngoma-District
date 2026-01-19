import React, { useState, useMemo } from 'react';
import { PILLARS, QUARTERS, Indicator } from '../data';
import { MonitoringEntry } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { getIndicatorUnit } from '../utils/progressUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResponsesViewProps {
    entries: MonitoringEntry[];
    user: {
        email: string;
        name: string;
        role: string;
        userType?: 'super_admin' | 'head' | 'employee';
        unit?: string;
    } | null;
    onEdit: (entry: MonitoringEntry) => void;
    onDelete: (id: string) => void;
    onClear?: () => void;
}

const ResponsesView: React.FC<ResponsesViewProps> = ({ entries, user, onEdit, onDelete, onClear }) => {
    const [filterQuarter, setFilterQuarter] = useState<string>('all');
    const [filterPillar, setFilterPillar] = useState<string>('all');

// Edit request state for employees
const [showEditRequestModal, setShowEditRequestModal] = useState(false);
const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
const [editingEntry, setEditingEntry] = useState<MonitoringEntry | null>(null);
const [newValue, setNewValue] = useState<string>('');
const [newComments, setNewComments] = useState<string>('');
const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

    const isEmployee = user?.userType === 'employee';

const handleEditClick = (entry: MonitoringEntry) => {
    if (isEmployee) {
        // Employees must request edit through head of unit
        setEditingEntry(entry);
        setNewValue(entry.value.toString());
        setNewComments(entry.comments || '');
        setShowEditRequestModal(true);
    } else {
        // Other users can edit directly
        onEdit(entry);
    }
};

const handleDeleteClick = (entry: MonitoringEntry) => {
    if (isEmployee) {
        // Employees must request delete through head of unit
        setEditingEntry(entry);
        setShowDeleteRequestModal(true);
    } else {
        // Other users can delete directly
        onDelete((entry as any)._id);
    }
};

    const handleSubmitEditRequest = async () => {
        if (!editingEntry || !user) return;

        setIsSubmitting(true);
        try {
            const pillar = PILLARS.find(p => p.name === editingEntry.pillarId || p.id === editingEntry.pillarId || p.name === editingEntry.pillarName);
            const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === editingEntry.indicatorId);

            const response = await fetch(API_ENDPOINTS.DATA_CHANGE_REQUEST, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: (editingEntry as any)._id,
                    requestedBy: user.email,
                    requestedByName: user.name,
                    indicatorId: editingEntry.indicatorId,
                    indicatorName: indicator?.name || editingEntry.indicatorName,
                    pillarName: editingEntry.pillarName || editingEntry.pillarId,
                    quarterId: editingEntry.quarterId,
                    month: editingEntry.month,
                    oldValue: editingEntry.value,
                    newValue: Number(newValue),
                    oldComments: editingEntry.comments,
                    newComments: newComments,
                    unit: user.unit
                })
            });

            if (response.ok) {
                setSubmitSuccess('Your edit request has been submitted! Your data will be updated if the Head of Unit approves it.');
                setShowEditRequestModal(false);
                setTimeout(() => setSubmitSuccess(null), 5000);
            } else {
                alert('Failed to submit edit request');
            }
        } catch (error) {
            console.error('Error submitting edit request:', error);
            alert('Error connecting to server');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter entries based on selected quarter and pillar
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const matchQuarter = filterQuarter === 'all' || entry.quarterId === filterQuarter;
            const matchPillar = filterPillar === 'all' || entry.pillarId === filterPillar || entry.pillarName === filterPillar;
            return matchQuarter && matchPillar;
        });
    }, [entries, filterQuarter, filterPillar]);

    // Group entries by quarter for display
    const entriesByQuarter = useMemo(() => {
        const grouped: Record<string, MonitoringEntry[]> = {};

        filteredEntries.forEach(entry => {
            const qId = entry.quarterId || 'unknown';
            if (!grouped[qId]) {
                grouped[qId] = [];
            }
            grouped[qId].push(entry);
        });

        // Sort entries within each quarter by timestamp
        Object.keys(grouped).forEach(qId => {
            grouped[qId].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });

        return grouped;
    }, [filteredEntries]);

    // Calculate totals per quarter
    const quarterTotals = useMemo(() => {
        const totals: Record<string, { count: number; totalValue: number }> = {};

        Object.keys(entriesByQuarter).forEach(qId => {
            const qEntries = entriesByQuarter[qId];
            totals[qId] = {
                count: qEntries.length,
                totalValue: qEntries.reduce((sum, e) => sum + e.value, 0)
            };
        });

        return totals;
    }, [entriesByQuarter]);

    const getQuarterName = (qId: string) => {
        const quarter = QUARTERS.find(q => q.id === qId);
        return quarter?.name || qId;
    };

    // Global indicator numbering
    const indicatorNumbering = new Map<string, number>();
    let counter = 1;
    PILLARS.forEach(pillar => {
        pillar.outputs.forEach(output => {
            output.indicators.forEach(indicator => {
                indicatorNumbering.set(indicator.id, counter++);
            });
        });
    });

    // Download CSV for filtered entries
    const handleDownloadCSV = () => {
        if (filteredEntries.length === 0) {
            alert('No entries to download');
            return;
        }

        const headers = ['#', 'Pillar', 'Indicator', 'Quarter', 'Month', 'Value', 'Submitted By', 'Date', 'Comments'];
        const csvContent = [
            headers.join(','),
            ...filteredEntries.map((entry, idx) => {
                const pillar = PILLARS.find(p => p.name === entry.pillarId || p.id === entry.pillarId || p.name === entry.pillarName);
                const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === entry.indicatorId);
                const indicatorNum = indicatorNumbering.get(entry.indicatorId) || 0;

                return [
                    idx + 1,
                    `"${entry.pillarName || entry.pillarId || ''}"`,
                    `"${indicatorNum}. ${indicator?.name || entry.indicatorName || ''}"`,
                    getQuarterName(entry.quarterId),
                    entry.month,
                    entry.value,
                    `"${(entry as any).submittedBy || 'Unknown'}"`,
                    new Date(entry.timestamp).toLocaleDateString(),
                    `"${(entry.comments || '').replace(/"/g, '""')}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const quarterName = filterQuarter === 'all' ? 'All_Quarters' : getQuarterName(filterQuarter);
        link.setAttribute('download', `Responses_${quarterName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadPDF = (entry: MonitoringEntry) => {
        const doc = new jsPDF();
        const pillar = PILLARS.find(p => p.name === entry.pillarId || p.id === entry.pillarId || p.name === entry.pillarName);
        const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === entry.indicatorId);

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Imihigo Performance Report', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 25, { align: 'center' });
        doc.text(`Submission ID: ${(entry as any)._id || 'N/A'}`, 105, 32, { align: 'center' });

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.text('Submission Details', 14, 55);

        autoTable(doc, {
            startY: 60,
            head: [['Field', 'Value']],
            body: [
                ['Quarter', getQuarterName(entry.quarterId)],
                ['Month', entry.month],
                ['Pillar', entry.pillarName || entry.pillarId],
                ['Indicator', indicator?.name || entry.indicatorName],
                ['Achievement', entry.value.toLocaleString()],
                ['Comments', entry.comments || 'No comments provided'],
                ['Submitted By', (entry as any).submittedBy || 'System'],
                ['Date of Submission', new Date(entry.timestamp).toLocaleString()]
            ],
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('This is an official performance tracking document generated by Imihigo MS.', 105, finalY, { align: 'center' });

        doc.save(`Submission_${entry.quarterId}_${entry.month}_${entry.indicatorId}.pdf`);
    };

    const handleDownloadAllPDF = () => {
        if (filteredEntries.length === 0) return;

        const doc = new jsPDF();

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Imihigo Global Performance Report', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Generated by: ${user?.name || 'Director'} (${user?.role})`, 105, 25, { align: 'center' });
        doc.text(`Total Entries: ${filteredEntries.length} | Date: ${new Date().toLocaleString()}`, 105, 32, { align: 'center' });

        const tableBody = filteredEntries.map(entry => {
            const pillar = PILLARS.find(p => p.name === entry.pillarId || p.id === entry.pillarId || p.name === entry.pillarName);
            const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === entry.indicatorId);
            return [
                getQuarterName(entry.quarterId),
                entry.month,
                entry.pillarName || entry.pillarId,
                indicator?.name || entry.indicatorName,
                entry.value.toLocaleString(),
                (entry as any).submittedBy || 'System'
            ];
        });

        autoTable(doc, {
            startY: 50,
            head: [['Quarter', 'Month', 'Pillar', 'Indicator', 'Achievement', 'Submitted By']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 8 },
            margin: { top: 50 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 20;
        if (finalY < 280) {
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('This document contains the consolidated performance data for all pillars.', 105, finalY, { align: 'center' });
        }

        doc.save(`Global_Performance_Report_${new Date().toLocaleDateString()}.pdf`);
    };

    const inputClasses = "h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer";

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Edit Request Modal for Employees */}
            {showEditRequestModal && editingEntry && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={() => setShowEditRequestModal(false)}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Request Data Edit</h2>
                                <p className="text-sm text-slate-500">Your request will be sent to the Head of Unit for approval</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl mb-4">
                            <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Indicator</p>
                            <p className="text-sm font-medium text-slate-800">{editingEntry.indicatorName}</p>
                            <p className="text-xs text-slate-400 mt-1">{editingEntry.month} - {editingEntry.quarterId.toUpperCase()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-red-50 p-3 rounded-xl">
                                <p className="text-xs text-red-500 font-semibold">Current Value</p>
                                <p className="text-lg font-bold text-red-600">{editingEntry.value.toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-emerald-600 font-semibold mb-1">New Value</label>
                                <input
                                    type="number"
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                    className="w-full p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-lg focus:border-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Comments (optional)</label>
                            <textarea
                                value={newComments}
                                onChange={e => setNewComments(e.target.value)}
                                placeholder="Explain why you're requesting this change..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowEditRequestModal(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitEditRequest}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <span>Submitting...</span>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span>Submit Edit Request</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Request Modal for Employees */}
            {showDeleteRequestModal && editingEntry && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" onClick={() => setShowDeleteRequestModal(false)}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Request Data Deletion</h2>
                                <p className="text-sm text-slate-500">Your request will be sent to the Head of Unit for approval</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl mb-4">
                            <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Indicator</p>
                            <p className="text-sm font-medium text-slate-800">{editingEntry.indicatorName}</p>
                            <p className="text-xs text-slate-400 mt-1">{editingEntry.month} - {editingEntry.quarterId.toUpperCase()}</p>
                        </div>

                        <div className="bg-red-50 p-3 rounded-xl mb-4">
                            <p className="text-xs text-red-500 font-semibold">Current Value</p>
                            <p className="text-lg font-bold text-red-600">{editingEntry.value.toLocaleString()}</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Reason for Deletion (required)</label>
                            <textarea
                                value={newComments}
                                onChange={e => setNewComments(e.target.value)}
                                placeholder="Explain why you're requesting this deletion..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteRequestModal(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!newComments.trim()) {
                                        alert('Please provide a reason for deletion');
                                        return;
                                    }

                                    setIsSubmitting(true);
                                    try {
                                        const pillar = PILLARS.find(p => p.name === editingEntry.pillarId || p.id === editingEntry.pillarId || p.name === editingEntry.pillarName);
                                        const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === editingEntry.indicatorId);

                                        const response = await fetch(API_ENDPOINTS.DATA_DELETE_REQUEST, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                submissionId: (editingEntry as any)._id,
                                                requestedBy: user?.email,
                                                requestedByName: user?.name,
                                                indicatorId: editingEntry.indicatorId,
                                                indicatorName: indicator?.name || editingEntry.indicatorName,
                                                pillarName: editingEntry.pillarName || editingEntry.pillarId,
                                                quarterId: editingEntry.quarterId,
                                                month: editingEntry.month,
                                                oldValue: editingEntry.value,
                                                oldComments: editingEntry.comments,
                                                unit: user?.unit,
                                                oldSubValues: editingEntry.subValues
                                            })
                                        });

                                        if (response.ok) {
                                            setSubmitSuccess('Your delete request has been submitted! The data will be removed if the Head of Unit approves it.');
                                            setShowDeleteRequestModal(false);
                                            setTimeout(() => setSubmitSuccess(null), 5000);
                                        } else {
                                            alert('Failed to submit delete request');
                                        }
                                    } catch (error) {
                                        console.error('Error submitting delete request:', error);
                                        alert('Error connecting to server');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <span>Submitting...</span>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span>Submit Delete Request</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message Banner */}
            {submitSuccess && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top duration-300">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="font-semibold">{submitSuccess}</p>
                        <button onClick={() => setSubmitSuccess(null)} className="ml-4 text-white/70 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Submissions by Quarter</h1>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-slate-600 font-medium">Review achievements grouped by reporting period.</p>
                </div>
                <div className="flex space-x-3 flex-wrap gap-2">
                    {filteredEntries.length > 0 && (user?.userType === 'super_admin' || user?.userType === 'head') && (
                        <button
                            onClick={handleDownloadCSV}
                            className="px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download CSV</span>
                        </button>
                    )}
                    {filteredEntries.length > 0 && (user?.userType === 'super_admin' || user?.userType === 'head') && (
                        <button
                            onClick={handleDownloadAllPDF}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download PDF</span>
                        </button>
                    )}
                    {entries.length > 0 && onClear && (
                        <button
                            onClick={onClear}
                            className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Filter by Quarter</label>
                    <select
                        value={filterQuarter}
                        onChange={(e) => setFilterQuarter(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="all">All Quarters</option>
                        {QUARTERS.map(q => (
                            <option key={q.id} value={q.id}>{q.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Filter by Pillar</label>
                    <select
                        value={filterPillar}
                        onChange={(e) => setFilterPillar(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="all">All Pillars</option>
                        {PILLARS.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500">Showing</p>
                    <p className="text-lg font-bold text-slate-800">{filteredEntries.length} submissions</p>
                </div>
            </div>

            {/* Summary Cards by Quarter */}
            {Object.keys(entriesByQuarter).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['q1', 'q2', 'q3', 'q4'].map(qId => {
                        const total = quarterTotals[qId];
                        const isActive = filterQuarter === 'all' || filterQuarter === qId;
                        return (
                            <div
                                key={qId}
                                onClick={() => setFilterQuarter(filterQuarter === qId ? 'all' : qId)}
                                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${total && isActive
                                    ? 'bg-blue-50 border-blue-200 hover:border-blue-400'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <p className="text-xs font-bold text-slate-500 uppercase">{getQuarterName(qId)}</p>
                                <p className={`text-2xl font-bold mt-1 ${total && isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                                    {total?.count || 0}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Submissions
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Entries Table Grouped by Quarter */}
            {Object.keys(entriesByQuarter).length === 0 ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 text-center">
                    <div className="flex flex-col items-center opacity-40">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8-4" />
                        </svg>
                        <p className="text-sm font-black uppercase tracking-tight">No submissions found</p>
                        <p className="text-xs text-slate-500 mt-1">Adjust your filters or submit new data</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {['q1', 'q2', 'q3', 'q4'].map(qId => {
                        const qEntries = entriesByQuarter[qId];
                        if (!qEntries || qEntries.length === 0) return null;

                        return (
                            <div key={qId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Quarter Header */}
                                <div className="bg-slate-800 text-white p-5">
                                    <h3 className="text-lg font-bold">{getQuarterName(qId)}</h3>
                                    <p className="text-sm text-slate-300">
                                        {qEntries.length} submission{qEntries.length !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {/* Entries Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Month</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Indicator</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Submitted By</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Achievement</th>
                                                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {qEntries.map((entry, idx) => {
                                                const pillar = PILLARS.find(p => p.name === entry.pillarId || p.id === entry.pillarId || p.name === entry.pillarName);
                                                const indicator = pillar?.outputs?.flatMap(output => output.indicators || []).find(i => i.id === entry.indicatorId);

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-900">{entry.month}</span>
                                                                <span className="text-[10px] text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="max-w-md">
                                                                <p className="text-sm font-semibold text-slate-800 leading-snug">{indicator?.name || entry.indicatorName}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5">{entry.pillarName || entry.pillarId}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                                {(entry as any).submittedBy || 'System'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <span className="text-lg font-bold text-blue-600">{entry.value.toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center justify-center space-x-1">
                                                                <button
                                                                    onClick={() => handleEditClick(entry)}
                                                                    className={`p-2 ${isEmployee ? 'text-amber-600 hover:bg-amber-50' : 'text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors`}
                                                                    title={isEmployee ? 'Request Edit' : 'Edit'}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadPDF(entry)}
                                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                    title="Download PDF"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                </button>
<button
    onClick={() => handleDeleteClick(entry)}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    title={isEmployee ? 'Request Delete' : 'Delete'}
>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ResponsesView;
