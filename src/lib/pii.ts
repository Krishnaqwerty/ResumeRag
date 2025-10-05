// Simple PII detection & redaction (improvable)

export interface PIIInfo {
  emails: string[];
  phones: string[];
  names: string[]; // naive capture of capitalized tokens
}

const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneRe = /(?:(?:\+?\d{1,3}[ -]?)?(?:\(?\d{3}\)?[ -]?)?\d{3}[ -]?\d{4})/g; // naive

export function extractPII(text: string): PIIInfo {
  const emails = Array.from(new Set(text.match(emailRe) || []));
  const phones = Array.from(new Set(text.match(phoneRe) || [])).filter(p => p.replace(/\D/g,'').length >= 10);
  // naive names: capitalized words not at sentence start maybe — keep simple
  const names = Array.from(new Set((text.match(/\b[A-Z][a-z]{2,}\b/g) || []).slice(0, 10)));
  return { emails, phones, names };
}

export function redactText(text: string, pii: PIIInfo): string {
  let redacted = text;
  for (const e of pii.emails) redacted = redacted.replaceAll(e, '[REDACTED_EMAIL]');
  for (const p of pii.phones) redacted = redacted.replaceAll(p, '[REDACTED_PHONE]');
  for (const n of pii.names) {
    const re = new RegExp(`\\b${n}\\b`, 'g');
    redacted = redacted.replace(re, n.charAt(0) + '.');
  }
  return redacted;
}
