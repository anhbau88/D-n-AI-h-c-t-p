// lib/billing-store.ts
// Lưu trữ và quản lý Mã Code Kích Hoạt (License Keys), Đơn Hàng (Subscription Orders) & Cấu Hình Ngân Hàng VietQR

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '@/lib/firebase';
import { LicenseCodeItem, SubscriptionOrder } from '@/types';

const localLicensesPath = process.env.LOCAL_DB_DIR
  ? path.join(process.env.LOCAL_DB_DIR, 'licenses.json')
  : 'licenses.json';

const localOrdersPath = process.env.LOCAL_DB_DIR
  ? path.join(process.env.LOCAL_DB_DIR, 'orders.json')
  : 'orders.json';

const localBillingSettingsPath = process.env.LOCAL_DB_DIR
  ? path.join(process.env.LOCAL_DB_DIR, 'billing_settings.json')
  : 'billing_settings.json';

export interface BillingConfigSettings {
  bankId: string;
  accountNo: string;
  accountName: string;
  hotline?: string;
  /**
   * 'instant': Khách bấm xác nhận chuyển khoản là tự sinh Code gửi Email ngay (phù hợp trải nghiệm nhanh / Demo).
   * 'manual_review': Tạo đơn chờ duyệt (Pending), chỉ khi Admin bấm "Duyệt & Gửi Code" hoặc Webhook Ngân hàng báo tiền về mới gửi Code.
   */
  approvalMode: 'instant' | 'manual_review';
  updatedAt?: string;
}

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

export async function readBillingSettings(): Promise<BillingConfigSettings> {
  const defaultSettings: BillingConfigSettings = {
    bankId: process.env.VIETQR_BANK_ID || 'MB',
    accountNo: process.env.VIETQR_ACCOUNT_NO || '0988888888',
    accountName: process.env.VIETQR_ACCOUNT_NAME || 'AI STUDY ASSISTANT',
    hotline: process.env.SUPPORT_PHONE || '0923678668',
    approvalMode: (process.env.BILLING_APPROVAL_MODE as 'instant' | 'manual_review') || 'manual_review',
  };

  if (db) {
    try {
      const doc = await db.collection('settings').doc('billing_config').get();
      if (doc.exists) {
        const data = doc.data() as Partial<BillingConfigSettings>;
        return {
          bankId: data.bankId || defaultSettings.bankId,
          accountNo: data.accountNo || defaultSettings.accountNo,
          accountName: data.accountName || defaultSettings.accountName,
          hotline: data.hotline || defaultSettings.hotline,
          approvalMode: data.approvalMode || defaultSettings.approvalMode,
          updatedAt: data.updatedAt,
        };
      }
    } catch (err) {
      console.error('Lỗi đọc billing_config từ Firebase:', err);
    }
  }

  if (fs.existsSync(localBillingSettingsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(localBillingSettingsPath, 'utf-8'));
      return { ...defaultSettings, ...parsed };
    } catch {
      // ignore
    }
  }

  return defaultSettings;
}

export async function saveBillingSettings(settings: BillingConfigSettings): Promise<void> {
  const payload: BillingConfigSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  if (db) {
    try {
      await db.collection('settings').doc('billing_config').set(payload, { merge: true });
    } catch (err) {
      console.error('Lỗi lưu billing_config lên Firebase:', err);
    }
  }
  try {
    fs.writeFileSync(localBillingSettingsPath, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi lưu billing_config local:', err);
  }
}

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

export function parseAndVerifySelfSignedCode(code: string): { valid: boolean; plan?: 'pro' | 'vip'; durationDays?: number } {
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

export async function readLicenses(): Promise<LicenseCodeItem[]> {
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

export async function saveLicenseItem(item: LicenseCodeItem) {
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

export async function readOrders(): Promise<SubscriptionOrder[]> {
  if (db) {
    try {
      const snap = await db.collection('orders').get();
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as SubscriptionOrder);
      }
    } catch (err) {
      console.error('Lỗi đọc orders từ Firebase:', err);
    }
  }
  if (fs.existsSync(localOrdersPath)) {
    try {
      return JSON.parse(fs.readFileSync(localOrdersPath, 'utf-8')) as SubscriptionOrder[];
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveOrderItem(order: SubscriptionOrder) {
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
    const idx = list.findIndex(x => x.id === order.id);
    if (idx >= 0) list[idx] = order;
    else list.unshift(order);
    fs.writeFileSync(localOrdersPath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi lưu order local:', err);
  }
}


export interface DiscountCoupon {
  code: string;
  discountPercent?: number; // e.g. 20 (20%)
  discountAmountVnd?: number; // e.g. 50000 (50.000đ)
  description?: string;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
}

const localCouponsPath = process.env.LOCAL_DB_DIR
  ? path.join(process.env.LOCAL_DB_DIR, 'coupons.json')
  : 'coupons.json';

const DEFAULT_COUPONS: DiscountCoupon[] = [
  { code: 'CHAOHOC2026', discountPercent: 20, description: 'Ưu đãi năm học mới giảm 20%', usedCount: 0 },
  { code: 'VIPPRO50K', discountAmountVnd: 50000, description: 'Giảm trực tiếp 50.000đ', usedCount: 0 },
  { code: 'AISA30', discountPercent: 30, description: 'Tri ân người dùng mới giảm 30%', usedCount: 0 },
];

export async function readCoupons(): Promise<DiscountCoupon[]> {
  if (db) {
    try {
      const snap = await db.collection('coupons').get();
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as DiscountCoupon);
      }
    } catch (err) {
      console.error('Lỗi đọc coupons từ Firebase:', err);
    }
  }
  if (fs.existsSync(localCouponsPath)) {
    try {
      return JSON.parse(fs.readFileSync(localCouponsPath, 'utf-8')) as DiscountCoupon[];
    } catch {
      return DEFAULT_COUPONS;
    }
  }
  return DEFAULT_COUPONS;
}

export async function saveCoupon(coupon: DiscountCoupon) {
  if (db) {
    try {
      await db.collection('coupons').doc(coupon.code.toUpperCase()).set(coupon);
    } catch (err) {
      console.error('Lỗi lưu coupon Firebase:', err);
    }
  }
  try {
    const list = await readCoupons();
    const idx = list.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (idx >= 0) list[idx] = coupon;
    else list.push(coupon);
    fs.writeFileSync(localCouponsPath, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi lưu coupon local:', err);
  }
}
