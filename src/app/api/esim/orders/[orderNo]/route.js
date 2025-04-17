// app/api/esim/orders/[orderNo]/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE || 'f8b5************335e';
const API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

export async function GET(request, { params }) {
  const { orderNo } = params;
  
  if (!orderNo) {
    return NextResponse.json(
      { success: false, message: 'Order number is required' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/orders/query`,
      { orderNo },
      {
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE
        }
      }
    );

    const orderData = response.data?.obj;
    
    if (!orderData) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orderData
    });
  } catch (error) {
    console.error('Error fetching order details:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.errorMsg || 'Failed to fetch order details'
      },
      { status: 500 }
    );
  }
}