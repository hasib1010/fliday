// app/api/admin/settings/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Create Settings model schema if it doesn't exist
let Settings;
try {
  Settings = mongoose.model('Settings');
} catch (e) {
  const SettingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
  });

  Settings = mongoose.model('Settings', SettingsSchema);
}

// Default settings
const DEFAULT_SETTINGS = {
  defaultMarkupAmount: 10000, // $1.00 in cents
  defaultCurrency: 'USD',
  taxRates: [
    { country: 'US', rate: 0 },
    { country: 'CA', rate: 0 },
    { country: 'GB', rate: 0 },
    { country: 'EU', rate: 0 }
  ],
  emailNotifications: {
    orderConfirmation: true,
    orderStatusUpdate: true,
    adminNewOrder: true,
    lowInventory: false
  },
  maintenance: {
    enabled: false,
    message: 'We are currently performing scheduled maintenance. Please check back later.'
  }
};

// Helper function to get settings
async function getSettings() {
  await dbConnect();
  
  try {
    const settingsDoc = await Settings.findOne({ key: 'appSettings' });
    
    if (!settingsDoc) {
      // Initialize settings if they don't exist
      const newSettings = new Settings({
        key: 'appSettings',
        value: DEFAULT_SETTINGS,
        updatedAt: new Date()
      });
      
      await newSettings.save();
      return DEFAULT_SETTINGS;
    }
    
    return settingsDoc.value;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Helper function to update settings
async function updateSettings(newSettings) {
  await dbConnect();
  
  try {
    const updatedSettings = await Settings.findOneAndUpdate(
      { key: 'appSettings' },
      { 
        value: newSettings,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    return updatedSettings.value;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

export async function GET(request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Please sign in' }),
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Admin access required' }),
        { status: 403 }
      );
    }
    
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Please sign in' }),
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized: Admin access required' }),
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Basic validation
    const requiredKeys = ['defaultMarkupAmount', 'defaultCurrency', 'taxRates', 'emailNotifications', 'maintenance'];
    
    for (const key of requiredKeys) {
      if (!body.hasOwnProperty(key)) {
        return new NextResponse(
          JSON.stringify({ message: `Missing required field: ${key}` }),
          { status: 400 }
        );
      }
    }
    
    // Update settings
    const updatedSettings = await updateSettings(body);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings Update API error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}