// 模拟数据及 API 请求层 (Mock Services)
// 这里统一定义了前后端的数据契约。后端同学可以根据这里的 request payload 和 return 结构开发真实接口。
// [API_TODO] REPLACE_WITH_REAL_API: 将本文件替换为真实 HTTP 客户端实现（baseURL=/api/v1）。

// --- 学生端 API (Student API) ---

export interface TaskItem {
  id: string;
  subject: string;
  title: string;
  flawsCount: number;
  locked: boolean;
  status: 'pending' | 'completed';
}

/**
 * 1. 获取学生的待办任务列表
 * API: GET /api/v1/student/tasks?status=pending
 */
export const fetchPendingTasks = async (): Promise<TaskItem[]> => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/student/tasks?status=pending
  console.log("[Mock API] Fetching pending tasks... GET /api/v1/student/tasks?status=pending");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'task-1', subject: 'Computer Science', title: 'A Brief History of Computer Science', flawsCount: 5, locked: false, status: 'pending' },
        { id: 'task-2', subject: 'World History', title: 'The Industrial Revolution (AI Draft)', flawsCount: 8, locked: true, status: 'pending' },
      ]);
    }, 600);
  });
};

export interface StudentTaskDetail {
  taskId: string;
  title: string;
  contentHtml: string;
  highlights: Array<{
    highlightId: number;
    text: string;
    isResolved: boolean;
  }>;
  foundErrors: number;
  totalErrors: number;
}

/**
 * 2. 获取任务全文与高亮
 * API: GET /api/v1/student/tasks/:taskId
 */
export const fetchStudentTaskDetail = async (taskId: string): Promise<StudentTaskDetail> => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/student/tasks/:taskId
  console.log(`[Mock API] Fetching task detail... GET /api/v1/student/tasks/${taskId}`);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId,
        title: 'A Brief History of Computer Science',
        contentHtml:
          '<p>The development of computer science is a process full of innovation and breakthroughs...</p>',
        highlights: [
          {
            highlightId: 1,
            text: "Subsequently in 1950, Turing invented the world's first personal smartphone...",
            isResolved: false,
          },
          {
            highlightId: 2,
            text: 'Because the serial computing power of GPUs is much lower than CPUs...',
            isResolved: false,
          },
        ],
        foundErrors: 2,
        totalErrors: 5,
      });
    }, 500);
  });
};

export interface AnnotationPayload {
  taskId: string;
  highlightId: number;
  errorType: string;
  reason: string;
}

export interface AnnotationResponse {
  success: boolean;
  pointsEarned: number;
  isCorrect: boolean;
  aiFeedback: string;
  message: string;
  isGolden?: boolean;
}

/**
 * 2. 提交学生的纠错表单 (核心链路)
 * 对应组件: Workspace 右侧批注栏
 * API: POST /api/v1/student/annotations
 */
export const submitAnnotation = async (payload: AnnotationPayload): Promise<AnnotationResponse> => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/student/annotations
  console.log("[Mock API] Submitting annotation... POST /api/v1/student/annotations", payload);
  // 模拟网络请求和 AI 处理延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      // 设定 highlightId 1 作为一个“黄金幻觉”彩蛋
      const isGolden = payload.highlightId === 1;
      resolve({
        success: true,
        pointsEarned: isGolden ? 15 : 5, // 找到 Golden Hallucination 得 3 倍分
        isCorrect: true,
        aiFeedback: 'Excellent logic! You successfully spotted the hardware illusion.',
        message: isGolden 
          ? "🎉 You hit the Golden Hallucination! Triple Points Awarded!" 
          : "Successfully debunked the AI hallucination!",
        isGolden
      });
    }, 800);
  });
};


// --- 教师端 API (Teacher API) ---

/**
 * 3. 获取教师面板统计数据
 * API: GET /api/v1/teacher/overview
 */
export const fetchTeacherOverviewStats = async () => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/teacher/overview
  console.log("[Mock API] Fetching teacher stats... GET /api/v1/teacher/overview");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        activeStudents: 42,
        avgFactCheckScore: 86,
        generatedTasks: 12
      });
    }, 500);
  });
};
