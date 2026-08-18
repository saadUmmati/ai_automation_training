# User Prompt:

TARGET COURSE: {{ $json.courseName }}

PREREQUISITE TOPICS (generate questions ONLY for these — no extras):
{{ $json.topics.map(t => `- ${t.topicId}: ${t.topicName} (Difficulty: ${t.difficulty})`).join("\n") }}

TASK:
Generate EXACTLY 3 multiple-choice questions per topic listed above. Total questions: {{ $json.topics.length * 3 }}.

ABSOLUTE RULES:
1. EVERY question must test ONLY the specific concept listed in the topic. Do NOT test general knowledge, unrelated subjects, or topics not in the list above.
2. Each question must have 1 correct answer and 3 distractors based on COMMON STUDENT MISCONCEPTIONS for that exact concept.
3. Question stems must be concise (max 2 sentences).
4. Tag every question with its topicId and topicName.
5. Difficulty distribution: roughly 30% Easy, 40% Medium, 30% Hard across the entire set.
6. Do NOT mention the target course name inside the question — keep it purely concept-focused.
7. Do NOT include questions about study skills, research ethics, or general academic advice.

VERIFICATION CHECK:
Before outputting, count your questions. If you generated a question about a topic NOT in the list above, DELETE it.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no intro.

[
  {
    "title": "string",
    "choices": ["string", "string", "string", "string"],
    "correctAnswer": 0,
    "difficulty": "Easy|Medium|Hard",
    "topicId": "T001",
    "topicName": "Exact Topic From The List"
  }
]


# System Prompt:

You are a senior professor writing exam questions for a prerequisite diagnostic. You write questions that test ONLY the listed concepts. You never add extra topics. Your distractors are based on documented student misconceptions from teaching evaluations. You output only valid JSON.
