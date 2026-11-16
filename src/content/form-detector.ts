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

    // Anti-spam, Honeypot, and Captcha / Search helper detection
    const lowerLabel = label.toLowerCase();
    const lowerName = name.toLowerCase();
    const lowerPlaceholder = placeholder.toLowerCase();

    const isHoneypotOrNoise =
      lowerLabel.includes('leave this field blank') ||
      lowerLabel.includes('do not fill') ||
      lowerLabel.includes('type below image') ||
      lowerPlaceholder.includes('type below image') ||
      lowerPlaceholder.includes('search country with dial code') ||
      lowerName.includes('nickname_hp') ||
      lowerName.includes('hpcsaf') ||
      fieldId.toLowerCase().includes('recaptcha') ||
      fieldId.toLowerCase().includes('captcha');

    if (isHoneypotOrNoise) {
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
    try {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label && label.textContent) {
        return cleanLabelText(label.textContent);
      }
    } catch (_) {}
  }

  // 2. Zoho Recruit pattern: crc-label-<name> or crc-label-<name>_input or crc-label-<id>
  const name = el.getAttribute('name') || '';
  if (name) {
    const zohoLabel =
      document.getElementById(`crc-label-${name}`) ||
      document.getElementById(`crc-label-${name}_input`) ||
      document.querySelector(`label[id*="${name}"]`);
    if (zohoLabel && zohoLabel.textContent) {
      return cleanLabelText(zohoLabel.textContent);
    }
  }
  if (el.id) {
    const zohoLabel = document.getElementById(`crc-label-${el.id}`);
    if (zohoLabel && zohoLabel.textContent) {
      return cleanLabelText(zohoLabel.textContent);
    }
  }

  // 3. Direct parent <label>
  const parentLabel = el.closest('label');
  if (parentLabel && parentLabel.textContent) {
    return cleanLabelText(parentLabel.textContent);
  }

  // 4. aria-label or aria-labelledby
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    return cleanLabelText(ariaLabel);
  }

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelledByEl = document.getElementById(ariaLabelledBy);
    if (labelledByEl && labelledByEl.textContent) {
      return cleanLabelText(labelledByEl.textContent);
    }
  }

  // 5. Preceding sibling or nearby heading/legend
  const prevSibling = el.previousElementSibling;
  if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN' || prevSibling.tagName === 'P')) {
    if (prevSibling.textContent) {
      return cleanLabelText(prevSibling.textContent);
    }
  }

  // 6. Closest row or field wrapper (Zoho Recruit, BambooHR, HuntingCube, Tailwind, Bootstrap)
  const row = el.closest(
    '.crc-form-row, .crc-form-field, .lyteField, .cxElementValue, .form-group, .form-row, .field, [class*="form-group"], [class*="form-row"], [class*="form-field"], .input-container, .apply-card, [data-slot="input-group"], [data-slot="select"]'
  );
  if (row) {
    const rowLabel = row.querySelector('.crm-from-label, label, [class*="label"], [class*="title"]');
    if (rowLabel && rowLabel.textContent) {
      return cleanLabelText(rowLabel.textContent);
    }
  }

  // 7. Parent wrapper's preceding sibling (e.g. HuntingCube / Tailwind wrapping input in span)
  const parent = el.parentElement;
  if (parent && (parent.tagName === 'SPAN' || parent.tagName === 'DIV')) {
    const parentPrev = parent.previousElementSibling;
    if (parentPrev && (parentPrev.tagName === 'LABEL' || parentPrev.tagName === 'SPAN' || parentPrev.tagName === 'P')) {
      if (parentPrev.textContent) {
        return cleanLabelText(parentPrev.textContent);
      }
    }
  }

  // 8. File upload component label detection (Resume, CV, Documents)
  if ((el as HTMLInputElement).type === 'file') {
    const fileContainer = el.closest('rec-file-upload-component, lyte-file-select-area, .crc-other-upload, [class*="upload"]');
    if (fileContainer && fileContainer.textContent) {
      const text = fileContainer.textContent.toLowerCase();
      if (text.includes('resume') || text.includes('cv')) {
        return 'Resume / CV';
      }
    }
  }

  return '';
}

function cleanLabelText(raw: string): string {
  return raw
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

