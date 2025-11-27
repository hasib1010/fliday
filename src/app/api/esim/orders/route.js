// app/api/esim/orders/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_SECRET_KEY = process.env.ESIM_SECRET_KEY;
const API_BASE_URL = process.env.ESIM_API_BASE_URL;

// Create a new order
export async function POST(request) {
  try {
    const body = await request.json();
    const { packageCode, email, customerReference } = body;
    if (!ESIM_ACCESS_CODE || !ESIM_SECRET_KEY || !API_BASE_URL) {
      return NextResponse.json(
        { success: false, message: 'eSIMaccess API credentials are not configured' },
        { status: 500 }
      );
    }
      
    if (!packageCode) {
      return NextResponse.json(
        { success: false, message: 'Package code is required' },
        { status: 400 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Prepare the request payload
    const payload = {
      packageCode,
      email
    };
    
    if (customerReference) {
      payload.customerRef = customerReference;
    }

    const response = await axios.post(
      `${API_BASE_URL}/orders/create`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE
        }
      }
    );

    const orderData = response.data?.obj;
    
    if (!orderData) {
      throw new Error('Invalid response from ESIMaccess API');
    }

    return NextResponse.json({
      success: true,
      data: orderData
    });
  } catch (error) {
    console.error('Error creating order:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.errorMsg || 'Failed to create order'
      },
      { status: 500 }
    );
  }
}

// List all orders
export async function GET(request) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Prepare the request payload
    const payload = {
      page,
      limit
    };
    
    if (startDate) {
      payload.startDate = startDate;
    }
    
    if (endDate) {
      payload.endDate = endDate;
    }

    const response = await axios.post(
      `${API_BASE_URL}/orders/list`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE
        }
      }
    );

    const orders = response.data?.obj?.orders || [];
    const totalCount = response.data?.obj?.totalCount || 0;

    return NextResponse.json({
      success: true,
      data: {
        orders,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.errorMsg || 'Failed to fetch orders'
      },
      { status: 500 }
    );
  }
}