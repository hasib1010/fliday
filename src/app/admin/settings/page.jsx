'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Save,
    RefreshCw,
    DollarSign,
    Percent,
    Globe,
    Settings as SettingsIcon
} from 'lucide-react';

// Admin layout component with sidebar
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminSettings() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        defaultMarkupAmount: 10000, // $10.00 in cents
        defaultCurrency: 'USD',
        taxRates: [
            { country: 'US', rate: 0 },
            { country: 'CA', rate: 0 },
            { country: 'GB', rate: 0 },
            { country: 'EU', rate: 0 }
        ],
        emailNotifications: {
            orderConfirmation: true,
            orderStatusUpdate: true,
            adminNewOrder: true,
            lowInventory: false
        },
        maintenance: {
            enabled: false,
            message: 'We are currently performing scheduled maintenance. Please check back later.'
        }
    });
    const [activeTab, setActiveTab] = useState('general');

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
            fetchSettings();
        }
    }, [status, session, router]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/settings');

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            // If fetch fails, keep default settings
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            // Show success toast or notification here
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateTaxRate = (index, value) => {
        const updatedTaxRates = [...settings.taxRates];
        updatedTaxRates[index] = { ...updatedTaxRates[index], rate: parseFloat(value) || 0 };
        setSettings({ ...settings, taxRates: updatedTaxRates });
    };

    const toggleEmailNotification = (key) => {
        setSettings({
            ...settings,
            emailNotifications: {
                ...settings.emailNotifications,
                [key]: !settings.emailNotifications[key]
            }
        });
    };

    const formatCurrency = (amount) => {
        // Convert cents to dollars for display
        return (amount / 100).toFixed(2);
    };

    // Loading state
    if (loading) {
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h1 className="text-2xl font-bold mb-4 sm:mb-0">Settings</h1>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={fetchSettings}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                        </button>

                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#F15A25] hover:bg-[#E04E1A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={16} className="mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'general'
                                        ? 'border-[#F15A25] text-[#F15A25]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('pricing')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'pricing'
                                        ? 'border-[#F15A25] text-[#F15A25]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Pricing & Tax
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notifications'
                                        ? 'border-[#F15A25] text-[#F15A25]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Notifications
                            </button>
                            <button
                                onClick={() => setActiveTab('maintenance')}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'maintenance'
                                        ? 'border-[#F15A25] text-[#F15A25]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Maintenance
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <SettingsIcon size={24} className="text-gray-500 mr-3" />
                                <h2 className="text-lg font-semibold">General Settings</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Currency
                                    </label>
                                    <select
                                        id="currency"
                                        value={settings.defaultCurrency}
                                        onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                                        className="block w-full md:w-64 border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="CAD">CAD ($)</option>
                                        <option value="AUD">AUD ($)</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">
                                        This currency will be used for all transactions and displays.
                                    </p>
                                </div>

                                {/* Add more general settings as needed */}
                                <div className="pt-4 border-t border-gray-200">
                                    <h3 className="text-md font-medium mb-3">API Integration Settings</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="provider-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                                                eSIM Provider API Key
                                            </label>
                                            <input
                                                type="password"
                                                id="provider-api-key"
                                                placeholder="••••••••••••••••••••••"
                                                className="block w-full md:w-96 border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                            />
                                            <p className="mt-1 text-sm text-gray-500">
                                                This key is securely stored and used for eSIM provider API communication.
                                            </p>
                                        </div>

                                        <div>
                                            <label htmlFor="provider-endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                                                API Endpoint
                                            </label>
                                            <input
                                                type="text"
                                                id="provider-endpoint"
                                                value="https://api.esimprovider.com/v1/"
                                                className="block w-full md:w-96 border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pricing & Tax Settings */}
                    {activeTab === 'pricing' && (
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <DollarSign size={24} className="text-gray-500 mr-3" />
                                <h2 className="text-lg font-semibold">Pricing & Tax Settings</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="markup" className="block text-sm font-medium text-gray-700 mb-1">
                                        Default Markup Amount (per order)
                                    </label>
                                    <div className="relative mt-1 rounded-md shadow-sm w-full md:w-64">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="text"
                                            id="markup"
                                            value={formatCurrency(settings.defaultMarkupAmount)}
                                            onChange={(e) => {
                                                // Convert dollars to cents and store as integer
                                                const value = parseFloat(e.target.value) || 0;
                                                setSettings({ ...settings, defaultMarkupAmount: Math.round(value * 100) });
                                            }}
                                            className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">USD</span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        This amount will be added to each order as profit margin.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <h3 className="text-md font-medium mb-3">Tax Rates</h3>

                                    <div className="space-y-4">
                                        {settings.taxRates.map((tax, index) => (
                                            <div key={tax.country} className="flex items-center">
                                                <span className="w-20 text-sm font-medium text-gray-700">{tax.country}:</span>
                                                <div className="relative rounded-md shadow-sm w-32">
                                                    <input
                                                        type="text"
                                                        value={tax.rate}
                                                        onChange={(e) => updateTaxRate(index, e.target.value)}
                                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                                        placeholder="0"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <Percent size={14} className="text-gray-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-sm text-gray-500">
                                        Set tax rates by country. These will be applied to customer orders based on their location.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <Globe size={24} className="text-gray-500 mr-3" />
                                <h2 className="text-lg font-semibold">Notification Settings</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="orderConfirmation"
                                            type="checkbox"
                                            checked={settings.emailNotifications.orderConfirmation}
                                            onChange={() => toggleEmailNotification('orderConfirmation')}
                                            className="focus:ring-[#F15A25] h-4 w-4 text-[#F15A25] border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="orderConfirmation" className="font-medium text-gray-700">Order Confirmation</label>
                                        <p className="text-gray-500">Send email confirmation to customers when an order is placed.</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="orderStatusUpdate"
                                            type="checkbox"
                                            checked={settings.emailNotifications.orderStatusUpdate}
                                            onChange={() => toggleEmailNotification('orderStatusUpdate')}
                                            className="focus:ring-[#F15A25] h-4 w-4 text-[#F15A25] border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="orderStatusUpdate" className="font-medium text-gray-700">Order Status Updates</label>
                                        <p className="text-gray-500">Notify customers when their order status changes.</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="adminNewOrder"
                                            type="checkbox"
                                            checked={settings.emailNotifications.adminNewOrder}
                                            onChange={() => toggleEmailNotification('adminNewOrder')}
                                            className="focus:ring-[#F15A25] h-4 w-4 text-[#F15A25] border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="adminNewOrder" className="font-medium text-gray-700">Admin New Order</label>
                                        <p className="text-gray-500">Send email notifications to administrators when new orders are placed.</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="lowInventory"
                                            type="checkbox"
                                            checked={settings.emailNotifications.lowInventory}
                                            onChange={() => toggleEmailNotification('lowInventory')}
                                            className="focus:ring-[#F15A25] h-4 w-4 text-[#F15A25] border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="lowInventory" className="font-medium text-gray-700">Low Inventory Alerts</label>
                                        <p className="text-gray-500">Receive notifications when inventory levels are low (if applicable).</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <h3 className="text-md font-medium mb-3">Admin Notification Recipients</h3>

                                    <div>
                                        <label htmlFor="adminEmails" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Addresses (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            id="adminEmails"
                                            placeholder="admin@example.com, support@example.com"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            These email addresses will receive admin notifications.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Settings */}
                    {activeTab === 'maintenance' && (
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <SettingsIcon size={24} className="text-gray-500 mr-3" />
                                <h2 className="text-lg font-semibold">Maintenance Mode</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="maintenanceMode"
                                            type="checkbox"
                                            checked={settings.maintenance.enabled}
                                            onChange={() => setSettings({
                                                ...settings,
                                                maintenance: {
                                                    ...settings.maintenance,
                                                    enabled: !settings.maintenance.enabled
                                                }
                                            })}
                                            className="focus:ring-[#F15A25] h-4 w-4 text-[#F15A25] border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="maintenanceMode" className="font-medium text-gray-700">Enable Maintenance Mode</label>
                                        <p className="text-gray-500">When enabled, the website will display a maintenance message to all users except administrators.</p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 mb-1">
                                        Maintenance Message
                                    </label>
                                    <textarea
                                        id="maintenanceMessage"
                                        rows={3}
                                        value={settings.maintenance.message}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            maintenance: {
                                                ...settings.maintenance,
                                                message: e.target.value
                                            }
                                        })}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#F15A25] focus:border-[#F15A25] sm:text-sm"
                                    />
                                </div>

                                {settings.maintenance.enabled && (
                                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-700">
                                                    <strong>Warning:</strong> Maintenance mode is currently enabled. Only administrators can access the website.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}