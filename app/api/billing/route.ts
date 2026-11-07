// app/api/billing/route.ts
// API quản lý Gói cước (Pro / VIP), Tự động Sinh Mã Code Kích Hoạt (License Key) gửi qua Email & Nhập Code Kích Hoạt

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '@/lib/firebase';
import { getSessionFromRequest, attachSessionCookie } from '@/lib/auth';
import {
  findUserInExcel,
  updateUserFieldsInExcel,
  mapExcelUserToSafeUser,
  isSuperAdminUsername,
} from '@/lib/excel';
import { sendLicenseCodeEmail } from '@/lib/mailer';
import { LicenseCodeItem, SubscriptionOrder, SubscriptionPlan } from '@/types';

export const dynamic = 'force-dynamic';

const localLicensesPath = process.env.LOCAL_DB_DIR
  ? path.join(process.env.LOCAL_DB_DIR, 'licenses.json')
  : 'licenses.json';

const localOrdersPath = process.env.LOCAL_DB_DIR
  ? path.join(process.env.LOCAL_DB_DIR, 'orders.json')
  : 'orders.json';

// Bảng giá niêm yết (VND) theo Gói & Kỳ hạn (7 ngày, 30 ngày, 90 ngày, 365 ngày)
export const PLAN_PRICING_VND: Record<'pro' | 'vip', Record<number, number>> = {
  pro: {
    7: 29000,
    30: 99000,
    90: 249000,
    365: 799000,
  },
  vip: {
    7: 79000,
    30: 299000,
    90: 749000,
    365: 2390000,
  },
};

const LICENSE_SIGN_SECRET = process.env.AUTH_SECRET || 'aisa-license-secret-key-2026';

/**
 * Tạo Mã Code Kích Hoạt tự sinh có gắn chữ ký chống giả mạo:
 * Định dạng: AISA-<PRO|VIP>-<DAYS>D-<RANDOM4>-<CHECKSUM4>
 * Ví dụ: AISA-PRO-30D-8K4M-F92A
 */
export function generateSignedLicenseCode(plan: 'pro' | 'vip', durationDays: number): string {
  const planTag = plan.toUpperCase();
  const daysTag = `${durationDays}D`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randPart = '';
  for (let i = 0; i < 4; i++) {
    randPart += chars.charAt(crypto.randomInt(0, chars.length));
  }
  const core = `AISA-${planTag}-${daysTag}-${randPart}`;
  const checksum = crypto
    .createHmac('sha256', LICENSE_SIGN_SECRET)
    .update(core)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase();
  return `${core}-${checksum}`;
}

/**
 * Kiểm tra chữ ký tự thân của Mã Code (trong trường hợp DB chưa kịp sync hoặc mã phát hành nhanh)
 */
function parseAndVerifySelfSignedCode(code: string): { valid: boolean; plan?: 'pro' | 'vip'; durationDays?: number } {
  const normalized = code.trim().toUpperCase();
  const match = normalized.match(/^AISA-(PRO|VIP)-(\d+)D-([A-Z0-9]{4})-([A-F0-9]{4})$/);
  if (!match) return { valid: false };

  const [, planStr, daysStr, randPart, providedChecksum] = match;
  const core = `AISA-${planStr}-${daysStr}D-${randPart}`;
  const expectedChecksum = crypto
    .createHmac('sha256', LICENSE_SIGN_SECRET)
    .update(core)
    .digest('hex')
    .slice(0, 4)
    .toUpperCase();

  if (providedChecksum !== expectedChecksum) {
    return { valid: false };
  }

  return {
    valid: true,
    plan: planStr.toLowerCase() as 'pro' | 'vip',
    durationDays: parseInt(daysStr, 10),
  };
}

async function readLicenses(): Promise<LicenseCodeItem[]> {
  if (db) {
    try {
      const snap = await db.collection('licenses').get();
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as LicenseCodeItem);
      }
    } catch (err) {
      console.error('Lỗi đọc licenses từ Firebase:', err);
    }
  }
  if (fs.existsSync(localLicensesPath)) {
    try {
      return JSON.parse(fs.readFileSync(localLicensesPath, 'utf-8')) as LicenseCodeItem[];
    } catch {
      return [];
    }
  }
  return [];
}

async function saveLicenseItem(item: LicenseCodeItem) {
  if (db) {
    try {
      await db.collection('licenses').doc(item.code).set(item);
    } catch (err) {
      console.error('Lỗi lưu license lên Firebase:', err);
    }
  }
  try {
    let list: LicenseCodeItem[] = [];
    if (fs.existsSync(localLicensesPath)) {
      list = JSON.parse(fs.readFileSync(localLicensesPath, 'utf-8'));
    }
    const idx = list.findIndex(x => x.code === item.code);
    if (idx >= 0) list[idx] = item;
    else list.push(item);
    fs.writeFileSync(localLicensesPath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi lưu license local:', err);
  }
}

async function saveOrderItem(order: SubscriptionOrder) {
  if (db) {
    try {
      await db.collection('orders').doc(order.id).set(order);
    } catch (err) {
      console.error('Lỗi lưu order lên Firebase:', err);
    }
  }
  try {
    let list: SubscriptionOrder[] = [];
    if (fs.existsSync(localOrdersPath)) {
      list = JSON.parse(fs.readFileSync(localOrdersPath, 'utf-8'));
    }
    list.unshift(order);
    fs.writeFileSync(localOrdersPath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi lưu order local:', err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    const username = request.nextUrl.searchParams.get('username') || session?.username;

    // Trả về cấu hình ngân hàng VietQR nhận thanh toán & danh sách mã code đã tạo của user
    const bankConfig = {
      bankId: process.env.VIETQR_BANK_ID || 'MB',
      accountNo: process.env.VIETQR_ACCOUNT_NO || '0988888888',
      accountName: process.env.VIETQR_ACCOUNT_NAME || 'AI STUDY ASSISTANT',
      pricing: PLAN_PRICING_VND,
    };

    if (!username) {
      return NextResponse.json({ bankConfig, myCodes: [] });
    }

    const allLicenses = await readLicenses();
    const myCodes = allLicenses.filter(
      c => c.targetUsername?.toLowerCase() === username.toLowerCase()
    );

    return NextResponse.json({ bankConfig, myCodes });
  } catch (err) {
    console.error('Lỗi GET /api/billing:', err);
    return NextResponse.json({ error: 'Không thể tải thông tin thanh toán.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
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
    // ACTION 1: ĐĂNG KÝ GÓI CƯỚC -> TỰ ĐỘNG SINH MÃ CODE & GỬI VỀ EMAIL
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

      // Cập nhật email cho user nếu trước đó chưa có
      if (!rawUser.Email) {
        await updateUserFieldsInExcel(rawUser.Username, { Email: targetEmail, EmailVerified: true });
      }

      const licenseCode = generateSignedLicenseCode(plan, durationDays);
      const amountVnd = PLAN_PRICING_VND[plan][durationDays] || 99000;
      const nowIso = new Date().toISOString();

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
        id: `ORD-${Date.now()}`,
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

        // Đánh dấu mã đã sử dụng
        foundLicense.status = 'redeemed';
        foundLicense.redeemedBy = rawUser.Username;
        foundLicense.redeemedAt = new Date().toISOString();
        await saveLicenseItem(foundLicense);
      } else {
        // Kiểm tra chữ ký tự thân của mã code (Self-signed verification)
        const verifiedSelf = parseAndVerifySelfSignedCode(inputCode);
        if (!verifiedSelf.valid || !verifiedSelf.plan || !verifiedSelf.durationDays) {
          return NextResponse.json(
            { error: 'Mã Code kích hoạt không tồn tại hoặc không đúng định dạng. Vui lòng kiểm tra lại!' },
            { status: 400 }
          );
        }
        targetPlan = verifiedSelf.plan;
        durationDays = verifiedSelf.durationDays;

        // Lưu lại vào danh sách đã sử dụng để không thể dùng lần 2
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

      // Tính toán thời gian hết hạn (cộng dồn nếu gói hiện tại vẫn còn hạn)
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

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err) {
    console.error('Lỗi POST /api/billing:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xử lý gói cước: ' + (err instanceof Error ? err.message : 'Unknown') },
      { status: 500 }
    );
  }
}
