// lib/quota.ts
// Quản lý hạn mức sử dụng AI theo gói cước (Free / Pro / VIP) và phân quyền Model AI (Flash / Pro / Ultra)

import { NextRequest } from 'next/server';
import { AIModelTier, SubscriptionPlan } from '@/types';
import { getSessionFromRequest, resolveActivePlan } from './auth';
import { findUserInExcel, updateUserFieldsInExcel, isSuperAdminUsername, awardUserXpAndStreak } from './excel';

export const PLAN_MONTHLY_AI_POINTS: Record<SubscriptionPlan, number> = {
  free: 20,
  hs_basic: 250,
  hs_plus: 500,
  gv_basic: 1000,
  gv_pro: 2000,
  topup_small: 100,
  topup_std: 300,
  pro: 500,
  vip: 2000,
};

export const PLAN_DAILY_QUOTA: Record<SubscriptionPlan, number> = {
  free: 12,
  hs_basic: 50,
  hs_plus: 150,
  gv_basic: 300,
  gv_pro: 9999,
  topup_small: 50,
  topup_std: 100,
  pro: 150,
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
  const isProAllowed = ['hs_plus', 'gv_basic', 'gv_pro', 'pro', 'vip'].includes(activePlan);
  if (requestedTier === 'pro' && !isProAllowed) {
    return {
      allowed: false,
      effectivePlan: activePlan,
      effectiveModelTier: 'flash',
      quotaUsed: Number(rawUser.AiQuotaUsed) || 0,
      quotaLimit: PLAN_DAILY_QUOTA[activePlan],
      upgradeRequired: true,
      error: 'Mô hình AI Tư Duy Sâu (Gemini 3.5 Pro Reasoning) dành cho thành viên gói HS Plus hoặc Giáo viên. Vui lòng nâng cấp gói hoặc nhập Mã Code kích hoạt!',
    };
  }

  const isUltraAllowed = ['hs_plus', 'gv_basic', 'gv_pro', 'pro', 'vip'].includes(activePlan);
  if (requestedTier === 'ultra' && !isUltraAllowed) {
    return {
      allowed: false,
      effectivePlan: activePlan,
      effectiveModelTier: activePlan === 'pro' ? 'pro' : 'flash',
      quotaUsed: Number(rawUser.AiQuotaUsed) || 0,
      quotaLimit: PLAN_DAILY_QUOTA[activePlan],
      upgradeRequired: true,
      error: 'Mô hình AI Chuyên Sâu (Gemini 3.8 Flash) dành cho gói HS Plus hoặc Giáo viên Pro. Vui lòng nâng cấp gói!',
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
