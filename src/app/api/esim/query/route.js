import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request) {
  try {
    const { orderId, orderNo: providedOrderNo } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderNo = providedOrderNo || order.esimDetails?.orderNo || '';
    if (!orderNo) {
      console.error(`No orderNo found for orderId: ${orderId}`);
      return NextResponse.json(
        { error: 'Order number missing in order data' },
        { status: 400 }
      );
    }

    const queryPayload = {
      orderNo,
      iccid: '',
      pager: {
        pageNum: 1,
        pageSize: 20,
      },
    };

    console.log('Querying eSIM Access API with:', queryPayload);
    const response = await fetch(`${process.env.ESIM_API_BASE_URL}/open/esim/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': process.env.ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(queryPayload),
    });

    const data = await response.json();
    console.log('eSIM Access API response:', data);

    if (!response.ok || !data.success) {
      console.error(`eSIM query failed for orderNo: ${orderNo}`, data);
      return NextResponse.json(
        {
          error: data.errorMsg || 'Failed to query eSIM profile',
          errorCode: data.errorCode || 'unknown',
        },
        { status: 400 }
      );
    }

    if (!data.obj?.esimList?.length) {
      console.warn(`No eSIM profiles found for orderNo: ${orderNo}`);
      return NextResponse.json(
        { error: 'No eSIM profiles found for this order', errorCode: '200010' },
        { status: 400 }
      );
    }

    const esimProfile = data.obj.esimList[0];
    const esimDetails = {
      esimTranNo: esimProfile.esimTranNo || '',
      orderNo: esimProfile.orderNo || orderNo,
      transactionId: esimProfile.transactionId || order.transactionId || '',
      imsi: esimProfile.imsi || '',
      iccid: esimProfile.iccid || '',
      smsStatus: esimProfile.smsStatus || 0,
      msisdn: esimProfile.msisdn || '',
      ac: esimProfile.ac || '',
      qrCodeUrl: esimProfile.qrCodeUrl || '',
      shortUrl: esimProfile.shortUrl || '',
      smdpStatus: esimProfile.smdpStatus || '',
      eid: esimProfile.eid || '',
      activeType: esimProfile.activeType || 1,
      dataType: esimProfile.dataType || 1,
      activateTime: esimProfile.activateTime || null,
      expiredTime: esimProfile.expiredTime || '',
      totalVolume: esimProfile.totalVolume || 0,
      totalDuration: esimProfile.totalDuration || 0,
      durationUnit: esimProfile.durationUnit || '',
      orderUsage: esimProfile.orderUsage || 0,
      pin: esimProfile.pin || '',
      puk: esimProfile.puk || '',
      apn: esimProfile.apn || '',
      esimStatus: esimProfile.esimStatus || '',
      packageList: esimProfile.packageList?.length
        ? esimProfile.packageList
        : [
            {
              packageName: order.packageName || '',
              packageCode: order.packageCode || '',
              slug: esimProfile.packageList?.[0]?.slug || '',
              duration: order.duration || esimProfile.totalDuration || 0,
              volume: esimProfile.totalVolume || 0,
              locationCode: order.location || '',
              createTime: new Date().toISOString(),
            },
          ],
    };

    // Update order in MongoDB
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          esimDetails,
          orderStatus: esimProfile.qrCodeUrl ? 'completed' : order.orderStatus,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`Updated order with eSIM details for orderId: ${orderId}`, esimDetails);

    return NextResponse.json({
      success: true,
      esimDetails,
    });
  } catch (error) {
    console.error(`eSIM query error for orderId: ${orderId}:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to query eSIM profile', errorCode: '500' },
      { status: 500 }
    );
  }
}