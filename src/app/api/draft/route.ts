import { NextRequest, NextResponse } from 'next/server';
import { generateDraft } from '@/lib/agents/draft';
import { Email } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tone } = body as {
      email: Email;
      tone: 'direct' | 'warm' | 'formal';
    };

    if (!email || !tone) {
      return NextResponse.json(
        { success: false, error: 'Missing email or tone parameter' },
        { status: 400 }
      );
    }

    if (!['direct', 'warm', 'formal'].includes(tone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tone. Must be: direct, warm, or formal' },
        { status: 400 }
      );
    }

    const draft = await generateDraft(email, tone);
    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error('Draft API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate draft' },
      { status: 500 }
    );
  }
}
