// lib/quota.ts
// Quản lý hạn mức sử dụng AI theo gói cước (Free / Pro / VIP) và phân quyền Model AI (Flash / Pro / Ultra)

import { NextRequest } from 'next/server';
import { AIModelTier, SubscriptionPlan } from '@/types';
import { getSessionFromRequest, resolveActivePlan } from './auth';
import { findUserInExcel, updateUserFieldsInExcel, isSuperAdminUsername, awardUserXpAndStreak } from './excel';

export const PLAN_DAILY_QUOTA: Record<SubscriptionPlan, number> = {
  free: 12,
  pro: 200,
  vip: 9999,
};

export interface QuotaCheckResult {
  allowed: boolean;
  effectivePlan: SubscriptionPlan;
  effectiveModelTier: AIModelTier;
  quotaUsed: number;
  quotaLimit: number;
  error?: string;
  upgradeRequired?: boolean;
}

/**
 * Kiểm tra quyền sử dụng Model AI và trừ 1 lượt Quota trong ngày (cộng thêm XP học tập)
 */
export async function checkAndConsumeAiQuota(
  request: NextRequest,
  requestedModel?: AIModelTier,
  xpReward = 5
): Promise<QuotaCheckResult> {
  const session = getSessionFromRequest(request);
  const requestedTier: AIModelTier = requestedModel || 'flash';

  // Nếu chưa có session cookie (chẳng hạn gọi API test trực tiếp hoặc khách dùng thử), cho phép dùng model flash
  if (!session?.username) {
    return {
      allowed: true,
      effectivePlan: 'free',
      effectiveModelTier: 'flash',
      quotaUsed: 0,
      quotaLimit: PLAN_DAILY_QUOTA.free,
    };
  }

  const rawUser = await findUserInExcel(session.username);
  if (!rawUser) {
    return {
      allowed: true,
      effectivePlan: 'free',
      effectiveModelTier: 'flash',
      quotaUsed: 0,
      quotaLimit: PLAN_DAILY_QUOTA.free,
    };
  }

  const isAdmin = isSuperAdminUsername(rawUser.Username) || rawUser.Role === 'admin';
  const rawPlan: SubscriptionPlan = isAdmin ? 'vip' : ((rawUser.Plan as SubscriptionPlan) || 'free');
  const { activePlan } = resolveActivePlan(rawPlan, rawUser.PlanExpiresAt);

  // Kiểm tra quyền truy cập Model AI cao cấp (Pro / Ultra)
  if (requestedTier === 'pro' && activePlan === 'free') {
    return {
      allowed: false,
      effectivePlan: activePlan,
      effectiveModelTier: 'flash',
      quotaUsed: Number(rawUser.AiQuotaUsed) || 0,
      quotaLimit: PLAN_DAILY_QUOTA[activePlan],
      upgradeRequired: true,
      error: 'Mô hình AI Tư Duy Sâu (Gemini 2.5 Pro Reasoning) chỉ dành cho thành viên gói Pro hoặc VIP. Vui lòng nâng cấp gói hoặc nhập Mã Code kích hoạt!',
    };
  }

  if (requestedTier === 'ultra' && activePlan !== 'vip') {
    return {
      allowed: false,
      effectivePlan: activePlan,
      effectiveModelTier: activePlan === 'pro' ? 'pro' : 'flash',
      quotaUsed: Number(rawUser.AiQuotaUsed) || 0,
      quotaLimit: PLAN_DAILY_QUOTA[activePlan],
      upgradeRequired: true,
      error: 'Mô hình AI Học Thuật Chuyên Gia (Ultra Academic) chỉ dành cho gói VIP Center. Vui lòng nâng cấp lên gói VIP!',
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentUsed = rawUser.AiQuotaDate === todayStr ? (Number(rawUser.AiQuotaUsed) || 0) : 0;
  const limit = PLAN_DAILY_QUOTA[activePlan];

  if (currentUsed >= limit && !isAdmin) {
    return {
      allowed: false,
      effectivePlan: activePlan,
      effectiveModelTier: requestedTier,
      quotaUsed: currentUsed,
      quotaLimit: limit,
      upgradeRequired: true,
      error: `Bạn đã sử dụng hết ${limit}/${limit} lượt gọi AI miễn phí trong hôm nay. Hãy nâng cấp gói Pro/VIP để mở khóa tới 200+ lượt/ngày và Model AI thông minh hơn!`,
    };
  }

  const newQuotaUsed = currentUsed + 1;
  // Cập nhật bất đồng bộ để không làm chậm tốc độ phản hồi AI
  updateUserFieldsInExcel(rawUser.Username, {
    AiQuotaUsed: newQuotaUsed,
    AiQuotaDate: todayStr,
    PreferredModel: requestedTier,
  }).catch(err => console.error('Lỗi cập nhật quota:', err));

  if (xpReward > 0) {
    awardUserXpAndStreak(rawUser.Username, xpReward).catch(() => {});
  }

  return {
    allowed: true,
    effectivePlan: activePlan,
    effectiveModelTier: requestedTier,
    quotaUsed: newQuotaUsed,
    quotaLimit: limit,
  };
}
