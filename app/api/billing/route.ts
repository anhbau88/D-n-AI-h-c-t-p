// app/api/billing/route.ts
// API quản lý Gói cước (Pro / VIP), Cấu hình Ngân hàng Động, Duyệt Đơn Thanh Toán, Webhook Ngân hàng SePay/Casso & Tự động Sinh Mã Code gửi qua Email

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, attachSessionCookie } from '@/lib/auth';
import {
  findUserInExcel,
  updateUserFieldsInExcel,
  mapExcelUserToSafeUser,
  isSuperAdminUsername,
} from '@/lib/excel';
import { sendLicenseCodeEmail } from '@/lib/mailer';
import {
  BillingConfigSettings,
  PLAN_PRICING_VND,
  readBillingSettings,
  saveBillingSettings,
  generateSignedLicenseCode,
  parseAndVerifySelfSignedCode,
  readLicenses,
  saveLicenseItem,
  readOrders,
  saveOrderItem,
} from '@/lib/billing-store';
import { LicenseCodeItem, SubscriptionOrder, SubscriptionPlan } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const username = request.nextUrl.searchParams.get('username') || session?.username;
    const settings = await readBillingSettings();

    const bankConfig = {
      bankId: settings.bankId,
      accountNo: settings.accountNo,
      accountName: settings.accountName,
      approvalMode: settings.approvalMode,
      pricing: PLAN_PRICING_VND,
    };

    if (!username) {
      return NextResponse.json({ bankConfig, myCodes: [], myOrders: [] });
    }

    const [allLicenses, allOrders] = await Promise.all([readLicenses(), readOrders()]);
    const myCodes = allLicenses.filter(
      c => c.targetUsername?.toLowerCase() === username.toLowerCase()
    );
    const myOrders = allOrders.filter(
      o => o.username?.toLowerCase() === username.toLowerCase()
    );

    return NextResponse.json({ bankConfig, myCodes, myOrders });
  } catch (err) {
    console.error('Lỗi GET /api/billing:', err);
    return NextResponse.json({ error: 'Không thể tải thông tin thanh toán.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // =========================================================================
    // ACTION 0: WEBHOOK NGÂN HÀNG TỰ ĐỘNG (SEPAY / CASSO / PAYOS)
    // =========================================================================
    if (action === 'bank_webhook' || body.transferAmount || body.content) {
      const contentStr = String(body.content || body.description || '').toUpperCase();
      const allOrders = await readOrders();
      const pendingOrder = allOrders.find(
        o => o.status === 'pending' && (contentStr.includes(o.id.toUpperCase()) || contentStr.includes(o.username.toUpperCase()))
      );
      if (!pendingOrder) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy đơn chờ khớp với nội dung chuyển khoản.' });
      }

      const licenseCode = generateSignedLicenseCode(pendingOrder.plan, pendingOrder.durationDays);
      const newLicense: LicenseCodeItem = {
        code: licenseCode,
        plan: pendingOrder.plan,
        durationDays: pendingOrder.durationDays,
        status: 'unused',
        targetEmail: pendingOrder.email,
        targetUsername: pendingOrder.username,
        createdBy: 'bank_webhook',
        createdAt: new Date().toISOString(),
        amountVnd: pendingOrder.amountVnd,
      };
      pendingOrder.licenseCode = licenseCode;
      pendingOrder.status = 'code_sent';

      await Promise.all([saveLicenseItem(newLicense), saveOrderItem(pendingOrder)]);
      await sendLicenseCodeEmail({
        email: pendingOrder.email,
        fullName: pendingOrder.fullName,
        plan: pendingOrder.plan,
        durationDays: pendingOrder.durationDays,
        licenseCode,
      });

      return NextResponse.json({
        success: true,
        orderId: pendingOrder.id,
        licenseCode,
        message: 'Đã tự động duyệt đơn qua Webhook Ngân hàng và gửi Mã Code qua Email.',
      });
    }

    const session = getSessionFromRequest(request);
    const username = session?.username || body.username;

    if (!username) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện giao dịch.' }, { status: 401 });
    }

    const rawUser = await findUserInExcel(username);
    if (!rawUser) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng.' }, { status: 404 });
    }

    // =========================================================================
    // ACTION 1: ĐĂNG KÝ GÓI CƯỚC -> SINH MÃ CODE GỬI EMAIL (HOẶC TẠO ĐƠN CHỜ DUYỆT)
    // =========================================================================
    if (action === 'register_plan') {
      const plan: 'pro' | 'vip' = body.plan === 'vip' ? 'vip' : 'pro';
      const durationDays = [7, 30, 90, 365].includes(Number(body.durationDays))
        ? Number(body.durationDays)
        : 30;
      const targetEmail = (body.email || rawUser.Email || '').trim().toLowerCase();

      if (!targetEmail || !targetEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Vui lòng nhập địa chỉ Email nhận Mã Code kích hoạt gói.' },
          { status: 400 }
        );
      }

      if (!rawUser.Email) {
        await updateUserFieldsInExcel(rawUser.Username, { Email: targetEmail, EmailVerified: true });
      }

      const settings = await readBillingSettings();
      const amountVnd = PLAN_PRICING_VND[plan][durationDays] || 99000;
      const nowIso = new Date().toISOString();
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      if (settings.approvalMode === 'manual_review' && !isSuperAdminUsername(rawUser.Username) && rawUser.Role !== 'admin') {
        const pendingOrder: SubscriptionOrder = {
          id: orderId,
          username: rawUser.Username,
          fullName: rawUser.FullName || rawUser.Username,
          email: targetEmail,
          plan,
          durationDays,
          amountVnd,
          licenseCode: '',
          status: 'pending',
          createdAt: nowIso,
        };
        await saveOrderItem(pendingOrder);

        return NextResponse.json({
          success: true,
          pendingApproval: true,
          orderId,
          plan,
          durationDays,
          email: targetEmail,
          message: `Đã ghi nhận đơn đăng ký #${orderId} cho gói ${plan.toUpperCase()} (${durationDays} ngày). Ngay sau khi hệ thống xác nhận giao dịch chuyển khoản, Mã Code kích hoạt sẽ được gửi tự động tới email ${targetEmail}!`,
        });
      }

      const licenseCode = generateSignedLicenseCode(plan, durationDays);

      const newLicense: LicenseCodeItem = {
        code: licenseCode,
        plan,
        durationDays,
        status: 'unused',
        targetEmail,
        targetUsername: rawUser.Username,
        createdBy: rawUser.Username,
        createdAt: nowIso,
        amountVnd,
      };

      const newOrder: SubscriptionOrder = {
        id: orderId,
        username: rawUser.Username,
        fullName: rawUser.FullName || rawUser.Username,
        email: targetEmail,
        plan,
        durationDays,
        amountVnd,
        licenseCode,
        status: 'code_sent',
        createdAt: nowIso,
      };

      await Promise.all([
        saveLicenseItem(newLicense),
        saveOrderItem(newOrder),
      ]);

      const mailRes = await sendLicenseCodeEmail({
        email: targetEmail,
        fullName: rawUser.FullName || rawUser.Username,
        plan,
        durationDays,
        licenseCode,
      });

      return NextResponse.json({
        success: true,
        licenseCode,
        plan,
        durationDays,
        email: targetEmail,
        sentViaProvider: mailRes.sentViaProvider,
        message: mailRes.sentViaProvider
          ? `Đã sinh mã kích hoạt gói ${plan.toUpperCase()} (${durationDays} ngày) và gửi tới email ${targetEmail}! Bạn hãy nhập mã code để kích hoạt.`
          : `Đã khởi tạo thành công mã kích hoạt gói ${plan.toUpperCase()} (${durationDays} ngày): ${licenseCode}. Vui lòng nhập mã này ở bước kích hoạt!`,
      });
    }

    // =========================================================================
    // ACTION 2: NHẬP MÃ CODE KÍCH HOẠT GÓI (REDEEM CODE) -> MỞ KHÓA THEO THỜI HẠN
    // =========================================================================
    if (action === 'redeem_code') {
      const inputCode = String(body.code || '').trim().toUpperCase();
      if (!inputCode) {
        return NextResponse.json({ error: 'Vui lòng nhập Mã Code kích hoạt.' }, { status: 400 });
      }

      const allLicenses = await readLicenses();
      const foundLicense = allLicenses.find(x => x.code.toUpperCase() === inputCode);

      let targetPlan: SubscriptionPlan = 'pro';
      let durationDays = 30;

      if (foundLicense) {
        if (foundLicense.status === 'redeemed') {
          return NextResponse.json(
            { error: `Mã Code ${inputCode} đã được sử dụng trước đó (bởi ${foundLicense.redeemedBy || 'người dùng khác'}).` },
            { status: 400 }
          );
        }
        targetPlan = foundLicense.plan;
        durationDays = foundLicense.durationDays;

        foundLicense.status = 'redeemed';
        foundLicense.redeemedBy = rawUser.Username;
        foundLicense.redeemedAt = new Date().toISOString();
        await saveLicenseItem(foundLicense);
      } else {
        const verifiedSelf = parseAndVerifySelfSignedCode(inputCode);
        if (!verifiedSelf.valid || !verifiedSelf.plan || !verifiedSelf.durationDays) {
          return NextResponse.json(
            { error: 'Mã Code kích hoạt không tồn tại hoặc không đúng định dạng. Vui lòng kiểm tra lại!' },
            { status: 400 }
          );
        }
        targetPlan = verifiedSelf.plan;
        durationDays = verifiedSelf.durationDays;

        await saveLicenseItem({
          code: inputCode,
          plan: targetPlan,
          durationDays,
          status: 'redeemed',
          targetUsername: rawUser.Username,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          redeemedBy: rawUser.Username,
          redeemedAt: new Date().toISOString(),
        });
      }

      const nowMs = Date.now();
      const existingExpMs = rawUser.PlanExpiresAt ? new Date(rawUser.PlanExpiresAt).getTime() : 0;
      const baseMs = existingExpMs > nowMs ? existingExpMs : nowMs;
      const newExpiresAt = new Date(baseMs + durationDays * 24 * 3600 * 1000).toISOString();

      const preferredModel = targetPlan === 'vip' ? 'ultra' : 'pro';
      const bonusXp = targetPlan === 'vip' ? 200 : 100;

      const updatedRaw = await updateUserFieldsInExcel(rawUser.Username, {
        Plan: targetPlan,
        PlanActivatedAt: new Date().toISOString(),
        PlanExpiresAt: newExpiresAt,
        PreferredModel: preferredModel,
        Xp: (Number(rawUser.Xp) || 0) + bonusXp,
      });

      if (!updatedRaw) {
        return NextResponse.json({ error: 'Không thể cập nhật trạng thái gói cho tài khoản.' }, { status: 500 });
      }

      const safeUser = mapExcelUserToSafeUser(updatedRaw);
      const response = NextResponse.json({
        success: true,
        user: safeUser,
        plan: targetPlan,
        durationDays,
        expiresAt: newExpiresAt,
        message: `🎉 Kích hoạt thành công gói ${targetPlan.toUpperCase()} (${durationDays} ngày)! Đã mở khóa Model AI ${targetPlan === 'vip' ? 'Ultra Academic' : 'Pro 2.5 Reasoning'} và tặng +${bonusXp} XP!`,
      });

      return attachSessionCookie(response, safeUser);
    }

    // =========================================================================
    // ACTION 3: ADMIN TẠO MÃ CODE HÀNG LOẠT HOẶC ĐƠN LẺ
    // =========================================================================
    if (action === 'admin_generate_codes') {
      if (!isSuperAdminUsername(rawUser.Username) && rawUser.Role !== 'admin') {
        return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền phát hành mã kích hoạt.' }, { status: 403 });
      }

      const plan: 'pro' | 'vip' = body.plan === 'vip' ? 'vip' : 'pro';
      const durationDays = Number(body.durationDays) || 30;
      const count = Math.min(20, Math.max(1, Number(body.count) || 1));
      const recipientEmail = body.recipientEmail ? String(body.recipientEmail).trim().toLowerCase() : '';

      const generatedCodes: LicenseCodeItem[] = [];
      for (let i = 0; i < count; i++) {
        const code = generateSignedLicenseCode(plan, durationDays);
        const item: LicenseCodeItem = {
          code,
          plan,
          durationDays,
          status: 'unused',
          targetEmail: recipientEmail || undefined,
          createdBy: rawUser.Username,
          createdAt: new Date().toISOString(),
          amountVnd: PLAN_PRICING_VND[plan][durationDays] || 99000,
        };
        await saveLicenseItem(item);
        generatedCodes.push(item);
      }

      if (recipientEmail && generatedCodes.length > 0) {
        await sendLicenseCodeEmail({
          email: recipientEmail,
          plan,
          durationDays,
          licenseCode: generatedCodes[0].code,
        });
      }

      return NextResponse.json({
        success: true,
        codes: generatedCodes,
        message: `Đã phát hành ${generatedCodes.length} mã kích hoạt gói ${plan.toUpperCase()} (${durationDays} ngày).`,
      });
    }

    // =========================================================================
    // ACTION 4: ADMIN DUYỆT ĐƠN CHUYỂN KHOẢN -> TỰ SINH MÃ CODE & GỬI EMAIL KHÁCH
    // =========================================================================
    if (action === 'admin_approve_order') {
      if (!isSuperAdminUsername(rawUser.Username) && rawUser.Role !== 'admin') {
        return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền duyệt đơn hàng.' }, { status: 403 });
      }

      const orderId = String(body.orderId || '');
      const allOrders = await readOrders();
      const order = allOrders.find(o => o.id === orderId);
      if (!order) {
        return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
      }

      const licenseCode = order.licenseCode || generateSignedLicenseCode(order.plan, order.durationDays);
      const newLicense: LicenseCodeItem = {
        code: licenseCode,
        plan: order.plan,
        durationDays: order.durationDays,
        status: 'unused',
        targetEmail: order.email,
        targetUsername: order.username,
        createdBy: rawUser.Username,
        createdAt: new Date().toISOString(),
        amountVnd: order.amountVnd,
      };

      order.licenseCode = licenseCode;
      order.status = 'code_sent';

      await Promise.all([saveLicenseItem(newLicense), saveOrderItem(order)]);
      await sendLicenseCodeEmail({
        email: order.email,
        fullName: order.fullName,
        plan: order.plan,
        durationDays: order.durationDays,
        licenseCode,
      });

      return NextResponse.json({
        success: true,
        order,
        licenseCode,
        message: `Đã duyệt đơn #${order.id}! Mã kích hoạt ${licenseCode} đã được gửi tới email ${order.email}.`,
      });
    }

    // =========================================================================
    // ACTION 5: ADMIN CẬP NHẬT CẤU HÌNH NGÂN HÀNG VIETQR & CHẾ ĐỘ DUYỆT ĐƠN
    // =========================================================================
    if (action === 'admin_update_settings') {
      if (!isSuperAdminUsername(rawUser.Username) && rawUser.Role !== 'admin') {
        return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền cấu hình thanh toán.' }, { status: 403 });
      }

      const current = await readBillingSettings();
      const updated: BillingConfigSettings = {
        bankId: String(body.bankId || current.bankId).trim().toUpperCase(),
        accountNo: String(body.accountNo || current.accountNo).trim(),
        accountName: String(body.accountName || current.accountName).trim().toUpperCase(),
        approvalMode: body.approvalMode === 'manual_review' ? 'manual_review' : 'instant',
      };

      await saveBillingSettings(updated);
      return NextResponse.json({
        success: true,
        settings: updated,
        message: 'Đã lưu cấu hình Ngân hàng VietQR và chế độ duyệt đơn thành công!',
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err) {
    console.error('Lỗi POST /api/billing:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý gói cước: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    );
  }
}
