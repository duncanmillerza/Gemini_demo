import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/sheets';

export async function POST(request: NextRequest) {
  try {
    const { email, name, department } = await request.json();

    // Validate required fields
    if (!email || !name || !department) {
      return NextResponse.json(
        { error: 'Email, name, and department are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      // For demo purposes, we can allow "updating" the existing user
      // by returning the existing user data instead of an error
      console.log('User already exists, returning existing data for demo:', existingUser);
      return NextResponse.json(existingUser, { status: 200 });
    }

    // Create new user
    const newUser = await createUser(email, name, department);
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}