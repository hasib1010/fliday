'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Check, AlertTriangle, Smartphone, ChevronLeft, ArrowRight, Zap } from 'lucide-react';
import Head from 'next/head';

// Import the same compatibility data that we use in the modal
// You can also move this to a separate data file for better organization
const compatibleDevices = [
  // Apple iPhones
  { brand: 'Apple', model: 'iPhone 15 Pro Max', compatible: true },
  { brand: 'Apple', model: 'iPhone 15 Pro', compatible: true },
  { brand: 'Apple', model: 'iPhone 15 Plus', compatible: true },
  { brand: 'Apple', model: 'iPhone 15', compatible: true },
  { brand: 'Apple', model: 'iPhone 14 Pro Max', compatible: true },
  { brand: 'Apple', model: 'iPhone 14 Pro', compatible: true },
  { brand: 'Apple', model: 'iPhone 14 Plus', compatible: true },
  { brand: 'Apple', model: 'iPhone 14', compatible: true },
  { brand: 'Apple', model: 'iPhone 13 Pro Max', compatible: true },
  { brand: 'Apple', model: 'iPhone 13 Pro', compatible: true },
  { brand: 'Apple', model: 'iPhone 13', compatible: true },
  { brand: 'Apple', model: 'iPhone 13 Mini', compatible: true },
  { brand: 'Apple', model: 'iPhone 12 Pro Max', compatible: true },
  { brand: 'Apple', model: 'iPhone 12 Pro', compatible: true },
  { brand: 'Apple', model: 'iPhone 12', compatible: true },
  { brand: 'Apple', model: 'iPhone 12 Mini', compatible: true },
  { brand: 'Apple', model: 'iPhone 11 Pro Max', compatible: true },
  { brand: 'Apple', model: 'iPhone 11 Pro', compatible: true },
  { brand: 'Apple', model: 'iPhone 11', compatible: true },
  { brand: 'Apple', model: 'iPhone XS Max', compatible: true },
  { brand: 'Apple', model: 'iPhone XS', compatible: true },
  { brand: 'Apple', model: 'iPhone XR', compatible: true },
  { brand: 'Apple', model: 'iPhone SE (2nd generation)', compatible: true },
  { brand: 'Apple', model: 'iPhone SE (3rd generation)', compatible: true },
  
  // Samsung Galaxy
  { brand: 'Samsung', model: 'Galaxy S23 Ultra', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S23+', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S23', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S22 Ultra', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S22+', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S22', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S21 Ultra', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S21+', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S21', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S21 FE', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S20 Ultra', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S20+', compatible: true },
  { brand: 'Samsung', model: 'Galaxy S20', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Z Fold 5', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Z Fold 4', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Z Fold 3', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Z Flip 5', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Z Flip 4', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Z Flip 3', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Note 20 Ultra', compatible: true },
  { brand: 'Samsung', model: 'Galaxy Note 20', compatible: true },
  
  // Google Pixel
  { brand: 'Google', model: 'Pixel 8 Pro', compatible: true },
  { brand: 'Google', model: 'Pixel 8', compatible: true },
  { brand: 'Google', model: 'Pixel 7 Pro', compatible: true },
  { brand: 'Google', model: 'Pixel 7', compatible: true },
  { brand: 'Google', model: 'Pixel 7a', compatible: true },
  { brand: 'Google', model: 'Pixel 6 Pro', compatible: true },
  { brand: 'Google', model: 'Pixel 6', compatible: true },
  { brand: 'Google', model: 'Pixel 6a', compatible: true },
  { brand: 'Google', model: 'Pixel 5', compatible: true },
  { brand: 'Google', model: 'Pixel 4a (5G)', compatible: true },
  { brand: 'Google', model: 'Pixel 4 XL', compatible: true },
  { brand: 'Google', model: 'Pixel 4', compatible: true },
  
  // Motorola
  { brand: 'Motorola', model: 'Razr 40 Ultra', compatible: true },
  { brand: 'Motorola', model: 'Edge 40 Pro', compatible: true },
  { brand: 'Motorola', model: 'Edge 30 Pro', compatible: true },
  
  // Huawei
  { brand: 'Huawei', model: 'P40 Pro', compatible: true },
  { brand: 'Huawei', model: 'P40', compatible: true },
  { brand: 'Huawei', model: 'Mate 40 Pro', compatible: true },
  
  // OnePlus
  { brand: 'OnePlus', model: '11', compatible: true },
  { brand: 'OnePlus', model: '10 Pro', compatible: true },
  { brand: 'OnePlus', model: '9 Pro', compatible: true },
  { brand: 'OnePlus', model: '9', compatible: true },
  
  // Xiaomi
  { brand: 'Xiaomi', model: '13', compatible: true },
  { brand: 'Xiaomi', model: '12T Pro', compatible: true },
  { brand: 'Xiaomi', model: '12 Pro', compatible: true },
  { brand: 'Xiaomi', model: '12', compatible: true },
  
  // OPPO
  { brand: 'OPPO', model: 'Find X5 Pro', compatible: true },
  { brand: 'OPPO', model: 'Find X5', compatible: true },
  { brand: 'OPPO', model: 'Find X3 Pro', compatible: true },
  
  // Legacy devices or incompatible devices
  { brand: 'Apple', model: 'iPhone 8', compatible: false },
  { brand: 'Apple', model: 'iPhone 7', compatible: false },
  { brand: 'Samsung', model: 'Galaxy S10', compatible: false },
  { brand: 'Samsung', model: 'Galaxy S9', compatible: false },
  { brand: 'OnePlus', model: '8T', compatible: false },
];

// Group devices by brand for the filter
const deviceBrands = Array.from(new Set(compatibleDevices.map(device => device.brand)));

export default function CompatibilityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDevices, setFilteredDevices] = useState(compatibleDevices);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [searchResult, setSearchResult] = useState(null);
  const searchInputRef = useRef(null);

  // Handle search and filtering
  useEffect(() => {
    let results = compatibleDevices;
    
    // Apply brand filter first (if not "All")
    if (selectedBrand !== 'All') {
      results = results.filter(device => device.brand === selectedBrand);
    }
    
    // Then apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(device => 
        device.brand.toLowerCase().includes(term) || 
        device.model.toLowerCase().includes(term)
      );
      
      // Find exact match for displaying result
      const exactMatch = results.find(device => 
        `${device.brand} ${device.model}`.toLowerCase() === term ||
        device.model.toLowerCase() === term
      );
      
      setSearchResult(exactMatch || null);
    } else {
      setSearchResult(null);
    }
    
    setFilteredDevices(results);
  }, [searchTerm, selectedBrand]);

  // Focus search input on page load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Clear search and result
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    searchInputRef.current?.focus();
  };

  // Counts for statistics
  const compatibleCount = compatibleDevices.filter(device => device.compatible).length;
  const totalCount = compatibleDevices.length;
  
  return (
    <>
      <Head>
        <title>eSIM Device Compatibility Checker</title>
        <meta name="description" content="Check if your device is compatible with our eSIM service" />
      </Head>
      
      <div className="max-w-[1220px] mx-auto px-4 pt-24 pb-16">
        {/* Back navigation */}
        <div className="mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" />
            Back to Home
          </Link>
        </div>
        
        {/* Hero section */}
        <div className="bg-gradient-to-r from-[#F15A25]/10 to-[#F15A25]/5 rounded-2xl p-8 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center">
            <Smartphone className="mr-3 text-[#F15A25]" size={36} />
            eSIM Device Compatibility Checker
          </h1>
          <p className="text-lg text-gray-700 md:max-w-3xl mb-6">
            Verify if your smartphone or tablet is compatible with our eSIM service. We support {compatibleCount} 
            devices across major brands including Apple, Samsung, Google, and more.
          </p>
          
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-lg font-semibold mb-1 flex items-center">
                <Smartphone className="mr-2 text-[#F15A25]" size={18} />
                Total Devices
              </div>
              <div className="text-3xl font-bold">{totalCount}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-lg font-semibold mb-1 flex items-center">
                <Check className="mr-2 text-green-500" size={18} />
                Compatible
              </div>
              <div className="text-3xl font-bold">{compatibleCount}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-lg font-semibold mb-1 flex items-center">
                <Zap className="mr-2 text-[#F15A25]" size={18} />
                Brands
              </div>
              <div className="text-3xl font-bold">{deviceBrands.length}</div>
            </div>
          </div>
          
          {/* Search input */}
          <div className="relative max-w-2xl">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for your device (e.g., iPhone 13, Galaxy S22)..."
              className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F15A25] text-lg"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <Smartphone size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Main content section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with brand filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Filter by Brand</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedBrand('All')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedBrand === 'All'
                      ? 'bg-[#F15A25] text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  All Brands
                </button>
                {deviceBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedBrand === brand
                        ? 'bg-[#F15A25] text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>{brand}</span>
                    {selectedBrand === brand && (
                      <Check size={16} />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Can't find your device or have questions about eSIM compatibility?
                </p>
                <Link href="/contact" className="text-sm flex items-center text-blue-700 font-medium hover:text-blue-800">
                  Contact Support <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Search result */}
            {searchResult && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Search Result</h2>
                <div className={`flex items-center p-6 rounded-xl ${
                  searchResult.compatible ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'
                }`}>
                  {searchResult.compatible ? (
                    <Check className="mr-4 text-green-500 flex-shrink-0" size={32} />
                  ) : (
                    <AlertTriangle className="mr-4 text-yellow-500 flex-shrink-0" size={32} />
                  )}
                  <div>
                    <h3 className="text-xl font-medium">{searchResult.brand} {searchResult.model}</h3>
                    <p className={`text-lg ${searchResult.compatible ? 'text-green-600' : 'text-yellow-600'}`}>
                      {searchResult.compatible 
                        ? 'Your device is compatible with eSIM technology! You can purchase and use our eSIM plans.'
                        : 'Unfortunately, this device does not support eSIM technology. You may need a physical SIM card.'}
                    </p>
                    {searchResult.compatible && (
                      <Link 
                        href="/destinations" 
                        className="mt-4 inline-flex items-center px-4 py-2 bg-[#F15A25] text-white rounded-lg font-medium hover:bg-[#E04E1A] transition-colors"
                      >
                        Browse eSIM Plans
                        <ArrowRight size={16} className="ml-2" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* All devices listing */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {selectedBrand === 'All' ? 'All Compatible Devices' : `${selectedBrand} Devices`}
                {searchTerm && ` matching "${searchTerm}"`}
              </h2>
              
              {filteredDevices.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {selectedBrand !== 'All' ? (
                    // No grouping needed when brand is filtered
                    <div className="divide-y">
                      {filteredDevices.map((device, index) => (
                        <div key={index} className="p-4 flex items-center justify-between">
                          <span className="font-medium">{device.model}</span>
                          {device.compatible ? (
                            <span className="text-green-500 flex items-center font-medium">
                              <Check className="mr-1" size={18} />
                              Compatible
                            </span>
                          ) : (
                            <span className="text-yellow-500 flex items-center font-medium">
                              <AlertTriangle className="mr-1" size={18} />
                              Not Compatible
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Group by brand when showing all
                    <div>
                      {deviceBrands.map(brand => {
                        const brandDevices = filteredDevices.filter(d => d.brand === brand);
                        if (brandDevices.length === 0) return null;
                        
                        return (
                          <div key={brand} className="border-b last:border-b-0">
                            <div className="p-4 bg-gray-50">
                              <h3 className="text-lg font-medium">{brand}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                              {brandDevices.map((device, index) => (
                                <div 
                                  key={index} 
                                  className={`p-3 rounded-lg border flex items-center ${
                                    device.compatible 
                                      ? 'border-green-100 bg-green-50' 
                                      : 'border-yellow-100 bg-yellow-50'
                                  }`}
                                >
                                  {device.compatible ? (
                                    <Check className="mr-2 text-green-500 flex-shrink-0" size={16} />
                                  ) : (
                                    <AlertTriangle className="mr-2 text-yellow-500 flex-shrink-0" size={16} />
                                  )}
                                  <span className="text-sm">{device.model}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-gray-500 mb-4">No devices found matching your search criteria.</p>
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-2">What is an eSIM?</h3>
              <p className="text-gray-700">
                An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without having
                to use a physical SIM card. It's built into your device and can be programmed to work with any carrier
                that supports eSIM technology.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-2">How do I know if my device has eSIM?</h3>
              <p className="text-gray-700">
                You can check in your device settings for an "Add Cellular Plan" or "Add Mobile Plan" option.
                Alternatively, use our compatibility checker above to verify if your specific model supports eSIM.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-2">Can I use eSIM and physical SIM simultaneously?</h3>
              <p className="text-gray-700">
                Yes! Most eSIM-capable devices allow you to use both an eSIM and a physical SIM card at the same time,
                which is perfect for having a local data plan and your home network active simultaneously while traveling.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-2">My device isn't on the list. Can it still work?</h3>
              <p className="text-gray-700">
                Our list is regularly updated, but some newer models might not be listed yet. If your device
                has eSIM capabilities according to the manufacturer, it should work with our service. Contact
                our support team for assistance.
              </p>
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#F15A25] to-[#F15A25]/90 rounded-2xl p-8 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to get connected?</h2>
            <p className="text-lg mb-8">
              Browse our range of eSIM plans for international travel, local data, and global coverage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/destinations" 
                className="px-6 py-3 bg-white text-[#F15A25] rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Browse eSIM Plans
              </Link>
              <Link 
                href="/contact" 
                className="px-6 py-3 bg-transparent border-2 border-white rounded-lg font-bold hover:bg-white/10 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}