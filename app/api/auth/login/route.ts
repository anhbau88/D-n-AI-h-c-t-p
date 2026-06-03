// app/api/auth/login/route.ts
// API Đăng nhập và xác thực tài khoản từ file Excel

import { NextRequest, NextResponse } from 'next/server';
import { findUserInExcel } from '@/lib/excel';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // 1. Kiểm tra đầu vào
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập.' }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập mật khẩu.' }, { status: 400 });
    }

    // 2. Tìm tài khoản trong Excel
    const user = await findUserInExcel(username.trim());
    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại. Vui lòng đăng ký mới.' }, { status: 400 });
    }

    // 3. So khớp mật khẩu
    if (String(user.Password) !== password.trim()) {
      return NextResponse.json({ error: 'Mật khẩu không chính xác.' }, { status: 400 });
    }

    // 4. Trả về thông tin người dùng đăng nhập thành công
    return NextResponse.json({
      success: true,
      user: {
        username: user.Username,
        fullName: user.FullName,
        role: user.Role,
        room: user.Room || '',
      }
    });
  } catch (error) {
    console.error('Lỗi API đăng nhập:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server. Vui lòng thử lại.' }, { status: 500 });
  }
}
