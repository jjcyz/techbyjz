import { NextResponse } from 'next/server';

// Force dynamic rendering for Vercel
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    path: '/api/health',
    message: 'API routes are working on Vercel!'
  });
}

