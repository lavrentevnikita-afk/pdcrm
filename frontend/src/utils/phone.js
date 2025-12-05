const digitsOnly = (value = '') => value.replace(/\D+/g, '');

export function formatPhoneInput(value) {
  const digits = digitsOnly(value).slice(0, 11);

  if (!digits) return '';

  const parts = ['+7'];

  if (digits.length > 1) {
    parts.push(` (${digits.slice(1, 4)}`);
  }
  if (digits.length >= 4) {
    parts.push(`) ${digits.slice(4, 7)}`);
  }
  if (digits.length >= 7) {
    parts.push(`-${digits.slice(7, 9)}`);
  }
  if (digits.length >= 9) {
    parts.push(`-${digits.slice(9, 11)}`);
  }

  return parts.join('');
}
