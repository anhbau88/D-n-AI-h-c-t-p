// lib/file-hash.ts
/**
 * Tạo mã hash SHA-256 từ file tải lên để kiểm tra trùng lặp tài liệu.
 * Sử dụng Web Crypto API có sẵn trên tất cả trình duyệt hiện đại.
 * @param file - Đối tượng file cần tạo hash
 * @returns Trả về chuỗi hex mã SHA-256
 */
export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
