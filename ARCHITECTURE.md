# 🏛️ Technical Architecture — JobHunt AI AutoFiller

> **Deep-Dive Technical Specification & System Design**  
> **Extension Standard:** Manifest V3 (MV3)  
> **AI Acceleration:** Groq API Cloud LPU (REST Endpoint)  
> **UI Paradigm:** Chrome Native Side Panel (`chrome.sidePanel`)

---

## 1. High-Level Architecture

The extension follows a decoupled, message-driven architecture across four execution contexts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              BROWSER TAB                               │
│                                                                        │
│  ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│  │   Page DOM (Job Page)   │ ◄──────► │       Content Script        │  │
│  │   • Job Description     │          │   • jd-scraper.ts           │  │
│  │   • Form Controls       │          │   • form-detector.ts        │  │
│  │   • Custom Essay Qs     │          │   • dom-injector.ts         │  │
│  └─────────────────────────┘          └──────────────┬──────────────┘  │
└──────────────────────────────────────────────────────┼─────────────────┘
                                                       │
                          chrome.runtime.sendMessage / │ chrome.tabs.sendMessage
                                                       │
┌──────────────────────────────────────────────────────┼─────────────────┐
│                      CHROME EXTENSION RUNTIME        │                 │
│                                                      ▼                 │
│  ┌─────────────────────────┐          ┌─────────────────────────────┐  │
│  │     Side Panel UI       │ ◄──────► │  Background Service Worker  │  │
│  │   • Profile Editor      │          │   • Groq API Gateway        │  │
│  │   • JD Analyzer         │          │   • Model Router            │  │
│  │   • Field Preview Table │          │   • Storage Coordinator     │  │
│  └────────────┬────────────┘          └──────────────┬──────────────┘  │
│               │                                      │                 │
│               ▼                                      ▼                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Sandboxed chrome.storage.local                   │  │
│  │   • User Profile & Resume  • Settings & Groq Key  • History Log  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┬─────────────────┘
                                                       │ HTTPS (Bearer Token)
                                                       ▼
                                        ┌─────────────────────────────┐
                                        │    Groq AI Cloud (LPU)      │
                                        │  llama-3.3-70b-versatile    │
                                        │  llama-3.1-8b-instant       │
                                        └─────────────────────────────┘
```

---

## 2. Execution Contexts & Boundary Isolation

| Context | Lifetime | Access to DOM? | Access to `chrome.*` APIs? | Primary Duties |
| :--- | :--- | :--- | :--- | :--- |
| **Content Script** | Bound to active tab page lifecycle | **Yes** (Isolated DOM world) | Limited (`runtime.sendMessage`, `storage`) | Extracts JD text, scans form inputs, executes synthetic field injection. |
| **Side Panel** | Open when user interacts with panel | **No** (Direct DOM is inaccessible) | Full Extension APIs | Main user interface, reviews generated answers, edits user profile, triggers fill. |
| **Service Worker** | Ephemeral (~30s inactivity) | **No** | Full Extension APIs | Executes Groq API fetch requests, manages auth headers, coordinates background tasks. |
| **Storage Engine** | Persistent across browser sessions | **No** | `chrome.storage.local` | Stores candidate resume, settings, and cached JD analyses locally. |

---

## 3. DOM Extraction & Form Detection Engine

### 3.1 Job Description (JD) Extraction Pipeline
Modern career sites structure JDs inside specific container landmarks. The extractor uses a fallback cascade:
1. **ATS Landmark Queries:**
   - Greenhouse: `#content`, `.job-description`, `#app-body`
   - Lever: `.section-page`, `.posting-headline`, `.posting-requirements`
   - Ashby: `[data-testid="job-description"]`, `.ashby-job-posting-description`
   - Workday: `[data-automation-id="jobPostingDescription"]`
   - LinkedIn: `.jobs-description__content`, `.jobs-box__html-content`
2. **Heuristic Content Scoring:**
   - If no landmark matches, query all `article`, `main`, or `div` nodes with text density > 500 characters containing keywords like `"Responsibilities"`, `"Requirements"`, `"Qualifications"`, `"About the role"`.
3. **HTML Sanitization & Minification:**
   - Strips `<script>`, `<style>`, `<svg>`, comments, and excess whitespace to preserve token budget before sending to Groq.

### 3.2 Form Field Detection & Semantic Classifier
The detector inspects all interactive input elements:
- `input[type="text"]`, `input[type="email"]`, `input[type="tel"]`, `input[type="url"]`
- `textarea`
- `select`
- `input[type="radio"]`, `input[type="checkbox"]`

#### Label Resolution Cascade
For every input, the system resolves its human-readable label in priority order:
1. Explicit `<label for="inputId">` association.
2. Direct wrapping parent `<label>`.
3. `aria-label` or `aria-labelledby` element text.
4. `placeholder` attribute.
5. Immediate preceding sibling text node or parent header element.

#### Semantic Field Classification Taxonomy
Fields are categorized into deterministic types:
```typescript
export type FieldCategory =
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'FULL_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'LOCATION'
  | 'LINKEDIN_URL'
  | 'GITHUB_URL'
  | 'PORTFOLIO_URL'
  | 'WORK_AUTHORIZATION'
  | 'VISA_SPONSORSHIP'
  | 'SALARY_EXPECTATION'
  | 'NOTICE_PERIOD'
  | 'EXPERIENCE_YEARS'
  | 'CUSTOM_ESSAY'      // Routed to Groq for custom text generation
  | 'UNKNOWN';
```

---

## 4. Reactive Framework-Safe Value Injection

Modern reactive frameworks (React 16+, Vue, Angular, Svelte) maintain internal virtual DOM state. Direct assignment (`element.value = "val"`) fails because internal state trackers do not receive native event dispatches.

### 4.1 React Value Tracker Bypass
To ensure React registers the change, we invoke the native prototype setter before dispatching events:

```typescript
export function injectInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  // Focus the element first
  element.focus();

  // Retrieve native property setter from prototype chain
  const prototype = element instanceof HTMLInputElement 
    ? window.HTMLInputElement.prototype 
    : window.HTMLTextAreaElement.prototype;
    
  const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  
  if (nativeValueSetter) {
    nativeValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Clear React 16+ internal value tracker if present
  const tracker = (element as any)._valueTracker;
  if (tracker) {
    tracker.setValue(value);
  }

  // Dispatch standard bubble events
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

  // Visual confirmation styling
  highlightElement(element);
}
```

### 4.2 Dropdown / Select Injection
For native `<select>` tags:
1. Scan `<option>` nodes for exact or fuzzy text matches.
2. Set `select.selectedIndex` and dispatch `change` event.
For custom React/Radix dropdowns:
- Simulate `click` on trigger, search for rendered portal option matching target text, and simulate `click` on option.

---

## 5. Groq AI Inference Engine

### 5.1 Model Selection Strategy
Groq's LPU provides token-generation speeds surpassing 400+ tokens/second. We deploy two models based on task complexity:

| Task | Target Model | Max Tokens | Temperature | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **JD Parsing & Skills Extraction** | `llama-3.1-8b-instant` | 512 | 0.1 | Speed & deterministic JSON output |
| **Field Classification** | `llama-3.1-8b-instant` | 256 | 0.0 | High-speed mapping |
| **Essay / Custom Q&A Generation** | `llama-3.3-70b-versatile` | 1024 | 0.4 | Superior reasoning, nuance, tone matching |

### 5.2 Groq Request Pipeline (via Background Service Worker)
All external API requests to Groq are channeled through `src/background/service-worker.ts` to prevent CORS issues in content scripts and protect request headers:

```
[Side Panel] ─── sendMessage({ type: 'GENERATE_ANSWER', payload }) ───► [Service Worker]
                                                                                │
                                                                   fetch('https://api.groq.com/...')
                                                                                │
[Side Panel] ◄─── sendResponse({ answer: '...' }) ─────────────────────────────┘
```

### 5.3 System Prompt Blueprint for Essay Questions
```
SYSTEM PROMPT:
You are an expert career advisor representing a qualified job applicant.
Your task is to write a concise, compelling, and truthful response to a job application question.

RULES:
1. Base your answer strictly on the CANDIDATE PROFILE and RESUME provided below.
2. Tailor keywords, tone, and technical alignment to the JOB DESCRIPTION provided.
3. NEVER fabricate projects, companies, certifications, or degrees not mentioned in the candidate data.
4. Keep answers professional, confident, and appropriately concise (1-2 paragraphs unless specifically asked for a detailed breakdown).
5. Output ONLY the raw answer text. Do not include quotes, greetings, or conversational meta-commentary.
```

---

## 6. Storage & State Management

All state is stored within `chrome.storage.local`:

```
chrome.storage.local
├── profile: UserProfile
│   ├── personal: PersonalInfo
│   ├── workAuthorization: WorkAuth
│   ├── skills: string[]
│   ├── resumeText: string
│   └── customQAOverrides: Record<string, string>
├── settings: ExtensionSettings
│   ├── groqApiKey: string
│   ├── preferredModel: string
│   └── autoDetectFields: boolean
└── sessionCache: Record<urlKey, JDCache>
```

---

## 7. Security, Privacy & Extension CSP

1. **Manifest V3 Strict CSP:**
   ```json
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self'"
   }
   ```
2. **Direct-to-Groq Communications:**
   - Groq API calls use HTTPS with `Authorization: Bearer <GROQ_API_KEY>`.
   - Host permissions in `manifest.json` are restricted to `https://api.groq.com/*` and active career platforms.
3. **No External Script Loading:**
   - Zero remote script tags (`<script src="https://...">`). All JavaScript is bundled inside the extension package.

