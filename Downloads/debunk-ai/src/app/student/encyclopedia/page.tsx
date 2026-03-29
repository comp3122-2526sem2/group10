import { getEncyclopedia } from '@/lib/services';

export default function EncyclopediaPage() {
  const rows = getEncyclopedia();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-bold">{row.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{row.tip}</p>
          <div className="mt-4">
            <div className="text-sm font-semibold text-cyan-300">Examples</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">{row.examples.map((item) => <li key={item}>• {item}</li>)}</ul>
          </div>
          <div className="mt-4">
            <div className="text-sm font-semibold text-cyan-300">Common traps</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">{row.traps.map((item) => <li key={item}>• {item}</li>)}</ul>
          </div>
        </div>
      ))}
    </div>
  );
}
