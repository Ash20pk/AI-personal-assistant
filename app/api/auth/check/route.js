import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Here you would typically verify the token
  // This is a basic check - implement proper token verification in production
  return NextResponse.json(
    { success: true, message: 'Authenticated' },
    { status: 200 }
  );
} 