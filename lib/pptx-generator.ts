// lib/pptx-generator.ts
// Phân hệ B: Bộ máy Một Chạm Xuất Slide Bài Giảng PowerPoint (.pptx) chuẩn 16:9 cho Giáo viên
// Sử dụng thư viện pptxgenjs, tương thích hoàn hảo Microsoft PowerPoint, Google Slides & Keynote

import pptxgen from 'pptxgenjs';

export interface LectureSlideContent {
  title: string;
  subject?: string;
  grade?: string;
  teacherName?: string;
  sections: Array<{
    heading: string;
    points: string[];
    note?: string;
  }>;
  quizQuestions?: Array<{
    question: string;
    options: string[];
    answer: string;
    explanation?: string;
  }>;
  keyTakeaways?: string[];
}

/**
 * Tạo và tải xuống file PowerPoint (.pptx) bài giảng chất lượng cao
 */
export async function generateLecturePptx(content: LectureSlideContent): Promise<string> {
  const pptx = new pptxgen();

  // Cấu hình tỷ lệ 16:9 hiện đại
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = content.teacherName || 'Giáo viên';
  pptx.company = 'EduGenie AI';
  pptx.title = content.title;

  // Bảng màu nhận diện EduGenie
  const COLOR_PRIMARY = '6545D8'; // Deep Indigo
  const COLOR_SECONDARY = '8B5CF6'; // Violet
  const COLOR_ACCENT = 'F59E0B'; // Amber Gold
  const COLOR_TEXT_DARK = '0F172A'; // Slate 900
  const COLOR_TEXT_MUTED = '64748B'; // Slate 500
  const COLOR_BG_LIGHT = 'F8FAFC'; // Slate 50
  const COLOR_WHITE = 'FFFFFF';

  // ==========================================
  // SLIDE 1: TRANG BÌA BÀI GIẢNG (TITLE SLIDE)
  // ==========================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: '0F172A' }; // Nền tối sang trọng

  // Khối phát sáng nghệ thuật
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.4,
    fill: { color: COLOR_PRIMARY },
  });

  // Logo / Tên hệ sinh thái
  slide1.addText('EDUGENIE AI • BÀI GIẢNG ĐIỆN TỬ CHUẨN SƯ PHẠM', {
    x: 1.0,
    y: 1.2,
    w: 11.3,
    h: 0.4,
    fontSize: 13,
    bold: true,
    color: COLOR_SECONDARY,
    charSpacing: 2,
  });

  // Tên môn học & khối lớp
  if (content.subject || content.grade) {
    slide1.addText(`${content.subject || 'MÔN HỌC'} ${content.grade ? `— LỚP ${content.grade}` : ''}`, {
      x: 1.0,
      y: 1.7,
      w: 11.3,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: COLOR_ACCENT,
    });
  }

  // Tiêu đề chính bài học
  slide1.addText(content.title.toUpperCase(), {
    x: 1.0,
    y: 2.4,
    w: 11.3,
    h: 2.2,
    fontSize: 36,
    bold: true,
    color: COLOR_WHITE,
    breakLine: true,
  });

  // Thông tin giáo viên & ngày soạn
  const dateStr = new Date().toLocaleDateString('vi-VN');
  slide1.addText(`Người soạn: ${content.teacherName || 'Giáo viên bộ môn'}  |  Ngày: ${dateStr}`, {
    x: 1.0,
    y: 5.6,
    w: 11.3,
    h: 0.5,
    fontSize: 14,
    color: COLOR_TEXT_MUTED,
  });

  // ==========================================
  // SLIDE 2: MỤC TIÊU BÀI HỌC (OBJECTIVES)
  // ==========================================
  const slide2 = pptx.addSlide();
  slide2.background = { color: COLOR_BG_LIGHT };

  // Header Slide
  addSlideHeader(slide2, 'I. MỤC TIÊU BÀI HỌC CẦN ĐẠT', 'Yêu cầu cần đạt về kiến thức, kỹ năng và thái độ');

  // 3 Cột Mục tiêu: Kiến thức - Kỹ năng - Vận dụng
  const colW = 3.6;
  const colY = 2.2;
  const colH = 4.2;

  const objectives = [
    {
      title: '1. Về Kiến Thức',
      color: COLOR_PRIMARY,
      points: [
        'Hiểu và trình bày được các định nghĩa, khái niệm trọng tâm trong bài.',
        'Nhận biết được mối liên hệ giữa các hiện tượng và quy luật.',
        'Hệ thống hóa được cấu trúc kiến thức cơ bản.',
      ],
    },
    {
      title: '2. Về Kỹ Năng',
      color: '059669', // Emerald
      points: [
        'Rèn luyện kỹ năng phân tích và tổng hợp thông tin.',
        'Vận dụng công thức/lý thuyết giải quyết các dạng bài tập thực tiễn.',
        'Làm việc nhóm và thuyết trình ý tưởng trước lớp.',
      ],
    },
    {
      title: '3. Phẩm Chất & Năng Lực',
      color: 'D97706', // Amber
      points: [
        'Phát triển tư duy logic và năng lực tự học có kỷ luật.',
        'Hào hứng tìm hiểu sâu các vấn đề liên quan trong đời sống.',
        'Ứng dụng trợ lý AI EduGenie để tự ôn luyện sau buổi học.',
      ],
    },
  ];

  objectives.forEach((obj, idx) => {
    const xPos = 0.9 + idx * 3.8;

    // Card nền
    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: colY,
      w: colW,
      h: colH,
      fill: { color: COLOR_WHITE },
      line: { color: 'E2E8F0', width: 1.5 },
      rectRadius: 0.2,
    });

    // Tiêu đề card
    slide2.addText(obj.title, {
      x: xPos + 0.3,
      y: colY + 0.3,
      w: colW - 0.6,
      h: 0.5,
      fontSize: 16,
      bold: true,
      color: obj.color,
    });

    // Danh sách điểm
    const bulletItems = obj.points.map((p) => ({
      text: p + '\n',
      options: { bullet: true, fontSize: 13, color: COLOR_TEXT_DARK },
    }));

    slide2.addText(bulletItems, {
      x: xPos + 0.3,
      y: colY + 1.0,
      w: colW - 0.6,
      h: colH - 1.2,
    });
  });

  // ==========================================
  // SLIDES NỘI DUNG CHI TIẾT (CONTENT SECTIONS)
  // ==========================================
  const sections = content.sections && content.sections.length > 0
    ? content.sections
    : [
        {
          heading: 'Khái niệm & Bản chất cốt lõi',
          points: [
            'Nắm vững định nghĩa nền tảng và các thuật ngữ chuyên môn quan trọng.',
            'Phân biệt các trường hợp đặc biệt và lưu ý thực tế khi làm bài kiểm tra.',
            'Mối liên hệ giữa lý thuyết trong sách giáo khoa và các ứng dụng đời sống.',
          ],
          note: 'Học sinh chú ý ghi chép vào vở các từ khóa được bôi đậm.',
        },
        {
          heading: 'Phương pháp & Các bước thực hiện',
          points: [
            'Bước 1: Xác định yêu cầu đề bài và dữ kiện đã cho.',
            'Bước 2: Lựa chọn công thức hoặc quy tắc phù hợp để áp dụng.',
            'Bước 3: Thực hiện tính toán / lập luận chặt chẽ từng bước.',
            'Bước 4: Kiểm tra lại kết quả và kết luận rõ ràng.',
          ],
          note: 'Thầy/cô có thể mời 2 học sinh lên bảng giải ví dụ mẫu.',
        },
      ];

  sections.forEach((sec, sIdx) => {
    const sSlide = pptx.addSlide();
    sSlide.background = { color: COLOR_BG_LIGHT };

    addSlideHeader(sSlide, `PHẦN ${sIdx + 1}: ${sec.heading.toUpperCase()}`, 'Nội dung lý thuyết trọng tâm và phương pháp giải quyết vấn đề');

    // Khung nội dung chính bên trái
    sSlide.addShape(pptx.ShapeType.roundRect, {
      x: 0.9,
      y: 2.0,
      w: 7.5,
      h: 4.6,
      fill: { color: COLOR_WHITE },
      line: { color: 'E2E8F0', width: 1.5 },
      rectRadius: 0.2,
    });

    const bulletPoints = sec.points.map((p) => ({
      text: p + '\n\n',
      options: { bullet: true, fontSize: 15, color: COLOR_TEXT_DARK },
    }));

    sSlide.addText(bulletPoints, {
      x: 1.3,
      y: 2.4,
      w: 6.7,
      h: 3.8,
    });

    // Khung Lưu ý Sư phạm bên phải
    sSlide.addShape(pptx.ShapeType.roundRect, {
      x: 8.7,
      y: 2.0,
      w: 3.6,
      h: 4.6,
      fill: { color: 'EEF2FF' },
      line: { color: COLOR_PRIMARY, width: 2 },
      rectRadius: 0.2,
    });

    sSlide.addText('💡 LƯU Ý SƯ PHẠM', {
      x: 9.0,
      y: 2.3,
      w: 3.0,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: COLOR_PRIMARY,
    });

    sSlide.addText(sec.note || 'Nhấn mạnh phần này trong đề thi cuối kỳ. Học sinh thường dễ mắc bẫy ở các đơn vị đo và dấu âm/dương.', {
      x: 9.0,
      y: 2.9,
      w: 3.0,
      h: 3.3,
      fontSize: 13,
      color: '4338CA',
      italic: true,
    });
  });

  // ==========================================
  // SLIDE CÂU HỎI TRẮC NGHIỆM CỦNG CỐ KIẾN THỨC
  // ==========================================
  if (content.quizQuestions && content.quizQuestions.length > 0) {
    content.quizQuestions.slice(0, 3).forEach((q, qIdx) => {
      const qSlide = pptx.addSlide();
      qSlide.background = { color: '1E1B4B' }; // Nền tím đêm tương tác

      addSlideHeader(qSlide, `CỦNG CỐ KIẾN THỨC: CÂU HỎI ${qIdx + 1}`, 'Cả lớp cùng suy nghĩ và chọn phương án chính xác nhất', true);

      // Đề bài
      qSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 2.0,
        w: 11.4,
        h: 1.5,
        fill: { color: '2E2868' },
        line: { color: COLOR_SECONDARY, width: 2 },
        rectRadius: 0.2,
      });

      qSlide.addText(q.question, {
        x: 1.2,
        y: 2.2,
        w: 10.8,
        h: 1.1,
        fontSize: 18,
        bold: true,
        color: COLOR_WHITE,
      });

      // 4 Lựa chọn
      const optLabels = ['A', 'B', 'C', 'D'];
      const options = q.options && q.options.length >= 4 ? q.options : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];

      options.slice(0, 4).forEach((opt, oIdx) => {
        const row = Math.floor(oIdx / 2);
        const col = oIdx % 2;
        const optX = 0.9 + col * 5.9;
        const optY = 3.8 + row * 1.3;

        const isCorrect = opt.startsWith(q.answer) || optLabels[oIdx] === q.answer;

        qSlide.addShape(pptx.ShapeType.roundRect, {
          x: optX,
          y: optY,
          w: 5.5,
          h: 1.0,
          fill: { color: isCorrect ? '064E3B' : '23204E' },
          line: { color: isCorrect ? '10B981' : '475569', width: 1.5 },
          rectRadius: 0.15,
        });

        qSlide.addText(`${optLabels[oIdx]}. ${opt}`, {
          x: optX + 0.3,
          y: optY + 0.2,
          w: 4.9,
          h: 0.6,
          fontSize: 14,
          bold: isCorrect,
          color: isCorrect ? '34D399' : 'E2E8F0',
        });
      });
    });
  }

  // ==========================================
  // SLIDE CUỐI: TỔNG KẾT & DẶN DÒ TỰ HỌC
  // ==========================================
  const slideEnd = pptx.addSlide();
  slideEnd.background = { color: '0F172A' };

  slideEnd.addText('TỔNG KẾT & DẶN DÒ TỰ HỌC', {
    x: 1.0,
    y: 1.5,
    w: 11.3,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: COLOR_ACCENT,
  });

  const homeworkPoints = [
    { text: 'Ôn lại toàn bộ các định nghĩa và ví dụ đã ghi trong bài hôm nay.\n', options: { bullet: true, fontSize: 16, color: COLOR_WHITE } },
    { text: 'Hoàn thành các bài tập trong sách giáo khoa và sách bài tập.\n', options: { bullet: true, fontSize: 16, color: COLOR_WHITE } },
    { text: 'Mở ứng dụng EduGenie AI để làm thêm đề kiểm tra trắc nghiệm 15 phút củng cố.\n', options: { bullet: true, fontSize: 16, color: '38BDF8' } },
  ];

  slideEnd.addText(homeworkPoints, {
    x: 1.0,
    y: 2.5,
    w: 11.3,
    h: 2.2,
  });

  slideEnd.addText('CHÚC CÁC EM HỌC TẬP THẬT TỐT & ĐẠT ĐIỂM CAO!', {
    x: 1.0,
    y: 5.2,
    w: 11.3,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: COLOR_SECONDARY,
    align: 'center',
  });

  // Xuất file
  const fileName = `Giao_An_EduGenie_${content.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
  return fileName;

  // Helper hàm vẽ header của slide
  function addSlideHeader(slide: any, title: string, subtitle?: string, isDark: boolean = false) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.15,
      fill: { color: COLOR_PRIMARY },
    });

    slide.addText(title, {
      x: 0.9,
      y: 0.6,
      w: 11.3,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: isDark ? COLOR_WHITE : COLOR_TEXT_DARK,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.9,
        y: 1.15,
        w: 11.3,
        h: 0.4,
        fontSize: 12,
        color: isDark ? '94A3B8' : COLOR_TEXT_MUTED,
      });
    }

    // Watermark EduGenie góc trên phải
    slide.addText('EduGenie AI', {
      x: 10.2,
      y: 0.6,
      w: 2.0,
      h: 0.4,
      fontSize: 11,
      bold: true,
      color: COLOR_PRIMARY,
      align: 'right',
    });
  }
}
