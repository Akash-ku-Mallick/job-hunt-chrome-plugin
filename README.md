# ⚡ JobHunt AI AutoFiller (Chrome Extension)

> **Next-generation, privacy-first Chrome Extension that understands Job Descriptions and autofills job applications in sub-second latency using the Groq API (LLaMA 3.3 / 3.1).**

---

## 🎯 Overview

Applying for jobs across modern Applicant Tracking Systems (ATS) like **Greenhouse, Lever, Ashby, and Workday** is slow, tedious, and repetitive. Candidates often have to re-enter their basic information, work history, and write customized answers to essay prompts like:
* *"Why do you want to join our engineering team?"*
* *"Describe a challenging technical problem you solved using Distributed Systems."*
* *"What is your expected salary and notice period?"*

**JobHunt AI AutoFiller** solves this by combining **deep DOM inspection** with **Groq's ultra-low latency LPU AI inference**:
1. It automatically extracts the **Job Description (JD)** from the active tab.
2. It analyzes the role requirements, required skills, and company mission.
3. It maps the application form fields (inputs, textareas, dropdowns, radios).
4. It crafts tailored, high-converting answers based on **your real resume and profile**.
5. It safely injects values into the page with full compatibility for modern reactive frameworks (**React, Vue, Angular, Formik**).

---

## ✨ Key Features

* 🚀 **Sub-Second AI Generation with Groq:** Uses Groq's high-throughput LPU engine running `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` to generate responses in under 800ms.
* 🧠 **JD-Contextual Understanding:** Automatically reads the JD on the current page to tailor answers directly to the company's tech stack and culture.
* 🛡️ **100% Private & Local:** Your resume data, profile details, and Groq API key are stored strictly on your machine in `chrome.storage.local`. No external proxy servers, no telemetry, zero data selling.
* 🖥️ **Non-Intrusive Side Panel:** Operates inside Chrome's native Side Panel so you can review detected fields and generated answers alongside the live application.
* ⚡ **Reactive Framework Safe:** Dispatches native property setters and synthetic `input`, `change`, and `blur` events so React, Angular, and Vue forms never wipe your fields or fail validation.
* 👤 **Customizable Profile & Override Bank:** Save your personal info, work history, skills, links (LinkedIn, GitHub, Portfolio), and preset answers for common screening questions.
* 👁️ **Human-in-the-Loop:** Automatically fills fields and highlights them for quick review. You maintain full control over the final submit button.

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                       Chrome Browser                        │
│                                                             │
│   ┌─────────────────────────┐   ┌────────────────────────┐  │
│   │   Target Job Portal     │   │  Extension Side Panel  │  │
│   │   (Greenhouse / Lever)  │   │     (Control Hub)      │  │
│   │                         │   │                        │  │
│   │  [JD Container]         │   │  • Candidate Profile   │  │
│   │  [Form Inputs]          │   │  • JD Summary & Skills │  │
│   │  [Custom Questions]     │   │  • Field Preview Table │  │
│   └────────────┬────────────┘   │  • [⚡ Autofill Now]   │  │
│                │                └───────────┬────────────┘  │
│          DOM Scraper &                      │               │
│          Event Injector              Message Passing        │
│                │                            │               │
│   ┌────────────▼────────────────────────────▼────────────┐  │
│   │               Background Service Worker              │  │
│   │             (Groq API Gateway & Storage)             │  │
│   └──────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS (Secure Request)
                               ▼
                   ┌───────────────────────┐
                   │       Groq API        │
                   │  (Cloud LPU Engine)   │
                   └───────────────────────┘
```

---

## 📋 Supported ATS & Platforms

| Platform | URL Pattern | Level of Support |
| :--- | :--- | :--- |
| **Greenhouse** | `boards.greenhouse.io/*` | Full (Inputs, Custom Textareas, Dropdowns) |
| **Lever** | `jobs.lever.co/*` | Full (Standard fields, Custom questions) |
| **Ashby** | `jobs.ashbyhq.com/*` | Full (Multi-step forms, Dynamic fields) |
| **Workday** | `*.myworkdayjobs.com/*` | Beta (React/Angular input injection) |
| **LinkedIn Easy Apply** | `linkedin.com/jobs/*` | Beta (Modal field detection) |
| **Generic Career Pages**| Any web form | Heuristic label matching + AI classification |

---

## 🚀 Getting Started

### Prerequisites
* **Google Chrome** (v114+ for Side Panel support) or any Chromium browser (Brave, Edge).
* **Node.js** (v18.0+) & **npm** / **pnpm**.
* A free or paid **Groq API Key** (obtainable at [console.groq.com](https://console.groq.com)).

### 1. Installation & Build

```bash
# 1. Clone repository
git clone https://github.com/your-username/job-hunt-chrome-plugin.git
cd job-hunt-chrome-plugin

# 2. Install dependencies
npm install

# 3. Build for development (watch mode)
npm run dev

# Or build for production
npm run build
```

### 2. Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the generated `dist/` folder from this repository.
5. Pin the **JobHunt AI AutoFiller** extension to your toolbar.

---

## ⚙️ Configuration & Setup

1. **Open the Side Panel:** Click the extension icon in your Chrome toolbar to open the side panel.
2. **Configure Settings:**
   * Enter your **Groq API Key**.
   * Choose your preferred model:
     * `llama-3.3-70b-versatile` (Recommended for high-quality nuanced answers).
     * `llama-3.1-8b-instant` (Fastest, ideal for short-form inputs).
3. **Fill Your Master Profile:**
   * Personal details (Full Name, Email, Phone, Location, Portfolio/LinkedIn/GitHub URLs).
   * Work authorization & visa sponsorship status.
   * Paste your **Resume text** or key career achievements.
   * Add any standard custom Q&A answers (e.g., Notice period, Salary expectations).

---

## 🖱️ How to Use

1. Navigate to any supported job application page (e.g., a Greenhouse or Lever listing).
2. Open the **JobHunt AI** Side Panel.
3. Click **"Analyze Page & JD"**:
   * The extension reads the job requirements, company name, and highlights matching keywords.
   * It scans the form for interactive input fields.
4. Review the detected fields in the Side Panel:
   * Standard fields (Name, Email, Links) populate directly from your profile.
   * Custom questions have AI answers generated based on the JD + your resume.
5. Click **"⚡ Autofill Fields"**:
   * All fields are populated instantly and highlighted in light green on the page.
6. Review the form, adjust any responses if needed, and hit **Submit** yourself!

---

## 🔒 Security & Privacy First

We believe career and personal data must remain confidential:
* **Zero Backend Servers:** The extension communicates directly between your browser and Groq's official API (`api.groq.com`).
* **Local Storage Only:** All profile data and API keys live inside Chrome's sandboxed `chrome.storage.local`.
* **No Telemetry or Tracking:** No analytics libraries, no tracking pixels, no telemetry pings.
* **Open Source Codebase:** Fully auditable code for complete transparency.

---

## 🛠️ Tech Stack

* **Extension Architecture:** Manifest V3 (MV3)
* **Frontend UI:** Side Panel with TypeScript & Tailwind CSS
* **Build System:** Vite + `@crxjs/vite-plugin`
* **AI Engine:** Groq Cloud API (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`)
* **DOM Engine:** Custom Synthetic Event Dispatcher & Heuristic Label Matcher

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

