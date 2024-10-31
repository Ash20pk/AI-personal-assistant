import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    const client = await clientPromise;
    const db = client.db("jarvis");
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    // Generate JWT using jose
    const token = await new SignJWT({ userId: result.insertedId.toString() })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 