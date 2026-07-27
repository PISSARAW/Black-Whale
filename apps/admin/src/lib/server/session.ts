import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'bw_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MIN_SESSION_SECRET_LENGTH = 32;
const MIN_ADMIN_PASSWORD_LENGTH = 12;

function requiredSecret(name: 'ADMIN_PASSWORD' | 'SESSION_SECRET'): string {
  const value = process.env[name];
  if (process.env.NODE_ENV === 'production') {
    if (!value) throw new Error(`${name} is required in production`);
    if (name === 'SESSION_SECRET' && value.length < MIN_SESSION_SECRET_LENGTH) {
      throw new Error(
        `SESSION_SECRET must contain at least ${MIN_SESSION_SECRET_LENGTH} characters in production`
      );
    }
    if (name === 'ADMIN_PASSWORD' && value.length < MIN_ADMIN_PASSWORD_LENGTH) {
      throw new Error(
        `ADMIN_PASSWORD must contain at least ${MIN_ADMIN_PASSWORD_LENGTH} characters in production`
      );
    }
    return value;
  }
  if (value) return value;
  return name === 'ADMIN_PASSWORD' ? 'admin' : 'development-session-secret';
}

function equal(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Sessions carry a binding to the current admin password, so rotating
 * ADMIN_PASSWORD invalidates every cookie issued beforehand. Without it a
 * stolen cookie stays valid for its full 12h TTL even after the credential it
 * was issued against has been changed.
 */
function passwordBinding(): string {
  return createHmac('sha256', requiredSecret('SESSION_SECRET'))
    .update(`pwd:${requiredSecret('ADMIN_PASSWORD')}`)
    .digest('base64url')
    .slice(0, 16);
}

function signature(payload: string): string {
  return createHmac('sha256', requiredSecret('SESSION_SECRET')).update(payload).digest('base64url');
}

export function verifyPassword(password: string): boolean {
  return equal(password, requiredSecret('ADMIN_PASSWORD'));
}

export function createSession(): string {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  // The nonce makes every issued token distinct, so a valid cookie can never be
  // derived from a predictable value such as the expiry timestamp alone.
  const nonce = randomBytes(18).toString('base64url');
  const payload = `${expiresAt}.${nonce}.${passwordBinding()}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  const [expiresAt, nonce, binding, suppliedSignature] = parts as [string, string, string, string];
  if (!expiresAt || !nonce || !binding || !suppliedSignature) return false;
  if (!/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  if (!equal(binding, passwordBinding())) return false;
  return equal(suppliedSignature, signature(`${expiresAt}.${nonce}.${binding}`));
}

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: SESSION_TTL_SECONDS,
};
