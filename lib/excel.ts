// lib/excel.ts
// Quản lý việc đọc/ghi tài khoản người dùng vào file Excel hoặc Firebase Firestore

import { db } from './firebase';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'users.xlsx') : 'users.xlsx';

export interface ExcelUser {
  Username: string;
  FullName?: string;
  Password: string;
  Role: string;
  Room: string;
  CreatedAt: string;
}

const SEED_USERS: ExcelUser[] = [];

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

  // 2. Fallback hoặc chạy local: Đọc Excel cục bộ
  try {
    if (!fs.existsSync(filePath)) {
      initExcelFile();
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as ExcelUser[];
    return data;
  } catch (error) {
    console.error('Lỗi khi đọc file Excel:', error);
    return [];
  }
}

/**
 * Lưu một người dùng mới (ưu tiên Firebase Firestore, fallback sang Excel cục bộ)
 */
export async function saveUserToExcel(user: { username: string; fullName?: string; password: string; role: string; room?: string }): Promise<boolean> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  const newUser: ExcelUser = {
    Username: user.username,
    FullName: user.fullName || '',
    Password: user.password,
    Role: user.role,
    Room: user.room || '',
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
        const workbook = XLSX.utils.book_new();
        const newWorksheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        fs.writeFileSync(filePath, buffer);
      }

      const exists = data.some(u => String(u.Username).toLowerCase() === user.username.toLowerCase());
      if (exists) return false;

      data.push(newUser);

      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
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

  // 1. Ưu tiên lưu vào Firebase (Chạy trên Vercel production)
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
 * Tìm kiếm người dùng theo tên tài khoản
 */
export async function findUserInExcel(username: string): Promise<ExcelUser | null> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  if (!isLocal && db) {
    try {
      const doc = await db.collection('users').doc(username.toLowerCase()).get();
      if (!doc.exists) return null;
      return doc.data() as ExcelUser;
    } catch (error) {
      console.error('Lỗi tìm user trong Firebase:', error);
    }
  }

  // Fallback: đọc tất cả rồi filter
  const users = await readUsersFromExcel();
  const found = users.find(u => String(u.Username).toLowerCase() === username.toLowerCase());
  return found || null;
}

/**
 * Cập nhật lớp học cho một người dùng
 * mode = 'add': thêm lớp mới vào danh sách (mặc định)
 * mode = 'remove': xóa lớp khỏi danh sách
 * mode = 'set': ghi đè toàn bộ (dùng cho trường hợp đặc biệt)
 */
export async function updateUserRoomInExcel(username: string, room: string, mode: 'add' | 'remove' | 'set' = 'add'): Promise<boolean> {
  const currentUsers = await readUsersFromExcel();
  const userIndex = currentUsers.findIndex(u => String(u.Username).toLowerCase() === username.toLowerCase());
  if (userIndex === -1) return false;

  const existingRoom = String(currentUsers[userIndex].Room || '');
  const existingRooms = existingRoom.split(',').map(r => r.trim()).filter(Boolean);

  let newRoomValue: string;
  if (mode === 'add') {
    // Thêm lớp mới, tránh trùng lặp
    if (!existingRooms.includes(room)) {
      existingRooms.push(room);
    }
    newRoomValue = existingRooms.join(',');
  } else if (mode === 'remove') {
    // Xóa lớp khỏi danh sách
    newRoomValue = existingRooms.filter(r => r !== room).join(',');
  } else {
    // Ghi đè toàn bộ
    newRoomValue = room;
  }

  currentUsers[userIndex].Room = newRoomValue;

  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  if (isLocal) {
    try {
      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(currentUsers);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      
      if (db) {
        db.collection('users').doc(username.toLowerCase()).update({ Room: newRoomValue })
          .catch(err => console.error('Lỗi sync cloud room:', err));
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel để cập nhật room cục bộ:', error);
      return false;
    }
  }

  // Production: Cập nhật Firebase
  if (db) {
    try {
      await db.collection('users').doc(username.toLowerCase()).update({ Room: newRoomValue });
      return true;
    } catch (error) {
      console.error('Lỗi cập nhật room trong Firebase:', error);
      return false;
    }
  }

  return false;
}

/**
 * Cập nhật mật khẩu cho một người dùng
 */
export async function updateUserPasswordInExcel(username: string, newPassword: string): Promise<boolean> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';

  if (isLocal) {
    const currentUsers = await readUsersFromExcel();
    const userIndex = currentUsers.findIndex(u => String(u.Username).toLowerCase() === username.toLowerCase());
    if (userIndex === -1) return false;

    currentUsers[userIndex].Password = newPassword;

    try {
      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(currentUsers);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      
      if (db) {
        db.collection('users').doc(username.toLowerCase()).update({ Password: newPassword })
          .catch(err => console.error('Lỗi sync cloud password:', err));
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel để cập nhật mật khẩu cục bộ:', error);
      return false;
    }
  }

  // Production: Cập nhật Firebase
  if (db) {
    try {
      const doc = await db.collection('users').doc(username.toLowerCase()).get();
      if (!doc.exists) return false;

      await db.collection('users').doc(username.toLowerCase()).update({ Password: newPassword });
      return true;
    } catch (error) {
      console.error('Lỗi cập nhật mật khẩu trong Firebase:', error);
      return false;
    }
  }

  return false;
}


/**
 * Khởi tạo file Excel ban đầu với các tài khoản mẫu để chạy thử
 */
function initExcelFile() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([], { header: ['Username', 'FullName', 'Password', 'Role', 'Room', 'CreatedAt'] });
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

    // Nếu độ dài không đổi => User không tồn tại
    if (filteredUsers.length === initialLength) return false;

    try {
      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(filteredUsers);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      
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
