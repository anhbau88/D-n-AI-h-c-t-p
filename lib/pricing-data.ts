// lib/pricing-data.ts
// Bảng giá niêm yết, phân loại gói cước, định mức Điểm AI và mô hình kinh tế ngày 08/11/2026
// Dùng chung cho cả Client Components và Server API (Client-safe, không phụ thuộc Node.js fs/crypto/firebase)

import { SubscriptionPlan, AITaskType } from '@/types';

export interface PlanMetadata {
  id: SubscriptionPlan;
  name: string;
  shortName: string;
  audience: 'student' | 'teacher';
  monthlyPriceVnd: number;
  aiPointsPerMonth: number;
  storageMb: number;
  audioMinutes: number;
  maxClasses: number;
  maxStudents: number;
  targetUsers: string;
  features: string[];
  highlight?: boolean;
  highlightBadge?: string;
}

// Bảng danh mục gói cước chính thức (Đề xuất 08/11/2026)
export const PRICING_PLANS_DATA: Record<string, PlanMetadata> = {
  free: {
    id: 'free',
    name: 'Miễn phí',
    shortName: 'Free',
    audience: 'student',
    monthlyPriceVnd: 0,
    aiPointsPerMonth: 20,
    storageMb: 100,
    audioMinutes: 0,
    maxClasses: 1,
    maxStudents: 40,
    targetUsers: 'Dùng thử hoặc vào lớp học',
    features: [
      '20 Điểm AI mỗi tháng',
      'Đọc tài liệu, trắc nghiệm, flashcard & mindmap (trừ điểm thử)',
      'Tham gia lớp, làm và nộp bài (Miễn phí, chấm trừ điểm GV)',
      'Lộ trình Tiếng Anh và ôn bài soạn sẵn',
      '100 MB lưu trữ bài giảng / tài liệu',
    ],
  },
  hs_basic: {
    id: 'hs_basic',
    name: 'Học Sinh Cơ Bản',
    shortName: 'HS Cơ bản',
    audience: 'student',
    monthlyPriceVnd: 39000,
    aiPointsPerMonth: 250,
    storageMb: 500,
    audioMinutes: 0,
    maxClasses: 0,
    maxStudents: 0,
    targetUsers: 'Học sinh & Sinh viên học tập nhẹ',
    features: [
      '250 Điểm AI mỗi tháng (~250 câu chat hoặc 27 tài liệu)',
      'Chat & hỏi tài liệu không giới hạn trong quỹ điểm',
      'Tóm tắt tài liệu, tạo quiz, flashcard & sơ đồ tư duy',
      'Luyện Tiếng Anh & giải thích ngữ pháp AI',
      '500 MB lưu trữ tài liệu học tập',
      'Thống kê cá nhân & Báo cáo tiến bộ',
    ],
  },
  hs_plus: {
    id: 'hs_plus',
    name: 'Học Sinh Plus',
    shortName: 'HS Plus',
    audience: 'student',
    monthlyPriceVnd: 69000,
    aiPointsPerMonth: 500,
    storageMb: 1000,
    audioMinutes: 10,
    maxClasses: 0,
    maxStudents: 0,
    targetUsers: 'Học sinh & Sinh viên ôn luyện thường xuyên',
    highlight: true,
    highlightBadge: 'PHỔ BIẾN NHẤT',
    features: [
      '500 Điểm AI mỗi tháng (~500 câu chat hoặc 55 tài liệu)',
      'Chấm ảnh bài viết tay qua AI OCR (8 điểm/trang)',
      'Giải bài chế độ chuyên sâu Gemini 3.8 Flash (27 điểm)',
      '10 phút tạo âm thanh giọng đọc TTS mới mỗi tháng',
      'Sổ lỗi dùng chung & Kế hoạch đếm ngược ngày thi',
      '1 GB lưu trữ tài liệu học tập cá nhân',
    ],
  },
  gv_basic: {
    id: 'gv_basic',
    name: 'Giáo Viên Cơ Bản',
    shortName: 'GV Cơ bản',
    audience: 'teacher',
    monthlyPriceVnd: 129000,
    aiPointsPerMonth: 1000,
    storageMb: 2000,
    audioMinutes: 30,
    maxClasses: 5,
    maxStudents: 200,
    targetUsers: 'Giáo viên cá nhân & gia sư',
    features: [
      '1.000 Điểm AI mỗi tháng (Dùng chung cho cả lớp)',
      'Tạo tối đa 5 lớp học (tối đa 200 học sinh)',
      'Soạn giáo án 5512 & xuất đề thi trắc nghiệm Word (.docx)',
      'Chấm tự luận AI từng bài cho học sinh trong lớp',
      '30 phút tạo âm thanh bài giảng TTS mỗi tháng',
      '2 GB lưu trữ học liệu & đề thi',
      'Gồm trọn vẹn quyền học cá nhân tương đương gói HS Plus',
    ],
  },
  gv_pro: {
    id: 'gv_pro',
    name: 'Giáo Viên Pro',
    shortName: 'GV Pro',
    audience: 'teacher',
    monthlyPriceVnd: 249000,
    aiPointsPerMonth: 2000,
    storageMb: 5000,
    audioMinutes: 60,
    maxClasses: 20,
    maxStudents: 1000,
    targetUsers: 'Giáo viên trường học, trung tâm & dạy nhiều lớp',
    highlight: true,
    highlightBadge: 'CHO GIÁO VIÊN',
    features: [
      '2.000 Điểm AI mỗi tháng (Quỹ điểm lớn)',
      'Tạo tối đa 20 lớp học (tối đa 1.000 học sinh)',
      'Chấm tự luận AI hàng loạt cho toàn bộ học sinh lớp',
      'Soạn giáo án & đề chuyên sâu (Gemini 3.8 Flash)',
      '60 phút âm thanh mới TTS mỗi tháng',
      'Thống kê chẩn đoán lỗ hổng kiến thức & gợi ý AI',
      '5 GB lưu trữ & Xuất sổ điểm Excel (.xlsx)',
      'Gồm trọn vẹn quyền học cá nhân tương đương gói HS Plus',
    ],
  },
  // Gói nạp thêm điểm (Top-up 30 ngày)
  topup_small: {
    id: 'topup_small',
    name: 'Gói Thêm Nhỏ',
    shortName: 'Thêm Nhỏ',
    audience: 'student',
    monthlyPriceVnd: 19000,
    aiPointsPerMonth: 100,
    storageMb: 0,
    audioMinutes: 0,
    maxClasses: 0,
    maxStudents: 0,
    targetUsers: 'Nạp thêm điểm dùng trong 30 ngày',
    features: ['+100 Điểm AI', 'Hạn sử dụng 30 ngày từ khi mua', 'Dùng chung với điểm tháng hiện tại'],
  },
  topup_std: {
    id: 'topup_std',
    name: 'Gói Thêm Tiêu Chuẩn',
    shortName: 'Thêm Tiêu chuẩn',
    audience: 'student',
    monthlyPriceVnd: 49000,
    aiPointsPerMonth: 300,
    storageMb: 0,
    audioMinutes: 0,
    maxClasses: 0,
    maxStudents: 0,
    targetUsers: 'Nạp thêm điểm dùng trong 30 ngày',
    features: ['+300 Điểm AI', 'Hạn sử dụng 30 ngày từ khi mua', 'Dùng chung với điểm tháng hiện tại'],
  },
};

// Chi phí tác vụ và cách trừ điểm AI (Bảng tính chi phí tác vụ ngày 08/11/2026)
export const TASK_AI_POINTS: Record<AITaskType, {
  points: number;
  label: string;
  model: string;
  capVnd: number;
  noteVi: string;
}> = {
  chat: {
    points: 1,
    label: 'Chat hỏi đáp ngắn',
    model: 'Gemini 3.1 Flash-Lite',
    capVnd: 40,
    noteVi: 'Ngữ cảnh chuẩn ~1.500 token vào, 500 token ra.',
  },
  english_explain: {
    points: 1,
    label: 'Giải thích lỗi tiếng Anh',
    model: 'Gemini 3.1 Flash-Lite',
    capVnd: 40,
    noteVi: 'Tạo giải thích mới. Xem lại giải thích đã lưu: 0 điểm.',
  },
  english_create: {
    points: 4,
    label: 'Tạo bài tiếng Anh mới',
    model: 'Gemini 3.1 Flash-Lite',
    capVnd: 160,
    noteVi: 'Bài soạn sẵn và âm thanh có sẵn: 0 token sinh mới.',
  },
  quiz_10: {
    points: 6,
    label: 'Tạo bộ 10 câu hỏi trắc nghiệm',
    model: 'Gemini 3.5 Flash-Lite',
    capVnd: 240,
    noteVi: 'Chấm đáp án đã duyệt không gọi lại model.',
  },
  grade_ocr: {
    points: 8,
    label: 'Chấm một trang viết tay qua ảnh',
    model: 'Gemini 3.5 Flash-Lite',
    capVnd: 320,
    noteVi: 'Token ảnh dự trù theo độ phân giải trang viết.',
  },
  summarize: {
    points: 9,
    label: 'Tóm tắt một tài liệu',
    model: 'Gemini 3.5 Flash-Lite',
    capVnd: 360,
    noteVi: 'Ngữ cảnh ~15.000 token vào, 2.000 token ra.',
  },
  search_web: {
    points: 13,
    label: 'Tra cứu web (Google Grounding)',
    model: 'Google Search API',
    capVnd: 520,
    noteVi: 'Tính theo 1 truy vấn tìm kiếm thực tế.',
  },
  lesson_plan: {
    points: 14,
    label: 'Soạn giáo án hoặc đề thông thường',
    model: 'Gemini 3.5 Flash-Lite',
    capVnd: 560,
    noteVi: 'Mặc định mẫu 5512. Xuất lại tệp Word không gọi AI.',
  },
  audio_minute: {
    points: 17,
    label: 'Tạo 1 phút âm thanh mới (TTS)',
    model: 'Gemini 3.8 Flash-Lite TTS',
    capVnd: 680,
    noteVi: 'Chỉ trừ khi tạo audio mới, nghe lại audio cũ: 0 điểm.',
  },
  deep_solution: {
    points: 27,
    label: 'Giải bài chuyên sâu',
    model: 'Gemini 3.8 Flash',
    capVnd: 1080,
    noteVi: 'Chế độ suy luận sâu do người dùng chủ động chọn.',
  },
  deep_lesson_plan: {
    points: 45,
    label: 'Giáo án hoặc đề chuyên sâu',
    model: 'Gemini 3.8 Flash',
    capVnd: 1800,
    noteVi: 'Dành cho đề học sinh giỏi hoặc chuyên đề nâng cao.',
  },
  review_saved: {
    points: 0,
    label: 'Học lại nội dung đã lưu',
    model: 'Không gọi AI',
    capVnd: 0,
    noteVi: 'Hoàn toàn miễn phí, không trừ điểm AI.',
  },
};

// Thông số tài chính & hòa vốn từ bảng tính 08/11/2026
export const PRICING_FINANCIAL_MODEL = {
  currency: 'VND',
  exchangeRateUsdVnd: 27000,
  maxCostPerAiPointVnd: 40,
  apiContingencyRate: 0.25,        // Dự phòng 25% trên chi phí API
  paymentFeeRate: 0.02,           // Phí thu tiền 2%
  otherContingencyRate: 0.05,     // Dự phòng khác 5%
  monthlyFixedCostsVnd: 5500000,  // Công nghệ 1.5M, Nhân công 3M, Duyệt nội dung 0.5M, Mkt 0.5M
  breakEvenPaidUsers: 158,        // Cần 158 tài khoản trả phí để hòa vốn
  avgPaidContributionVnd: 41226,  // Đóng góp bình quân mỗi tài khoản trả phí
};

// Bảng giá niêm yết (VND) theo Gói & Kỳ hạn (7, 30, 90, 365 ngày)
export const PLAN_PRICING_VND: Record<string, Record<number, number>> = {
  hs_basic: {
    7: 15000,
    30: 39000,
    90: 99000,      // Giảm ~15%
    365: 312000,    // Trả tương đương 8 tháng
  },
  hs_plus: {
    7: 25000,
    30: 69000,
    90: 175000,     // Giảm ~15%
    365: 552000,    // Trả tương đương 8 tháng
  },
  gv_basic: {
    7: 45000,
    30: 129000,
    90: 329000,     // Giảm ~15%
    365: 1032000,   // Trả tương đương 8 tháng
  },
  gv_pro: {
    7: 85000,
    30: 249000,
    90: 635000,     // Giảm ~15%
    365: 1992000,   // Trả tương đương 8 tháng
  },
  topup_small: {
    30: 19000,
  },
  topup_std: {
    30: 49000,
  },
  // Legacy Aliases (Tương thích ngược)
  pro: {
    7: 25000,
    30: 69000,
    90: 175000,
    365: 552000,
  },
  vip: {
    7: 85000,
    30: 249000,
    90: 635000,
    365: 1992000,
  },
};
