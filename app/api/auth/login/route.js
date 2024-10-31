import { NextResponse } from 'next/server';
import * as jose from 'jose';
import clientPromise from '@/lib/mongodb';
import bcryptjs from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Connect to MongoDB using your client
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user in database
    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new jose.SignJWT({ 
      id: user._id.toString(),
      email: user.email,
      name: user.name // Include any other user data you need
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    );

    // Set the token cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 