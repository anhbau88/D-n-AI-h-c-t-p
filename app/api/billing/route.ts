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
  readCoupons,
  saveCoupon,
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
      hotline: settings.hotline || '0923678668',
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
    // ACTION: KIỂM TRA & ÁP DỤNG MÃ GIẢM GIÁ (COUPON / VOUCHER)
    // =========================================================================
    if (action === 'validate_coupon') {
      const codeInput = String(body.code || '').trim().toUpperCase();
      const rawAmount = Number(body.amountVnd) || 99000;

      if (!codeInput) {
        return NextResponse.json({ error: 'Vui lòng nhập mã giảm giá.' }, { status: 400 });
      }

      const allCoupons = await readCoupons();
      const coupon = allCoupons.find(c => c.code.toUpperCase() === codeInput);

      if (!coupon) {
        return NextResponse.json({ error: 'Mã giảm giá không tồn tại hoặc đã hết hạn.' }, { status: 400 });
      }

      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return NextResponse.json({ error: 'Mã giảm giá này đã vượt quá số lượt sử dụng tối đa.' }, { status: 400 });
      }

      let discountVnd = 0;
      if (coupon.discountPercent) {
        discountVnd = Math.round((rawAmount * coupon.discountPercent) / 100);
      } else if (coupon.discountAmountVnd) {
        discountVnd = coupon.discountAmountVnd;
      }

      const finalAmountVnd = Math.max(10000, rawAmount - discountVnd);

      return NextResponse.json({
        success: true,
        code: coupon.code,
        description: coupon.description,
        discountVnd,
        finalAmountVnd,
        message: `Đã áp dụng mã ${coupon.code}: Giảm ${discountVnd.toLocaleString('vi-VN')}đ!`,
      });
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
      const baseAmountVnd = PLAN_PRICING_VND[plan][durationDays] || 99000;
      let amountVnd = baseAmountVnd;

      // Áp dụng mã giảm giá nếu có
      if (body.couponCode) {
        const allCoupons = await readCoupons();
        const coupon = allCoupons.find(c => c.code.toUpperCase() === String(body.couponCode).trim().toUpperCase());
        if (coupon) {
          let discount = 0;
          if (coupon.discountPercent) discount = Math.round((baseAmountVnd * coupon.discountPercent) / 100);
          else if (coupon.discountAmountVnd) discount = coupon.discountAmountVnd;
          amountVnd = Math.max(10000, baseAmountVnd - discount);
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await saveCoupon(coupon);
        }
      } else if (body.amountVnd && Number(body.amountVnd) > 0) {
        amountVnd = Number(body.amountVnd);
      }
      const nowIso = new Date().toISOString();
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;

      // Luôn tạo đơn ở trạng thái 'pending' chờ Quản trị viên xác nhận đã nhận tiền rồi mới sinh & gửi mã Code
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
        order: pendingOrder,
        orderId,
        plan,
        durationDays,
        email: targetEmail,
        amountVnd,
        message: `Đã ghi nhận yêu cầu đăng ký gói #${orderId} (${plan.toUpperCase()} - ${durationDays} ngày). Ngay sau khi Quản trị viên xác nhận đã nhận được tiền chuyển khoản, Mã Code kích hoạt sẽ được gửi tới Email ${targetEmail} và hiển thị tại danh sách đơn của bạn!`,
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
        message: `Đã xác nhận nhận tiền & duyệt đơn #${order.id}! Mã kích hoạt ${licenseCode} đã được gửi tới email ${order.email}.`,
      });
    }

    // =========================================================================
    // ACTION 4B: ADMIN TỪ CHỐI / HỦY ĐƠN CHƯA NHẬN ĐƯỢC TIỀN
    // =========================================================================
    if (action === 'admin_reject_order') {
      if (!isSuperAdminUsername(rawUser.Username) && rawUser.Role !== 'admin') {
        return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền từ chối đơn hàng.' }, { status: 403 });
      }

      const orderId = String(body.orderId || '');
      const allOrders = await readOrders();
      const order = allOrders.find(o => o.id === orderId);
      if (!order) {
        return NextResponse.json({ error: 'Không tìm thấy đơn hàng.' }, { status: 404 });
      }

      order.status = 'cancelled';
      await saveOrderItem(order);

      return NextResponse.json({
        success: true,
        order,
        message: `Đã hủy đơn #${order.id} (Chưa nhận được thanh toán).`,
      });
    }

    // =========================================================================
    // ACTION 4C: ADMIN TẠO MÃ GIẢM GIÁ (COUPON / VOUCHER)
    // =========================================================================
    if (action === 'admin_create_coupon') {
      if (!isSuperAdminUsername(rawUser.Username) && rawUser.Role !== 'admin') {
        return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền tạo mã ưu đãi.' }, { status: 403 });
      }

      const code = String(body.code || '').trim().toUpperCase();
      if (!code || code.length < 3) {
        return NextResponse.json({ error: 'Mã ưu đãi phải có ít nhất 3 ký tự.' }, { status: 400 });
      }

      const discountPercent = body.discountPercent ? Number(body.discountPercent) : undefined;
      const discountAmountVnd = body.discountAmountVnd ? Number(body.discountAmountVnd) : undefined;
      const description = String(body.description || 'Mã ưu đãi học tập').trim();
      const maxUses = body.maxUses ? Number(body.maxUses) : 100;

      const coupon = {
        code,
        discountPercent,
        discountAmountVnd,
        description,
        maxUses,
        usedCount: 0,
      };
      await saveCoupon(coupon);

      return NextResponse.json({
        success: true,
        coupon,
        message: `Đã tạo mã ưu đãi ${code} thành công!`,
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
        hotline: String(body.hotline || current.hotline || '0923678668').trim(),
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
