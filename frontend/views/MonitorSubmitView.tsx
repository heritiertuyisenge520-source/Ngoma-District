import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSubmissionPeriodUrl } from '../config/api';

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
            const response = await fetch(API_ENDPOINTS.SUBMISSION_PERIODS);
            if (response.ok) {
                const data = await response.json();
                setPeriods(data);
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
            const url = editingPeriod
                ? getSubmissionPeriodUrl(editingPeriod._id)
                : API_ENDPOINTS.SUBMISSION_PERIOD;

            const response = await fetch(url, {
                method: editingPeriod ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    createdBy: user.email,
                    createdByName: user.name
                })
            });

            if (response.ok) {
                setSuccessMessage(editingPeriod ? 'Submission period updated successfully!' : 'Submission period created successfully!');
                fetchPeriods();
                resetForm();
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error saving submission period:', error);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Monitor Submissions</h1>
                    <p className="mt-1 text-sm text-slate-600 font-medium">
                        Control when users can submit their progress data. Set start and end dates for submission windows.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg shadow-blue-600/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create New Period</span>
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
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Currently Active</span>
                        </div>
                        <h3 className="text-xl font-bold mb-1">{activePeriod.description}</h3>
                        <p className="text-emerald-100">
                            {new Date(activePeriod.startDate).toLocaleDateString()} - {new Date(activePeriod.endDate).toLocaleDateString()}
                        </p>
                        <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 inline-block">
                            <span className="font-bold">{getStatusInfo(activePeriod).message}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={() => resetForm()}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            {editingPeriod ? 'Edit Submission Period' : 'Create New Submission Period'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Q1 2025-2026 Submission Window"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <p className="text-sm text-amber-700">
                                    <strong>Note:</strong> Creating a new submission period will deactivate all previous periods. Users will only be able to submit data during active submission windows.
                                </p>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    {editingPeriod ? 'Update Period' : 'Create Period'}
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
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-900">All Submission Periods</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {periods.map(period => {
                            const status = getStatusInfo(period);
                            return (
                                <div key={period._id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="font-bold text-slate-900">{period.description}</h4>
                                                <span className={`px-2 py-1 text-xs font-bold bg-${status.color}-100 text-${status.color}-700 rounded-lg`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Created by {period.createdByName} on {new Date(period.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-2 font-medium">{status.message}</p>
                                        </div>
                                        <button
                                            onClick={() => handleEdit(period)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Period"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
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
