import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'bw_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function requiredSecret(name: 'ADMIN_PASSWORD' | 'SESSION_SECRET'): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production`);
  }
  return name === 'ADMIN_PASSWORD' ? 'admin' : 'development-session-secret';
}

function equal(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(expiresAt: string): string {
  return createHmac('sha256', requiredSecret('SESSION_SECRET')).update(expiresAt).digest('base64url');
}

export function verifyPassword(password: string): boolean {
  return equal(password, requiredSecret('ADMIN_PASSWORD'));
}

export function createSession(): string {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${expiresAt}.${signature(expiresAt)}`;
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAt, suppliedSignature, extra] = value.split('.');
  if (!expiresAt || !suppliedSignature || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  return equal(suppliedSignature, signature(expiresAt));
}

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: SESSION_TTL_SECONDS,
};
