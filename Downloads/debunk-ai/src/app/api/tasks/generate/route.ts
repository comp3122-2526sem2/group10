import { NextResponse } from 'next/server';
import { ErrorDensity, TaskMode } from '@prisma/client';
import { requireUser } from '@/lib/auth';
import { generateTaskDraft } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    await requireUser('TEACHER');
    const body = await request.json();
    const preview = await generateTaskDraft({
      topic: body.topic,
      subjectArea: body.subjectArea,
      mode: body.mode as TaskMode,
      density: body.errorDensity as ErrorDensity,
      errorConfig: body.errorConfig,
      referenceMaterial: body.referenceMaterial,
    });
    return NextResponse.json(preview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
