// app/api/notifications/route.ts
// SSE Endpoint cung cấp thông báo thời gian thực khi giáo viên giao bài tập mới

import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Thiết lập ban đầu duy trì kết nối SSE
  await writer.write(encoder.encode(': ok\n\n'));

  const localFilePath = process.env.LOCAL_DB_DIR 
    ? path.join(process.env.LOCAL_DB_DIR, 'assignments.json') 
    : 'assignments.json';

  let watcher: fs.FSWatcher | null = null;
  let isClosed = false;

  const closeStream = () => {
    if (isClosed) return;
    isClosed = true;
    if (watcher) {
      watcher.close();
    }
    try {
      writer.close();
    } catch {
      // Bỏ qua nếu stream đã đóng trước đó
    }
  };

  try {
    const dir = path.dirname(localFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(localFilePath)) {
      fs.writeFileSync(localFilePath, '[]', 'utf-8');
    }

    let lastTime = 0;
    watcher = fs.watch(localFilePath, async (eventType) => {
      if (eventType === 'change' && !isClosed) {
        // Tránh kích hoạt kép (debounce)
        const now = Date.now();
        if (now - lastTime < 500) return;
        lastTime = now;

        // Chờ nhẹ 100ms để tệp hoàn tất việc ghi hoàn toàn trước khi đọc
        await new Promise((resolve) => setTimeout(resolve, 100));

        try {
          if (fs.existsSync(localFilePath)) {
            const fileData = fs.readFileSync(localFilePath, 'utf-8');
            const assignments = JSON.parse(fileData);
            if (Array.isArray(assignments) && assignments.length > 0) {
              const latest = assignments[assignments.length - 1];
              // Gửi bài tập mới nhất qua luồng SSE
              await writer.write(
                encoder.encode(`event: NEW_ASSIGNMENT\ndata: ${JSON.stringify(latest)}\n\n`)
              );
            }
          }
        } catch (err) {
          console.error('Lỗi đọc assignments.json trong SSE stream:', err);
        }
      }
    });

    // Tạo luồng Ping giữ kết nối không bị đóng bởi proxy/hosting (5 giây một lần)
    const keepAliveInterval = setInterval(async () => {
      if (isClosed) {
        clearInterval(keepAliveInterval);
        return;
      }
      try {
        await writer.write(encoder.encode(': keep-alive\n\n'));
      } catch {
        clearInterval(keepAliveInterval);
        closeStream();
      }
    }, 5000);

    // Bắt sự kiện ngắt kết nối từ phía client
    request.signal.addEventListener('abort', () => {
      clearInterval(keepAliveInterval);
      closeStream();
    });

  } catch (err) {
    console.error('Lỗi khởi tạo kết nối SSE:', err);
    closeStream();
  }

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
    },
  });
}
