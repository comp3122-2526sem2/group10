import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bg-slate-100">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1.15fr,0.85fr] lg:px-6 lg:py-24">
        <div>
          <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">Reverse AI Tutoring</div>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950">Teach students to question AI, not trust it.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Debunk AI turns AI from an authority source into something students must review, question, and correct. Teachers create content with intentional errors; students highlight, categorize, explain, and reflect. The result: critical thinking + AI literacy in the AI age.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white">Get Started</Link>
            <Link href="/login" className="rounded-2xl border border-slate-300 px-6 py-4 text-sm font-semibold text-slate-800">Try Demo Account</Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: '4 Error Types', description: 'Factual / Logical Fallacy / AI Hallucination / Conceptual Confusion' },
              { title: 'Socratic Hints', description: "Don't give answers, just ask questions. Guide students to discover problems themselves" },
              { title: 'Gamification', description: 'Levels, XP, badges, streaks, leaderboards - drive continuous engagement' },
            ].map(({title, description}) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-slate-950">{title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] bg-slate-950 p-6 text-slate-50 shadow-2xl shadow-cyan-950/20">
          <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live Product Snapshot</div>
          <div className="mt-6 space-y-4">
            {[
              'Teachers create content with errors and publish to courses',
              'Students highlight text, fill in error types, explanations, confidence levels',
              'System auto-grades: Precision / Recall / Classification accuracy / Explanation quality',
              'Failed items auto-enter Mistake Journal with targeted Retry',
              'Review phase enters Socratic dialogue and completes teach-back',
            ].map((item, idx) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 font-semibold text-cyan-200">{idx + 1}</div>
                <div className="leading-6 text-slate-200">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
