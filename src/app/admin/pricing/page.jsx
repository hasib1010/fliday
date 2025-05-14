'use client';
// app/admin/pricing/page.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, RefreshCw, Edit2, X, Check, Filter,
    AlertTriangle, Info, Loader2, ArrowUp, ArrowDown
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function PricingManagement() {
    // State
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncLoading, setSyncLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [editMode, setEditMode] = useState({});
    const [editPrices, setEditPrices] = useState({});
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [countries, setCountries] = useState([]);
    const [notification, setNotification] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [tableLoading, setTableLoading] = useState(false); // For table-only loading
    
    // Debounce timer reference
    const debounceTimerRef = useRef(null);

    // Constants
    const DEFAULT_MARKUP_AMOUNT = 10000; // $1.00 in cents * 100 format

    // Helper functions

    // Check if a package has default markup ($1.00 markup)
    const hasDefaultMarkup = (pkg) => {
        return pkg.markupAmount === DEFAULT_MARKUP_AMOUNT;
    };

    // Check if a package has custom pricing (not $1.00 markup)
    const hasCustomPricing = (pkg) => {
        return pkg.markupAmount !== DEFAULT_MARKUP_AMOUNT;
    };

    // Apply filters - optimized version with memoization to prevent unnecessary re-renders
    const applyFilters = useCallback((allPackages, search, filter, country) => {
        // No need to show loading indicator here - we'll control that separately
        
        let filtered = [...allPackages];

        // Apply all filters in a single pass
        filtered = filtered.filter(pkg => {
            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                if (!((pkg.name && pkg.name.toLowerCase().includes(searchLower)) ||
                    (pkg.packageCode && pkg.packageCode.toLowerCase().includes(searchLower)))) {
                    return false;
                }
            }

            // Custom pricing filter - based on markup amount
            if (filter === 'custom' && hasDefaultMarkup(pkg)) {
                return false;
            }
            if (filter === 'default' && !hasDefaultMarkup(pkg)) {
                return false;
            }

            // Country filter
            if (country && (!pkg.locations || !pkg.locations.includes(country))) {
                return false;
            }

            return true;
        });

        // Apply sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                if (['price', 'originalPrice', 'markupAmount'].includes(sortConfig.key)) {
                    const aValue = a[sortConfig.key] || 0;
                    const bValue = b[sortConfig.key] || 0;
                    return sortConfig.direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                } else {
                    const aValue = String(a[sortConfig.key] || '');
                    const bValue = String(b[sortConfig.key] || '');
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
            });
        }

        setFilteredPackages(filtered);
        setTableLoading(false); // Hide table loading when done
    }, [sortConfig]);

    // Fetch packages using the admin-specific API
    const fetchPackages = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setNotification(null);

            console.log('Fetching packages...');

            // Add a timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            // Use the admin packages API which returns all packages without filtering
            const response = await fetch('/api/admin/packages', {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error:', response.status, errorText);
                throw new Error(`API error: ${response.status} - ${errorText || 'Failed to fetch packages'}`);
            }

            const data = await response.json();
            console.log('Received data:', data);

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch packages');
            }

            // Process packages data
            let packagesData = data.data || [];

            if (!Array.isArray(packagesData)) {
                console.error('Invalid data format:', packagesData);
                throw new Error('Invalid data format received from API');
            }

            console.log(`Got ${packagesData.length} packages`);

            // Determine custom pricing status based on markup amount
            packagesData = packagesData.map(pkg => ({
                ...pkg,
                hasCustomPricing: pkg.markupAmount !== DEFAULT_MARKUP_AMOUNT
            }));

            // Extract unique countries for filtering
            const uniqueCountries = new Set();
            packagesData.forEach(pkg => {
                if (pkg.locations && pkg.locations.length) {
                    pkg.locations.forEach(loc => uniqueCountries.add(loc));
                }
            });

            setCountries(Array.from(uniqueCountries).sort());
            setPackages(packagesData);

            // Initialize edit prices
            const initialEditPrices = {};
            packagesData.forEach(pkg => {
                initialEditPrices[pkg.packageCode] = (pkg.price / 10000).toFixed(2);
            });
            setEditPrices(initialEditPrices);

            // Apply initial filters - don't pass searchQuery to avoid re-filtering during initial load
            applyFilters(packagesData, '', selectedFilter, selectedCountry);

            setNotification({
                type: 'success',
                message: `Loaded ${packagesData.length} packages successfully`
            });
        } catch (error) {
            console.error('Error fetching packages:', error);
            setError(error.message || 'Failed to fetch packages');
            setNotification({
                type: 'error',
                message: error.message || 'Failed to fetch packages'
            });

            // Initialize with empty data on error
            setPackages([]);
            setFilteredPackages([]);
        } finally {
            setLoading(false);
        }
    }, [selectedFilter, selectedCountry, applyFilters]); // Removed searchQuery dependency

    // Initial load
    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    // Implement debounce for search query
    useEffect(() => {
        // Clear any existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // Set new timer to update the debounced value after delay
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            if (packages.length > 0) {
                setTableLoading(true);
            }
        }, 300); // 300ms debounce delay
        
        // Cleanup on unmount
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery]);

    // Initial load and effect dependencies
    useEffect(() => {
        if (!loading) { // Only apply filters if not in initial loading state
            // This fixes the issue with filtering during search
            if (packages.length > 0) {
                applyFilters(packages, debouncedSearchQuery, selectedFilter, selectedCountry);
            }
        }
    }, [packages, debouncedSearchQuery, selectedFilter, selectedCountry, applyFilters, loading]);

    // Handle search input change without debounce
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        // Don't set tableLoading here, wait for the debounced effect
    };

    // Toggle edit mode
    const toggleEdit = (packageCode) => {
        setEditMode(prev => ({
            ...prev,
            [packageCode]: !prev[packageCode]
        }));
    };

    // Handle price change
    const handlePriceChange = (packageCode, value) => {
        setEditPrices(prev => ({
            ...prev,
            [packageCode]: value
        }));
    };

    // Save price
    const savePrice = async (packageCode) => {
        try {
            const pkg = packages.find(p => p.packageCode === packageCode);
            if (!pkg) {
                throw new Error('Package not found');
            }

            // Validate price
            const newPrice = parseFloat(editPrices[packageCode]);
            if (isNaN(newPrice) || newPrice <= 0) {
                throw new Error('Please enter a valid price');
            }

            const originalPrice = pkg.originalPrice;
            const newPriceApiFormat = Math.round(newPrice * 10000);

            // Ensure retail price isn't lower than original
            if (newPriceApiFormat < originalPrice) {
                throw new Error(`Retail price must be at least $${(originalPrice / 10000).toFixed(2)}`);
            }

            // Call API to update pricing
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageCode,
                    originalPrice,
                    retailPrice: newPriceApiFormat,
                    packageName: pkg.name,
                    dataAmount: pkg.dataAmount,
                    duration: pkg.duration,
                    location: pkg.location,
                    slug: pkg.slug
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update price');
            }

            // Calculate new markup amount
            const newMarkupAmount = newPriceApiFormat - originalPrice;

            // Update local state
            setPackages(prev =>
                prev.map(p =>
                    p.packageCode === packageCode
                        ? {
                            ...p,
                            price: newPriceApiFormat,
                            markupAmount: newMarkupAmount,
                            hasCustomPricing: newMarkupAmount !== DEFAULT_MARKUP_AMOUNT
                        }
                        : p
                )
            );

            // Exit edit mode
            toggleEdit(packageCode);

            setNotification({
                type: 'success',
                message: `Price updated for ${pkg.name}`
            });
        } catch (error) {
            console.error('Error saving price:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Failed to update price'
            });
        }
    };

    // Cancel edit
    const cancelEdit = (packageCode) => {
        const pkg = packages.find(p => p.packageCode === packageCode);
        if (pkg) {
            setEditPrices(prev => ({
                ...prev,
                [packageCode]: (pkg.price / 10000).toFixed(2)
            }));
        }
        toggleEdit(packageCode);
    };

    // Sync pricing with provider API
    const syncPricing = async () => {
        try {
            setSyncLoading(true);
            setNotification(null);

            // Use the admin packages API for syncing
            const response = await fetch('/api/admin/packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_pricing' })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to sync pricing');
            }

            const data = await response.json();

            // Refresh packages to show updated data
            await fetchPackages();

            setNotification({
                type: 'success',
                message: data.message || 'Pricing sync completed successfully'
            });
        } catch (error) {
            console.error('Error syncing pricing:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Failed to sync pricing'
            });
        } finally {
            setSyncLoading(false);
        }
    };

    // Handle sorting
    const handleSort = (key) => {
        setTableLoading(true); // Show table loading indicator when sorting
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        
        // Apply sorting immediately rather than waiting for effect to trigger
        setTimeout(() => {
            applyFilters(packages, debouncedSearchQuery, selectedFilter, selectedCountry);
        }, 0);
    };

    // Format price for display
    const formatPrice = (price) => {
        if (typeof price !== 'number') return '0.00';
        return (price / 10000).toFixed(2);
    };

    // Calculate markup percentage
    const calculateMarkupPercentage = (original, retail) => {
        if (!original) return 0;
        return Math.round((retail - original) / original * 100);
    };

    // Retry loading if there was an error
    const handleRetryLoading = () => {
        fetchPackages();
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">eSIM Pricing Management</h1>
                    {!loading && (
                        <button
                            onClick={handleRetryLoading}
                            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        >
                            <RefreshCw size={16} />
                            <span>Refresh</span>
                        </button>
                    )}
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`mb-6 p-4 rounded-lg flex items-start ${notification.type === 'error'
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                        {notification.type === 'error' ? (
                            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                        ) : (
                            <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                        )}
                        <span>{notification.message}</span>
                        <button
                            className="ml-auto text-gray-500 hover:text-gray-700"
                            onClick={() => setNotification(null)}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Main content */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-10">
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 size={48} className="text-[#F15A25] animate-spin mb-6" />
                            <p className="text-gray-700 font-medium mb-2">Loading packages...</p>
                            <p className="text-gray-500 text-sm">This may take a few moments</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <div className="flex flex-col items-center justify-center">
                            <AlertTriangle size={48} className="text-red-500 mb-6" />
                            <p className="text-gray-700 font-medium mb-2">Error loading packages</p>
                            <p className="text-gray-500 text-sm mb-4">{error}</p>
                            <button
                                onClick={handleRetryLoading}
                                className="bg-[#F15A25] hover:bg-[#e04e20] text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Info box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                            <Info className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Quick Help</p>
                                <p>
                                    Packages with $1.00 markup are using the default pricing (displayed in normal rows).
                                    Custom pricing (any markup other than $1.00) is highlighted in blue.
                                    Click the edit button to customize your retail price.
                                </p>
                            </div>
                        </div>

                        {/* Filters and controls */}
                        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* Search - Now with improved handling */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search packages..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="pl-10 p-2 border rounded-lg w-full focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                    />
                                    {debouncedSearchQuery !== searchQuery && (
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                            <div className="w-4 h-4 border-t-2 border-r-2 border-[#F15A25] rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Filter buttons */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedFilter('all')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium ${selectedFilter === 'all'
                                            ? 'bg-[#F15A25] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        All Packages
                                    </button>
                                    <button
                                        onClick={() => setSelectedFilter('custom')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium ${selectedFilter === 'custom'
                                            ? 'bg-[#F15A25] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Custom Pricing
                                    </button>
                                    <button
                                        onClick={() => setSelectedFilter('default')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium ${selectedFilter === 'default'
                                            ? 'bg-[#F15A25] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Default Pricing
                                    </button>
                                </div>

                                {/* Country filter */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Filter size={18} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={selectedCountry}
                                        onChange={(e) => setSelectedCountry(e.target.value)}
                                        className="pl-10 p-2 border rounded-lg w-full focus:ring-2 focus:ring-[#F15A25] focus:border-transparent appearance-none bg-white"
                                    >
                                        <option value="">All Countries</option>
                                        {countries.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sync control */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <span className="text-sm font-medium text-gray-700">
                                            {filteredPackages.length} packages
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
                                        <span className="text-xs text-gray-500">Default pricing ($1.00 markup)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-300 border border-blue-200"></div>
                                        <span className="text-xs text-gray-500">Custom pricing</span>
                                    </div>
                                </div>

                                <button
                                    onClick={syncPricing}
                                    disabled={syncLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:bg-blue-300 disabled:cursor-not-allowed"
                                >
                                    {syncLoading ? (
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw size={16} className="mr-2" />
                                    )}
                                    Sync Pricing
                                </button>
                            </div>
                        </div>

                        {/* Packages table with separate loading state */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto relative">
                                {/* Table loading overlay - shows only when filtering/searching but data is already loaded */}
                                {tableLoading && (
                                    <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center">
                                        <div className="flex items-center">
                                            <Loader2 size={24} className="text-[#F15A25] animate-spin mr-3" />
                                            <span className="text-gray-700">Updating results...</span>
                                        </div>
                                    </div>
                                )}
                                
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center">
                                                    Package
                                                    {sortConfig.key === 'name' && (
                                                        sortConfig.direction === 'asc'
                                                            ? <ArrowUp size={14} className="ml-1" />
                                                            : <ArrowDown size={14} className="ml-1" />
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Details
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('originalPrice')}
                                            >
                                                <div className="flex items-center">
                                                    Original Price
                                                    {sortConfig.key === 'originalPrice' && (
                                                        sortConfig.direction === 'asc'
                                                            ? <ArrowUp size={14} className="ml-1" />
                                                            : <ArrowDown size={14} className="ml-1" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center">
                                                    Retail Price
                                                    {sortConfig.key === 'price' && (
                                                        sortConfig.direction === 'asc'
                                                            ? <ArrowUp size={14} className="ml-1" />
                                                            : <ArrowDown size={14} className="ml-1" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort('markupAmount')}
                                            >
                                                <div className="flex items-center">
                                                    Markup
                                                    {sortConfig.key === 'markupAmount' && (
                                                        sortConfig.direction === 'asc'
                                                            ? <ArrowUp size={14} className="ml-1" />
                                                            : <ArrowDown size={14} className="ml-1" />
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredPackages.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-10 text-center">
                                                    <p className="text-gray-500">No packages found matching your criteria</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPackages.map((pkg) => (
                                                <tr
                                                    key={pkg.packageCode}
                                                    className={hasDefaultMarkup(pkg) ? "" : "bg-blue-300/50"}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                                                        <div className="text-xs text-gray-500">{pkg.packageCode}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium">
                                                            {pkg.dataAmount}
                                                            <span className="mx-1">•</span>
                                                            {pkg.duration} days
                                                        </div>
                                                        <div className="text-xs text-gray-500">{pkg.speed}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm flex items-center gap-2">
                                                            <span>
                                                                {pkg.locations && pkg.locations.length > 0
                                                                    ? pkg.locations.slice(0, 3).join(', ') + (pkg.locations.length > 3 ? '...' : '')
                                                                    : 'Global'}
                                                            </span>
                                                            {pkg.locations && pkg.locations.length === 1 && (
                                                                <img className='w-6 h-6 rounded-full' src={`/flags/${pkg.locations[0]}_flag.jpeg`} alt="" />
                                                            )}
                                                            {pkg.locations && pkg.locations.length > 1 && (
                                                                <img className='w-6 h-6 rounded-full' src={`/flags/global_flag.svg`} alt="" />
                                                            )}
                                                        </div>
                                                        {pkg.locations && pkg.locations.length > 3 && (
                                                            <div className="text-xs text-gray-500">
                                                                +{pkg.locations.length - 3} more
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-600">
                                                            ${formatPrice(pkg.originalPrice)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {editMode[pkg.packageCode] ? (
                                                            <div className="flex items-center">
                                                                <div className="relative">
                                                                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-500">
                                                                        $
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        min={formatPrice(pkg.originalPrice)}
                                                                        value={editPrices[pkg.packageCode]}
                                                                        onChange={(e) => handlePriceChange(pkg.packageCode, e.target.value)}
                                                                        className="pl-6 p-1 border rounded w-28 focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`text-sm font-medium ${hasDefaultMarkup(pkg) ? 'text-gray-900' : 'text-blue-700'}`}>
                                                                ${formatPrice(pkg.price)}
                                                                {hasDefaultMarkup(pkg) && (
                                                                    <span className="ml-1 text-xs text-gray-500">(default)</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm">
                                                            ${formatPrice(pkg.markupAmount)}
                                                            <span className="ml-1 text-xs text-gray-500">
                                                                ({calculateMarkupPercentage(pkg.originalPrice, pkg.price)}%)
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                        {editMode[pkg.packageCode] ? (
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => savePrice(pkg.packageCode)}
                                                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                                                                    title="Save"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => cancelEdit(pkg.packageCode)}
                                                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                                                    title="Cancel"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => toggleEdit(pkg.packageCode)}
                                                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                                                title="Edit Price"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Table footer with package count */}
                            <div className="px-6 py-4 bg-gray-50 text-sm text-gray-500 flex justify-between">
                                <span>Showing {filteredPackages.length} of {packages.length} packages</span>
                                <span>
                                    {packages.filter(pkg => !hasDefaultMarkup(pkg)).length} custom pricing /
                                    {packages.filter(pkg => hasDefaultMarkup(pkg)).length} default pricing
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}