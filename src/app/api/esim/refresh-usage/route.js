// app/api/esim/refresh-usage/route.js - Updated implementation
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    // Verify that the order belongs to the user
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

    // Check if the order has eSIM details with ICCID or esimTranNo
    if (!order.esimDetails || (!order.esimDetails.iccid && !order.esimDetails.esimTranNo)) {
      return NextResponse.json({ 
        success: false, 
        error: 'This order does not have valid eSIM details' 
      }, { status: 400 });
    }

    // Extract the data amount from the order's dataAmount field (e.g. "100MB" or "1GB")
    let totalDataInMB = 0;
    
    if (order.dataAmount) {
      // Try to parse GB value first
      const gbMatch = order.dataAmount.match(/(\d+(\.\d+)?)\s*GB/i);
      if (gbMatch && gbMatch[1]) {
        // Convert GB to MB (1 GB = 1024 MB)
        totalDataInMB = parseFloat(gbMatch[1]) * 1024;
      } else {
        // Try to parse MB value
        const mbMatch = order.dataAmount.match(/(\d+(\.\d+)?)\s*MB/i);
        if (mbMatch && mbMatch[1]) {
          totalDataInMB = parseFloat(mbMatch[1]);
        } else {
          // If we can't parse anything, use a default based on typical packages
          totalDataInMB = 100; // Default to 100MB as a fallback
        }
      }
    } else if (order.esimDetails.totalVolume && order.esimDetails.totalVolume < 1000000) {
      // If we already have a reasonable totalVolume value, use it
      totalDataInMB = order.esimDetails.totalVolume;
    } else {
      // Default fallback
      totalDataInMB = 100; // Default to 100MB
    }

    console.log(`Package data amount parsed: ${totalDataInMB}MB from "${order.dataAmount}"`);

    // Make API call to eSIM provider to get the latest usage data and status
    const iccid = order.esimDetails.iccid;
    const esimTranNo = order.esimDetails.esimTranNo;
    let usageData;
    
    try {
      // Try to fetch usage data and status using ICCID first, then fall back to esimTranNo if needed
      usageData = await fetchEsimUsageData(iccid, esimTranNo, totalDataInMB);
    } catch (error) {
      console.error('Error fetching eSIM usage data:', error);
      
      // If API call fails, update with default values
      await Order.findOneAndUpdate(
        { orderId },
        { 
          $set: { 
            'esimDetails.orderUsage': 0,
            'esimDetails.totalVolume': totalDataInMB,
            'esimDetails.lastUpdateTime': new Date().toISOString(),
            updatedAt: new Date()
          } 
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'eSIM usage data has been reset to defaults due to API error',
        data: {
          dataUsage: 0,
          totalData: totalDataInMB,
          lastUpdateTime: new Date().toISOString()
        }
      });
    }

    if (!usageData.success) {
      return NextResponse.json({ 
        success: false, 
        error: usageData.error || 'Failed to fetch usage data from provider' 
      }, { status: 500 });
    }

    // Update order with the usage data and status
    const esimUsage = usageData.data;
    
    // Convert bytes to MB for storage if not already provided as MB
    // 1 MB = 1,048,576 bytes (2^20)
    const dataUsageMB = Math.round(esimUsage.dataUsage / 1048576);
    
    // IMPORTANT: Use the totalVolumeInMB directly from the API response
    // This ensures we get the updated total after top-ups
    const totalVolumeInMB = esimUsage.totalVolumeInMB || Math.round(esimUsage.totalData / 1048576);
    
    // Log the conversion for debugging
    console.log('Data conversion:', {
      rawDataUsageBytes: esimUsage.dataUsage,
      convertedDataUsageMB: dataUsageMB,
      totalDataMB: totalVolumeInMB
    });
    
    // Create the update object with all fields that need to be updated
    const updateFields = { 
      'esimDetails.orderUsage': dataUsageMB,
      'esimDetails.totalVolume': totalVolumeInMB,
      'esimDetails.lastUpdateTime': esimUsage.lastUpdateTime,
      updatedAt: new Date()
    };
    
    // If the provider reports a significantly different total volume after top-up,
    // update the package display information as well
    if (totalVolumeInMB > totalDataInMB * 1.3) { // If 30% more data than original
      const gbValue = (totalVolumeInMB / 1024).toFixed(1);
      // Update the displayed data amount for the package
      updateFields['dataAmount'] = `${gbValue}GB`;
      console.log(`Updating package display data amount to ${gbValue}GB due to detected top-up`);
    }
    
    // Add eSIM status fields if they were included in the API response
    if (esimUsage.smdpStatus) {
      updateFields['esimDetails.smdpStatus'] = esimUsage.smdpStatus;
    }
    
    if (esimUsage.esimStatus) {
      updateFields['esimDetails.esimStatus'] = esimUsage.esimStatus;
    }
    
    if (esimUsage.eid !== undefined && esimUsage.eid !== null) {
      updateFields['esimDetails.eid'] = esimUsage.eid;
    }
    
    // Update activation time if provided and not already set
    if (esimUsage.activateTime && (!order.esimDetails.activateTime || order.esimDetails.activateTime === 'null')) {
      updateFields['esimDetails.activateTime'] = esimUsage.activateTime;
    }
    
    // Update expiration time if provided
    if (esimUsage.expiredTime) {
      updateFields['esimDetails.expiredTime'] = esimUsage.expiredTime;
    }
    
    // Update package list if provided
    if (esimUsage.packageList && esimUsage.packageList.length > 0) {
      updateFields['esimDetails.packageList'] = esimUsage.packageList;
    }
    
    // Perform the database update
    await Order.findOneAndUpdate(
      { orderId },
      { $set: updateFields }
    );

    console.log(`Usage data and status refreshed for order ${orderId}:`, {
      iccid,
      esimTranNo,
      previousUsage: order.esimDetails.orderUsage || 0,
      newUsage: dataUsageMB,
      previousTotalData: order.esimDetails.totalVolume || totalDataInMB,
      newTotalData: totalVolumeInMB,
      lastUpdateTime: esimUsage.lastUpdateTime,
      newSmdpStatus: esimUsage.smdpStatus,
      newEsimStatus: esimUsage.esimStatus,
      expiredTime: esimUsage.expiredTime
    });

    return NextResponse.json({
      success: true,
      message: 'eSIM usage data and status have been refreshed',
      data: {
        dataUsage: dataUsageMB,
        totalData: totalVolumeInMB,
        lastUpdateTime: esimUsage.lastUpdateTime,
        smdpStatus: esimUsage.smdpStatus,
        esimStatus: esimUsage.esimStatus,
        expiredTime: esimUsage.expiredTime,
        dataAmount: updateFields.dataAmount || order.dataAmount
      }
    });
  } catch (error) {
    console.error('Error refreshing eSIM usage:', error.stack);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to refresh eSIM usage data' 
    }, { status: 500 });
  }
}
/**
 * Fetch eSIM usage data from the provider API
 * @param {string} iccid - The eSIM ICCID
 * @param {string} esimTranNo - The eSIM transaction number (fallback)
 * @param {number} totalDataMB - The total data amount in MB
 * @returns {Promise<Object>} - Success status and data or error
 */
async function fetchEsimUsageData(iccid, esimTranNo, totalDataMB) {
  try {
    if (!ESIM_ACCESS_CODE) {
      throw new Error('Missing API access code');
    }

    // First, query the eSIM details using ICCID or esimTranNo
    const esimQuery = await fetch(`${ESIM_API_BASE_URL}/open/esim/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': ESIM_ACCESS_CODE,
      },
      body: JSON.stringify({
        iccid: iccid || "",
        esimTranNo: !iccid && esimTranNo ? esimTranNo : "",
        pager: {
          pageNum: 1,
          pageSize: 20
        }
      }),
    });

    if (!esimQuery.ok) {
      const errorData = await esimQuery.json().catch(() => ({}));
      console.error('eSIM query API error:', errorData);
      return {
        success: false,
        error: errorData.errorMsg || `Failed to query eSIM: ${esimQuery.status}`
      };
    }

    const queryData = await esimQuery.json();
    console.log('eSIM query response:', JSON.stringify(queryData).substring(0, 500) + '...');
    
    if (!queryData.success) {
      return {
        success: false,
        error: queryData.errorMsg || 'Provider API reported an error during eSIM query'
      };
    }

    const esimList = queryData.obj?.esimList || [];
    if (esimList.length === 0) {
      return {
        success: false,
        error: 'No eSIM found with the provided information'
      };
    }

    // Extract relevant data from the eSIM query response
    const esimDetails = esimList[0];
    
    // Update local variables in case we didn't have them before
    iccid = esimDetails.iccid || iccid;
    esimTranNo = esimDetails.esimTranNo || esimTranNo;
    
    // Calculate data usage from provider's response
    const orderUsage = esimDetails.orderUsage || 0;
    
    // IMPORTANT: Take the totalVolume directly from the provider's response
    // This ensures we get the updated value after top-ups
    const totalVolume = esimDetails.totalVolume || (totalDataMB * 1048576);
    
    // Convert provider's total (in bytes) to MB for our system
    const totalVolumeInMB = Math.round(totalVolume / 1048576);
    
    console.log('Provider reported total data volume:', {
      rawTotalVolumeBytes: totalVolume,
      convertedTotalVolumeMB: totalVolumeInMB
    });

    const lastUpdateTime = esimDetails.activateTime || new Date().toISOString();
    const smdpStatus = esimDetails.smdpStatus;
    const esimStatus = esimDetails.esimStatus;
    const eid = esimDetails.eid;
    const activateTime = esimDetails.activateTime;
    const expiredTime = esimDetails.expiredTime;
    
    // Extract package information for better logging
    const packageList = esimDetails.packageList || [];
    console.log(`Found ${packageList.length} packages in the eSIM:`, 
      packageList.map(pkg => ({
        name: pkg.packageName,
        code: pkg.packageCode,
        createTime: pkg.createTime,
        volume: Math.round(pkg.volume / 1048576) + 'MB'
      }))
    );

    console.log('eSIM query results:', {
      esimTranNo,
      iccid,
      smdpStatus,
      esimStatus,
      orderUsage,
      totalVolumeInMB,
      eid: eid ? "Present" : "Not Present",
      packages: packageList.length
    });

    // Try the usage/query endpoint as well to get more accurate usage data
    try {
      // First try with ICCID
      if (iccid) {
        const usageResponse = await fetch(`${ESIM_API_BASE_URL}/open/esim/usage/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'RT-AccessCode': ESIM_ACCESS_CODE,
          },
          body: JSON.stringify({
            iccidList: [iccid]
          }),
        });

        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          console.log('Usage API response (ICCID):', JSON.stringify(usageData).substring(0, 500) + '...');
          
          if (usageData.success && usageData.errorCode === "0") {
            const usageList = usageData.obj?.esimUsageList || [];
            
            if (usageList.length > 0) {
              const usage = usageList[0];
              
              console.log('Usage query successful (ICCID), results:', {
                dataUsage: usage.dataUsage,
                totalData: usage.totalData,
                lastUpdateTime: usage.lastUpdateTime
              });
              
              // Return the usage data along with status info
              // NOTE: We use totalVolumeInMB from the eSIM query which has the updated total
              return {
                success: true,
                data: {
                  esimTranNo: esimTranNo,
                  dataUsage: usage.dataUsage,
                  totalData: totalVolume, // Use bytes from provider API
                  totalVolumeInMB: totalVolumeInMB, // Converted to MB for our database
                  lastUpdateTime: usage.lastUpdateTime,
                  smdpStatus: smdpStatus,
                  esimStatus: esimStatus,
                  eid: eid,
                  activateTime: activateTime,
                  expiredTime: expiredTime,
                  packageList: packageList
                }
              };
            }
          }
        }
      }
      
      // Fall back to esimTranNo if we have it
      if (esimTranNo) {
        const usageResponse = await fetch(`${ESIM_API_BASE_URL}/open/esim/usage/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'RT-AccessCode': ESIM_ACCESS_CODE,
          },
          body: JSON.stringify({
            esimTranNoList: [esimTranNo]
          }),
        });

        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          console.log('Usage API response (esimTranNo):', JSON.stringify(usageData).substring(0, 500) + '...');
          
          if (usageData.success && usageData.errorCode === "0") {
            const usageList = usageData.obj?.esimUsageList || [];
            
            if (usageList.length > 0) {
              const usage = usageList[0];
              
              console.log('Usage query successful (esimTranNo), results:', {
                dataUsage: usage.dataUsage,
                totalData: usage.totalData,
                lastUpdateTime: usage.lastUpdateTime
              });
              
              // Return the usage data along with status info
              return {
                success: true,
                data: {
                  esimTranNo: esimTranNo,
                  dataUsage: usage.dataUsage,
                  totalData: totalVolume, // Use bytes from provider API
                  totalVolumeInMB: totalVolumeInMB, // Converted to MB for our database
                  lastUpdateTime: usage.lastUpdateTime,
                  smdpStatus: smdpStatus,
                  esimStatus: esimStatus,
                  eid: eid,
                  activateTime: activateTime,
                  expiredTime: expiredTime,
                  packageList: packageList
                }
              };
            }
          }
        }
      }
      
      console.log('Usage query did not return data, falling back to query data');
    } catch (usageError) {
      console.error('Error in usage query, falling back to query data:', usageError);
    }

    // If we reach here, we use the data from the eSIM query
    return {
      success: true,
      data: {
        esimTranNo: esimTranNo,
        dataUsage: orderUsage, // Use the orderUsage from the eSIM query
        totalData: totalVolume, // Use bytes from provider API
        totalVolumeInMB: totalVolumeInMB, // Converted to MB for our database
        lastUpdateTime: lastUpdateTime,
        smdpStatus: smdpStatus,
        esimStatus: esimStatus,
        eid: eid,
        activateTime: activateTime,
        expiredTime: expiredTime,
        packageList: packageList
      }
    };
  } catch (error) {
    console.error('Error in fetchEsimUsageData:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch eSIM usage data'
    };
  }
}