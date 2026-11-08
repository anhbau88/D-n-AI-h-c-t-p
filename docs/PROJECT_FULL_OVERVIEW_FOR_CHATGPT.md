# TÀI LIỆU TỔNG QUAN TOÀN DIỆN VỀ DỰ ÁN AI STUDY ASSISTANT
*(Dành cho AI / ChatGPT đọc hiểu toàn bộ kiến trúc, chức năng, công nghệ và luồng nghiệp vụ)*

---

## 1. THÔNG TIN CHUNG DỰ ÁN (PROJECT OVERVIEW)
- **Tên dự án:** AI Study Assistant Pro (The Sophisticated Mentor)
- **Bản chất:** Nền tảng EdTech SaaS All-in-One ứng dụng AI đa mô hình phục vụ Học tập, Khảo thí và Giảng dạy dành riêng cho Học sinh, Sinh viên và Giáo viên tại Việt Nam.
- **Mô hình định vị sản phẩm:** Kết hợp các thế mạnh của NotebookLM (tương tác tài liệu), Quizlet (flashcard, trắc nghiệm), Prep.vn (chấm tự luận), MagicSchool AI (soạn giáo án sư phạm), và Duolingo (gamification chuỗi streak).
- **Môi trường hoạt động:** 
  - Web Application & Progressive Web App (PWA) cài đặt trực tiếp lên điện thoại / máy tính không cần qua App Store/CH Play.
  - Tối ưu 100% Responsive cho Desktop, Tablet và Mobile với Native Bottom Navigation Bar.
- **Kho mã nguồn:** `https://github.com/anhbau88/D-n-AI-h-c-t-p.git` (nhánh `main`)
- **Môi trường Production (Live URL):** `https://ai-study-assistant-orcin.vercel.app`

---

## 2. STACK CÔNG NGHỆ (TECH STACK)
- **Frontend Framework:** Next.js 16 (App Router, Turbopack, React 19).
- **Ngôn ngữ:** TypeScript 100%.
- **Styling & UI:** Tailwind CSS v4, CSS Variables, Glassmorphism, Material Symbols, Lucide React Icons.
- **Engine AI:** Google Gemini API (Gemini 2.5 Flash, Gemini 2.5 Pro Reasoning, Gemini Ultra Academic) hỗ trợ chuyển đổi linh hoạt đa tầng (`flash`, `pro`, `ultra`).
- **Xử lý tài liệu:**
  - `pdf-parse`: Đọc và trích xuất text từ tệp PDF.
  - `mammoth`: Trích xuất text từ tệp Word (.docx).
  - `xlsx`: Đọc và xử lý tệp Excel.
- **Xử lý âm thanh:** Web Audio API (Tạo sóng não Alpha 10Hz Binaural Beats, tiếng mưa rơi Pink noise, tiếng sóng biển trực tiếp từ trình duyệt không cần file âm thanh ngoài).
- **Hạ tầng Email & Xác thực OTP:** 
  - Token ký điện tử HMAC SHA-256 (hạn 10 phút).
  - Tích hợp linh hoạt Resend API hoặc Google Apps Script Webhook / SMTP.
- **Cơ sở dữ liệu & Lưu trữ (Persistence):**
  - Hệ thống File JSON Store / SQLite serverless tương thích Vercel Serverless Functions.
  - LocalStorage đồng bộ trạng thái ngoại tuyến trên Client.
- **Bảo mật:** Băm mật khẩu chuẩn `scrypt` với Salt ngẫu nhiên, chống tấn công brute-force.

---

## 3. KIẾN TRÚC PHÂN QUYỀN (RBAC) & GÓI CƯỚC

### 3.1. Phân quyền Người dùng (User Roles)
Hệ thống có 3 vai trò:
1. **`student` (Học sinh / Sinh viên):**
   - Học tập tài liệu cá nhân, làm bài tập, thi trắc nghiệm, luyện đề, chấm bài viết tay OCR, tích lũy Streak & XP, tham gia lớp học qua Mã mời.
2. **`teacher` (Giáo viên / Giảng viên):**
   - Sở hữu toàn bộ tính năng của Student.
   - Thêm quyền: Tạo lớp học, cấp mã lớp (Class Code), chẩn đoán học sinh yếu kém, tự động soạn giáo án chuẩn Công văn 5512 Bộ GD&ĐT, tạo đề thi ma trận 4 mức độ xuất file Word (.docx) & in A4, giao bài tập hẹn giờ, chấm bài trắc nghiệm + tự luận, can thiệp sửa điểm (Score Override), xem phân tích phổ điểm lớp học Bento Analytics.
3. **`admin` (Quản trị viên Super Admin / SaaS Owner):**
   - Quyền hạn tối cao trên hệ thống: Xem bảng điều khiển kinh doanh (doanh thu, số user trả phí, lượng gọi API AI), quản lý tài khoản & đổi role, phát hành mã Code bản quyền hàng loạt (License Code Engine), cấu hình tài khoản ngân hàng VietQR & duyệt đơn nạp tiền, quản trị chiến dịch mã giảm giá Voucher/Coupon.

### 3.2. Mô hình Gói cước (Subscription Plans)
1. **`free` (Gói Miễn phí):** Sử dụng AI Flash 2.5, tóm tắt cơ bản, tối đa 5 câu trắc nghiệm, chat hỏi đáp giới hạn.
2. **`pro` (Gói Pro AI - 69.000đ/tháng):** Mở khóa AI Pro 2.5 Reasoning, chấm bài viết tay OCR qua ảnh chụp, Mindmap & AI Podcast không giới hạn.
3. **`vip` (Gói VIP Ultra - 149.000đ/tháng):** Mở khóa AI Ultra Academic, soạn Giáo án 5512, tạo đề thi HSG ma trận 4 mức độ, xuất đề Word/Excel không giới hạn.

---

## 4. BẢN ĐỒ CẤU TRÚC THƯ MỤC & FILE CỐT LÕI

```
ai-study-assistant/
├── app/
│   ├── api/                     # Backend API Routes (Serverless)
│   │   ├── admin/route.ts       # Quản trị hệ thống (KPIs, Users, Licenses, Orders, Bank config)
│   │   ├── auth/
│   │   │   ├── login/route.ts   # Đăng nhập (scrypt verify)
│   │   │   ├── register/route.ts# Đăng ký (yêu cầu verify OTP)
│   │   │   ├── send-otp/route.ts# Gửi mã OTP xác thực email đăng ký
│   │   │   ├── forgot-password/route.ts # Gửi OTP khôi phục mật khẩu
│   │   │   ├── reset-password/route.ts  # Đặt lại mật khẩu mới với OTP token
│   │   │   ├── change-password/route.ts # Đổi mật khẩu trong hồ sơ
│   │   │   ├── logout/route.ts  # Xóa phiên đăng nhập
│   │   │   └── me/route.ts      # Lấy thông tin phiên hiện tại
│   │   ├── billing/route.ts     # Đăng ký gói VietQR, kiểm tra Coupon, kích hoạt License Code
│   │   ├── classes/             # Quản lý lớp học (tạo lớp, thêm học sinh, chẩn đoán lớp)
│   │   ├── essay/               # Chấm bài tự luận AI & OCR bài viết tay
│   │   ├── quiz/                # Sinh câu hỏi trắc nghiệm ma trận & Adaptive Drill
│   │   ├── summarize/           # Tự động tóm tắt tài liệu
│   │   ├── mindmap/             # Sinh sơ đồ tư duy dạng cây
│   │   ├── flashcards/          # Sinh bộ thẻ ghi nhớ 3D
│   │   ├── chat/                # RAG Chat hỏi đáp tài liệu & gia sư tổng quát
│   │   ├── upload/              # Xử lý upload tệp PDF/Word/Ảnh & trích xuất văn bản
│   │   ├── documents/           # Tủ sách tài liệu cá nhân
│   │   └── history/             # Lưu trữ lịch sử bài kiểm tra và điểm số
│   ├── globals.css              # Theme CSS, Glassmorphism, OLED Dark Mode, Safe Area Insets
│   ├── layout.tsx               # Root layout, Google Fonts (Lexend, Plus Jakarta), Accessibility
│   ├── manifest.ts              # Cấu hình PWA (Progressive Web App)
│   └── page.tsx                 # Core App Canvas điều phối Workspace, Dashboard, Tabs & Modals
│
├── components/
│   ├── AuthScreen.tsx           # Màn hình Đăng nhập / Đăng ký OTP / Quên mật khẩu (Mobile-first)
│   ├── FileUpload.tsx           # Tải tệp PDF/Word/Ảnh hoặc dán văn bản / nhập chủ đề trực tiếp
│   ├── SummaryPanel.tsx         # Hiển thị Tóm tắt tổng quan, Điểm cốt lõi, Bảng thuật ngữ
│   ├── ChatBox.tsx              # Hộp thoại chat AI RAG bám sát ngữ cảnh tài liệu
│   ├── QuizPanel.tsx            # Làm trắc nghiệm, xáo câu hỏi, Anti-cheat, Adaptive Drill, xuất Word
│   ├── EssayPanel.tsx           # Nộp bài luận hoặc tải ảnh bài giải viết tay để AI OCR chấm điểm
│   ├── FlashcardPanel.tsx       # Lật thẻ ghi nhớ 3D Spaced Repetition
│   ├── TeacherClassManagement.tsx # Giáo viên quản lý lớp, danh sách học sinh và giao bài
│   ├── ClassDiagnosticPanel.tsx # Chẩn đoán tình hình học tập và học sinh yếu kém
│   ├── AdminPortal.tsx          # Bảng điều khiển tối cao dành cho Chủ SaaS (Users, Doanh thu, Code)
│   ├── MobileBottomNav.tsx      # Thanh điều hướng 5 tab dưới đáy màn hình điện thoại (Native App-like)
│   ├── ZenFocusMode.tsx         # Chế độ 1-chạm học tập toàn màn hình không xao nhãng (Esc để thoát)
│   ├── PomodoroPlayer.tsx       # Đồng hồ 25/5 + Âm thanh sóng não Alpha / Mưa rơi Web Audio API
│   ├── PwaInstallPrompt.tsx     # Banner 1-chạm cài app lên màn hình chính (Android & iOS Safari)
│   ├── SocialShareModal.tsx     # Tạo thẻ ảnh Story HD (1080x1350) chúc mừng điểm cao khoe Zalo/FB
│   ├── LeaderboardModal.tsx     # Bảng Vàng vinh danh Top 1-2-3 và xếp hạng theo Streak & XP
│   ├── UpgradeModal.tsx         # Nâng cấp gói cước qua VietQR, nhập Coupon và nhập License Code
│   └── ZaloSupportWidget.tsx    # Hỗ trợ CSKH 24/7 Hotline 0923678668 (Desktop nổi, Mobile trong Profile)
│
├── lib/
│   ├── mailer.ts                # Gửi email OTP (hỗ trợ Resend API và Google Apps Script Webhook)
│   ├── billing-store.ts         # Lưu trữ & quản lý Đơn hàng, Mã giảm giá Coupon và License Codes
│   ├── file-hash.ts             # Tính toán hash nội dung tài liệu chống trùng lặp
│   └── word-export.ts           # Xuất đề thi trắc nghiệm ra tệp Word (.docx) kèm đáp án
│
└── types/
    ├── role.ts                  # UserRole ('student' | 'teacher' | 'admin'), SubscriptionPlan, AIModelTier
    ├── document.ts              # DocumentItem, FileInfo, FlashcardItem
    └── index.ts                 # Export tổng hợp các interfaces (User, Assignment, QuizQuestion, etc.)
```

---

## 5. TOÀN BỘ CÁC CHỨC NĂNG NGHIỆP VỤ (FEATURE CATALOG)

### 5.1. Học Tập & Phân Tích Thông Minh (AI Study Tools)
- **Multi-Source Ingestion:** Tải lên tệp PDF, Word (.docx), Ảnh chụp tài liệu (.jpg, .png) hoặc Dán trực tiếp văn bản/nhập tên chủ đề.
- **Split-View Workspace:** Xem song song tài liệu gốc bên trái và các tab tương tác AI bên phải trên màn hình lớn.
- **Auto Summary:** Trích xuất tự động Executive Summary, Key Takeaways và Glossary thuật ngữ.
- **Interactive Mindmap:** Vẽ sơ đồ tư duy phân nhánh trực quan, zoom in/out, khám phá cấu trúc bài học.
- **NotebookLM AI Podcast:** Tạo kịch bản 2 chuyên gia thảo luận bài học và đọc bằng 2 giọng nói trực tiếp.
- **3D Flashcards:** Ôn từ vựng, công thức qua thẻ lật 3 chiều theo thuật toán lặp lại ngắt quãng.
- **Document RAG Chat & General Tutor:** Trả lời mọi câu hỏi dựa trên tài liệu đã nạp, không bịa đặt kiến thức; hỗ trợ đổi mô hình Flash 2.5 / Pro 2.5 / Ultra.

### 5.2. Khảo Thí & Chấm Điểm Đột Phá
- **AI Quiz Generator:** Sinh câu hỏi trắc nghiệm theo 3 mức độ (Cơ bản, Chuẩn Bộ GD&ĐT, Vận dụng cao), tự động xáo câu hỏi và các phương án A/B/C/D.
- **1-Click Adaptive Weakness Drill:** Tự động phát hiện các câu học sinh làm sai, bấm 1 nút là AI tạo ngay đề mới khắc phục đúng điểm yếu đó.
- **Anti-Cheat Proctoring:** Giám sát thời gian thực, phát hiện và đếm số lần học sinh chuyển tab sang màn hình khác để tra Google, khóa bôi đen copy đề thi, gửi báo cáo vi phạm cho giáo viên.
- **Handwriting OCR Essay Grading:** Học sinh có thể gõ bài luận hoặc chụp ảnh bài giải viết tay trong vở ➔ AI OCR đọc chữ viết tay, chấm điểm theo Rubric, chỉ ra lỗi sai và đề xuất cách cải thiện.

### 5.3. Sư Phạm & Quản Lý Lớp Học (Dành Cho Giáo Viên)
- **Classroom Hub:** Tạo lớp học với mã code 6 ký tự, duyệt học sinh, quản lý danh sách.
- **Class Diagnostic:** Bảng chẩn đoán học lực lớp, nhận diện học sinh có điểm dưới 5.0 để kịp thời hỗ trợ.
- **Soạn Giáo án 5512:** Tự động tạo kế hoạch bài dạy chuẩn Công văn 5512 Bộ GD&ĐT gồm 4 hoạt động: Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng.
- **Xuất Đề Thi Word (.docx) & In A4:** Tạo đề thi ma trận 4 mức độ, 1-chạm tải về file Word chuẩn thể thức kèm bảng đáp án hoặc in ấn trực tiếp.
- **Giao Bài Hẹn Giờ:** Thiết lập thời gian mở đề thi và thời hạn chót nộp bài cho lớp.
- **Teacher Score Override:** Giáo viên có toàn quyền xem lại bài làm, chấm lại điểm và ghi lời phê cho từng học sinh.
- **Bento Grade Distribution Analytics:** Biểu đồ phổ điểm trực quan (Tỷ lệ Đạt, Thi lại, Chưa đạt, GPA trung bình lớp).

### 5.4. Động Lực Học Tập & Năng Suất (Gamification & Productivity)
- **Chuỗi ngày học liên tục (Streak):** Biểu tượng ngọn lửa đếm chuỗi ngày học liên tiếp.
- **Điểm kinh nghiệm (XP):** Tích lũy khi hoàn thành tài liệu và bài tập.
- **Bảng Vàng Vinh Danh (Leaderboard):** Vinh danh Top 1, 2, 3 và thứ hạng cá nhân theo tuần.
- **Viral Social Achievement Card:** Tự động xuất ảnh chứng nhận điểm cao (1080x1350) để học sinh đăng lên Zalo/Facebook Story kèm mã giới thiệu.
- **Zen Focus Mode:** Chế độ 1-chạm ẩn toàn bộ thanh điều hướng, chỉ hiển thị tài liệu toàn màn hình.
- **Pomodoro Player:** Đồng hồ 25/5 tích hợp âm thanh sóng não Alpha 10Hz, tiếng mưa rơi và sóng biển bằng Web Audio API.

### 5.5. Quản Trị Hệ Thống & Thương Mại Hóa (Super Admin & Commercial Suite)
- **Admin Dashboard:** Theo dõi người dùng, phân loại giáo viên/học sinh, thành viên trả phí, doanh thu ước tính và lượng gọi API AI.
- **Role & Plan Management:** Chuyển đổi vai trò tài khoản, gia hạn ngày sử dụng thủ công.
- **License Code Engine:** Tạo mã bản quyền hàng loạt (30-365 ngày hoặc vĩnh viễn), gán email đối tác trường học, theo dõi trạng thái đã dùng/chưa dùng.
- **Cổng Thanh Toán VietQR Động:** Quét mã QR thanh toán tự động điền tiền và nội dung; cấu hình số tài khoản ngân hàng admin trực tiếp trên giao diện; hỗ trợ duyệt tự động hoặc duyệt tay.
- **Mã Giảm Giá (Coupons):** Tạo mã voucher giảm tiền mặt hoặc theo % với hạn sử dụng và số lượt giới hạn.
- **CSKH Hotline / Zalo 24/7:** Tích hợp số hotline `0923678668` (`https://zalo.me/0923678668`) tại các điểm chạm quan trọng.

---

## 6. CÁC BIẾN MÔI TRƯỜNG CẦN THIẾT (ENVIRONMENT VARIABLES)
```env
GEMINI_API_KEY=AIzaSy...              # Khóa API Google Gemini AI
RESEND_API_KEY=re_...                 # Khóa API gửi email OTP từ Resend.com
SESSION_SECRET=...                    # Chuỗi khóa bí mật mã hóa cookie/token
NEXT_PUBLIC_APP_URL=https://...       # Địa chỉ website chạy chính thức
ADMIN_SECRET_KEY=...                  # Khóa xác thực quản trị viên tối cao
```

---

## 7. TÓM TẮT ĐIỂM MẠNH ĐỂ CHATGPT NẮM BẮT NHANH
1. **Kiến trúc hoàn chỉnh:** Fullstack Next.js 16 + TypeScript, không phụ thuộc backend phức tạp, tối ưu deploy Vercel Serverless.
2. **Đã thương mại hóa thực tế:** Có sẵn cổng VietQR, hệ thống mã bản quyền cho trường học, mã voucher giảm giá, xác thực OTP email và Zalo CSKH 24/7.
3. **Phù hợp đặc thù giáo dục Việt Nam:** Bám sát chuẩn Giáo án 5512 Bộ GD&ĐT, ma trận đề 4 mức độ, xuất đề Word (.docx) in A4, chấm OCR bài viết tay trong vở.
4. **Mobile UX chuẩn App Native:** Có Bottom Navigation Bar 5 tab, PWA 1-chạm, giao diện OLED Dark Mode và Focus Mode chống xao nhãng.
