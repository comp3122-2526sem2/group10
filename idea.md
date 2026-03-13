Idea 1: “大家来找茬：AI 刺客” (Debunk the AI / Fact-Checker Pro)

痛点切入： 现在的学生太容易盲信 AI 给出的答案，缺乏批判性思维 。

核心玩法： 反其道而行之。老师输入一个知识点，平台利用 AI 故意生成一篇包含“细微错误、幻觉或逻辑谬误”的文章或解题步骤。学生的任务是扮演“阅卷老师”或“事实核查员”，在文章中高亮标记出错误，并写下正确的解释。最后由 AI（系统裁判）根据学生找出的错误数量和解释质量给出评分。


为什么新颖： 完全反转了“AI 教学生”的传统模式，变成了“学生给 AI 纠错”。这不仅完美契合了教授要求的“展现人类判断力和批判性思维” ，还非常切合当下对 AI 幻觉的讨论。

为什么好做： * 后端： 只需要两套 Prompt。一套让大模型“故意犯错”（比如混淆历史时间、写错公式符号）；另一套用于对比学生的纠错结果。

前端： 核心就是一个支持文本高亮（Highlight）和添加批注的富文本编辑器界面，技术非常成熟。


Gemini said
太棒了！既然你觉得这两个方向都不错，那我们就把它们都细化成今晚可以直接填表提交的文案草稿。

我特别注意了你的 PDF 作业要求：教授强调了 GitHub 协作 、每人都要有实质性的代码贡献（不能有人纯打杂） 、体现 Education 4.0 的以学生为中心/协作式学习 以及消除“AI味” 。
+4

下面是分别为 Idea 1 和 Idea 2 准备的填表文案及 4 人分工方案。你可以对比一下，看今晚交哪个。

方案 A：Idea 1 “大家来找茬：AI 刺客” (Debunk the AI)
这个方案的技术风险最低，但立意非常切合当下的“AI 幻觉”痛点，很受老师欢迎。

3. Briefly introduce your team background
Our team consists of 4 members with a balanced mix of technical skills suitable for full-stack web development. For programming languages, we are proficient in JavaScript/TypeScript and Python. For web frameworks, we plan to use React/Next.js for building an interactive frontend and Node.js or FastAPI (Python) for the backend. We also have practical experience with integrating LLM APIs (like OpenAI or Gemini) and basic prompt engineering. We are passionate about EdTech and Human-Computer Interaction (HCI) design.

4. Describe the application you want to develop
We want to develop "Debunk AI," an interactive platform that reverses the traditional AI-tutor model to foster critical thinking, a core competency in Education 4.0. Instead of AI providing correct answers, teachers upload study materials, and the AI intentionally generates an essay or solution containing subtle logical fallacies, factual errors, or "hallucinations."

Unique Features: Students act as "Fact-Checkers." They use an interactive UI to highlight flawed text, annotate corrections, and explain why the AI is wrong. The system then evaluates the student's corrections and provides a "Critical Thinking Score." This directly addresses the risk of students blindly trusting AI.

Stakeholders & Prototypes: We have conducted informal interviews with a few university peers who admitted to over-relying on GenAI for answers. We have not built a functional prototype yet, but we have sketched low-fidelity UI wireframes on Figma to visualize the text-highlighting and annotation workflow. We plan to interview secondary school teachers next week to refine the teacher dashboard.

5. What is your team's plan and approach to complete and collaborate?
We will adopt an Agile development approach and strictly use GitHub for project management, utilizing GitHub Issues and Project Boards to track tasks. We will conduct weekly sprint planning.
Division of Labor (4 Members):
To ensure everyone demonstrates sufficient coding contribution:
+1

Member 1 (Frontend - Student Space): Develop the interactive text-editor UI allowing students to highlight text, add annotations, and view feedback.

Member 2 (Frontend - Teacher Dashboard): Build the portal for teachers to upload materials, configure the "error density" of the AI, and view student analytics.

Member 3 (Backend - AI Logic & Prompts): Design the prompt-chaining architecture to force the LLM to generate plausible but flawed content based on materials, and the logic to grade student annotations.

Member 4 (Backend - Core API & Database): Handle user authentication, database schema (storing materials, user scores, and annotated JSON data), and API routing.
All members will participate in UI/UX refinement, testing, and ensuring we remove "AI smells" from the final product.
+1

6. Upload a document (1-2 pages) Outline

Title: Project Proposal: Debunk AI

Section 1: App Features & User Flow: Describe the 3-step process (Teacher uploads -> AI generates flawed text -> Student annotates & gets graded).


Section 2: Uniqueness & Value Proposition: Contrast with traditional RAG QA bots. Emphasize building "AI Literacy" and critical thinking over pure knowledge retention.

Section 3: Low-Fi Prototype Screenshots: Insert 2-3 screenshots of your Figma sketches (e.g., the text highlighting interface).