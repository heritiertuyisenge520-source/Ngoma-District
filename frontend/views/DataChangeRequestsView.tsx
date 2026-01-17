import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getDataChangeRequestsUrl, getApproveChangeRequestUrl, getRejectChangeRequestUrl } from '../config/api';

interface DataChangeRequest {
    _id: string;
    submissionId: string;
    requestedBy: string;
    requestedByName: string;
    indicatorId: string;
    indicatorName: string;
    pillarName: string;
    quarterId: string;
    month: string;
    oldValue: number;
    newValue: number;
    oldComments?: string;
    newComments?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewComment?: string;
}

interface DataChangeRequestsViewProps {
    user: {
        email: string;
        name: string;
        unit?: string;
    };
}

const DataChangeRequestsView: React.FC<DataChangeRequestsViewProps> = ({ user }) => {
    const [requests, setRequests] = useState<DataChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [reviewComment, setReviewComment] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [user.unit]);

    const fetchRequests = async () => {
        if (!user.unit) return;
        try {
            setLoading(true);
            const response = await fetch(getDataChangeRequestsUrl(user.unit));
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching change requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        try {
            setProcessingId(requestId);
            const response = await fetch(getApproveChangeRequestUrl(requestId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewedBy: user.email,
                    reviewedByName: user.name,
                    reviewComment
                })
            });

            if (response.ok) {
                setSuccessMessage('Change request approved! The data has been updated in the database.');
                fetchRequests();
                setReviewComment('');
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error approving request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        if (!reviewComment) {
            alert('Please provide a reason for rejection');
            return;
        }
        try {
            setProcessingId(requestId);
            const response = await fetch(getRejectChangeRequestUrl(requestId), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewedBy: user.email,
                    reviewedByName: user.name,
                    reviewComment
                })
            });

            if (response.ok) {
                setSuccessMessage('Change request rejected.');
                fetchRequests();
                setReviewComment('');
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg">Pending</span>;
            case 'approved':
                return <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-lg">Rejected</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Data Change Requests</h1>
                    <p className="mt-1 text-sm text-slate-600 font-medium">
                        Review and approve data modification requests from your team members.
                    </p>
                </div>
                {pendingCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">{pendingCount}</span>
                        </div>
                        <span className="text-amber-700 font-semibold text-sm">Pending Requests</span>
                    </div>
                )}
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

            {/* Filter Tabs */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex space-x-2">
                {['pending', 'approved', 'rejected', 'all'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status as any)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === status
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'pending' && pendingCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-white text-blue-600 rounded text-xs font-bold">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-slate-900">No {filter === 'all' ? '' : filter} requests</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        {filter === 'pending' ? 'All caught up! No pending requests to review.' : `No ${filter} requests found.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map(request => (
                        <div key={request._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{request.indicatorName}</h3>
                                        <p className="text-sm text-slate-500">{request.pillarName}</p>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium">Requested By</p>
                                        <p className="font-semibold text-slate-900">{request.requestedByName}</p>
                                        <p className="text-xs text-slate-400">{request.requestedBy}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 font-medium">Period</p>
                                        <p className="font-semibold text-slate-900">{request.month}</p>
                                        <p className="text-xs text-slate-400">{request.quarterId.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-xl">
                                        <p className="text-xs text-red-500 font-medium">Old Value</p>
                                        <p className="font-bold text-red-600 text-lg">{request.oldValue.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-3 rounded-xl">
                                        <p className="text-xs text-emerald-500 font-medium">New Value</p>
                                        <p className="font-bold text-emerald-600 text-lg">{request.newValue.toLocaleString()}</p>
                                    </div>
                                </div>

                                {request.newComments && (
                                    <div className="bg-blue-50 p-3 rounded-xl mb-4">
                                        <p className="text-xs text-blue-500 font-medium mb-1">Updated Comment</p>
                                        <p className="text-sm text-blue-700">{request.newComments}</p>
                                    </div>
                                )}

                                <p className="text-xs text-slate-400 mb-4">
                                    Requested on {new Date(request.createdAt).toLocaleString()}
                                </p>

                                {request.status === 'pending' && (
                                    <div className="border-t border-slate-100 pt-4 mt-4">
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Review Comment (optional for approve, required for reject)</label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Add a comment about this decision..."
                                            className="w-full p-3 rounded-xl border border-slate-200 text-sm resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            rows={2}
                                        />
                                        <div className="flex space-x-3 mt-3">
                                            <button
                                                onClick={() => handleApprove(request._id)}
                                                disabled={processingId === request._id}
                                                className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Approve & Update Database</span>
                                            </button>
                                            <button
                                                onClick={() => handleReject(request._id)}
                                                disabled={processingId === request._id}
                                                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {request.reviewComment && request.status !== 'pending' && (
                                    <div className="border-t border-slate-100 pt-4 mt-4">
                                        <p className="text-xs text-slate-500 font-medium">Reviewer Comment</p>
                                        <p className="text-sm text-slate-700">{request.reviewComment}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DataChangeRequestsView;
