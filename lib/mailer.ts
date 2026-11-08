// lib/mailer.ts
// Dịch vụ gửi Email xác minh OTP đăng ký tài khoản & gửi Mã Code kích hoạt gói cước Pro/VIP

export interface EmailSendResult {
  sentViaProvider: boolean;
  provider: 'resend' | 'google_script' | 'sandbox';
  message: string;
}

/**
 * Gửi email qua Resend API hoặc Google Apps Script Webhook (nếu đã cấu hình),
 * hoặc chế độ Smart Sandbox để đảm bảo không bao giờ làm kẹt luồng trải nghiệm của người dùng.
 */
async function dispatchEmail(to: string, subject: string, html: string): Promise<EmailSendResult> {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (process.env.EMAIL_FROM || 'AI Study Assistant <onboarding@resend.dev>').trim();

  // 1. Ưu tiên gửi qua Resend REST API nếu có RESEND_API_KEY
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });
      if (res.ok) {
        return {
          sentViaProvider: true,
          provider: 'resend',
          message: `Đã gửi email thành công tới ${to}`,
        };
      } else {
        const errText = await res.text();
        console.warn('[Mailer] Resend API trả về lỗi, chuyển sang chế độ dự phòng:', errText);
      }
    } catch (err) {
      console.warn('[Mailer] Lỗi kết nối Resend API:', err);
    }
  }

  // 2. Hỗ trợ Google Apps Script Email Webhook (Miễn phí 100% với Gmail cá nhân)
  const gasWebhookUrl = (process.env.EMAIL_WEBHOOK_URL || '').trim();
  if (gasWebhookUrl) {
    try {
      const res = await fetch(gasWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      });
      if (res.ok) {
        return {
          sentViaProvider: true,
          provider: 'google_script',
          message: `Đã gửi email qua Gmail Webhook tới ${to}`,
        };
      }
    } catch (err) {
      console.warn('[Mailer] Lỗi kết nối EMAIL_WEBHOOK_URL:', err);
    }
  }

  // 3. Chế độ Smart Sandbox (Khi chưa cấu hình SMTP/Resend trên môi trường chạy thử)
  console.log(`\n========================================`);
  console.log(`📧 [EMAIL DISPATCH SANDBOX] Tới: ${to}`);
  console.log(`📌 Tiêu đề: ${subject}`);
  console.log(`========================================\n`);

  return {
    sentViaProvider: false,
    provider: 'sandbox',
    message: `Hệ thống đã khởi tạo thư xác thực cho ${to}.`,
  };
}

/**
 * Gửi mã OTP 6 chữ số để xác minh địa chỉ Email khi đăng ký tài khoản
 */
export async function sendRegistrationOtpEmail(email: string, otpCode: string, fullName?: string): Promise<EmailSendResult> {
  const subject = `[AI Study Assistant] Mã xác minh tài khoản của bạn là: ${otpCode}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">AI Study Assistant</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Nền tảng Học tập & Khảo thí Trí tuệ nhân tạo</p>
      </div>
      <div style="padding: 28px 24px; color: #1e293b;">
        <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>${fullName || email}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Cảm ơn bạn đã đăng ký tài khoản tại <strong>AI Study Assistant</strong>. Để hoàn tất quá trình xác minh địa chỉ email, vui lòng nhập mã OTP gồm 6 chữ số dưới đây:
        </p>
        <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; text-align: center;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">${otpCode}</span>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">Mã xác minh có hiệu lực trong vòng <strong>05 phút</strong>.</p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
        </p>
      </div>
    </div>
  `;

  return dispatchEmail(email, subject, html);
}

/**
 * Gửi Mã Code Kích Hoạt Gói Cước (Pro / VIP) tự động sinh tới Email người dùng
 */
export async function sendLicenseCodeEmail(params: {
  email: string;
  fullName?: string;
  plan: string;
  durationDays: number;
  licenseCode: string;
}): Promise<EmailSendResult> {
  const planMap: Record<string, string> = {
    hs_basic: 'Học Sinh Cơ Bản (250 Điểm AI)',
    hs_plus: 'Học Sinh Plus (500 Điểm AI & Audio)',
    gv_basic: 'Giáo Viên Cơ Bản (1.000 Điểm AI)',
    gv_pro: 'Giáo Viên Pro (2.000 Điểm AI)',
    topup_small: 'Nạp Thêm Nhỏ (+100 Điểm AI)',
    topup_std: 'Nạp Thêm Tiêu Chuẩn (+300 Điểm AI)',
    pro: 'Học Sinh Plus (500 Điểm AI)',
    vip: 'Giáo Viên Pro (2.000 Điểm AI)',
  };
  const planName = planMap[params.plan] || params.plan.toUpperCase();
  const subject = `[AI Study Assistant] Mã kích hoạt gói ${planName} (${params.durationDays} ngày): ${params.licenseCode}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5, #9333ea); padding: 28px 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🎉 Mã Kích Hoạt Gói Cước AI Study Assistant</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Mở khóa Model AI Tư Duy Sâu & Trọn bộ tính năng Pro</p>
      </div>
      <div style="padding: 28px 24px; color: #1e293b;">
        <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>${params.fullName || params.email}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Yêu cầu đăng ký gói <strong>${planName}</strong> với thời hạn <strong>${params.durationDays} ngày</strong> của bạn đã được khởi tạo thành công. Dưới đây là mã kích hoạt độc quyền của bạn:
        </p>
        <div style="margin: 24px 0; padding: 22px; background: linear-gradient(135deg, #eef2ff, #f5f3ff); border: 2px solid #6366f1; border-radius: 14px; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #6366f1; letter-spacing: 1px;">MÃ CODE KÍCH HOẠT CỦA BẠN</p>
          <span style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #312e81; font-family: monospace; background: #ffffff; padding: 8px 16px; border-radius: 8px; border: 1px solid #c7d2fe; display: inline-block;">${params.licenseCode}</span>
          <p style="margin: 12px 0 0; font-size: 12px; color: #475569;">
            Gói cước: <strong>${planName}</strong> • Thời hạn: <strong>${params.durationDays} ngày</strong>
          </p>
        </div>
        <h4 style="font-size: 14px; margin-bottom: 8px; color: #1e293b;">Hướng dẫn kích hoạt trong 5 giây:</h4>
        <ol style="font-size: 13px; line-height: 1.7; color: #475569; padding-left: 20px;">
          <li>Đăng nhập vào ứng dụng <strong>AI Study Assistant</strong>.</li>
          <li>Bấm vào nút <strong>"💎 Nâng cấp Pro / Nhập Code"</strong> trên thanh công cụ.</li>
          <li>Dán mã <code>${params.licenseCode}</code> vào ô <strong>Nhập Mã Kích Hoạt</strong> và nhấn <strong>Kích hoạt ngay</strong>.</li>
        </ol>
      </div>
    </div>
  `;

  return dispatchEmail(params.email, subject, html);
}


/**
 * Gửi mã OTP 6 chữ số để lấy lại mật khẩu tài khoản
 */
export async function sendForgotPasswordOtpEmail(email: string, otpCode: string, fullName?: string): Promise<EmailSendResult> {
  const subject = `[AI Study Assistant] Mã xác nhận đặt lại mật khẩu: ${otpCode}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 28px 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🔒 Đặt Lại Mật Khẩu Tài Khoản</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Hệ thống học tập AI Study Assistant</p>
      </div>
      <div style="padding: 28px 24px; color: #1e293b;">
        <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>${fullName || email}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
          Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này. Vui lòng nhập mã OTP gồm 6 chữ số dưới đây để tạo mật khẩu mới:
        </p>
        <div style="margin: 24px 0; padding: 20px; background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; text-align: center;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #e11d48; font-family: monospace;">${otpCode}</span>
          <p style="margin: 8px 0 0; font-size: 12px; color: #9f1239;">Mã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã cho người khác.</p>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email. Mật khẩu hiện tại của bạn vẫn an toàn.
        </p>
      </div>
    </div>
  `;

  return dispatchEmail(email, subject, html);
}
