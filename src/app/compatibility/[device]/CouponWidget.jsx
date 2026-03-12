'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, TicketPercent, ArrowRight } from 'lucide-react';

export default function CouponWidget() {
  const [copied, setCopied] = useState(false);
  const couponCode = 'WELCOME10';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy coupon:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#F15A25] to-[#E04E1A] rounded-2xl shadow-sm overflow-hidden text-white">
      <div className="p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm font-medium mb-4">
          <TicketPercent className="w-4 h-4" />
          Exclusive offer
        </div>

        <h3 className="text-xl font-bold leading-tight mb-2">
          Get 10% off your first eSIM
        </h3>

        <p className="text-sm text-white/90 leading-6 mb-5">
          Use this coupon at checkout and save on your first Fliday purchase.
        </p>

        <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/70 mb-1">
              Coupon code
            </p>
            <p className="text-lg font-bold tracking-[0.15em]">{couponCode}</p>
          </div>

          <button
            onClick={handleCopy}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              copied
                ? 'bg-green-500 text-white'
                : 'bg-white text-[#F15A25] hover:bg-orange-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        <Link
          href="/destinations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-white/90"
        >
          Browse eSIM plans
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}