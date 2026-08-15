import { NextResponse } from 'next/server';
import { triageEmails } from '@/lib/agents/triage';
import seedEmails from '@/lib/data/seed-emails.json';
import { Email } from '@/lib/types';

export async function POST() {
  try {
    const emails = seedEmails as Email[];
    const results = await triageEmails(emails);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Triage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to triage emails' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET returns seed data without running triage (for quick loading)
  try {
    const emails = seedEmails as Email[];
    const results = await triageEmails(emails);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Triage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to triage emails' },
      { status: 500 }
    );
  }
}
