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
    if (el) {
      jdText = el.textContent || '';
    }
  }

  // 2. Fallback heuristic: search for prominent main content or article
  if (!jdText || jdText.length < 200) {
    const mainEl = document.querySelector('main, article, [role="main"]');
    if (mainEl) {
      jdText = mainEl.textContent || '';
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
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent) {
    jobTitle = h1.textContent.trim();
  }

  // Extract Company Name if available
  const companyEl = document.querySelector('[data-company-name], .company-name, .posting-headline h2');
  if (companyEl && companyEl.textContent) {
    companyName = companyEl.textContent.trim();
  } else {
    // Infer from hostname or title
    const parts = document.title.split(/[-|–•]/);
    if (parts.length > 1) {
      companyName = parts[parts.length - 1].trim();
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

