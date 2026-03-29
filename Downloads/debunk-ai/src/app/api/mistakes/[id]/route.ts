import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { updateMistakeNote } from '@/lib/services';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('STUDENT');
    const body = await request.json();
    const mistake = await updateMistakeNote(params.id, user.id, body.note);
    return NextResponse.json({ mistake });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
