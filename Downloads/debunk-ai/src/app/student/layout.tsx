import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/auth';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'STUDENT') redirect('/teacher/dashboard');
  return (
    <AppShell
      title="Student Space"
      subtitle={`欢迎回来，${user.name}`}
      links={[
        { href: '/student/dashboard', label: 'Dashboard' },
        { href: '/student/courses', label: 'Courses' },
        { href: '/student/profile', label: 'Profile' },
        { href: '/student/mistakes', label: 'Mistake Journal' },
        { href: '/student/encyclopedia', label: 'Encyclopedia' },
        { href: '/student/leaderboard', label: 'Leaderboard' },
      ]}
    >
      {children}
    </AppShell>
  );
}
