import { scrapeJobDescription } from './jd-scraper';
import { detectFormFields } from './form-detector';
import { injectValue } from './dom-injector';

console.log('[JobHunt AI] Content script active and listening.');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ANALYZE_PAGE') {
    const jd = scrapeJobDescription();
    const fields = detectFormFields();
    sendResponse({ success: true, payload: { jd, fields } });
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

