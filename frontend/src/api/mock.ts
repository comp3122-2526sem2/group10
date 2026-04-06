const API_BASE = 'https://debunk-ai-backend.onrender.com';

type HttpMethod = 'GET' | 'POST';

async function request<T>(path: string, options: { method?: HttpMethod; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.auth === false ? {} : token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorPayload = await response.json();
      if (Array.isArray(errorPayload.detail)) {
        message = errorPayload.detail
          .map((item: { msg?: string }) => item.msg || 'Validation error')
          .join(', ');
      } else {
        message = errorPayload.detail ?? errorPayload.message ?? message;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface TaskItem {
  id: string;
  subject: string;
  title: string;
  flawsCount: number;
  locked: boolean;
  status: 'pending' | 'completed';
}

export interface StudentProfile {
  id?: string;
  name: string;
  points: number;
  role?: string;
}

export const fetchStudentProfile = async (): Promise<StudentProfile> => {
  return request<StudentProfile>('/api/v1/auth/me');
};

export const fetchPendingTasks = async (): Promise<TaskItem[]> => {
  const response = await request<{ data: TaskItem[] }>('/api/v1/student/tasks?status=pending');
  return response.data;
};

export const fetchCompletedTasks = async (): Promise<TaskItem[]> => {
  const response = await request<{ data: TaskItem[] }>('/api/v1/student/tasks?status=completed');
  return response.data;
};

export interface StudentTaskDetail {
  taskId: string;
  title: string;
  contentHtml: string;
  highlights: Array<{
    highlightId: number;
    text: string;
    isSubmitted: boolean;
    isResolved: boolean;
  }>;
  foundErrors: number;
  submittedCount: number;
  totalErrors: number;
  studyGuide: {
    resourceTitle: string;
    overview: string;
    sections: Array<{
      sectionTitle: string;
      content: string;
    }>;
    references: Array<{
      highlightId: number;
      conceptTitle: string;
      textbookExcerpt: string;
      explanation: string;
      reviewPoints: string[];
    }>;
  };
}

export const fetchStudentTaskDetail = async (taskId: string): Promise<StudentTaskDetail> => {
  return request<StudentTaskDetail>(`/api/v1/student/tasks/${taskId}`);
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

export const submitAnnotation = async (payload: AnnotationPayload): Promise<AnnotationResponse> => {
  return request<AnnotationResponse>('/api/v1/student/annotations', {
    method: 'POST',
    body: payload,
  });
};

export interface BlindspotData {
  text: string;
  errorType: string;
  missRate: number;
}

export interface InsightReport {
  taskId: string;
  title: string;
  blindspots: BlindspotData[];
}

export const fetchTeacherOverviewStats = async () => {
  return request<{ activeStudents: number; avgFactCheckScore: number; generatedTasks: number }>('/api/v1/teacher/overview');
};

export const fetchBlindspotHeatmap = async (taskId?: string): Promise<InsightReport> => {
  let targetTaskId = taskId;
  if (!targetTaskId) {
    const tasks = await fetchRecentTasks();
    if (!tasks.length) {
      return {
        taskId: 'none',
        title: 'No published tasks yet',
        blindspots: [],
      };
    }
    targetTaskId = tasks[0].id;
  }
  return request<InsightReport>(`/api/v1/teacher/reports/${targetTaskId}/heatmaps`);
};

export interface TeacherTask {
  id: string;
  title: string;
  subject: string;
  completion: number;
  status?: string;
  createdAt?: string;
}

export const fetchRecentTasks = async (): Promise<TeacherTask[]> => {
  const response = await request<{ data: TeacherTask[] }>('/api/v1/teacher/tasks');
  return response.data;
};

export interface GeneratedDraft {
  taskId: string;
  title: string;
  subject: string;
  generatedText: string;
  contentHtml: string;
  highlights: Array<{
    highlightId: number;
    text: string;
    errorType: string;
    canonicalReason: string;
    explanation: string;
    paragraphIndex: number;
    isGolden: boolean;
  }>;
  totalErrors: number;
  status: string;
  studyGuide: {
    resourceTitle: string;
    overview: string;
    sections: Array<{
      sectionTitle: string;
      content: string;
    }>;
    references: Array<{
      highlightId: number;
      conceptTitle: string;
      textbookExcerpt: string;
      explanation: string;
      reviewPoints: string[];
    }>;
  };
}

export const generateFlawedText = async (payload: {
  sourceText: string;
  density: number;
  title?: string;
  subject?: string;
}): Promise<GeneratedDraft> => {
  return request<GeneratedDraft>('/api/v1/teacher/generate-flaws', {
    method: 'POST',
    body: {
      sourceText: payload.sourceText,
      density: payload.density,
      title: payload.title ?? 'New Fact-check Task',
      subject: payload.subject ?? 'General',
    },
  });
};

export const publishTask = async (payload: { taskId: string; title: string; subject: string }) => {
  return request<{ success: boolean; taskId: string }>('/api/v1/teacher/tasks', {
    method: 'POST',
    body: payload,
  });
};

export interface Classroom {
  id: string;
  name: string;
  code: string;
  enrolled: number;
}

export const fetchClassrooms = async (): Promise<Classroom[]> => {
  return request<Classroom[]>('/api/v1/admin/classrooms');
};

export const createClassroom = async (payload: { name: string }): Promise<Classroom> => {
  return request<Classroom>('/api/v1/admin/classrooms', {
    method: 'POST',
    body: payload,
  });
};

export const assignTeacherToClassroom = async (classId: string, email: string) => {
  return request<{ success: boolean }>(`/api/v1/admin/classrooms/${classId}/teachers`, {
    method: 'POST',
    body: { email },
  });
};

export const refreshClassroomCode = async (classId: string): Promise<string> => {
  return request<string>(`/api/v1/admin/classrooms/${classId}/refresh-code`, {
    method: 'POST',
  });
};

export const inviteStudents = async (classId: string, emails: string[]) => {
  return request<{ success: boolean; count: number }>(`/api/v1/admin/classrooms/${classId}/students/invite`, {
    method: 'POST',
    body: { emails },
  });
};

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export const login = async (payload: { email: string; password: string }) => {
  return request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  });
};

export const register = async (payload: { email: string; password: string; name: string; role: string }) => {
  return request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  });
};
