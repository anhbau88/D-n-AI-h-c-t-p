// app/api/auth/register/route.ts
// API Đăng ký tài khoản người dùng với xác minh OTP Email, băm mật khẩu scrypt và ghi vào Firestore/Excel

import { NextRequest, NextResponse } from 'next/server';
import { findUserInExcel, saveUserToExcel, mapExcelUserToSafeUser } from '@/lib/excel';
import { verifySignedOtpToken, attachSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const {
      username,
      fullName,
      email,
      otpCode,
      otpToken,
      password,
      confirmPassword,
      role,
      room
    } = await request.json();

    // 1. Kiểm tra đầu vào cơ bản
    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Tên đăng nhập không được để trống.' }, { status: 400 });
    }
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Họ và tên không được để trống.' }, { status: 400 });
    }
    if (!password || !password.trim() || password.trim().length < 4) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 4 ký tự.' }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Mật khẩu nhập lại không trùng khớp.' }, { status: 400 });
    }
    if (!role || (role !== 'student' && role !== 'teacher')) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ.' }, { status: 400 });
    }

    // 2. Xác minh OTP Email (nếu người dùng đăng ký qua giao diện chuẩn có email)
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    if (cleanEmail) {
      if (!otpCode || !otpToken) {
        return NextResponse.json(
          { error: 'Vui lòng nhấn "Nhận mã OTP" và nhập mã xác minh 6 số gửi tới Email của bạn.' },
          { status: 400 }
        );
      }
      const otpVerification = verifySignedOtpToken(cleanEmail, String(otpCode), String(otpToken));
      if (!otpVerification.valid) {
        return NextResponse.json({ error: otpVerification.reason || 'Mã OTP không chính xác.' }, { status: 400 });
      }
    }

    // 3. Kiểm tra tài khoản đã tồn tại chưa
    const existingUser = await findUserInExcel(username.trim());
    if (existingUser) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại trên hệ thống.' }, { status: 400 });
    }
    if (cleanEmail) {
      const existingEmail = await findUserInExcel(cleanEmail);
      if (existingEmail) {
        return NextResponse.json({ error: 'Email này đã được sử dụng cho một tài khoản khác.' }, { status: 400 });
      }
    }

    // 4. Tiến hành lưu vào Firestore / Excel (tự động băm mật khẩu scrypt)
    const success = await saveUserToExcel({
      username: username.trim(),
      fullName: fullName.trim(),
      email: cleanEmail,
      emailVerified: true,
      password: password.trim(),
      role,
      room: room ? room.trim() : '',
    });

    if (!success) {
      return NextResponse.json({ error: 'Lưu tài khoản thất bại. Vui lòng thử lại.' }, { status: 500 });
    }

    const savedRaw = await findUserInExcel(username.trim());
    const safeUser = savedRaw ? mapExcelUserToSafeUser(savedRaw) : {
      username: username.trim(),
      fullName: fullName.trim(),
      email: cleanEmail,
      emailVerified: true,
      role,
      room: room ? room.trim() : '',
      plan: 'free' as const,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Đăng ký và xác minh Email thành công!',
      user: safeUser,
    });

    return attachSessionCookie(response, safeUser);
  } catch (error) {
    console.error('Lỗi API đăng ký:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi trên server. Vui lòng thử lại.' }, { status: 500 });
  }
}
