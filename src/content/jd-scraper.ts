import { getAtsConfig } from '../core/matcher/ats-patterns';
import { JobDescriptionAnalysis } from '../shared/types';

export function scrapeJobDescription(): JobDescriptionAnalysis {
  const hostname = window.location.hostname;
  const atsConfig = getAtsConfig(hostname);

  let jdText = '';
  let jobTitle = document.title;
  let companyName = '';

  // 1. Try ATS specific container
  if (atsConfig?.jdContainer) {
    const el = document.querySelector(atsConfig.jdContainer);
    if (el && el.textContent && el.textContent.trim().length > 100) {
      jdText = el.textContent || '';
    }
  }

  // 2. Generic ATS container selectors (Zoho Recruit, Workday, Greenhouse, Lever, etc.)
  if (!jdText || jdText.length < 200) {
    const commonSelectors = [
      '.cw-jobdescription',
      '#career-website-main',
      '.cw-jobdetails-container',
      '.job-description',
      '.job-details',
      '[data-automation-id="jobPostingDescription"]',
      '.jobs-description__content',
      'main',
      'article',
      '[role="main"]',
    ];
    for (const sel of commonSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 200) {
        jdText = el.textContent.trim();
        break;
      }
    }
  }

  // 3. Fallback: scan divs with high text density
  if (!jdText || jdText.length < 200) {
    const candidates = Array.from(document.querySelectorAll('div, section')).filter(
      el => el.textContent && el.textContent.length > 500 && el.children.length > 2
    );
    if (candidates.length > 0) {
      // Pick the first candidate with keywords like "requirements" or "responsibilities"
      const matched = candidates.find(c => {
        const text = (c.textContent || '').toLowerCase();
        return text.includes('requirement') || text.includes('responsibilit') || text.includes('qualifications');
      });
      jdText = (matched || candidates[0]).textContent || '';
    }
  }

  // Clean and condense JD text
  jdText = jdText.replace(/\s+/g, ' ').trim();

  // Extract Heading 1 as title candidate
  const h1 = document.querySelector('h1, .cw-jobtitle h1, .cw-jobtitle h2, .cw-job-title');
  if (h1 && h1.textContent) {
    jobTitle = h1.textContent.trim();
  }

  // Extract Company Name if available
  const companyEl = document.querySelector('[data-company-name], .company-name, .posting-headline h2, [data-company], .cw-company-name, [data-zcqa="company_name"]');
  if (companyEl && companyEl.textContent) {
    companyName = companyEl.textContent.trim();
  } else {
    // Check sibling of h1 (e.g. HuntingCube, modern job portals)
    const h1El = document.querySelector('h1');
    if (h1El) {
      const sib = h1El.nextElementSibling;
      if (sib && sib.textContent && sib.textContent.trim().length > 0 && sib.textContent.trim().length < 50) {
        companyName = sib.textContent.trim();
      }
    }
    if (!companyName) {
      // Infer from title: handles "Company - Title in Location" or "Title | Company"
      const parts = document.title.split(/[-|–•]/);
      if (parts.length > 1) {
        const first = parts[0].trim();
        const last = parts[parts.length - 1].trim();
        if (/ltd|inc|technologies|corp|tech|company|llc|labs/i.test(first) || first.length < last.length) {
          companyName = first;
        } else {
          companyName = last;
        }
      }
    }
  }

  return {
    companyName: companyName || 'Company',
    jobTitle: jobTitle || 'Target Role',
    requiredSkills: [],
    preferredSkills: [],
    summary: jdText.slice(0, 300),
    rawText: jdText.slice(0, 8000),
  };
}

