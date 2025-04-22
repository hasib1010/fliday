// components/TopUpHistory.js
'use client';

import { useState, useEffect } from 'react';
import { Clock, PlusCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export default function TopUpHistory({ orderId }) {
  const [topUps, setTopUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchTopUps();
    }
  }, [orderId]);

  const fetchTopUps = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/topups?orderId=${orderId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Log the topups for debugging
        console.log('TopUps received:', data.topUps);
        setTopUps(data.topUps || []);
      } else {
        throw new Error(data.error || 'Failed to fetch top-up history');
      }
    } catch (err) {
      console.error('Error fetching top-ups:', err);
      setError(err.message || 'An error occurred while fetching top-up history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    // Check if amount is a valid number
    if (amount === undefined || amount === null || isNaN(amount)) {
      console.warn('Invalid price value:', amount);
      return '$0.00'; // Default fallback value
    }
    
    // Convert from provider's price format (10000 = $1.00) to actual dollars
    const priceValue = amount / 10000;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(priceValue);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 text-[#F15A25] animate-spin mr-2" />
        <span className="text-sm text-gray-600">Loading top-up history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 py-2">
        Failed to load top-up history: {error}
      </div>
    );
  }

  if (topUps.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-sm text-gray-500">No top-ups found for this eSIM</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <PlusCircle className="h-5 w-5 text-[#F15A25] mr-2" />
          <h4 className="font-medium text-gray-900">Top-Up History</h4>
          <span className="ml-2 text-sm text-gray-500">({topUps.length} top-ups)</span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="space-y-4">
            {topUps.map((topUp) => {
              // Log each topUp for debugging
              console.log('Rendering topUp:', topUp);
              
              return (
                <div 
                  key={topUp.topUpId} 
                  className="border border-gray-200 rounded-md p-3 bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{topUp.packageName}</h5>
                      <p className="text-sm text-gray-600">{topUp.dataAmount} - {topUp.duration}</p>
                    </div>
                    <div className="text-right">
                      {/* Try to use finalPrice, but fall back to price if finalPrice is not available */}
                      <p className="font-medium text-[#F15A25]">
                        {formatCurrency(topUp.finalPrice || topUp.price, topUp.currency)}
                      </p>
                      <p className="text-xs text-gray-500">Purchased on {formatDate(topUp.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Completed: {formatDate(topUp.completedAt || topUp.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}