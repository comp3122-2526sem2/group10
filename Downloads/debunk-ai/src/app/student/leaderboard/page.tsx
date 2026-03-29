import { getLeaderboard } from '@/lib/services';

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {([
        ['Weekly Score Leaders', leaderboard.weekly],
        ['Accuracy Champions', leaderboard.accuracy],
        ['Most Improved', leaderboard.improved],
      ] as Array<[string, any[]]>).map(([title, rows]) => (
        <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="mt-4 space-y-3">
            {rows.map((row, index) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                <div>{index + 1}. {row.name}</div>
                <div>{row.averageScore || row.averagePrecision}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
