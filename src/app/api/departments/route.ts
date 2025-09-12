
import { NextResponse } from 'next/server';
import { getAllDepartments } from '@/lib/sheets';

export async function GET() {
  try {
    const departments = await getAllDepartments();
    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json({ message: 'Error fetching departments' }, { status: 500 });
  }
}

// This forces the route to be dynamic and use the Node.js runtime.
export const dynamic = 'force-dynamic';
