import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyCRhxsC6QlWJZUuvQjJrM_qDfrckb808UY');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function run() {
  const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(This is a longer test document with enough characters to pass the 50 character limit check. One two three four five six seven eight nine ten.) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \n0000000304 00000 n \ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n397\n%%EOF\n', 'binary');

  try {
    const prompt = `Hãy đọc hiểu và trích xuất toàn bộ nội dung văn bản trong tài liệu này (đây là tệp PDF scan).
Ghi lại nội dung văn bản một cách cực kỳ chi tiết và chính xác, giữ nguyên cấu trúc tiêu đề, đoạn văn và các phần nếu có.
Nếu có sơ đồ, bảng biểu hoặc công thức học tập (toán, lý, hóa), hãy chuyển đổi thành dạng văn bản mô tả hoặc định dạng Markdown toán học thích hợp.
Chỉ trả về phần nội dung văn bản đã được trích xuất hoàn chỉnh, không thêm bất kỳ nhận xét, lời bình luận hay phần giới thiệu nào khác.`;

    const res = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: 'application/pdf'
        }
      },
      prompt
    ]);
    console.log('Text extracted:', res.response.text());
    console.log('Length:', res.response.text().length);
  } catch (err) {
    console.error('API Error:', err.message || err);
  }
}

run();
