import { scrapeJobDescription } from './jd-scraper';
import { detectFormFields } from './form-detector';
import { injectValue } from './dom-injector';

console.log('[JobHunt AI] Content script active and listening.');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'ANALYZE_PAGE') {
    (async () => {
      const jd = scrapeJobDescription();
      let fields = detectFormFields();

      // If no form inputs are currently visible, check for an "Apply for This Job" button (e.g. BambooHR)
      if (fields.length === 0) {
        const applyBtn = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"]')).find(b => {
          const text = (b.textContent || '').trim().toLowerCase();
          return text === 'apply for this job' || text === 'apply now' || text === 'apply for position' || text === 'apply';
        });

        if (applyBtn) {
          applyBtn.click();
          await new Promise(r => setTimeout(r, 700));
          fields = detectFormFields();
        }
      }

      sendResponse({ success: true, payload: { jd, fields } });
    })();
    return true;
  }

  if (message.type === 'FILL_FIELDS') {
    let filledCount = 0;
    const fieldsToFill = message.payload.fields as Array<{ id: string; value: string }>;

    fieldsToFill.forEach(f => {
      const ok = injectValue(f.id, f.value);
      if (ok) filledCount++;
    });

    sendResponse({ success: true, payload: { count: filledCount } });
    return true;
  }
});

