// app/api/auth/login/route.ts
// API Đăng nhập, tự động nâng cấp mật khẩu băm scrypt, cập nhật chuỗi ngày học (Streak) và cấp HttpOnly Cookie

import { NextRequest, NextResponse } from 'next/server';
import {
  findUserInExcel,
  updateUserPasswordInExcel,
  awardUserXpAndStreak,
  mapExcelUserToSafeUser,
} from '@/lib/excel';
import { verifyPassword, attachSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 1. Kiểm tra đầu vào
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập hoặc Email.' }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập mật khẩu.' }, { status: 400 });
    }

    // 2. Tìm tài khoản trong Firestore / Excel (hỗ trợ cả Username lẫn Email)
    const user = await findUserInExcel(username.trim());
    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại. Vui lòng đăng ký mới.' }, { status: 400 });
    }

    // 3. Xác thực mật khẩu (hỗ trợ cả scrypt hash và plain-text cũ)
    const { valid, needsRehash } = verifyPassword(password.trim(), String(user.Password));
    if (!valid) {
      return NextResponse.json({ error: 'Mật khẩu không chính xác.' }, { status: 400 });
    }

    // 4. Tự động chuyển đổi mật khẩu cũ sang scrypt hash để bảo mật
    if (needsRehash) {
      await updateUserPasswordInExcel(user.Username, password.trim());
    }

    // 5. Cập nhật chuỗi ngày học (Streak 🔥) và cộng 5 XP đăng nhập mỗi ngày
    const updatedSafeUser = (await awardUserXpAndStreak(user.Username, 5)) || mapExcelUserToSafeUser(user);

    // 6. Trả về thông tin người dùng và gắn HttpOnly Session Cookie
    const response = NextResponse.json({
      success: true,
      user: updatedSafeUser,
    });

    return attachSessionCookie(response, updatedSafeUser);
  } catch (error) {
    console.error('Lỗi API đăng nhập:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server. Vui lòng thử lại.' }, { status: 500 });
  }
}
