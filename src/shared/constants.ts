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
