// app/api/esim/topup/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';
import TopUp from '@/models/TopUp';

// Configuration
const ESIM_ACCESS_CODE = process.env.ESIM_ACCESS_CODE;
const ESIM_API_BASE_URL = process.env.ESIM_API_BASE_URL || 'https://api.esimaccess.com/api/v1';
const DEFAULT_MARKUP = 10000; // $1.00 markup in cents

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

        const body = await request.json();
        const {
            orderId,
            iccid,
            packageCode,
            esimTranNo,
            price, // This should be the provider's price
            currency = 'USD',
            paymentMethod,
            packageName,
            dataAmount,
            duration,
            location
        } = body;

        // Validate required fields
        if (!orderId || !iccid || !packageCode || !paymentMethod) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields for top-up'
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

        // Verify the original order exists and belongs to the user
        const order = await Order.findOne({
            orderId,
            userId: user._id
        });

        if (!order) {
            return NextResponse.json({
                success: false,
                error: 'Original order not found'
            }, { status: 404 });
        }

        // Verify the ICCID matches the order
        if (order.esimDetails?.iccid !== iccid) {
            return NextResponse.json({
                success: false,
                error: 'ICCID does not match the order'
            }, { status: 400 });
        }

        // Generate a new ID for the top-up transaction
        const topUpId = uuidv4();
        const transactionId = uuidv4();

        // Calculate markup and final price
        const markupAmount = DEFAULT_MARKUP; // $1.00 markup
        const finalPrice = price + markupAmount; // Price customer will pay

        // Create a new top-up record
        const topUpData = {
            topUpId,
            orderId,
            userId: user._id,
            packageCode,
            packageName: packageName || `Top-up for ${order.packageName}`,
            originalPrice: price, // Provider's price without markup
            markupAmount, // $1.00 markup
            finalPrice, // Price with markup (what customer pays)
            currency,
            dataAmount: dataAmount || 'Unknown',
            duration: duration || 'Unknown',
            location: location || order.location,
            paymentMethod,
            transactionId,
            iccid,
            esimTranNo: esimTranNo || order.esimDetails?.esimTranNo,
            paymentStatus: 'pending',
            topUpStatus: 'pending',
            createdAt: new Date()
        };

        // Save to database
        const topUp = await TopUp.create(topUpData);

        return NextResponse.json({
            success: true,
            topUpId,
            transactionId,
            message: 'Top-up purchase initiated',
            redirect: `/checkout/topup?topUpId=${topUpId}`
        });
    } catch (error) {
        console.error('Error processing top-up purchase:', error.stack);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to process top-up purchase'
        }, { status: 500 });
    }
}

// Endpoint to execute the actual top-up after payment
export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const body = await request.json();
        const { topUpId, paymentIntentId } = body;

        if (!topUpId) {
            return NextResponse.json({
                success: false,
                error: 'Top-up ID is required'
            }, { status: 400 });
        }

        await dbConnect();

        // Find the top-up record
        const topUp = await TopUp.findOne({ topUpId });

        if (!topUp) {
            return NextResponse.json({
                success: false,
                error: 'Top-up record not found'
            }, { status: 404 });
        }

        // Log the topUp details for debugging
        console.log('Processing TopUp:', {
            topUpId: topUp.topUpId,
            orderId: topUp.orderId,
            packageCode: topUp.packageCode,
            esimTranNo: topUp.esimTranNo,
            iccid: topUp.iccid,
            originalPrice: topUp.originalPrice,
            markupAmount: topUp.markupAmount,
            finalPrice: topUp.finalPrice
        });

        // Verify user owns this top-up
        if (topUp.userId.toString() !== session.user.id) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized access to this top-up'
            }, { status: 403 });
        }

        // If already completed, return success
        if (topUp.topUpStatus === 'completed') {
            return NextResponse.json({
                success: true,
                message: 'Top-up already completed',
                topUp
            });
        }

        // Update payment information
        if (paymentIntentId) {
            topUp.paymentIntentId = paymentIntentId;
            topUp.paymentStatus = 'completed';
            await topUp.save(); // Save here to ensure payment status is updated even if TopUp fails
            console.log(`Updated topUp ${topUp.topUpId} payment status to completed`);
        }

        // Call the eSIM provider API to execute the top-up
        console.log(`Executing TopUp for ${topUp.topUpId} with provider...`);
        const topUpResult = await executeTopUp(
            topUp.esimTranNo,
            topUp.iccid,
            topUp.packageCode,
            topUp.transactionId,
            topUp.originalPrice // Use original price for provider API, not the marked up price
        );

        if (!topUpResult.success) {
            // Update status to failed
            topUp.topUpStatus = 'failed';
            topUp.failureReason = topUpResult.error;
            await topUp.save();

            console.error(`TopUp execution failed for ${topUp.topUpId}:`, topUpResult.error);

            return NextResponse.json({
                success: false,
                error: topUpResult.error || 'Failed to execute top-up with provider'
            }, { status: 500 });
        }

        console.log(`TopUp execution succeeded for ${topUp.topUpId}`);

        // Update the top-up record with success information
        topUp.topUpStatus = 'completed';
        topUp.completedAt = new Date();
        topUp.updatedAt = new Date();

        // Store the provider's response data
        topUp.providerResponse = topUpResult.data;

        await topUp.save();
        console.log(`Updated topUp ${topUp.topUpId} status to completed`);

        // Update the original order's eSIM details with the new expiry and data amounts
        if (topUpResult.data) {
            try {
                const order = await Order.findOne({ orderId: topUp.orderId });

                if (!order) {
                    console.warn(`Original order ${topUp.orderId} not found when updating after TopUp`);
                } else if (!order.esimDetails) {
                    console.warn(`Order ${topUp.orderId} has no esimDetails to update after TopUp`);
                } else {
                    console.log(`Updating order ${topUp.orderId} with new eSIM details from TopUp`);

                    // Update eSIM details with the new information
                    if (topUpResult.data.expiredTime) {
                        order.esimDetails.expiredTime = topUpResult.data.expiredTime;
                        console.log(`Updated expiry to ${topUpResult.data.expiredTime}`);
                    }

                    if (topUpResult.data.totalVolume) {
                        // Convert bytes to MB for storage
                        const totalVolumeMB = Math.round(topUpResult.data.totalVolume / 1048576);
                        order.esimDetails.totalVolume = totalVolumeMB;
                        console.log(`Updated total volume to ${totalVolumeMB}MB`);
                    }

                    if (topUpResult.data.totalDuration) {
                        order.esimDetails.totalDuration = topUpResult.data.totalDuration;
                        console.log(`Updated total duration to ${topUpResult.data.totalDuration}`);
                    }

                    if (topUpResult.data.orderUsage !== undefined) {
                        // Convert bytes to MB for storage
                        const orderUsageMB = Math.round(topUpResult.data.orderUsage / 1048576);
                        order.esimDetails.orderUsage = orderUsageMB;
                        console.log(`Updated order usage to ${orderUsageMB}MB`);
                    }

                    order.updatedAt = new Date();
                    await order.save();
                    console.log(`Successfully saved updated order ${topUp.orderId}`);
                }
            } catch (orderUpdateError) {
                console.error(`Error updating order after TopUp: ${orderUpdateError.message}`);
                // We don't want to fail the entire request if just the order update fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Top-up completed successfully',
            topUp
        });
    } catch (error) {
        console.error('Error executing top-up:', error.stack);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to execute top-up'
        }, { status: 500 });
    }
}

/**
 * Execute a top-up with the eSIM provider
 * @param {string} esimTranNo - The eSIM transaction number
 * @param {string} iccid - The eSIM ICCID
 * @param {string} packageCode - The package code for the top-up
 * @param {string} transactionId - Our transaction ID
 * @param {number} originalPrice - The provider's price (without markup)
 * @returns {Promise<Object>} - Success status and data or error
 */
async function executeTopUp(esimTranNo, iccid, packageCode, transactionId, originalPrice) {
    try {
        if (!ESIM_ACCESS_CODE) {
            throw new Error('Missing API access code');
        }

        // Create request body exactly in the format shown in the docs
        const requestBody = {
            packageCode,
            transactionId,
            amount: originalPrice // Use the original price (without markup) for provider API
        };

        // Add esimTranNo if available
        if (esimTranNo) {
            requestBody.esimTranNo = esimTranNo;
        }

        // Add iccid if esimTranNo is not available
        if (!esimTranNo && iccid) {
            requestBody.iccid = iccid;
        }

        // Log the API URL and request body
        const apiUrl = `${ESIM_API_BASE_URL}/open/esim/topup`;
        console.log(`Making TopUp API call to: ${apiUrl}`);
        console.log('Executing top-up with:', requestBody);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RT-AccessCode': ESIM_ACCESS_CODE,
                },
                body: JSON.stringify(requestBody),
            });

            // Log the response status
            console.log(`TopUp API response status: ${response.status}`);

            // Get the raw response text
            const responseText = await response.text();
            console.log('Raw TopUp API response:', responseText);

            // Try to parse the response as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse TopUp API response:', parseError);
                return {
                    success: false,
                    error: `Invalid response from provider: ${responseText.substring(0, 200)}`
                };
            }

            // Check if the response was successful
            if (!data.success) {
                console.error('TopUp API error response:', data);
                return {
                    success: false,
                    error: data.errorMsg || 'Provider API reported an error'
                };
            }

            console.log('TopUp API success response:', data);

            // Return the result data
            return {
                success: true,
                data: data.obj
            };
        } catch (fetchError) {
            console.error('Network error calling TopUp API:', fetchError);
            return {
                success: false,
                error: `Network error: ${fetchError.message}`
            };
        }
    } catch (error) {
        console.error('Error in executeTopUp:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute top-up'
        };
    }
}