import { getCurrentUser } from '@/lib/auth';
import { getProfile } from '@/lib/services';

export default async function StudentProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-3xl font-black">{profile.user?.name}</h1>
        <div className="mt-2 text-slate-300">Level {profile.user?.level} · XP {profile.user?.xp} · Calibration gap {profile.calibration}</div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">徽章墙</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.user?.badges.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="text-2xl">{row.badge.icon}</div>
                <div className="mt-2 font-medium">{row.badge.displayName}</div>
                <div className="mt-1 text-sm text-slate-400">{row.badge.description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">成绩走势</h2>
          <div className="mt-4 space-y-3">
            {profile.submissions.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
                <div className="font-medium">{item.task.title}</div>
                <div className="mt-1">Overall: {Math.round(item.scoreOverall || 0)} · Precision: {Math.round(item.scorePrecision || 0)} · Recall: {Math.round(item.scoreRecall || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
