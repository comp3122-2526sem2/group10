import { clsx } from 'clsx';

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function letterGrade(score: number) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export function randomFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(hash);
}
