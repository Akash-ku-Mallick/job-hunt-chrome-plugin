export function injectValue(fieldId: string, value: string): boolean {
  const el = findFieldElement(fieldId);
  if (!el) {
    return false;
  }

  // Handle Radio & Checkbox inputs
  if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
    el.focus();
    const isAffirmative = /^(yes|true|1|y)$/i.test(value.trim());

    if (el.type === 'checkbox') {
      el.checked = isAffirmative;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      highlightField(el);
      return true;
    }

    if (el.type === 'radio') {
      if (el.name) {
        const radios = Array.from(
          document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(el.name)}"]`)
        );
        const targetRadio = radios.find(r => {
          const rVal = r.value.toLowerCase();
          const rLabel = (r.closest('label')?.textContent || r.getAttribute('aria-label') || '').toLowerCase();
          if (isAffirmative) {
            return rVal === 'true' || rVal === 'yes' || rVal === '1' || rLabel.includes('yes');
          } else {
            return rVal === 'false' || rVal === 'no' || rVal === '0' || rLabel.includes('no');
          }
        }) || el;

        targetRadio.checked = true;
        targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
        targetRadio.dispatchEvent(new Event('click', { bubbles: true }));
        highlightField(targetRadio);
        return true;
      } else {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('click', { bubbles: true }));
        highlightField(el);
        return true;
      }
    }
  }

  // Handle Text, Email, Tel, URL, and Textarea inputs
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.focus();

    // Call native prototype setter to bypass React's synthetic input tracker
    const prototype = el instanceof HTMLInputElement
      ? window.HTMLInputElement.prototype
      : window.HTMLTextAreaElement.prototype;

    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(el, value);
    } else {
      el.value = value;
    }

    // Update React internal _valueTracker if available
    const tracker = (el as any)._valueTracker;
    if (tracker) {
      tracker.setValue(value);
    }

    // Dispatch full synthetic event bubble chain
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

    highlightField(el);
    return true;
  }

  // Handle Dropdown Select inputs
  if (el instanceof HTMLSelectElement) {
    el.focus();
    // Search matching option (exact or fuzzy text match)
    const options = Array.from(el.options);
    const targetVal = value.toLowerCase().trim();
    const matchedOption = options.find(
      opt => opt.text.toLowerCase().includes(targetVal) || opt.value.toLowerCase() === targetVal
    );

    if (matchedOption) {
      el.selectedIndex = matchedOption.index;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      highlightField(el);
      return true;
    }
  }

  return false;
}

function findFieldElement(fieldId: string): HTMLElement | null {
  // Try ID selector
  let el = document.getElementById(fieldId);
  if (el) return el;

  // Try dataset attribute
  el = document.querySelector(`[data-jobhunt-id="${CSS.escape(fieldId)}"]`);
  if (el) return el;

  // Try name attribute
  el = document.querySelector(`[name="${CSS.escape(fieldId)}"]`);
  if (el) return el;

  return null;
}

function highlightField(el: HTMLElement): void {
  const originalBoxShadow = el.style.boxShadow;
  const originalTransition = el.style.transition;

  el.style.transition = 'box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1)';
  el.style.boxShadow = '0 0 0 2px rgba(22, 163, 74, 0.65)';

  setTimeout(() => {
    el.style.boxShadow = originalBoxShadow;
    el.style.transition = originalTransition;
  }, 2000);
}
