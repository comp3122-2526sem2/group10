import { NextResponse } from 'next/server';
import { createSession, loginUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginUser(body.email, body.password);
    await createSession(user);
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '登录失败' }, { status: 400 });
  }
}
