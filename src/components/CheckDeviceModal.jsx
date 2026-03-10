'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Check, AlertTriangle, Smartphone } from 'lucide-react';
import { compatibleDevices } from "@/lib/devices";


// Group devices by brand for the filter
const deviceBrands = Array.from(new Set(compatibleDevices.map(device => device.brand)));

const CheckDeviceModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDevices, setFilteredDevices] = useState(compatibleDevices);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [searchResult, setSearchResult] = useState(null);
  const modalRef = useRef(null);
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

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Clear search and result
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    searchInputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-semibold flex items-center">
            <Smartphone className="mr-2" size={22} />
            Device Compatibility
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-5 border-b">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for your device..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A25]"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Brand filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBrand('All')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedBrand === 'All'
                  ? 'bg-[#F15A25] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {deviceBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedBrand === brand
                    ? 'bg-[#F15A25] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>
        
        {/* Search Result */}
        {searchResult && (
          <div className="p-5 border-b">
            <div className={`flex items-center p-4 rounded-lg ${
              searchResult.compatible ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'
            }`}>
              {searchResult.compatible ? (
                <Check className="mr-3 text-green-500 flex-shrink-0" size={24} />
              ) : (
                <AlertTriangle className="mr-3 text-yellow-500 flex-shrink-0" size={24} />
              )}
              <div>
                <h3 className="font-medium">{searchResult.brand} {searchResult.model}</h3>
                <p className={`text-sm ${searchResult.compatible ? 'text-green-600' : 'text-yellow-600'}`}>
                  {searchResult.compatible 
                    ? 'This device is compatible with eSIM technology.'
                    : 'This device does not support eSIM technology.'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Device List */}
        <div className="flex-1 overflow-y-auto">
          {filteredDevices.length > 0 ? (
            <div className="p-5 divide-y">
              {selectedBrand !== 'All' ? (
                // No grouping needed when brand is filtered
                filteredDevices.map((device, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <span className="text-sm">{device.model}</span>
                    {device.compatible ? (
                      <span className="text-green-500 flex items-center text-sm font-medium">
                        <Check className="mr-1" size={16} />
                        Compatible
                      </span>
                    ) : (
                      <span className="text-yellow-500 flex items-center text-sm font-medium">
                        <AlertTriangle className="mr-1" size={16} />
                        Not Compatible
                      </span>
                    )}
                  </div>
                ))
              ) : (
                // Group by brand when showing all
                deviceBrands.map(brand => {
                  const brandDevices = filteredDevices.filter(d => d.brand === brand);
                  if (brandDevices.length === 0) return null;
                  
                  return (
                    <div key={brand} className="py-3">
                      <h3 className="font-medium mb-2">{brand}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                        {brandDevices.map((device, index) => (
                          <div key={index} className="flex items-center text-sm">
                            {device.compatible ? (
                              <Check className="mr-2 text-green-500" size={14} />
                            ) : (
                              <AlertTriangle className="mr-2 text-yellow-500" size={14} />
                            )}
                            <span className={device.compatible ? "" : "text-gray-500"}>
                              {device.model}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-gray-500">
              <p>No devices found matching your search criteria.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t bg-gray-50 text-sm text-gray-600">
          <p>Don't see your device? <a href="/support" className="text-[#F15A25] font-medium">Contact support</a> to check compatibility.</p>
        </div>
      </div>
    </div>
  );
};

export default CheckDeviceModal;