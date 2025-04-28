// app/api/admin/pricing/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import PackagePricing from '@/models/PackagePricing';

// Helper function to check if user is admin
async function isAdmin(request) {
  const session = await getServerSession(authOptions);
  // Implement your admin role check here
  return session?.user?.role === 'admin';
}

export async function GET(request) {
  try {
    // Check admin authorization
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const packageCode = searchParams.get('packageCode');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;
    
    // Build query based on filters
    const query = {};
    
    if (packageCode) {
      query.packageCode = packageCode;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Fetch pricing data
    const pricingData = await PackagePricing.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await PackagePricing.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: pricingData,
      pagination: {
        totalCount,
        pageCount: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch pricing data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check admin authorization
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    await dbConnect();
    
    const body = await request.json();
    const session = await getServerSession(authOptions);
    const adminEmail = session?.user?.email || 'admin';
    
    // For single package update
    if (body.packageCode) {
      const { 
        packageCode, originalPrice, retailPrice, packageName, 
        dataAmount, duration, location, slug, durationUnit 
      } = body;
      
      // Validate required fields
      if (!packageCode || originalPrice === undefined || retailPrice === undefined) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Validate pricing logic
      if (retailPrice < originalPrice) {
        return NextResponse.json(
          { success: false, message: 'Retail price cannot be lower than original price' },
          { status: 400 }
        );
      }
      
      // Create or update pricing
      const pricing = await PackagePricing.findOneAndUpdate(
        { packageCode },
        {
          $set: {
            originalPrice,
            retailPrice,
            packageName,
            dataAmount,
            duration,
            location,
            slug,
            durationUnit,
            updatedAt: new Date(),
            updatedBy: adminEmail
          }
        },
        { 
          new: true, 
          upsert: true
        }
      );
      
      return NextResponse.json({
        success: true,
        data: pricing,
        message: 'Package pricing updated successfully'
      });
    }
    
    // For bulk percentage markup updates
    if (body.markupPercentage !== undefined) {
      const { markupPercentage, filter } = body;
      const percentage = parseFloat(markupPercentage);
      
      if (isNaN(percentage) || percentage < 0) {
        return NextResponse.json(
          { success: false, message: 'Invalid markup percentage' },
          { status: 400 }
        );
      }
      
      // Build query based on provided filter or use empty object for all
      const query = filter || {};
      
      // Get all matching pricing records
      const pricingRecords = await PackagePricing.find(query);
      
      if (pricingRecords.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No packages found matching the criteria' },
          { status: 404 }
        );
      }
      
      // Update each record with bulk operations
      const bulkOps = pricingRecords.map(record => {
        const newRetailPrice = Math.round(record.originalPrice * (1 + percentage / 100));
        
        return {
          updateOne: {
            filter: { _id: record._id },
            update: {
              $set: {
                retailPrice: newRetailPrice,
                updatedAt: new Date(),
                updatedBy: adminEmail
              }
            }
          }
        };
      });
      
      const result = await PackagePricing.bulkWrite(bulkOps);
      
      return NextResponse.json({
        success: true,
        message: `Applied ${percentage}% markup to ${result.modifiedCount} packages`,
        stats: result
      });
    }
    
    // For bulk updates with specific values
    if (Array.isArray(body.items)) {
      const { items } = body;
      
      if (!items.length) {
        return NextResponse.json(
          { success: false, message: 'No items provided for update' },
          { status: 400 }
        );
      }
      
      // Validate all items before processing
      for (const item of items) {
        const { packageCode, retailPrice } = item;
        
        if (!packageCode || retailPrice === undefined) {
          return NextResponse.json({
            success: false,
            message: `Missing required fields for package ${packageCode || 'unknown'}`
          }, { status: 400 });
        }
      }
      
      // Create bulk operations
      const bulkOps = [];
      
      for (const item of items) {
        const { packageCode, retailPrice } = item;
        
        // First find the package to get the original price
        const existingPackage = await PackagePricing.findOne({ packageCode });
        
        if (!existingPackage) {
          console.warn(`Package not found for bulk update: ${packageCode}`);
          continue;
        }
        
        // Validate retail price against original price
        if (retailPrice < existingPackage.originalPrice) {
          console.warn(`Retail price (${retailPrice}) is less than original price (${existingPackage.originalPrice}) for ${packageCode}`);
          continue;
        }
        
        bulkOps.push({
          updateOne: {
            filter: { packageCode },
            update: {
              $set: {
                retailPrice,
                updatedAt: new Date(),
                updatedBy: adminEmail
              }
            }
          }
        });
      }
      
      if (bulkOps.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No valid items to update'
        }, { status: 400 });
      }
      
      const result = await PackagePricing.bulkWrite(bulkOps);
      
      return NextResponse.json({
        success: true,
        message: `Updated ${result.modifiedCount} packages successfully`,
        stats: result
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid request format'
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating pricing data:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update pricing data' },
      { status: 500 }
    );
  }
}

// Delete a pricing record
export async function DELETE(request) {
  try {
    // Check admin authorization
    if (!await isAdmin(request)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get package code from query parameters
    const { searchParams } = new URL(request.url);
    const packageCode = searchParams.get('packageCode');
    
    if (!packageCode) {
      return NextResponse.json(
        { success: false, message: 'Package code is required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Delete the pricing record
    const result = await PackagePricing.findOneAndDelete({ packageCode });
    
    if (!result) {
      return NextResponse.json({
        success: false,
        message: 'Package pricing not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Package pricing for ${packageCode} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting pricing data:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete pricing data' },
      { status: 500 }
    );
  }
}