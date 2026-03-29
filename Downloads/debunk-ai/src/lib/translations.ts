// Translation dictionary for English
export const en = {
  // Auth
  auth: {
    email: 'Email',
    password: 'Password',
    name: 'Name',
    role: 'Role',
    login: 'Login',
    loggingIn: 'Logging in...',
    register: 'Create Account',
    registering: 'Creating...',
    student: 'Student',
    teacher: 'Teacher',
    requestFailed: 'Request failed',
    demoAccounts: 'Demo accounts: teacher@debunk.ai / student@debunk.ai, password: password123',
  },
  // Home page
  home: {
    tagline: 'Reverse AI Tutoring',
    title: 'Teach students not to "trust AI", but to "question AI".',
    description: 'Debunk AI transforms AI from an authority source into an object that students must review, question, and correct. Teachers create content with intentional errors, students highlight, categorize, explain, and review, ultimately developing the truly scarce skill in the AI era: critical thinking + AI literacy.',
    getStarted: 'Get Started',
    tryDemo: 'Try Demo Account',
    liveSnapshot: 'Live Product Snapshot',
    features: [
      {
        title: '4 Error Types Framework',
        description: 'Factual / Logical / AI Hallucination / Conceptual Confusion',
      },
      {
        title: 'Socratic Hints',
        description: "Don't give answers, only ask questions, guiding students to discover problems themselves",
      },
      {
        title: 'Gamification',
        description: 'Levels, XP, badges, streaks, leaderboard - all drive continuous engagement',
      },
    ],
    steps: [
      'Teachers create content with errors and publish to courses',
      'Students highlight words in read-only text, fill error types, explanations, and confidence',
      'System auto-grades: Precision / Recall / Classification accuracy / Explanation quality',
      'Incorrect items automatically enter Mistake Journal with targeted Retry',
      'Review phase enters Socratic conversation and completes teach-back',
    ],
  },
  // Dashboard
  dashboard: {
    dashboard: 'Dashboard',
    courses: 'Courses',
    tasks: 'Tasks',
    profile: 'Profile',
    leaderboard: 'Leaderboard',
    mistakes: 'Mistake Journal',
    encyclopedia: 'Encyclopedia',
    logout: 'Logout',
    welcome: 'Welcome',
    teacher: 'Teacher',
    student: 'Student',
  },
  // Courses
  courses: {
    myCourses: 'My Courses',
    courseCode: 'Course Code',
    students: 'Students',
    createCourse: 'Create Course',
    joinCourse: 'Join Course',
    courseName: 'Course Name',
    courseDescription: 'Description',
    enroll: 'Enroll',
    leave: 'Leave Course',
  },
  // Tasks
  tasks: {
    myTasks: 'My Tasks',
    taskName: 'Task Name',
    topic: 'Topic',
    errorDensity: 'Error Density',
    difficulty: 'Difficulty',
    createTask: 'Create Task',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    submit: 'Submit',
    hint: 'Get Hint',
  },
  // Errors
  errors: {
    factual: 'Factual Error',
    logical: 'Logical Fallacy',
    hallucination: 'AI Hallucination',
    conceptual: 'Conceptual Confusion',
    explanation: 'Explanation',
    confidence: 'Confidence',
  },
  // Common
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    submit: 'Submit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
  },
} as const;
