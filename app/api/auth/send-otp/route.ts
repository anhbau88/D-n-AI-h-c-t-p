// app/api/auth/send-otp/route.ts
// API tạo và gửi mã OTP 6 chữ số qua Email để xác minh khi đăng ký tài khoản mới

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { createSignedOtpToken } from '@/lib/auth';
import { sendRegistrationOtpEmail } from '@/lib/mailer';
import { findUserInExcel } from '@/lib/excel';

export async function POST(request: NextRequest) {
  try {
    const { email, username, fullName } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Vui lòng nhập địa chỉ Email hợp lệ.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kiểm tra xem username hoặc email đã tồn tại chưa
    if (username && username.trim()) {
      const existingByUsername = await findUserInExcel(username.trim());
      if (existingByUsername) {
        return NextResponse.json(
          { error: 'Tên đăng nhập đã tồn tại trên hệ thống.' },
          { status: 400 }
        );
      }
    }

    const existingByEmail = await findUserInExcel(cleanEmail);
    if (existingByEmail) {
      return NextResponse.json(
        { error: 'Địa chỉ Email này đã được đăng ký cho một tài khoản khác.' },
        { status: 400 }
      );
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên an toàn
    const otpNumber = crypto.randomInt(100000, 999999);
    const otpCode = String(otpNumber);

    // Ký token OTP có thời hạn 5 phút
    const otpToken = createSignedOtpToken(cleanEmail, otpCode, 300);

    // Gửi email
    const mailResult = await sendRegistrationOtpEmail(cleanEmail, otpCode, fullName);

    return NextResponse.json({
      success: true,
      otpToken,
      provider: mailResult.provider,
      // Nếu hệ thống chạy ở chế độ Sandbox (chưa cấu hình SMTP/Resend), trả kèm mã xác minh dùng thử để không chặn trải nghiệm
      sandboxOtpPreview: mailResult.sentViaProvider ? undefined : otpCode,
      message: mailResult.sentViaProvider
        ? `Mã xác minh 6 số đã được gửi tới ${cleanEmail}. Vui lòng kiểm tra hộp thư (bao gồm cả mục Spam).`
        : `Đã khởi tạo mã xác minh cho ${cleanEmail} (Chế độ Instant Verify: Mã OTP của bạn là ${otpCode}).`,
    });
  } catch (error) {
    console.error('Lỗi gửi OTP đăng ký:', error);
    return NextResponse.json(
      { error: 'Không thể gửi mã xác minh lúc này. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
