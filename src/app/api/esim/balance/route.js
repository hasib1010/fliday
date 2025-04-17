// app/api/esim/balance/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE || 'f8b5************335e';
const API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

export async function GET() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/open/balance/query`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE
        }
      }
    );

    const balanceData = response.data?.obj || {};
    
    return NextResponse.json({
      success: true,
      data: {
        balance: balanceData.balance || 0,
        lastUpdated: balanceData.lastUpdated || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching balance:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.errorMsg || 'Failed to fetch balance'
      },
      { status: 500 }
    );
  }
}