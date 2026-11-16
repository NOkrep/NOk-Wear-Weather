export const FEEDBACK_MAX_TEXT = 2000;
export const FEEDBACK_MAX_BYTES = 20 * 1024;
export const FEEDBACK_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export type ProductFeedbackCategory = 'bug' | 'suggestion';
export interface ProductFeedbackSubmission {
  version: 1;
  submissionId: string;
  category: ProductFeedbackCategory;
  description: string;
  steps: string;
  locale: 'tr' | 'en';
  consent: true;
}
export interface ProductFeedbackRecord extends ProductFeedbackSubmission { createdAt: string }

/** Only explicit form fields may cross this boundary; never spread application state. */
export function validateProductFeedback(value: unknown): ProductFeedbackSubmission | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const keys = ['version', 'submissionId', 'category', 'description', 'steps', 'locale', 'consent'];
  if (Object.keys(v).length !== keys.length || Object.keys(v).some(k => !keys.includes(k))) return null;
  if (v.version !== 1 || v.consent !== true || typeof v.submissionId !== 'string' || !FEEDBACK_ID.test(v.submissionId)) return null;
  if (v.category !== 'bug' && v.category !== 'suggestion') return null;
  if (v.locale !== 'tr' && v.locale !== 'en') return null;
  if (typeof v.description !== 'string' || typeof v.steps !== 'string') return null;
  const description = v.description.trim(), steps = v.steps.trim();
  if (description.length < 10 || description.length > FEEDBACK_MAX_TEXT || steps.length > FEEDBACK_MAX_TEXT) return null;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(description + steps)) return null;
  return { version: 1, submissionId: v.submissionId, category: v.category, description, steps, locale: v.locale, consent: true };
}

export function prepareProductFeedback(
  draft: { category: ProductFeedbackCategory; description: string; steps: string },
  locale: 'tr' | 'en', submissionId: string
) {
  return validateProductFeedback({ version: 1, submissionId, category: draft.category,
    description: draft.description, steps: draft.steps, locale, consent: true });
}

export function sameProductFeedback(a: ProductFeedbackSubmission, b: ProductFeedbackSubmission) {
  return a.submissionId === b.submissionId && a.category === b.category && a.description === b.description
    && a.steps === b.steps && a.locale === b.locale;
}
