// app/api/admin/route.ts
// API Cổng Quản Trị Tối Cao (Super Admin Portal) dành cho Chủ Sở Hữu Phần Mềm

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '@/lib/firebase';
import { getSessionFromRequest } from '@/lib/auth';
import {
  readUsersFromExcel,
  findUserInExcel,
  updateUserFieldsInExcel,
  deleteUserInExcel,
  mapExcelUserToSafeUser,
  isSuperAdminUsername,
} from '@/lib/excel';
import { LicenseCodeItem, SubscriptionPlan } from '@/types';

export const dynamic = 'force-dynamic';

async function verifyAdminRequest(request: NextRequest, bodyUsername?: string) {
  const session = getSessionFromRequest(request);
  const candidate = session?.username || request.nextUrl.searchParams.get('adminUsername') || bodyUsername || '';
  if (!candidate) return null;

  const rawUser = await findUserInExcel(candidate);
  if (!rawUser) return null;

  if (isSuperAdminUsername(rawUser.Username) || rawUser.Role === 'admin') {
    return rawUser;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminRequest(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Truy cập bị từ chối. Chỉ dành cho Super Admin.' }, { status: 403 });
    }

    const allRawUsers = await readUsersFromExcel();
    const safeUsers = allRawUsers.map(u => mapExcelUserToSafeUser(u));

    let licenses: LicenseCodeItem[] = [];
    const localLicensesPath = process.env.LOCAL_DB_DIR
      ? path.join(process.env.LOCAL_DB_DIR, 'licenses.json')
      : 'licenses.json';

    if (db) {
      try {
        const snap = await db.collection('licenses').get();
        licenses = snap.docs.map(d => d.data() as LicenseCodeItem);
      } catch (err) {
        console.error('Lỗi đọc licenses trong /api/admin:', err);
      }
    }
    if (licenses.length === 0 && fs.existsSync(localLicensesPath)) {
      try {
        licenses = JSON.parse(fs.readFileSync(localLicensesPath, 'utf-8'));
      } catch {
        licenses = [];
      }
    }

    // Sắp xếp mã mới nhất lên đầu
    licenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stats = {
      totalUsers: safeUsers.length,
      totalTeachers: safeUsers.filter(u => u.role === 'teacher').length,
      totalStudents: safeUsers.filter(u => u.role === 'student').length,
      paidUsers: safeUsers.filter(u => u.plan === 'pro' || u.plan === 'vip').length,
      proUsers: safeUsers.filter(u => u.plan === 'pro').length,
      vipUsers: safeUsers.filter(u => u.plan === 'vip').length,
      totalAiCallsToday: safeUsers.reduce((sum, u) => sum + (u.aiQuotaUsed || 0), 0),
      totalLicenses: licenses.length,
      redeemedLicenses: licenses.filter(l => l.status === 'redeemed').length,
      estimatedRevenueVnd: licenses
        .filter(l => l.status === 'redeemed')
        .reduce((sum, l) => sum + (Number(l.amountVnd) || 99000), 0),
    };

    return NextResponse.json({
      stats,
      users: safeUsers,
      licenses,
    });
  } catch (err) {
    console.error('Lỗi GET /api/admin:', err);
    return NextResponse.json({ error: 'Lỗi tải dữ liệu quản trị.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const adminUser = await verifyAdminRequest(request, body.adminUsername);
    if (!adminUser) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền chỉnh sửa.' }, { status: 403 });
    }

    const { targetUsername, plan, durationDays, role } = body;
    if (!targetUsername) {
      return NextResponse.json({ error: 'Thiếu tên tài khoản cần cập nhật.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (plan && ['free', 'pro', 'vip'].includes(plan)) {
      updates.Plan = plan as SubscriptionPlan;
      if (plan === 'free') {
        updates.PlanExpiresAt = '';
        updates.PreferredModel = 'flash';
      } else {
        const days = Number(durationDays) || 30;
        updates.PlanActivatedAt = new Date().toISOString();
        updates.PlanExpiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
        updates.PreferredModel = plan === 'vip' ? 'ultra' : 'pro';
      }
    }

    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      updates.Role = role;
    }

    const updatedRaw = await updateUserFieldsInExcel(targetUsername, updates);
    if (!updatedRaw) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: mapExcelUserToSafeUser(updatedRaw),
    });
  } catch (err) {
    console.error('Lỗi PUT /api/admin:', err);
    return NextResponse.json({ error: 'Lỗi cập nhật người dùng.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const adminUser = await verifyAdminRequest(request, body.adminUsername);
    if (!adminUser) {
      return NextResponse.json({ error: 'Chỉ Super Admin mới có quyền xóa.' }, { status: 403 });
    }

    const { targetUsername } = body;
    if (!targetUsername) {
      return NextResponse.json({ error: 'Thiếu tên tài khoản cần xóa.' }, { status: 400 });
    }

    if (targetUsername.toLowerCase() === adminUser.Username.toLowerCase()) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản Admin của chính mình.' }, { status: 400 });
    }

    const ok = await deleteUserInExcel(targetUsername);
    if (!ok) {
      return NextResponse.json({ error: 'Không thể xóa tài khoản.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Lỗi DELETE /api/admin:', err);
    return NextResponse.json({ error: 'Lỗi xóa tài khoản.' }, { status: 500 });
  }
}
