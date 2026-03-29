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

  // Create users
  const teacher = await prisma.user.create({ 
    data: { 
      name: 'Dr. Sarah Miller', 
      email: 'teacher@debunk.ai', 
      passwordHash, 
      role: Role.TEACHER,
      xp: 1250,
      level: 5
    } 
  });
  const teacher2 = await prisma.user.create({
    data: {
      name: 'Prof. James Wilson',
      email: 'james@debunk.ai',
      passwordHash,
      role: Role.TEACHER,
      xp: 980,
      level: 4
    }
  });
  const student = await prisma.user.create({ 
    data: { 
      name: 'Alex Johnson', 
      email: 'student@debunk.ai', 
      passwordHash, 
      role: Role.STUDENT,
      xp: 450,
      level: 2
    } 
  });
  const student2 = await prisma.user.create({ 
    data: { 
      name: 'Emma Wong', 
      email: 'student2@debunk.ai', 
      passwordHash, 
      role: Role.STUDENT,
      xp: 320,
      level: 2
    } 
  });
  const student3 = await prisma.user.create({
    data: {
      name: 'Marcus Chen',
      email: 'marcus@debunk.ai',
      passwordHash,
      role: Role.STUDENT,
      xp: 580,
      level: 3
    }
  });

  // Create streaks
  await prisma.streak.createMany({ 
    data: [
      { userId: teacher.id, currentStreak: 12, longestStreak: 25 },
      { userId: teacher2.id, currentStreak: 8, longestStreak: 18 },
      { userId: student.id, currentStreak: 5, longestStreak: 10 },
      { userId: student2.id, currentStreak: 3, longestStreak: 7 },
      { userId: student3.id, currentStreak: 7, longestStreak: 15 }
    ] 
  });
  
  // Create badges
  await prisma.badge.createMany({ data: badgeSeeds as any });

  // Create multiple courses
  const course1 = await prisma.course.create({ 
    data: { 
      name: 'AI Literacy 101', 
      subject: 'Computer Science', 
      inviteCode: 'DEBUNK01', 
      teacherId: teacher.id,
      createdAt: new Date('2024-01-15')
    } 
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Critical Thinking Skills',
      subject: 'General Education',
      inviteCode: 'THINK101',
      teacherId: teacher2.id,
      createdAt: new Date('2024-02-01')
    }
  });

  const course3 = await prisma.course.create({
    data: {
      name: 'Science Communication',
      subject: 'Sciences',
      inviteCode: 'SCICOMM',
      teacherId: teacher.id,
      createdAt: new Date('2024-02-20')
    }
  });

  // Enroll students in courses
  await prisma.courseEnrollment.createMany({ 
    data: [
      { courseId: course1.id, studentId: student.id, enrolledAt: new Date('2024-01-20') },
      { courseId: course1.id, studentId: student2.id, enrolledAt: new Date('2024-01-20') },
      { courseId: course1.id, studentId: student3.id, enrolledAt: new Date('2024-02-05') },
      { courseId: course2.id, studentId: student.id, enrolledAt: new Date('2024-02-05') },
      { courseId: course2.id, studentId: student3.id, enrolledAt: new Date('2024-02-10') },
      { courseId: course3.id, studentId: student2.id, enrolledAt: new Date('2024-03-01') },
      { courseId: course3.id, studentId: student3.id, enrolledAt: new Date('2024-03-05') }
    ] 
  });

  // Create tasks for course 1
  const task1 = await createTaskForTeacher({
    courseId: course1.id,
    title: 'AI Bias and Fairness',
    mode: TaskMode.ARTICLE,
    topic: 'Understanding AI Bias',
    subjectArea: 'Computer Science',
    referenceMaterial: 'Artificial intelligence systems can perpetuate and amplify existing biases present in training data. For instance, facial recognition systems have been shown to have higher error rates for people with darker skin tones. This is because the training datasets used to build these systems contained more images of lighter-skinned individuals. Addressing AI bias requires diverse datasets, careful testing, and ongoing monitoring of model performance across different demographic groups.',
    errorDensity: ErrorDensity.MEDIUM,
    errorConfig: { factual: 1, logical: 1, hallucination: 1, conceptual: 1 },
    isPublished: true,
  });

  const task2 = await createTaskForTeacher({
    courseId: course1.id,
    title: 'Machine Learning Fundamentals',
    mode: TaskMode.SOLUTION,
    topic: 'Supervised vs Unsupervised Learning',
    subjectArea: 'Computer Science',
    referenceMaterial: 'Supervised learning uses labeled data where the correct answers are known, like predicting house prices using historical sales data. Unsupervised learning finds patterns in unlabeled data, like grouping customers by shopping behavior. Semi-supervised learning uses a small amount of labeled data with a large amount of unlabeled data to improve predictions.',
    errorDensity: ErrorDensity.EASY,
    errorConfig: { factual: 2, logical: 1, hallucination: 0, conceptual: 1 },
    isPublished: true,
  });

  const task3 = await createTaskForTeacher({
    courseId: course1.id,
    title: 'Deep Learning Applications',
    mode: TaskMode.COMPARE,
    topic: 'Neural Networks in Real Life',
    subjectArea: 'Computer Science',
    referenceMaterial: 'Deep learning powers many modern AI applications including image recognition, natural language processing, and autonomous vehicles. Convolutional Neural Networks (CNNs) excel at image tasks by learning hierarchical features. Recurrent Neural Networks (RNNs) handle sequential data like text and time series. Transformers, introduced in 2017, revolutionized NLP with self-attention mechanisms that allow models to focus on relevant parts of input.',
    errorDensity: ErrorDensity.HARD,
    errorConfig: { factual: 1, logical: 2, hallucination: 2, conceptual: 1 },
    isPublished: true,
  });

  // Create tasks for course 2
  const task4 = await createTaskForTeacher({
    courseId: course2.id,
    title: 'Logical Fallacies in Debate',
    mode: TaskMode.ARTICLE,
    topic: 'Common Fallacies',
    subjectArea: 'General Education',
    referenceMaterial: 'Ad hominem attacks criticize the person rather than their argument. Straw man fallacy misrepresents an opponent\'s position to make it easier to refute. Begging the question assumes the conclusion in the premises. Appeal to authority uses an expert\'s opinion outside their field of expertise. Understanding these fallacies helps develop critical thinking skills and construct stronger arguments.',
    errorDensity: ErrorDensity.MEDIUM,
    errorConfig: { factual: 1, logical: 2, hallucination: 1, conceptual: 1 },
    isPublished: true,
  });

  const task5 = await createTaskForTeacher({
    courseId: course2.id,
    title: 'Evidence Evaluation',
    mode: TaskMode.CITATION,
    topic: 'Assessing Source Credibility',
    subjectArea: 'General Education',
    referenceMaterial: 'When evaluating sources, consider the author\'s credentials, potential biases, and whether claims are supported by evidence. Primary sources like original research or firsthand accounts have different value than secondary sources. Peer-reviewed journals submit papers to expert scrutiny. Popular media may prioritize engagement over accuracy. Cross-referencing multiple reliable sources helps establish credibility and identify misinformation.',
    errorDensity: ErrorDensity.EASY,
    errorConfig: { factual: 1, logical: 0, hallucination: 1, conceptual: 2 },
    isPublished: true,
  });

  // Create tasks for course 3
  const task6 = await createTaskForTeacher({
    courseId: course3.id,
    title: 'Communicating Climate Science',
    mode: TaskMode.ARTICLE,
    topic: 'Climate Change Facts',
    subjectArea: 'Sciences',
    referenceMaterial: 'Global average temperatures have risen by 1.1°C since pre-industrial times, primarily due to human activities that increase greenhouse gases. Climate models consistently project further warming. Credible scientific organizations worldwide, including NASA and the IPCC, confirm human-caused climate change. Effective communication requires translating complex data into accessible language while maintaining scientific accuracy.',
    errorDensity: ErrorDensity.MEDIUM,
    errorConfig: { factual: 1, logical: 1, hallucination: 1, conceptual: 1 },
    isPublished: true,
  });

  // Create some submissions and grades
  if (task1 && typeof task1 === 'object' && 'id' in task1) {
    const submission1 = await prisma.submission.create({
      data: {
        taskId: task1.id,
        studentId: student.id,
        annotations: [
          {
            selectedText: "AI systems have been shown to have higher error rates for people with darker skin tones",
            errorType: "FACTUAL",
            explanation: "This is a documented fact from multiple studies on facial recognition systems",
            confidence: 95
          }
        ],
        gradingResult: {
          correct: true,
          feedback: "Good understanding of AI bias sources",
          score: 85
        },
        scoreOverall: 85
      }
    });

    const submission2 = await prisma.submission.create({
      data: {
        taskId: task1.id,
        studentId: student2.id,
        annotations: [
          {
            selectedText: "Bias in AI only happens when programmers intentionally create biased systems",
            errorType: "CONCEPTUAL",
            explanation: "This overlooks unintentional biases from training data",
            confidence: 90
          }
        ],
        gradingResult: {
          correct: false,
          feedback: "Even well-intentioned systems can perpetuate bias if data is skewed",
          score: 45
        },
        scoreOverall: 45
      }
    });

    // Create mistake entry
    await prisma.mistakeEntry.create({
      data: {
        userId: student2.id,
        submissionId: submission2.id,
        errorId: 1,
        entryType: 'MISSED'
      }
    });
  }

  if (task4 && typeof task4 === 'object' && 'id' in task4) {
    const submission3 = await prisma.submission.create({
      data: {
        taskId: task4.id,
        studentId: student.id,
        annotations: [
          {
            selectedText: "Ad hominem attacks the person instead of their argument",
            errorType: "FACTUAL",
            explanation: "Correctly identifies the logical fallacy",
            confidence: 100
          }
        ],
        gradingResult: {
          correct: true,
          feedback: "Excellent understanding of logical fallacies",
          score: 92
        },
        scoreOverall: 92
      }
    });
  }

  console.log('✅ Seeded demo system:');
  console.log('📚 Teachers: teacher@debunk.ai (Dr. Sarah Miller) | james@debunk.ai (Prof. James Wilson)');
  console.log('👥 Students: student@debunk.ai (Alex Johnson) | student2@debunk.ai (Emma Wong) | marcus@debunk.ai (Marcus Chen)');
  console.log('🎓 Courses: AI Literacy 101 | Critical Thinking Skills | Science Communication');
  console.log('📋 Tasks: 6 tasks with various error densities (Easy/Medium/Hard)');
  console.log('📊 Submissions: Sample submissions with grades and feedback');
}

main().finally(async () => prisma.$disconnect());
