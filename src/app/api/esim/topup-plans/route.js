// app/api/esim/topup-plans/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DEFAULT_MARKUP = 10000; // $1.00 markup in cents

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const iccid = searchParams.get('iccid');
    const locationCode = searchParams.get('location')?.substring(0, 2)?.toUpperCase() || '';
    const orderId = searchParams.get('orderId');

    if (!iccid) {
      return NextResponse.json({ 
        success: false, 
        error: 'ICCID is required' 
      }, { status: 400 });
    }

    await dbConnect();

    // Find the user based on the session
    const user = await User.findOne({
      $or: [
        { _id: session.user.id },
        { email: session.user.email }
      ]
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // If orderId is provided, verify it belongs to the user
    if (orderId) {
      const order = await Order.findOne({ 
        orderId,
        userId: user._id
      });

      if (!order) {
        return NextResponse.json({ 
          success: false, 
          error: 'Order not found' 
        }, { status: 404 });
      }

      // Verify the ICCID matches the order
      if (order.esimDetails?.iccid !== iccid) {
        return NextResponse.json({ 
          success: false, 
          error: 'ICCID does not match the order' 
        }, { status: 400 });
      }
    }

    // Make API call to eSIM provider to get topup plans
    const topupPlans = await fetchTopupPlans(iccid, locationCode);

    if (!topupPlans.success) {
      return NextResponse.json({ 
        success: false, 
        error: topupPlans.error || 'Failed to fetch topup plans' 
      }, { status: 500 });
    }

    // Format the plans for frontend consumption with markup
    const formattedPlans = topupPlans.data.map(plan => {
      const originalPrice = plan.price; // Provider's price
      const finalPrice = originalPrice + DEFAULT_MARKUP; // Add $1 markup
      
      return {
        id: plan.packageCode,
        packageCode: plan.packageCode,
        name: plan.name,
        price: originalPrice, // Provider's price (without markup)
        finalPrice: finalPrice, // Price with markup (what customer pays)
        currency: plan.currencyCode || 'USD',
        dataAmount: plan.volume ? `${(plan.volume / 1073741824).toFixed(1)}GB` : 'N/A', // Convert bytes to GB
        duration: plan.duration ? `${plan.duration} ${plan.durationUnit || 'Days'}` : 'N/A',
        description: plan.description || '',
        location: plan.location || locationCode,
        activeType: plan.activeType || 1
      };
    });

    return NextResponse.json({
      success: true,
      plans: formattedPlans
    });
  } catch (error) {
    console.error('Error fetching topup plans:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch topup plans' 
    }, { status: 500 });
  }
}

/**
 * Fetch TopUp plans from the provider API
 * @param {string} iccid - The eSIM ICCID
 * @param {string} locationCode - The location code (optional)
 * @returns {Promise<Object>} - Success status and data or error
 */
async function fetchTopupPlans(iccid, locationCode = '') {
  try {
    if (!ESIM_ACCESS_CODE) {
      throw new Error('Missing API access code');
    }

    // Create request body
    const requestBody = {
      type: 'TOPUP',
      iccid: iccid,
    };

    // Add location code if provided
    if (locationCode) {
      requestBody.locationCode = locationCode;
    }

    console.log('Requesting topup plans with:', requestBody);

    const response = await fetch(`${ESIM_API_BASE_URL}/open/package/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TopUp plans API error:', errorData);
      return {
        success: false,
        error: errorData.errorMsg || `Failed to fetch topup plans: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: data.errorMsg || 'Provider API reported an error'
      };
    }

    // Extract the package list
    const packageList = data.obj?.packageList || [];
    
    if (packageList.length === 0) {
      return {
        success: false,
        error: 'No topup plans available for this eSIM'
      };
    }

    // Return the package list
    return {
      success: true,
      data: packageList
    };
  } catch (error) {
    console.error('Error in fetchTopupPlans:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch topup plans'
    };
  }
}