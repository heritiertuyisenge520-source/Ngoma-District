import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSubmissionPeriodUrl } from '../config/api';
import { authFetch, authPost, authPatch, authDelete } from '../utils/authFetch';
import { formatDate } from '../utils/dateUtils';

interface SubmissionPeriod {
    _id: string;
    description: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdByName: string;
    createdAt: string;
}

interface MonitorSubmitViewProps {
    user: {
        email: string;
        name: string;
    };
}

const MonitorSubmitView: React.FC<MonitorSubmitViewProps> = ({ user }) => {
    const [periods, setPeriods] = useState<SubmissionPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<SubmissionPeriod | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        description: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const response = await authFetch(API_ENDPOINTS.SUBMISSION_PERIODS);
            if (response.ok) {
                const data = await response.json();
                const now = new Date();
                
                // Filter out ended periods and delete them from database
                const activePeriods: SubmissionPeriod[] = [];
                const endedPeriods: SubmissionPeriod[] = [];
                
                data.forEach((period: SubmissionPeriod) => {
                    const end = new Date(period.endDate);
                    if (now > end) {
                        endedPeriods.push(period);
                    } else {
                        activePeriods.push(period);
                    }
                });
                
                // Delete ended periods from database
                if (endedPeriods.length > 0) {
                    for (const period of endedPeriods) {
                        try {
                            await authDelete(getSubmissionPeriodUrl(period._id));
                        } catch (error) {
                            console.error(`Error deleting ended period ${period._id}:`, error);
                        }
                    }
                }
                
                setPeriods(activePeriods);
            }
        } catch (error) {
            console.error('Error fetching submission periods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description || !formData.startDate || !formData.endDate) {
            alert('Please fill all fields');
            return;
        }

        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            alert('End date must be after start date');
            return;
        }

        try {
            let response;
            if (editingPeriod) {
                // Use PATCH for updates
                const url = getSubmissionPeriodUrl(editingPeriod._id);
                response = await authPatch(url, {
                    description: formData.description,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    isActive: editingPeriod.isActive
                });
            } else {
                // Use POST for creates
                response = await authPost(API_ENDPOINTS.SUBMISSION_PERIOD, {
                    ...formData,
                    createdBy: user.email,
                    createdByName: user.name
                });
            }

            if (response.ok) {
                setSuccessMessage(editingPeriod ? 'Submission period updated successfully!' : 'Submission period created successfully!');
                fetchPeriods();
                resetForm();
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.message || 'Failed to save submission period');
            }
        } catch (error) {
            console.error('Error saving submission period:', error);
            alert('An error occurred while saving the submission period');
        }
    };

    const resetForm = () => {
        setFormData({ description: '', startDate: '', endDate: '' });
        setShowForm(false);
        setEditingPeriod(null);
    };

    const handleEdit = (period: SubmissionPeriod) => {
        setEditingPeriod(period);
        setFormData({
            description: period.description,
            startDate: period.startDate.split('T')[0],
            endDate: period.endDate.split('T')[0]
        });
        setShowForm(true);
    };

    const handleDelete = async (periodId: string) => {
        if (!confirm('Are you sure you want to delete this submission period? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await authDelete(getSubmissionPeriodUrl(periodId));

            if (response.ok) {
                setSuccessMessage('Submission period deleted successfully!');
                fetchPeriods();
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                alert('Failed to delete submission period. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting submission period:', error);
            alert('Failed to delete submission period. Please try again.');
        }
    };

    const getStatusInfo = (period: SubmissionPeriod) => {
        const now = new Date();
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);

        if (!period.isActive) {
            return { label: 'Inactive', color: 'slate', message: 'This period is not active' };
        }
        if (now < start) {
            const diff = start.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return { label: 'Upcoming', color: 'amber', message: `Starts in ${days} day${days > 1 ? 's' : ''}` };
        }
        if (now > end) {
            return { label: 'Ended', color: 'red', message: 'Submission period has ended' };
        }

        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const hours = Math.ceil(diff / (1000 * 60 * 60));
        return {
            label: 'Active',
            color: 'emerald',
            message: days > 1 ? `${days} days remaining` : `${hours} hours remaining`
        };
    };

    const activePeriod = periods.find(p => p.isActive && new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date());
    
    // Check if there's any ongoing period (not ended)
    const hasOngoingPeriod = periods.some(p => {
        const now = new Date();
        const end = new Date(p.endDate);
        return p.isActive && now <= end;
    });

    const handleCreateNew = () => {
        if (hasOngoingPeriod) {
            const ongoingPeriod = periods.find(p => {
                const now = new Date();
                const end = new Date(p.endDate);
                return p.isActive && now <= end;
            });
            if (ongoingPeriod) {
                const status = getStatusInfo(ongoingPeriod);
                alert(`You have an ongoing submission period:\n\n"${ongoingPeriod.description}"\nStatus: ${status.label}\n${status.message}\n\nPlease update or delete the existing period before creating a new one.`);
                return;
            }
        }
        setShowForm(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="transition-all duration-500">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent mb-1 hover:scale-105 transition-transform duration-300">
                        Monitor Submissions
                    </h1>
                    <p className="text-xs text-slate-400 font-normal leading-relaxed">
                        Control when users can submit their progress data. Set start and end dates for submission windows.
                    </p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New Period</span>
                </button>
            </header>

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

            {/* Current Active Period Banner */}
            {activePeriod && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Active</span>
                            </div>
                            <h3 className="text-base font-bold mb-0.5">{activePeriod.description}</h3>
                            <p className="text-emerald-100 text-xs">
                                {formatDate(activePeriod.startDate)} - {formatDate(activePeriod.endDate)}
                            </p>
                        </div>
                        <div className="bg-white/20 rounded-lg px-3 py-1.5">
                            <span className="text-xs font-bold">{getStatusInfo(activePeriod).message}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm" onClick={() => resetForm()}>
                    <div className="bg-white rounded-xl p-5 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                            {editingPeriod ? 'Edit Period' : 'New Period'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Q1 2025-2026 Submission Window"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    <strong>Note:</strong> New periods deactivate previous ones.
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingPeriod ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Periods List */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading submission periods...</p>
                </div>
            ) : periods.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-slate-900">No Submission Periods</h3>
                    <p className="text-slate-500 text-sm mt-1">Create your first submission period to control when users can submit data.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                        <h3 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">All Submission Periods</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {periods.map(period => {
                            const status = getStatusInfo(period);
                            return (
                                <div 
                                    key={period._id} 
                                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                    {period.description}
                                                </h4>
                                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md whitespace-nowrap ${
                                                    status.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                                    status.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                                                    status.color === 'red' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-0.5">
                                                <span className="font-medium">
                                                    {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mb-1">
                                                by {period.createdByName} • {formatDate(period.createdAt)}
                                            </p>
                                            <p className="text-xs text-slate-600 font-medium">{status.message}</p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(period);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                                title="Edit Period"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(period._id);
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                                title="Delete Period"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
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

export default MonitorSubmitView;
