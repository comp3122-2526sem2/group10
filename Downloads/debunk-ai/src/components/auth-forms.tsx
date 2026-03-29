'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

async function sendJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const json = await sendJson('/api/auth/login', { email: form.get('email'), password: form.get('password') });
      router.push(json.user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-200 focus:ring" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-200 focus:ring" />
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
      <div className="text-xs text-slate-500">Demo accounts: teacher@debunk.ai / student@debunk.ai, password: password123</div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const json = await sendJson('/api/auth/register', {
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        role: form.get('role'),
      });
      router.push(json.user.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
        <input name="name" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-200 focus:ring" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-200 focus:ring" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input name="password" type="password" minLength={8} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-200 focus:ring" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
        <select name="role" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none ring-cyan-200 focus:ring">
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
        </select>
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <button disabled={loading} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
    </form>
  );
}
