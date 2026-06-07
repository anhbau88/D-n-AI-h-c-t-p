// lib/excel.ts
// Quản lý việc đọc/ghi tài khoản người dùng vào file Excel hoặc Vercel Blob

import { get } from '@vercel/blob';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'users.xlsx') : 'users.xlsx';

const getBlobUrls = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  return {
    BLOB_URL: `https://${storeId}.public.blob.vercel-storage.com/users.json`,
    API_URL: 'https://blob.vercel-storage.com/users.json'
  };
};

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
 * Ghi danh sách người dùng vào Vercel Blob
 */
async function saveUsersToBlob(users: ExcelUser[]): Promise<boolean> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  const { API_URL } = getBlobUrls();
  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': '1',
        'x-add-random-suffix': 'false',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(users),
    });
    return res.ok;
  } catch (error) {
    console.error('Lỗi ghi vào Vercel Blob:', error);
    return false;
  }
}

/**
 * Đọc danh sách người dùng từ Vercel Blob
 */
async function readUsersFromBlob(): Promise<ExcelUser[] | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const res = await get('users.json', { token, access: 'public' });
    if (!res || !res.stream) {
      // Tự động khởi tạo nếu chưa có file
      await saveUsersToBlob(SEED_USERS);
      return SEED_USERS;
    }
    const chunks = [];
    for await (const chunk of res.stream as any) {
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as ExcelUser[];
    if (!data) {
      return SEED_USERS;
    }
    return data;
  } catch (error) {
    console.error('Lỗi đọc từ Vercel Blob:', error);
    return null;
  }
}

/**
 * Đọc toàn bộ danh sách người dùng (ưu tiên Vercel Blob, fallback sang Excel cục bộ)
 */
export async function readUsersFromExcel(): Promise<ExcelUser[]> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  if (!isLocal) {
    const blobUsers = await readUsersFromBlob();
    if (blobUsers !== null) {
      return blobUsers;
    }
  }

  try {
    const rawData = fs.readFileSync(filePath);
    console.log('Direct fs.readFileSync succeeded at path:', filePath, 'Size:', rawData.length);
  } catch (err: any) {
    console.error('Direct fs.readFileSync failed at path:', filePath, 'Error:', err.message, 'Code:', err.code);
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
 * Lưu một người dùng mới (ưu tiên Vercel Blob, fallback sang Excel cục bộ)
 */
export async function saveUserToExcel(user: { username: string; fullName?: string; password: string; role: string; room?: string }): Promise<boolean> {
  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isLocal) {
    try {
      fs.writeFileSync(filePath + '.test', 'test');
      fs.unlinkSync(filePath + '.test');
      console.log('Direct fs write test succeeded at path:', filePath);
    } catch (err: any) {
      console.error('Direct fs write test failed at path:', filePath, 'Error:', err.message, 'Code:', err.code);
    }
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

      data.push({
        Username: user.username,
        FullName: user.fullName || '',
        Password: user.password,
        Role: user.role,
        Room: user.room || '',
        CreatedAt: new Date().toISOString(),
      });

      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      localSuccess = true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel cục bộ:', error);
    }

    if (token && localSuccess) {
      saveUsersToBlob(data).catch(err => console.error('Lỗi sync cloud:', err));
    }
    return localSuccess;
  }

  // 1. Ưu tiên lưu vào Vercel Blob (Chạy trên Vercel production)
  if (token) {
    const currentUsers = await readUsersFromBlob() || [];
    const exists = currentUsers.some(u => String(u.Username).toLowerCase() === user.username.toLowerCase());
    if (exists) return false;

    currentUsers.push({
      Username: user.username,
      FullName: user.fullName || '',
      Password: user.password,
      Role: user.role,
      Room: user.room || '',
      CreatedAt: new Date().toISOString(),
    });
    return await saveUsersToBlob(currentUsers);
  }

  return false;
}

/**
 * Tìm kiếm người dùng theo tên tài khoản
 */
export async function findUserInExcel(username: string): Promise<ExcelUser | null> {
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

  if (mode === 'add') {
    // Thêm lớp mới, tránh trùng lặp
    if (!existingRooms.includes(room)) {
      existingRooms.push(room);
    }
    currentUsers[userIndex].Room = existingRooms.join(',');
  } else if (mode === 'remove') {
    // Xóa lớp khỏi danh sách
    currentUsers[userIndex].Room = existingRooms.filter(r => r !== room).join(',');
  } else {
    // Ghi đè toàn bộ
    currentUsers[userIndex].Room = room;
  }

  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isLocal) {
    try {
      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(currentUsers);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      
      if (token) {
        saveUsersToBlob(currentUsers).catch(err => console.error('Lỗi sync cloud room:', err));
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel để cập nhật room cục bộ:', error);
      return false;
    }
  }

  // 1. Ưu tiên lưu vào Vercel Blob (Chạy trên Vercel production)
  if (token) {
    return await saveUsersToBlob(currentUsers);
  }

  return false;
}

/**
 * Cập nhật mật khẩu cho một người dùng
 */
export async function updateUserPasswordInExcel(username: string, newPassword: string): Promise<boolean> {
  const currentUsers = await readUsersFromExcel();
  const userIndex = currentUsers.findIndex(u => String(u.Username).toLowerCase() === username.toLowerCase());
  if (userIndex === -1) return false;

  currentUsers[userIndex].Password = newPassword;

  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isLocal) {
    try {
      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(currentUsers);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      
      if (token) {
        saveUsersToBlob(currentUsers).catch(err => console.error('Lỗi sync cloud password:', err));
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel để cập nhật mật khẩu cục bộ:', error);
      return false;
    }
  }

  // 1. Ưu tiên lưu vào Vercel Blob (Chạy trên Vercel production)
  if (token) {
    return await saveUsersToBlob(currentUsers);
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
  try {
    fs.writeFileSync(filePath + '.test', 'test');
    fs.unlinkSync(filePath + '.test');
    console.log('Direct fs write test succeeded in initExcelFile at path:', filePath);
  } catch (err: any) {
    console.error('Direct fs write test failed in initExcelFile at path:', filePath, 'Error:', err.message, 'Code:', err.code);
  }
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, buffer);
  console.log('Đã tạo file Excel seed tài khoản tại:', filePath);
}

/**
 * Xóa một người dùng theo tên tài khoản
 */
export async function deleteUserInExcel(username: string): Promise<boolean> {
  const currentUsers = await readUsersFromExcel();
  const initialLength = currentUsers.length;
  const filteredUsers = currentUsers.filter(u => String(u.Username).toLowerCase() !== username.toLowerCase());

  // Nếu độ dài không đổi => User không tồn tại
  if (filteredUsers.length === initialLength) return false;

  const isLocal = !process.env.VERCEL || process.env.NODE_ENV === 'development';
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (isLocal) {
    try {
      const workbook = XLSX.utils.book_new();
      const newWorksheet = XLSX.utils.json_to_sheet(filteredUsers);
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      fs.writeFileSync(filePath, buffer);
      
      if (token) {
        saveUsersToBlob(filteredUsers).catch(err => console.error('Lỗi sync cloud delete:', err));
      }
      return true;
    } catch (error) {
      console.error('Lỗi khi ghi đè file Excel để xóa user cục bộ:', error);
      return false;
    }
  }

  // 1. Ưu tiên lưu vào Vercel Blob (Chạy trên Vercel production)
  if (token) {
    return await saveUsersToBlob(filteredUsers);
  }

  return false;
}
