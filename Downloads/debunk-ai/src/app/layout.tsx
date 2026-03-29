import Link from 'next/link';
import './globals.css';
import { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'Debunk AI',
  description: 'Reverse AI tutoring platform',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
            <Link href="/" className="text-xl font-bold text-slate-950">Debunk AI</Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/">首页</Link>
              {!user ? <Link href="/login">登录</Link> : null}
              {!user ? <Link href="/register">注册</Link> : null}
              {user ? <Link href={user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'}>控制台</Link> : null}
              {user ? <Link href="/api/auth/logout">退出</Link> : null}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
