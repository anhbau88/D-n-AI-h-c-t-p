// app/api/auth/reset-password/route.ts
// API xác minh mã OTP 6 số và cập nhật mật khẩu mới

import { NextRequest, NextResponse } from 'next/server';
import { findUserInExcel, updateUserFieldsInExcel } from '@/lib/excel';
import { verifySignedOtpToken, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username, email, otp, otpToken, newPassword } = await request.json();

    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();
    const cleanPass = String(newPassword || '').trim();

    if (!cleanUsername || !cleanEmail) {
      return NextResponse.json({ error: 'Thiếu thông tin tài khoản.' }, { status: 400 });
    }

    if (!cleanOtp || cleanOtp.length !== 6) {
      return NextResponse.json({ error: 'Mã xác thực OTP phải gồm 6 chữ số.' }, { status: 400 });
    }

    if (!cleanPass || cleanPass.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' }, { status: 400 });
    }

    // Xác minh mã OTP và chữ ký token
    const verification = verifySignedOtpToken(cleanEmail, cleanOtp, otpToken);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.reason || 'Mã OTP không hợp lệ.' }, { status: 400 });
    }

    const existingUser = await findUserInExcel(cleanUsername);
    if (!existingUser) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng.' }, { status: 404 });
    }

    // Mã hóa mật khẩu mới bằng scrypt
    const hashedPassword = await hashPassword(cleanPass);

    const updated = await updateUserFieldsInExcel(cleanUsername, {
      Password: hashedPassword,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Không thể cập nhật mật khẩu mới.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.',
    });
  } catch (err) {
    console.error('Lỗi POST /api/auth/reset-password:', err);
    return NextResponse.json(
      { error: 'Lỗi khi đặt lại mật khẩu: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    );
  }
}
