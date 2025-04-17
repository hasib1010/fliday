
// src/lib/esimaccess/api.js
import axios from 'axios';
import { ESIM_ACCESS_CODE, API_BASE_URL } from './config';

// Create an axios instance with default configuration
const esimApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'RT-AccessCode': ESIM_ACCESS_CODE,
  },
});

/**
 * Get wallet balance
 * @returns {Promise<Object>} Wallet balance data
 */
export const getWalletBalance = async () => {
  try {
    const response = await esimApi.post('/open/balance/query', {});
    return {
      success: true,
      data: response.data.obj
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to fetch wallet balance'
    };
  }
};

/**
 * Get all supported locations (countries and regions)
 * @returns {Promise<Object>} List of supported locations
 */
export const getSupportedLocations = async () => {
  try {
    const response = await esimApi.post('/open/location/list', {});
    return {
      success: true,
      data: response.data.obj.locationList
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to fetch supported locations'
    };
  }
};

/**
 * Get data usage for one or more eSIMs
 * @param {Array<string>} esimTranNoList - List of eSIM transaction numbers
 * @returns {Promise<Object>} Usage data for the requested eSIMs
 */
export const getEsimUsage = async (esimTranNoList) => {
  try {
    if (!Array.isArray(esimTranNoList) || esimTranNoList.length === 0) {
      throw new Error('eSIM transaction number list is required');
    }

    const response = await esimApi.post('/open/esim/usage/query', {
      esimTranNoList
    });

    return {
      success: true,
      data: response.data.obj.esimUsageList
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to fetch eSIM usage data'
    };
  }
};

/**
 * Query available data packages
 * @param {Object} options - Query options
 * @param {string} [options.countryCode] - ISO country code to filter packages
 * @param {number} [options.dataGB] - Filter packages by data amount in GB
 * @param {number} [options.validity] - Filter packages by validity in days
 * @returns {Promise<Object>} Available data packages
 */
export const getDataPackages = async (options = {}) => {
  try {
    // Build query parameters based on provided options
    const queryParams = {};
    
    if (options.countryCode) {
      queryParams.countryCode = options.countryCode;
    }
    
    if (options.dataGB) {
      queryParams.dataGB = options.dataGB;
    }
    
    if (options.validity) {
      queryParams.validity = options.validity;
    }
    
    const response = await esimApi.post('/packages/query', queryParams);
    
    return {
      success: true,
      data: response.data.obj.packages || []
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to fetch data packages'
    };
  }
};

/**
 * Create a new eSIM order
 * @param {Object} orderData - Order data
 * @param {string} orderData.packageCode - Package code
 * @param {string} orderData.email - Customer email
 * @param {string} [orderData.customerReference] - Optional customer reference
 * @returns {Promise<Object>} Order details
 */
export const createEsimOrder = async (orderData) => {
  try {
    if (!orderData.packageCode) {
      throw new Error('Package code is required');
    }
    
    if (!orderData.email) {
      throw new Error('Customer email is required');
    }
    
    const payload = {
      packageCode: orderData.packageCode,
      email: orderData.email
    };
    
    if (orderData.customerReference) {
      payload.customerRef = orderData.customerReference;
    }
    
    const response = await esimApi.post('/orders/create', payload);
    
    return {
      success: true,
      data: response.data.obj
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to create eSIM order'
    };
  }
};

/**
 * Get order details by order number
 * @param {string} orderNo - Order number
 * @returns {Promise<Object>} Order details
 */
export const getOrderDetails = async (orderNo) => {
  try {
    if (!orderNo) {
      throw new Error('Order number is required');
    }
    
    const response = await esimApi.post('/orders/query', {
      orderNo
    });
    
    return {
      success: true,
      data: response.data.obj
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to fetch order details'
    };
  }
};

/**
 * Get all orders
 * @param {Object} options - Query options
 * @param {string} [options.startDate] - Start date (YYYY-MM-DD)
 * @param {string} [options.endDate] - End date (YYYY-MM-DD)
 * @param {number} [options.page] - Page number
 * @param {number} [options.limit] - Results per page
 * @returns {Promise<Object>} List of orders
 */
export const getAllOrders = async (options = {}) => {
  try {
    const queryParams = {
      page: options.page || 1,
      limit: options.limit || 10
    };
    
    if (options.startDate) {
      queryParams.startDate = options.startDate;
    }
    
    if (options.endDate) {
      queryParams.endDate = options.endDate;
    }
    
    const response = await esimApi.post('/orders/list', queryParams);
    
    return {
      success: true,
      data: response.data.obj
    };
  } catch (error) {
    handleApiError(error);
    return {
      success: false,
      message: error.message || 'Failed to fetch orders'
    };
  }
};

/**
 * Handle API errors
 * @param {Error} error - The caught error
 */
const handleApiError = (error) => {
  if (axios.isAxiosError(error) && error.response) {
    const { data } = error.response;
    
    // Log API-specific error code and message if available
    if (data && data.errorCode && data.errorMsg) {
      console.error(`ESIMaccess API Error (${data.errorCode}): ${data.errorMsg}`);
    } else {
      console.error('ESIMaccess API Error:', error.response.status, error.response.statusText);
    }
    
    // Re-throw with a user-friendly message
    throw new Error(data.errorMsg || 'An error occurred while communicating with the ESIMaccess API');
  }
  
  // Handle network or other errors
  console.error('Unexpected API error:', error);
  throw error;
};

// Export the API client for direct use if needed
export const apiClient = esimApi;