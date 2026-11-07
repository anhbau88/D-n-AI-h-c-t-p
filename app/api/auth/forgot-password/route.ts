// app/api/auth/forgot-password/route.ts
// API gửi mã OTP 6 chữ số qua Email để khôi phục mật khẩu tài khoản

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { readUsersFromExcel } from '@/lib/excel';
import { createSignedOtpToken } from '@/lib/auth';
import { sendForgotPasswordOtpEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();
    const cleanId = String(identifier || '').trim().toLowerCase();

    if (!cleanId) {
      return NextResponse.json(
        { error: 'Vui lòng nhập Tên đăng nhập hoặc Email của bạn.' },
        { status: 400 }
      );
    }

    const allUsers = await readUsersFromExcel();
    const targetUser = allUsers.find(
      u => u.Username.toLowerCase() === cleanId || (u.Email && u.Email.toLowerCase() === cleanId)
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản tương ứng với thông tin bạn đã nhập.' },
        { status: 404 }
      );
    }

    if (!targetUser.Email || !targetUser.Email.includes('@')) {
      return NextResponse.json(
        { error: `Tài khoản @${targetUser.Username} chưa được liên kết địa chỉ Email để khôi phục mật khẩu. Vui lòng liên hệ Hotline Zalo 0923678668 để được cấp lại.` },
        { status: 400 }
      );
    }

    // Sinh mã OTP 6 chữ số ký số HMAC
    const otpNumber = crypto.randomInt(100000, 999999);
    const otp = String(otpNumber);
    const token = createSignedOtpToken(targetUser.Email, otp, 600);

    const mailResult = await sendForgotPasswordOtpEmail(
      targetUser.Email,
      otp,
      targetUser.FullName || targetUser.Username
    );

    // Ẩn bớt email để bảo mật: e.g. anh***@gmail.com
    const [namePart, domainPart] = targetUser.Email.split('@');
    const maskedEmail = `${namePart.slice(0, 2)}***@${domainPart}`;

    return NextResponse.json({
      success: true,
      otpToken: token,
      email: targetUser.Email,
      maskedEmail,
      username: targetUser.Username,
      sandboxOtp: mailResult.sentViaProvider ? undefined : otp,
      message: mailResult.sentViaProvider
        ? `Đã gửi mã xác thực OTP 6 số đến email ${maskedEmail}. Vui lòng kiểm tra hộp thư!`
        : `[Chế độ Demo] Đã tạo mã OTP: ${otp}. Hãy nhập mã này để tiếp tục.`,
    });
  } catch (err) {
    console.error('Lỗi POST /api/auth/forgot-password:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi gửi yêu cầu khôi phục mật khẩu: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    );
  }
}
