// app/api/esim/check-status/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

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

    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const esimTranNo = searchParams.get('esimTranNo');
    const iccid = searchParams.get('iccid');
    
    if (!esimTranNo && !iccid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either esimTranNo or iccid is required' 
      }, { status: 400 });
    }

    // Query the eSIM status
    const esimStatus = await queryEsimStatus(esimTranNo, iccid);
    
    if (!esimStatus.success) {
      return NextResponse.json({ 
        success: false, 
        error: esimStatus.error || 'Failed to query eSIM status' 
      }, { status: 500 });
    }

    // Process the eSIM status data
    const { esimDetails, canTopUp } = processEsimStatus(esimStatus.data);

    return NextResponse.json({
      success: true,
      esimDetails,
      canTopUp,
      supportedActions: determineAvailableActions(esimDetails)
    });
  } catch (error) {
    console.error('Error checking eSIM status:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to check eSIM status' 
    }, { status: 500 });
  }
}

/**
 * Query the eSIM status from the provider API
 * @param {string} esimTranNo - The eSIM transaction number
 * @param {string} iccid - The eSIM ICCID
 * @returns {Promise<Object>} - Success status and data or error
 */
async function queryEsimStatus(esimTranNo, iccid) {
  try {
    if (!ESIM_ACCESS_CODE) {
      throw new Error('Missing API access code');
    }

    // Create the request body
    const requestBody = {
      pager: {
        pageNum: 1,
        pageSize: 20
      }
    };

    // Add either esimTranNo or iccid
    if (esimTranNo) {
      requestBody.esimTranNo = esimTranNo;
    } else if (iccid) {
      requestBody.iccid = iccid;
    }

    // Log the request for debugging
    console.log('Querying eSIM status with:', requestBody);

    const response = await fetch(`${ESIM_API_BASE_URL}/open/esim/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('eSIM query API error:', errorData);
      return {
        success: false,
        error: errorData.errorMsg || `Failed to query eSIM: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        error: data.errorMsg || 'Provider API reported an error'
      };
    }

    // Check if we have eSIM data in the response
    const esimList = data.obj?.esimList || [];
    if (esimList.length === 0) {
      return {
        success: false,
        error: 'No eSIM found with the provided information'
      };
    }

    // Return the first eSIM in the list
    return {
      success: true,
      data: esimList[0]
    };
  } catch (error) {
    console.error('Error in queryEsimStatus:', error);
    return {
      success: false,
      error: error.message || 'Failed to query eSIM status'
    };
  }
}

/**
 * Process the eSIM status data
 * @param {Object} esimData - The eSIM data from the provider API
 * @returns {Object} - Processed eSIM details and whether it can be topped up
 */
function processEsimStatus(esimData) {
  // Extract key status information
  const esimDetails = {
    esimTranNo: esimData.esimTranNo,
    orderNo: esimData.orderNo,
    iccid: esimData.iccid,
    smdpStatus: esimData.smdpStatus,
    esimStatus: esimData.esimStatus,
    activateTime: esimData.activateTime,
    expiredTime: esimData.expiredTime,
    totalVolume: esimData.totalVolume,
    totalDuration: esimData.totalDuration,
    durationUnit: esimData.durationUnit,
    orderUsage: esimData.orderUsage,
    eid: esimData.eid || '',
    supportTopUpType: esimData.supportTopUpType || 0
  };

  // Determine if the eSIM can be topped up
  // Based on the error "the order's status doesn't support the action", we need to check:
  // 1. supportTopUpType > 0 (indicates TopUp is supported)
  // 2. esimStatus is IN_USE or similar active state
  // 3. smdpStatus is ENABLED (indicating the eSIM is in use)
  const canTopUp = 
    (esimData.supportTopUpType > 0) && 
    (esimData.esimStatus === 'IN_USE' || esimData.esimStatus === 'GOT_RESOURCE') &&
    (esimData.smdpStatus === 'ENABLED' || esimData.smdpStatus === 'RELEASED');

  return {
    esimDetails,
    canTopUp
  };
}

/**
 * Determine available actions for the eSIM
 * @param {Object} esimDetails - The processed eSIM details
 * @returns {Object} - Available actions for the eSIM
 */
function determineAvailableActions(esimDetails) {
  const actions = {
    canTopUp: false,
    canActivate: false,
    canRefreshUsage: false,
    isExpired: false,
    needsActivation: false
  };

  // Check if expired
  const now = new Date();
  const expireDate = esimDetails.expiredTime ? new Date(esimDetails.expiredTime) : null;
  if (expireDate && now > expireDate) {
    actions.isExpired = true;
    return actions; // No actions possible for expired eSIMs
  }

  // Check if needs activation
  if (!esimDetails.activateTime && esimDetails.esimStatus === 'GOT_RESOURCE' && 
      esimDetails.smdpStatus === 'RELEASED') {
    actions.needsActivation = true;
    actions.canActivate = true;
    return actions; // Only activation is possible
  }

  // Check if can refresh usage
  if (esimDetails.activateTime || esimDetails.eid || 
      esimDetails.smdpStatus === 'ENABLED' || esimDetails.esimStatus === 'IN_USE') {
    actions.canRefreshUsage = true;
  }

  // Check if can top up
  // This is a more detailed check based on provider documentation
  if (esimDetails.supportTopUpType > 0) {
    // TopUp type 1: Only can top up when in use
    if (esimDetails.supportTopUpType === 1) {
      actions.canTopUp = esimDetails.esimStatus === 'IN_USE';
    } 
    // TopUp type 2: Can top up when resource is obtained or in use
    else if (esimDetails.supportTopUpType === 2) {
      actions.canTopUp = esimDetails.esimStatus === 'IN_USE' || 
                         esimDetails.esimStatus === 'GOT_RESOURCE';
    }
  }

  return actions;
}