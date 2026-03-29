import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTaskForViewer } from '@/lib/services';

export default async function TeacherTaskPreviewPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const task = await getTaskForViewer(params.id, user.id, user.role);
  if (!task) notFound();
  const answerKey = task.answerKey as any[];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-2xl font-black">学生视图内容</h1>
        <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-900/70 p-4 text-sm leading-7 text-slate-200">{task.generatedContent}</div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl font-black">Answer Key</h2>
        <div className="mt-4 space-y-3">
          {answerKey.map((item) => (
            <div key={item.id} className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-sm text-rose-50">
              <div className="font-medium">#{item.id} · {item.errorType}</div>
              <div className="mt-2">{item.errorText}</div>
              <div className="mt-2 text-rose-100/80">{item.whatIsWrong}</div>
              <div className="mt-2 text-emerald-200">Correct: {item.correctVersion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
