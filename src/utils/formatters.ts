/**
 * Formats an amount in Tanzanian Shillings (TZS)
 * e.g., 25000 -> "TZS 25,000"
 */
export function formatTZS(amount: number): string {
  return `TZS ${new Intl.NumberFormat('en-TZ', {
    maximumFractionDigits: 0
  }).format(amount)}`;
}

/**
 * Formats a date string into readable Tanzanian locale format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Masks a phone number for security, e.g. +255 754 123 456 -> +255 754 *** 456
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 9) return phone;
  const cleaned = phone.replace(/\s+/g, '');
  return `${cleaned.slice(0, 7)} *** ${cleaned.slice(-3)}`;
}

/**
 * Generate human readable reference number for FacePay transactions
 */
export function generateReference(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `FP-TZ-${timestamp}-${random}`;
}
