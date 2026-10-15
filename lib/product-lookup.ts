export function normalizeBarcode(value: string): string | null {
  const code = value.trim();
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return null;
  const digits = [...code].map(Number);
  const sum = digits.slice(0, -1).reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - sum % 10) % 10 === digits[digits.length - 1] ? code : null;
}

export interface ProductLookup {
  barcode: string;
  found: boolean;
  title?: string;
  brand?: string;
  model?: string;
  source: 'UPCitemdb' | 'manual';
  status: 'found' | 'not-found' | 'unavailable' | 'rate-limited';
}
