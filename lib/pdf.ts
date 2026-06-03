// lib/pdf.ts
// Hàm đọc text từ file PDF sử dụng pdf-parse

// @ts-expect-error - Thiếu type definition cho module nội bộ
import pdf from 'pdf-parse/lib/pdf-parse.js';

/**
 * Đọc nội dung text từ buffer của file PDF
 * @param buffer - Buffer của file PDF
 * @returns Object chứa text và số trang
 */
export async function extractTextFromPDF(buffer: Buffer) {
  try {
    const data = await pdf(buffer);
    
    return {
      text: data.text.trim(),
      pages: data.numpages,
    };
  } catch (error) {
    console.error('Lỗi đọc PDF:', error);
    throw new Error('Không thể đọc file PDF. Vui lòng kiểm tra file.');
  }
}
