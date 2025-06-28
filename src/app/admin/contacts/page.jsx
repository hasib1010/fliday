// app/admin/contacts/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
    Mail,
    Search,
    Filter,
    Eye,
    Edit,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    User,
    Calendar,
    Flag,
    ArrowUpDown,
    Trash2,
    ExternalLink,
    Phone,
    MapPin,
    Star,
    TrendingUp,
    Activity,
    Users,
    FileText
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminContactsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState({ new: 0, in_progress: 0, resolved: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        page: 1,
        limit: 10,
        sortBy: 'submittedAt',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [updating, setUpdating] = useState(false);

    // Redirect if not admin
    useEffect(() => {
        if (status === 'loading') return;
        if (!session || session.user.role !== 'admin') {
            router.push('/auth/signin');
        }
    }, [session, status, router]);

    // Fetch contacts
    const fetchContacts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters);
            const response = await fetch(`/api/admin/contacts?${params}`);

            if (!response.ok) throw new Error('Failed to fetch contacts');

            const data = await response.json();
            setContacts(data.contacts);
            setStats(data.stats);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch contacts. Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.role === 'admin') {
            fetchContacts();
        }
    }, [filters, session]);

    // Update contact with SweetAlert2 confirmation
    const updateContact = async (contactId, updates) => {
        try {
            setUpdating(true);
            const response = await fetch('/api/admin/contacts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contactId, ...updates })
            });

            if (!response.ok) throw new Error('Failed to update contact');

            const data = await response.json();

            // Update contacts list
            setContacts(prev => prev.map(contact =>
                contact._id === contactId ? data.contact : contact
            ));

            // Update selected contact if it's the one being updated
            if (selectedContact?._id === contactId) {
                setSelectedContact(data.contact);
            }

            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Contact has been updated successfully.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });

            // Refresh stats
            fetchContacts();
        } catch (error) {
            console.error('Error updating contact:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update contact. Please try again.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setUpdating(false);
        }
    };

    // Delete contact with SweetAlert2 confirmation
    const deleteContact = async (contactId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#F15A25',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/admin/contacts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contactId })
                });

                if (!response.ok) throw new Error('Failed to delete contact');

                // Remove from contacts list
                setContacts(prev => prev.filter(contact => contact._id !== contactId));
                
                // Close modal if this contact was selected
                if (selectedContact?._id === contactId) {
                    setShowModal(false);
                    setSelectedContact(null);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Contact has been deleted.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });

                fetchContacts();
            } catch (error) {
                console.error('Error deleting contact:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete contact. Please try again.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'new': return <AlertCircle className="text-blue-500" size={16} />;
            case 'in_progress': return <Clock className="text-amber-500" size={16} />;
            case 'resolved': return <CheckCircle className="text-emerald-500" size={16} />;
            case 'closed': return <XCircle className="text-gray-500" size={16} />;
            default: return <AlertCircle className="text-gray-500" size={16} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'closed': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
            case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'low': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (status === 'loading' || loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#F15A25] border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading contacts...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="p-6  mx-auto">
                    {/* Header with gradient background */}
                    <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-[#F15A25] to-[#FF7A3D] rounded-2xl p-8 text-white">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
                                    <p className="text-orange-100 text-lg">Manage customer inquiries and support requests</p>
                                </div>
                                <div className="hidden md:flex items-center space-x-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                        <MessageSquare size={32} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full"></div>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[
                            { 
                                label: 'New', 
                                value: stats.new, 
                                color: 'blue', 
                                icon: AlertCircle,
                                bgGradient: 'from-blue-500 to-blue-600',
                                change: '+12%',
                                changeType: 'increase'
                            },
                            { 
                                label: 'In Progress', 
                                value: stats.in_progress, 
                                color: 'amber', 
                                icon: Clock,
                                bgGradient: 'from-amber-500 to-amber-600',
                                change: '+5%',
                                changeType: 'increase'
                            },
                            { 
                                label: 'Resolved', 
                                value: stats.resolved, 
                                color: 'emerald', 
                                icon: CheckCircle,
                                bgGradient: 'from-emerald-500 to-emerald-600',
                                change: '+23%',
                                changeType: 'increase'
                            },
                            { 
                                label: 'Closed', 
                                value: stats.closed, 
                                color: 'gray', 
                                icon: XCircle,
                                bgGradient: 'from-gray-500 to-gray-600',
                                change: '-2%',
                                changeType: 'decrease'
                            }
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.bgGradient} text-white shadow-lg`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                            stat.changeType === 'increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Enhanced Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search with better styling */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search contacts by name, email, or subject..."
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F15A25]/20 focus:border-[#F15A25] outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    />
                                </div>
                            </div>

                            {/* Status Filter with icons */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F15A25]/20 focus:border-[#F15A25] outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                                >
                                    <option value="all">All Status</option>
                                    <option value="new">New</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            {/* Sort with icons */}
                            <div className="relative">
                                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F15A25]/20 focus:border-[#F15A25] outline-none transition-all duration-200 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                                    value={`${filters.sortBy}-${filters.sortOrder}`}
                                    onChange={(e) => {
                                        const [sortBy, sortOrder] = e.target.value.split('-');
                                        setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
                                    }}
                                >
                                    <option value="submittedAt-desc">Newest First</option>
                                    <option value="submittedAt-asc">Oldest First</option>
                                    <option value="name-asc">Name A-Z</option>
                                    <option value="name-desc">Name Z-A</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Contacts Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Contact</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Subject</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Priority</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                                        <th className="text-left py-4 px-6 font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {contacts.map((contact, index) => (
                                        <tr key={contact._id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200 group">
                                            <td className="py-5 px-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#F15A25] to-[#FF7A3D] rounded-full flex items-center justify-center text-white font-semibold">
                                                        {contact.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{contact.name}</p>
                                                        <p className="text-sm text-gray-500 flex items-center">
                                                            <Mail size={14} className="mr-1" />
                                                            {contact.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="max-w-xs">
                                                    <p className="text-gray-900 font-medium truncate">{contact.subject}</p>
                                                    <p className="text-sm text-gray-500 truncate">{contact.message}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(contact.status)}`}>
                                                    {getStatusIcon(contact.status)}
                                                    <span className="capitalize">{contact.status.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize ${getPriorityColor(contact.priority)}`}>
                                                    <Flag size={14} className="mr-1" />
                                                    {contact.priority}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-900">{formatDate(contact.submittedAt)}</span>
                                                    <p className="text-xs text-gray-500">{getTimeAgo(contact.submittedAt)}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedContact(contact);
                                                            setShowModal(true);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1.5 bg-[#F15A25] text-white text-sm font-medium rounded-lg hover:bg-[#e04e1a] transition-colors duration-200"
                                                    >
                                                        <Eye size={14} className="mr-1" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => deleteContact(contact._id)}
                                                        className="inline-flex items-center px-2 py-1.5 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Enhanced Pagination */}
                        {pagination.pages > 1 && (
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                <div className="text-sm text-gray-700 font-medium">
                                    Showing <span className="font-semibold">{((pagination.page - 1) * filters.limit) + 1}</span> to <span className="font-semibold">{Math.min(pagination.page * filters.limit, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        <ChevronLeft size={16} className="mr-1" />
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                                        Page {pagination.page} of {pagination.pages}
                                    </span>
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.pages}
                                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        Next
                                        <ChevronRight size={16} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Contact Details Modal */}
                    {showModal && selectedContact && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-[#F15A25] to-[#FF7A3D] p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">Contact Details</h2>
                                                <p className="text-orange-100">Manage customer inquiry</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                                        >
                                            <XCircle size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Column - Contact Info */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Contact Information Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <User className="mr-2 text-[#F15A25]" size={20} />
                                                    Contact Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                                        <p className="text-gray-900 font-semibold">{selectedContact.name}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                                        <div className="flex items-center space-x-2">
                                                            <p className="text-gray-900 font-semibold">{selectedContact.email}</p>
                                                            <ExternalLink size={14} className="text-gray-400 cursor-pointer hover:text-[#F15A25]" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Message Card */}
                                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <FileText className="mr-2 text-blue-500" size={20} />
                                                    Message Details
                                                </h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Subject</label>
                                                        <p className="text-gray-900 font-semibold text-lg">{selectedContact.subject}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Message</label>
                                                        <div className="bg-white p-4 rounded-lg border border-gray-200 mt-2">
                                                            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedContact.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Notes */}
                                            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-6 border border-amber-100">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <Edit className="mr-2 text-amber-500" size={20} />
                                                    Internal Notes
                                                </h3>
                                                <textarea
                                                    value={selectedContact.adminNotes || ''}
                                                    onChange={(e) => {
                                                        setSelectedContact(prev => ({ ...prev, adminNotes: e.target.value }));
                                                    }}
                                                    onBlur={(e) => updateContact(selectedContact._id, { adminNotes: e.target.value })}
                                                    placeholder="Add internal notes for this contact..."
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F15A25]/20 focus:border-[#F15A25] outline-none transition-all duration-200 resize-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column - Actions & Metadata */}
                                        <div className="space-y-6">
                                            {/* Quick Actions */}
                                            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <Activity className="mr-2 text-green-500" size={20} />
                                                    Quick Actions
                                                </h3>
                                                
                                                {/* Status Update */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Update Status</label>
                                                        <select
                                                            value={selectedContact.status}
                                                            onChange={(e) => updateContact(selectedContact._id, { status: e.target.value })}
                                                            disabled={updating}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F15A25]/20 focus:border-[#F15A25] outline-none transition-all duration-200 bg-white"
                                                        >
                                                            <option value="new">🔵 New</option>
                                                            <option value="in_progress">🟡 In Progress</option>
                                                            <option value="resolved">🟢 Resolved</option>
                                                            <option value="closed">⚫ Closed</option>
                                                        </select>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Set Priority</label>
                                                        <select
                                                            value={selectedContact.priority}
                                                            onChange={(e) => updateContact(selectedContact._id, { priority: e.target.value })}
                                                            disabled={updating}
                                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F15A25]/20 focus:border-[#F15A25] outline-none transition-all duration-200 bg-white"
                                                        >
                                                            <option value="low">🟢 Low</option>
                                                            <option value="medium">🟡 Medium</option>
                                                            <option value="high">🟠 High</option>
                                                            <option value="urgent">🔴 Urgent</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex space-x-2 pt-2">
                                                        <button
                                                            onClick={() => window.open(`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`)}
                                                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                                        >
                                                            <Mail size={16} className="mr-2" />
                                                            Reply
                                                        </button>
                                                        <button
                                                            onClick={() => deleteContact(selectedContact._id)}
                                                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors duration-200"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact Timeline */}
                                            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <Clock className="mr-2 text-purple-500" size={20} />
                                                    Timeline
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">Message Submitted</p>
                                                            <p className="text-xs text-gray-500">{formatDate(selectedContact.submittedAt)}</p>
                                                        </div>
                                                    </div>
                                                    {selectedContact.lastUpdated !== selectedContact.submittedAt && (
                                                        <div className="flex items-start space-x-3">
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                                                <p className="text-xs text-gray-500">{formatDate(selectedContact.lastUpdated)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedContact.resolvedAt && (
                                                        <div className="flex items-start space-x-3">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">Resolved</p>
                                                                <p className="text-xs text-gray-500">{formatDate(selectedContact.resolvedAt)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Technical Details */}
                                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                                    <Activity className="mr-2 text-gray-500" size={20} />
                                                    Technical Details
                                                </h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                        <span className="text-gray-600 font-medium">Contact ID</span>
                                                        <span className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {selectedContact._id.slice(-8)}
                                                        </span>
                                                    </div>
                                                    {selectedContact.ipAddress && (
                                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                            <span className="text-gray-600 font-medium flex items-center">
                                                                <MapPin size={14} className="mr-1" />
                                                                IP Address
                                                            </span>
                                                            <span className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                {selectedContact.ipAddress}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center py-2">
                                                        <span className="text-gray-600 font-medium">Response Time</span>
                                                        <span className="text-gray-900 font-semibold">
                                                            {getTimeAgo(selectedContact.submittedAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span className="flex items-center">
                                                <Calendar size={14} className="mr-1" />
                                                Created {getTimeAgo(selectedContact.submittedAt)}
                                            </span>
                                            {updating && (
                                                <span className="flex items-center text-[#F15A25]">
                                                    <div className="animate-spin w-4 h-4 border-2 border-[#F15A25] border-t-transparent rounded-full mr-2"></div>
                                                    Updating...
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && contacts.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={32} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
                            <p className="text-gray-600 mb-4">
                                {filters.search || filters.status !== 'all' 
                                    ? 'Try adjusting your filters to see more results.' 
                                    : 'No customer inquiries yet. They will appear here when submitted.'}
                            </p>
                            {(filters.search || filters.status !== 'all') && (
                                <button
                                    onClick={() => setFilters({ ...filters, search: '', status: 'all', page: 1 })}
                                    className="inline-flex items-center px-4 py-2 bg-[#F15A25] text-white text-sm font-medium rounded-lg hover:bg-[#e04e1a] transition-colors duration-200"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}