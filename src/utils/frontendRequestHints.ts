/**
 * Headers for auth flows where the backend may need the public frontend URL
 * to build email links (reset password, etc.). Browser sets Origin/Referer automatically;
 * this adds an explicit base path many backends accept.
 */
export function frontendContextHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window === 'undefined') {
    return headers;
  }
  const basePath = (import.meta.env.BASE_URL || '/user-management-UI').replace(/\/$/, '');
  headers['X-Frontend-Base-URL'] = `${window.location.origin}${basePath}`;
  return headers;
}
