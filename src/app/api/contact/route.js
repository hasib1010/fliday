// app/api/contact/route.js
import dbConnect from '../../../lib/mongodb';
import Contact from '@/models/Contact';

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create contact entry
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'new',
      ipAddress: ip,
      userAgent: userAgent,
      submittedAt: new Date()
    });

    return Response.json(
      { 
        message: 'Contact form submitted successfully',
        contactId: contact._id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Contact API error:', error);
    
    if (error.name === 'ValidationError') {
      return Response.json(
        { error: 'Validation failed: ' + error.message },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}