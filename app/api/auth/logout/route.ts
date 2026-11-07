// app/api/auth/logout/route.ts
// API Đăng xuất và xóa HttpOnly Session Cookie

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
