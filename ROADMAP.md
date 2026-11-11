# 🗺️ Product & Engineering Roadmap — JobHunt AI AutoFiller

This roadmap outlines the phased development from initial scaffold to production Chrome Web Store release.

---

## 📍 Phase 1: Project Scaffolding & Manifest Setup (COMPLETED ✅)
- [x] Initialize repository with TypeScript, Vite, and build configuration.
- [x] Define `manifest.json` (Manifest V3):
  - [x] Permissions: `storage`, `sidePanel`, `tabs`, `activeTab`, `identity`.
  - [x] Host permissions: `https://api.groq.com/*` and scoped ATS domains.
  - [x] Background service worker configuration.
  - [x] Content script injection patterns for career portals.
- [x] Configure Tailwind CSS & modern styling for Side Panel UI.
- [x] Create valid extension icons (16px, 32px, 48px, 128px PNGs).

---

## 📍 Phase 2: Core Storage & Groq AI Engine (COMPLETED ✅)
- [x] Implement `src/core/profile/storage.ts`:
  - [x] Save, load, and validate `UserProfile`.
  - [x] Storage quota monitoring (`chrome.storage.local.getBytesInUse`).
  - [x] Store encrypted/local `groqApiKey` and user settings.
- [x] Implement `src/core/ai/groq-client.ts`:
  - [x] Official Groq completions API endpoint (`https://api.groq.com/openai/v1/chat/completions`).
  - [x] Model fallback resilience (`llama-3.3-70b-versatile` ➔ `llama-3.1-70b-versatile`).
  - [x] JSON extraction mode support.
  - [x] Error handling: invalid API key (HTTP 401), rate limits (HTTP 429).
- [x] Implement prompt templates in `src/core/ai/prompts.ts`:
  - [x] JD summarizer & key skills extractor.
  - [x] Custom question responder with resume alignment & tone tuning.
  - [x] 1-Click AI Resume parser prompt.

---

## 📍 Phase 3: DOM Scraper & Field Detection (COMPLETED ✅)
- [x] Implement `src/content/jd-scraper.ts`:
  - [x] Specific selectors for Greenhouse (`#content`), Lever (`.posting-headline`), Ashby (`[data-testid="job-description"]`), Workday, LinkedIn.
  - [x] Fallback heuristic scraper with text-density scoring.
  - [x] Minification and boilerplate cleanup.
- [x] Implement `src/content/form-detector.ts`:
  - [x] Input element discovery (`input`, `textarea`, `select`, `radio`, `checkbox`).
  - [x] Label resolver cascade (`<label for>`, wrapping `<label>`, `aria-label`, `placeholder`, preceding siblings).
  - [x] Heuristic field classifier (`FIRST_NAME`, `EMAIL`, `LINKEDIN_URL`, `CUSTOM_ESSAY`, `EEO_DEMOGRAPHIC`).

---

## 📍 Phase 4: Side Panel Control Center (UI/UX) (COMPLETED ✅)
- [x] Design Side Panel layout (`src/sidepanel/`):
  - [x] **Tab 1: Fill & Review** (Analyze page, live JD summary, field preview with inline edit, custom essay tone selector, autofill button).
  - [x] **Tab 2: My Profile** (Personal details, URLs, work authorization, raw resume text, AI resume parser, JSON export/import).
  - [x] **Tab 3: Settings & Auth** (Groq API Key, model picker, EEO auto-decline toggle, Google 1-click Sign-In with live redirect URI copy helper).
- [x] Bi-directional message passing between Side Panel, Service Worker, and Content Script.

---

## 📍 Phase 5: Framework-Aware Form Autofiller (COMPLETED ✅)
- [x] Implement `src/content/dom-injector.ts`:
  - [x] Native prototype setter dispatch bypassing React 16+ `_valueTracker`.
  - [x] Synthetic bubbling event sequence: `focus` ➔ `input` ➔ `change` ➔ `blur`.
  - [x] Radio button groups (matching affirmative "Yes" / "No").
  - [x] Checkbox toggler.
  - [x] Dropdown `<select>` fuzzy/exact option matching.
  - [x] Green outline pulse highlight on successfully populated fields.

---

## 📍 Phase 6: Testing, Hardening & Chrome Web Store Prep (COMPLETED ✅)
- [x] Automated test suite configured with Vitest (**18/18 unit tests passing**).
- [x] Strict TypeScript typechecking with 0 errors (`npm run typecheck`).
- [x] Native Google Sign-In with `chrome.identity.launchWebAuthFlow`.
- [x] Release packaging automation (`npm run package` producing `release/jobhunt-ai-v1.0.0.zip`).
- [x] Created `CHROMEWEBSTORE.md` with permissions justifications and store listing copy.
