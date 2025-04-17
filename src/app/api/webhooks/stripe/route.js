import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendESIMEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    await dbConnect();
    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`Payment succeeded: ${paymentIntent.id}`);
        await handleSuccessfulPayment(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        console.log(`Payment failed: ${failedPaymentIntent.id}`);
        await handleFailedPayment(failedPaymentIntent);
        break;
      case 'charge.succeeded':
        const charge = event.data.object;
        console.log(`Charge succeeded: ${charge.id}`);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log(`Payment method attached: ${paymentMethod.id}`);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(paymentIntent) {
  const { orderId } = paymentIntent.metadata;
  if (!orderId) {
    console.error('No order ID found in payment intent metadata', { paymentIntentId: paymentIntent.id });
    return;
  }

  console.log(`Processing successful payment for order: ${orderId}`);

  try {
    await dbConnect();

    const order = await Order.findOne({ orderId });
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return;
    }

    const user = await User.findById(order.userId);
    if (!user) {
      console.error(`User not found for order: ${orderId}`);
      return;
    }

    // Update order to reflect payment
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentStatus: 'completed',
          orderStatus: 'processing',
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated order ${orderId} to paymentStatus: completed, orderStatus: processing`);

    // Call eSIM API
    console.log(`Ordering eSIM for order: ${orderId}`);
    const esimDetails = await orderESIM(order, orderId);

    if (esimDetails.status === 'error') {
      let failureReason = esimDetails.errorMessage || 'Failed to order eSIM';
      if (esimDetails.errorMessage?.includes('insufficient balance')) {
        failureReason = 'The admin has insufficient balance, please contact us.';
        try {
          await stripe.refunds.create({
            payment_intent: paymentIntent.id,
          });
          console.log(`Refund issued for order: ${orderId}`);
          await Order.findOneAndUpdate(
            { orderId },
            {
              $set: {
                orderStatus: 'failed',
                paymentStatus: 'refunded',
                failureReason,
                updatedAt: new Date(),
              },
            }
          );
        } catch (refundError) {
          console.error(`Failed to issue refund for order ${orderId}:`, refundError);
          failureReason += `; Refund failed: ${refundError.message}`;
          await Order.findOneAndUpdate(
            { orderId },
            {
              $set: {
                orderStatus: 'failed',
                paymentStatus: 'completed',
                failureReason,
                updatedAt: new Date(),
              },
            }
          );
        }
      } else {
        await Order.findOneAndUpdate(
          { orderId },
          {
            $set: {
              orderStatus: 'failed',
              paymentStatus: 'completed',
              failureReason,
              updatedAt: new Date(),
            },
          }
        );
      }
      console.error(`Order failed: ${orderId}, reason: ${failureReason}`);
      return;
    }

    // Update order with eSIM details
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          orderStatus: esimDetails.qrCodeUrl ? 'completed' : 'processing',
          esimDetails,
          completedAt: esimDetails.qrCodeUrl ? new Date() : null,
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated order ${orderId} with esimDetails`, {
      qrCodeUrl: esimDetails.qrCodeUrl,
      orderNo: esimDetails.orderNo,
      iccid: esimDetails.iccid,
    });

    await sendESIMEmail(user.email, {
      orderId,
      packageName: order.packageName,
      location: order.location,
      dataAmount: order.dataAmount,
      duration: order.duration,
      qrCode: esimDetails.qrCodeUrl || '',
      installationInstructions: esimDetails.instructions || '',
    });

    console.log(`Confirmation email sent to: ${user.email}`);
  } catch (error) {
    console.error(`Error processing order ${orderId}:`, error);
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          orderStatus: 'failed',
          paymentStatus: 'completed',
          failureReason: error.message || 'Failed to process eSIM order',
          updatedAt: new Date(),
        },
      }
    );
  }
}

async function handleFailedPayment(paymentIntent) {
  const { orderId } = paymentIntent.metadata;
  if (!orderId) {
    console.error('No order ID found in payment intent metadata');
    return;
  }

  console.log(`Processing failed payment for order: ${orderId}`);

  try {
    await Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          paymentStatus: 'failed',
          orderStatus: 'failed',
          paymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Order ${orderId} marked as failed`);
  } catch (error) {
    console.error(`Error processing failed payment for order ${orderId}:`, error);
  }
}

async function orderESIM(order, txnId) {
  try {
    if (!process.env.ESIM_ACCESS_CODE || !process.env.ESIM_API_BASE_URL) {
      throw new Error('Missing eSIM API configuration');
    }

    const orderRequest = {
      transactionId: txnId,
      amount: order.finalPrice,
      packageInfoList: [
        {
          packageCode: order.packageCode,
          count: 1,
          price: order.finalPrice,
        },
      ],
    };

    console.log('eSIM API order request:', { txnId, packageCode: order.packageCode, amount: order.finalPrice });
    const orderResponse = await fetch(`${process.env.ESIM_API_BASE_URL}/open/esim/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RT-AccessCode': process.env.ESIM_ACCESS_CODE,
      },
      body: JSON.stringify(orderRequest),
    });

    const orderData = await orderResponse.json();
    console.log('eSIM API order response:', orderData);

    if (!orderResponse.ok || !orderData.success) {
      if (orderData.errorCode === '200007') {
        return {
          status: 'error',
          errorMessage: 'the balance is insufficient',
        };
      }
      throw new Error(orderData.errorMsg || `Failed to order eSIM: ${orderResponse.status}`);
    }

    if (!orderData.obj || !orderData.obj.orderNo) {
      throw new Error('Invalid eSIM order response: missing orderNo');
    }

    const { orderNo } = orderData.obj;
    console.log(`Order placed, orderNo: ${orderNo}`);

    let esimDetails = {
      orderNo,
      transactionId: txnId,
      esimStatus: 'PAYING',
      packageList: [],
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Querying eSIM profiles, attempt ${attempt}/3 for orderNo: ${orderNo}`);
        const queryResponse = await fetch(`${process.env.ESIM_API_BASE_URL}/open/esim/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'RT-AccessCode': process.env.ESIM_ACCESS_CODE,
          },
          body: JSON.stringify({
            orderNo,
            iccid: '',
            pager: { pageNum: 1, pageSize: 20 },
          }),
        });

        const queryData = await queryResponse.json();
        console.log(`eSIM query response (attempt ${attempt}):`, queryData);

        if (queryData.success && queryData.obj?.esimList?.length > 0) {
          const esimData = queryData.obj.esimList[0];
          esimDetails = {
            esimTranNo: esimData.esimTranNo || '',
            orderNo: esimData.orderNo || orderNo,
            transactionId: esimData.transactionId || txnId,
            imsi: esimData.imsi || '',
            iccid: esimData.iccid || '',
            smsStatus: esimData.smsStatus || 0,
            msisdn: esimData.msisdn || '',
            ac: esimData.ac || '',
            qrCodeUrl: esimData.qrCodeUrl || '',
            shortUrl: esimData.shortUrl || '',
            smdpStatus: esimData.smdpStatus || '',
            eid: esimData.eid || '',
            activeType: esimData.activeType || 1,
            dataType: esimData.dataType || 1,
            activateTime: esimData.activateTime || null,
            expiredTime: esimData.expiredTime || '',
            totalVolume: esimData.totalVolume || 0,
            totalDuration: esimData.totalDuration || 0,
            durationUnit: esimData.durationUnit || '',
            orderUsage: esimData.orderUsage || 0,
            pin: esimData.pin || '',
            puk: esimData.puk || '',
            apn: esimData.apn || '',
            esimStatus: esimData.esimStatus || 'GOT_RESOURCE',
            packageList: esimData.packageList?.length
              ? esimData.packageList
              : [
                  {
                    packageName: order.packageName || '',
                    packageCode: order.packageCode || '',
                    slug: esimData.packageList?.[0]?.slug || '',
                    duration: order.duration || esimData.totalDuration || 0,
                    volume: esimData.totalVolume || 0,
                    locationCode: order.location || '',
                    createTime: new Date().toISOString(),
                  },
                ],
            instructions: generateInstructions(esimData),
          };
          console.log(`eSIM profile found for orderNo: ${orderNo}`, {
            qrCodeUrl: esimDetails.qrCodeUrl,
            iccid: esimDetails.iccid,
          });
          break;
        } else if (queryData.errorCode === '200010') {
          console.log(`Profiles not ready for orderNo: ${orderNo}, attempt ${attempt}`);
        } else {
          console.warn(`No profiles found for orderNo: ${orderNo}, attempt ${attempt}`);
        }
      } catch (queryError) {
        console.warn(`eSIM query attempt ${attempt} failed for orderNo: ${orderNo}:`, queryError.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Always save esimDetails, even if incomplete
    await Order.findOneAndUpdate(
      { orderId: order.orderId },
      {
        $set: {
          esimDetails,
          orderStatus: esimDetails.qrCodeUrl ? 'completed' : 'processing',
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Stored esimDetails for order: ${txnId}`, esimDetails);

    return esimDetails;
  } catch (error) {
    console.error(`Error ordering eSIM for order: ${txnId}:`, error);
    return {
      status: 'error',
      errorMessage: error.message || 'Failed to order eSIM',
    };
  }
}


function generateInstructions(esimData) {
  const apn = esimData.apn || 'Default APN';
  return `
# eSIM Installation Instructions
## Scan QR Code
1. Go to your phone settings
2. Navigate to Mobile Data or Cellular
3. Select Add Data Plan or Add eSIM
4. Scan the QR code provided
5. Follow on-screen instructions to activate
## Manual Installation
- Activation Code: ${esimData.ac || 'Not provided'}
- APN: ${apn}
## Important Information
- Valid for: ${esimData.totalDuration || ''} ${esimData.durationUnit || 'DAYS'}
- Data: ${esimData.totalVolume ? (esimData.totalVolume / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'N/A'}
- Expiry: ${esimData.expiredTime ? new Date(esimData.expiredTime).toLocaleDateString() : 'N/A'}
Contact support if you need assistance.
  `;
}