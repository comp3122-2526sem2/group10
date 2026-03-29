import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

const COOKIE_NAME = 'debunk_session';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me-before-production');

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  level: number;
  xp: number;
};

async function signToken(user: SessionUser) {
  return new SignJWT(user as never)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function createSession(user: SessionUser) {
  const token = await signToken(user);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getRequestUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser(role?: Role | 'STUDENT' | 'TEACHER') {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  if (role && user.role !== role) throw new Error('FORBIDDEN');
  return user;
}

export async function registerUser(input: { name: string; email: string; password: string; role: Role }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) throw new Error('Email already registered');
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      streak: { create: {} },
    },
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role, xp: user.xp, level: user.level };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error('Account does not exist');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Incorrect password');
  return { id: user.id, name: user.name, email: user.email, role: user.role, xp: user.xp, level: user.level };
}
