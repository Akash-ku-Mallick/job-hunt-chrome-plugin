# 🏪 Chrome Web Store Publishing Guide — JobHunt AI AutoFiller

> **Single Source of Truth for Chrome Developer Dashboard Submission**  
> **Last Updated:** 2026-11-11  
> **Extension Version:** 1.0.0

---

## 1. Store Listing Metadata

### Extension Name
`JobHunt AI AutoFiller — Smart Application Assistant`

### Summary (132 characters max)
`Autofill job applications in seconds. Understands job descriptions and generates tailored answers using ultra-fast Groq AI.`

### Category
`Productivity` / `Workflow & Planning`

### Language
`English`

---

## 2. Detailed Store Description

```markdown
Tired of re-typing your resume details, work history, and answering the same essay questions on every single job application?

JobHunt AI AutoFiller is your intelligent career co-pilot that turns 20-minute application forms into effortless 1-click fills. Powered by ultra-fast Groq LPU inference, JobHunt AI reads the Job Description (JD) on your active tab and tailors your application answers directly to the company's tech stack and mission.

━━━━━━━━━━━━━━━━━━━━
✨ KEY FEATURES
━━━━━━━━━━━━━━━━━━━━

⚡ Ultra-Fast AI Answers:
Generate customized answers to essay questions like "Why do you want to join our team?" and "Describe your experience with distributed systems" in under 1 second.

📄 Auto-populate from Resume:
Paste your raw resume text once and click "Parse with AI" to automatically extract your full name, email, phone, LinkedIn, GitHub, skills, and work history.

🎯 Deep ATS Compatibility:
Seamlessly works on Greenhouse, Lever, Ashby, Workday, LinkedIn Easy Apply, and Indeed. Dispatches native events so modern reactive forms (React, Vue, Angular) never wipe your inputs.

🛡️ Privacy-First & Sandboxed:
Your resume, personal data, and Groq API key are stored strictly on your local device. We do not run middleman proxy servers, collect telemetry, or sell candidate data.

📋 EEO / Survey Auto-Decline:
Optionally auto-select "Decline to self-identify" on demographic surveys (Race, Veteran, Disability) to speed through non-evaluative questions.

🔄 Backup & Switch Profiles:
Export and import profile JSON files with one click to easily swap between specialized resumes (e.g. Frontend vs Backend).

━━━━━━━━━━━━━━━━━━━━
🚀 HOW TO USE
━━━━━━━━━━━━━━━━━━━━

1. Open the JobHunt AI Side Panel from your toolbar.
2. Add your free Groq API key and paste your resume in the "My Profile" tab.
3. Navigate to any job application page (e.g. Greenhouse or Lever).
4. Click "Analyze Page & JD" to detect form fields and review suggested answers.
5. Click "Autofill Form" to instantly populate the application.
6. Review the answers and submit!

━━━━━━━━━━━━━━━━━━━━
🔒 PRIVACY & SECURITY
━━━━━━━━━━━━━━━━━━━━

• Zero middleman servers: Requests travel directly from your browser to Groq's official API.
• Local storage only: All profile data lives sandboxed in your browser's local storage.
• You maintain control: The extension autofills fields and highlights them for review; you always click the final Submit button.
```

---

## 3. Permissions Justification (Plain English)

| Permission | Justification for Chrome Web Store Review Team |
| :--- | :--- |
| **`sidePanel`** | Provides a side-by-side workspace next to the active job application, allowing candidates to review and adjust tailored answers without obstructing the webpage. |
| **`storage`** | Stores the candidate's master profile, resume text, application settings, and encrypted Groq API key locally in the browser sandbox. |
| **`activeTab`** | Enables the extension to read the job description container and detect form inputs on the current page only when the user explicitly clicks "Analyze Page". |
| **`tabs`** | Used to detect navigation between multi-step application pages and query the active tab's URL to verify ATS portal compatibility. |
| **`identity`** | Powers the optional 1-click Google Sign-In feature allowing users to connect their Google profile and auto-populate their name and email. |

---

## 4. Host Permissions Justification

| Host Pattern | Justification for Chrome Web Store Review Team |
| :--- | :--- |
| `https://api.groq.com/*` | Required to send the job description and candidate resume to Groq's official cloud AI inference endpoint for sub-second answer generation. |
| `https://www.googleapis.com/*` | Required to retrieve the authenticated candidate's name, email, and avatar when using Google Sign-In. |
| `https://accounts.google.com/*` | Required to revoke OAuth tokens when the candidate signs out of their Google account. |
| `https://*.greenhouse.io/*`<br>`https://*.lever.co/*`<br>`https://*.ashbyhq.com/*`<br>`https://*.myworkdayjobs.com/*`<br>`https://*.linkedin.com/*`<br>`https://*.indeed.com/*` | Required to inject content scripts that detect application textboxes, selects, and radio buttons, and populate them with the candidate's verified data. |

---

## 5. Single Purpose Statement

> **Single Purpose:** "Autofill and streamline job application forms on Applicant Tracking Systems using contextual AI analysis of the job description and candidate resume."

---

## 6. Privacy & Data Use Disclosure

* **Does this extension collect user data?**  
  Yes, the user enters personal contact information (name, email, phone) and resume text.
* **Where is the data stored?**  
  Strictly locally inside Chrome's `chrome.storage.local` sandbox.
* **Is data transferred to third parties?**  
  Only to the official Groq API (`https://api.groq.com/`) for AI text inference upon the user's explicit command.
* **Is data sold or used for marketing?**  
  **No.** Data is never sold, transferred to brokers, or used for creditworthiness/marketing.

---

## 7. Version History

* **v1.0.0 (2026-11-11):**
  * Initial production-ready release.
  * Side panel interface with Profile, Review, and Settings tabs.
  * Ultra-fast Groq LPU inference with automatic model fallback (`openai/gpt-oss-120b` / `openai/gpt-oss-20b` / `qwen/qwen3.8-27b`).
  * 1-Click AI Resume parsing.
  * Multi-ATS support (Greenhouse, Lever, Ashby, Workday, LinkedIn, Indeed).
  * React framework-safe prototype setter injection and synthetic event dispatching.
  * Native Google Sign-In via `chrome.identity.launchWebAuthFlow`.
  * EEO survey auto-decline and JSON profile backup/restore.

