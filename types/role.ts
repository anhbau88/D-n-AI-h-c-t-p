// types/role.ts
// Định nghĩa các vai trò, gói cước và mô hình AI theo Đề án bảng giá 08/11/2026

export type UserRole = 'student' | 'teacher' | 'admin';

export type SubscriptionPlan =
  | 'free'
  | 'hs_basic'     // HS Cơ bản: 39.000đ/tháng · 250 Điểm AI
  | 'hs_plus'      // HS Plus: 69.000đ/tháng · 500 Điểm AI · Chấm viết tay & Giải chuyên sâu
  | 'gv_basic'     // GV Cơ bản: 129.000đ/tháng · 1.000 Điểm AI · 5 lớp · Soạn giáo án Word
  | 'gv_pro'       // GV Pro: 249.000đ/tháng · 2.000 Điểm AI · 20 lớp · Chấm tự luận hàng loạt
  | 'topup_small'  // Mua thêm nhỏ: 19.000đ · 100 Điểm AI (30 ngày)
  | 'topup_std'    // Mua thêm tiêu chuẩn: 49.000đ · 300 Điểm AI (30 ngày)
  | 'pro'          // Legacy alias -> hs_plus
  | 'vip';         // Legacy alias -> gv_pro

export type AIModelTier = 'flash' | 'pro' | 'ultra';

// Phân loại tác vụ AI và mức trừ điểm tương ứng
export type AITaskType =
  | 'chat'              // Chat ngắn (1 điểm)
  | 'english_explain'   // Giải thích lỗi tiếng Anh (1 điểm)
  | 'english_create'    // Tạo bài tiếng Anh mới (4 điểm)
  | 'quiz_10'           // Tạo bộ 10 câu hỏi (6 điểm)
  | 'grade_ocr'         // Chấm một trang viết tay (8 điểm)
  | 'summarize'         // Tóm tắt một tài liệu (9 điểm)
  | 'search_web'        // Tra cứu web Google Grounding (13 điểm)
  | 'lesson_plan'       // Soạn giáo án hoặc đề thông thường (14 điểm)
  | 'audio_minute'      // Tạo một phút âm thanh mới TTS (17 điểm)
  | 'deep_solution'     // Giải bài chuyên sâu Gemini 3.8 Flash (27 điểm)
  | 'deep_lesson_plan'  // Giáo án hoặc đề chuyên sâu (45 điểm)
  | 'review_saved';     // Làm lại bài đã lưu (0 điểm)

