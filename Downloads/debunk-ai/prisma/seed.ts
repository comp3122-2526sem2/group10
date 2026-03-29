import bcrypt from 'bcryptjs';
import { ErrorDensity, Role, TaskMode } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { badgeSeeds } from '../src/lib/constants';
import { createTaskForTeacher } from '../src/lib/services';

async function main() {
  await prisma.mistakeEntry.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const teacher = await prisma.user.create({ data: { name: 'Teacher Demo', email: 'teacher@debunk.ai', passwordHash, role: Role.TEACHER } });
  const student = await prisma.user.create({ data: { name: 'Student Demo', email: 'student@debunk.ai', passwordHash, role: Role.STUDENT } });
  const student2 = await prisma.user.create({ data: { name: 'Student Two', email: 'student2@debunk.ai', passwordHash, role: Role.STUDENT } });

  await prisma.streak.createMany({ data: [{ userId: teacher.id }, { userId: student.id }, { userId: student2.id }] });
  await prisma.badge.createMany({ data: badgeSeeds as any });

  const course = await prisma.course.create({ data: { name: 'AI Literacy 101', subject: 'Computer Science', inviteCode: 'DEBUNK01', teacherId: teacher.id } });
  await prisma.courseEnrollment.createMany({ data: [{ courseId: course.id, studentId: student.id }, { courseId: course.id, studentId: student2.id }] });

  await createTaskForTeacher({
    courseId: course.id,
    title: 'Demo Debunk Task',
    mode: TaskMode.ARTICLE,
    topic: 'Newton\'s Third Law',
    subjectArea: 'Sciences',
    referenceMaterial: 'Newton\'s Third Law states that when one body exerts a force on another body, the second body exerts an equal and opposite force on the first. The forces are equal in magnitude and opposite in direction, but they act on different objects.',
    errorDensity: ErrorDensity.MEDIUM,
    errorConfig: { factual: 1, logical: 1, hallucination: 1, conceptual: 1 },
    isPublished: true,
  });

  console.log('Seeded demo users: teacher@debunk.ai / student@debunk.ai / student2@debunk.ai');
}

main().finally(async () => prisma.$disconnect());
