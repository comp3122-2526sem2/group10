export const errorTypeMap = {
  factual: { label: 'Factual Error', color: 'bg-rose-200 text-rose-900', border: 'border-rose-300' },
  logical: { label: 'Logical Fallacy', color: 'bg-amber-200 text-amber-900', border: 'border-amber-300' },
  hallucination: { label: 'AI Hallucination', color: 'bg-violet-200 text-violet-900', border: 'border-violet-300' },
  conceptual: { label: 'Conceptual Confusion', color: 'bg-sky-200 text-sky-900', border: 'border-sky-300' },
} as const;

export const modeOptions = [
  { value: 'ARTICLE', label: 'Article Review' },
  { value: 'SOLUTION', label: 'Solution Audit' },
  { value: 'CITATION', label: 'Citation Check' },
  { value: 'COMPARE', label: 'Compare & Judge' },
] as const;

export const subjectOptions = ['Sciences', 'Humanities', 'Mathematics', 'Computer Science', 'Social Science', 'Language Arts'];

export const encyclopedia = [
  {
    id: 'factual',
    title: 'Factual Errors',
    tip: 'Verify numbers, dates, names, locations, and cause-effect relationships.',
    examples: ['Writing 1914 as 1941', 'Misquoting Newton\'s Third Law', 'Misspelling institution names'],
    traps: ['Similar looking but wrong numbers', 'Swapped year digits', 'Disguising common knowledge with technical terms'],
  },
  {
    id: 'logical',
    title: 'Logical Fallacies',
    tip: 'Ask: "Must the conclusion necessarily follow from the premises?"',
    examples: ['Treating correlation as causation', 'Straw man arguments', 'False dichotomy'],
    traps: ['Confident tone can be misleading', 'Many examples but broken reasoning chain'],
  },
  {
    id: 'hallucination',
    title: 'AI Hallucinations',
    tip: 'Verify citations, statistics, institutions, papers, and journals.',
    examples: ['Fabricated papers', 'Made-up statistics', 'Fictional research labs'],
    traps: ['Proper formatting looks real', 'Correct citation style but false content'],
  },
  {
    id: 'conceptual',
    title: 'Conceptual Confusion',
    tip: 'Watch for substitution of similar terms like speed/velocity, weather/climate.',
    examples: ['Confusing speed and velocity', 'Mixing machine learning and deep learning', 'Confusing evaporation and boiling'],
    traps: ['Easy to overlook familiar terms'],
  },
];

export const badgeSeeds = [
  { name: 'first_task', displayName: 'First Task', description: 'Completed your first Debunk task', icon: '🧪', unlockCondition: { type: 'completed_tasks', threshold: 1 } },
  { name: 'junior_analyst', displayName: 'Junior Analyst', description: 'Correctly identified 20 errors', icon: '🕵️', unlockCondition: { type: 'true_positives', threshold: 20 } },
  { name: 'perfect_score', displayName: 'Perfect Score', description: 'Achieved 100 points on any task', icon: '🎯', unlockCondition: { type: 'perfect_score', threshold: 100 } },
  { name: 'streak_7', displayName: '7-Day Streak', description: 'Completed tasks 7 days in a row', icon: '🔥', unlockCondition: { type: 'streak', threshold: 7 } },
  { name: 'teachback_pro', displayName: 'Teach-Back Pro', description: 'Passed 3 teach-back sessions', icon: '📚', unlockCondition: { type: 'teachback_passed', threshold: 3 } },
];
