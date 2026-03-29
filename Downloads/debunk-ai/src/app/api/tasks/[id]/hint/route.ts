import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { requestHint } from '@/lib/services';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('STUDENT');
    const hint = await requestHint(params.id, user.id);
    return NextResponse.json(hint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
