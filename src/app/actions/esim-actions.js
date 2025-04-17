// app/actions/esim-actions.js
'use server';

import { revalidatePath } from 'next/cache';
import { 
  getSupportedLocations, 
  getDataPackages, 
  createEsimOrder, 
  getOrderDetails,
  getEsimUsage,
  getWalletBalance
} from '@/lib/esimaccess/api';

/**
 * Fetch all supported countries and regions
 */
export async function fetchLocations() {
  try {
    const response = await getSupportedLocations();
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch locations');
    }
    
    // Process the locations to separate countries and regions
    const countries = [];
    const regions = [];
    
    response.data.forEach(location => {
      if (location.type === 1) {
        // Single country
        countries.push({
          code: location.code,
          name: location.name
        });
      } else if (location.type === 2) {
        // Region with multiple countries
        regions.push({
          code: location.code,
          name: location.name,
          countries: location.subLocationList || []
        });
      }
    });
    
    return {
      success: true,
      data: {
        countries: countries.sort((a, b) => a.name.localeCompare(b.name)),
        regions: regions.sort((a, b) => a.name.localeCompare(b.name)),
        all: response.data
      }
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while fetching locations'
    };
  }
}

/**
 * Fetch packages based on country code
 */
export async function fetchPackages(countryCode) {
  try {
    if (!countryCode) {
      throw new Error('Country code is required');
    }
    
    const response = await getDataPackages({ countryCode });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch packages');
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching packages:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while fetching packages'
    };
  }
}

/**
 * Create a new eSIM order
 */
export async function createOrder(formData) {
  try {
    // Extract form data
    const packageCode = formData.get('packageCode') || formData.packageCode;
    const email = formData.get('email') || formData.email;
    const customerReference = formData.get('customerReference') || formData.customerReference;
    
    // Validate required fields
    if (!packageCode) {
      throw new Error('Package code is required');
    }
    
    if (!email) {
      throw new Error('Email is required');
    }
    
    // Create order data object
    const orderData = {
      packageCode,
      email,
      customerReference
    };
    
    // Call the API
    const response = await createEsimOrder(orderData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create order');
    }
    
    // Revalidate any paths that might be displaying this order
    revalidatePath('/orders');
    revalidatePath(`/orders/${response.data.orderNo}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while creating your order'
    };
  }
}

/**
 * Fetch order details by order number
 */
export async function fetchOrder(orderNo) {
  try {
    if (!orderNo) {
      throw new Error('Order number is required');
    }
    
    const response = await getOrderDetails(orderNo);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch order details');
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while fetching order details'
    };
  }
}

/**
 * Fetch eSIM usage data
 */
export async function fetchEsimUsage(esimTranNo) {
  try {
    if (!esimTranNo) {
      throw new Error('eSIM transaction number is required');
    }
    
    const response = await getEsimUsage([esimTranNo]);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch usage data');
    }
    
    // The API returns an array of usage data, but we only requested one
    const usageData = response.data[0];
    
    if (!usageData) {
      throw new Error('No usage data found for this eSIM');
    }
    
    // Calculate percentage used
    const totalBytes = usageData.totalData;
    const usedBytes = usageData.dataUsage;
    const remainingBytes = totalBytes - usedBytes;
    const percentageUsed = (usedBytes / totalBytes) * 100;
    
    // Format data size units
    const formattedData = {
      totalData: formatDataSize(totalBytes),
      dataUsage: formatDataSize(usedBytes),
      remainingData: formatDataSize(remainingBytes),
      percentageUsed: Math.min(100, Math.round(percentageUsed)),
      lastUpdated: new Date(usageData.lastUpdateTime)
    };
    
    return {
      success: true,
      rawData: usageData,
      data: formattedData
    };
  } catch (error) {
    console.error('Error fetching eSIM usage:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while fetching usage data'
    };
  }
}

/**
 * Fetch wallet balance
 */
export async function fetchBalance() {
  try {
    const response = await getWalletBalance();
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch wallet balance');
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return {
      success: false,
      message: error.message || 'An error occurred while fetching wallet balance'
    };
  }
}

/**
 * Helper function to format data size in appropriate units
 */
function formatDataSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
}