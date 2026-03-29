import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { createSession, registerUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser({ name: body.name, email: body.email, password: body.password, role: body.role as Role });
    await createSession(user);
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '注册失败' }, { status: 400 });
  }
}
