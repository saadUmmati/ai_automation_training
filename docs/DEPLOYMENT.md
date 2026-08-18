DEPLOYMENT GUIDE

1) Google Apps Script (appsScript.js)
- Create new Apps Script project, paste the contents of appsScript.js from this repo.
- Update constants: ROSTER_SHEET_ID, CONFIG_SHEET_ID (optional), SECRET_TOKEN.
- In the Apps Script manifest (appsscript.json) ensure required OAuth scopes for Sheets, Drive, Forms, Gmail.
- Deploy -> New deployment -> Web app. Choose executing user and who has access. Capture the Web App URL and use it in n8n HTTP Request nodes.

2) n8n setup
- Import `n8n/workflow-example.json` as a starting point.
- Create credentials for OpenAI and Google (if using Google nodes).
- Replace placeholder prompt contents with files under PROMPT*.md and function node contents with corresponding Parse *.js files.

3) Testing
- Use Postman or n8n HTTP Request to call the Apps Script endpoint with your SECRET_TOKEN and action=getRoster to verify roster access.
- Run the workflow end-to-end in a sandbox course to verify form creation and response parsing.
