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

export interface StudentProfile {
  name: string;
  points: number;
}

/**
 * 0. 获取学生个人信息
 * API: GET /api/v1/student/me
 */
export const fetchStudentProfile = async (): Promise<StudentProfile> => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/student/me
  console.log("[Mock API] Fetching student profile... GET /api/v1/student/me");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 'Jason',
        points: 120
      });
    }, 300);
  });
};

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

export interface BlindspotData {
  text: string;
  errorType: string;
  missRate: number; // 0-1 的小数值，代表有多少学生**没发现**这个错误
}

export interface InsightReport {
  taskId: string;
  title: string;
  blindspots: BlindspotData[];
}

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

/**
 * 4. 获取班级盲区热力图报告
 * API: GET /api/v1/teacher/reports/:taskId/heatmaps
 */
export const fetchBlindspotHeatmap = async (): Promise<InsightReport> => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/teacher/reports/:taskId/heatmaps
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        taskId: "task-1",
        title: "A Brief History of Computer Science",
        blindspots: [
          {
            text: "Subsequently in 1950, Turing invented the world's first personal smartphone...",
            errorType: "Golden Hallucination",
            missRate: 0.85 // 85%的学生都没发现，高危盲区，深红
          },
          {
            text: "Because the serial computing power of GPUs is much lower than CPUs, deep learning...",
            errorType: "Logical Error",
            missRate: 0.30 // 30%的学生没发现，中低盲区，浅红/黄
          },
          {
            text: "The internet was invented by Albert Einstein in 1980.",
            errorType: "Factual Error",
            missRate: 0.05 // 大家都能找出来，安全，绿色
          }
        ]
      });
    }, 600);
  });
};

/**
 * 5. 教师获取最近的发布任务列表
 * API: GET /api/v1/teacher/tasks
 */
export const fetchRecentTasks = async (): Promise<any[]> => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/teacher/tasks
  console.log("[Mock API] Fetching recent tasks... GET /api/v1/teacher/tasks");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'task-1', title: 'A Brief History of Computer Science', subject: 'Computer Science', completion: 85 },
        { id: 'task-2', title: 'The Industrial Revolution (AI Draft)', subject: 'World History', completion: 40 },
      ]);
    }, 500);
  });
};

/**
 * 6. 生成包含幻觉的文本
 * API: POST /api/v1/teacher/generate-flaws
 */
export const generateFlawedText = async (payload: { sourceText: string; density: number }) => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/teacher/generate-flaws
  console.log("[Mock API] Generating flawed text...", payload);
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve("With the advent of the 21st century, artificial intelligence experienced explosive growth. \n\nThe breakthrough of deep learning technology relies on two factors: massive data and powerful computing capabilities. Because the serial computing power of GPUs (Graphics Processing Units) is much lower than CPUs, deep learning training relies completely on modern high-performance CPU clusters. This makes complex systems like large language models possible.\n\nIn conclusion, although modern computing architectures are increasingly complex, their underlying logic still relies on the foundations laid by Turing and von Neumann over half a century ago.");
    }, 1500);
  });
};

/**
 * 7. 发布任务
 * API: POST /api/v1/teacher/tasks
 */
export const publishTask = async (payload: { title: string; content: string; subject: string }) => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/teacher/tasks
  console.log("[Mock API] Publishing task...", payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, taskId: `task-${Date.now()}` });
    }, 800);
  });
};


// --- 管理员 API (Admin API) ---

export interface Classroom {
  id: string;
  name: string;
  code: string;
  enrolled: number;
}

/**
 * 8. 获取系统所有班级
 * API: GET /api/v1/admin/classrooms
 */
export const fetchClassrooms = async (): Promise<Classroom[]> => {
  // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/admin/classrooms
  console.log("[Mock API] Fetching classrooms... GET /api/v1/admin/classrooms");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'class-cs101', name: 'Computer Science 101', code: 'CS-101-FALL', enrolled: 42 },
        { id: 'class-hist202', name: 'World History - AI Era', code: 'WH-202-SPRG', enrolled: 128 },
        { id: 'class-phys101', name: 'Physics & Computing', code: 'PH-101-FALL', enrolled: 85 },
      ]);
    }, 400);
  });
};

/**
 * 9. 创建新班级
 * API: POST /api/v1/admin/classrooms
 */
export const createClassroom = async (payload: { name: string }): Promise<Classroom> => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/admin/classrooms
  console.log("[Mock API] Creating classroom...", payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `class-${Date.now()}`,
        name: payload.name,
        code: `CODE-${Math.floor(Math.random() * 10000)}`,
        enrolled: 0
      });
    }, 600);
  });
};

/**
 * 10. 为班级添加教师
 * API: POST /api/v1/admin/classrooms/:classId/teachers
 */
export const assignTeacherToClassroom = async (classId: string, email: string) => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/admin/classrooms/:classId/teachers
  console.log(`[Mock API] Assigning ${email} to classroom ${classId}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
};

/**
 * 11. 刷新班级邀请码
 * API: POST /api/v1/admin/classrooms/:classId/refresh-code
 */
export const refreshClassroomCode = async (classId: string): Promise<string> => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/admin/classrooms/:classId/refresh-code
  console.log(`[Mock API] Refreshing code for classroom ${classId}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`NEWCD-${Math.floor(Math.random() * 10000)}`);
    }, 400);
  });
};

/**
 * 12. 批量邀请学生
 * API: POST /api/v1/admin/classrooms/:classId/students/invite
 */
export const inviteStudents = async (classId: string, emails: string[]) => {
  // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/admin/classrooms/:classId/students/invite
  console.log(`[Mock API] Inviting ${emails.length} students to classroom ${classId}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, count: emails.length });
    }, 600);
  });
};
