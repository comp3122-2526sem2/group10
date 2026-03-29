import { NextResponse } from 'next/server';
import { ErrorDensity, TaskMode } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { createTaskForTeacher } from '@/lib/services';

export async function POST(request: Request) {
  try {
    await requireUser('TEACHER');
    const body = await request.json();
    const task = await createTaskForTeacher({
      courseId: body.courseId,
      title: body.title,
      topic: body.topic,
      subjectArea: body.subjectArea,
      mode: body.mode as TaskMode,
      referenceMaterial: body.referenceMaterial,
      errorDensity: body.errorDensity as ErrorDensity,
      errorConfig: body.errorConfig || { factual: 1, logical: 1, hallucination: 1, conceptual: 1 },
      isPublished: body.isPublished ?? true,
      isChallenge: body.isChallenge ?? false,
      challengeDuration: body.challengeDuration ?? null,
    });
    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
