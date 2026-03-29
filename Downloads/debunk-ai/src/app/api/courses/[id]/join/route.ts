import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { joinCourseByCode } from '@/lib/services';

export async function POST(request: Request) {
  try {
    const user = await requireUser('STUDENT');
    const body = await request.json();
    const course = await joinCourseByCode(user.id, body.inviteCode);
    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
