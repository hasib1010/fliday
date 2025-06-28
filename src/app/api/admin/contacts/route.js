// app/api/admin/contacts/route.js
import dbConnect from '../../../../lib/mongodb';
import Contact from '../../../../models/Contact';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path as needed

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get contacts with pagination
    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'name email')
        .lean(),
      Contact.countDocuments(query)
    ]);

    // Get statistics
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      new: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    return Response.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statusCounts
    });

  } catch (error) {
    console.error('Admin contacts API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { contactId, status, priority, adminNotes, assignedTo } = body;

    if (!contactId) {
      return Response.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const updateData = { lastUpdated: new Date() };
    
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    return Response.json({ contact });

  } catch (error) {
    console.error('Admin contacts update error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return Response.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const contact = await Contact.findByIdAndDelete(contactId);

    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    return Response.json({ message: 'Contact deleted successfully' });

  } catch (error) {
    console.error('Admin contacts delete error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}