import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyUpdate } from '@/lib/agents/weekly-update';
import { TriageResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { triageResults } = body as { triageResults: TriageResult[] };

    if (!triageResults || !Array.isArray(triageResults)) {
      return NextResponse.json(
        { success: false, error: 'Missing triageResults array' },
        { status: 400 }
      );
    }

    const update = await generateWeeklyUpdate(triageResults);
    return NextResponse.json({ success: true, update });
  } catch (error) {
    console.error('Weekly update API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate weekly update' },
      { status: 500 }
    );
  }
}
