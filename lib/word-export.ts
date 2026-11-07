// lib/word-export.ts
// Tiện ích xuất Đề thi Trắc nghiệm, Đề Tự luận, Giáo án Công văn 5512 và Tóm tắt bài giảng
// sang định dạng Microsoft Word (.doc chuẩn XML/HTML mở trực tiếp trên Word 2013/2016/2019/365 & Google Docs)

import { QuizQuestion } from '@/types';

export interface EssayExportData {
  question: string;
  sampleAnswer: string;
  maxScore?: number;
  subject?: string;
  gradeLevel?: string;
  lessonTopic?: string;
  examTime?: string;
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToSimpleHtml(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const htmlLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      htmlLines.push('<p style="margin: 4pt 0;">&nbsp;</p>');
      continue;
    }
    if (line.startsWith('### ')) {
      htmlLines.push(
        `<h3 style="font-family: 'Times New Roman', serif; font-size: 13pt; font-weight: bold; margin: 10pt 0 4pt 0; color: #1e293b;">${formatInlineMarkdown(line.slice(4))}</h3>`
      );
    } else if (line.startsWith('## ')) {
      htmlLines.push(
        `<h2 style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; margin: 12pt 0 6pt 0; color: #0f172a; text-transform: uppercase;">${formatInlineMarkdown(line.slice(3))}</h2>`
      );
    } else if (line.startsWith('# ')) {
      htmlLines.push(
        `<h1 style="font-family: 'Times New Roman', serif; font-size: 15pt; font-weight: bold; margin: 14pt 0 8pt 0; color: #0f172a; text-transform: uppercase; text-align: center;">${formatInlineMarkdown(line.slice(2))}</h1>`
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      htmlLines.push(
        `<p style="font-family: 'Times New Roman', serif; font-size: 13pt; margin: 3pt 0 3pt 18pt; line-height: 1.35;">• ${formatInlineMarkdown(line.slice(2))}</p>`
      );
    } else {
      htmlLines.push(
        `<p style="font-family: 'Times New Roman', serif; font-size: 13pt; margin: 4pt 0; line-height: 1.35; text-align: justify;">${formatInlineMarkdown(line)}</p>`
      );
    }
  }

  return htmlLines.join('\n');
}

function formatInlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/`(.+?)`/g, '<span style="font-family: Courier New, monospace; background: #f1f5f9; padding: 1px 4px;">$1</span>');
}

function triggerWordDownload(htmlBody: string, fileName: string) {
  const fullHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(fileName)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 2cm 2cm 2cm 2.5cm;
      mso-header-margin: 1.2cm;
      mso-footer-margin: 1.2cm;
    }
    div.Section1 { page: Section1; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 13pt;
      color: #000000;
      line-height: 1.35;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="Section1">
    ${htmlBody}
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const cleanName = fileName.replace(/[^a-zA-Z0-9_\-\u00C0-\u1EF9\s]/g, '').trim() || 'Tai_lieu_AI_Study';
  link.download = `${cleanName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Xuất Đề thi Trắc nghiệm + Bảng Đáp án & Giải thích chi tiết ra file Word (.doc)
 */
export function exportQuizToWord(
  questions: QuizQuestion[],
  options?: {
    title?: string;
    subject?: string;
    examTime?: string;
    includeAnswers?: boolean;
  }
) {
  const title = options?.title || 'ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC';
  const subject = options?.subject || 'Môn học / Chuyên đề';
  const examTime = options?.examTime || '45 phút';
  const includeAnswers = options?.includeAnswers !== false;

  const headerHtml = `
    <table style="width: 100%; margin-bottom: 14pt; border: none;">
      <tr>
        <td style="width: 45%; text-align: center; vertical-align: top; font-family: 'Times New Roman', serif; font-size: 12pt;">
          <b>HỆ THỐNG GIÁO DỤC AI STUDY ASSISTANT</b><br/>
          <b>ĐỀ CHÍNH THỨC</b><br/>
          <span>(Đề thi gồm ${questions.length} câu trắc nghiệm)</span>
        </td>
        <td style="width: 55%; text-align: center; vertical-align: top; font-family: 'Times New Roman', serif; font-size: 12pt;">
          <b>${escapeHtml(title.toUpperCase())}</b><br/>
          <b>Chuyên đề: ${escapeHtml(subject)}</b><br/>
          <i>Thời gian làm bài: ${escapeHtml(examTime)} (không kể thời gian phát đề)</i>
        </td>
      </tr>
    </table>
    <p style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 12pt; border-bottom: 1pt solid #000; padding-bottom: 6pt;">
      <b>Họ và tên thí sinh:</b> ........................................................................ <b>Lớp / Số báo danh:</b> ..............................
    </p>
  `;

  const questionsHtml = questions
    .map((q, idx) => {
      const optsHtml = (q.options || [])
        .map(
          opt =>
            `<p style="font-family: 'Times New Roman', serif; font-size: 13pt; margin: 2pt 0 2pt 16pt;">${escapeHtml(opt)}</p>`
        )
        .join('');
      return `
        <div style="margin-bottom: 10pt;">
          <p style="font-family: 'Times New Roman', serif; font-size: 13pt; margin: 4pt 0;">
            <b>Câu ${idx + 1}:</b> ${escapeHtml(q.question)}
          </p>
          ${optsHtml}
        </div>
      `;
    })
    .join('\n');

  let answerKeyHtml = '';
  if (includeAnswers) {
    const gridCells = questions
      .map(
        (q, idx) => `
        <td style="border: 1pt solid #000; padding: 4pt; text-align: center; font-family: 'Times New Roman', serif; font-size: 11pt;">
          <b>Câu ${idx + 1}:</b> ${escapeHtml(q.answer)}
        </td>`
      );

    // Chia bảng đáp án thành các hàng 5 cột
    const rows: string[] = [];
    for (let i = 0; i < gridCells.length; i += 5) {
      rows.push(`<tr>${gridCells.slice(i, i + 5).join('')}</tr>`);
    }

    const detailHtml = questions
      .map(
        (q, idx) => `
        <p style="font-family: 'Times New Roman', serif; font-size: 12pt; margin: 4pt 0;">
          <b>Câu ${idx + 1} — Đáp án đúng: ${escapeHtml(q.answer)}.</b>
          ${q.explanation ? `<i>Giải thích:</i> ${escapeHtml(q.explanation)}` : ''}
        </p>`
      )
      .join('\n');

    answerKeyHtml = `
      <br clear="all" style="page-break-before: always" />
      <h2 style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; text-align: center; margin-top: 12pt;">
        BẢNG ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin: 10pt 0 14pt 0;">
        ${rows.join('\n')}
      </table>
      ${detailHtml}
    `;
  }

  triggerWordDownload(
    `${headerHtml}${questionsHtml}<p style="text-align: center; font-weight: bold; margin-top: 16pt;">--- HẾT ---</p>${answerKeyHtml}`,
    `De_Trac_Nghiem_${subject}`
  );
}

/**
 * 2. Xuất Đề thi Tự luận + Hướng dẫn chấm (Rubric) ra file Word (.doc)
 */
export function exportEssayToWord(
  essay: EssayExportData,
  options?: {
    title?: string;
    examTime?: string;
  }
) {
  const title = options?.title || essay.lessonTopic || 'ĐỀ KIỂM TRA TỰ LUẬN';
  const subject = essay.subject || 'Chuyên đề học thuật';
  const gradeLevel = essay.gradeLevel || 'THPT / Đại học';
  const examTime = options?.examTime || essay.examTime || '45 phút';

  const body = `
    <table style="width: 100%; margin-bottom: 14pt;">
      <tr>
        <td style="width: 45%; text-align: center; vertical-align: top; font-family: 'Times New Roman', serif; font-size: 12pt;">
          <b>HỆ THỐNG GIÁO DỤC AI STUDY ASSISTANT</b><br/>
          <b>ĐỀ KIỂM TRA TỰ LUẬN</b><br/>
          <span>Khối / Trình độ: ${escapeHtml(gradeLevel)}</span>
        </td>
        <td style="width: 55%; text-align: center; vertical-align: top; font-family: 'Times New Roman', serif; font-size: 12pt;">
          <b>${escapeHtml(title.toUpperCase())}</b><br/>
          <b>Môn / Học phần: ${escapeHtml(subject)}</b><br/>
          <i>Thời gian làm bài: ${escapeHtml(examTime)}</i>
        </td>
      </tr>
    </table>
    <p style="font-family: 'Times New Roman', serif; font-size: 12pt; margin-bottom: 12pt; border-bottom: 1pt solid #000; padding-bottom: 6pt;">
      <b>Họ và tên thí sinh:</b> ........................................................................ <b>Lớp / Mã SV:</b> ..............................
    </p>
    <h3 style="font-family: 'Times New Roman', serif; font-size: 13pt; font-weight: bold; margin: 10pt 0 6pt 0;">
      I. CÂU HỎI ĐỀ BÀI (Thang điểm: ${essay.maxScore || 10} điểm)
    </h3>
    ${markdownToSimpleHtml(essay.question)}
    <p style="text-align: center; font-weight: bold; margin: 18pt 0;">--- HẾT ---</p>
    <br clear="all" style="page-break-before: always" />
    <h3 style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; text-align: center; margin: 10pt 0;">
      II. HƯỚNG DẪN CHẤM VÀ ĐÁP ÁN CHI TIẾT (DÀNH CHO GIÁO VIÊN)
    </h3>
    ${markdownToSimpleHtml(essay.sampleAnswer)}
  `;

  triggerWordDownload(body, `De_Tu_Luan_${title}`);
}

/**
 * 3. Xuất Giáo án Công văn 5512 hoặc Bản Tóm tắt Học thuật ra file Word (.doc)
 */
export function exportMarkdownDocumentToWord(
  markdownContent: string,
  options: {
    docType: 'lesson_plan_5512' | 'summary';
    fileName?: string;
  }
) {
  const cleanTitle = (options.fileName || 'Bài giảng học thuật').replace(/\.pdf$/i, '');
  const headerHtml =
    options.docType === 'lesson_plan_5512'
      ? `
    <table style="width: 100%; margin-bottom: 14pt;">
      <tr>
        <td style="width: 45%; text-align: center; vertical-align: top; font-family: 'Times New Roman', serif; font-size: 12pt;">
          <b>TRƯỜNG: ................................................</b><br/>
          <b>TỔ CHUYÊN MÔN: ...............................</b>
        </td>
        <td style="width: 55%; text-align: center; vertical-align: top; font-family: 'Times New Roman', serif; font-size: 12pt;">
          <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
          <b>Độc lập - Tự do - Hạnh phúc</b>
        </td>
      </tr>
    </table>
    <h1 style="font-family: 'Times New Roman', serif; font-size: 15pt; font-weight: bold; text-align: center; margin: 12pt 0 4pt 0;">
      KẾ HOẠCH BÀI DẠY (CHUẨN CÔNG VĂN 5512/BGDĐT-GDTrH)
    </h1>
    <p style="font-family: 'Times New Roman', serif; font-size: 13pt; text-align: center; font-style: italic; margin-bottom: 14pt;">
      Chuyên đề / Tài liệu: ${escapeHtml(cleanTitle)}
    </p>
  `
      : `
    <h1 style="font-family: 'Times New Roman', serif; font-size: 15pt; font-weight: bold; text-align: center; margin: 10pt 0 4pt 0;">
      TÀI LIỆU TÓM TẮT HỆ THỐNG KIẾN THỨC TRỌNG TÂM
    </h1>
    <p style="font-family: 'Times New Roman', serif; font-size: 13pt; text-align: center; font-style: italic; margin-bottom: 14pt; border-bottom: 1pt solid #000; padding-bottom: 8pt;">
      Nguồn bài giảng: ${escapeHtml(cleanTitle)} — Biên soạn bởi AI Study Assistant Pro
    </p>
  `;

  triggerWordDownload(
    `${headerHtml}${markdownToSimpleHtml(markdownContent)}`,
    options.docType === 'lesson_plan_5512' ? `Giao_An_5512_${cleanTitle}` : `Tom_Tat_${cleanTitle}`
  );
}
