// lib/auth.ts
// Hệ thống bảo mật mật khẩu (scrypt), ký xác thực JWT Session Cookie (HMAC-SHA256) và OTP Email

import * as crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, SubscriptionPlan } from '@/types';

const SECRET_KEY = process.env.AUTH_SECRET || process.env.FIREBASE_PRIVATE_KEY?.slice(0, 64) || 'ai-study-assistant-commercial-saas-secret-2026';
export const SESSION_COOKIE_NAME = 'aisa_session';

/**
 * Băm mật khẩu một chiều bằng thuật toán scrypt của Node.js
 * Định dạng lưu trữ: "scrypt:<salt_hex>:<hash_hex>"
 */
export function hashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Kiểm tra mật khẩu có phải đã được băm hay chưa
 */
export function isPasswordHashed(storedPassword: string): boolean {
  return String(storedPassword || '').startsWith('scrypt:');
}

/**
 * Xác thực mật khẩu đầu vào với mật khẩu đã lưu (hỗ trợ cả mật khẩu đã băm và mật khẩu plain-text cũ để auto-migrate)
 */
export function verifyPassword(plainPassword: string, storedPassword: string): { valid: boolean; needsRehash: boolean } {
  const rawStored = String(storedPassword || '');
  if (isPasswordHashed(rawStored)) {
    const parts = rawStored.split(':');
    if (parts.length !== 3) return { valid: false, needsRehash: false };
    const [, salt, originalHash] = parts;
    const derivedKey = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
    const isMatch = crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(derivedKey, 'hex'));
    return { valid: isMatch, needsRehash: false };
  }

  // Tương thích ngược với tài khoản cũ đang lưu plain-text
  const isLegacyMatch = rawStored === plainPassword;
  return { valid: isLegacyMatch, needsRehash: isLegacyMatch };
}

export interface SessionPayload {
  username: string;
  role: UserRole;
  plan: SubscriptionPlan;
  exp: number;
}

/**
 * Tạo chuỗi token phiên đăng nhập được ký bằng HMAC-SHA256
 */
export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = 7 * 24 * 3600): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const dataB64 = Buffer.from(JSON.stringify(fullPayload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataB64)
    .digest('base64url');
  return `${dataB64}.${signature}`;
}

/**
 * Giải mã và xác thực chữ ký của token phiên đăng nhập
 */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  try {
    const [dataB64, signature] = token.split('.');
    const expectedSig = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(dataB64)
      .digest('base64url');

    if (signature.length !== expectedSig.length) return null;
    const isValidSig = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
    if (!isValidSig) return null;

    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf-8')) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Đính kèm HttpOnly Session Cookie vào NextResponse
 */
export function attachSessionCookie(response: NextResponse, user: Pick<User, 'username' | 'role' | 'plan'>): NextResponse {
  const token = signSessionToken({
    username: user.username,
    role: user.role,
    plan: user.plan || 'free',
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 3600,
  });

  return response;
}

/**
 * Xóa Session Cookie khi đăng xuất
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/**
 * Đọc thông tin phiên đăng nhập từ NextRequest (Cookie)
 */
export function getSessionFromRequest(request: NextRequest | Request): SessionPayload | null {
  if ('cookies' in request && typeof request.cookies?.get === 'function') {
    const cookieVal = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    return verifySessionToken(cookieVal);
  }
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
  return verifySessionToken(match ? decodeURIComponent(match[1]) : null);
}

/**
 * Tạo và xác thực mã OTP 6 chữ số có chữ ký HMAC (Stateless + Firestore hybrid)
 */
export function createSignedOtpToken(email: string, otpCode: string, ttlSeconds = 300): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const normalizedEmail = email.trim().toLowerCase();
  const payload = JSON.stringify({ email: normalizedEmail, exp });
  const payloadB64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${payloadB64}:${otpCode}`)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySignedOtpToken(email: string, otpCode: string, otpToken: string): { valid: boolean; reason?: string } {
  if (!otpToken || !otpToken.includes('.')) {
    return { valid: false, reason: 'Mã xác thực OTP không hợp lệ.' };
  }
  try {
    const [payloadB64, sig] = otpToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as { email: string; exp: number };
    if (payload.email !== email.trim().toLowerCase()) {
      return { valid: false, reason: 'Email không khớp với mã xác minh đã gửi.' };
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng nhận mã mới.' };
    }
    const expectedSig = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${payloadB64}:${otpCode.trim()}`)
      .digest('base64url');

    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false, reason: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Lỗi xác thực mã OTP.' };
  }
}

/**
 * Kiểm tra xem gói cước hiện tại của người dùng còn hạn hay đã hết hạn
 */
export function resolveActivePlan(plan?: SubscriptionPlan, planExpiresAt?: string): {
  activePlan: SubscriptionPlan;
  isExpired: boolean;
  daysRemaining: number;
} {
  if (!plan || plan === 'free') {
    return { activePlan: 'free', isExpired: false, daysRemaining: 0 };
  }
  if (!planExpiresAt) {
    return { activePlan: plan, isExpired: false, daysRemaining: 30 };
  }
  const now = Date.now();
  const expTime = new Date(planExpiresAt).getTime();
  if (isNaN(expTime)) {
    return { activePlan: plan, isExpired: false, daysRemaining: 30 };
  }
  if (now > expTime) {
    return { activePlan: 'free', isExpired: true, daysRemaining: 0 };
  }
  const daysRemaining = Math.max(1, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));
  return { activePlan: plan, isExpired: false, daysRemaining };
}
