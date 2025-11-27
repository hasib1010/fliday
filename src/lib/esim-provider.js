// lib/esim-provider.js
// Helper functions for interacting with eSIM provider API

/**
 * Fetch current package details from provider
 * @param {string} packageCode - The package code to query
 * @returns {Promise<Object>} Package details with current price
 */
export async function fetchProviderPackagePrice(packageCode) {
    try {
        console.log(`[eSIM Provider] Fetching current price for: ${packageCode}`);

        // Fetch from provider's package list endpoint
        const response = await fetch(
            `${process.env.ESIM_API_BASE_URL}/open/package/list`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RT-AccessCode': process.env.ESIM_ACCESS_CODE
                },
                body: JSON.stringify({
                    packageCode,
                    pager: {
                        pageNum: 1,
                        pageSize: 10
                    }
                })
            }
        );

        const data = await response.json();
        console.log(`[eSIM Provider] Response:`, JSON.stringify(data, null, 2));

        // FIXED: Provider returns packageList (not list)
        if (!data.success || !data.obj?.packageList?.length) {
            throw new Error('Package not found in provider response');
        }

        // Find the specific package
        const packageDetails = data.obj.packageList.find(
            pkg => pkg.packageCode === packageCode || pkg.slug === packageCode
        );

        if (!packageDetails) {
            throw new Error(`Package ${packageCode} not found in packageList`);
        }

        // FIXED: Provider already returns price in our format (13800 = $1.38)
        // No conversion needed - use as-is
        const providerPrice = packageDetails.price;

        console.log(`[eSIM Provider] Current price for ${packageCode}: ${providerPrice} ($${providerPrice / 10000})`);

        return {
            packageCode: packageDetails.packageCode || packageCode,
            slug: packageDetails.slug,
            price: providerPrice,
            retailPrice: packageDetails.retailPrice, // Provider also gives us a retail price!
            packageName: packageDetails.name,
            dataAmount: packageDetails.volume ?
                formatDataSize(packageDetails.volume) : packageDetails.dataAmount,
            duration: packageDetails.duration,
            durationUnit: packageDetails.durationUnit,
            location: packageDetails.locationCode || packageDetails.location,
            rawProviderData: packageDetails
        };
    } catch (error) {
        console.error(`[eSIM Provider] Error fetching package price:`, error);
        throw error;
    }
}

/**
 * Format data size from bytes
 */
function formatDataSize(bytes) {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Order eSIM from provider
 * @param {Object} params - Order parameters
 * @returns {Promise<Object>} Order result with orderNo
 */      
export async function orderESIMFromProvider({
    transactionId,
    packageCode,
    providerPrice,
    count = 1
}) {
    try {
        console.log(`[eSIM Provider] Ordering eSIM:`, {
            transactionId,
            packageCode,
            providerPrice: `${providerPrice} ($${providerPrice / 10000})`,
            count
        });

        const payload = {
            transactionId,
            amount: providerPrice,
            packageInfoList: [{
                packageCode,
                count,
                price: providerPrice
            }]
        };

        console.log(`[eSIM Provider] Order payload:`, JSON.stringify(payload, null, 2));

        const response = await fetch(
            `${process.env.ESIM_API_BASE_URL}/open/esim/order`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RT-AccessCode': process.env.ESIM_ACCESS_CODE
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        console.log(`[eSIM Provider] Order response:`, JSON.stringify(data, null, 2));

        if (!data.success) {
            throw new Error(data.errorMsg || data.errorMessage || 'Order failed');
        }

        const orderNo = data.obj?.orderNo;
        if (!orderNo) {
            throw new Error('No orderNo returned from provider');
        }

        console.log(`[eSIM Provider] eSIM ordered successfully. OrderNo: ${orderNo}`);

        return {
            success: true,
            orderNo,
            transactionId: data.obj?.transactionId || transactionId,
            rawResponse: data
        };
    } catch (error) {
        console.error(`[eSIM Provider] Order error:`, error);
        throw error;
    }
}