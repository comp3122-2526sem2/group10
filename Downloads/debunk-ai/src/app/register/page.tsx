import Link from 'next/link';
import { RegisterForm } from '@/components/auth-forms';

export default function RegisterPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-6">
      <div>
        <div className="text-sm uppercase tracking-[0.3em] text-cyan-700">Start building AI literacy</div>
        <h1 className="mt-4 text-4xl font-black text-slate-950">创建 Debunk AI 账号</h1>
        <p className="mt-4 text-slate-600">学生可以直接开始审错任务；老师可以创建课程、生成任务并查看班级提交。</p>
      </div>
      <div>
        <RegisterForm />
        <div className="mt-4 text-sm text-slate-600">已有账号？<Link href="/login" className="font-medium text-slate-950">去登录</Link></div>
      </div>
    </main>
  );
}
