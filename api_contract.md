# Debunk AI - API Contract (前后端接口契约)

这份完整的 API 契约定义了驱动整个 "Debunk AI" 平台的接口约定。前端会在 `src/api/mock.ts` 中针对这些契约进行 Mock。后端同学请基于以下 JSON Schema 建表并提供实体接口。

---

## 0. 全局约定
* **Base URL**: `/api/v1`
* **鉴权方式 (Auth)**: 基于 JWT。所有带有 `[Auth Required]` 的接口均需要在 Request Header 中携带 `Authorization: Bearer <Token>`。
* **通用错误返回 (Generic Error)**:
```json
{
  "error": "ERR_CODE",
  "message": "Human readable error message"
}
```

---

## 1. 认证与用户管理接口 (Authentication & Users)

### 1.1 账号注册 (Register)
- **Endpoint**: `POST /auth/register`
- **Request Body**:
```json
{
  "email": "student@example.com",
  "password": "secure_password",
  "name": "Jason",
  "role": "student" // "student", "teacher", "admin"
}
```
- **Response Shape (201 Created)**: 返回用户的基本信息。

### 1.2 登录获取 Token (Login)
- **Endpoint**: `POST /auth/login`
- **Request Body**:
```json
{
  "email": "student@example.com",
  "password": "secure_password"
}
```
- **Response Shape (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...", 
  "user": {
    "id": "u-12345",
    "name": "Jason",
    "role": "student"
  }
}
```

### 1.3 获取当前身份信息 (Get Me) `[Auth Required]`
- **Endpoint**: `GET /auth/me`
- **说明**: 每次前端页面加载/刷新时静默调用，校验 Token 有效性并拉取当前登录用户的姓名和积分为顶部导航栏供值。
- **Response Shape**:
```json
{
  "id": "u-12345",
  "name": "Jason",
  "role": "student",
  "points": 120 
}
```

---

## 2. 学生端核心接口 (Student API)

### 2.1 获取任务列表 (Get Tasks) `[Auth Required]`
- **Endpoint**: `GET /student/tasks`
- **Query Parameters**:
  - `status` (optional): `pending` (待办) | `completed` (已完成). 默认返回 pending。
- **Response Shape (200 OK)**:
```json
{
  "data": [
    {
      "id": "task-1",
      "subject": "Computer Science",
      "title": "A Brief History of Computer Science",
      "flawsCount": 5,
      "locked": false,
      "status": "pending"
    }
  ]
}
```

### 2.2 获取任务全文与预设高亮坐标 (Get Task Content) `[Auth Required]`
- **Endpoint**: `GET /student/tasks/:taskId`
- **说明**: 进入 Workspace 渲染具体的文章以及文章内需要让学生点击的“高亮文本”。
  > **⚠️ 格式约定 (Important)**: 后端下发的 `contentHtml` 中，针对需要被高亮的错词/短语，必须用具体的 HTML span 标签进行包裹并附带 `data-highlight-id` 属性，前端才能正常绑定点击事件。例如：`<span data-highlight-id="1">错误的内容</span>`。
- **Response Shape (200 OK)**:
```json
{
  "taskId": "task-1",
  "title": "A Brief History of Computer Science",
  "contentHtml": "<p>...</p>", // 或者原始纯文本数组
  "highlights": [
    {
      "highlightId": 1,
      "text": "Subsequently in 1950, Turing invented personal smartphone...",
      "isResolved": false // 学生是否已找出此错误
    }
  ],
  "foundErrors": 2,  // 已经找出的错误数
  "totalErrors": 5   // 总共的错误数
}
```

### 2.3 提交漏洞批注 (Submit Annotation) `[Auth Required]`
**核心业务链路**：学生选中高亮的文本，在右侧面板提交自己找出的错误类型及理由。
- **Endpoint**: `POST /student/annotations`
- **Request Body**:
```json
{
  "taskId": "task-1",
  "highlightId": 1,
  "errorType": "Logical Error",  // 可选值: "Logical Error", "Factual Error", "AI Hallucination"
  "reason": "This is logically incorrect because Deep Learning relies heavily on GPUs, not CPU clusters."
}
```
- **Response Shape (200 OK)**:
```json
{
  "success": true,
  "pointsEarned": 1,
  "isCorrect": true, // AI 判定该批注是否正确
  "aiFeedback": "Excellent logic! You successfully spotted the hardware illusion.",
  "message": "Successfully debunked the AI hallucination!"
}
```

### 2.4 获取学生积分排行榜 (Get Leaderboard) `[Auth Required]`
- **Endpoint**: `GET /student/leaderboard`
- **Query Parameters**:
  - `limit` (optional): 返回前几名，默认 10。
- **Response Shape (200 OK)**:
```json
{
  "data": [
    {
      "rank": 1,
      "studentId": "u-12345",
      "name": "Jason",
      "points": 120
    },
    {
      "rank": 2,
      "studentId": "u-12346",
      "name": "Alice",
      "points": 115
    }
  ]
}
```

---

## 3. 教师端作业管理接口 (Teacher API)

### 3.1 获取教师大盘统计 (Teacher Overview Stats) `[Auth Required]`
- **Endpoint**: `GET /teacher/overview`
- **Response Shape (200 OK)**:
```json
{
  "activeStudents": 42,
  "avgFactCheckScore": 86,
  "generatedTasks": 12
}
```

### 3.2 获取教师已创建的任务列表 (Get Created Tasks) `[Auth Required]`
- **Endpoint**: `GET /teacher/tasks`
- **Response Shape (200 OK)**:
```json
{
  "data": [
    {
      "id": "task-2",
      "subject": "World History",
      "title": "Industrial Revolution",
      "status": "Completed", 
      "createdAt": "2026-03-12T10:00:00Z"
    }
  ]
}
```

### 3.3 获取任务生成状态与详情大盘 (Get Task Details/Polling) `[Auth Required]`
- **Endpoint**: `GET /teacher/tasks/:taskId`
- **说明**: 教师端用于轮询异步生成的任务状态，或查看最终生成的带有陷阱的文章详情。
- **Response Shape (200 OK)**:
```json
{
  "id": "task-2",
  "status": "Generating", // "Generating" | "Completed" | "Failed"
  "title": "Industrial Revolution",
  "contentHtml": "<p>...</p>", // 可选，如果在 Generating 状态则可为空
  "highlights": [ // 任务包含的所有预设错误点（类似学生端的数据，但不隐藏）
    {
      "highlightId": 1,
      "text": "..."
    }
  ],
  "totalErrors": 3 // 最终生成的错误数
}
```

### 3.4 上传文档资料以生成任务 (Create New Task Generation) `[Auth Required]`
- **Endpoint**: `POST /teacher/tasks`
- **说明**: 教师上传 Markdown/TXT 文件或段落，以及配置要求，后端调用大模型生成带有错误陷阱的文段。
- **Request Body Payload**: (如果是文本直传，暂不考虑 `multipart/form-data`)
```json
{
  "title": "Industrial Revolution",
  "subject": "World History",
  "sourceText": "The Industrial Revolution was a period of global transition...",
  "errorDensity": 3 // 枚举: 1(Low), 2(Medium), 3(High 难度)
}
```
- **Response Shape (202 Created)**:
```json
{
  "taskId": "task-2",
  "status": "Generating", // 后端可以放入消息队列慢慢生成，前端轮询
  "message": "Material uploaded successfully, AI is poisoning the text..."
}
```

### 3.5 拉取学生的历史作答/分析(Fetch Class Execution Analytics) `[Auth Required]`
- **Endpoint**: `GET /teacher/tasks/:taskId/analytics`
- **Response Shape (200 OK)**:
```json
{
  "taskId": "task-1",
  "completionRate": 78.5,
  "mostCommonMissedHighlightId": 2, // 全班同学最容易漏掉的高亮知识点
  "studentSubmissions": [
    {
      "studentName": "Jason",
      "score": 4, // out of 5
      "status": "Completed"
    }
  ]
}
```

---

## 4. 管理端接口 (Admin API)

### 4.1 获取全平台全局运营大盘 (Global Dashboard) `[Auth Required: Admin]`
- **Endpoint**: `GET /admin/dashboard/metrics`
- **Response Shape (200 OK)**:
```json
{
  "totalUsers": { "students": 1050, "teachers": 14 },
  "totalTasksGenerated": 342,
  "totalAiApiTokensUsed": 10500200, // 用于换算开销
  "systemStatus": "Healthy"
}
```

### 4.2 全局系统配置/更新API密钥 (System Config/LLM Keys) `[Auth Required: Admin]`
- **Endpoint**: `PUT /admin/config`
- **Request Body**:
```json
{
  "settingKey": "OPENAI_API_KEY",
  "settingValue": "sk-proj-xxxxxxxx..."
}
```

---

## 5. 契约一致性修正建议（前后端统一强约束）

1. **统一 `status` 枚举大小写**（避免前端分支判断混乱）
   - 建议统一为：`pending | generating | completed | failed`
   - 适用接口：
     - `GET /student/tasks`
     - `GET /teacher/tasks`
     - `GET /teacher/tasks/:taskId`

2. **统一任务主键字段命名**
   - 当前存在 `taskId` 与 `id` 混用。
   - 建议响应体统一使用 `id`，URL 参数继续用 `:taskId`。

3. **统一 API Base URL 表达**
   - 所有示例请求建议明确写成 `/api/v1/...`，避免 mock 与后端路由不一致。

4. **提交批注响应字段建议固定**
   - `POST /student/annotations` 建议固定返回：
   ```json
   {
     "success": true,
     "pointsEarned": 1,
     "isCorrect": true,
     "aiFeedback": "...",
     "message": "..."
   }
   ```

---

## 6. 建议补充的 API（当前前端流程会依赖）

### 6.1 刷新 Token
- **Endpoint**: `POST /auth/refresh`
- **用途**: 前端静默续期，避免长会话频繁掉线。

### 6.2 退出登录
- **Endpoint**: `POST /auth/logout`
- **用途**: 主动失效当前 token / refresh token。

### 6.3 教师任务生成失败原因
- **增强**: `GET /teacher/tasks/:taskId` 在 `status=failed` 时补充：
```json
{
  "status": "failed",
  "failureReason": "Model timeout or invalid source text"
}
```

### 6.4 教师任务列表分页与筛选
- **Endpoint**: `GET /teacher/tasks`
- **Query 建议**: `page`, `pageSize`, `status`, `subject`, `keyword`

### 6.5 学生排行榜分页
- **Endpoint**: `GET /student/leaderboard`
- **Query 建议**: `page`, `pageSize`, `limit`（可保留兼容）

### 6.6 学生历史作答记录
- **Endpoint**: `GET /student/submissions`
- **用途**: 学生端展示历史表现、复盘错因。

### 6.7 批注提交幂等保护（可选）
- **Endpoint**: `POST /student/annotations`
- **Header 建议**: `Idempotency-Key`
- **用途**: 防止重复提交造成重复加分。