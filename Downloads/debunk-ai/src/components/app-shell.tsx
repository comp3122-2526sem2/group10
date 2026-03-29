import Link from 'next/link';
import { ReactNode } from 'react';

export function AppShell({ title, subtitle, links, children }: { title: string; subtitle?: string; links: { href: string; label: string }[]; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-5 lg:block">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">Debunk AI</div>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
            {subtitle ? <p className="mt-2 text-sm text-slate-300">{subtitle}</p> : null}
          </div>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded-2xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-cyan-950/20 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
