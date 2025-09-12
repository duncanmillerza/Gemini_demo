
import { NextResponse } from 'next/server';
import { getRows, appendRow, updateRow } from '@/lib/sheets';
import { Referral } from '@/types';
import { getServerSession } from "next-auth/next"

// Import NextAuth options to validate sessions server-side
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const rows = await getRows();
    if (!rows) {
        return NextResponse.json([], { status: 200 });
    }
    // Correctly map columns to object properties
    const referrals: Referral[] = rows.slice(1).map((row, index) => ({
      id: row[0] || `temp-id-${index}`,
      ward: row[1] || '',
      bed: row[2] || '',
      referringDepartment: row[3] || '',
      referringClinician: row[4] || '',
      targetDepartment: row[5] || '',
      notes: row[6] || '',
      status: row[7] || '',
      feedback: row[8] || '',
      feedbackClinician: row[9] || '',
      createdAt: row[10] || '', // Read from column K
      updatedAt: row[11] || '', // Read from column L
    }));
    return NextResponse.json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json({ message: 'Error fetching referrals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const newReferralData = await request.json();
    const now = new Date();
    const uniqueId = `REF-${now.getTime()}-${Math.floor(Math.random() * 1000)}`;

    const rowData = [
      uniqueId,
      newReferralData.ward,
      newReferralData.bed,
      newReferralData.referringDepartment,
      newReferralData.referringClinician,
      newReferralData.targetDepartment,
      newReferralData.notes,
      'Pending', // Status
      '', // Feedback
      '', // FeedbackClinician
      now.toISOString(), // CreatedAt
      now.toISOString(), // UpdatedAt
    ];
    await appendRow(rowData);
    return NextResponse.json({ message: 'Referral created successfully' }, { status: 201 });
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json({ message: 'Error creating referral' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
        const updatedReferralData: Referral = await request.json();
        const session = await getServerSession(authOptions);
        if (!session) {
          return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const now = new Date().toISOString();

        const rows = await getRows();
        const actualRowIndex = rows ? rows.findIndex(r => r[0] === updatedReferralData.id) + 1 : -1;

        if (actualRowIndex === -1) {
            return NextResponse.json({ message: 'Referral ID not found' }, { status: 404 });
        }

        const rowData = [
            updatedReferralData.id,
            updatedReferralData.ward,
            updatedReferralData.bed,
            updatedReferralData.referringDepartment,
            updatedReferralData.referringClinician,
            updatedReferralData.targetDepartment,
            updatedReferralData.notes,
            updatedReferralData.status,
            updatedReferralData.feedback,
            // If feedback is being added/changed, add the current user's name
            updatedReferralData.feedback ? (session?.user?.name || 'N/A') : updatedReferralData.feedbackClinician,
            updatedReferralData.createdAt,
            now, // UpdatedAt
        ];

        await updateRow(actualRowIndex, rowData);
        return NextResponse.json({ message: 'Referral updated successfully' });
    } catch (error) {
        console.error("Error updating referral:", error);
        return NextResponse.json({ message: 'Error updating referral' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
