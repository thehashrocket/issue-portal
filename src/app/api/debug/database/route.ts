import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const databaseUrlProtocol = process.env.DATABASE_URL?.split('://')[0];
    
    // Try to connect to the database
    let connectionStatus = 'unknown';
    let errorMessage = null;
    
    try {
      await prisma.$connect();
      connectionStatus = 'connected';
    } catch (error) {
      connectionStatus = 'failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      await prisma.$disconnect();
    }

    return NextResponse.json({
      success: true,
      debug: {
        hasDatabaseUrl,
        databaseUrlProtocol,
        connectionStatus,
        errorMessage,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 