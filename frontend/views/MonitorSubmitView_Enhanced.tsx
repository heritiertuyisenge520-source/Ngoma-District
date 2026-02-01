import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getSubmissionPeriodUrl } from '../config/api';
import { authFetch, authPost, authDelete } from '../utils/authFetch';
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

    const [systemStatus, setSystemStatus] = useState({
        isOpen: false,
        activePeriod: null as SubmissionPeriod | null,
        loading: true
    });

    const [formData, setFormData] = useState({
        description: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchPeriods();
        checkSystemStatus();
    }, []);

    const fetchPeriods = async () => {
        try {
            setLoading(true);
            const response = await authFetch(API_ENDPOINTS.SUBMISSION_PERIODS);
            if (response.ok) {
                const data = await response.json();
                setPeriods(data);
                checkSystemStatus(data);
            }
        } catch (error) {
            console.error('Error fetching submission periods:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkSystemStatus = (periodsData?: SubmissionPeriod[]) => {
        const data = periodsData || periods;
        const now = new Date();
        const activePeriod = data.find(p => 
            p.isActive && 
            new Date(p.startDate) <= now && 
            new Date(p.endDate) >= now
        );

        setSystemStatus({
            isOpen: !!activePeriod,
            activePeriod: activePeriod,
            loading: false
        });
    };

    const toggleSystemStatus = async () => {
        if (systemStatus.isOpen && systemStatus.activePeriod) {
            // Close system - deactivate current period
            try {
                const response = await authPost(getSubmissionPeriodUrl(systemStatus.activePeriod._id), {
                    ...systemStatus.activePeriod,
                    isActive: false
                });

                if (response.ok) {
                    setSuccessMessage('System closed successfully! Users can no longer submit data.');
                    fetchPeriods();
                    setTimeout(() => setSuccessMessage(''), 5000);
                }
            } catch (error) {
                console.error('Error closing system:', error);
                alert('Failed to close system. Please try again.');
            }
        } else {
            // Open system - show form to create new period
            setShowForm(true);
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

            const response = await authPost(url, {
                ...formData,
                isActive: true, // New periods are active by default
                createdBy: user.email,
                createdByName: user.name
            });

            if (response.ok) {
                setSuccessMessage(editingPeriod ? 'Submission period updated successfully!' : 'System opened successfully! Users can now submit data.');
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Submission Control Center</h1>
                    <p className="mt-1 text-sm text-slate-600 font-medium">
                        Manage system access and control when users can submit their progress data.
                    </p>
                </div>
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

            {/* SYSTEM STATUS CARD - THE MAIN FEATURE */}
            <div className={`relative rounded-2xl p-8 shadow-xl overflow-hidden transition-all duration-500 ${
                systemStatus.isOpen 
                    ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600' 
                    : 'bg-gradient-to-br from-red-600 via-red-500 to-rose-600'
            }`}>
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${
                    systemStatus.isOpen ? 'bg-white' : 'bg-black'
                }`}></div>
                <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl opacity-15 ${
                    systemStatus.isOpen ? 'bg-white' : 'bg-black'
                }`}></div>

                <div className="relative z-10">
                    {/* Status Badge */}
                    <div className="flex items-center space-x-3 mb-6">
                        <div className={`w-4 h-4 rounded-full ${
                            systemStatus.isOpen ? 'bg-white animate-pulse' : 'bg-red-200'
                        }`}></div>
                        <span className="text-white/90 text-sm font-bold uppercase tracking-wider">
                            System Status
                        </span>
                    </div>

                    {/* Main Status */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                {systemStatus.isOpen ? 'System Open' : 'System Closed'}
                            </h2>
                            <p className="text-white/80 text-lg max-w-2xl">
                                {systemStatus.isOpen 
                                    ? 'Users and heads of units can currently submit their progress data through the system.'
                                    : 'Submissions are currently disabled. Users cannot submit any progress data at this time.'
                                }
                            </p>

                            {/* Active Period Info */}
                            {systemStatus.activePeriod && (
                                <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
                                    <p className="text-white font-semibold">
                                        {systemStatus.activePeriod.description}
                                    </p>
                                    <p className="text-white/80 text-sm">
                                        {formatDate(systemStatus.activePeriod.startDate)} - {formatDate(systemStatus.activePeriod.endDate)}
                                    </p>
                                    <p className="text-white/70 text-xs mt-1">
                                        {getStatusInfo(systemStatus.activePeriod).message}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Status Icon */}
                        <div className="hidden md:block">
                            {systemStatus.isOpen ? (
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                        <button
                            onClick={toggleSystemStatus}
                            className={`px-6 py-3 font-bold rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg ${
                                systemStatus.isOpen
                                    ? 'bg-white text-red-600 hover:bg-red-50 shadow-white/20'
                                    : 'bg-white text-emerald-600 hover:bg-emerald-50 shadow-white/20'
                            }`}
                        >
                            {systemStatus.isOpen ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Close System</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                    <span>Open System</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={() => resetForm()}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            {editingPeriod ? 'Edit Submission Period' : 'Open System - Create Submission Period'}
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
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                <p className="text-sm text-emerald-700">
                                    <strong>Opening System:</strong> This will activate the submission period and allow all users to submit their progress data. The system will automatically close when the end date is reached.
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
                                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                                >
                                    {editingPeriod ? 'Update Period' : 'Open System'}
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
                    <p className="text-slate-500 text-sm mt-1">Click "Open System" to create your first submission period and allow users to submit data.</p>
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
                                                {formatDate(period.startDate)} - {formatDate(period.endDate)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Created by {period.createdByName} on {formatDate(period.createdAt)}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-2 font-medium">{status.message}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(period)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Period"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(period._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Period"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
