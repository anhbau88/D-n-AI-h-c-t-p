// app/api/classes/route.ts
// API quản lý danh sách lớp học hỗ trợ Vercel Blob (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const localFilePath = path.join(process.cwd(), 'classes.json');

const getBlobUrls = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = token.match(/^vercel_blob_rw_([a-zA-Z0-9]+)_/)?.[1]?.toLowerCase() || '8shvc32y7x3rg5st';
  return {
    BLOB_URL: `https://${storeId}.public.blob.vercel-storage.com/classes.json`,
    API_URL: 'https://blob.vercel-storage.com/classes.json'
  };
};

const SEED_CLASSES = [
  {
    code: '64CTT1',
    name: 'Lớp Công nghệ thông tin K64',
    teacherUsername: 'giao-vien-1',
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    try {
      if (!fs.existsSync(localFilePath)) {
        fs.writeFileSync(localFilePath, JSON.stringify(SEED_CLASSES, null, 2), 'utf-8');
        return NextResponse.json(SEED_CLASSES);
      }
      const data = fs.readFileSync(localFilePath, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    } catch (error) {
      console.error('Error reading local classes:', error);
      return NextResponse.json(SEED_CLASSES);
    }
  }

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
        // Seed Vercel Blob
        const { API_URL } = getBlobUrls();
        await fetch(API_URL, {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${token}`,
            'x-api-version': '1',
            'x-add-random-suffix': 'false',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(SEED_CLASSES),
        });
        return NextResponse.json(SEED_CLASSES);
      }
      throw new Error(`Failed to fetch from Vercel Blob`);
    }

    const classes = await res.json();
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(SEED_CLASSES);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, teacherUsername } = await request.json();
    if (!name || !name.trim() || !teacherUsername) {
      return NextResponse.json({ error: 'Thiếu tên lớp hoặc giáo viên.' }, { status: 400 });
    }

    // Load existing classes
    let currentClasses = [];
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      if (fs.existsSync(localFilePath)) {
        currentClasses = JSON.parse(fs.readFileSync(localFilePath, 'utf-8'));
      } else {
        currentClasses = [...SEED_CLASSES];
      }
    } else {
      const { BLOB_URL } = getBlobUrls();
      try {
        const res = await fetch(BLOB_URL, { cache: 'no-store' });
        if (res.ok) {
          currentClasses = await res.json();
        }
      } catch {}
    }

    // Generate unique class code: C + 5 random alphanumeric uppercase
    let code = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Tránh O, 0, I, 1 dễ nhầm lẫn
    let isUnique = false;
    while (!isUnique) {
      code = 'C';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      isUnique = !currentClasses.some((c: any) => c.code === code);
    }

    const newClass = {
      code,
      name: name.trim(),
      teacherUsername,
      createdAt: new Date().toISOString()
    };

    currentClasses.push(newClass);

    if (!token) {
      fs.writeFileSync(localFilePath, JSON.stringify(currentClasses, null, 2), 'utf-8');
    } else {
      const { API_URL } = getBlobUrls();
      await fetch(API_URL, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'x-api-version': '1',
          'x-add-random-suffix': 'false',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentClasses),
      });
    }

    return NextResponse.json(newClass);
  } catch (error) {
    console.error('Error saving class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
