// src/lib/esimaccess/config.js
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE || 'f8b5************335e';
const ESIM_SECRET_KEY = process.env.ESIM_SECRET_KEY || '2c3b************2a8d';
const API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

// Make sure to not expose these credentials to the client side
if (!ESIM_ACCESS_CODE) {
  console.error('ESIMaccess credentials are not properly configured.');
}

module.exports = {
  ESIM_ACCESS_CODE,
  ESIM_SECRET_KEY,
  API_BASE_URL
};
