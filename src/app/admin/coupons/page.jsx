'use client'; import AdminLayout from '@/components/admin/AdminLayout';

import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Loader2, TicketPercent, Calendar, Hash } from 'lucide-react';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [usageLimit, setUsageLimit] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [firstOrderOnly, setFirstOrderOnly] = useState(false);
    const [useOncePerCustomer, setUseOncePerCustomer] = useState(false);
    const [applicableDataAmounts, setApplicableDataAmounts] = useState([]);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();

            if (data.success) {
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const createCoupon = async () => {
        if (!code || !discountValue) {
            alert('Please fill in coupon code and discount value.');
            return;
        }

        try {
            setSubmitting(true);

            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    discountType,
                    discountValue: Number(discountValue),
                    usageLimit: usageLimit ? Number(usageLimit) : null,
                    expiresAt: expiresAt || null,
                    firstOrderOnly,
                    useOncePerCustomer,
                    applicableDataAmounts
                })
            });

            const data = await res.json();

            if (data.success) {
                setCode('');
                setDiscountType('percentage');
                setDiscountValue('');
                setUsageLimit('');
                setExpiresAt('');
                setFirstOrderOnly(false);
                setUseOncePerCustomer(false);
                fetchCoupons();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Create coupon error:', error);
            alert('Failed to create coupon');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCoupon = async (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this coupon?');
        if (!confirmed) return;

        try {
            await fetch(`/api/admin/coupons?id=${id}`, {
                method: 'DELETE'
            });

            fetchCoupons();
        } catch (error) {
            console.error('Delete coupon error:', error);
            alert('Failed to delete coupon');
        }
    };

    return (
        <AdminLayout>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#FFF1ED] flex items-center justify-center">
                            <Tag className="w-5 h-5 text-[#F15A25]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Coupons</h1>
                            <p className="text-sm text-gray-500">
                                Create and manage discount codes for checkout.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
                    {/* Create coupon card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 h-fit">
                        <div className="flex items-center gap-2 mb-5">
                            <Plus className="w-4 h-4 text-[#F15A25]" />
                            <h2 className="text-lg font-semibold text-gray-900">Create Coupon</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Coupon Code
                                </label>
                                <input
                                    placeholder="WELCOME10"
                                    className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Discount Value
                                    </label>
                                    <input
                                        placeholder={discountType === 'percentage' ? '10' : '50000'}
                                        type="number"
                                        className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Usage Limit
                                    </label>
                                    <input
                                        placeholder="Leave empty for unlimited"
                                        type="number"
                                        className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                        value={usageLimit}
                                        onChange={(e) => setUsageLimit(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 pt-1">
                                <label className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={firstOrderOnly}
                                        onChange={(e) => setFirstOrderOnly(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#F15A25] focus:ring-[#F15A25]"
                                    />
                                    First order only
                                </label>

                                <label className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={useOncePerCustomer}
                                        onChange={(e) => setUseOncePerCustomer(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#F15A25] focus:ring-[#F15A25]"
                                    />
                                    Use once per customer
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Applicable Data Plans
                                </label>

                                <div className="grid grid-cols-3 gap-2">
                                    {["1GB", "3GB", "5GB", "10GB", "20GB"].map((plan) => (
                                        <label key={plan} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={applicableDataAmounts.includes(plan)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setApplicableDataAmounts([...applicableDataAmounts, plan]);
                                                    } else {
                                                        setApplicableDataAmounts(
                                                            applicableDataAmounts.filter(p => p !== plan)
                                                        );
                                                    }
                                                }}
                                            />
                                            {plan}
                                        </label>
                                    ))}
                                </div>

                                <p className="text-xs text-gray-500 mt-2">
                                    Leave empty to allow the coupon on all data plans.
                                </p>
                            </div>

                            <button
                                onClick={createCoupon}
                                disabled={submitting}
                                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${submitting
                                    ? 'bg-[#F15A25]/70 text-white cursor-not-allowed'
                                    : 'bg-[#F15A25] hover:bg-[#E04E1A] text-white'
                                    }`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Create Coupon
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Coupons list */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">All Coupons</h2>
                                <p className="text-sm text-gray-500">
                                    {loading ? 'Loading...' : `${coupons.length} coupon${coupons.length === 1 ? '' : 's'}`}
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Loading coupons...
                            </div>
                        ) : coupons.length === 0 ? (
                            <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                                <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-600 font-medium">No coupons yet</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Create your first coupon using the form on the left.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {coupons.map((coupon) => (
                                    <div
                                        key={coupon._id}
                                        className="border border-gray-200 rounded-2xl p-4 sm:p-5"
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <p className="text-base font-semibold text-gray-900">
                                                        {coupon.code}
                                                    </p>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${coupon.active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {coupon.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                                    <span className="inline-flex items-center gap-1">
                                                        <TicketPercent className="w-4 h-4" />
                                                        {coupon.discountType === 'percentage'
                                                            ? `${coupon.discountValue}% off`
                                                            : `$${(coupon.discountValue / 10000).toFixed(2)} off`}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1">
                                                        <Hash className="w-4 h-4" />
                                                        Used {coupon.usedCount || 0}
                                                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                                                    </span>

                                                    {coupon.expiresAt && (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Expires {new Date(coupon.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {coupon.firstOrderOnly && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-[#FFF1ED] text-[#F15A25] font-medium">
                                                            First order only
                                                        </span>
                                                    )}
                                                    {coupon.useOncePerCustomer && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-[#FFF1ED] text-[#F15A25] font-medium">
                                                            Once per customer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteCoupon(coupon._id)}
                                                className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm self-start"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}