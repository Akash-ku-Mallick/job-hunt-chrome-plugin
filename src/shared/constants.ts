export const GROQ_MODELS = {
  // Official Production Developer Plan Models (Publicly Available)
  DEV_ESSAY_PRIMARY: 'openai/gpt-oss-120b',      // 500 t/s, 131k context, flagship reasoning
  DEV_FAST_EXTRACT: 'openai/gpt-oss-20b',        // 1000 t/s, 131k context, ultra-fast extraction
  DEV_QWEN: 'qwen/qwen3.8-27b',                 // 450 t/s, 131k context

  // Enterprise Tier Models (ContactSales)
  ENTERPRISE_LLAMA_70B: 'llama-3.3-70b-versatile',
  ENTERPRISE_LLAMA_8B: 'llama-3.1-8b-instant',
} as const;

export const DEFAULT_MODEL = GROQ_MODELS.DEV_ESSAY_PRIMARY;

export const FALLBACK_MODELS = [
  GROQ_MODELS.DEV_ESSAY_PRIMARY,
  GROQ_MODELS.DEV_FAST_EXTRACT,
  GROQ_MODELS.DEV_QWEN,
  GROQ_MODELS.ENTERPRISE_LLAMA_70B,
];

export const STORAGE_KEYS = {
  PROFILE: 'profile',
  SETTINGS: 'settings',
  LAST_ANALYSIS: 'last_analysis',
  AUTH_USER: 'auth_user',
} as const;

export const GOOGLE_OAUTH = {
  USER_INFO_ENDPOINT: 'https://www.googleapis.com/oauth2/v3/userinfo',
  REVOKE_ENDPOINT: 'https://accounts.google.com/o/oauth2/revoke',
} as const;

export const ATS_DOMAINS = [
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'myworkdayjobs.com',
  'linkedin.com',
  'indeed.com',
] as const;

export const FEEDBACK_FORM_URL = 'https://forms.gle/s619nBrHQmmfwhhd8';
export const GOOGLE_FORM_FULL_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSca_iRR7PG_ktB9JXoh7ViJMTcgxuF7B63o2Ek7DfXReK5fCA/viewform?usp=pp_url';

export const FORM_ENTRY_IDS = {
  RATING: 'entry.1077676075',
  PORTAL: 'entry.1486671930',
  HIGHLIGHTS: 'entry.1552338063',
  ISSUES: 'entry.376855699',
  FEATURE_REQUEST: 'entry.1848135271',
  EMAIL: 'entry.363760863',
} as const;

export function buildFeedbackUrl(options?: {
  portal?: string;
  rating?: string;
  notes?: string;
}): string {
  if (!options) return FEEDBACK_FORM_URL;

  const params = new URLSearchParams();
  if (options.portal) {
    // Map domain to form option
    const p = options.portal.toLowerCase();
    if (p.includes('greenhouse')) {
      params.set(FORM_ENTRY_IDS.PORTAL, 'Greenhouse (boards.greenhouse.io)');
    } else if (p.includes('lever')) {
      params.set(FORM_ENTRY_IDS.PORTAL, 'Lever (jobs.lever.co)');
    } else if (p.includes('ashby')) {
      params.set(FORM_ENTRY_IDS.PORTAL, 'Ashby (jobs.ashbyhq.com)');
    } else if (p.includes('workday') || p.includes('myworkdayjobs')) {
      params.set(FORM_ENTRY_IDS.PORTAL, 'Workday (myworkdayjobs.com)');
    } else if (p.includes('linkedin') || p.includes('indeed')) {
      params.set(FORM_ENTRY_IDS.PORTAL, 'LinkedIn / Indeed');
    }
  }

  if (options.rating) {
    params.set(FORM_ENTRY_IDS.RATING, options.rating);
  }

  if (options.notes) {
    params.set(FORM_ENTRY_IDS.ISSUES, options.notes);
  }

  const query = params.toString();
  return query ? `${GOOGLE_FORM_FULL_BASE_URL}&${query}` : FEEDBACK_FORM_URL;
}
