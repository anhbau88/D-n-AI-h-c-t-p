// lib/excel.ts
// Quản lý việc đọc/ghi tài khoản người dùng vào file Excel hoặc Firebase Firestore
// Hỗ trợ mã hóa mật khẩu scrypt, quản lý gói cước (free/pro/vip), thời hạn sử dụng, Quota AI, XP và Streak

import { db } from './firebase';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { SubscriptionPlan, AIModelTier, UserRole, User } from '@/types';
import { hashPassword, isPasswordHashed, resolveActivePlan } from './auth';

const filePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'users.xlsx') : 'users.xlsx';

// Danh sách tài khoản mặc định có quyền Super Admin (Chủ sở hữu hệ thống)
const SUPER_ADMIN_USERNAMES = (process.env.SUPER_ADMIN_USERNAMES || 'admin,tung1,anhbau88,anhbauyp88,anhbau888')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export function isSuperAdminUsername(username: string): boolean {
  return SUPER_ADMIN_USERNAMES.includes(String(username || '').trim().toLowerCase());
}

export interface ExcelUser {
  Username: string;
  FullName?: string;
  Email?: string;
  EmailVerified?: boolean;
  Password: string;
  Role: string;
  Room: string;
  Plan?: SubscriptionPlan;
  PlanActivatedAt?: string;
  PlanExpiresAt?: string;
  AiQuotaUsed?: number;
  AiQuotaDate?: string;
  PreferredModel?: AIModelTier;
  Xp?: number;
  Streak?: number;
  LastActiveDate?: string;
  CreatedAt: string;
}

const SEED_USERS: ExcelUser[] = [];

/**
 * Chuyển đổi bản ghi ExcelUser thô sang đối tượng User an toàn cho Client (tự động kiểm tra hết hạn gói)
 */
export function mapExcelUserToSafeUser(raw: ExcelUser): User {
  const rawPlan = (raw.Plan as SubscriptionPlan) || (isSuperAdminUsername(raw.Username) ? 'gv_pro' : 'free');
  const { activePlan } = resolveActivePlan(rawPlan, raw.PlanExpiresAt);
  const todayStr = new Date().toISOString().slice(0, 10);
  const aiQuotaUsed = raw.AiQuotaDate === todayStr ? (Number(raw.AiQuotaUsed) || 0) : 0;

  const planPointsMap: Record<string, number> = {
    free: 20,
    hs_basic: 250,
    hs_plus: 500,
    gv_basic: 1000,
    gv_pro: 2000,
    pro: 500,
    vip: 2000,
    topup_small: 100,
    topup_std: 300,
  };
  const totalPoints = planPointsMap[activePlan] || 20;
  const remainingPoints = Math.max(0, totalPoints - aiQuotaUsed);

  let role: UserRole = (raw.Role as UserRole) || 'student';
  if (isSuperAdminUsername(raw.Username) && role !== 'student') {
    // Cho phép tài khoản chủ hệ thống truy cập cả quyền giáo viên và admin
    role = raw.Role === 'admin' ? 'admin' : (raw.Role as UserRole);
  }

  const defaultModel: AIModelTier = (activePlan === 'gv_pro' || activePlan === 'vip')
    ? 'ultra'
    : (activePlan === 'gv_basic' || activePlan === 'hs_plus' || activePlan === 'pro')
    ? 'pro'
    : 'flash';

  return {
    username: raw.Username,
    fullName: raw.FullName || raw.Username,
    email: raw.Email || '',
    emailVerified: raw.EmailVerified !== undefined ? Boolean(raw.EmailVerified) : true,
    role,
    room: raw.Room || '',
    plan: isSuperAdminUsername(raw.Username) ? 'gv_pro' : activePlan,
    planActivatedAt: raw.PlanActivatedAt || '',
    planExpiresAt: raw.PlanExpiresAt || '',
    aiPoints: remainingPoints,
    aiPointsTotal: totalPoints,
    aiQuotaUsed,
    aiQuotaDate: todayStr,
    preferredModel: (raw.PreferredModel as AIModelTier) || defaultModel,
    xp: Number(raw.Xp) || 0,
    streak: Number(raw.Streak) || 1,
    lastActiveDate: raw.LastActiveDate || todayStr,
    createdAt: raw.CreatedAt,
  };
}

/**
 * Đọc toàn bộ danh sách người dùng (ưu tiên Firebase Firestore, fallback sang Excel cục bộ)
 */
export async function readUsersFromExcel(): Promise<ExcelUser[]> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  if (!isLocal && db) {
    try {
      const snapshot = await db.collection('users').get();
      if (snapshot.empty) return SEED_USERS;
      return snapshot.docs.map(doc => doc.data() as ExcelUser);
    } catch (error) {
      console.error('Lỗi đọc users từ Firebase:', error);
    }
  }

  // Fallback hoặc chạy local: Đọc Excel cục bộ
  try {
    if (!fs.existsSync(filePath)) {
      initExcelFile();
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as ExcelUser[];
    if (data.length === 0 && db) {
      const snapshot = await db.collection('users').get();
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => doc.data() as ExcelUser);
      }
    }
    return data;
  } catch (error) {
    console.error('Lỗi khi đọc file Excel:', error);
    return [];
  }
}

/**
 * Ghi danh sách người dùng xuống file Excel local
 */
function writeUsersToLocalExcel(users: ExcelUser[]) {
  try {
    const workbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(users);
    XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    console.error('Lỗi ghi file Excel cục bộ:', err);
  }
}

/**
 * Lưu một người dùng mới (tự động băm mật khẩu scrypt, ưu tiên Firebase Firestore + đồng bộ Excel cục bộ)
 */
export async function saveUserToExcel(user: {
  username: string;
  fullName?: string;
  email?: string;
  emailVerified?: boolean;
  password: string;
  role: string;
  room?: string;
  plan?: SubscriptionPlan;
}): Promise<boolean> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  const hashedPassword = isPasswordHashed(user.password) ? user.password : hashPassword(user.password);
  const todayStr = new Date().toISOString().slice(0, 10);
  const initialPlan: SubscriptionPlan = user.plan || (isSuperAdminUsername(user.username) ? 'vip' : 'free');

  const newUser: ExcelUser = {
    Username: user.username,
    FullName: user.fullName || '',
    Email: user.email || '',
    EmailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
    Password: hashedPassword,
    Role: user.role,
    Room: user.room || '',
    Plan: initialPlan,
    PlanActivatedAt: initialPlan !== 'free' ? new Date().toISOString() : '',
    PlanExpiresAt: '',
    AiQuotaUsed: 0,
    AiQuotaDate: todayStr,
    PreferredModel: initialPlan === 'vip' ? 'ultra' : initialPlan === 'pro' ? 'pro' : 'flash',
    Xp: 10, // Tặng 10 XP chào mừng thành viên mới
    Streak: 1,
    LastActiveDate: todayStr,
    CreatedAt: new Date().toISOString(),
  };

  if (isLocal) {
    let localSuccess = false;
    let data: ExcelUser[] = [];
    try {
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet) as ExcelUser[];
      } else {
        initExcelFile();
      }

      const exists = data.some(u => String(u.Username).toLowerCase() === user.username.toLowerCase());
      if (exists) return false;

      data.push(newUser);
      writeUsersToLocalExcel(data);
      localSuccess = true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel cục bộ:', error);
    }

    if (db && localSuccess) {
      db.collection('users').doc(user.username.toLowerCase()).set(newUser)
        .catch(err => console.error('Lỗi sync cloud:', err));
    }
    return localSuccess;
  }

  // Production: Lưu vào Firebase Firestore
  if (db) {
    const existingDoc = await db.collection('users').doc(user.username.toLowerCase()).get();
    if (existingDoc.exists) return false;

    try {
      await db.collection('users').doc(user.username.toLowerCase()).set(newUser);
      return true;
    } catch (error) {
      console.error('Lỗi ghi user vào Firebase:', error);
      return false;
    }
  }

  return false;
}

/**
 * Tìm kiếm người dùng theo tên tài khoản hoặc email
 */
export async function findUserInExcel(usernameOrEmail: string): Promise<ExcelUser | null> {
  const cleanKey = usernameOrEmail.trim().toLowerCase();
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  if (!isLocal && db) {
    try {
      const doc = await db.collection('users').doc(cleanKey).get();
      if (doc.exists) {
        return doc.data() as ExcelUser;
      }
      // Nếu không tìm thấy bằng docId, thử tìm theo Email
      if (cleanKey.includes('@')) {
        const snap = await db.collection('users').where('Email', '==', cleanKey).limit(1).get();
        if (!snap.empty) {
          return snap.docs[0].data() as ExcelUser;
        }
      }
      return null;
    } catch (error) {
      console.error('Lỗi tìm user trong Firebase:', error);
    }
  }

  // Fallback: đọc tất cả rồi filter
  const users = await readUsersFromExcel();
  const found = users.find(
    u =>
      String(u.Username).toLowerCase() === cleanKey ||
      (u.Email && String(u.Email).toLowerCase() === cleanKey)
  );
  return found || null;
}

/**
 * Cập nhật bất kỳ trường thông tin nào của người dùng (Plan, XP, Streak, Quota, Email, Role...)
 */
export async function updateUserFieldsInExcel(
  username: string,
  updates: Partial<ExcelUser>
): Promise<ExcelUser | null> {
  const cleanUsername = username.trim().toLowerCase();
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  if (!isLocal && db) {
    try {
      const docRef = db.collection('users').doc(cleanUsername);
      const snap = await docRef.get();
      if (!snap.exists) return null;
      const currentData = snap.data() as ExcelUser;
      const merged: ExcelUser = { ...currentData, ...updates };
      await docRef.set(merged, { merge: true });
      return merged;
    } catch (err) {
      console.error('Lỗi cập nhật user fields trên Firebase:', err);
      return null;
    }
  }

  // Chạy Local
  const currentUsers = await readUsersFromExcel();
  const idx = currentUsers.findIndex(u => String(u.Username).toLowerCase() === cleanUsername);
  if (idx === -1) return null;

  const merged: ExcelUser = { ...currentUsers[idx], ...updates };
  currentUsers[idx] = merged;
  writeUsersToLocalExcel(currentUsers);

  if (db) {
    db.collection('users')
      .doc(cleanUsername)
      .set(merged, { merge: true })
      .catch(err => console.error('Lỗi sync user fields lên Firebase:', err));
  }

  return merged;
}

/**
 * Cộng điểm kinh nghiệm (XP) và cập nhật Chuỗi ngày học (Streak 🔥) cho người dùng
 */
export async function awardUserXpAndStreak(username: string, xpDelta: number): Promise<User | null> {
  const user = await findUserInExcel(username);
  if (!user) return null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastActive = user.LastActiveDate || '';

  let newStreak = Number(user.Streak) || 1;
  if (lastActive === yesterday) {
    newStreak += 1;
  } else if (lastActive !== todayStr) {
    newStreak = 1;
  }

  const newXp = (Number(user.Xp) || 0) + Math.max(0, xpDelta);
  const updated = await updateUserFieldsInExcel(user.Username, {
    Xp: newXp,
    Streak: newStreak,
    LastActiveDate: todayStr,
  });

  return updated ? mapExcelUserToSafeUser(updated) : null;
}

/**
 * Cập nhật lớp học cho một người dùng
 */
export async function updateUserRoomInExcel(
  username: string,
  room: string,
  mode: 'add' | 'remove' | 'set' = 'add'
): Promise<boolean> {
  const user = await findUserInExcel(username);
  if (!user) return false;

  const existingRoom = String(user.Room || '');
  const existingRooms = existingRoom.split(',').map(r => r.trim()).filter(Boolean);

  let newRoomValue: string;
  if (mode === 'add') {
    if (room && !existingRooms.includes(room)) {
      existingRooms.push(room);
    }
    newRoomValue = existingRooms.join(',');
  } else if (mode === 'remove') {
    newRoomValue = existingRooms.filter(r => r !== room).join(',');
  } else {
    newRoomValue = room;
  }

  const updated = await updateUserFieldsInExcel(user.Username, { Room: newRoomValue });
  return Boolean(updated);
}

/**
 * Cập nhật mật khẩu đã băm cho một người dùng
 */
export async function updateUserPasswordInExcel(username: string, newPassword: string): Promise<boolean> {
  const hashed = isPasswordHashed(newPassword) ? newPassword : hashPassword(newPassword);
  const updated = await updateUserFieldsInExcel(username, { Password: hashed });
  return Boolean(updated);
}

/**
 * Khởi tạo file Excel ban đầu
 */
function initExcelFile() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([], {
    header: [
      'Username',
      'FullName',
      'Email',
      'EmailVerified',
      'Password',
      'Role',
      'Room',
      'Plan',
      'PlanActivatedAt',
      'PlanExpiresAt',
      'AiQuotaUsed',
      'AiQuotaDate',
      'PreferredModel',
      'Xp',
      'Streak',
      'LastActiveDate',
      'CreatedAt',
    ],
  });
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, buffer);
}

/**
 * Xóa một người dùng theo tên tài khoản
 */
export async function deleteUserInExcel(username: string): Promise<boolean> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  if (isLocal) {
    const currentUsers = await readUsersFromExcel();
    const initialLength = currentUsers.length;
    const filteredUsers = currentUsers.filter(u => String(u.Username).toLowerCase() !== username.toLowerCase());

    if (filteredUsers.length === initialLength) return false;

    try {
      writeUsersToLocalExcel(filteredUsers);
      if (db) {
        db.collection('users').doc(username.toLowerCase()).delete()
          .catch(err => console.error('Lỗi sync cloud delete:', err));
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel để xóa user cục bộ:', error);
      return false;
    }
  }

  // Production: Xóa từ Firebase
  if (db) {
    try {
      const doc = await db.collection('users').doc(username.toLowerCase()).get();
      if (!doc.exists) return false;

      await db.collection('users').doc(username.toLowerCase()).delete();
      return true;
    } catch (error) {
      console.error('Lỗi xóa user từ Firebase:', error);
      return false;
    }
  }

  return false;
}
