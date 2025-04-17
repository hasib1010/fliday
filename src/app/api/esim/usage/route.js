// app/api/esim/usage/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE || 'f8b5************335e';
const API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

export async function POST(request) {
  try {
    const body = await request.json();
    const { esimTranNoList } = body;
    
    if (!esimTranNoList || !Array.isArray(esimTranNoList) || esimTranNoList.length === 0) {
      return NextResponse.json(
        { success: false, message: 'eSIM transaction numbers are required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${API_BASE_URL}/open/esim/usage/query`,
      { esimTranNoList },
      {
        headers: {
          'Content-Type': 'application/json',
          'RT-AccessCode': ESIM_ACCESS_CODE
        }
      }
    );

    const usageData = response.data?.obj?.esimUsageList || [];
    
    // Process usage data for each eSIM
    const formattedUsageData = usageData.map(item => {
      const totalBytes = item.totalData;
      const usedBytes = item.dataUsage;
      const remainingBytes = totalBytes - usedBytes;
      const percentageUsed = (usedBytes / totalBytes) * 100;
      
      return {
        esimTranNo: item.esimTranNo,
        dataUsage: usedBytes,
        totalData: totalBytes,
        remainingData: remainingBytes,
        percentageUsed: Math.min(100, Math.round(percentageUsed)),
        lastUpdateTime: item.lastUpdateTime,
        formattedUsage: formatDataSize(usedBytes),
        formattedTotal: formatDataSize(totalBytes),
        formattedRemaining: formatDataSize(remainingBytes)
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedUsageData
    });
  } catch (error) {
    console.error('Error fetching usage data:', error.response?.data || error.message);
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.errorMsg || 'Failed to fetch usage data'
      },
      { status: 500 }
    );
  }
}

// Helper function to format data size
function formatDataSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
}