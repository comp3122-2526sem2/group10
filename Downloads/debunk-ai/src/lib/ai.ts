import { ErrorDensity, TaskMode } from '@prisma/client';
import { clamp, randomFromSeed } from '@/lib/utils';

const USE_REAL_AI = !!process.env.HF_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

// Force real AI mode in production
if (!HF_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('Warning: HF_API_KEY is not set in production. AI features will not work.');
}

async function callHuggingFaceAPI(prompt: string): Promise<string | null> {
  if (!HF_API_KEY) return null;
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export type ErrorKey = 'factual' | 'logical' | 'hallucination' | 'conceptual';
export type Annotation = {
  id: string;
  start: number;
  end: number;
  selectedText: string;
  errorType: ErrorKey;
  explanation: string;
  confidence: number;
};

export type AnswerKeyItem = {
  id: number;
  start: number;
  end: number;
  errorText: string;
  errorType: ErrorKey;
  whatIsWrong: string;
  correctVersion: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

function densityToCount(density: ErrorDensity) {
  if (density === 'EASY') return 2;
  if (density === 'MEDIUM') return 4;
  return 6;
}

function buildCorrectParagraphs(topic: string, subjectArea: string, referenceMaterial?: string | null) {
  if (referenceMaterial && referenceMaterial.trim().length > 120) {
    const source = referenceMaterial.replace(/\s+/g, ' ').trim();
    const sample = source.slice(0, 1200);
    return [
      `Topic: ${topic}. The following summary is grounded in the teacher-provided material and keeps a neutral educational tone.`,
      sample,
      `A careful reader should still verify claims, distinguish evidence from interpretation, and check whether examples truly support the central idea in ${subjectArea}.`,
    ];
  }
  return [
    `${topic} is usually taught as a concept that combines definition, evidence, and interpretation. In ${subjectArea}, students are expected to explain not only what the idea means, but also why the supporting evidence is convincing.`,
    `A strong explanation of ${topic} starts with the central claim, then introduces a relevant example, and finally evaluates what the example does and does not prove. Good academic writing avoids exaggeration and keeps cause, effect, and evidence clearly separated.`,
    `When reading AI-generated material about ${topic}, students should pay attention to whether statistics are sourced, whether named institutions really exist, and whether similar concepts are being quietly swapped as if they mean the same thing.`,
    `Another useful habit is to compare the wording of a conclusion with the evidence that comes before it. If a passage jumps from one case to a universal statement, or from correlation to causation, the reasoning may sound polished while still being flawed.`,
    `The most reliable way to study ${topic} is to read actively: mark suspicious phrases, ask what evidence would confirm them, and rewrite the claim in your own words before accepting it as true.`
  ];
}

const errorTemplates: Record<ErrorKey, (topic: string) => { wrong: string; correction: string; reason: string }> = {
  factual: (topic) => ({
    wrong: `Most introductory courses agree that ${topic} was formally standardized in 1895 and adopted worldwide within two years.`,
    correction: `Claims about the exact year and rapid worldwide adoption need verification; the statement is overly specific and unsupported.`,
    reason: 'The sentence presents precise historical facts without any source and is intentionally unreliable.',
  }),
  logical: (topic) => ({
    wrong: `Because students who practice ${topic} often improve their grades, studying ${topic} must be the single cause of academic success.`,
    correction: `Improved grades may correlate with practice, but the passage cannot claim that ${topic} is the single cause of success.`,
    reason: 'This is a false-cause / oversimplification error that turns correlation into certainty.',
  }),
  hallucination: (topic) => ({
    wrong: `A 2024 study from the Global Institute of Synthetic Learning in the Journal of Advanced Classroom Truth found a 93% certainty rate for AI explanations of ${topic}.`,
    correction: `The cited institute and journal should be independently verified before being trusted.`,
    reason: 'This example demonstrates the hallucination error type: fabricated or unverifiable sources.',
  }),
  conceptual: (topic) => ({
    wrong: `In practice, ${topic} is best understood by treating evidence, opinion, and proof as interchangeable forms of support.`,
    correction: `Evidence, opinion, and proof are related but not interchangeable; collapsing them changes the meaning of the concept.`,
    reason: 'The passage subtly swaps related concepts as if they are identical.',
  }),
};

export async function generateTaskDraft(input: {
  topic: string;
  subjectArea: string;
  mode: TaskMode;
  density: ErrorDensity;
  errorConfig?: Record<string, number>;
  referenceMaterial?: string | null;
}) {
  const correctParagraphs = buildCorrectParagraphs(input.topic, input.subjectArea, input.referenceMaterial);
  const correctContent = correctParagraphs.join('\n\n');
  const seed = randomFromSeed(`${input.topic}-${input.mode}-${input.density}`);
  const keys: ErrorKey[] = ['factual', 'logical', 'hallucination', 'conceptual'];
  const desired = densityToCount(input.density);
  const picked = Array.from({ length: desired }).map((_, i) => keys[(seed + i) % keys.length]);

  const paragraphs = [...correctParagraphs];
  const answerKey: AnswerKeyItem[] = [];
  picked.forEach((type, index) => {
    const targetIndex = Math.min(index, paragraphs.length - 1);
    const template = errorTemplates[type](input.topic);
    paragraphs[targetIndex] = `${paragraphs[targetIndex]} ${template.wrong}`;
  });

  const generatedContent = paragraphs.join('\n\n');
  let rollingIndex = 0;
  picked.forEach((type, index) => {
    const template = errorTemplates[type](input.topic);
    const start = generatedContent.indexOf(template.wrong, rollingIndex);
    const end = start + template.wrong.length;
    answerKey.push({
      id: index + 1,
      start,
      end,
      errorText: template.wrong,
      errorType: type,
      whatIsWrong: template.reason,
      correctVersion: template.correction,
      difficulty: input.density === 'EASY' ? 'easy' : input.density === 'MEDIUM' ? 'medium' : 'hard',
    });
    rollingIndex = end;
  });

  let generatedMeta: Record<string, unknown> | null = null;
  if (input.mode === 'COMPARE') {
    generatedMeta = {
      compare: {
        versionA: `${correctParagraphs[0]} ${errorTemplates.logical(input.topic).wrong}`,
        versionB: `${correctParagraphs[0]} ${errorTemplates.factual(input.topic).wrong}`,
      },
    };
  }
  if (input.mode === 'SOLUTION') {
    generatedMeta = {
      steps: [
        `Step 1: Define the main claim behind ${input.topic}.`,
        `Step 2: Link the claim to one concrete example.`,
        `Step 3: Explain why the evidence actually supports the claim.`,
        `Step 4: Check whether the conclusion overreaches the evidence.`,
      ],
    };
  }
  if (input.mode === 'CITATION') {
    generatedMeta = {
      citations: [
        { label: '[1]', text: 'Smith, A. Learning With Evidence. Academic Press, 2021.', verdict: 'real' },
        { label: '[2]', text: 'Lee, M. Journal of Advanced Classroom Truth, 2024.', verdict: 'fabricated' },
      ],
    };
  }

  return { correctContent, generatedContent, answerKey, generatedMeta };
}

function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const left = Math.max(aStart, bStart);
  const right = Math.min(aEnd, bEnd);
  return Math.max(0, right - left);
}

export function gradeSubmission(answerKey: AnswerKeyItem[], annotations: Annotation[]) {
  const matched = new Set<number>();
  const annotationResults = annotations.map((annotation) => {
    const hit = answerKey.find((item) => overlap(item.start, item.end, annotation.start, annotation.end) >= Math.min(12, item.end - item.start, annotation.end - annotation.start));
    if (!hit) {
      return {
        annotationId: annotation.id,
        selectedText: annotation.selectedText,
        matchStatus: 'false_positive',
        classificationCorrect: false,
        explanationQuality: Math.max(2, Math.round(annotation.explanation.length / 30)),
        feedback: 'This segment does not adequately overlap with errors in the answer key. This is a false positive.',
      };
    }
    matched.add(hit.id);
    const explanationQuality = clamp(Math.round(annotation.explanation.length / 12 + (annotation.explanation.includes('because') ? 2 : 0)), 1, 10);
    return {
      annotationId: annotation.id,
      selectedText: annotation.selectedText,
      matchStatus: 'true_positive',
      classificationCorrect: annotation.errorType === hit.errorType,
      explanationQuality,
      feedback: annotation.errorType === hit.errorType ? 'You caught a real error with correct classification.' : `Error found, but the more appropriate type is ${hit.errorType}`,
      expectedType: hit.errorType,
    };
  });

  const missedErrors = answerKey.filter((item) => !matched.has(item.id)).map((item) => ({
    id: item.id,
    errorText: item.errorText,
    errorType: item.errorType,
    hint: `Review the sentence containing "${item.errorText.slice(0, 18)}..." - check the evidence first, then verify if the reasoning is sound.`,
    explanation: item.whatIsWrong,
    correctVersion: item.correctVersion,
  }));

  const tp = annotationResults.filter((item) => item.matchStatus === 'true_positive').length;
  const fp = annotationResults.filter((item) => item.matchStatus === 'false_positive').length;
  const precision = tp + fp === 0 ? 0 : Math.round((tp / (tp + fp)) * 100);
  const recall = answerKey.length === 0 ? 0 : Math.round((tp / answerKey.length) * 100);
  const classificationAccuracy = tp === 0 ? 0 : Math.round((annotationResults.filter((item) => item.matchStatus === 'true_positive' && item.classificationCorrect).length / tp) * 100);
  const explanationQuality = annotationResults.length === 0 ? 0 : Math.round((annotationResults.reduce((sum, item) => sum + item.explanationQuality, 0) / (annotationResults.length * 10)) * 100);
  const overall = clamp(Math.round(precision * 0.35 + recall * 0.3 + classificationAccuracy * 0.15 + explanationQuality * 0.2));

  const strengths = [] as string[];
  const areasToImprove = [] as string[];
  if (precision >= 70) strengths.push('Able to reliably distinguish real errors from normal phrasing');
  if (classificationAccuracy >= 70) strengths.push('Error type classification is quite accurate');
  if (recall < 60) areasToImprove.push('Tendency to miss errors scattered in later segments');
  if (precision < 60) areasToImprove.push('Need to reduce false positives; verify before annotating');
  if (areasToImprove.length === 0) areasToImprove.push('Continue improving explanation depth and evidence citation');

  return {
    annotationResults,
    missedErrors,
    scores: { precision, recall, classificationAccuracy, explanationQuality, overall },
    personalizedFeedback: `Your precision this time is ${precision}%, recall is ${recall}%. Start with the most verifiable evidence-based sentences, then tackle inference-based issues.`,
    strengths,
    areasToImprove,
    confidencePairs: annotations.map((item) => ({ confidence: item.confidence, correct: annotationResults.find((row) => row.annotationId === item.id)?.matchStatus === 'true_positive' })),
  };
}

export function buildHint(answerKey: AnswerKeyItem[], foundIds: number[], hintsUsed: number) {
  const target = answerKey.find((item) => !foundIds.includes(item.id)) || answerKey[0];
  if (!target) return 'Start with the most suspicious numbers, sources, or causal statements.';
  const prefix = hintsUsed >= 2 ? 'More specifically: ' : 'Try thinking about it this way: ';
  if (target.errorType === 'hallucination') return `${prefix}Do the source, institution, or journal in this statement actually exist? Can you verify it independently?`;
  if (target.errorType === 'logical') return `${prefix}Has this statement conflated "simultaneous occurrence" with "inevitable causation"? Are there other explanations?`;
  if (target.errorType === 'conceptual') return `${prefix}Does this statement treat two similar but distinct concepts as if they were the same thing?`;
  return `${prefix}Do the specific years, numbers, or factual claims in this statement have sufficient evidence supporting them?`;
}

export function buildChatReply(turn: number, error: AnswerKeyItem | undefined, studentMessage: string) {
  if (!error) return 'Tell me which error you want to discuss, and I will guide you through Socratic questions.';
  if (turn <= 2) return `You mentioned "${studentMessage.slice(0, 30)}". Looking at the original sentence, what felt unstable first? The evidence, causation, or concept definition?`;
  if (turn <= 4) return `Focus on this error: ${error.errorText.slice(0, 60)}... Try answering: if this sentence were true, what additional evidence would you expect to see?`;
  return `Let me point this out directly: the problem here is "${error.whatIsWrong}". A more reliable revision would be: ${error.correctVersion}`;
}

export function evaluateTeachback(error: AnswerKeyItem | undefined, teachback: string) {
  const keywords = error ? error.correctVersion.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 2).slice(0, 4) : [];
  const hitCount = keywords.filter((word) => teachback.toLowerCase().includes(word)).length;
  const accuracy = clamp(4 + hitCount * 2, 0, 10);
  const completeness = clamp(Math.round(Math.min(10, teachback.length / 25)), 0, 10);
  const clarity = teachback.includes('because') || teachback.includes('therefore') ? 8 : 6;
  return {
    passed: accuracy >= 6 && completeness >= 5,
    accuracyScore: accuracy,
    completenessScore: completeness,
    clarityScore: clarity,
    feedback: accuracy >= 6 ? 'Your explanation has grasped the main issue. Try condensing it into one clear judgment standard using your own words.' : 'You need to more clearly point out what is wrong with the original sentence and what the correct version should be.',
  };
}
