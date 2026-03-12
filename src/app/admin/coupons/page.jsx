'use client';

import { useEffect, useState } from 'react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [useOncePerCustomer, setUseOncePerCustomer] = useState(false);

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons');
    const data = await res.json();

    if (data.success) {
      setCoupons(data.coupons);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const createCoupon = async () => {
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
        useOncePerCustomer
      })
    });

    const data = await res.json();

    if (data.success) {
      setCode('');
      setDiscountValue('');
      setUsageLimit('');
      setExpiresAt('');
      fetchCoupons();
    } else {
      alert(data.error);
    }
  };

  const deleteCoupon = async (id) => {
    await fetch(`/api/admin/coupons?id=${id}`, {
      method: 'DELETE'
    });

    fetchCoupons();
  };

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-6">Coupons</h1>

      {/* CREATE COUPON */}
      <div className="bg-white border rounded-lg p-6 mb-10 space-y-4">

        <input
          placeholder="Coupon Code"
          className="border p-2 rounded w-full"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <select
          className="border p-2 rounded w-full"
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value)}
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>

        <input
          placeholder="Discount Value"
          type="number"
          className="border p-2 rounded w-full"
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
        />

        <input
          placeholder="Usage Limit"
          type="number"
          className="border p-2 rounded w-full"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded w-full"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={firstOrderOnly}
            onChange={(e) => setFirstOrderOnly(e.target.checked)}
          />
          First order only
        </label>

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={useOncePerCustomer}
            onChange={(e) => setUseOncePerCustomer(e.target.checked)}
          />
          Use once per customer
        </label>

        <button
          onClick={createCoupon}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Coupon
        </button>
      </div>

      {/* LIST COUPONS */}
      <div className="space-y-4">

        {loading && <p>Loading coupons...</p>}

        {!loading && coupons.map((coupon) => (
          <div
            key={coupon._id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{coupon.code}</p>
              <p className="text-sm text-gray-500">
                {coupon.discountType === 'percentage'
                  ? `${coupon.discountValue}% off`
                  : `$${coupon.discountValue} off`}
              </p>
            </div>

            <button
              onClick={() => deleteCoupon(coupon._id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}