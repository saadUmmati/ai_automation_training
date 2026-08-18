SECURITY AND PRIVACY

- Secrets & Keys
  - Do not store secrets in the repository. Use n8n credentials or environment variables.
  - Use a long, random SECRET_TOKEN for Apps Script requests. Rotate periodically.

- OAuth Scopes
  - Limit Apps Script OAuth scopes to only what is required (Drive, Sheets, Forms, Gmail). Use a dedicated service account or organizational account where possible.

- Student Data
  - Comply with institutional policies (FERPA/GDPR). Only send required information via email and avoid placing sensitive identifiers in public documents.

- Sharing & Permissions
  - Avoid setting documents to "anyone with link" in production unless institutionally approved. Use domain-restricted sharing if available.
