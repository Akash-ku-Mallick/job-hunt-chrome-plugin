export interface AtsSelectorConfig {
  name: string;
  hostPattern: string;
  jdContainer: string;
  formContainer: string;
}

export const ATS_CONFIGS: AtsSelectorConfig[] = [
  {
    name: 'Greenhouse',
    hostPattern: 'greenhouse.io',
    jdContainer: '#content, .job-description, #app-body',
    formContainer: '#application_form, form#application',
  },
  {
    name: 'Lever',
    hostPattern: 'lever.co',
    jdContainer: '.section-page, .posting-headline, .posting-requirements',
    formContainer: '.application-form, form#application-form',
  },
  {
    name: 'Ashby',
    hostPattern: 'ashbyhq.com',
    jdContainer: '[data-testid="job-description"], .ashby-job-posting-description',
    formContainer: '[data-testid="application-form"], form',
  },
  {
    name: 'Workday',
    hostPattern: 'myworkdayjobs.com',
    jdContainer: '[data-automation-id="jobPostingDescription"]',
    formContainer: '[data-automation-id="application-form"], form',
  },
  {
    name: 'LinkedIn',
    hostPattern: 'linkedin.com',
    jdContainer: '.jobs-description__content, .jobs-box__html-content',
    formContainer: '.jobs-easy-apply-modal, .jobs-apply-form',
  },
  {
    name: 'HuntingCube',
    hostPattern: 'huntingcube.ai',
    jdContainer: 'main, article, .apply-card, div',
    formContainer: '#apply-form, form.apply-card, form',
  },
  {
    name: 'BambooHR',
    hostPattern: 'bamboohr.com',
    jdContainer: 'main, article, div',
    formContainer: 'form, .MuiFormControl-root',
  },
  {
    name: 'Zoho Recruit',
    hostPattern: 'zohorecruit.com',
    jdContainer: '.cw-jobdescription, #career-website-main, .cw-jobdetails-container',
    formContainer: 'rec-form-component, portal-manual-apply, form',
  },
];

export function getAtsConfig(hostname: string): AtsSelectorConfig | undefined {
  const matched = ATS_CONFIGS.find(cfg => hostname.includes(cfg.hostPattern));
  if (matched) return matched;

  // Generic DOM-based detection for white-labeled ATS portals (e.g. Zoho Recruit on custom subdomains)
  if (typeof document !== 'undefined') {
    if (document.querySelector('rec-form-component, portal-manual-apply, .cw-jobdescription, #career-website-main, career-website-detail')) {
      return ATS_CONFIGS.find(cfg => cfg.name === 'Zoho Recruit');
    }
  }

  return undefined;
}

