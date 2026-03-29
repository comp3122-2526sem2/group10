import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/auth';

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'TEACHER') redirect('/student/dashboard');
  return (
    <AppShell
      title="Teacher Console"
      subtitle={`欢迎回来，${user.name}`}
      links={[
        { href: '/teacher/dashboard', label: 'Dashboard' },
        { href: '/teacher/courses', label: 'Courses' },
        { href: '/teacher/task/create', label: 'Create Task' },
        { href: '/teacher/challenge/create', label: 'Challenge Mode' },
      ]}
    >
      {children}
    </AppShell>
  );
}
