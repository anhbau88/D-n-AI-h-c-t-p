// app/api/auth/register/route.ts
// API Đăng ký tài khoản người dùng và ghi vào file Excel

import { NextRequest, NextResponse } from 'next/server';
import { findUserInExcel, saveUserToExcel } from '@/lib/excel';

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, password, confirmPassword, role, room } = await request.json();

    // 1. Kiểm tra đầu vào
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Tên đăng nhập không được để trống.' }, { status: 400 });
    }
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Họ và tên không được để trống.' }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Mật khẩu không được để trống.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Mật khẩu nhập lại không trùng khớp.' }, { status: 400 });
    }
    if (!role || (role !== 'student' && role !== 'teacher')) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ.' }, { status: 400 });
    }
    // 2. Kiểm tra tài khoản đã tồn tại chưa
    const existingUser = await findUserInExcel(username.trim());
    if (existingUser) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại trên hệ thống.' }, { status: 400 });
    }

    // 3. Tiến hành lưu vào Excel
    const newUser = {
      username: username.trim(),
      fullName: fullName.trim(),
      password: password.trim(),
      role,
      room: room ? room.trim() : '',
    };

    const success = await saveUserToExcel(newUser);
    if (!success) {
      return NextResponse.json({ error: 'Lưu tài khoản thất bại. Vui lòng thử lại.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đăng ký tài khoản thành công.' });
  } catch (error) {
    console.error('Lỗi API đăng ký:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server. Vui lòng thử lại.' }, { status: 500 });
  }
}
