import { getCurrentUser } from '@/lib/auth';
import { getTaskForViewer } from '@/lib/services';

export default async function ChallengeLivePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const task = await getTaskForViewer(params.id, user.id, user.role);
  if (!task) return null;
  const submissions = (task as any).submissions || [];
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-3xl font-black">Live Challenge Monitor</h1>
        <div className="mt-2 text-slate-300">{task.title} · 已提交 {submissions.length} 份</div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="h-4 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, submissions.length * 20)}%` }} />
        </div>
      </div>
    </div>
  );
}
