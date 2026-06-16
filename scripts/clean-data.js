/* eslint-disable */
// scripts/clean-data.js
// Script làm sạch dữ liệu: Đưa cơ sở dữ liệu về trạng thái trống hoàn toàn (Local & Cloud Firestore/Storage)

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const rootDir = path.join(__dirname, '..');

// Đọc biến môi trường từ file cấu hình
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

// Khởi tạo Firebase Admin SDK
function initFirebase() {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: storageBucket?.replace(/^gs:\/\//, ''),
    });
  } catch (err) {
    console.error('[Firebase] Lỗi khởi tạo Firebase Admin SDK:', err);
    return null;
  }
}

// Hàm xóa toàn bộ tài liệu trong bộ sưu tập Firestore
async function deleteCollection(db, collectionPath) {
  try {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`[Firestore] Bộ sưu tập '${collectionPath}' đã trống.`);
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`[Firestore] Đã xóa toàn bộ ${snapshot.size} tài liệu trong bộ sưu tập '${collectionPath}'.`);
  } catch (error) {
    console.error(`[Firestore] Lỗi khi xóa bộ sưu tập '${collectionPath}':`, error);
  }
}

// Hàm xóa toàn bộ tệp trong Firebase Storage folder
async function clearStorage(app) {
  if (!app) return;
  try {
    const bucket = getStorage(app).bucket();
    const [files] = await bucket.getFiles({ prefix: 'uploads/' });
    if (files.length === 0) {
      console.log('[Firebase Storage] Thư mục uploads/ đã trống.');
      return;
    }
    for (const file of files) {
      await file.delete();
    }
    console.log(`[Firebase Storage] Đã xóa ${files.length} tệp trong thư mục uploads/.`);
  } catch (err) {
    console.error('[Firebase Storage] Lỗi dọn dẹp Storage:', err);
  }
}

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
      console.log(`[Cloud Blob] Đã reset file ${filename} trên Vercel Blob.`);
    } else {
      console.error(`[Cloud Blob] Lỗi reset file ${filename} trên Vercel Blob: ${res.statusText}`);
    }
  } catch (error) {
    console.error(`[Cloud Blob] Lỗi kết nối khi reset file ${filename}:`, error);
  }
}

async function run() {
  console.log('--- BẮT ĐẦU LÀM SẠCH DỮ LIỆU DỰ ÁN ---');

  // 1. Reset file Excel users.xlsx cục bộ
  const usersPath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'users.xlsx') : path.join(rootDir, 'users.xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([], { 
    header: ['Username', 'FullName', 'Password', 'Role', 'Room', 'CreatedAt'] 
  });
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  
  try {
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync(usersPath, excelBuffer);
    console.log(`[Local] Đã reset users.xlsx tại ${usersPath} về trạng thái trống (chỉ có header).`);
  } catch (err) {
    console.error('[Local] Lỗi reset file users.xlsx:', err);
  }

  // 2. Reset các file JSON cơ sở dữ liệu cục bộ
  const dbFiles = {
    'classes.json': [],
    'documents.json': [],
    'assignments.json': [],
    'history.json': []
  };

  for (const [filename, emptyData] of Object.entries(dbFiles)) {
    const filePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, filename) : path.join(rootDir, filename);
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2), 'utf-8');
      console.log(`[Local] Đã reset ${filename} tại ${filePath} về trạng thái trống.`);
    } catch (err) {
      console.error(`[Local] Lỗi reset file ${filename}:`, err);
    }
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

  // 4. Nếu Firebase được cấu hình, làm sạch cơ sở dữ liệu trên cloud
  const firebaseApp = initFirebase();
  if (firebaseApp) {
    console.log('[Cloud Firebase] Bắt đầu làm sạch Firebase Firestore & Storage...');
    // Kết nối chính xác tới database 'default'
    const firestoreDb = getFirestore(firebaseApp, 'default');
    
    // Xóa các collections trong Firestore
    const collectionsToClean = ['users', 'classes', 'documents', 'assignments', 'history'];
    for (const collectionName of collectionsToClean) {
      await deleteCollection(firestoreDb, collectionName);
    }
    
    // Dọn dẹp Firebase Storage
    await clearStorage(firebaseApp);
  } else {
    console.log('[Cloud Firebase] Không tìm thấy hoặc cấu hình Firebase lỗi. Bỏ qua dọn dẹp Firebase.');
  }

  // 5. Nếu có token Vercel Blob, đồng bộ trạng thái sạch lên vercel blob
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    console.log('[Cloud Blob] Phát hiện BLOB_READ_WRITE_TOKEN. Bắt đầu làm sạch Vercel Blob...');
    await uploadToBlob('users.json', [], token);
    await uploadToBlob('classes.json', [], token);
    await uploadToBlob('documents.json', [], token);
    await uploadToBlob('assignments.json', [], token);
    await uploadToBlob('history.json', [], token);
  }

  console.log('--- LÀM SẠCH DỮ LIỆU HOÀN TẤT ---');
}

run();
