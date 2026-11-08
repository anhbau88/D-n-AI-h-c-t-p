// lib/english-curriculum.ts
// Chương trình Tiếng Anh nền tảng (8 Chủ đề · 24 Bài học đã duyệt)
// Tích hợp Lịch ôn ngắt quãng (1, 3, 7, 14, 30 ngày), Sổ lỗi theo kỹ năng và Từ vựng trích xuất từ tài liệu

export type EnglishQuestionType =
  | 'multiple_choice'
  | 'word_match'
  | 'fill_blank'
  | 'listening'
  | 'sentence_order'
  | 'short_input'
  | 'error_correction';

export interface EnglishQuestion {
  id: string;
  lessonId: string;
  topicId: number;
  type: EnglishQuestionType;
  promptVi: string;          // Yêu cầu dạng bài (VD: "Điền từ còn thiếu", "Nghe và chọn tên được nhắc đến")
  questionText: string;      // Câu hỏi hiển thị (VD: "She ___ a student.")
  audioText?: string;        // Câu phát âm tiếng Anh (dùng cho bài nghe hoặc phát âm mẫu)
  hideTranscriptBeforeAnswer?: boolean; // Với bài kiểm tra nghe: chỉ mở bản chép sau khi trả lời
  options?: string[];        // Phương án lựa chọn
  wordBank?: string[];       // Từ xáo trộn để sắp xếp câu
  correctAnswer: string;     // Đáp án chuẩn
  acceptedVariants?: string[]; // Biến thể chấp nhận cho câu nhập ngắn (VD: "I am a student", "I'm a student")
  explanationVi: string;     // Giải thích ngắn gọn bằng tiếng Việt trong khung "Ghi nhớ"
  skillTag: string;          // Mẫu kiến thức / kỹ năng (VD: "Động từ to be (am/is/are)")
}

export interface EnglishLesson {
  id: string;
  topicId: number;
  orderInTopic: 1 | 2 | 3;
  title: string;
  subtitle: string;
  durationMinutes: number;
  canDoGoal: string;         // Đầu ra giao tiếp cụ thể
  questions: EnglishQuestion[];
}

export interface EnglishTopic {
  id: number;
  title: string;
  description: string;
  canDoOutput: string;
  lessons: EnglishLesson[];
}

// Lịch sử ôn tập từng câu hỏi theo mốc 1, 3, 7, 14, 30 ngày
export interface QuestionReviewState {
  questionId: string;
  lessonId: string;
  skillTag: string;
  intervalIndex: number;     // 0->1d, 1->3d, 2->7d, 3->14d, 4->30d
  intervalDays: number;
  nextReviewAt: string;      // ISO date
  lastReviewedAt: string;    // ISO date
  independentCorrectCount: number; // Số lần nhớ đúng độc lập (không gợi ý)
  distinctDaysCorrect: string[];   // Danh sách ngày (YYYY-MM-DD) đã trả lời đúng
  wrongCount: number;
  mastered: boolean;         // Đúng >= 3 lần trên >= 2 ngày khác nhau
}

// Mục trong Sổ lỗi dùng chung (Cả Tiếng Anh & Tài liệu môn học)
export interface ErrorNotebookEntry {
  id: string;
  sourceType: 'english' | 'document';
  sourceTitle: string;       // Tên bài học Tiếng Anh hoặc Tên tài liệu PDF
  sourcePageOrRef?: string;  // Trang tài liệu hoặc Chủ đề
  skillTag: string;          // Mẫu lỗi (VD: "Nhầm am/is/are", "Quang hợp ở thực vật")
  questionText: string;
  options?: string[];
  userWrongAnswer: string;
  correctAnswer: string;
  explanationVi: string;
  wrongCount: number;
  resolvedCount: number;
  lastWrongAt: string;
  nextReviewAt: string;
}

// Phiên làm bài đang dở để khôi phục đúng câu khi quay lại
export interface ActiveEnglishSession {
  lessonId: string;
  isReviewSession?: boolean;
  questionIds: string[];
  currentIndex: number;
  firstTryCorrectIds: string[];
  firstTryAttemptedIds: string[];
  retryQueueIds: string[];
  startedAt: string;
}

// Kết quả hoàn thành bài học (Tách điểm làm lần đầu và điểm sau khi ôn)
export interface CompletedLessonRecord {
  lessonId: string;
  firstTryCorrect: number;
  totalQuestions: number;
  finalCorrectAfterRetry: number;
  weakSkills: string[];
  completedAt: string;
  eventId: string;           // Chống cộng trùng XP khi mạng yếu
}

// Từ vựng tiếng Anh trích xuất từ tài liệu môn học của người dùng
export interface CustomDocVocabularyItem {
  id: string;
  term: string;
  meaningVi: string;
  sourceSentence: string;
  documentName: string;
  pageNumber?: number;
  addedAt: string;
}

export interface EnglishLearningProgress {
  dailyGoalMinutes: number;
  minutesStudiedToday: number;
  lastStudyDate: string;
  completedLessons: Record<string, CompletedLessonRecord>;
  reviewStates: Record<string, QuestionReviewState>;
  errorNotebook: ErrorNotebookEntry[];
  activeSession: ActiveEnglishSession | null;
  customVocabulary: CustomDocVocabularyItem[];
  reportedQuestionIds: string[];
}

export const SPACED_INTERVALS_DAYS = [1, 3, 7, 14, 30];

/**
 * Chuẩn hóa chuỗi câu trả lời để chấm điểm linh hoạt (chấp nhận biến thể dấu nháy, bỏ qua hoa thường & dấu câu cuối)
 */
export function normalizeEnglishAnswer(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/[.,!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isEnglishAnswerCorrect(userAnswer: string, question: EnglishQuestion): boolean {
  const normUser = normalizeEnglishAnswer(userAnswer);
  if (!normUser) return false;
  const candidates = [question.correctAnswer, ...(question.acceptedVariants || [])];
  return candidates.some(c => normalizeEnglishAnswer(c) === normUser);
}

// ============================================================================
// NGÂN HÀNG 8 CHỦ ĐỀ · 24 BÀI HỌC ĐÃ BIÊN SOẠN CHUẨN
// ============================================================================

export const ENGLISH_CURRICULUM_TOPICS: EnglishTopic[] = [
  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 1: CHÀO HỎI
  // --------------------------------------------------------------------------
  {
    id: 1,
    title: 'Chào hỏi',
    description: 'Làm quen, giới thiệu bản thân và hỏi tên người khác bằng câu đơn giản.',
    canDoOutput: 'Nói hoặc viết được lời giới thiệu ngắn.',
    lessons: [
      {
        id: 't1-l1',
        topicId: 1,
        orderInTopic: 1,
        title: 'Chào và tạm biệt',
        subtitle: 'Chủ đề 1 · Bài 1',
        durationMinutes: 5,
        canDoGoal: 'Chào hỏi theo buổi và nói lời tạm biệt lịch sự.',
        questions: [
          {
            id: 't1-l1-q1',
            lessonId: 't1-l1',
            topicId: 1,
            type: 'multiple_choice',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'Good morning',
            audioText: 'Good morning',
            options: ['Chào buổi sáng', 'Chào buổi tối', 'Tạm biệt'],
            correctAnswer: 'Chào buổi sáng',
            explanationVi: '"Good morning" dùng để chào nhau vào buổi sáng.',
            skillTag: 'Từ vựng chào hỏi',
          },
          {
            id: 't1-l1-q2',
            lessonId: 't1-l1',
            topicId: 1,
            type: 'word_match',
            promptVi: 'Ghép từ với nghĩa tiếng Việt',
            questionText: 'Goodbye',
            audioText: 'Goodbye',
            options: ['Tạm biệt', 'Xin chào', 'Cảm ơn bạn'],
            correctAnswer: 'Tạm biệt',
            explanationVi: '"Goodbye" (hoặc "Bye") dùng khi tạm biệt nhau.',
            skillTag: 'Từ vựng chào hỏi',
          },
          {
            id: 't1-l1-q3',
            lessonId: 't1-l1',
            topicId: 1,
            type: 'listening',
            promptVi: 'Nghe câu và chọn lời chào bạn nghe được',
            questionText: 'Nghe âm thanh và chọn câu đúng:',
            audioText: 'Hello, good afternoon.',
            hideTranscriptBeforeAnswer: true,
            options: ['Hello, good afternoon.', 'Hello, good morning.', 'Goodbye, see you.'],
            correctAnswer: 'Hello, good afternoon.',
            explanationVi: 'Bản chép: "Hello, good afternoon." (Xin chào, chào buổi chiều).',
            skillTag: 'Nghe hiểu lời chào',
          },
          {
            id: 't1-l1-q4',
            lessonId: 't1-l1',
            topicId: 1,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'See ___ later!',
            audioText: 'See you later!',
            options: ['you', 'your', 'am'],
            correctAnswer: 'you',
            explanationVi: 'Cụm cố định "See you later!" nghĩa là "Hẹn gặp lại bạn sau!".',
            skillTag: 'Mẫu câu tạm biệt',
          },
          {
            id: 't1-l1-q5',
            lessonId: 't1-l1',
            topicId: 1,
            type: 'sentence_order',
            promptVi: 'Sắp xếp các từ thành câu đúng',
            questionText: 'Chào buổi tối bằng tiếng Anh:',
            audioText: 'Good evening.',
            wordBank: ['evening.', 'Good'],
            correctAnswer: 'Good evening.',
            explanationVi: '"Good evening." nghĩa là "Chào buổi tối."',
            skillTag: 'Từ vựng chào hỏi',
          },
          {
            id: 't1-l1-q6',
            lessonId: 't1-l1',
            topicId: 1,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho lời chào sau',
            questionText: 'Xin chào',
            audioText: 'Hello',
            correctAnswer: 'Hello',
            acceptedVariants: ['Hello', 'Hi'],
            explanationVi: 'Bạn có thể dùng "Hello" hoặc "Hi" để nói "Xin chào".',
            skillTag: 'Từ vựng chào hỏi',
          },
        ],
      },
      // BÀI 2: GIỚI THIỆU BẢN THÂN (Đúng 10 câu chuẩn trong Bảng Mục 8 của Báo cáo)
      {
        id: 't1-l2',
        topicId: 1,
        orderInTopic: 2,
        title: 'Giới thiệu bản thân',
        subtitle: 'Chủ đề 1 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Dùng được I am, She is, They are và lời chào làm quen.',
        questions: [
          {
            id: 't1-l2-q1',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'multiple_choice',
            promptVi: 'Chọn nghĩa của từ',
            questionText: 'Chọn nghĩa của "student".',
            audioText: 'student',
            options: ['Học sinh hoặc sinh viên', 'Giáo viên', 'Trường học'],
            correctAnswer: 'Học sinh hoặc sinh viên',
            explanationVi: '"Student" có nghĩa là học sinh hoặc sinh viên tùy ngữ cảnh.',
            skillTag: 'Từ vựng giới thiệu',
          },
          {
            id: 't1-l2-q2',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'word_match',
            promptVi: 'Ghép từ với nghĩa tiếng Việt',
            questionText: 'Ghép "teacher" với nghĩa tiếng Việt.',
            audioText: 'teacher',
            options: ['Giáo viên', 'Bạn bè', 'Học sinh'],
            correctAnswer: 'Giáo viên',
            explanationVi: '"Teacher" nghĩa là giáo viên.',
            skillTag: 'Từ vựng giới thiệu',
          },
          {
            id: 't1-l2-q3',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'I ___ a student.',
            audioText: 'I am a student.',
            options: ['am', 'is', 'are'],
            correctAnswer: 'am',
            explanationVi: 'Chủ ngữ "I" (Tôi) luôn đi với động từ to be là "am". I am a student.',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't1-l2-q4',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'She ___ a student.',
            audioText: 'She is a student.',
            options: ['am', 'is', 'are'],
            correctAnswer: 'is',
            explanationVi: 'Dùng is với she, he và it. She is a student.',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't1-l2-q5',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'They ___ friends.',
            audioText: 'They are friends.',
            options: ['am', 'is', 'are'],
            correctAnswer: 'are',
            explanationVi: 'Dùng "are" với chủ ngữ số nhiều (they, we, you). They are friends.',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't1-l2-q6',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'listening',
            promptVi: 'Nghe câu rồi chọn tên được nhắc đến',
            questionText: 'Nghe âm thanh và chọn tên người được nhắc tới:',
            audioText: 'My name is Lan.',
            hideTranscriptBeforeAnswer: true,
            options: ['Lan', 'Mai', 'Nam'],
            correctAnswer: 'Lan',
            explanationVi: 'Bản chép: "My name is Lan." (Tên của tôi là Lan).',
            skillTag: 'Nghe hiểu giới thiệu tên',
          },
          {
            id: 't1-l2-q7',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'sentence_order',
            promptVi: 'Sắp xếp các từ thành câu hoàn chỉnh',
            questionText: 'Sắp xếp: My / name / is / Lan.',
            audioText: 'My name is Lan.',
            wordBank: ['Lan.', 'is', 'My', 'name'],
            correctAnswer: 'My name is Lan.',
            explanationVi: 'Mẫu câu giới thiệu tên: "My name is + [Tên]."',
            skillTag: 'Mẫu câu giới thiệu bản thân',
          },
          {
            id: 't1-l2-q8',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'multiple_choice',
            promptVi: 'Chọn lời đáp phù hợp',
            questionText: 'Chọn lời đáp cho "Nice to meet you."',
            audioText: 'Nice to meet you.',
            options: ['Nice to meet you, too.', 'Goodbye.', 'I am a teacher.'],
            correctAnswer: 'Nice to meet you, too.',
            explanationVi: 'Khi ai đó nói "Nice to meet you" (Rất vui được gặp bạn), ta đáp lại "Nice to meet you, too."',
            skillTag: 'Giao tiếp làm quen',
          },
          {
            id: 't1-l2-q9',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tôi là sinh viên.',
            audioText: 'I am a student.',
            correctAnswer: 'I am a student.',
            acceptedVariants: ['I am a student', "I'm a student", 'I am a student.'],
            explanationVi: 'Có thể viết đầy đủ "I am a student." hoặc viết tắt "I\'m a student."',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't1-l2-q10',
            lessonId: 't1-l2',
            topicId: 1,
            type: 'error_correction',
            promptVi: 'Sửa câu bị sai ngữ pháp',
            questionText: 'Sửa câu: "She are a teacher."',
            audioText: 'She is a teacher.',
            correctAnswer: 'She is a teacher.',
            acceptedVariants: ['She is a teacher', "She's a teacher"],
            explanationVi: 'Chủ ngữ "She" ngôi thứ ba số ít phải đi với động từ "is" chứ không dùng "are". Câu đúng: "She is a teacher."',
            skillTag: 'Động từ to be (am/is/are)',
          },
        ],
      },
      {
        id: 't1-l3',
        topicId: 1,
        orderInTopic: 3,
        title: 'Hỏi tên người khác',
        subtitle: 'Chủ đề 1 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Đặt câu hỏi What is your name? và giới thiệu tên bạn bè.',
        questions: [
          {
            id: 't1-l3-q1',
            lessonId: 't1-l3',
            topicId: 1,
            type: 'fill_blank',
            promptVi: 'Điền từ để hỏi phù hợp',
            questionText: '___ is your name?',
            audioText: 'What is your name?',
            options: ['What', 'Where', 'When'],
            correctAnswer: 'What',
            explanationVi: 'Dùng "What is your name?" để hỏi "Tên của bạn là gì?".',
            skillTag: 'Câu hỏi thông tin cá nhân',
          },
          {
            id: 't1-l3-q2',
            lessonId: 't1-l3',
            topicId: 1,
            type: 'fill_blank',
            promptVi: 'Điền tính từ sở hữu đúng',
            questionText: 'He is my friend. ___ name is Minh.',
            audioText: 'He is my friend. His name is Minh.',
            options: ['His', 'Her', 'My'],
            correctAnswer: 'His',
            explanationVi: '"His" nghĩa là "của anh ấy/bạn nam ấy", tương ứng với chủ ngữ "He".',
            skillTag: 'Tính từ sở hữu (my/your/his/her)',
          },
          {
            id: 't1-l3-q3',
            lessonId: 't1-l3',
            topicId: 1,
            type: 'listening',
            promptVi: 'Nghe câu hỏi và chọn nghĩa đúng',
            questionText: 'Nghe âm thanh:',
            audioText: 'Excuse me, what is your name?',
            hideTranscriptBeforeAnswer: true,
            options: [
              'Xin lỗi, tên của bạn là gì?',
              'Xin lỗi, bạn học lớp nào?',
              'Rất vui được gặp bạn.',
            ],
            correctAnswer: 'Xin lỗi, tên của bạn là gì?',
            explanationVi: 'Bản chép: "Excuse me, what is your name?" — cách hỏi tên lịch sự.',
            skillTag: 'Câu hỏi thông tin cá nhân',
          },
          {
            id: 't1-l3-q4',
            lessonId: 't1-l3',
            topicId: 1,
            type: 'sentence_order',
            promptVi: 'Sắp xếp các từ thành câu hỏi',
            questionText: 'Hỏi tên người đối diện:',
            audioText: 'What is your name?',
            wordBank: ['name?', 'your', 'What', 'is'],
            correctAnswer: 'What is your name?',
            explanationVi: 'Cấu trúc: What + is + your name?',
            skillTag: 'Câu hỏi thông tin cá nhân',
          },
          {
            id: 't1-l3-q5',
            lessonId: 't1-l3',
            topicId: 1,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tên của cô ấy là Hoa.',
            audioText: 'Her name is Hoa.',
            correctAnswer: 'Her name is Hoa.',
            acceptedVariants: ['Her name is Hoa'],
            explanationVi: 'Dùng "Her name" cho "Tên của cô ấy". Her name is Hoa.',
            skillTag: 'Tính từ sở hữu (my/your/his/her)',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 2: TRƯỜNG LỚP
  // --------------------------------------------------------------------------
  {
    id: 2,
    title: 'Trường lớp',
    description: 'Gọi tên đồ dùng học tập, môn học và trao đổi thông tin ở lớp.',
    canDoOutput: 'Đọc hiểu một câu hỏi quen thuộc ở lớp.',
    lessons: [
      {
        id: 't2-l1',
        topicId: 2,
        orderInTopic: 1,
        title: 'Đồ dùng học tập',
        subtitle: 'Chủ đề 2 · Bài 1',
        durationMinutes: 5,
        canDoGoal: 'Nhận biết book, pen, notebook và cách dùng mạo từ a/an.',
        questions: [
          {
            id: 't2-l1-q1',
            lessonId: 't2-l1',
            topicId: 2,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'notebook',
            audioText: 'notebook',
            options: ['Quyển vở ghi chép', 'Cây thước kẻ', 'Cặp sách'],
            correctAnswer: 'Quyển vở ghi chép',
            explanationVi: '"Notebook" là quyển vở dùng để ghi chép bài học.',
            skillTag: 'Từ vựng trường lớp',
          },
          {
            id: 't2-l1-q2',
            lessonId: 't2-l1',
            topicId: 2,
            type: 'fill_blank',
            promptVi: 'Chọn mạo từ đúng (a hoặc an)',
            questionText: 'This is ___ English book.',
            audioText: 'This is an English book.',
            options: ['an', 'a', 'are'],
            correctAnswer: 'an',
            explanationVi: 'Dùng "an" trước từ bắt đầu bằng âm nguyên âm (u, e, o, a, i) như "English".',
            skillTag: 'Mạo từ (a/an)',
          },
          {
            id: 't2-l1-q3',
            lessonId: 't2-l1',
            topicId: 2,
            type: 'listening',
            promptVi: 'Nghe và chọn đồ vật được nhắc đến',
            questionText: 'Nghe âm thanh:',
            audioText: 'I have a pen and two books.',
            hideTranscriptBeforeAnswer: true,
            options: ['Một cây bút và hai quyển sách', 'Hai cây bút và một quyển vở', 'Một chiếc cặp sách mới'],
            correctAnswer: 'Một cây bút và hai quyển sách',
            explanationVi: 'Bản chép: "I have a pen and two books."',
            skillTag: 'Từ vựng trường lớp',
          },
          {
            id: 't2-l1-q4',
            lessonId: 't2-l1',
            topicId: 2,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hoàn chỉnh',
            questionText: 'Đây là quyển sách của tôi:',
            audioText: 'This is my book.',
            wordBank: ['book.', 'my', 'This', 'is'],
            correctAnswer: 'This is my book.',
            explanationVi: '"This is my book." nghĩa là "Đây là quyển sách của tôi."',
            skillTag: 'Từ vựng trường lớp',
          },
          {
            id: 't2-l1-q5',
            lessonId: 't2-l1',
            topicId: 2,
            type: 'error_correction',
            promptVi: 'Sửa câu thiếu mạo từ',
            questionText: 'Sửa câu: "I have pen."',
            audioText: 'I have a pen.',
            correctAnswer: 'I have a pen.',
            acceptedVariants: ['I have a pen'],
            explanationVi: 'Danh từ đếm được số ít "pen" cần có mạo từ "a" đứng trước: "I have a pen."',
            skillTag: 'Mạo từ (a/an)',
          },
        ],
      },
      {
        id: 't2-l2',
        topicId: 2,
        orderInTopic: 2,
        title: 'Lớp và môn học',
        subtitle: 'Chủ đề 2 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Nói về môn học yêu thích và phòng học của mình.',
        questions: [
          {
            id: 't2-l2-q1',
            lessonId: 't2-l2',
            topicId: 2,
            type: 'multiple_choice',
            promptVi: 'Chọn nghĩa của từ',
            questionText: 'Science',
            audioText: 'Science',
            options: ['Khoa học', 'Lịch sử', 'Âm nhạc'],
            correctAnswer: 'Khoa học',
            explanationVi: '"Science" là môn Khoa học; "History" là Lịch sử; "Math" là Toán.',
            skillTag: 'Từ vựng trường lớp',
          },
          {
            id: 't2-l2-q2',
            lessonId: 't2-l2',
            topicId: 2,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'My favorite ___ is English.',
            audioText: 'My favorite subject is English.',
            options: ['subject', 'classroom', 'desk'],
            correctAnswer: 'subject',
            explanationVi: '"Subject" là môn học. "My favorite subject is English" nghĩa là "Môn học yêu thích của tôi là Tiếng Anh."',
            skillTag: 'Từ vựng trường lớp',
          },
          {
            id: 't2-l2-q3',
            lessonId: 't2-l2',
            topicId: 2,
            type: 'sentence_order',
            promptVi: 'Sắp xếp từ thành câu đúng',
            questionText: 'Chúng tôi học môn Toán hôm nay:',
            audioText: 'We study Math today.',
            wordBank: ['today.', 'Math', 'We', 'study'],
            correctAnswer: 'We study Math today.',
            explanationVi: 'Cấu trúc: Chủ ngữ (We) + Động từ (study) + Môn học (Math) + Thời gian (today).',
            skillTag: 'Từ vựng trường lớp',
          },
          {
            id: 't2-l2-q4',
            lessonId: 't2-l2',
            topicId: 2,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tôi thích môn Tiếng Anh.',
            audioText: 'I like English.',
            correctAnswer: 'I like English.',
            acceptedVariants: ['I like English'],
            explanationVi: 'Dùng "I like + [Tên môn học]". I like English.',
            skillTag: 'Từ vựng trường lớp',
          },
        ],
      },
      {
        id: 't2-l3',
        topicId: 2,
        orderInTopic: 3,
        title: 'Hỏi thông tin đơn giản',
        subtitle: 'Chủ đề 2 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Đọc và trả lời câu hỏi về lớp học, giáo viên.',
        questions: [
          {
            id: 't2-l3-q1',
            lessonId: 't2-l3',
            topicId: 2,
            type: 'fill_blank',
            promptVi: 'Điền từ để hỏi',
            questionText: '___ is your classroom? — It is on the second floor.',
            audioText: 'Where is your classroom?',
            options: ['Where', 'Who', 'What'],
            correctAnswer: 'Where',
            explanationVi: 'Dùng "Where" (Ở đâu) khi câu trả lời chỉ vị trí "on the second floor" (ở tầng hai).',
            skillTag: 'Câu hỏi thông tin trường lớp',
          },
          {
            id: 't2-l3-q2',
            lessonId: 't2-l3',
            topicId: 2,
            type: 'multiple_choice',
            promptVi: 'Chọn câu trả lời phù hợp',
            questionText: 'Are you in class 10A?',
            audioText: 'Are you in class 10A?',
            options: ['Yes, I am.', 'Yes, I do.', 'Yes, she is.'],
            correctAnswer: 'Yes, I am.',
            explanationVi: 'Câu hỏi bắt đầu bằng "Are you...?" thì trả lời ngắn là "Yes, I am." hoặc "No, I\'m not."',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't2-l3-q3',
            lessonId: 't2-l3',
            topicId: 2,
            type: 'listening',
            promptVi: 'Nghe câu hỏi và chọn đáp án phù hợp',
            questionText: 'Nghe câu hỏi:',
            audioText: 'Who is your English teacher?',
            hideTranscriptBeforeAnswer: true,
            options: ['Ms. Minh is our teacher.', 'In room 204.', 'At eight o\'clock.'],
            correctAnswer: 'Ms. Minh is our teacher.',
            explanationVi: 'Bản chép: "Who is your English teacher?" (Ai là giáo viên Tiếng Anh của bạn?) -> Trả lời tên người.',
            skillTag: 'Câu hỏi thông tin trường lớp',
          },
          {
            id: 't2-l3-q4',
            lessonId: 't2-l3',
            topicId: 2,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hỏi đúng',
            questionText: 'Bạn có phải là học sinh mới không?',
            audioText: 'Are you a new student?',
            wordBank: ['student?', 'new', 'Are', 'you', 'a'],
            correctAnswer: 'Are you a new student?',
            explanationVi: 'Đảo động từ "Are" lên trước chủ ngữ "you" để tạo câu hỏi Yes/No.',
            skillTag: 'Động từ to be (am/is/are)',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 3: THỜI GIAN
  // --------------------------------------------------------------------------
  {
    id: 3,
    title: 'Thời gian',
    description: 'Nói giờ giấc, các ngày trong tuần và trao đổi lịch học.',
    canDoOutput: 'Trao đổi giờ học bằng câu đơn giản.',
    lessons: [
      {
        id: 't3-l1',
        topicId: 3,
        orderInTopic: 1,
        title: 'Số và giờ',
        subtitle: 'Chủ đề 3 · Bài 1',
        durationMinutes: 5,
        canDoGoal: 'Hỏi và trả lời bây giờ là mấy giờ.',
        questions: [
          {
            id: 't3-l1-q1',
            lessonId: 't3-l1',
            topicId: 3,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'What ___ is it? — It is seven o\'clock.',
            audioText: 'What time is it? It is seven o\'clock.',
            options: ['time', 'day', 'name'],
            correctAnswer: 'time',
            explanationVi: '"What time is it?" là câu hỏi "Bây giờ là mấy giờ?".',
            skillTag: 'Thời gian và giờ giấc',
          },
          {
            id: 't3-l1-q2',
            lessonId: 't3-l1',
            topicId: 3,
            type: 'listening',
            promptVi: 'Nghe và chọn đúng giờ được nhắc tới',
            questionText: 'Nghe âm thanh:',
            audioText: 'The class starts at eight thirty.',
            hideTranscriptBeforeAnswer: true,
            options: ['8 giờ 30 phút', '7 giờ 30 phút', '8 giờ đúng'],
            correctAnswer: '8 giờ 30 phút',
            explanationVi: 'Bản chép: "The class starts at eight thirty." (eight thirty = 8:30).',
            skillTag: 'Thời gian và giờ giấc',
          },
          {
            id: 't3-l1-q3',
            lessonId: 't3-l1',
            topicId: 3,
            type: 'fill_blank',
            promptVi: 'Chọn giới từ chỉ giờ đúng',
            questionText: 'Our lesson begins ___ nine o\'clock.',
            audioText: 'Our lesson begins at nine o\'clock.',
            options: ['at', 'on', 'in'],
            correctAnswer: 'at',
            explanationVi: 'Dùng giới từ "at" trước mốc giờ cụ thể (at 9 o\'clock, at 7:30).',
            skillTag: 'Giới từ chỉ thời gian (at/on/in)',
          },
          {
            id: 't3-l1-q4',
            lessonId: 't3-l1',
            topicId: 3,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu đúng',
            questionText: 'Bây giờ là 7 giờ đúng:',
            audioText: 'It is seven o\'clock.',
            wordBank: ['o\'clock.', 'seven', 'It', 'is'],
            correctAnswer: 'It is seven o\'clock.',
            explanationVi: 'Dùng "It is + [số giờ] + o\'clock" để nói giờ đúng.',
            skillTag: 'Thời gian và giờ giấc',
          },
        ],
      },
      {
        id: 't3-l2',
        topicId: 3,
        orderInTopic: 2,
        title: 'Ngày trong tuần',
        subtitle: 'Chủ đề 3 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Sử dụng đúng các thứ từ Monday đến Sunday với giới từ on.',
        questions: [
          {
            id: 't3-l2-q1',
            lessonId: 't3-l2',
            topicId: 3,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'Wednesday',
            audioText: 'Wednesday',
            options: ['Thứ Tư', 'Thứ Ba', 'Thứ Năm'],
            correctAnswer: 'Thứ Tư',
            explanationVi: 'Monday (Thứ 2), Tuesday (Thứ 3), Wednesday (Thứ 4), Thursday (Thứ 5).',
            skillTag: 'Từ vựng ngày trong tuần',
          },
          {
            id: 't3-l2-q2',
            lessonId: 't3-l2',
            topicId: 3,
            type: 'fill_blank',
            promptVi: 'Chọn giới từ đúng trước các thứ trong tuần',
            questionText: 'We have English ___ Monday.',
            audioText: 'We have English on Monday.',
            options: ['on', 'at', 'in'],
            correctAnswer: 'on',
            explanationVi: 'Dùng giới từ "on" trước các ngày trong tuần (on Monday, on Friday).',
            skillTag: 'Giới từ chỉ thời gian (at/on/in)',
          },
          {
            id: 't3-l2-q3',
            lessonId: 't3-l2',
            topicId: 3,
            type: 'error_correction',
            promptVi: 'Sửa lỗi giới từ trong câu',
            questionText: 'Sửa câu: "I study Science at Friday."',
            audioText: 'I study Science on Friday.',
            correctAnswer: 'I study Science on Friday.',
            acceptedVariants: ['I study Science on Friday'],
            explanationVi: 'Trước thứ trong tuần ("Friday") phải dùng giới từ "on" thay vì "at".',
            skillTag: 'Giới từ chỉ thời gian (at/on/in)',
          },
          {
            id: 't3-l2-q4',
            lessonId: 't3-l2',
            topicId: 3,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu đúng',
            questionText: 'Hôm nay là Thứ Ba:',
            audioText: 'Today is Tuesday.',
            wordBank: ['Tuesday.', 'is', 'Today'],
            correctAnswer: 'Today is Tuesday.',
            explanationVi: '"Today is Tuesday." nghĩa là "Hôm nay là Thứ Ba."',
            skillTag: 'Từ vựng ngày trong tuần',
          },
        ],
      },
      {
        id: 't3-l3',
        topicId: 3,
        orderInTopic: 3,
        title: 'Lịch học',
        subtitle: 'Chủ đề 3 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Trao đổi lịch học có kết hợp cả ngày và giờ.',
        questions: [
          {
            id: 't3-l3-q1',
            lessonId: 't3-l3',
            topicId: 3,
            type: 'fill_blank',
            promptVi: 'Điền từ để hỏi về thời gian',
            questionText: '___ do we have the Math test? — On Thursday morning.',
            audioText: 'When do we have the Math test?',
            options: ['When', 'Who', 'Where'],
            correctAnswer: 'When',
            explanationVi: 'Dùng "When" (Khi nào) để hỏi về thời gian diễn ra sự việc.',
            skillTag: 'Thời gian và giờ giấc',
          },
          {
            id: 't3-l3-q2',
            lessonId: 't3-l3',
            topicId: 3,
            type: 'listening',
            promptVi: 'Nghe lịch học và chọn thông tin đúng',
            questionText: 'Nghe âm thanh:',
            audioText: 'We have Biology on Tuesday at nine o\'clock.',
            hideTranscriptBeforeAnswer: true,
            options: ['Thứ Ba lúc 9 giờ', 'Thứ Năm lúc 9 giờ', 'Thứ Ba lúc 8 giờ'],
            correctAnswer: 'Thứ Ba lúc 9 giờ',
            explanationVi: 'Bản chép: "We have Biology on Tuesday at nine o\'clock."',
            skillTag: 'Giới từ chỉ thời gian (at/on/in)',
          },
          {
            id: 't3-l3-q3',
            lessonId: 't3-l3',
            topicId: 3,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hoàn chỉnh',
            questionText: 'Lớp học kết thúc lúc 11 giờ:',
            audioText: 'The class finishes at eleven.',
            wordBank: ['eleven.', 'at', 'finishes', 'The', 'class'],
            correctAnswer: 'The class finishes at eleven.',
            explanationVi: '"Finishes at eleven" nghĩa là kết thúc vào lúc 11 giờ.',
            skillTag: 'Thời gian và giờ giấc',
          },
          {
            id: 't3-l3-q4',
            lessonId: 't3-l3',
            topicId: 3,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tôi học Tiếng Anh vào Thứ Hai.',
            audioText: 'I study English on Monday.',
            correctAnswer: 'I study English on Monday.',
            acceptedVariants: ['I study English on Monday', 'I have English on Monday', 'I have English on Monday.'],
            explanationVi: 'Dùng "I study English on Monday." hoặc "I have English on Monday."',
            skillTag: 'Giới từ chỉ thời gian (at/on/in)',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 4: SINH HOẠT
  // --------------------------------------------------------------------------
  {
    id: 4,
    title: 'Sinh hoạt',
    description: 'Mô tả việc thường ngày, thói quen và lịch sinh hoạt cá nhân.',
    canDoOutput: 'Viết vài câu về lịch sinh hoạt.',
    lessons: [
      {
        id: 't4-l1',
        topicId: 4,
        orderInTopic: 1,
        title: 'Việc thường ngày',
        subtitle: 'Chủ đề 4 · Bài 1',
        durationMinutes: 6,
        canDoGoal: 'Nói về các hoạt động buổi sáng, chiều và tối.',
        questions: [
          {
            id: 't4-l1-q1',
            lessonId: 't4-l1',
            topicId: 4,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'do homework',
            audioText: 'do homework',
            options: ['Làm bài tập về nhà', 'Ăn sáng', 'Đi đến trường'],
            correctAnswer: 'Làm bài tập về nhà',
            explanationVi: 'Cụm "do homework" nghĩa là làm bài tập về nhà.',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l1-q2',
            lessonId: 't4-l1',
            topicId: 4,
            type: 'fill_blank',
            promptVi: 'Chọn dạng động từ đúng',
            questionText: 'She ___ up at six o\'clock every morning.',
            audioText: 'She wakes up at six o\'clock every morning.',
            options: ['wakes', 'wake', 'waking'],
            correctAnswer: 'wakes',
            explanationVi: 'Ở thì hiện tại đơn, với chủ ngữ ngôi thứ ba số ít (She, He), động từ thêm -s/-es ("wakes").',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l1-q3',
            lessonId: 't4-l1',
            topicId: 4,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu đúng',
            questionText: 'Tôi ăn sáng lúc 6 giờ 30:',
            audioText: 'I have breakfast at six thirty.',
            wordBank: ['thirty.', 'six', 'at', 'breakfast', 'I', 'have'],
            correctAnswer: 'I have breakfast at six thirty.',
            explanationVi: '"Have breakfast" là ăn sáng.',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l1-q4',
            lessonId: 't4-l1',
            topicId: 4,
            type: 'error_correction',
            promptVi: 'Sửa lỗi chia động từ',
            questionText: 'Sửa câu: "He go to school by bus."',
            audioText: 'He goes to school by bus.',
            correctAnswer: 'He goes to school by bus.',
            acceptedVariants: ['He goes to school by bus'],
            explanationVi: 'Chủ ngữ "He" cần chia động từ "go" thành "goes": "He goes to school by bus."',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
        ],
      },
      {
        id: 't4-l2',
        topicId: 4,
        orderInTopic: 2,
        title: 'Thói quen',
        subtitle: 'Chủ đề 4 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Dùng trạng từ chỉ tần suất always, usually, often.',
        questions: [
          {
            id: 't4-l2-q1',
            lessonId: 't4-l2',
            topicId: 4,
            type: 'multiple_choice',
            promptVi: 'Chọn nghĩa của từ',
            questionText: 'always',
            audioText: 'always',
            options: ['Luôn luôn', 'Hiếm khi', 'Không bao giờ'],
            correctAnswer: 'Luôn luôn',
            explanationVi: '"Always" (luôn luôn), "usually" (thường xuyên), "never" (không bao giờ).',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l2-q2',
            lessonId: 't4-l2',
            topicId: 4,
            type: 'sentence_order',
            promptVi: 'Sắp xếp vị trí trạng từ tần suất',
            questionText: 'Tôi thường đọc sách vào buổi tối:',
            audioText: 'I usually read books in the evening.',
            wordBank: ['evening.', 'the', 'in', 'books', 'read', 'usually', 'I'],
            correctAnswer: 'I usually read books in the evening.',
            explanationVi: 'Trạng từ tần suất ("usually") đứng trước động từ thường ("read").',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l2-q3',
            lessonId: 't4-l2',
            topicId: 4,
            type: 'listening',
            promptVi: 'Nghe câu và chọn thói quen được nhắc đến',
            questionText: 'Nghe âm thanh:',
            audioText: 'I always review my lessons before bed.',
            hideTranscriptBeforeAnswer: true,
            options: ['Luôn ôn bài trước khi đi ngủ', 'Luôn nghe nhạc vào buổi sáng', 'Thường tập thể dục buổi chiều'],
            correctAnswer: 'Luôn ôn bài trước khi đi ngủ',
            explanationVi: 'Bản chép: "I always review my lessons before bed."',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l2-q4',
            lessonId: 't4-l2',
            topicId: 4,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tôi làm bài tập mỗi ngày.',
            audioText: 'I do homework every day.',
            correctAnswer: 'I do homework every day.',
            acceptedVariants: ['I do homework every day', 'I do my homework every day', 'I do my homework every day.'],
            explanationVi: '"Every day" nghĩa là mỗi ngày. I do homework every day.',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
        ],
      },
      {
        id: 't4-l3',
        topicId: 4,
        orderInTopic: 3,
        title: 'Hỏi về một ngày',
        subtitle: 'Chủ đề 4 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Hỏi và trả lời về hoạt động trong ngày với trợ động từ do/does.',
        questions: [
          {
            id: 't4-l3-q1',
            lessonId: 't4-l3',
            topicId: 4,
            type: 'fill_blank',
            promptVi: 'Chọn trợ động từ đúng',
            questionText: 'What ___ you do in the evening?',
            audioText: 'What do you do in the evening?',
            options: ['do', 'are', 'is'],
            correctAnswer: 'do',
            explanationVi: 'Với động từ thường "do" và chủ ngữ "you", ta mượn trợ động từ "do" để đặt câu hỏi.',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l3-q2',
            lessonId: 't4-l3',
            topicId: 4,
            type: 'fill_blank',
            promptVi: 'Chọn trợ động từ cho chủ ngữ ngôi thứ ba số ít',
            questionText: 'What time ___ she go to school?',
            audioText: 'What time does she go to school?',
            options: ['does', 'do', 'is'],
            correctAnswer: 'does',
            explanationVi: 'Chủ ngữ "she" dùng trợ động từ "does", và động từ chính "go" giữ nguyên mẫu.',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l3-q3',
            lessonId: 't4-l3',
            topicId: 4,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hỏi đúng',
            questionText: 'Bạn đi ngủ lúc mấy giờ?',
            audioText: 'What time do you go to bed?',
            wordBank: ['bed?', 'to', 'go', 'you', 'do', 'time', 'What'],
            correctAnswer: 'What time do you go to bed?',
            explanationVi: 'Cấu trúc: What time + do + you + go to bed?',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't4-l3-q4',
            lessonId: 't4-l3',
            topicId: 4,
            type: 'multiple_choice',
            promptVi: 'Chọn câu trả lời đúng ngữ pháp',
            questionText: 'Do you study in the library after school?',
            audioText: 'Do you study in the library after school?',
            options: ['Yes, I do.', 'Yes, I am.', 'Yes, I study.'],
            correctAnswer: 'Yes, I do.',
            explanationVi: 'Câu hỏi bắt đầu bằng "Do you...?" trả lời ngắn là "Yes, I do." hoặc "No, I don\'t."',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 5: ĂN UỐNG
  // --------------------------------------------------------------------------
  {
    id: 5,
    title: 'Ăn uống',
    description: 'Gọi món ăn, đồ uống và hỏi giá tiền trong giao tiếp hàng ngày.',
    canDoOutput: 'Hoàn thành hội thoại gọi đồ uống.',
    lessons: [
      {
        id: 't5-l1',
        topicId: 5,
        orderInTopic: 1,
        title: 'Món và đồ uống',
        subtitle: 'Chủ đề 5 · Bài 1',
        durationMinutes: 5,
        canDoGoal: 'Nhận biết từ vựng các món ăn, thức uống quen thuộc.',
        questions: [
          {
            id: 't5-l1-q1',
            lessonId: 't5-l1',
            topicId: 5,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'orange juice',
            audioText: 'orange juice',
            options: ['Nước cam ép', 'Trà sữa', 'Cà phê nóng'],
            correctAnswer: 'Nước cam ép',
            explanationVi: '"Orange juice" là nước cam ép.',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l1-q2',
            lessonId: 't5-l1',
            topicId: 5,
            type: 'fill_blank',
            promptVi: 'Điền từ còn thiếu',
            questionText: 'A ___ of tea, please.',
            audioText: 'A cup of tea, please.',
            options: ['cup', 'book', 'pen'],
            correctAnswer: 'cup',
            explanationVi: '"A cup of tea" nghĩa là một tách trà.',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l1-q3',
            lessonId: 't5-l1',
            topicId: 5,
            type: 'listening',
            promptVi: 'Nghe và chọn món được nhắc đến',
            questionText: 'Nghe âm thanh:',
            audioText: 'I usually have bread and milk for breakfast.',
            hideTranscriptBeforeAnswer: true,
            options: ['Bánh mì và sữa', 'Phở và trà đá', 'Cơm và nước lọc'],
            correctAnswer: 'Bánh mì và sữa',
            explanationVi: 'Bản chép: "I usually have bread and milk for breakfast."',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l1-q4',
            lessonId: 't5-l1',
            topicId: 5,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu đúng',
            questionText: 'Cho tôi một cốc nước lọc:',
            audioText: 'A glass of water, please.',
            wordBank: ['please.', 'water,', 'of', 'glass', 'A'],
            correctAnswer: 'A glass of water, please.',
            explanationVi: '"A glass of water, please." — một cốc nước lọc.',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
        ],
      },
      {
        id: 't5-l2',
        topicId: 5,
        orderInTopic: 2,
        title: 'Gọi món',
        subtitle: 'Chủ đề 5 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Sử dụng mẫu lịch sự I would like... và Can I have...?',
        questions: [
          {
            id: 't5-l2-q1',
            lessonId: 't5-l2',
            topicId: 5,
            type: 'fill_blank',
            promptVi: 'Điền từ tạo câu gọi món lịch sự',
            questionText: 'I ___ like a cup of coffee, please.',
            audioText: 'I would like a cup of coffee, please.',
            options: ['would', 'am', 'are'],
            correctAnswer: 'would',
            explanationVi: 'Mẫu câu "I would like..." dùng để gọi món một cách lịch sự (tương đương "Tôi muốn gọi...").',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l2-q2',
            lessonId: 't5-l2',
            topicId: 5,
            type: 'multiple_choice',
            promptVi: 'Chọn câu trả lời phù hợp khi nhân viên hỏi',
            questionText: 'What would you like to drink?',
            audioText: 'What would you like to drink?',
            options: ['I would like some green tea, please.', 'It is twenty thousand dong.', 'I am a student.'],
            correctAnswer: 'I would like some green tea, please.',
            explanationVi: 'Khi được hỏi "Bạn muốn uống gì?", ta trả lời "I would like + [tên đồ uống], please."',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l2-q3',
            lessonId: 't5-l2',
            topicId: 5,
            type: 'sentence_order',
            promptVi: 'Sắp xếp câu yêu cầu lịch sự',
            questionText: 'Cho tôi xem thực đơn được không?',
            audioText: 'Can I have the menu, please?',
            wordBank: ['please?', 'menu,', 'the', 'have', 'I', 'Can'],
            correctAnswer: 'Can I have the menu, please?',
            explanationVi: '"Can I have..., please?" là cách hỏi xin/gọi đồ rất thông dụng.',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l2-q4',
            lessonId: 't5-l2',
            topicId: 5,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Làm ơn cho tôi một tách trà.',
            audioText: 'A cup of tea, please.',
            correctAnswer: 'A cup of tea, please.',
            acceptedVariants: ['A cup of tea, please', 'I would like a cup of tea, please', 'Can I have a cup of tea, please'],
            explanationVi: 'Bạn có thể viết ngắn gọn "A cup of tea, please." hoặc "I would like a cup of tea, please."',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
        ],
      },
      {
        id: 't5-l3',
        topicId: 5,
        orderInTopic: 3,
        title: 'Hỏi giá',
        subtitle: 'Chủ đề 5 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Hỏi giá bằng How much is this? và nghe hiểu số tiền.',
        questions: [
          {
            id: 't5-l3-q1',
            lessonId: 't5-l3',
            topicId: 5,
            type: 'fill_blank',
            promptVi: 'Điền từ để hỏi giá tiền',
            questionText: 'How ___ is this sandwich?',
            audioText: 'How much is this sandwich?',
            options: ['much', 'many', 'old'],
            correctAnswer: 'much',
            explanationVi: 'Dùng "How much is...?" để hỏi giá tiền của một món đồ.',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l3-q2',
            lessonId: 't5-l3',
            topicId: 5,
            type: 'listening',
            promptVi: 'Nghe và chọn mức giá đúng',
            questionText: 'Nghe âm thanh:',
            audioText: 'That is three dollars, please.',
            hideTranscriptBeforeAnswer: true,
            options: ['3 đô la', '13 đô la', '30 đô la'],
            correctAnswer: '3 đô la',
            explanationVi: 'Bản chép: "That is three dollars, please."',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l3-q3',
            lessonId: 't5-l3',
            topicId: 5,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hỏi giá tiền',
            questionText: 'Món này giá bao nhiêu?',
            audioText: 'How much is this?',
            wordBank: ['this?', 'is', 'much', 'How'],
            correctAnswer: 'How much is this?',
            explanationVi: '"How much is this?" — Câu hỏi giá tiền ngắn gọn và phổ biến nhất.',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't5-l3-q4',
            lessonId: 't5-l3',
            topicId: 5,
            type: 'error_correction',
            promptVi: 'Sửa câu hỏi giá bị sai',
            questionText: 'Sửa câu: "How many is this coffee?"',
            audioText: 'How much is this coffee?',
            correctAnswer: 'How much is this coffee?',
            acceptedVariants: ['How much is this coffee'],
            explanationVi: 'Khi hỏi giá tiền, luôn dùng "How much" chứ không dùng "How many".',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 6: CHỈ ĐƯỜNG
  // --------------------------------------------------------------------------
  {
    id: 6,
    title: 'Chỉ đường',
    description: 'Tên các địa điểm công cộng, giới từ chỉ vị trí và hướng dẫn đường đi.',
    canDoOutput: 'Hiểu hướng dẫn đường đi ngắn.',
    lessons: [
      {
        id: 't6-l1',
        topicId: 6,
        orderInTopic: 1,
        title: 'Địa điểm',
        subtitle: 'Chủ đề 6 · Bài 1',
        durationMinutes: 5,
        canDoGoal: 'Nhận biết library, bus stop, hospital, bookstore.',
        questions: [
          {
            id: 't6-l1-q1',
            lessonId: 't6-l1',
            topicId: 6,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'library',
            audioText: 'library',
            options: ['Thư viện', 'Hiệu sách', 'Trạm xe buýt'],
            correctAnswer: 'Thư viện',
            explanationVi: 'Lưu ý: "Library" là thư viện (nơi mượn/đọc sách), còn "Bookstore" mới là hiệu sách.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l1-q2',
            lessonId: 't6-l1',
            topicId: 6,
            type: 'fill_blank',
            promptVi: 'Điền địa điểm phù hợp',
            questionText: 'I wait for the bus at the ___.',
            audioText: 'I wait for the bus at the bus stop.',
            options: ['bus stop', 'library', 'kitchen'],
            correctAnswer: 'bus stop',
            explanationVi: '"Bus stop" là điểm dừng / trạm xe buýt.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l1-q3',
            lessonId: 't6-l1',
            topicId: 6,
            type: 'listening',
            promptVi: 'Nghe và chọn địa điểm người nói đang tìm',
            questionText: 'Nghe âm thanh:',
            audioText: 'Excuse me, is there a bookstore near here?',
            hideTranscriptBeforeAnswer: true,
            options: ['Hiệu sách', 'Bệnh viện', 'Siêu thị'],
            correctAnswer: 'Hiệu sách',
            explanationVi: 'Bản chép: "Excuse me, is there a bookstore near here?"',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l1-q4',
            lessonId: 't6-l1',
            topicId: 6,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hỏi',
            questionText: 'Trạm xe buýt ở đâu?',
            audioText: 'Where is the bus stop?',
            wordBank: ['stop?', 'bus', 'the', 'is', 'Where'],
            correctAnswer: 'Where is the bus stop?',
            explanationVi: 'Dùng "Where is the + [địa điểm]?" để hỏi vị trí.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
        ],
      },
      {
        id: 't6-l2',
        topicId: 6,
        orderInTopic: 2,
        title: 'Vị trí',
        subtitle: 'Chủ đề 6 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Mô tả vị trí bằng next to, opposite, near, on the left.',
        questions: [
          {
            id: 't6-l2-q1',
            lessonId: 't6-l2',
            topicId: 6,
            type: 'multiple_choice',
            promptVi: 'Chọn nghĩa của cụm từ',
            questionText: 'next to',
            audioText: 'next to',
            options: ['Ngay bên cạnh', 'Ở phía đối diện', 'Ở đằng xa'],
            correctAnswer: 'Ngay bên cạnh',
            explanationVi: '"Next to" nghĩa là ngay bên cạnh; "Opposite" là đối diện.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l2-q2',
            lessonId: 't6-l2',
            topicId: 6,
            type: 'fill_blank',
            promptVi: 'Điền từ hoàn thành cụm chỉ vị trí',
            questionText: 'The library is next ___ the school.',
            audioText: 'The library is next to the school.',
            options: ['to', 'on', 'at'],
            correctAnswer: 'to',
            explanationVi: 'Cụm giới từ cố định là "next to" (bên cạnh).',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l2-q3',
            lessonId: 't6-l2',
            topicId: 6,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu đúng',
            questionText: 'Ngân hàng ở bên tay trái:',
            audioText: 'The bank is on the left.',
            wordBank: ['left.', 'the', 'on', 'is', 'bank', 'The'],
            correctAnswer: 'The bank is on the left.',
            explanationVi: '"On the left" là ở bên trái; "On the right" là ở bên phải.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l2-q4',
            lessonId: 't6-l2',
            topicId: 6,
            type: 'error_correction',
            promptVi: 'Sửa lỗi cụm giới từ',
            questionText: 'Sửa câu: "The school is next the park."',
            audioText: 'The school is next to the park.',
            correctAnswer: 'The school is next to the park.',
            acceptedVariants: ['The school is next to the park'],
            explanationVi: 'Sau "next" cần có "to" khi mang nghĩa "bên cạnh": "next to the park".',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
        ],
      },
      {
        id: 't6-l3',
        topicId: 6,
        orderInTopic: 3,
        title: 'Hỏi và chỉ đường',
        subtitle: 'Chủ đề 6 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Hiểu chỉ dẫn Go straight, Turn left, Turn right.',
        questions: [
          {
            id: 't6-l3-q1',
            lessonId: 't6-l3',
            topicId: 6,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'Go straight and turn right.',
            audioText: 'Go straight and turn right.',
            options: ['Đi thẳng rồi rẽ phải.', 'Rẽ trái rồi dừng lại.', 'Đi qua cầu rồi rẽ trái.'],
            correctAnswer: 'Đi thẳng rồi rẽ phải.',
            explanationVi: '"Go straight" = đi thẳng; "turn right" = rẽ phải; "turn left" = rẽ trái.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l3-q2',
            lessonId: 't6-l3',
            topicId: 6,
            type: 'listening',
            promptVi: 'Nghe hướng dẫn đường đi và chọn đáp án đúng',
            questionText: 'Nghe âm thanh:',
            audioText: 'Go straight for two minutes, then turn left. The library is on your right.',
            hideTranscriptBeforeAnswer: true,
            options: [
              'Đi thẳng 2 phút, rẽ trái, thư viện ở bên phải',
              'Rẽ phải ngay, thư viện ở bên trái',
              'Đi thẳng 10 phút qua trạm xe buýt',
            ],
            correctAnswer: 'Đi thẳng 2 phút, rẽ trái, thư viện ở bên phải',
            explanationVi: 'Bản chép: "Go straight for two minutes, then turn left. The library is on your right."',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l3-q3',
            lessonId: 't6-l3',
            topicId: 6,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu chỉ đường',
            questionText: 'Đi thẳng và rẽ trái:',
            audioText: 'Go straight and turn left.',
            wordBank: ['left.', 'turn', 'and', 'straight', 'Go'],
            correctAnswer: 'Go straight and turn left.',
            explanationVi: '"Go straight and turn left." nghĩa là "Đi thẳng và rẽ trái."',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't6-l3-q4',
            lessonId: 't6-l3',
            topicId: 6,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho cụm chỉ đường sau',
            questionText: 'Rẽ phải',
            audioText: 'Turn right',
            correctAnswer: 'Turn right',
            acceptedVariants: ['Turn right', 'Turn right.'],
            explanationVi: '"Turn right" là rẽ phải; "Turn left" là rẽ trái.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 7: SỞ THÍCH
  // --------------------------------------------------------------------------
  {
    id: 7,
    title: 'Sở thích',
    description: 'Chia sẻ hoạt động yêu thích trong thời gian rảnh và rủ bạn cùng tham gia.',
    canDoOutput: 'Trả lời câu hỏi về sở thích.',
    lessons: [
      {
        id: 't7-l1',
        topicId: 7,
        orderInTopic: 1,
        title: 'Hoạt động',
        subtitle: 'Chủ đề 7 · Bài 1',
        durationMinutes: 5,
        canDoGoal: 'Nói về đọc sách, nghe nhạc, chơi thể thao.',
        questions: [
          {
            id: 't7-l1-q1',
            lessonId: 't7-l1',
            topicId: 7,
            type: 'word_match',
            promptVi: 'Chọn nghĩa tiếng Việt đúng',
            questionText: 'listening to music',
            audioText: 'listening to music',
            options: ['Nghe nhạc', 'Xem phim', 'Chơi bóng đá'],
            correctAnswer: 'Nghe nhạc',
            explanationVi: '"Listen to music" là nghe nhạc.',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't7-l1-q2',
            lessonId: 't7-l1',
            topicId: 7,
            type: 'fill_blank',
            promptVi: 'Chọn động từ đi kèm đúng',
            questionText: 'They often ___ football after school.',
            audioText: 'They often play football after school.',
            options: ['play', 'read', 'listen'],
            correctAnswer: 'play',
            explanationVi: 'Dùng động từ "play" với các môn thể thao có bóng (play football, play badminton).',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't7-l1-q3',
            lessonId: 't7-l1',
            topicId: 7,
            type: 'listening',
            promptVi: 'Nghe và chọn hoạt động lúc rảnh rỗi',
            questionText: 'Nghe âm thanh:',
            audioText: 'In my free time, I like reading science books.',
            hideTranscriptBeforeAnswer: true,
            options: ['Đọc sách khoa học', 'Chơi cờ vua', 'Nấu ăn cùng gia đình'],
            correctAnswer: 'Đọc sách khoa học',
            explanationVi: 'Bản chép: "In my free time, I like reading science books."',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't7-l1-q4',
            lessonId: 't7-l1',
            topicId: 7,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu đúng',
            questionText: 'Tôi thích đọc sách:',
            audioText: 'I like reading books.',
            wordBank: ['books.', 'reading', 'like', 'I'],
            correctAnswer: 'I like reading books.',
            explanationVi: 'Sau động từ "like", ta thường dùng danh động từ thêm -ing ("reading") để nói về sở thích.',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
        ],
      },
      {
        id: 't7-l2',
        topicId: 7,
        orderInTopic: 2,
        title: 'Thích và không thích',
        subtitle: 'Chủ đề 7 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Dùng I like..., I don\'t like... và câu hỏi Do you like...?',
        questions: [
          {
            id: 't7-l2-q1',
            lessonId: 't7-l2',
            topicId: 7,
            type: 'fill_blank',
            promptVi: 'Điền trợ động từ phủ định',
            questionText: 'I ___ like waking up late.',
            audioText: 'I don\'t like waking up late.',
            options: ["don't", 'am not', 'not'],
            correctAnswer: "don't",
            explanationVi: 'Dùng "don\'t like" (do not like) với chủ ngữ I/you/we/they để diễn tả điều không thích.',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't7-l2-q2',
            lessonId: 't7-l2',
            topicId: 7,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hỏi sở thích',
            questionText: 'Bạn có thích nghe nhạc không?',
            audioText: 'Do you like listening to music?',
            wordBank: ['music?', 'to', 'listening', 'like', 'you', 'Do'],
            correctAnswer: 'Do you like listening to music?',
            explanationVi: 'Mẫu câu hỏi sở thích: "Do you like + V-ing?"',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't7-l2-q3',
            lessonId: 't7-l2',
            topicId: 7,
            type: 'error_correction',
            promptVi: 'Sửa câu phủ định bị sai',
            questionText: 'Sửa câu: "I not like coffee."',
            audioText: 'I do not like coffee.',
            correctAnswer: 'I do not like coffee.',
            acceptedVariants: ["I don't like coffee", "I don't like coffee.", 'I do not like coffee'],
            explanationVi: 'Với động từ thường "like", câu phủ định phải mượn trợ động từ: "I don\'t like coffee."',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't7-l2-q4',
            lessonId: 't7-l2',
            topicId: 7,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tôi thích chơi cầu lông.',
            audioText: 'I like playing badminton.',
            correctAnswer: 'I like playing badminton.',
            acceptedVariants: ['I like playing badminton', 'I like to play badminton', 'I like to play badminton.'],
            explanationVi: 'Viết "I like playing badminton." hoặc "I like to play badminton." đều đúng.',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
        ],
      },
      {
        id: 't7-l3',
        topicId: 7,
        orderInTopic: 3,
        title: 'Rủ bạn tham gia',
        subtitle: 'Chủ đề 7 · Bài 3',
        durationMinutes: 6,
        canDoGoal: 'Dùng Let\'s + V nguyên mẫu để rủ bạn bè.',
        questions: [
          {
            id: 't7-l3-q1',
            lessonId: 't7-l3',
            topicId: 7,
            type: 'fill_blank',
            promptVi: 'Điền dạng động từ đúng sau Let\'s',
            questionText: 'Let\'s ___ together at the library this afternoon.',
            audioText: 'Let\'s study together at the library this afternoon.',
            options: ['study', 'studying', 'studies'],
            correctAnswer: 'study',
            explanationVi: 'Sau "Let\'s" (Chúng mình hãy...), động từ luôn ở dạng nguyên mẫu không chia ("study").',
            skillTag: 'Mẫu câu gợi ý Let\'s',
          },
          {
            id: 't7-l3-q2',
            lessonId: 't7-l3',
            topicId: 7,
            type: 'multiple_choice',
            promptVi: 'Chọn lời đồng ý tự nhiên khi bạn rủ đi học nhóm',
            questionText: 'Let\'s practice English after class!',
            audioText: 'Let\'s practice English after class!',
            options: ['Great idea! Let\'s go.', 'No, I am a student.', 'It is on Monday.'],
            correctAnswer: 'Great idea! Let\'s go.',
            explanationVi: '"Great idea! Let\'s go." nghĩa là "Ý kiến hay đấy! Đi thôi."',
            skillTag: 'Mẫu câu gợi ý Let\'s',
          },
          {
            id: 't7-l3-q3',
            lessonId: 't7-l3',
            topicId: 7,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu rủ bạn',
            questionText: 'Chúng mình cùng chơi bóng đá nhé:',
            audioText: 'Let\'s play football.',
            wordBank: ['football.', 'play', 'Let\'s'],
            correctAnswer: 'Let\'s play football.',
            explanationVi: '"Let\'s + động từ nguyên mẫu" dùng để rủ ai đó cùng làm gì.',
            skillTag: 'Mẫu câu gợi ý Let\'s',
          },
          {
            id: 't7-l3-q4',
            lessonId: 't7-l3',
            topicId: 7,
            type: 'error_correction',
            promptVi: 'Sửa lỗi dạng động từ sau Let\'s',
            questionText: 'Sửa câu: "Let\'s going to the library."',
            audioText: 'Let\'s go to the library.',
            correctAnswer: 'Let\'s go to the library.',
            acceptedVariants: ["Let's go to the library"],
            explanationVi: 'Sau "Let\'s" dùng động từ nguyên mẫu "go" thay vì "going": "Let\'s go to the library."',
            skillTag: 'Mẫu câu gợi ý Let\'s',
          },
        ],
      },
    ],
  },

  // --------------------------------------------------------------------------
  // CHỦ ĐỀ 8: TỔNG ÔN
  // --------------------------------------------------------------------------
  {
    id: 8,
    title: 'Tổng ôn',
    description: 'Kết hợp toàn bộ từ vựng và mẫu câu từ Chủ đề 1 đến Chủ đề 7 trong tình huống thực tế.',
    canDoOutput: 'Kết hợp từ và mẫu câu đã học.',
    lessons: [
      {
        id: 't8-l1',
        topicId: 8,
        orderInTopic: 1,
        title: 'Gặp bạn mới',
        subtitle: 'Chủ đề 8 · Bài 1',
        durationMinutes: 6,
        canDoGoal: 'Kết hợp chào hỏi, giới thiệu tên, lớp và sở thích.',
        questions: [
          {
            id: 't8-l1-q1',
            lessonId: 't8-l1',
            topicId: 8,
            type: 'fill_blank',
            promptVi: 'Điền động từ to be đúng',
            questionText: 'Hello! My name ___ Nam and I am in class 10B.',
            audioText: 'Hello! My name is Nam and I am in class 10B.',
            options: ['is', 'am', 'are'],
            correctAnswer: 'is',
            explanationVi: 'Chủ ngữ "My name" là danh từ số ít nên đi với động từ to be là "is".',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't8-l1-q2',
            lessonId: 't8-l1',
            topicId: 8,
            type: 'listening',
            promptVi: 'Nghe đoạn tự giới thiệu và chọn thông tin đúng',
            questionText: 'Nghe âm thanh:',
            audioText: 'Hi, I am Mai. My favorite subject is English and I like reading books.',
            hideTranscriptBeforeAnswer: true,
            options: [
              'Mai thích môn Tiếng Anh và thích đọc sách',
              'Mai thích môn Toán và chơi cầu lông',
              'Mai là giáo viên môn Khoa học',
            ],
            correctAnswer: 'Mai thích môn Tiếng Anh và thích đọc sách',
            explanationVi: 'Bản chép: "Hi, I am Mai. My favorite subject is English and I like reading books."',
            skillTag: 'Mẫu câu giới thiệu bản thân',
          },
          {
            id: 't8-l1-q3',
            lessonId: 't8-l1',
            topicId: 8,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hoàn chỉnh',
            questionText: 'Rất vui được gặp bạn hôm nay:',
            audioText: 'Nice to meet you today.',
            wordBank: ['today.', 'you', 'meet', 'to', 'Nice'],
            correctAnswer: 'Nice to meet you today.',
            explanationVi: '"Nice to meet you today."',
            skillTag: 'Giao tiếp làm quen',
          },
          {
            id: 't8-l1-q4',
            lessonId: 't8-l1',
            topicId: 8,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Họ là bạn của tôi.',
            audioText: 'They are my friends.',
            correctAnswer: 'They are my friends.',
            acceptedVariants: ['They are my friends', "They're my friends", 'They are my friends.'],
            explanationVi: 'Dùng "They are" với chủ ngữ số nhiều: "They are my friends."',
            skillTag: 'Động từ to be (am/is/are)',
          },
        ],
      },
      {
        id: 't8-l2',
        topicId: 8,
        orderInTopic: 2,
        title: 'Một ngày đi học',
        subtitle: 'Chủ đề 8 · Bài 2',
        durationMinutes: 6,
        canDoGoal: 'Kết hợp thời gian, môn học, ăn uống và chỉ đường.',
        questions: [
          {
            id: 't8-l2-q1',
            lessonId: 't8-l2',
            topicId: 8,
            type: 'fill_blank',
            promptVi: 'Chọn cặp giới từ đúng',
            questionText: 'We have Science ___ Wednesday ___ eight o\'clock.',
            audioText: 'We have Science on Wednesday at eight o\'clock.',
            options: ['on / at', 'at / on', 'in / at'],
            correctAnswer: 'on / at',
            explanationVi: 'Dùng "on" trước thứ trong tuần (on Wednesday) và "at" trước giờ giấc (at eight o\'clock).',
            skillTag: 'Giới từ chỉ thời gian (at/on/in)',
          },
          {
            id: 't8-l2-q2',
            lessonId: 't8-l2',
            topicId: 8,
            type: 'error_correction',
            promptVi: 'Sửa câu bị sai ngữ pháp',
            questionText: 'Sửa câu: "She study at the library every afternoon."',
            audioText: 'She studies at the library every afternoon.',
            correctAnswer: 'She studies at the library every afternoon.',
            acceptedVariants: ['She studies at the library every afternoon'],
            explanationVi: 'Với chủ ngữ "She" ở hiện tại đơn, động từ "study" đổi thành "studies".',
            skillTag: 'Thì hiện tại đơn & Sinh hoạt',
          },
          {
            id: 't8-l2-q3',
            lessonId: 't8-l2',
            topicId: 8,
            type: 'listening',
            promptVi: 'Nghe hội thoại ngắn và chọn địa điểm hẹn gặp',
            questionText: 'Nghe âm thanh:',
            audioText: 'Let\'s meet at the bookstore opposite our school at four o\'clock.',
            hideTranscriptBeforeAnswer: true,
            options: [
              'Hiệu sách đối diện trường lúc 4 giờ',
              'Thư viện bên cạnh trường lúc 5 giờ',
              'Trạm xe buýt lúc 4 giờ',
            ],
            correctAnswer: 'Hiệu sách đối diện trường lúc 4 giờ',
            explanationVi: 'Bản chép: "Let\'s meet at the bookstore opposite our school at four o\'clock."',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
          {
            id: 't8-l2-q4',
            lessonId: 't8-l2',
            topicId: 8,
            type: 'sentence_order',
            promptVi: 'Sắp xếp thành câu hoàn chỉnh',
            questionText: 'Thư viện ở ngay bên cạnh phòng học của chúng tôi:',
            audioText: 'The library is next to our classroom.',
            wordBank: ['classroom.', 'our', 'to', 'next', 'is', 'library', 'The'],
            correctAnswer: 'The library is next to our classroom.',
            explanationVi: '"Next to our classroom" nghĩa là ngay bên cạnh phòng học của chúng tôi.',
            skillTag: 'Từ vựng địa điểm & chỉ đường',
          },
        ],
      },
      {
        id: 't8-l3',
        topicId: 8,
        orderInTopic: 3,
        title: 'Bài kiểm tra cuối chặng',
        subtitle: 'Chủ đề 8 · Bài 3',
        durationMinutes: 7,
        canDoGoal: 'Đánh giá tổng hợp các kỹ năng nền tảng đã học trong 8 chủ đề.',
        questions: [
          {
            id: 't8-l3-q1',
            lessonId: 't8-l3',
            topicId: 8,
            type: 'fill_blank',
            promptVi: 'Điền động từ to be phù hợp',
            questionText: 'Lan and Minh ___ students in my class.',
            audioText: 'Lan and Minh are students in my class.',
            options: ['are', 'is', 'am'],
            correctAnswer: 'are',
            explanationVi: '"Lan and Minh" là chủ ngữ số nhiều (2 người) nên dùng động từ to be là "are".',
            skillTag: 'Động từ to be (am/is/are)',
          },
          {
            id: 't8-l3-q2',
            lessonId: 't8-l3',
            topicId: 8,
            type: 'fill_blank',
            promptVi: 'Chọn mạo từ đúng',
            questionText: 'I would like ___ cup of tea and ___ orange.',
            audioText: 'I would like a cup of tea and an orange.',
            options: ['a / an', 'an / a', 'a / a'],
            correctAnswer: 'a / an',
            explanationVi: 'Dùng "a" trước phụ âm ("cup") và "an" trước nguyên âm ("orange").',
            skillTag: 'Mạo từ (a/an)',
          },
          {
            id: 't8-l3-q3',
            lessonId: 't8-l3',
            topicId: 8,
            type: 'listening',
            promptVi: 'Nghe câu và chọn nội dung đúng',
            questionText: 'Nghe âm thanh:',
            audioText: 'Excuse me, how much is this English notebook?',
            hideTranscriptBeforeAnswer: true,
            options: [
              'Hỏi giá quyển vở Tiếng Anh',
              'Hỏi đường đi tới thư viện',
              'Rủ bạn cùng làm bài tập về nhà',
            ],
            correctAnswer: 'Hỏi giá quyển vở Tiếng Anh',
            explanationVi: 'Bản chép: "Excuse me, how much is this English notebook?"',
            skillTag: 'Giao tiếp ăn uống & gọi món',
          },
          {
            id: 't8-l3-q4',
            lessonId: 't8-l3',
            topicId: 8,
            type: 'error_correction',
            promptVi: 'Sửa lỗi ngữ pháp trong câu',
            questionText: 'Sửa câu: "He don\'t like playing football."',
            audioText: 'He doesn\'t like playing football.',
            correctAnswer: "He doesn't like playing football.",
            acceptedVariants: [
              "He doesn't like playing football",
              'He does not like playing football',
              'He does not like playing football.',
            ],
            explanationVi: 'Chủ ngữ ngôi thứ ba số ít "He" dùng trợ động từ phủ định là "doesn\'t" (does not).',
            skillTag: 'Sở thích & cấu trúc like + V-ing',
          },
          {
            id: 't8-l3-q5',
            lessonId: 't8-l3',
            topicId: 8,
            type: 'short_input',
            promptVi: 'Viết tiếng Anh cho câu sau',
            questionText: 'Tên của tôi là Lan. Tôi là học sinh.',
            audioText: 'My name is Lan. I am a student.',
            correctAnswer: 'My name is Lan. I am a student.',
            acceptedVariants: [
              'My name is Lan. I am a student',
              "My name is Lan. I'm a student",
              "My name is Lan. I'm a student.",
            ],
            explanationVi: 'Kết hợp 2 mẫu câu nền tảng: "My name is Lan. I am a student."',
            skillTag: 'Mẫu câu giới thiệu bản thân',
          },
        ],
      },
    ],
  },
];

// ============================================================================
// CÁC HÀM TRUY VẤN & TÍNH TOÁN LỊCH ÔN NGẮT QUÃNG (1, 3, 7, 14, 30 NGÀY)
// ============================================================================

export function getAllEnglishLessons(): EnglishLesson[] {
  return ENGLISH_CURRICULUM_TOPICS.flatMap(t => t.lessons);
}

export function getAllEnglishQuestions(): EnglishQuestion[] {
  return getAllEnglishLessons().flatMap(l => l.questions);
}

export function getLessonById(lessonId: string): EnglishLesson | undefined {
  return getAllEnglishLessons().find(l => l.id === lessonId);
}

export function getQuestionById(questionId: string): EnglishQuestion | undefined {
  return getAllEnglishQuestions().find(q => q.id === questionId);
}

export function getDefaultEnglishProgress(): EnglishLearningProgress {
  const todayStr = new Date().toISOString().slice(0, 10);
  return {
    dailyGoalMinutes: 15,
    minutesStudiedToday: 5,
    lastStudyDate: todayStr,
    completedLessons: {
      // Khởi tạo bài 1 đã hoàn thành để bài 2 "Giới thiệu bản thân" sẵn sàng như Hình 1 & Hình 3
      't1-l1': {
        lessonId: 't1-l1',
        firstTryCorrect: 5,
        totalQuestions: 6,
        finalCorrectAfterRetry: 6,
        weakSkills: ['Mẫu câu tạm biệt'],
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        eventId: 'seed-t1-l1',
      },
    },
    reviewStates: {
      't1-l2-q4': {
        questionId: 't1-l2-q4',
        lessonId: 't1-l2',
        skillTag: 'Động từ to be (am/is/are)',
        intervalIndex: 0,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        independentCorrectCount: 1,
        distinctDaysCorrect: [new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10)],
        wrongCount: 1,
        mastered: false,
      },
      't1-l2-q5': {
        questionId: 't1-l2-q5',
        lessonId: 't1-l2',
        skillTag: 'Động từ to be (am/is/are)',
        intervalIndex: 0,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        independentCorrectCount: 1,
        distinctDaysCorrect: [new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10)],
        wrongCount: 0,
        mastered: false,
      },
      't2-l1-q2': {
        questionId: 't2-l1-q2',
        lessonId: 't2-l1',
        skillTag: 'Mạo từ (a/an)',
        intervalIndex: 0,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        independentCorrectCount: 0,
        distinctDaysCorrect: [],
        wrongCount: 1,
        mastered: false,
      },
      't3-l2-q2': {
        questionId: 't3-l2-q2',
        lessonId: 't3-l2',
        skillTag: 'Giới từ chỉ thời gian (at/on/in)',
        intervalIndex: 0,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        independentCorrectCount: 0,
        distinctDaysCorrect: [],
        wrongCount: 1,
        mastered: false,
      },
      't1-l1-q4': {
        questionId: 't1-l1-q4',
        lessonId: 't1-l1',
        skillTag: 'Mẫu câu tạm biệt',
        intervalIndex: 0,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        independentCorrectCount: 1,
        distinctDaysCorrect: [new Date(Date.now() - 86400 * 1000).toISOString().slice(0, 10)],
        wrongCount: 0,
        mastered: false,
      },
    },
    errorNotebook: [
      {
        id: 'err-seed-1',
        sourceType: 'english',
        sourceTitle: 'Giới thiệu bản thân (Chủ đề 1 · Bài 2)',
        sourcePageOrRef: 'Chủ đề 1 · Chào hỏi',
        skillTag: 'Động từ to be (am/is/are)',
        questionText: 'She ___ a student.',
        options: ['am', 'is', 'are'],
        userWrongAnswer: 'are',
        correctAnswer: 'is',
        explanationVi: 'Dùng is với she, he và it. Câu đúng là She is a student.',
        wrongCount: 1,
        resolvedCount: 0,
        lastWrongAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'err-seed-2',
        sourceType: 'english',
        sourceTitle: 'Đồ dùng học tập (Chủ đề 2 · Bài 1)',
        sourcePageOrRef: 'Chủ đề 2 · Trường lớp',
        skillTag: 'Mạo từ (a/an)',
        questionText: 'This is ___ English book.',
        options: ['an', 'a', 'are'],
        userWrongAnswer: 'a',
        correctAnswer: 'an',
        explanationVi: 'Dùng "an" trước từ bắt đầu bằng âm nguyên âm như "English".',
        wrongCount: 1,
        resolvedCount: 0,
        lastWrongAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        nextReviewAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
    ],
    activeSession: null,
    customVocabulary: [],
    reportedQuestionIds: [],
  };
}

export function loadEnglishProgress(username: string): EnglishLearningProgress {
  if (typeof window === 'undefined') return getDefaultEnglishProgress();
  const key = `english_progress_v2_${username.toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const def = getDefaultEnglishProgress();
      localStorage.setItem(key, JSON.stringify(def));
      return def;
    }
    const parsed = JSON.parse(raw) as EnglishLearningProgress;
    const todayStr = new Date().toISOString().slice(0, 10);
    if (parsed.lastStudyDate !== todayStr) {
      parsed.minutesStudiedToday = 0;
      parsed.lastStudyDate = todayStr;
    }
    return parsed;
  } catch {
    return getDefaultEnglishProgress();
  }
}

export function saveEnglishProgress(username: string, progress: EnglishLearningProgress): void {
  if (typeof window === 'undefined') return;
  const key = `english_progress_v2_${username.toLowerCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

/**
 * Lấy danh sách các câu hỏi đã đến hạn ôn tập (nextReviewAt <= now)
 */
export function getDueReviewQuestions(progress: EnglishLearningProgress): EnglishQuestion[] {
  const nowMs = Date.now();
  const dueStates = Object.values(progress.reviewStates).filter(
    st => new Date(st.nextReviewAt).getTime() <= nowMs
  );
  const questions: EnglishQuestion[] = [];
  for (const st of dueStates) {
    const q = getQuestionById(st.questionId);
    if (q) questions.push(q);
  }
  return questions;
}

/**
 * Tìm bài học tiếp theo trong lộ trình 24 bài
 */
export function getNextRecommendedLesson(progress: EnglishLearningProgress): {
  lesson: EnglishLesson;
  topic: EnglishTopic;
  reasonVi: string;
} {
  // Nếu có phiên đang làm dở
  if (progress.activeSession && !progress.activeSession.isReviewSession) {
    const activeLesson = getLessonById(progress.activeSession.lessonId);
    if (activeLesson) {
      const topic = ENGLISH_CURRICULUM_TOPICS.find(t => t.id === activeLesson.topicId)!;
      const remaining = Math.max(
        1,
        progress.activeSession.questionIds.length - progress.activeSession.currentIndex
      );
      return {
        lesson: activeLesson,
        topic,
        reasonVi: `Bạn còn ${remaining} câu để hoàn thành bài`,
      };
    }
  }

  for (const topic of ENGLISH_CURRICULUM_TOPICS) {
    for (const lesson of topic.lessons) {
      if (!progress.completedLessons[lesson.id]) {
        return {
          lesson,
          topic,
          reasonVi: `Tiếng Anh · Bài ${lesson.orderInTopic} trong chủ đề ${topic.title}`,
        };
      }
    }
  }

  const firstTopic = ENGLISH_CURRICULUM_TOPICS[0];
  return {
    lesson: firstTopic.lessons[1],
    topic: firstTopic,
    reasonVi: 'Ôn lại bài trọng tâm đã hoàn thành',
  };
}

/**
 * Xây dựng phiên ôn tập thông minh 10 câu theo đúng tỷ lệ Mục 9:
 * 5 câu đến hạn + 3 câu từ kỹ năng yếu + 2 câu mới (loại trùng, tự động bù nếu thiếu)
 */
export function buildSmartReviewSessionQuestions(progress: EnglishLearningProgress, targetCount = 10): EnglishQuestion[] {
  const allQuestions = getAllEnglishQuestions();
  const selectedMap = new Map<string, EnglishQuestion>();

  // 1. Lấy tối đa 5 câu đến hạn
  const dueList = getDueReviewQuestions(progress);
  for (const q of dueList.slice(0, 5)) {
    selectedMap.set(q.id, q);
  }

  // 2. Lấy tối đa 3 câu từ kỹ năng yếu (có wrongCount > 0 hoặc nằm trong errorNotebook)
  const weakSkillTags = new Set(progress.errorNotebook.map(e => e.skillTag));
  const weakQuestions = allQuestions.filter(
    q => !selectedMap.has(q.id) && (weakSkillTags.has(q.skillTag) || (progress.reviewStates[q.id]?.wrongCount || 0) > 0)
  );
  for (const q of weakQuestions.slice(0, 3)) {
    selectedMap.set(q.id, q);
  }

  // 3. Lấy 2 câu mới và bù cho đủ targetCount
  for (const q of allQuestions) {
    if (selectedMap.size >= targetCount) break;
    if (!selectedMap.has(q.id)) {
      selectedMap.set(q.id, q);
    }
  }

  return Array.from(selectedMap.values());
}

/**
 * Cập nhật Lịch ôn ngắt quãng (1, 3, 7, 14, 30 ngày) và Sổ lỗi sau một lần trả lời câu hỏi
 */
export function recordQuestionAttempt(
  progress: EnglishLearningProgress,
  question: EnglishQuestion,
  userAnswer: string,
  isFirstTryInSession: boolean
): { updatedProgress: EnglishLearningProgress; isCorrect: boolean } {
  const isCorrect = isEnglishAnswerCorrect(userAnswer, question);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nextProgress: EnglishLearningProgress = {
    ...progress,
    reviewStates: { ...progress.reviewStates },
    errorNotebook: [...progress.errorNotebook],
  };

  const prevState: QuestionReviewState = nextProgress.reviewStates[question.id] || {
    questionId: question.id,
    lessonId: question.lessonId,
    skillTag: question.skillTag,
    intervalIndex: 0,
    intervalDays: 1,
    nextReviewAt: now.toISOString(),
    lastReviewedAt: now.toISOString(),
    independentCorrectCount: 0,
    distinctDaysCorrect: [],
    wrongCount: 0,
    mastered: false,
  };

  if (isCorrect && isFirstTryInSession) {
    // Chỉ tăng khoảng cách ôn sau lần nhớ đúng độc lập (không phải làm lại ngay sau khi vừa xem đáp án)
    const nextIdx = Math.min(SPACED_INTERVALS_DAYS.length - 1, prevState.intervalIndex + 1);
    const intervalDays = SPACED_INTERVALS_DAYS[nextIdx];
    const nextReviewDate = new Date(now.getTime() + intervalDays * 86400 * 1000).toISOString();
    const newDistinctDays = prevState.distinctDaysCorrect.includes(todayStr)
      ? prevState.distinctDaysCorrect
      : [...prevState.distinctDaysCorrect, todayStr];
    const newCorrectCount = prevState.independentCorrectCount + 1;
    // Trạng thái "Đã vững": tối thiểu 3 lần đúng trên ít nhất 2 ngày khác nhau
    const mastered = newCorrectCount >= 3 && newDistinctDays.length >= 2;

    nextProgress.reviewStates[question.id] = {
      ...prevState,
      intervalIndex: nextIdx,
      intervalDays,
      nextReviewAt: nextReviewDate,
      lastReviewedAt: now.toISOString(),
      independentCorrectCount: newCorrectCount,
      distinctDaysCorrect: newDistinctDays,
      mastered,
    };

    // Nếu câu này từng nằm trong Sổ lỗi, tăng resolvedCount
    const errIdx = nextProgress.errorNotebook.findIndex(e => e.questionText === question.questionText);
    if (errIdx >= 0) {
      nextProgress.errorNotebook[errIdx] = {
        ...nextProgress.errorNotebook[errIdx],
        resolvedCount: nextProgress.errorNotebook[errIdx].resolvedCount + 1,
        nextReviewAt: nextReviewDate,
      };
    }
  } else if (!isCorrect) {
    // Trả lời sai: đặt lại khoảng cách ôn về 1 ngày và ghi vào Sổ lỗi
    const nextReviewDate = new Date(now.getTime() + 1 * 86400 * 1000).toISOString();
    nextProgress.reviewStates[question.id] = {
      ...prevState,
      intervalIndex: 0,
      intervalDays: 1,
      nextReviewAt: nextReviewDate,
      lastReviewedAt: now.toISOString(),
      wrongCount: prevState.wrongCount + 1,
      mastered: false,
    };

    const lesson = getLessonById(question.lessonId);
    const topic = ENGLISH_CURRICULUM_TOPICS.find(t => t.id === question.topicId);
    const existingErrIdx = nextProgress.errorNotebook.findIndex(
      e => e.questionText === question.questionText
    );

    if (existingErrIdx >= 0) {
      nextProgress.errorNotebook[existingErrIdx] = {
        ...nextProgress.errorNotebook[existingErrIdx],
        userWrongAnswer: userAnswer,
        wrongCount: nextProgress.errorNotebook[existingErrIdx].wrongCount + 1,
        lastWrongAt: now.toISOString(),
        nextReviewAt: nextReviewDate,
      };
    } else {
      nextProgress.errorNotebook.unshift({
        id: `err-${Date.now()}`,
        sourceType: 'english',
        sourceTitle: lesson ? `${lesson.title} (${lesson.subtitle})` : 'Bài học Tiếng Anh',
        sourcePageOrRef: topic ? `Chủ đề ${topic.id} · ${topic.title}` : 'Tiếng Anh nền tảng',
        skillTag: question.skillTag,
        questionText: question.questionText,
        options: question.options,
        userWrongAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        explanationVi: question.explanationVi,
        wrongCount: 1,
        resolvedCount: 0,
        lastWrongAt: now.toISOString(),
        nextReviewAt: nextReviewDate,
      });
    }
  }

  return { updatedProgress: nextProgress, isCorrect };
}
