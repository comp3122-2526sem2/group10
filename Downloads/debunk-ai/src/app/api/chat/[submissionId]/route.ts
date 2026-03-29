import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { postChatMessage } from '@/lib/services';

export async function GET(_: Request, { params }: { params: { submissionId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sessions = await prisma.chatSession.findMany({ where: { submissionId: params.submissionId, submission: { studentId: user.id } }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ sessions });
}

export async function POST(request: Request, { params }: { params: { submissionId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    const body = await request.json();
    const session = await postChatMessage(params.submissionId, Number(body.errorId), body.message);
    return NextResponse.json({ session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
