import { FormField } from '../shared/types';
import { classifyField } from '../core/matcher/field-classifier';

export function detectFormFields(): FormField[] {
  const elements = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
    )
  );

  const fields: FormField[] = [];

  elements.forEach((el, index) => {
    // Generate unique ID
    const fieldId = el.id || el.getAttribute('name') || `field_${index}_${Date.now()}`;
    if (!el.id) {
      el.dataset.jobhuntId = fieldId;
    }

    const type = (el.tagName.toLowerCase() === 'textarea'
      ? 'textarea'
      : el.tagName.toLowerCase() === 'select'
      ? 'select'
      : (el as HTMLInputElement).type || 'text') as FormField['type'];

    const label = resolveFieldLabel(el);
    const name = el.getAttribute('name') || el.id || '';
    const placeholder = el.getAttribute('placeholder') || '';
    const required = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';

    // Anti-spam & Honeypot detection (e.g. BambooHR "Please leave this field blank")
    const isHoneypot =
      label.toLowerCase().includes('leave this field blank') ||
      label.toLowerCase().includes('do not fill') ||
      name.toLowerCase().includes('nickname_hp') ||
      name.toLowerCase().includes('hpcsaf') ||
      fieldId.toLowerCase().includes('recaptcha');

    if (isHoneypot) {
      return;
    }

    const currentValue = el.value || '';
    const classification = classifyField(label, name, type);

    fields.push({
      id: fieldId,
      name,
      type,
      label: label || placeholder || name || `Field ${index + 1}`,
      placeholder,
      required,
      currentValue,
      classification,
    });
  });

  return fields;
}

function resolveFieldLabel(el: HTMLElement): string {
  // 1. Explicit <label for="id">
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label && label.textContent) {
      return label.textContent.trim();
    }
  }

  // 2. Direct parent <label>
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.textContent) {
    return parentLabel.textContent.trim();
  }

  // 3. aria-label or aria-labelledby
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel.trim();
  }

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelledByEl = document.getElementById(ariaLabelledBy);
    if (labelledByEl && labelledByEl.textContent) {
      return labelledByEl.textContent.trim();
    }
  }

  // 4. Preceding sibling or nearby heading/legend
  const prevSibling = el.previousElementSibling;
  if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN' || prevSibling.tagName === 'P')) {
    if (prevSibling.textContent) {
      return prevSibling.textContent.trim();
    }
  }

  // 5. Parent wrapper's preceding sibling (e.g. HuntingCube / Tailwind wrapping input in span)
  const parent = el.parentElement;
  if (parent && (parent.tagName === 'SPAN' || parent.tagName === 'DIV')) {
    const parentPrev = parent.previousElementSibling;
    if (parentPrev && (parentPrev.tagName === 'LABEL' || parentPrev.tagName === 'SPAN' || parentPrev.tagName === 'P')) {
      if (parentPrev.textContent) {
        return parentPrev.textContent.trim();
      }
    }
  }

  // 6. Closest container label
  const container = el.closest('.form-group, .field, .input-container, .apply-card, [data-slot="input-group"], [data-slot="select"]');
  if (container) {
    const containerLabel = container.querySelector('label');
    if (containerLabel && containerLabel.textContent) {
      return containerLabel.textContent.trim();
    }
  }

  return '';
}

