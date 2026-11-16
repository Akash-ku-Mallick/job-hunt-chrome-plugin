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

      // If no form inputs are currently visible, check for an apply trigger button (e.g. Zoho Recruit "I'm interested", BambooHR "Apply for This Job")
      if (fields.length === 0) {
        // Dismiss cookie freeze overlays if present
        const freeze = document.querySelector('.cw-cookie-freeze-layer, career-cookie-consent');
        if (freeze) freeze.remove();

        const isApplyTrigger = (text: string) => {
          const t = text.trim().toLowerCase();
          return (
            t === 'apply' ||
            t === 'apply now' ||
            t === 'apply for this job' ||
            t === 'apply for position' ||
            t === 'apply to job' ||
            t === "i'm interested" ||
            t === 'interested' ||
            t === 'start application' ||
            t === 'apply online' ||
            t === 'easy apply' ||
            /^(apply|i'?m interested|interested|start application)(\s+(now|for this job|online|to position))?$/i.test(t)
          );
        };

        const buttons = Array.from(document.querySelectorAll<HTMLElement>('button, a, [role="button"], .lyte-button'));
        const applyBtn = buttons.find(b => isApplyTrigger(b.innerText || b.textContent || ''));

        if (applyBtn) {
          applyBtn.click();
          // Poll for fields to appear dynamically (up to 2500ms)
          for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 200));
            fields = detectFormFields();
            if (fields.length > 0) break;
          }
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

