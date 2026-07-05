# Localization System and Language Settings Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design and implement a clean localization system supporting English as default, Vietnamese as optional, and future languages, with centralized language strings and no hardcoded Vietnamese assumptions.

**Architecture:** Create a shared `@ielts/i18n` package with translation resources, a `t()` function, and React context. Extend `@ielts/settings` with language preference fields. Centralize all UI text and AI prompt strings. Replace hardcoded text with `t()` calls throughout the web app and extension.

**Tech Stack:** TypeScript, React Context, local-first storage, Zod schemas

---

### Task 1: Create `packages/i18n` — shared localization package

**Files:**
- Create: `packages/i18n/package.json`
- Create: `packages/i18n/tsconfig.json`
- Create: `packages/i18n/src/index.ts`
- Create: `packages/i18n/src/types.ts`
- Create: `packages/i18n/src/translations/en.ts`
- Create: `packages/i18n/src/translations/vi.ts`
- Create: `packages/i18n/src/translations/index.ts`
- Create: `packages/i18n/src/context.tsx`
- Create: `packages/i18n/src/useTranslation.ts`
- Create: `packages/i18n/src/t.ts`

- [ ] **Step 1: Create package scaffolding**

Create `packages/i18n/package.json`:
```json
{
  "name": "@ielts/i18n",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./context": "./src/context.tsx",
    "./t": "./src/t.ts",
    "./translations": "./src/translations/index.ts"
  },
  "dependencies": {
    "react": "^19.0.0"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

Create `packages/i18n/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Create types**

Create `packages/i18n/src/types.ts`:
```typescript
export type LanguageCode = 'en' | 'vi'
export type LanguageNamespace =
  | 'common'
  | 'ui'
  | 'aiTutor'
  | 'prompts'
  | 'exercises'
  | 'vocabulary'
  | 'mistakes'
  | 'progress'
  | 'onboarding'
  | 'settings'
  | 'errors'
  | 'notifications'

export interface TranslationValue {
  [key: string]: string | TranslationValue
}

export interface TranslationResources {
  [namespace: string]: TranslationValue
}

export type LocaleDictionary = Record<LanguageCode, TranslationResources>
```

- [ ] **Step 3: Create English translations**

Create `packages/i18n/src/translations/en.ts`:
```typescript
import type { TranslationResources } from '../types'

export const en: TranslationResources = {
  common: {
    appName: 'IELTS Journey',
    loading: 'Loading...',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Something went wrong',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    reset: 'Reset',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    yes: 'Yes',
    no: 'No',
    all: 'All',
    none: 'None',
    more: 'More',
    less: 'Less',
    learnMore: 'Learn more',
    getStarted: 'Get started',
    comingSoon: 'Coming soon',
  },
  ui: {
    welcome: 'Welcome to IELTS Journey',
    tagline: 'Your personal IELTS preparation companion',
    startJourney: 'Start your IELTS journey',
    dashboard: 'Dashboard',
    studyPlan: 'Study Plan',
    vocabulary: 'Vocabulary',
    reading: 'Reading',
    listening: 'Listening',
    writing: 'Writing',
    speaking: 'Speaking',
    grammar: 'Grammar',
    mistakes: 'Mistakes',
    progress: 'Progress',
    settings: 'Settings',
    aiTutor: 'AI Tutor',
    dailyTasks: "Today's Tasks",
    weeklyProgress: 'Weekly Progress',
    studyStreak: 'Study Streak',
    examCountdown: 'Exam Countdown',
    savedArticles: 'Saved Articles',
    vocabularyReview: 'Vocabulary Review',
    mistakeReview: 'Mistake Review',
    aiTutorSubtitle: 'IELTS Coach',
    targetBand: 'Target Band {band}',
    currentBand: 'Current Band {band}',
    daysUntilExam: '{days} days until exam',
    examToday: 'Exam is today!',
    examPast: 'Exam was on {date}',
    proficiency: '{skill} Proficiency',
    minutes: '{minutes} min',
    hours: '{hours}h',
    tasksCompleted: '{done}/{total} tasks done',
    studyTimeToday: 'Studied {minutes} min today',
    noTasksToday: 'No tasks scheduled for today',
    noData: 'No data available',
    noResults: 'No results found',
    emptyVocabulary: 'Save your first word to start building your vocabulary',
    emptyMistakes: 'No mistakes recorded yet',
    emptyReading: 'No reading sessions yet',
    emptyListening: 'No listening sessions yet',
    emptyWriting: 'No writing practice yet',
    emptySpeaking: 'No speaking practice yet',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    aiKeyMissing: 'Please configure your AI provider settings first.',
    aiRequestFailed: 'AI request failed. Please check your API key and try again.',
    storageFull: 'Storage is full. Please export and clear some data.',
    invalidData: 'Invalid data. Please check your input.',
    notFound: 'Page not found',
    unauthorized: 'You do not have permission to access this.',
  },
  aiTutor: {
    title: 'AI Tutor',
    subtitle: 'Your IELTS Coach',
    welcomeMessage: "I'm your AI Tutor. Ask me anything about your IELTS preparation, or use the quick actions below to get started.",
    sendMessage: 'Type a message...',
    thinking: 'Thinking...',
    quickActions: 'Quick Actions',
    whatToStudy: 'What should I study today?',
    weakSkills: 'What are my weak skills?',
    examCountdown: 'How many days until my exam?',
    reviewMistakes: 'Review my mistakes',
    createExercises: 'Create vocabulary exercises',
    motivateMe: 'Motivate me!',
    noResponse: "I'm here to help with your IELTS journey! Ask me anything about your preparation.",
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    whyTodayMatters: 'Why today matters',
    weakSkillReminder: 'Weak skill reminder',
    examCountdownTitle: 'Exam countdown',
    showMeWhatToDo: 'Show me what to do',
    practiceNow: 'Practice now',
    viewPlan: 'View plan',
    tutorModes: {
      friendlyChat: 'Friendly Chat',
      ieltsTutor: 'IELTS Tutor',
      speakingPartner: 'Speaking Partner',
      writingCoach: 'Writing Coach',
      grammarTeacher: 'Grammar Teacher',
      vocabularyCoach: 'Vocabulary Coach',
      readingExplainer: 'Reading Explainer',
      listeningCoach: 'Listening Coach',
      studyPlanner: 'Study Planner',
      motivationCoach: 'Motivation Coach',
      socraticTutor: 'Socratic Tutor',
    },
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    appLanguage: 'App Language',
    aiExplanationLanguage: 'AI Explanation Language',
    exerciseLanguage: 'Exercise Language',
    tutorResponseLanguage: 'Tutor Response Language',
    studyPreferences: 'Study Preferences',
    targetBand: 'Target Band',
    currentBand: 'Current IELTS Level',
    examDate: 'Exam Date',
    studyTimePerDay: 'Study Time Per Day',
    weakSkills: 'Weak Skills',
    strongSkills: 'Strong Skills',
    studyGoal: 'Study Goal',
    academic: 'Academic',
    general: 'General Training',
    tutorSettings: 'Tutor Settings',
    tutorMode: 'Tutor Mode',
    explanationStyle: 'Explanation Style',
    correctionStrictness: 'Correction Strictness',
    feedbackDepth: 'Feedback Depth',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    accentColor: 'Accent Color',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
    reminderTime: 'Reminder Time',
    aiProvider: 'AI Provider',
    apiKey: 'API Key',
    model: 'Model',
    baseUrl: 'Base URL',
    dataManagement: 'Data Management',
    importData: 'Import Data',
    exportData: 'Export Data',
    clearData: 'Clear All Data',
    privacy: 'Privacy',
    privacyLevel: 'Privacy Level',
    localOnly: 'Local Only',
    localWithAnalytics: 'Local with Analytics',
    about: 'About',
    version: 'Version',
    nativeLanguage: 'Native Language',
    countryRegion: 'Country / Region (optional)',
    timezone: 'Time Zone',
    preferredStudyStyle: 'Preferred Study Style',
    tutorTone: 'Tutor Tone',
  },
  onboarding: {
    welcome: 'Welcome to IELTS Journey!',
    welcomeDescription: 'Set up your profile to get a personalized IELTS study plan.',
    languageSelection: 'Choose your language',
    languageDescription: 'Select your preferred language for the app and AI tutor.',
    appLanguage: 'App Language',
    aiLanguage: 'AI Explanation Language',
    targetBandQuestion: 'What IELTS band score are you aiming for?',
    currentLevelQuestion: 'What is your current IELTS level?',
    examDateQuestion: 'When is your IELTS exam?',
    examDatePlaceholder: 'Select your exam date (optional)',
    studyTimeQuestion: 'How many minutes can you study per day?',
    studyStyleQuestion: 'What is your preferred study style?',
    tutorToneQuestion: 'What tone should your AI tutor use?',
    weakSkillsQuestion: 'Which skills are your weakest? (select all that apply)',
    complete: 'You\'re all set!',
    completeDescription: 'Your profile is ready. IELTS Journey will create a personalized study plan for you.',
    generatePlan: 'Generate My Study Plan',
    skip: 'Skip for now',
    back: 'Back',
  },
  prompts: {
    systemPrompt: `You are an IELTS preparation tutor assistant. Help the user achieve their target IELTS band score by providing clear, accurate, and encouraging guidance.

Key principles:
- Provide accurate IELTS information and strategies
- Adapt your explanations to the user's level
- Correct mistakes gently and constructively
- Give specific, actionable advice
- Connect responses to the user's IELTS learning journey
- Encourage progress and celebrate achievements
- Use {language} for explanations when appropriate`,
    progressReviewSystem: `You are an experienced IELTS tutor reviewing a student's learning progress. Your role is to analyze their study data thoroughly and provide honest, constructive, and encouraging feedback — just like a real tutor would.

Guidelines:
- Be specific and reference actual numbers and trends from the data
- Be encouraging but honest — if the student is slacking, say so constructively
- Write in a warm, professional tutor tone (use "you")
- Provide actionable, specific advice for the next study period
- Do NOT repeat the raw data back as-is — interpret and analyze it
- Use {language} for the review

You must respond with valid JSON only, matching the provided schema.`,
    writingFeedback: `You are an experienced IELTS Writing examiner and tutor. Provide detailed, constructive feedback on the user's writing task. Focus on:
- Task achievement / response
- Coherence and cohesion
- Lexical resource (vocabulary)
- Grammatical range and accuracy
- Give a realistic estimated band score
- Suggest specific improvements
- Provide a corrected version if helpful`,
    speakingFeedback: `You are an experienced IELTS Speaking examiner. Evaluate the user's speaking response considering:
- Fluency and coherence
- Lexical resource
- Grammatical range and accuracy
- Pronunciation
- Give a realistic estimated band score
- Suggest specific improvements and better expressions`,
  },
}
```

- [ ] **Step 4: Create Vietnamese translations**

Create `packages/i18n/src/translations/vi.ts`:
```typescript
import type { TranslationResources } from '../types'

export const vi: TranslationResources = {
  common: {
    appName: 'IELTS Journey',
    loading: 'Đang tải...',
    saving: 'Đang lưu...',
    saved: 'Đã lưu',
    error: 'Có lỗi xảy ra',
    retry: 'Thử lại',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    close: 'Đóng',
    back: 'Quay lại',
    next: 'Tiếp theo',
    done: 'Hoàn tất',
    delete: 'Xóa',
    edit: 'Sửa',
    save: 'Lưu',
    reset: 'Đặt lại',
    search: 'Tìm kiếm',
    filter: 'Lọc',
    sort: 'Sắp xếp',
    yes: 'Có',
    no: 'Không',
    all: 'Tất cả',
    none: 'Không có',
    more: 'Thêm',
    less: 'Bớt',
    learnMore: 'Tìm hiểu thêm',
    getStarted: 'Bắt đầu',
    comingSoon: 'Sắp ra mắt',
  },
  ui: {
    welcome: 'Chào mừng đến với IELTS Journey',
    tagline: 'Người bạn đồng hành luyện thi IELTS cá nhân của bạn',
    startJourney: 'Bắt đầu hành trình IELTS',
    dashboard: 'Bảng điều khiển',
    studyPlan: 'Lộ trình học tập',
    vocabulary: 'Từ vựng',
    reading: 'Đọc',
    listening: 'Nghe',
    writing: 'Viết',
    speaking: 'Nói',
    grammar: 'Ngữ pháp',
    mistakes: 'Lỗi sai',
    progress: 'Tiến bộ',
    settings: 'Cài đặt',
    aiTutor: 'Gia sư AI',
    dailyTasks: 'Nhiệm vụ hôm nay',
    weeklyProgress: 'Tiến bộ hàng tuần',
    studyStreak: 'Chuỗi ngày học',
    examCountdown: 'Đếm ngược ngày thi',
    savedArticles: 'Bài viết đã lưu',
    vocabularyReview: 'Ôn tập từ vựng',
    mistakeReview: 'Xem lại lỗi sai',
    aiTutorSubtitle: 'Huấn luyện viên IELTS',
    targetBand: 'Mục tiêu Band {band}',
    currentBand: 'Band hiện tại {band}',
    daysUntilExam: 'Còn {days} ngày đến kỳ thi',
    examToday: 'Hôm nay là ngày thi!',
    examPast: 'Kỳ thi đã diễn ra vào {date}',
    proficiency: 'Trình độ {skill}',
    minutes: '{minutes} phút',
    hours: '{hours} giờ',
    tasksCompleted: '{done}/{total} nhiệm vụ đã hoàn thành',
    studyTimeToday: 'Đã học {minutes} phút hôm nay',
    noTasksToday: 'Không có nhiệm vụ nào cho hôm nay',
    noData: 'Không có dữ liệu',
    noResults: 'Không tìm thấy kết quả',
    emptyVocabulary: 'Lưu từ đầu tiên của bạn để bắt đầu xây dựng vốn từ vựng',
    emptyMistakes: 'Chưa ghi lại lỗi sai nào',
    emptyReading: 'Chưa có buổi đọc nào',
    emptyListening: 'Chưa có buổi nghe nào',
    emptyWriting: 'Chưa có bài viết nào',
    emptySpeaking: 'Chưa có buổi nói nào',
  },
  errors: {
    generic: 'Có lỗi xảy ra. Vui lòng thử lại.',
    network: 'Lỗi mạng. Vui lòng kiểm tra kết nối.',
    aiKeyMissing: 'Vui lòng cấu hình cài đặt AI trước.',
    aiRequestFailed: 'Yêu cầu AI thất bại. Vui lòng kiểm tra API key và thử lại.',
    storageFull: 'Bộ nhớ đầy. Vui lòng xuất dữ liệu và xóa bớt.',
    invalidData: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra đầu vào.',
    notFound: 'Không tìm thấy trang',
    unauthorized: 'Bạn không có quyền truy cập.',
  },
  aiTutor: {
    title: 'Gia sư AI',
    subtitle: 'Huấn luyện viên IELTS của bạn',
    welcomeMessage: 'Tôi là Gia sư AI của bạn. Hãy hỏi tôi bất cứ điều gì về việc luyện thi IELTS, hoặc sử dụng các hành động nhanh bên dưới để bắt đầu.',
    sendMessage: 'Nhập tin nhắn...',
    thinking: 'Đang suy nghĩ...',
    quickActions: 'Hành động nhanh',
    whatToStudy: 'Hôm nay tôi nên học gì?',
    weakSkills: 'Kỹ năng yếu của tôi là gì?',
    examCountdown: 'Còn bao nhiêu ngày đến kỳ thi?',
    reviewMistakes: 'Xem lại lỗi sai của tôi',
    createExercises: 'Tạo bài tập từ vựng',
    motivateMe: 'Động viên tôi!',
    noResponse: 'Tôi ở đây để giúp bạn trên hành trình IELTS! Hãy hỏi tôi bất cứ điều gì về việc ôn luyện của bạn.',
    greetingMorning: 'Chào buổi sáng',
    greetingAfternoon: 'Chào buổi chiều',
    greetingEvening: 'Chào buổi tối',
    whyTodayMatters: 'Tại sao hôm nay quan trọng',
    weakSkillReminder: 'Nhắc nhở kỹ năng yếu',
    examCountdownTitle: 'Đếm ngược ngày thi',
    showMeWhatToDo: 'Cho tôi biết phải làm gì',
    practiceNow: 'Luyện tập ngay',
    viewPlan: 'Xem kế hoạch',
    tutorModes: {
      friendlyChat: 'Trò chuyện thân thiện',
      ieltsTutor: 'Gia sư IELTS',
      speakingPartner: 'Đối tác nói',
      writingCoach: 'Huấn luyện viết',
      grammarTeacher: 'Giáo viên ngữ pháp',
      vocabularyCoach: 'Huấn luyện từ vựng',
      readingExplainer: 'Giải thích đọc hiểu',
      listeningCoach: 'Huấn luyện nghe',
      studyPlanner: 'Lập kế hoạch học tập',
      motivationCoach: 'Huấn luyện động lực',
      socraticTutor: 'Gia sư Socrates',
    },
  },
  settings: {
    title: 'Cài đặt',
    language: 'Ngôn ngữ',
    appLanguage: 'Ngôn ngữ ứng dụng',
    aiExplanationLanguage: 'Ngôn ngữ giải thích AI',
    exerciseLanguage: 'Ngôn ngữ bài tập',
    tutorResponseLanguage: 'Ngôn ngữ phản hồi gia sư',
    studyPreferences: 'Sở thích học tập',
    targetBand: 'Band mục tiêu',
    currentBand: 'Trình độ IELTS hiện tại',
    examDate: 'Ngày thi',
    studyTimePerDay: 'Thời gian học mỗi ngày',
    weakSkills: 'Kỹ năng yếu',
    strongSkills: 'Kỹ năng mạnh',
    studyGoal: 'Mục tiêu học tập',
    academic: 'Học thuật',
    general: 'Tổng quát',
    tutorSettings: 'Cài đặt gia sư',
    tutorMode: 'Chế độ gia sư',
    explanationStyle: 'Phong cách giải thích',
    correctionStrictness: 'Mức độ sửa lỗi',
    feedbackDepth: 'Độ sâu phản hồi',
    theme: 'Giao diện',
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống',
    accentColor: 'Màu nhấn',
    notifications: 'Thông báo',
    enableNotifications: 'Bật thông báo',
    reminderTime: 'Thời gian nhắc nhở',
    aiProvider: 'Nhà cung cấp AI',
    apiKey: 'API Key',
    model: 'Mô hình',
    baseUrl: 'URL cơ sở',
    dataManagement: 'Quản lý dữ liệu',
    importData: 'Nhập dữ liệu',
    exportData: 'Xuất dữ liệu',
    clearData: 'Xóa tất cả dữ liệu',
    privacy: 'Quyền riêng tư',
    privacyLevel: 'Mức độ riêng tư',
    localOnly: 'Chỉ lưu trữ cục bộ',
    localWithAnalytics: 'Cục bộ với phân tích',
    about: 'Giới thiệu',
    version: 'Phiên bản',
    nativeLanguage: 'Ngôn ngữ mẹ đẻ',
    countryRegion: 'Quốc gia / Khu vực (không bắt buộc)',
    timezone: 'Múi giờ',
    preferredStudyStyle: 'Phong cách học tập ưa thích',
    tutorTone: 'Giọng điệu gia sư',
  },
  onboarding: {
    welcome: 'Chào mừng bạn đến với IELTS Journey!',
    welcomeDescription: 'Thiết lập hồ sơ của bạn để nhận lộ trình học IELTS cá nhân hóa.',
    languageSelection: 'Chọn ngôn ngữ của bạn',
    languageDescription: 'Chọn ngôn ngữ ưa thích cho ứng dụng và gia sư AI.',
    appLanguage: 'Ngôn ngữ ứng dụng',
    aiLanguage: 'Ngôn ngữ giải thích AI',
    targetBandQuestion: 'Bạn đang nhắm đến band điểm IELTS nào?',
    currentLevelQuestion: 'Trình độ IELTS hiện tại của bạn là gì?',
    examDateQuestion: 'Khi nào bạn thi IELTS?',
    examDatePlaceholder: 'Chọn ngày thi (không bắt buộc)',
    studyTimeQuestion: 'Bạn có thể học bao nhiêu phút mỗi ngày?',
    studyStyleQuestion: 'Phong cách học tập ưa thích của bạn là gì?',
    tutorToneQuestion: 'Gia sư AI nên có giọng điệu như thế nào?',
    weakSkillsQuestion: 'Kỹ năng nào là yếu nhất của bạn? (chọn tất cả phù hợp)',
    complete: 'Bạn đã sẵn sàng!',
    completeDescription: 'Hồ sơ của bạn đã sẵn sàng. IELTS Journey sẽ tạo lộ trình học tập cá nhân hóa cho bạn.',
    generatePlan: 'Tạo lộ trình học tập',
    skip: 'Bỏ qua',
    back: 'Quay lại',
  },
  prompts: {
    systemPrompt: `Bạn là trợ lý gia sư luyện thi IELTS. Hãy giúp người dùng đạt được band điểm IELTS mục tiêu bằng cách cung cấp hướng dẫn rõ ràng, chính xác và khuyến khích.

Nguyên tắc chính:
- Cung cấp thông tin và chiến lược IELTS chính xác
- Điều chỉnh giải thích phù hợp với trình độ người dùng
- Sửa lỗi nhẹ nhàng và mang tính xây dựng
- Đưa ra lời khuyên cụ thể, khả thi
- Kết nối câu trả lời với hành trình học IELTS của người dùng
- Khuyến khích tiến bộ và ăn mừng thành tích
- Sử dụng {language} để giải thích khi phù hợp`,
    progressReviewSystem: `Bạn là một gia sư IELTS giàu kinh nghiệm đang xem xét tiến bộ học tập của học viên. Vai trò của bạn là phân tích dữ liệu học tập một cách kỹ lưỡng và cung cấp phản hồi trung thực, mang tính xây dựng và khuyến khích — giống như một gia sư thực thụ.

Hướng dẫn:
- Cụ thể và tham chiếu đến số liệu và xu hướng thực tế từ dữ liệu
- Khuyến khích nhưng trung thực — nếu học viên lơ là, hãy nói một cách xây dựng
- Viết với giọng điệu ấm áp, chuyên nghiệp (sử dụng "bạn")
- Đưa ra lời khuyên cụ thể, khả thi cho giai đoạn học tiếp theo
- KHÔNG lặp lại dữ liệu thô — hãy diễn giải và phân tích nó
- Sử dụng {language} cho bài đánh giá

Bạn phải trả lời với JSON hợp lệ, khớp với schema được cung cấp.`,
    writingFeedback: `Bạn là một giám khảo và gia sư IELTS Writing giàu kinh nghiệm. Cung cấp phản hồi chi tiết, mang tính xây dựng về bài viết của người dùng. Tập trung vào:
- Hoàn thành nhiệm vụ / Phản hồi
- Mạch lạc và gắn kết
- Vốn từ vựng
- Độ chính xác ngữ pháp và đa dạng cấu trúc
- Đưa ra điểm band ước tính thực tế
- Đề xuất cải thiện cụ thể
- Cung cấp phiên bản đã sửa nếu hữu ích`,
    speakingFeedback: `Bạn là một giám khảo IELTS Speaking giàu kinh nghiệm. Đánh giá câu trả lời nói của người dùng dựa trên:
- Độ trôi chảy và mạch lạc
- Vốn từ vựng
- Độ chính xác ngữ pháp và đa dạng cấu trúc
- Phát âm
- Đưa ra điểm band ước tính thực tế
- Đề xuất cải thiện cụ thể và cách diễn đạt tốt hơn`,
  },
}
```

- [ ] **Step 5: Create translations index**

Create `packages/i18n/src/translations/index.ts`:
```typescript
import type { LocaleDictionary } from '../types'
import { en } from './en'
import { vi } from './vi'

export const translations: LocaleDictionary = {
  en,
  vi,
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'vi' as const, name: 'Vietnamese', nativeName: 'Tiếng Việt' },
] as const

export type { LanguageCode } from '../types'
```

- [ ] **Step 6: Create `t()` function**

Create `packages/i18n/src/t.ts`:
```typescript
import type { LanguageCode, TranslationResources } from './types'
import { en } from './translations/en'
import { vi } from './translations/vi'

const resources: Record<LanguageCode, TranslationResources> = { en, vi }

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

export function t(
  key: string,
  params?: Record<string, string | number>,
  lang: LanguageCode = 'en',
): string {
  const resolved = resolvePath(resources[lang] as unknown as Record<string, unknown>, key)
  if (typeof resolved === 'string') {
    if (params) {
      return resolved.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
    }
    return resolved
  }
  // Try English fallback
  if (lang !== 'en') {
    const fallback = resolvePath(resources.en as unknown as Record<string, unknown>, key)
    if (typeof fallback === 'string') {
      if (params) {
        return fallback.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
      }
      return fallback
    }
  }
  return key
}

export function getResource(lang: LanguageCode): TranslationResources {
  return resources[lang] ?? resources.en
}

export function setResource(lang: LanguageCode, resource: TranslationResources): void {
  resources[lang] = resource
}
```

- [ ] **Step 7: Create React context**

Create `packages/i18n/src/context.tsx`:
```typescript
import { createContext, useContext, type ReactNode } from 'react'
import type { LanguageCode } from './types'
import { t as translate } from './t'

export interface I18nContextValue {
  lang: LanguageCode
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  t: (key, params) => translate(key, params, 'en'),
})

export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}

export { I18nContext }
```

- [ ] **Step 8: Create useTranslation hook**

Create `packages/i18n/src/useTranslation.ts`:
```typescript
'use client'
import { useMemo } from 'react'
import type { LanguageCode } from './types'
import { t as translate } from './t'
import { useI18n } from './context'

export function useTranslation(namespace?: string) {
  const { lang, t: contextT } = useI18n()

  return useMemo(() => {
    function tn(key: string, params?: Record<string, string | number>): string {
      const fullKey = namespace ? `${namespace}.${key}` : key
      return contextT(fullKey, params)
    }
    tn.language = lang
    return tn
  }, [lang, namespace, contextT])
}

export function createT(lang: LanguageCode) {
  return (key: string, params?: Record<string, string | number>) => translate(key, params, lang)
}
```

- [ ] **Step 9: Create package index**

Create `packages/i18n/src/index.ts`:
```typescript
export { t, getResource, setResource } from './t'
export { useI18n, I18nContext } from './context'
export type { I18nContextValue } from './context'
export { useTranslation, createT } from './useTranslation'
export { translations, SUPPORTED_LANGUAGES } from './translations'
export type { LanguageCode, LanguageNamespace, TranslationResources, LocaleDictionary } from './types'
```

- [ ] **Step 10: Update `pnpm-workspace.yaml`**

Read: `/Users/phamthanhhung/Desktop/MyProject/IELTS/pnpm-workspace.yaml`
Add `packages/i18n` to the workspace.

- [ ] **Step 11: Install package**

Run: `pnpm install`

---

### Task 2: Add language settings to `@ielts/settings`

**Files:**
- Modify: `packages/settings/src/schemas.ts`
- Modify: `packages/settings/src/types.ts`
- Modify: `packages/settings/src/defaults.ts`
- Modify: `packages/settings/src/index.ts`

- [ ] **Step 1: Update schemas**

In `packages/settings/src/schemas.ts`, add language schemas:
```typescript
export const LANGUAGE_CODES = ['en', 'vi'] as const
export const languageCodeSchema = z.enum(LANGUAGE_CODES)

export const languageSettingsSchema = z.object({
  appLanguage: languageCodeSchema.default('en'),
  aiExplanationLanguage: languageCodeSchema.default('en'),
  exerciseLanguage: languageCodeSchema.default('en'),
  tutorResponseLanguage: languageCodeSchema.default('en'),
})
```

Extend `sharedSettingsSchema`:
```typescript
export const sharedSettingsSchema = aiSettingsSchema.extend({
  themeMode: themeModeSchema.default('system'),
}).merge(languageSettingsSchema)
```

- [ ] **Step 2: Update types**

In `packages/settings/src/types.ts`, add:
```typescript
import type { languageSettingsSchema, languageCodeSchema } from './schemas'
export type LanguageSettings = z.infer<typeof languageSettingsSchema>
export type LanguageCode = z.infer<typeof languageCodeSchema>
```

- [ ] **Step 3: Update defaults**

In `packages/settings/src/defaults.ts`, add:
```typescript
export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  appLanguage: 'en',
  aiExplanationLanguage: 'en',
  exerciseLanguage: 'en',
  tutorResponseLanguage: 'en',
}
```

And merge into `DEFAULT_SHARED_SETTINGS`.

- [ ] **Step 4: Update index exports**

In `packages/settings/src/index.ts`, export the new schemas, types, and defaults.

---

### Task 3: Create language settings module in web app

**Files:**
- Create: `apps/web/src/settings/languageSettings.ts`
- Create: `apps/web/src/settings/index.ts`

- [ ] **Step 1: Create language settings module**

Create `apps/web/src/settings/languageSettings.ts`:
```typescript
import type { LanguageCode } from '@ielts/i18n'
import { loadConfiguration, saveConfiguration } from '../features/configuration/storage'

export interface LanguageSettings {
  appLanguage: LanguageCode
  aiExplanationLanguage: LanguageCode
  exerciseLanguage: LanguageCode
  tutorResponseLanguage: LanguageCode
}

const LANGUAGE_SETTINGS_KEY = 'ielts-language-settings'

const DEFAULTS: LanguageSettings = {
  appLanguage: 'en',
  aiExplanationLanguage: 'en',
  exerciseLanguage: 'en',
  tutorResponseLanguage: 'en',
}

export function loadLanguageSettings(): LanguageSettings {
  try {
    const config = loadConfiguration()
    if (config.advanced?.tutorConfig?.responseLanguage) {
      const lang = config.advanced.tutorConfig.responseLanguage
      if (lang === 'english') return { ...DEFAULTS, aiExplanationLanguage: 'en', tutorResponseLanguage: 'en' }
      if (lang === 'vietnamese') return { ...DEFAULTS, aiExplanationLanguage: 'vi', tutorResponseLanguage: 'vi' }
    }
  } catch {}
  
  try {
    const raw = localStorage.getItem(LANGUAGE_SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULTS, ...parsed }
    }
  } catch {}
  
  return { ...DEFAULTS }
}

export function saveLanguageSettings(settings: LanguageSettings): void {
  try {
    localStorage.setItem(LANGUAGE_SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}

export function patchLanguageSettings(patch: Partial<LanguageSettings>): LanguageSettings {
  const current = loadLanguageSettings()
  const merged = { ...current, ...patch }
  saveLanguageSettings(merged)
  return merged
}
```

- [ ] **Step 2: Create settings index**

Create `apps/web/src/settings/index.ts`:
```typescript
export {
  loadLanguageSettings,
  saveLanguageSettings,
  patchLanguageSettings,
} from './languageSettings'
export type { LanguageSettings } from './languageSettings'
```

---

### Task 4: Create LanguageProvider for the web app

**Files:**
- Create: `apps/web/src/context/LanguageContext.tsx`

- [ ] **Step 1: Create LanguageContext**

Create `apps/web/src/context/LanguageContext.tsx`:
```typescript
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { I18nContext, t, SUPPORTED_LANGUAGES } from '@ielts/i18n'
import type { LanguageCode } from '@ielts/i18n'
import { loadLanguageSettings, saveLanguageSettings } from '../settings/languageSettings'
import type { LanguageSettings } from '../settings/languageSettings'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LanguageSettings>(() => loadLanguageSettings())

  useEffect(() => {
    saveLanguageSettings(settings)
  }, [settings])

  const changeLanguage = useCallback((field: keyof LanguageSettings, lang: LanguageCode) => {
    setSettings(prev => ({ ...prev, [field]: lang }))
  }, [])

  const value = {
    lang: settings.appLanguage,
    t: (key: string, params?: Record<string, string | number>) => t(key, params, settings.appLanguage),
    settings,
    changeLanguage,
    SUPPORTED_LANGUAGES,
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
```

- [ ] **Step 2: Wrap the app with LanguageProvider**

Modify `apps/web/src/App.tsx` to wrap with `LanguageProvider`.

---

### Task 5: Refactor AI Tutor prompts in `aiTutorService.ts`

**Files:**
- Modify: `apps/web/src/features/ai-tutor/aiTutorService.ts`

- [ ] **Step 1: Extract hardcoded prompt strings into centralized location**

Create `apps/web/src/features/ai-tutor/prompts/tutorPrompts.ts`:
```typescript
// Centralized AI Tutor prompt building
// Uses language settings to produce English-first, locale-aware prompts

export function buildLanguagePrompt(language: 'en' | 'vi' | 'both'): string {
  switch (language) {
    case 'en':
      return 'Always respond in English, even if the user writes in another language.'
    case 'vi':
      return 'Explain in Vietnamese when it helps understanding. Use English for IELTS terminology.'
    case 'both':
      return 'Use both English and Vietnamese in your explanations. Present key terms in English with Vietnamese explanations.'
    default:
      return 'Always respond in English.'
  }
}

export function buildContextualizedSystemPrompt(
  userContext: string,
  languagePreference: string,
  targetBand?: number,
  currentBand?: number,
): string {
  const parts = [
    'You are an AI IELTS Tutor. Your purpose is to help the user achieve their target IELTS band score.',
    '',
    'CORE RULES:',
    '- Always provide accurate IELTS information and strategies.',
    '- Adapt your responses to the user\'s English proficiency level.',
    '- Be encouraging, patient, and constructive.',
    '- Correct mistakes gently and explain why.',
    '- Give specific, actionable advice.',
    '- Connect every response to the user\'s IELTS learning journey.',
    '',
    `LANGUAGE RULE: ${languagePreference}`,
  ]

  if (targetBand) {
    parts.push('', `USER'S TARGET: Band ${targetBand}`)
  }
  if (currentBand) {
    parts.push(`USER'S CURRENT LEVEL: Band ${currentBand}`)
  }

  if (userContext) {
    parts.push('', 'USER CONTEXT:', userContext)
  }

  return parts.join('\n')
}

export function buildWritingFeedbackPrompt(essay: string, taskType: string): string {
  return [
    'You are an experienced IELTS Writing examiner and tutor.',
    'Analyze the following essay and provide detailed feedback.',
    '',
    `Task type: ${taskType}`,
    '',
    'Evaluate on these criteria:',
    '1. Task Achievement / Response — Did the user fully address the task?',
    '2. Coherence and Cohesion — Is the essay well-structured? Are linking words used effectively?',
    '3. Lexical Resource — Is the vocabulary range appropriate for IELTS? Are there any word choice issues?',
    '4. Grammatical Range and Accuracy — Are sentence structures varied? Are there grammar errors?',
    '',
    'For each criterion:',
    '- Rate it (weak / fair / good / excellent)',
    '- Give specific examples from the essay',
    '- Suggest concrete improvements',
    '',
    'Then provide:',
    '- An estimated overall band score',
    '- A rewritten/improved version of key sentences',
    '- A list of 5-10 IELTS-level vocabulary items the user could use instead',
    '- An encouraging summary',
    '',
    'Essay:',
    essay,
  ].join('\n')
}

export function buildSpeakingFeedbackPrompt(answer: string, part: number, question: string): string {
  return [
    'You are an experienced IELTS Speaking examiner.',
    'Evaluate the following speaking response.',
    '',
    `Part: ${part}`,
    `Question: ${question}`,
    '',
    'Evaluate on:',
    '1. Fluency and Coherence — Is the speech smooth and well-organized?',
    '2. Lexical Resource — Is vocabulary appropriate and varied?',
    '3. Grammatical Range and Accuracy — Are structures varied and correct?',
    '4. Pronunciation — Any noticeable issues?',
    '',
    'Provide:',
    '- An estimated band score for each criterion',
    '- Specific observations with examples',
    '- Suggested improvements and alternative expressions',
    '- An estimated overall band score',
    '- An encouraging summary',
    '',
    'Answer:',
    answer,
  ].join('\n')
}
```

- [ ] **Step 2: Update `aiTutorService.ts`**

In `apps/web/src/features/ai-tutor/aiTutorService.ts`, update the prompt-building methods to use centralized prompts and language settings instead of hardcoded Vietnamese assumptions.

Specifically:
- Update `buildTutorSystemPrompt` to use `buildContextualizedSystemPrompt`
- Update `buildWritingFeedbackPrompt` to use the centralized version
- Update `buildSpeakingFeedbackPrompt` to use the centralized version
- Remove hardcoded Vietnamese references from the system prompts

---

### Task 6: Create UI TextComponents

**Files:**
- Create: `apps/web/src/components/ui/TextComponents.tsx`

- [ ] **Step 1: Create Text components**

Create `apps/web/src/components/ui/TextComponents.tsx`:
```tsx
import { useI18n } from '@ielts/i18n'

interface TextProps {
  id: string
  params?: Record<string, string | number>
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'label'
  className?: string
}

export function T({ id, params, as: Tag = 'span', className }: TextProps) {
  const { t } = useI18n()
  return <Tag className={className}>{t(id, params)}</Tag>
}

interface TranslatableTextProps {
  text: string
  className?: string
  as?: 'span' | 'p' | 'div'
}

export function TranslatableText({ text, className, as: Tag = 'span' }: TranslatableTextProps) {
  return <Tag className={className}>{text}</Tag>
}
```

---

### Task 7: Audit and update hardcoded text references in key UI components

**Files:**
- Modify: `apps/web/src/features/ai-tutor/AITutorChat.tsx`
- Modify: `apps/web/src/components/FeatureSection.tsx`

- [ ] **Step 1: Update AITutorChat.tsx**

Replace hardcoded strings with `t()` calls or use the `T` component. Specifically:
- `getTimeBasedGreeting()` → use translation strings
- `"Welcome to IELTS Journey"` → `t('aiTutor.welcomeMessage')`
- `"IELTS Coach"` → `t('aiTutor.subtitle')`
- `"Why today matters"` → `t('aiTutor.whyTodayMatters')`
- Hardcoded fallback response → `t('aiTutor.noResponse')`

- [ ] **Step 2: Update FeatureSection.tsx**

Replace hardcoded feature descriptions with `t()` calls.

---

### Task 8: Add Language Settings UI

**Files:**
- Create: `apps/web/src/components/settings/LanguageSettingsSection.tsx`

- [ ] **Step 1: Create LanguageSettingsSection component**

Create a section in the settings page where users can configure:
- App display language
- AI explanation language  
- Exercise language
- Tutor response language

---

### Task 9: Verify and run tests

**Files:**
- Test: `apps/web/tests`

- [ ] **Step 1: Check if tests pass**

Run: `pnpm test`
Expected: All existing tests pass

- [ ] **Step 2: Address any failures**

Fix any test failures caused by the changes.

---

### Task 10: Final cleanup and validation

- [ ] **Step 1: Check for remaining hardcoded Vietnamese text**

Run a grep for Vietnamese-specific patterns across the codebase.

- [ ] **Step 2: Verify language provider works end-to-end**

Check that `LanguageProvider` wraps the app and that translations resolve correctly.

- [ ] **Step 3: Verify settings save/load correctly**

Check that language settings persist in localStorage and can be loaded on app start.
