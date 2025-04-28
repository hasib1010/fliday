'use client';
// app/admin/pricing/page.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, RefreshCw, Save, Percent,
    DollarSign, Edit2, Trash2, X, Check, Filter,
    ArrowUp, ArrowDown, AlertTriangle, Info, Loader2
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function PricingManagement() {
    // State
    const [packages, setPackages] = useState([]);
    const [filteredPackages, setFilteredPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncLoading, setSyncLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editMode, setEditMode] = useState({});
    const [editPrices, setEditPrices] = useState({});
    const [bulkMarkup, setBulkMarkup] = useState('10');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [countries, setCountries] = useState([]);
    const [notification, setNotification] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    // Debounce function
    const useDebounce = (value, delay) => {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    };

    // Apply debounce to search
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Fetch packages using the admin-specific API
    const fetchPackages = useCallback(async () => {
        try {
            setLoading(true);
            setNotification(null);

            // Use the admin packages API which returns all packages without filtering
            const response = await fetch('/api/admin/packages');

            if (!response.ok) {
                throw new Error('Failed to fetch packages');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch packages');
            }

            // Process packages data
            const packagesData = data.data;

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

            // Apply initial filters
            applyFilters(packagesData, debouncedSearch, selectedFilter, selectedCountry);

            setNotification({
                type: 'success',
                message: `Loaded ${packagesData.length} packages successfully`
            });
        } catch (error) {
            console.error('Error fetching packages:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Failed to fetch packages'
            });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, selectedFilter, selectedCountry]);

    // Apply filters
    const applyFilters = useCallback((allPackages, search, filter, country) => {
        let filtered = [...allPackages];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(pkg =>
                (pkg.name && pkg.name.toLowerCase().includes(searchLower)) ||
                (pkg.packageCode && pkg.packageCode.toLowerCase().includes(searchLower))
            );
        }

        // Apply custom pricing filter
        if (filter === 'custom') {
            filtered = filtered.filter(pkg => pkg.hasCustomPricing);
        } else if (filter === 'default') {
            filtered = filtered.filter(pkg => !pkg.hasCustomPricing);
        }

        // Apply country filter
        if (country) {
            filtered = filtered.filter(pkg =>
                pkg.locations && pkg.locations.includes(country)
            );
        }

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
    }, [sortConfig]);

    // Initial load
    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    // Apply filters when criteria change
    useEffect(() => {
        applyFilters(packages, debouncedSearch, selectedFilter, selectedCountry);
    }, [packages, debouncedSearch, selectedFilter, selectedCountry, applyFilters]);

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

            // Update local state
            setPackages(prev =>
                prev.map(p =>
                    p.packageCode === packageCode
                        ? {
                            ...p,
                            price: newPriceApiFormat,
                            hasCustomPricing: true,
                            markupAmount: newPriceApiFormat - originalPrice
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

    // Apply bulk markup
    const applyBulkMarkup = async () => {
        try {
            // Validate markup
            const markup = parseFloat(bulkMarkup);
            if (isNaN(markup) || markup < 0) {
                throw new Error('Please enter a valid markup percentage');
            }

            const packageCodes = filteredPackages.map(pkg => pkg.packageCode).filter(Boolean);

            if (packageCodes.length === 0) {
                throw new Error('No packages selected for bulk update');
            }

            setSyncLoading(true);

            // Call API to apply markup
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    markupPercentage: markup,
                    filter: {
                        packageCode: { $in: packageCodes }
                    }
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to apply markup');
            }

            const result = await response.json();

            // Refresh packages
            await fetchPackages();

            setNotification({
                type: 'success',
                message: result.message || `Applied ${markup}% markup to ${packageCodes.length} packages`
            });
        } catch (error) {
            console.error('Error applying bulk markup:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Failed to apply markup'
            });
        } finally {
            setSyncLoading(false);
        }
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
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
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

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">eSIM Pricing Management</h1>
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

                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                    <Info className="text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">About eSIM Pricing</p>
                        <p>
                            Set your own retail prices for eSIM packages. The original price comes from the provider API, and you can add a markup to determine what your customers pay.
                            When a customer makes a purchase, they'll be charged your retail price, but the provider will charge you their original price.
                        </p>
                    </div>
                </div>

                {/* Filters and controls */}
                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search packages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 p-2 border rounded-lg w-full focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                            />
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

                    {/* Bulk pricing controls */}
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Markup Percentage</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={bulkMarkup}
                                    onChange={(e) => setBulkMarkup(e.target.value)}
                                    className="p-2 pl-8 border rounded-lg w-full focus:ring-2 focus:ring-[#F15A25] focus:border-transparent"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Percent size={16} className="text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">
                                    {filteredPackages.length} packages selected
                                </span>
                            </div>
                        </div>

                        <div className="flex space-x-2 h-full">


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
                </div>

                {/* Packages table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
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
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Loader2 size={32} className="text-[#F15A25] animate-spin mb-4" />
                                                <p className="text-gray-500">Loading packages...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPackages.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center">
                                            <p className="text-gray-500">No packages found matching your criteria</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPackages.map((pkg) => (
                                        <tr
                                            key={pkg.packageCode}
                                            className={pkg.hasCustomPricing ? "bg-blue-50" : ""}
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
                                                <div className="text-sm">
                                                    {pkg.locations && pkg.locations.length > 0
                                                        ? pkg.locations.slice(0, 3).join(', ') + (pkg.locations.length > 3 ? '...' : '')
                                                        : 'Global'}
                                                    {pkg.locations && pkg.locations.length === 1 && (
                                                        <img className='w-10 h-10 rounded-full' src={`/flags/${pkg.locations[0]}_flag.jpeg`} alt="" />)}
                                                    {pkg.locations && pkg.locations.length > 1 && (
                                                        <img className='w-10 h-10 rounded-full' src={`/flags/global_flag.svg`} alt="" />)}
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
                                                    <div className={`text-sm font-medium ${pkg.hasCustomPricing ? 'text-blue-700' : 'text-gray-900'}`}>
                                                        ${formatPrice(pkg.price)}
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
                    <div className="px-6 py-4 bg-gray-50 text-sm text-gray-500">
                        Showing {filteredPackages.length} of {packages.length} packages
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}