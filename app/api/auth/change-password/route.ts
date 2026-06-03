// app/api/auth/change-password/route.ts
// API Đổi mật khẩu tài khoản người dùng

import { NextRequest, NextResponse } from 'next/server';
import { findUserInExcel, updateUserPasswordInExcel } from '@/lib/excel';

export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    // 1. Kiểm tra đầu vào
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Tên đăng nhập không được để trống.' }, { status: 400 });
    }
    if (!currentPassword || !currentPassword.trim()) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không được để trống.' }, { status: 400 });
    }
    if (!newPassword || !newPassword.trim()) {
      return NextResponse.json({ error: 'Mật khẩu mới không được để trống.' }, { status: 400 });
    }

    // 2. Tìm tài khoản trong Excel
    const user = await findUserInExcel(username.trim());
    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại.' }, { status: 400 });
    }

    // 3. So khớp mật khẩu cũ
    if (String(user.Password) !== currentPassword.trim()) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không chính xác.' }, { status: 400 });
    }

    // 4. Tiến hành cập nhật mật khẩu mới
    const success = await updateUserPasswordInExcel(username.trim(), newPassword.trim());
    if (!success) {
      return NextResponse.json({ error: 'Cập nhật mật khẩu thất bại. Vui lòng thử lại.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    console.error('Lỗi API đổi mật khẩu:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server. Vui lòng thử lại.' }, { status: 500 });
  }
}
