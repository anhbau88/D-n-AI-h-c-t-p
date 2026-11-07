// app/api/auth/me/route.ts
// API lấy thông tin tài khoản hiện tại từ Session Cookie (kèm kiểm tra thời hạn gói cước Pro/VIP)

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, attachSessionCookie } from '@/lib/auth';
import { findUserInExcel, mapExcelUserToSafeUser, updateUserFieldsInExcel } from '@/lib/excel';
import { AIModelTier } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const fallbackUsername = request.nextUrl.searchParams.get('username');
    const targetUsername = session?.username || fallbackUsername;

    if (!targetUsername) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const rawUser = await findUserInExcel(targetUsername);
    if (!rawUser) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const safeUser = mapExcelUserToSafeUser(rawUser);
    const response = NextResponse.json({
      authenticated: true,
      user: safeUser,
    });

    // Đồng bộ lại cookie nếu người dùng vừa mở lại web
    return attachSessionCookie(response, safeUser);
  } catch (err) {
    console.error('Lỗi API /api/auth/me:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const session = getSessionFromRequest(request);
    const targetUsername = session?.username || body.username;

    if (!targetUsername) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const updates: Record<string, unknown> = {};
    if (body.preferredModel && ['flash', 'pro', 'ultra'].includes(body.preferredModel)) {
      updates.PreferredModel = body.preferredModel as AIModelTier;
    }
    if (typeof body.email === 'string' && body.email.includes('@')) {
      updates.Email = body.email.trim().toLowerCase();
    }
    if (typeof body.fullName === 'string' && body.fullName.trim()) {
      updates.FullName = body.fullName.trim();
    }

    const updatedRaw = await updateUserFieldsInExcel(targetUsername, updates);
    if (!updatedRaw) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    const safeUser = mapExcelUserToSafeUser(updatedRaw);
    const response = NextResponse.json({ success: true, user: safeUser });
    return attachSessionCookie(response, safeUser);
  } catch (err) {
    console.error('Lỗi cập nhật profile /api/auth/me:', err);
    return NextResponse.json({ error: 'Lỗi cập nhật thông tin.' }, { status: 500 });
  }
}
