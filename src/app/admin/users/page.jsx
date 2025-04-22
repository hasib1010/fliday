'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
    Search,
    RefreshCw,
    Filter,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    DownloadCloud,
    Eye,
    User,
    Mail,
    Calendar,
    UserCheck,
    UserX
} from 'lucide-react';

// Admin layout component with sidebar
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminUsers() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortField, setSortField] = useState('lastLogin');
    const [sortDirection, setSortDirection] = useState('desc');
    const [isExporting, setIsExporting] = useState(false);
    const usersPerPage = 10;

    useEffect(() => {
        // Check authentication and admin status
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
            return;
        }

        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            router.push('/');
            return;
        }

        if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchUsers();
        }
    }, [status, session, router, currentPage, roleFilter, sortField, sortDirection, searchQuery]);

    const fetchUsers = async () => {
        try {
            setLoading(true);

            // Build query string
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: usersPerPage,
                sort: sortField,
                direction: sortDirection,
                ...(roleFilter !== 'all' && { role: roleFilter }),
                ...(searchQuery && { search: searchQuery })
            });

            const response = await fetch(`/api/admin/users?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data.users);
            setTotalUsers(data.total);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportUsers = async () => {
        try {
            setIsExporting(true);

            // Build query string for export (might include all filters but not pagination)
            const queryParams = new URLSearchParams({
                sort: sortField,
                direction: sortDirection,
                ...(roleFilter !== 'all' && { role: roleFilter }),
                ...(searchQuery && { search: searchQuery }),
                export: 'csv'
            });

            const response = await fetch(`/api/admin/users/export?${queryParams.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to export users');
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Error exporting users:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString();
    };

    // Calculate pagination details
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    const showingFrom = totalUsers === 0 ? 0 : (currentPage - 1) * usersPerPage + 1;
    const showingTo = Math.min(currentPage * usersPerPage, totalUsers);

    // Loading state
    if (loading && users.length === 0) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F15A25]"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h1 className="text-2xl font-bold mb-4 md:mb-0">Users</h1>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={exportUsers}
                            disabled={isExporting || totalUsers === 0}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                            ) : (
                                <DownloadCloud size={16} className="mr-2" />
                            )}
                            Export CSV
                        </button>

                        <button
                            onClick={fetchUsers}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="w-full md:w-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter size={16} className="text-gray-400" />
                                </div>
                                <select
                                    className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm rounded-md"
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Users</option>
                                    <option value="admin">Admins</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        User
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center">
                                            Email
                                            {sortField === 'email' && (
                                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('role')}
                                    >
                                        <div className="flex items-center">
                                            Role
                                            {sortField === 'role' && (
                                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        <div className="flex items-center">
                                            Joined
                                            {sortField === 'createdAt' && (
                                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('lastLogin')}
                                    >
                                        <div className="flex items-center">
                                            Last Login
                                            {sortField === 'lastLogin' && (
                                                sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 relative">
                                                        {user.image ? (
                                                            <Image
                                                                src={user.image}
                                                                alt={user.name}
                                                                fill
                                                                className="rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <User size={20} className="text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Provider: {user.provider}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Mail size={16} className="mr-2 text-gray-400" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar size={16} className="mr-2 text-gray-400" />
                                                    {formatDate(user.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar size={16} className="mr-2 text-gray-400" />
                                                    {formatDate(user.lastLogin)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    href={`/admin/users/${user._id}`}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center justify-end"
                                                >
                                                    <Eye size={16} className="mr-1" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                            {loading ? 'Loading users...' : 'No users found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of{' '}
                                        <span className="font-medium">{totalUsers}</span> users
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft size={16} />
                                        </button>

                                        {/* Page numbers */}
                                        {[...Array(totalPages)].map((_, i) => {
                                            const page = i + 1;
                                            // Show current page, first, last, and pages around current
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                                ? 'z-10 bg-[#FFF1ED] border-[#F15A25] text-[#F15A25]'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            }

                                            // Show ellipsis if needed
                                            if (
                                                (page === 2 && currentPage > 3) ||
                                                (page === totalPages - 1 && currentPage < totalPages - 2)
                                            ) {
                                                return (
                                                    <span
                                                        key={page}
                                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                                    >
                                                        ...
                                                    </span>
                                                );
                                            }

                                            return null;
                                        })}

                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </nav>
                                </div>
                            </div>

                            {/* Mobile pagination */}
                            <div className="flex items-center justify-between w-full sm:hidden">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <p className="text-sm text-gray-700">
                                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                                </p>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <UserCheck size={20} className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <User size={20} className="text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Admin Users</p>
                                <p className="text-2xl font-bold text-gray-900">{users.filter(user => user.role === 'admin').length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-3 rounded-full">
                                <Calendar size={20} className="text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">New Users (30d)</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {users.filter(user => {
                                        const thirtyDaysAgo = new Date();
                                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                        return new Date(user.createdAt) >= thirtyDaysAgo;
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}