// scripts/clean-data.js
// Script làm sạch dữ liệu: Đưa cơ sở dữ liệu về trạng thái trống hoàn toàn

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rootDir = path.join(__dirname, '..');

// Đọc biến môi trường tự chọn từ file cấu hình Next.js
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env[key] = val;
        }
      });
    }
  }
}

loadEnv();

async function uploadToBlob(filename, data, token) {
  const url = `https://blob.vercel-storage.com/${filename}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': '1',
        'x-add-random-suffix': 'false',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      console.log(`[Cloud] Đã reset file ${filename} trên Vercel Blob.`);
    } else {
      console.error(`[Cloud] Lỗi reset file ${filename} trên Vercel Blob: ${res.statusText}`);
    }
  } catch (error) {
    console.error(`[Cloud] Lỗi kết nối khi reset file ${filename}:`, error);
  }
}

async function run() {
  console.log('--- BẮT ĐẦU LÀM SẠCH DỮ LIỆU DỰ ÁN ---');

  // 1. Reset file Excel users.xlsx cục bộ
  const usersPath = path.join(rootDir, 'users.xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([], { 
    header: ['Username', 'FullName', 'Password', 'Role', 'Room', 'CreatedAt'] 
  });
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  XLSX.writeFile(workbook, usersPath);
  console.log('[Local] Đã reset users.xlsx về trạng thái trống (chỉ có header).');

  // 2. Reset các file JSON cơ sở dữ liệu cục bộ
  const dbFiles = {
    'classes.json': [],
    'documents.json': [],
    'assignments.json': [],
    'history.json': []
  };

  for (const [filename, emptyData] of Object.entries(dbFiles)) {
    const filePath = path.join(rootDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2), 'utf-8');
    console.log(`[Local] Đã reset ${filename} về trạng thái trống.`);
  }

  // 3. Xóa toàn bộ file tải lên cục bộ trong thư mục public/uploads
  const uploadsDir = path.join(rootDir, 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
      console.log('[Local] Đã xóa toàn bộ file trong thư mục public/uploads.');
    } catch (err) {
      console.error('[Local] Lỗi khi dọn dẹp thư mục public/uploads:', err);
    }
  }

  // 4. Nếu có token Vercel Blob, đồng bộ trạng thái sạch lên cloud
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    console.log('[Cloud] Phát hiện BLOB_READ_WRITE_TOKEN. Bắt đầu làm sạch Vercel Blob...');
    // users.json chứa mảng trống trên cloud
    await uploadToBlob('users.json', [], token);
    await uploadToBlob('classes.json', [], token);
    await uploadToBlob('documents.json', [], token);
    await uploadToBlob('assignments.json', [], token);
    await uploadToBlob('history.json', [], token);
  } else {
    console.log('[Cloud] Không tìm thấy BLOB_READ_WRITE_TOKEN. Bỏ qua bước dọn dẹp Vercel Blob.');
  }

  console.log('--- LÀM SẠCH DỮ LIỆU HOÀN TẤT ---');
}

run();
