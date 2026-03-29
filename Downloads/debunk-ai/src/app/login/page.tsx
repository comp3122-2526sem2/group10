import Link from 'next/link';
import { LoginForm } from '@/components/auth-forms';

export default function LoginPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-6">
      <div>
        <div className="text-sm uppercase tracking-[0.3em] text-cyan-700">Welcome back</div>
        <h1 className="mt-4 text-4xl font-black text-slate-950">登录 Debunk AI</h1>
        <p className="mt-4 text-slate-600">继续你的课程、批改、Socratic review 和错题复盘。</p>
      </div>
      <div>
        <LoginForm />
        <div className="mt-4 text-sm text-slate-600">还没有账号？<Link href="/register" className="font-medium text-slate-950">去注册</Link></div>
      </div>
    </main>
  );
}
