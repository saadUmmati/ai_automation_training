# User Prompt:
COURSE: {{ $json.courseName }}
CLASS SIZE: {{ $json.totalResponses }} students responded.

PER-TOPIC PERFORMANCE:
{{ $json.scores.map(s => `- ${s.topicName}: ${s.accuracy}% correct | Threshold: ${s.threshold}% | Severity: ${s.severity}`).join("\n") }}

TASK:
1. Flag topics where accuracy < threshold.
2. For each flagged topic, write:
   - One concise explanation (150 words)
   - One worked example
   - One practice problem
3. If severity is "High", add a second worked example.
4. If ALL topics are above threshold, return exactly: NO_GAPS_DETECTED
5. Count how many students scored below 40% across ALL topics (outliers).

OUTPUT FORMAT:
{
  "flaggedTopics": [
    {
      "topicName": "...",
      "accuracy": 52,
      "threshold": 65,
      "severity": "High",
      "explanation": "...",
      "workedExamples": ["...", "..."],
      "practiceProblems": ["...", "..."]
    }
  ],
  "outlierCount": 3,
  "executiveSummary": "One paragraph for the professor"
}
