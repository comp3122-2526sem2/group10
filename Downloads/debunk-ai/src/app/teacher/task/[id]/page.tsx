import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTaskForViewer } from '@/lib/services';

export default async function TeacherTaskDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const task = await getTaskForViewer(params.id, user.id, user.role);
  if (!task) notFound();
  const submissions = (task as any).submissions || [];
  const avg = submissions.length ? Math.round(submissions.reduce((sum: number, s: any) => sum + (s.scoreOverall || 0), 0) / submissions.length) : 0;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{task.mode}</div>
        <h1 className="mt-2 text-3xl font-black">{task.title}</h1>
        <p className="mt-2 text-slate-300">{task.topic}</p>
        <div className="mt-4 flex gap-3 text-sm text-slate-400">
          <span>提交数 {submissions.length}</span>
          <span>平均分 {avg}</span>
          <Link href={`/teacher/task/${task.id}/preview`} className="text-cyan-300">查看答案预览</Link>
        </div>
      </div>
      <div className="space-y-3">
        {submissions.map((submission: any) => (
          <Link key={submission.id} href={`/teacher/task/${task.id}/submissions/${submission.id}`} className="block rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-cyan-400/40">
            <div className="font-semibold">{submission.student.name}</div>
            <div className="mt-1 text-sm text-slate-400">Overall {Math.round(submission.scoreOverall || 0)} · Precision {Math.round(submission.scorePrecision || 0)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
