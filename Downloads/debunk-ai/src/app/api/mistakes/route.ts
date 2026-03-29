import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getMistakes } from '@/lib/services';

export async function GET() {
  try {
    const user = await requireUser('STUDENT');
    const mistakes = await getMistakes(user.id);
    return NextResponse.json({ mistakes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
