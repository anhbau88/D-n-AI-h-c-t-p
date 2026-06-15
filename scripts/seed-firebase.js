// scripts/seed-firebase.js
// Script khởi tạo một số tài khoản mẫu và lớp học mẫu trên Firebase Firestore
// Chạy: node scripts/seed-firebase.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Manual env file parser
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

async function main() {
  console.log('=== Seed Firebase Firestore ===\n');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase credentials.');
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  const db = getFirestore(app, 'default');
  console.log(`✅ Firebase initialized for project: ${projectId}\n`);

  // 1. Seed Users
  const seedUsers = [
    {
      Username: 'giaovien',
      FullName: 'Giáo Viên Mẫu',
      Password: '123', // Sử dụng mật khẩu đơn giản để kiểm thử
      Role: 'teacher',
      Room: '',
      CreatedAt: new Date().toISOString()
    },
    {
      Username: 'hocsinh',
      FullName: 'Học Sinh Mẫu',
      Password: '123',
      Role: 'student',
      Room: 'CLH001', // Lớp học mẫu ban đầu
      CreatedAt: new Date().toISOString()
    }
  ];

  console.log('Seeding users...');
  for (const user of seedUsers) {
    const usernameKey = user.Username.toLowerCase();
    await db.collection('users').doc(usernameKey).set(user);
    console.log(`  - Seeded user: ${user.Username} (${user.Role})`);
  }

  // 2. Seed Class
  console.log('Seeding classes...');
  const seedClass = {
    code: 'CLH001',
    name: 'Lớp Học Trải Nghiệm',
    teacherUsername: 'giaovien',
    createdAt: new Date().toISOString()
  };
  await db.collection('classes').doc(seedClass.code).set(seedClass);
  console.log(`  - Seeded class: ${seedClass.name} (Code: ${seedClass.code})`);

  console.log('Initializing app collections...');
  console.log('  - Completed DB structure seeding');

  console.log('\n=== Seed complete successfully! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
