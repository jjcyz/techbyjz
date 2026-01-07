/**
 * Admin authentication endpoint
 */

import { NextRequest } from 'next/server';
import { verifyAdminPassword, createAdminSessionResponse, createLogoutResponse } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return Response.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return Response.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    return createAdminSessionResponse({
      success: true,
      message: 'Authentication successful',
    });
  } catch (error) {
    return Response.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  return createLogoutResponse();
}

