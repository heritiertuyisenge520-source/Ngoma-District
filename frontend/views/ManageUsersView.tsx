import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getUpdateUserUrl, getDeleteUserUrl } from '../config/api';

interface User {
    _id: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    role: string;
    unit?: string;
    userType: 'super_admin' | 'head' | 'employee';
    isApproved: boolean;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
}

interface ManageUsersViewProps {
    adminEmail: string;
}

const ManageUsersView: React.FC<ManageUsersViewProps> = ({ adminEmail }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'head' | 'employee'>('all');
    const [units, setUnits] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState('');

    const [editForm, setEditForm] = useState({
        name: '',
        role: '',
        unit: '',
        userType: 'employee' as 'head' | 'employee',
        isApproved: true,
        isActive: true
    });

    useEffect(() => {
        fetchUsers();
        fetchUnits();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_ENDPOINTS.ALL_USERS);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnits = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.UNITS);
            if (response.ok) {
                const data = await response.json();
                setUnits(data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            role: user.role,
            unit: user.unit || '',
            userType: user.userType === 'super_admin' ? 'head' : user.userType,
            isApproved: user.isApproved,
            isActive: user.isActive
        });
    };

    const handleUpdate = async () => {
        if (!editingUser) return;

        try {
            const response = await fetch(getUpdateUserUrl(editingUser._id), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                setSuccessMessage('User updated successfully!');
                fetchUsers();
                setEditingUser(null);
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleDelete = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(getDeleteUserUrl(userId), {
                method: 'DELETE'
            });

            if (response.ok) {
                setSuccessMessage('User deleted successfully!');
                fetchUsers();
                setTimeout(() => setSuccessMessage(''), 5000);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || user.userType === filterType;
        return matchesSearch && matchesType;
    });

    const getUserTypeBadge = (userType: string) => {
        switch (userType) {
            case 'super_admin':
                return <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg">Super Admin</span>;
            case 'head':
                return <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg">Head of Unit</span>;
            default:
                return <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">Employee</span>;
        }
    };

    const getStatusBadge = (user: User) => {
        if (!user.isActive) {
            return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-lg">Inactive</span>;
        }
        if (!user.isApproved) {
            return <span className="px-2 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg">Pending</span>;
        }
        return <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg">Active</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Manage Users</h1>
                <p className="mt-1 text-sm text-slate-600 font-medium">
                    View, edit, and manage all registered users in the system.
                </p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Users</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Heads of Unit</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">
                        {users.filter(u => u.userType === 'head').length}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Employees</p>
                    <p className="text-3xl font-black text-blue-600 mt-1">
                        {users.filter(u => u.userType === 'employee').length}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase">Pending Approval</p>
                    <p className="text-3xl font-black text-amber-600 mt-1">
                        {users.filter(u => !u.isApproved).length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or role..."
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>
                <div className="flex space-x-2">
                    {['all', 'head', 'employee'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type as any)}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${filterType === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {type === 'all' ? 'All' : type === 'head' ? 'Heads' : 'Employees'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40" onClick={() => setEditingUser(null)}>
                    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Edit User</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email (Read Only)</label>
                                <input
                                    type="text"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Position/Role</label>
                                <input
                                    type="text"
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Unit</label>
                                <select
                                    value={editForm.unit}
                                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                >
                                    <option value="">-- Select Unit --</option>
                                    {units.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">User Type</label>
                                <select
                                    value={editForm.userType}
                                    onChange={e => setEditForm({ ...editForm, userType: e.target.value as 'head' | 'employee' })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="head">Head of Unit</option>
                                </select>
                            </div>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isApproved}
                                        onChange={e => setEditForm({ ...editForm, isApproved: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Approved</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Active</span>
                                </label>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading users...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-700 font-medium">{user.role}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-500">{user.unit || '-'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {getUserTypeBadge(user.userType)}
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(user)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user._id, user.name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-slate-500">No users found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ManageUsersView;
