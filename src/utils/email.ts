/** Canonical form for email addresses used in auth (case-insensitive per common practice). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
