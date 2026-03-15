// src/app/api/esim/status/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { esimTranNo, iccid, orderNo } = await request.json();

        if (!esimTranNo && !iccid && !orderNo) {
            return NextResponse.json({ success: false, error: 'Provide esimTranNo, iccid, or orderNo' }, { status: 400 });
        }

        const body = {
            pager: { pageNum: 1, pageSize: 5 },
        };

        // Prefer esimTranNo for single-eSIM accuracy (iccids are reused per API docs)
        if (esimTranNo) body.esimTranNo = esimTranNo;
        else if (iccid) body.iccid = iccid;
        else if (orderNo) body.orderNo = orderNo;

        const response = await fetch(`${ESIM_API_BASE_URL}/open/esim/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RT-AccessCode': process.env.ESIM_ACCESS_CODE,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`eSIM API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.obj?.esimList?.length) {
            return NextResponse.json({ success: false, error: data.errorMsg || 'No eSIM found' });
        }

        const esim = data.obj.esimList[0];

        return NextResponse.json({
            success: true,
            esim: {
                esimStatus: esim.esimStatus,
                smdpStatus: esim.smdpStatus,
                totalVolume: esim.totalVolume,
                orderUsage: esim.orderUsage,
                expiredTime: esim.expiredTime,
                iccid: esim.iccid,
                esimTranNo: esim.esimTranNo,
            },
        });
    } catch (error) {
        console.error('eSIM status error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}