# AI Automation Training — n8n / Google Apps Script Prerequisite Diagnostic

Professional resources and production-ready snippets for an automated prerequisite-check and diagnostic-quiz pipeline built for n8n + Google Apps Script. This project demonstrates a repeatable workflow to (1) discover prerequisite concepts for a course using an LLM, (2) generate structured multiple-choice diagnostics, (3) deploy Google Forms to collect student responses, and (4) analyze class-level gaps and produce remediation materials.

## What this is
An automation toolkit for instructors and curriculum teams that converts course prerequisites into a short, auto-generated diagnostic quiz and performs topic-level gap analysis at the start of a semester. It is designed to run inside n8n workflows, using Google Apps Script for form distribution and email/packet delivery, and OpenAI-style prompts for structured content generation.

### Stack
- Language(s): JavaScript (Apps Script + n8n Function code)
- Framework / runtime: Google Apps Script (web app) + n8n (automation/orchestration)
- Notable libraries / services: Google Sheets, Google Forms, Google Drive, Gmail (via Apps Script); OpenAI (or comparable LLM) via n8n OpenAI node

## Repository layout
Top-level files and purpose:

```
appsScript.js                       // Google Apps Script: endpoint to manage forms, emails, packets
Parse Prerequisite JSON.js          // n8n Function node: parse LLM "discover prerequisites" output
PROMPT Discover Prerequisites.md    // LLM prompt to identify prerequisite topics
PROMPT Generate Quiz.md             // LLM prompt to generate 3 MCQs per topic
Parse Quiz JSON.js                  // n8n Function node: parse LLM "generate quiz" output
Calculate Per-Topic Accuracy.js     // n8n Function node: compute per-topic accuracy from responses
PROMPT Gap Analysis.md              // LLM prompt to analyze gaps and recommend remediation
PROMPT Verify Prerequisites.md      // LLM prompt to audit/verify extracted prerequisites
Parse Analysis.js                   // n8n Function node: parse/format analysis from the LLM
README.md                           // This documentation (you are reading it)
LICENSE                             // Project license (MIT)
docs/                               // Deployment and security guidance
n8n/workflow-example.json            // Example n8n workflow structure (importable)
sample_roster.csv                   // Example roster template
.gitignore                          // standard ignores
```

**How it fits together:** The n8n workflow runs a chain of LLM prompts (discover → verify → generate quiz → analyze results). The parsed JSON outputs from the LLM nodes feed into downstream function nodes (Parse Prerequisite JSON, Parse Quiz JSON). When a Google Form is needed, n8n calls the Apps Script web app (appsScript.js) to create the form and link a response sheet. Responses are read back (via the Apps Script or by n8n accessing the sheet), passed into Calculate Per-Topic Accuracy, and then summarized / analyzed by another LLM prompt. If remediation is recommended, the Apps Script can create and distribute a packet and reminders.

## Quick start — deploy and run

Prerequisites:
- n8n instance (cloud or self-hosted) with credentials for OpenAI (or equivalent LLM).
- Google account with access to Sheets/Forms/Drive/Gmail; the Apps Script will require OAuth scopes for these services.
- A Google Sheet with class roster (tab name must be "Class-Rooster" by default — see configuration).
- Basic familiarity with deploying Google Apps Scripts as web apps.

1. Apps Script deployment
   - Create a new Google Apps Script project and paste the contents of `appsScript.js`.
   - Update configuration constants at the top:
     - CONFIG_SHEET_ID — optional spreadsheet for configuration (if used)
     - ROSTER_SHEET_ID — spreadsheet ID that contains the roster; the script expects a sheet named "Class-Rooster"
     - SECRET_TOKEN — set a secure, random token and keep it secret
   - Authorize the script to access Sheets, Forms, Drive, and Gmail (follow the Apps Script prompts).
   - Deploy the project as a Web App (Latest code, execute as: Me, who has access: Only myself or Anyone within domain).
   - Note: for secure production use, restrict access and require the SECRET_TOKEN for each request.

2. n8n workflow (high-level)
   - Node: Trigger or manual start → set `courseName`
   - Node: OpenAI (Prompt: PROMPT Discover Prerequisites.md) → Node: Function (Parse Prerequisite JSON.js)
     - Output: `topics` array with objects containing:
       - topicId, topicName, description, difficulty, suggestedThreshold, severityIfBelow
   - Node: OpenAI (Prompt: PROMPT Generate Quiz.md) → Node: Function (Parse Quiz JSON.js)
     - Output: `quiz` array with objects containing:
       - title, choices[], correctAnswer (index), difficulty, topicId, topicName
   - Node: HTTP Request (to Apps Script `createForm` action) to create a Google Form
   - Node: Email distribution (via Apps Script `sendEmails` or n8n Gmail node) to roster
   - After responses collected:
     - Node: HTTP Request (to Apps Script `checkResponses`) or n8n Google Sheets node to fetch response rows
     - Node: Function (Calculate Per-Topic Accuracy.js)
     - Node: OpenAI (Prompt: PROMPT Gap Analysis.md) → Node: Function (Parse Analysis.js)
   - Optional: Apps Script `createPacket` and `sendPacket` actions for remediation and professor summary

3. Example Apps Script doPost payloads
   - Create form:
     ```json
     {
       "secret": "YOUR_SECRET_TOKEN",
       "action": "createForm",
       "quizJson": [ /* array produced by Parse Quiz JSON */ ],
       "courseName": "Intro to X"
     }
     ```
   - Send emails:
     ```json
     {
       "secret": "YOUR_SECRET_TOKEN",
       "action": "sendEmails",
       "emails": ["student1@example.com", "student2@example.com"],
       "subject": "Please complete the diagnostic",
       "body": "Short instructions and link."
     }
     ```
   - Check responses:
     ```json
     {
       "secret": "YOUR_SECRET_TOKEN",
       "action": "checkResponses",
       "responseSheetId": "SHEET_ID"
     }
     ```

## Data formats (examples)

- Topic (Discover Prerequisites output — parse into `topics`):
```json
{
  "topicId": "T001",
  "topicName": "Hypothesis Testing (t-tests, F-tests)",
  "description": "Understanding hypothesis testing and interpreting p-values.",
  "difficulty": "Medium",
  "suggestedThreshold": 65,
  "severityIfBelow": "High"
}
```

- Quiz question:
```json
{
  "title": "Which t-test is appropriate when comparing means from two independent samples?",
  "choices": ["Independent t-test", "Paired t-test", "One-sample t-test", "ANOVA"],
  "correctAnswer": 0,
  "difficulty": "Easy",
  "topicId": "T001",
  "topicName": "Hypothesis Testing (t-tests, F-tests)"
}
```

- Responses sheet expectations
  - Column A: Timestamp
  - Subsequent columns: each question's student answer (text matching one of the `choices` values)
  - Calculate Per-Topic Accuracy expects question columns to be arranged in quiz order and maps quiz index → sheet column index (row[idx + 1] logic in the code).

## Files of interest (details)
- appsScript.js
  - Contains doPost handler supporting actions:
    - getRoster, createForm, sendEmails, checkResponses, sendReminders, createPacket, sendPacket, sendSummary
  - Functions handle:
    - Form creation and destination spreadsheet linking
    - Email sending and reminder logic
    - Document packet creation with safe Drive sharing
- Parse Prerequisite JSON.js / Parse Quiz JSON.js / Parse Analysis.js
  - n8n Function-node-ready JavaScript code to sanitize LLM outputs and return strongly-typed JSON objects
  - They strip markdown fences and parse JSON that was returned by LLM nodes
- Calculate Per-Topic Accuracy.js
  - Aggregates student responses into per-topic totals/correct counts and computes accuracy percentages used for gap analysis
- PROMPT *.md
  - Carefully crafted LLM prompts (discover prerequisites, generate quiz, verify, gap analysis). These are authoritative prompts; copy them into your LLM node(s) or tune per institution policy.

## Security, permissions, and best practices
- Never commit production secrets or tokens to the repo. Use n8n credentials and environment variables to store API keys and tokens.
- The Apps Script uses Gmail/Drive/Sheets APIs — deploy using a Google Cloud Project and enforce least-privilege OAuth scopes.
- Use a long, random SECRET_TOKEN and validate it on every request. Consider moving to an authentication mechanism supported by Apps Script or using Cloud Functions with IAM for stricter control.
- For student email distribution, comply with institutional privacy rules (FERPA/GDPR as applicable).

## Troubleshooting & common pitfalls
- "Class-Rooster" sheet not found: Ensure the roster spreadsheet has a sheet/tab named exactly "Class-Rooster" or update `appsScript.js` to match your tab name.
- Incorrect column mapping in responses: Verify the form is created with the same question order as the `quiz` array. Responses mapping assumes Timestamp is column A and question answers begin at column B.
- LLM returns non-JSON content: Use the Parse * JS files (they strip fences) and ensure your LLM system prompt enforces JSON-only output.
- Permission errors when setting sharing on docs: DriveApp.setSharing can throw if organization policies prevent public sharing — handle via organization-approved sharing settings.

## Limitations
- Apps Script cannot programmatically set a Google Form's quiz correct-answer metadata in the same way Google Forms API does. The repo stores the answer key externally (in the form description or a linked sheet) and grades responses using the spreadsheet rows.
- Prompts are tuned for strict JSON. If an LLM drifts, the parse nodes may fail — add validation and a fallback/retry in n8n.

## Contributing
- Open an issue describing the change you'd like to make.
- Follow the repository structure when adding new nodes or scripts.
- Keep prompts versioned; when changing prompt logic, preserve the prior version and add a changelog entry.

## License
MIT License — see LICENSE (add as appropriate).

## Contact / Maintainer
- Repository owner: imafzalakram
- For questions about deployment or adapting prompts to your curriculum, open an issue or create a pull request.

---

## Try asking
- "Which specific sheet and column order does appsScript.js expect for the class roster and the form responses?"
- "Can you show an example n8n workflow JSON (or node names) that wires Parse Prerequisite JSON → Parse Quiz JSON → Create Form → Calculate Per-Topic Accuracy?"
- "What LLM temperature and token limits do you recommend when running PROMPT Generate Quiz.md to reduce malformed JSON output?"
