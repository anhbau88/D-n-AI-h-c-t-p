// scripts/migrate-to-firebase.js
// Script migrate dữ liệu từ Vercel Blob public URLs sang Firebase Firestore
// Chạy: node scripts/migrate-to-firebase.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const fs = require('fs');
const path = require('path');

// Manual env file parser (no dotenv dependency needed)
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
    // Remove surrounding quotes
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

const BLOB_BASE = 'https://8shvc32y7x3rg5st.public.blob.vercel-storage.com';

const COLLECTIONS = {
  users: `${BLOB_BASE}/users.json`,
  classes: `${BLOB_BASE}/classes.json`,
  documents: `${BLOB_BASE}/documents.json`,
  assignments: `${BLOB_BASE}/assignments.json`,
  history: `${BLOB_BASE}/history.json`,
};

async function main() {
  console.log('=== Migrate Vercel Blob → Firebase Firestore ===\n');

  // 1. Init Firebase
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
    process.exit(1);
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });

  const db = getFirestore(app);
  console.log(`✅ Firebase initialized for project: ${projectId}\n`);

  // 2. Fetch data from Blob public URLs
  for (const [name, url] of Object.entries(COLLECTIONS)) {
    console.log(`--- Migrating: ${name} ---`);
    console.log(`  Fetching from: ${url}`);

    let data;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  ⚠️  HTTP ${res.status} — skipping (data may not exist yet)`);
        continue;
      }
      const text = await res.text();
      data = JSON.parse(text);
    } catch (err) {
      console.log(`  ⚠️  Error fetching: ${err.message} — skipping`);
      continue;
    }

    if (!Array.isArray(data)) {
      console.log(`  ⚠️  Data is not an array — skipping`);
      continue;
    }

    console.log(`  Found ${data.length} items`);

    if (data.length === 0) {
      console.log(`  (empty — nothing to migrate)`);
      continue;
    }

    // 3. Write to Firestore based on collection type
    if (name === 'users') {
      // Each user as individual doc with ID = username.toLowerCase()
      const batch = db.batch();
      for (const user of data) {
        const username = String(user.Username || user.username || '').toLowerCase();
        if (!username) continue;
        // Normalize field names to match ExcelUser interface
        const normalized = {
          Username: user.Username || user.username || '',
          FullName: user.FullName || user.fullName || '',
          Password: user.Password || user.password || '',
          Role: user.Role || user.role || '',
          Room: user.Room || user.room || '',
          CreatedAt: user.CreatedAt || user.createdAt || new Date().toISOString(),
        };
        batch.set(db.collection('users').doc(username), normalized);
      }
      await batch.commit();
      console.log(`  ✅ Migrated ${data.length} users as individual docs`);

    } else if (name === 'classes') {
      // Each class as individual doc with ID = code
      const batch = db.batch();
      for (const cls of data) {
        const code = cls.code;
        if (!code) continue;
        batch.set(db.collection('classes').doc(code), cls);
      }
      await batch.commit();
      console.log(`  ✅ Migrated ${data.length} classes as individual docs`);

    } else if (name === 'history') {
      // Each history entry as individual doc (auto-ID)
      // Use batched writes (max 500 per batch)
      const batchSize = 400;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = db.batch();
        const chunk = data.slice(i, i + batchSize);
        for (const item of chunk) {
          const ref = db.collection('history').doc();
          batch.set(ref, item);
        }
        await batch.commit();
        console.log(`  Wrote batch ${Math.floor(i / batchSize) + 1}: ${chunk.length} items`);
      }
      console.log(`  ✅ Migrated ${data.length} history entries`);

    } else if (name === 'assignments') {
      // Store as individual documents in 'assignments' collection
      const batch = db.batch();
      for (const asm of data) {
        const id = asm.id;
        if (!id) continue;
        batch.set(db.collection('assignments').doc(id), asm);
      }
      await batch.commit();
      console.log(`  ✅ Migrated ${data.length} assignments as individual documents`);

    } else if (name === 'documents') {
      // Store as individual documents in 'documents' collection
      const batch = db.batch();
      for (const docItem of data) {
        const id = docItem.id;
        if (!id) continue;
        batch.set(db.collection('documents').doc(id), docItem);
      }
      await batch.commit();
      console.log(`  ✅ Migrated ${data.length} documents as individual documents`);
    }
  }

  console.log('\n=== Migration complete! ===');
  console.log('Bạn có thể kiểm tra dữ liệu tại: https://console.firebase.google.com/project/' + projectId + '/firestore');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
