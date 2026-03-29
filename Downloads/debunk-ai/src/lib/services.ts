import { ErrorDensity, MistakeEntryType, Prisma, Role, TaskMode } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';
import { badgeSeeds, encyclopedia } from '@/lib/constants';
import { AnswerKeyItem, Annotation, buildChatReply, buildHint, evaluateTeachback, generateTaskDraft, gradeSubmission } from '@/lib/ai';
import { levelFromXp } from '@/lib/utils';

export async function ensureBadgeSeeds() {
  for (const badge of badgeSeeds) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }
}

export async function createCourseForTeacher(teacherId: string, name: string, subject: string) {
  return prisma.course.create({
    data: {
      name,
      subject,
      inviteCode: nanoid(8).toUpperCase(),
      teacherId,
    },
  });
}

export async function joinCourseByCode(studentId: string, inviteCode: string) {
  const course = await prisma.course.findUnique({ where: { inviteCode: inviteCode.trim().toUpperCase() } });
  if (!course) throw new Error('邀请码无效');
  await prisma.courseEnrollment.upsert({
    where: { courseId_studentId: { courseId: course.id, studentId } },
    update: {},
    create: { courseId: course.id, studentId },
  });
  return course;
}

export async function createTaskForTeacher(input: {
  courseId: string;
  title: string;
  mode: TaskMode;
  topic: string;
  subjectArea: string;
  referenceMaterial?: string | null;
  errorDensity: ErrorDensity;
  errorConfig: Record<string, number>;
  deadline?: Date | null;
  isPublished?: boolean;
  isChallenge?: boolean;
  challengeDuration?: number | null;
}) {
  const generated = await generateTaskDraft({
    topic: input.topic,
    subjectArea: input.subjectArea,
    mode: input.mode,
    density: input.errorDensity,
    errorConfig: input.errorConfig,
    referenceMaterial: input.referenceMaterial,
  });

  return prisma.task.create({
    data: {
      courseId: input.courseId,
      title: input.title,
      mode: input.mode,
      topic: input.topic,
      subjectArea: input.subjectArea,
      referenceMaterial: input.referenceMaterial,
      errorDensity: input.errorDensity,
      errorConfig: input.errorConfig as Prisma.InputJsonValue,
      correctContent: generated.correctContent,
      generatedContent: generated.generatedContent,
      answerKey: generated.answerKey as Prisma.InputJsonValue,
      generatedMeta: (generated.generatedMeta || undefined) as Prisma.InputJsonValue | undefined,
      deadline: input.deadline || null,
      isPublished: input.isPublished ?? true,
      isChallenge: input.isChallenge ?? false,
      challengeDuration: input.challengeDuration || null,
    },
  });
}

export async function getStudentDashboard(userId: string) {
  const courses = await prisma.courseEnrollment.findMany({
    where: { studentId: userId },
    include: { course: { include: { tasks: { where: { isPublished: true }, orderBy: { createdAt: 'desc' }, take: 5 } } } },
  });
  const submissions = await prisma.submission.findMany({ where: { studentId: userId }, orderBy: { submittedAt: 'desc' }, take: 8, include: { task: true } });
  const streak = await prisma.streak.findUnique({ where: { userId } });
  const badges = await prisma.userBadge.count({ where: { userId } });
  const activeTasks = courses.flatMap((entry) => entry.course.tasks).slice(0, 6);
  return { courses, submissions, streak, badges, activeTasks };
}

export async function getTeacherDashboard(userId: string) {
  const courses = await prisma.course.findMany({ where: { teacherId: userId }, include: { tasks: true, enrollments: true }, orderBy: { createdAt: 'desc' } });
  const recentSubmissions = await prisma.submission.findMany({
    where: { task: { course: { teacherId: userId } } },
    include: { task: true, student: true },
    orderBy: { submittedAt: 'desc' },
    take: 10,
  });
  return { courses, recentSubmissions };
}

export async function getStudentCourses(userId: string) {
  return prisma.courseEnrollment.findMany({ where: { studentId: userId }, include: { course: { include: { teacher: true, tasks: { where: { isPublished: true }, orderBy: { createdAt: 'desc' } } } } } });
}

export async function getTeacherCourses(userId: string) {
  return prisma.course.findMany({ where: { teacherId: userId }, include: { enrollments: { include: { student: true } }, tasks: true }, orderBy: { createdAt: 'desc' } });
}

export async function getCourseForViewer(courseId: string, viewerId: string, role: Role) {
  if (role === 'TEACHER') {
    return prisma.course.findFirst({
      where: { id: courseId, teacherId: viewerId },
      include: {
        teacher: true,
        enrollments: { include: { student: true } },
        tasks: { orderBy: { createdAt: 'desc' } },
      },
    });
  }
  return prisma.course.findFirst({
    where: { id: courseId, enrollments: { some: { studentId: viewerId } } },
    include: {
      teacher: true,
      enrollments: { include: { student: true } },
      tasks: { where: { isPublished: true }, orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function getTaskForViewer(taskId: string, viewerId: string, role: Role) {
  if (role === 'TEACHER') {
    return prisma.task.findFirst({
      where: { id: taskId, course: { teacherId: viewerId } },
      include: { course: true, submissions: { include: { student: true } } },
    });
  }
  return prisma.task.findFirst({
    where: { id: taskId, isPublished: true, course: { enrollments: { some: { studentId: viewerId } } } },
    include: { course: true, submissions: true },
  });
}

export async function getSubmissionForStudent(taskId: string, studentId: string) {
  return prisma.submission.findUnique({ where: { taskId_studentId: { taskId, studentId } }, include: { task: true, chatSessions: true } });
}

async function updateStreak(userId: string) {
  const streak = await prisma.streak.upsert({ where: { userId }, update: {}, create: { userId } });
  const today = new Date();
  const last = streak.lastActive ? new Date(streak.lastActive) : null;
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = last ? Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), last.getUTCDate())) / dayMs) : null;
  let current = streak.currentStreak;
  if (diffDays === null) current = 1;
  else if (diffDays === 0) current = streak.currentStreak;
  else if (diffDays === 1) current = streak.currentStreak + 1;
  else current = streak.freezeAvailable ? streak.currentStreak : 1;
  const freezeAvailable = streak.freezeAvailable && diffDays !== null && diffDays > 1 ? false : streak.freezeAvailable;
  return prisma.streak.update({
    where: { userId },
    data: { currentStreak: current, longestStreak: Math.max(current, streak.longestStreak), lastActive: today, freezeAvailable },
  });
}

async function awardBadges(userId: string) {
  await ensureBadgeSeeds();
  const [submissions, user, streak, teachbacks, mistakeEntries] = await Promise.all([
    prisma.submission.findMany({ where: { studentId: userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.chatSession.findMany({ where: { submission: { studentId: userId } } }),
    prisma.mistakeEntry.findMany({ where: { userId } }),
  ]);
  if (!user) return;
  const truePositives = submissions.reduce((sum, s) => sum + ((s.gradingResult as any)?.annotationResults?.filter((x: any) => x.matchStatus === 'true_positive').length || 0), 0);
  const perfect = submissions.some((s) => (s.scoreOverall || 0) >= 100);
  const teachbackPassed = teachbacks.filter((x) => ((x.teachbackScore as any)?.passed)).length;

  const checks = [
    { name: 'first_task', ok: submissions.length >= 1 },
    { name: 'junior_analyst', ok: truePositives >= 20 },
    { name: 'perfect_score', ok: perfect },
    { name: 'streak_7', ok: (streak?.currentStreak || 0) >= 7 },
    { name: 'teachback_pro', ok: teachbackPassed >= 3 },
  ];
  for (const check of checks) {
    if (!check.ok) continue;
    const badge = await prisma.badge.findUnique({ where: { name: check.name } });
    if (!badge) continue;
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      update: {},
      create: { userId, badgeId: badge.id },
    });
  }

  if (mistakeEntries.length >= 5) {
    await prisma.streak.update({ where: { userId }, data: { freezeAvailable: true } }).catch(() => null);
  }
}

export async function submitTaskForStudent(input: {
  taskId: string;
  studentId: string;
  annotations: Annotation[];
  additionalResponse?: Record<string, unknown>;
}) {
  const task = await prisma.task.findUnique({ where: { id: input.taskId } });
  if (!task) throw new Error('任务不存在');
  const answerKey = task.answerKey as unknown as AnswerKeyItem[];
  const grading = gradeSubmission(answerKey, input.annotations);
  const existing = await prisma.submission.findUnique({ where: { taskId_studentId: { taskId: input.taskId, studentId: input.studentId } } });
  const submission = existing
    ? await prisma.submission.update({
        where: { id: existing.id },
        data: {
          annotations: input.annotations as unknown as Prisma.InputJsonValue,
          additionalResponse: input.additionalResponse as Prisma.InputJsonValue | undefined,
          gradingResult: grading as unknown as Prisma.InputJsonValue,
          scorePrecision: grading.scores.precision,
          scoreRecall: grading.scores.recall,
          scoreClassification: grading.scores.classificationAccuracy,
          scoreExplanation: grading.scores.explanationQuality,
          scoreOverall: grading.scores.overall,
          submittedAt: new Date(),
        },
      })
    : await prisma.submission.create({
        data: {
          taskId: input.taskId,
          studentId: input.studentId,
          annotations: input.annotations as unknown as Prisma.InputJsonValue,
          additionalResponse: input.additionalResponse as Prisma.InputJsonValue | undefined,
          gradingResult: grading as unknown as Prisma.InputJsonValue,
          scorePrecision: grading.scores.precision,
          scoreRecall: grading.scores.recall,
          scoreClassification: grading.scores.classificationAccuracy,
          scoreExplanation: grading.scores.explanationQuality,
          scoreOverall: grading.scores.overall,
        },
      });

  await prisma.mistakeEntry.deleteMany({ where: { submissionId: submission.id } });
  const wrongClassificationIds = (grading.annotationResults as any[])
    .filter((item) => item.matchStatus === 'true_positive' && !item.classificationCorrect)
    .map((item) => item.expectedType);

  await prisma.mistakeEntry.createMany({
    data: [
      ...grading.missedErrors.map((item) => ({ userId: input.studentId, submissionId: submission.id, errorId: item.id, entryType: MistakeEntryType.MISSED })),
      ...grading.annotationResults
        .filter((item: any) => item.matchStatus === 'false_positive')
        .map((_, index) => ({ userId: input.studentId, submissionId: submission.id, errorId: 9000 + index, entryType: MistakeEntryType.FALSE_POSITIVE })),
      ...wrongClassificationIds.map((_: any, index: number) => ({ userId: input.studentId, submissionId: submission.id, errorId: 8000 + index, entryType: MistakeEntryType.WRONG_CLASSIFICATION })),
    ],
  });

  const user = await prisma.user.findUnique({ where: { id: input.studentId } });
  const gainedXp = Math.round(grading.scores.overall);
  if (user) {
    const xp = user.xp + gainedXp;
    await prisma.user.update({ where: { id: input.studentId }, data: { xp, level: levelFromXp(xp) } });
  }
  await updateStreak(input.studentId);
  await awardBadges(input.studentId);
  return submission;
}

export async function requestHint(taskId: string, studentId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('任务不存在');
  const answerKey = task.answerKey as unknown as AnswerKeyItem[];
  const existing = await prisma.submission.findUnique({ where: { taskId_studentId: { taskId, studentId } } });
  const foundIds = ((existing?.gradingResult as any)?.annotationResults || [])
    .filter((row: any) => row.matchStatus === 'true_positive' && row.expectedType)
    .map((row: any) => row.expectedType);
  const hintsUsed = existing?.hintsUsed || 0;
  if (hintsUsed >= 3) throw new Error('每个任务最多使用 3 次提示');
  const hint = buildHint(answerKey, [], hintsUsed);
  if (existing) {
    await prisma.submission.update({ where: { id: existing.id }, data: { hintsUsed: hintsUsed + 1 } });
  }
  return { hint, hintsUsed: hintsUsed + 1 };
}

export async function postChatMessage(submissionId: string, errorId: number, message: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { task: true } });
  if (!submission) throw new Error('提交记录不存在');
  const answerKey = submission.task.answerKey as unknown as AnswerKeyItem[];
  const error = answerKey.find((item) => item.id === errorId);
  let session = await prisma.chatSession.findUnique({ where: { submissionId_errorId: { submissionId, errorId } } });
  const messages = ((session?.messages as any[]) || []) as Array<{ role: string; content: string }>;
  messages.push({ role: 'student', content: message });
  const reply = buildChatReply(messages.filter((m) => m.role === 'student').length, error, message);
  messages.push({ role: 'assistant', content: reply });
  if (session) {
    session = await prisma.chatSession.update({ where: { id: session.id }, data: { messages: messages as unknown as Prisma.InputJsonValue } });
  } else {
    session = await prisma.chatSession.create({
      data: {
        submissionId,
        errorId,
        errorContext: (error || {}) as Prisma.InputJsonValue,
        messages: messages as unknown as Prisma.InputJsonValue,
      },
    });
  }
  return session;
}

export async function submitTeachback(submissionId: string, errorId: number, teachback: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { task: true } });
  if (!submission) throw new Error('提交记录不存在');
  const error = (submission.task.answerKey as unknown as AnswerKeyItem[]).find((item) => item.id === errorId);
  const result = evaluateTeachback(error, teachback);
  const session = await prisma.chatSession.upsert({
    where: { submissionId_errorId: { submissionId, errorId } },
    update: { teachbackText: teachback, teachbackScore: result as unknown as Prisma.InputJsonValue },
    create: {
      submissionId,
      errorId,
      errorContext: (error || {}) as Prisma.InputJsonValue,
      messages: [] as unknown as Prisma.InputJsonValue,
      teachbackText: teachback,
      teachbackScore: result as unknown as Prisma.InputJsonValue,
    },
  });
  if (result.passed) {
    const user = await prisma.user.findUnique({ where: { id: submission.studentId } });
    if (user) {
      const xp = user.xp + 20;
      await prisma.user.update({ where: { id: user.id }, data: { xp, level: levelFromXp(xp) } });
      await awardBadges(user.id);
    }
  }
  return { session, result };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { badges: { include: { badge: true } }, streak: true } });
  const submissions = await prisma.submission.findMany({ where: { studentId: userId }, include: { task: true }, orderBy: { submittedAt: 'asc' } });
  const confidencePairs = submissions.flatMap((s) => ((s.gradingResult as any)?.confidencePairs || []) as Array<{ confidence: number; correct: boolean }>);
  const calibration = confidencePairs.length
    ? Math.round(confidencePairs.reduce((sum, item) => sum + Math.abs(item.confidence - (item.correct ? 100 : 0)), 0) / confidencePairs.length)
    : 0;
  return { user, submissions, calibration };
}

export async function getLeaderboard(courseId?: string) {
  const where = courseId ? { task: { courseId } } : {};
  const submissions = await prisma.submission.findMany({
    where,
    include: { student: true, task: true },
    orderBy: { scoreOverall: 'desc' },
  });
  const map = new Map<string, { id: string; name: string; total: number; count: number; precision: number }>();
  submissions.forEach((item) => {
    const current = map.get(item.studentId) || { id: item.studentId, name: item.student.name, total: 0, count: 0, precision: 0 };
    current.total += item.scoreOverall || 0;
    current.precision += item.scorePrecision || 0;
    current.count += 1;
    map.set(item.studentId, current);
  });
  const rows = Array.from(map.values()).map((row) => ({
    ...row,
    averageScore: Math.round(row.total / row.count),
    averagePrecision: Math.round(row.precision / row.count),
  }));
  return {
    weekly: [...rows].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10),
    accuracy: [...rows].sort((a, b) => b.averagePrecision - a.averagePrecision).slice(0, 10),
    improved: [...rows].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10),
  };
}

export async function getMistakes(userId: string) {
  return prisma.mistakeEntry.findMany({
    where: { userId },
    include: { submission: { include: { task: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function updateMistakeNote(id: string, userId: string, note: string) {
  const mistake = await prisma.mistakeEntry.findFirst({ where: { id, userId } });
  if (!mistake) throw new Error('错题不存在');
  return prisma.mistakeEntry.update({ where: { id: mistake.id }, data: { personalNotes: note } });
}

export async function createRetryTaskFromMistake(mistakeId: string, teacherId: string) {
  const mistake = await prisma.mistakeEntry.findFirst({ where: { id: mistakeId }, include: { submission: { include: { task: { include: { course: true } } } } } });
  if (!mistake) throw new Error('错题不存在');
  return createTaskForTeacher({
    courseId: mistake.submission.task.courseId,
    title: `Retry · ${mistake.submission.task.topic}`,
    mode: mistake.submission.task.mode,
    topic: `${mistake.submission.task.topic}（针对性重练）`,
    subjectArea: mistake.submission.task.subjectArea,
    errorDensity: mistake.submission.task.errorDensity,
    errorConfig: mistake.submission.task.errorConfig as Record<string, number>,
    referenceMaterial: mistake.submission.task.referenceMaterial,
    isPublished: true,
  });
}

export function getEncyclopedia() {
  return encyclopedia;
}
