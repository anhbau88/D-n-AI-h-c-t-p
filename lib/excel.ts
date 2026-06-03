// lib/excel.ts
// Quản lý việc đọc/ghi tài khoản người dùng vào file Excel hoặc Vercel Blob

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'users.xlsx');

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

const SEED_USERS: ExcelUser[] = [
  {
    Username: 'giao-vien-1',
    Password: '123',
    Role: 'teacher',
    Room: '64CTT1',
    CreatedAt: new Date().toISOString(),
  },
  {
    Username: 'hoc-sinh-1',
    Password: '123',
    Role: 'student',
    Room: '64CTT1',
    CreatedAt: new Date().toISOString(),
  }
];

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
  const { BLOB_URL } = getBlobUrls();
  try {
    const res = await fetch(BLOB_URL, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    if (!res.ok) {
      if (res.status === 404) {
        // Tự động khởi tạo nếu chưa có file
        await saveUsersToBlob(SEED_USERS);
        return SEED_USERS;
      }
      return null;
    }
    const data = await res.json() as ExcelUser[];
    if (!data || data.length === 0) {
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
  // 1. Ưu tiên đọc từ Vercel Blob
  const blobUsers = await readUsersFromBlob();
  if (blobUsers !== null) {
    return blobUsers;
  }

  // 2. Fallback sang đọc Excel cục bộ
  try {
    if (!fs.existsSync(filePath)) {
      initExcelFile();
    }

    const workbook = XLSX.readFile(filePath);
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
  // 1. Ưu tiên lưu vào Vercel Blob
  const token = process.env.BLOB_READ_WRITE_TOKEN;
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

  // 2. Fallback sang ghi đè file Excel cục bộ
  try {
    let workbook;
    let data: ExcelUser[] = [];

    if (fs.existsSync(filePath)) {
      workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as ExcelUser[];
    } else {
      workbook = XLSX.utils.book_new();
    }

    // Đẩy thông tin người dùng mới vào mảng
    data.push({
      Username: user.username,
      FullName: user.fullName || '',
      Password: user.password,
      Role: user.role,
      Room: user.room || '',
      CreatedAt: new Date().toISOString(),
    });

    const newWorksheet = XLSX.utils.json_to_sheet(data);
    
    if (workbook.SheetNames.length > 0) {
      workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
    }

    XLSX.writeFile(workbook, filePath);
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi đè file Excel:', error);
    return false;
  }
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
 * Khởi tạo file Excel ban đầu với các tài khoản mẫu để chạy thử
 */
function initExcelFile() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(SEED_USERS);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  XLSX.writeFile(workbook, filePath);
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

  // 1. Ưu tiên lưu vào Vercel Blob
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    return await saveUsersToBlob(filteredUsers);
  }

  // 2. Fallback sang ghi đè file Excel cục bộ
  try {
    const workbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.json_to_sheet(filteredUsers);
    XLSX.utils.book_append_sheet(workbook, newWorksheet, 'Users');
    XLSX.writeFile(workbook, filePath);
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi đè file Excel để xóa user:', error);
    return false;
  }
}
