// app/api/payment/webhook/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import { sendEmail } from '@/lib/email-config'; // Use your working email config

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;

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
  const { orderId, type } = paymentIntent.metadata;
  if (!orderId) {
    console.error('No order ID found in payment intent metadata', { paymentIntentId: paymentIntent.id });
    return;
  }

  console.log(`Processing successful payment for ${type || 'order'}: ${orderId}`);

  try {
    await dbConnect();

    if (type === 'topup') {
      console.log(`Payment for TopUp ${orderId} already processed via API`);
      return;
    }
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
      qrCodeUrl: esimDetails.qrCodeUrl ? 'Present' : 'Missing',
      orderNo: esimDetails.orderNo,
      iccid: esimDetails.iccid,
    });

    // Fetch the updated order to ensure we have latest details
    const updatedOrder = await Order.findOne({ orderId });
    
    // Check if we have a QR code before sending the email
    if (updatedOrder.esimDetails && updatedOrder.esimDetails.qrCodeUrl) {
      // Format the HTML email body - similar to your resend-esim template
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #F15A25;">Your eSIM for ${updatedOrder.location}</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Thank you for your purchase. Your eSIM for <strong>${updatedOrder.location}</strong> is ready to use.
          </p>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #444; font-size: 18px; margin-top: 0;">Order Details</h2>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${updatedOrder.orderId}</p>
            <p style="margin: 5px 0;"><strong>Package:</strong> ${updatedOrder.packageName}</p>
            <p style="margin: 5px 0;"><strong>Data:</strong> ${updatedOrder.dataAmount}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${updatedOrder.duration}</p>
            <p style="margin: 5px 0;"><strong>ICCID:</strong> ${updatedOrder.esimDetails.iccid || 'N/A'}</p>
            ${updatedOrder.esimDetails.imsi ? `<p style="margin: 5px 0;"><strong>IMSI:</strong> ${updatedOrder.esimDetails.imsi}</p>` : ''}
            ${updatedOrder.esimDetails.apn ? `<p style="margin: 5px 0;"><strong>APN:</strong> ${updatedOrder.esimDetails.apn}</p>` : ''}
            ${updatedOrder.esimDetails.pin ? `<p style="margin: 5px 0;"><strong>PIN:</strong> ${updatedOrder.esimDetails.pin}</p>` : ''}
            ${updatedOrder.esimDetails.puk ? `<p style="margin: 5px 0;"><strong>PUK:</strong> ${updatedOrder.esimDetails.puk}</p>` : ''}
            ${updatedOrder.esimDetails.totalVolume ? `<p style="margin: 5px 0;"><strong>Data Allowance:</strong> ${(updatedOrder.esimDetails.totalVolume / 1024 / 1024 / 1024).toFixed(2)} GB</p>` : ''}
            ${updatedOrder.esimDetails.expiredTime ? `<p style="margin: 5px 0;"><strong>Expiry Date:</strong> ${new Date(updatedOrder.esimDetails.expiredTime).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #444; font-size: 18px;">Your eSIM QR Code</h2>
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Scan this QR code with your phone to install your eSIM</p>
            <img src="${updatedOrder.esimDetails.qrCodeUrl}" alt="eSIM QR Code" style="max-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
            ${updatedOrder.esimDetails.shortUrl ? `<p style="margin-top: 10px;"><a href="${updatedOrder.esimDetails.shortUrl}" style="color: #F15A25;">${updatedOrder.esimDetails.shortUrl}</a></p>` : ''}
          </div>
          
          <div style="background-color: #f7f7f7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h2 style="color: #444; font-size: 18px; margin-top: 0;">Installation Instructions</h2>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Go to your phone settings</li>
              <li style="margin-bottom: 8px;">Navigate to Mobile Data or Cellular</li>
              <li style="margin-bottom: 8px;">Select Add Data Plan or Add eSIM</li>
              <li style="margin-bottom: 8px;">Scan the QR code provided</li>
              <li style="margin-bottom: 8px;">Follow on-screen instructions to activate</li>
            </ol>
            ${updatedOrder.esimDetails.ac ? `<p style="margin-top: 15px;"><strong>Manual Activation Code:</strong> ${updatedOrder.esimDetails.ac}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="font-size: 14px; color: #888; line-height: 1.5;">
              If you need any assistance, please contact our support team at
              <a href="mailto:support@esim.com" style="color: #F15A25; text-decoration: none;">support@esim.com</a>
            </p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
              <p>© ${new Date().getFullYear()} eSIM Services. All rights reserved.</p>
            </div>
          </div>
        </div>
      `;

      try {
        console.log(`Attempting to send eSIM email to ${user.email}`);
        
        // Send the email using your working email configuration
        const emailSent = await sendEmail({
          to: user.email,
          subject: `Your eSIM for ${updatedOrder.location} - Order #${updatedOrder.orderId}`,
          html: htmlBody,
          attachments: [
            {
              filename: `esim-${updatedOrder.orderId}.png`,
              path: updatedOrder.esimDetails.qrCodeUrl,
              cid: 'esim-qrcode' // Content ID for embedding in HTML
            }
          ]
        });

        if (emailSent) {
          console.log(`eSIM email successfully sent to ${user.email}`);
        } else {
          console.error(`Failed to send eSIM email to ${user.email}`);
        }
      } catch (emailError) {
        console.error(`Error sending eSIM email for order ${orderId}:`, emailError);
      }
    } else {
      console.warn(`Order ${orderId} doesn't have QR code yet, skipping email`);
    }
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
    
    // IMPORTANT: Use originalPrice (provider's price without markup) for the API call
    const apiAmount = order.originalPrice; // Price without markup

    const orderRequest = {
      transactionId: txnId,
      amount: apiAmount,
      packageInfoList: [
        {
          packageCode: order.packageCode,
          count: 1,
          price: apiAmount
        },
      ],
    };

    console.log('eSIM API order request:', {
      txnId,
      packageCode: order.packageCode,
      amount: apiAmount,
      customerPrice: order.finalPrice,
      markup: order.markupAmount || (order.finalPrice - order.originalPrice)
    });

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

    // Query for eSIM profiles - make multiple attempts
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
            qrCodeUrl: esimDetails.qrCodeUrl ? 'Present' : 'Missing',
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