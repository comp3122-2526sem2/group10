import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { submitTaskForStudent } from '@/lib/services';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('STUDENT');
    const body = await request.json();
    const submission = await submitTaskForStudent({ taskId: params.id, studentId: user.id, annotations: body.annotations || [], additionalResponse: body.additionalResponse || {} });
    return NextResponse.json({ submission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
