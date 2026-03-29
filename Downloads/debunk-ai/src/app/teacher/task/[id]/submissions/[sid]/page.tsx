import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function TeacherSubmissionDetailPage({ params }: { params: { id: string; sid: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const submission = await prisma.submission.findFirst({
    where: { id: params.sid, taskId: params.id, task: { course: { teacherId: user.id } } },
    include: { student: true, task: true, chatSessions: true },
  });
  if (!submission) notFound();
  const grading = submission.gradingResult as any;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-3xl font-black">{submission.student.name} 的提交</h1>
        <div className="mt-2 text-slate-300">{submission.task.title} · 总分 {Math.round(submission.scoreOverall || 0)}</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">学生标注</h2>
          <div className="mt-4 space-y-3">
            {((submission.annotations as any[]) || []).map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
                <div className="font-medium">{item.selectedText}</div>
                <div className="mt-1">Type: {item.errorType} · Confidence {item.confidence}</div>
                <div className="mt-2 text-slate-400">{item.explanation}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">批改反馈 / 聊天记录</h2>
          <div className="mt-4 space-y-3">
            {grading.annotationResults.map((item: any) => (
              <div key={item.annotationId} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">{item.feedback}</div>
            ))}
            {submission.chatSessions.flatMap((session) => (session.messages as any[]) || []).map((message: any, index: number) => (
              <div key={index} className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-50">{message.role}: {message.content}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
