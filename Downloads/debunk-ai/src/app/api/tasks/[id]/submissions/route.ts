import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('TEACHER');
    const submissions = await prisma.submission.findMany({ where: { taskId: params.id, task: { course: { teacherId: user.id } } }, include: { student: true }, orderBy: { submittedAt: 'desc' } });
    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
