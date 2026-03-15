'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
    Loader2, Search, RefreshCw, Smartphone, HouseWifi,
    Clock, CheckCircle, XCircle, AlertCircle, WifiOff, Zap, Ban, RotateCcw
} from 'lucide-react';

function getEsimStatusDisplay(esimStatus, smdpStatus) {
    if (esimStatus === 'CANCEL' || esimStatus === 'REVOKE') {
        return { label: esimStatus === 'REVOKE' ? 'Revoked' : 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200', icon: <Ban size={14} />, dot: 'bg-red-500', isCancelled: true };
    }
    if (esimStatus === 'SUSPENDED') return { label: 'Suspended', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: <AlertCircle size={14} />, dot: 'bg-orange-500', isCancelled: false };
    if (esimStatus === 'UNUSED_EXPIRED') return { label: 'Expired (Unused)', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <Clock size={14} />, dot: 'bg-gray-400', isCancelled: false };
    if (esimStatus === 'USED_EXPIRED') return { label: 'Expired', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <Clock size={14} />, dot: 'bg-gray-400', isCancelled: false };
    if (esimStatus === 'USED_UP') return { label: 'Data Used Up', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <WifiOff size={14} />, dot: 'bg-purple-500', isCancelled: false };
    if (esimStatus === 'IN_USE') return { label: 'In Use', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Zap size={14} />, dot: 'bg-blue-500', isCancelled: false };
    if (esimStatus === 'GOT_RESOURCE') {
        if (smdpStatus === 'ENABLED') return { label: 'Activated', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle size={14} />, dot: 'bg-green-500', isCancelled: false };
        if (smdpStatus === 'DOWNLOAD' || smdpStatus === 'INSTALLATION') return { label: 'Installing', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <RotateCcw size={14} className="animate-spin" />, dot: 'bg-blue-400', isCancelled: false };
        return { label: 'Ready to Install', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle size={14} />, dot: 'bg-green-500', isCancelled: false };
    }
    if (['CREATE', 'PAYING', 'PAID', 'GETTING_RESOURCE'].includes(esimStatus)) return { label: 'Preparing', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock size={14} />, dot: 'bg-yellow-400', isCancelled: false };
    return { label: esimStatus ? esimStatus.replace(/_/g, ' ') : 'Active', color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle size={14} />, dot: 'bg-green-500', isCancelled: false };
}

function formatBytes(bytes) {
    if (!bytes) return null;
    const gb = bytes / (1024 ** 3);
    return gb >= 1 ? `${gb.toFixed(1)} GB used` : `${(bytes / (1024 ** 2)).toFixed(0)} MB used`;
}

function UsageBar({ totalVolume, orderUsage }) {
    if (!totalVolume || orderUsage == null) return null;
    const pct = Math.min(100, Math.round((orderUsage / totalVolume) * 100));
    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : 'bg-green-500';
    return (
        <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{formatBytes(orderUsage)}</span>
                <span>{Math.round((totalVolume - orderUsage) / (1024 ** 3) * 10) / 10} GB left</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function OrderCard({ order }) {
    const esimDetails = order.esimDetails || {};
    const esimStatus  = esimDetails.esimStatus  || 'GOT_RESOURCE';
    const smdpStatus  = esimDetails.smdpStatus  || null;
    const totalVolume = esimDetails.totalVolume || null;
    const orderUsage  = esimDetails.orderUsage  ?? null;
    const expiredTime = esimDetails.expiredTime || null;
    const display     = getEsimStatusDisplay(esimStatus, smdpStatus);
    const isGlobal    = (order.location?.length ?? 0) > 2;
    const expiryDate  = expiredTime
        ? new Date(expiredTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : null;
    const price = typeof order.finalPrice === 'number' ? (order.finalPrice / 10000).toFixed(2) : '—';

    return (
        <div className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <img
                        src={isGlobal ? '/flags/global_flag.svg' : `/flags/${order.location?.toLowerCase()}_flag.jpeg`}
                        alt={order.location}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/flags/global_flag.svg'; }}
                    />
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{order.packageName}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${display.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${display.dot}`} />
                        {display.icon}
                        {display.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">USD {price}</span>
                </div>

                {totalVolume && orderUsage != null && (
                    <UsageBar totalVolume={totalVolume} orderUsage={orderUsage} />
                )}

                {expiryDate && (
                    <p className="text-xs text-gray-400 mt-2">
                        Expires: <span className="text-gray-600 font-medium">{expiryDate}</span>
                    </p>
                )}

                <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                    {display.isCancelled ? (
                        <span className="text-xs text-red-400 italic self-center">eSIM cancelled</span>
                    ) : (
                        <Link href={`/checkout/confirmation?orderId=${order.orderId}`}
                            className="text-[#F15A25] hover:text-[#E04E1A] inline-flex items-center gap-1.5 text-sm font-medium">
                            <Smartphone size={16} /> Install
                        </Link>
                    )}
                    <Link href={`/esim/profile/${order.orderId}`}
                        className="text-gray-600 hover:text-gray-800 inline-flex items-center gap-1.5 text-sm font-medium">
                        <HouseWifi size={16} /> Check Usage
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function MyOrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders]       = useState([]);
    const [loading, setLoading]     = useState(true);
    const [syncing, setSyncing]     = useState(false);
    const [error, setError]         = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') window.location.href = '/api/auth/signin';
    }, [status]);

    // Sync only THIS user's stale orders (not updated in last 30 min)
    // The API route filters by session user automatically
    const syncStaleOrders = useCallback(async () => {
        try {
            await fetch('/api/esim/sync-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}), // session user is used server-side
            });
        } catch { /* non-fatal */ }
    }, []);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res  = await fetch('/api/user/orders');
            if (!res.ok) throw new Error(`Error: ${res.status}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch orders');
            const completed = data.orders.filter(o => o.orderStatus === 'completed');
            setOrders(completed);
        } catch (err) {
            setError(err.message || 'Failed to load orders');
        } finally {
            setLoading(false);
        }
    }, []);

    // On load: sync stale orders silently in background, then fetch
    useEffect(() => {
        if (status === 'authenticated') {
            // Sync runs in background — don't await, fetch immediately
            syncStaleOrders();
            fetchOrders();
        }
    }, [status]);

    // Manual refresh: force sync (ignore stale threshold) then re-fetch
    const handleRefresh = async () => {
        setSyncing(true);
        try {
            // Force sync all user's orders regardless of stale threshold
            await fetch('/api/esim/sync-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forceSync: true }),
            });
            await new Promise(r => setTimeout(r, 1200));
        } catch { /* non-fatal */ }
        setSyncing(false);
        fetchOrders();
    };

    const filtered = orders.filter(o =>
        !searchTerm ||
        o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 text-[#F15A25] animate-spin" /></div>;
    }

    return (
        <div className="max-w-[1220px] mx-auto my-20 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My eSIMs</h1>
                <p className="mt-1 text-sm text-gray-500">View and manage all your eSIM packages</p>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#F15A25] focus:border-[#F15A25]"
                        placeholder="Search by ID, location, or package"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={handleRefresh} disabled={syncing || loading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                    <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing…' : 'Refresh'}
                </button>
            </div>

            {/* Sync indicator */}
            {syncing && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-700">
                    <Loader2 size={14} className="animate-spin" />
                    Checking latest eSIM status from provider…
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-sm text-red-700">
                    <XCircle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-16 gap-3 text-gray-500">
                    <Loader2 className="w-6 h-6 text-[#F15A25] animate-spin" />
                    Loading your eSIMs…
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white shadow rounded-xl p-10 text-center">
                    <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">{searchTerm ? 'No eSIMs match your search' : 'No eSIMs found'}</h3>
                    <p className="mt-1 text-sm text-gray-500">{searchTerm ? 'Try a different search term.' : "You don't have any eSIMs yet."}</p>
                    {!searchTerm && (
                        <Link href="/destinations" className="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A]">
                            Browse Destinations
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(order => <OrderCard key={order.orderId} order={order} />)}
                </div>
            )}
        </div>
    );
}