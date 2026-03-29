export const errorTypeMap = {
  factual: { label: '事实错误', color: 'bg-rose-200 text-rose-900', border: 'border-rose-300' },
  logical: { label: '逻辑谬误', color: 'bg-amber-200 text-amber-900', border: 'border-amber-300' },
  hallucination: { label: 'AI 幻觉', color: 'bg-violet-200 text-violet-900', border: 'border-violet-300' },
  conceptual: { label: '概念混淆', color: 'bg-sky-200 text-sky-900', border: 'border-sky-300' },
} as const;

export const modeOptions = [
  { value: 'ARTICLE', label: 'Article Review / 文章审校' },
  { value: 'SOLUTION', label: 'Solution Audit / 解题审计' },
  { value: 'CITATION', label: 'Citation Check / 引文核验' },
  { value: 'COMPARE', label: 'Compare & Judge / 对比判断' },
] as const;

export const subjectOptions = ['Sciences', 'Humanities', 'Mathematics', 'Computer Science', 'Social Science', 'Language Arts'];

export const encyclopedia = [
  {
    id: 'factual',
    title: '事实错误',
    tip: '核对数字、时间、人物、地点、因果链上的客观事实。',
    examples: ['把 1914 写成 1941', '把牛顿第三定律说成“力会自动消失”', '把真实机构名称写错'],
    traps: ['数字很像但不对', '年份调换位置', '把常识包装成专业表达'],
  },
  {
    id: 'logical',
    title: '逻辑谬误',
    tip: '先问“结论是不是一定由前提推出”。',
    examples: ['把相关性当因果', '稻草人论证', '错误二分法'],
    traps: ['论证语气很自信', '举例很多但推理链断裂'],
  },
  {
    id: 'hallucination',
    title: 'AI 幻觉',
    tip: '重点核对引用、统计、机构、论文、期刊是否真实存在。',
    examples: ['杜撰论文', '虚构统计来源', '不存在的大学实验室'],
    traps: ['格式像真的', '引用风格规范但内容是假的'],
  },
  {
    id: 'conceptual',
    title: '概念混淆',
    tip: '留意相近术语是否被偷换，如 speed/velocity、weather/climate。',
    examples: ['速度和速率混用', '机器学习和深度学习偷换', '蒸发与沸腾混淆'],
    traps: ['术语都很熟，容易放松警惕'],
  },
];

export const badgeSeeds = [
  { name: 'first_task', displayName: '🧪 初次出击', description: '完成第一份 Debunk 任务', icon: '🧪', unlockCondition: { type: 'completed_tasks', threshold: 1 } },
  { name: 'junior_analyst', displayName: '🕵️ Junior Analyst', description: '累计正确识别 20 个错误', icon: '🕵️', unlockCondition: { type: 'true_positives', threshold: 20 } },
  { name: 'perfect_score', displayName: '🎯 Perfect Score', description: '任意任务总分 100', icon: '🎯', unlockCondition: { type: 'perfect_score', threshold: 100 } },
  { name: 'streak_7', displayName: '🔥 7-Day Streak', description: '连续 7 天完成任务', icon: '🔥', unlockCondition: { type: 'streak', threshold: 7 } },
  { name: 'teachback_pro', displayName: '📚 Teach-Back Pro', description: '通过 3 次 teach-back', icon: '📚', unlockCondition: { type: 'teachback_passed', threshold: 3 } },
];
