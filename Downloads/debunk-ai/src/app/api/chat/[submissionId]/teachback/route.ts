import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitTeachback } from '@/lib/services';

export async function POST(request: Request, { params }: { params: { submissionId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    const body = await request.json();
    const payload = await submitTeachback(params.submissionId, Number(body.errorId), body.teachback);
    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
