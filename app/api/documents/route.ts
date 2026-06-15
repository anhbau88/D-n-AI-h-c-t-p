// app/api/documents/route.ts
// API đồng bộ danh sách tài liệu công cộng qua Firebase Firestore (hoặc local fallback)

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { db, bucket } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

const localFilePath = process.env.LOCAL_DB_DIR ? path.join(process.env.LOCAL_DB_DIR, 'documents.json') : 'documents.json';

export async function GET() {
  // Ưu tiên đọc file local trước
  if (fs.existsSync(localFilePath)) {
    try {
      const data = fs.readFileSync(localFilePath, 'utf-8');
      const documents = JSON.parse(data);
      if (Array.isArray(documents)) {
        return NextResponse.json(documents, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      }
    } catch (error) {
      console.error('Error reading local documents cache:', error);
    }
  }

  // Firebase Firestore
  if (db) {
    try {
      const snapshot = await db.collection('documents').get();
      const documents = snapshot.docs.map(doc => doc.data());
      return NextResponse.json(documents, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    } catch (error) {
      console.error('Error fetching documents from Firebase:', error);
    }
  }

  return NextResponse.json([], {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const documents = await request.json();

    if (!db) {
      // Fallback: Ghi dữ liệu vào file local documents.json khi chạy offline/local
      try {
        fs.writeFileSync(localFilePath, JSON.stringify(documents, null, 2), 'utf-8');
        return NextResponse.json({ success: true }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      } catch (error) {
        console.error('Error writing local documents:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to save local documents' },
          { status: 500 }
        );
      }
    }

    // Chạy chính thức: Ghi lên Firebase Firestore (lưu từng doc riêng lẻ để tránh vượt 1MB)
    try {
      const snapshot = await db.collection('documents').get();
      const existingIds = snapshot.docs.map(doc => doc.id);
      const newIds = documents.map((d: any) => d.id);

      const batch = db.batch();

      // Xóa các tài liệu cũ không còn trong danh sách mới
      for (const id of existingIds) {
        if (!newIds.includes(id)) {
          batch.delete(db.collection('documents').doc(id));
        }
      }

      // Ghi đè hoặc thêm các tài liệu mới
      for (const docItem of documents) {
        if (docItem.id) {
          batch.set(db.collection('documents').doc(docItem.id), docItem);
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('Error saving documents to Firebase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save documents';
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    // Write locally as well for fast local caching
    try {
      fs.writeFileSync(localFilePath, JSON.stringify(documents, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing local documents cache:', err);
    }

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error) {
    console.error('Error saving documents to Firebase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save documents';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();
    if (pdfUrl) {
      if (pdfUrl.startsWith('/uploads/')) {
        // Xóa file local cục bộ
        const filename = decodeURIComponent(pdfUrl.replace('/uploads/', ''));
        const localPath = path.join(process.cwd(), 'public', 'uploads', filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log('Đã xóa file local:', localPath);
        }
      } else if (bucket && pdfUrl.includes('storage.googleapis.com')) {
        // Xóa file từ Firebase Storage
        try {
          const bucketName = bucket.name;
          const prefix = `https://storage.googleapis.com/${bucketName}/`;
          if (pdfUrl.startsWith(prefix)) {
            const storagePath = decodeURIComponent(pdfUrl.slice(prefix.length));
            await bucket.file(storagePath).delete();
            console.log('Đã xóa file Firebase Storage:', storagePath);
          }
        } catch (err) {
          console.error('Error deleting Firebase Storage file:', err);
        }
      } else {
        // URL cũ (Vercel Blob) hoặc không xác định — bỏ qua
        console.log('Bỏ qua xóa file cho URL không phải Firebase:', pdfUrl);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
