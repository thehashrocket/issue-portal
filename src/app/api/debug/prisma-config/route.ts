import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check all environment variables that might affect Prisma
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL ? 'SET' : 'NOT_SET',
      PRISMA_ACCELERATE_URL: process.env.PRISMA_ACCELERATE_URL ? 'SET' : 'NOT_SET',
      PRISMA_DATA_PROXY_URL: process.env.PRISMA_DATA_PROXY_URL ? 'SET' : 'NOT_SET',
      PRISMA_CLIENT_ENGINE_TYPE: process.env.PRISMA_CLIENT_ENGINE_TYPE || 'NOT_SET',
      PRISMA_GENERATE_DATAPROXY: process.env.PRISMA_GENERATE_DATAPROXY || 'NOT_SET',
    };

    // Check if we can import PrismaClient directly
    let prismaClientStatus = 'unknown';
    try {
      await import('@prisma/client');
      prismaClientStatus = 'imported_successfully';
    } catch (importError) {
      prismaClientStatus = 'import_failed';
      console.error('PrismaClient import failed:', importError);
    }

    return NextResponse.json({
      success: true,
      debug: {
        envVars,
        prismaClientStatus,
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