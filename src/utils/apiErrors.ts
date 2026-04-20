/**
 * Build a user-visible message from common API error JSON bodies
 * (Spring-style maps/arrays, FastAPI detail, generic validationErrors).
 */
export function messageFromApiErrorBody(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return '';
  }
  const d = data as Record<string, unknown>;
  const segments: string[] = [];

  if (typeof d.message === 'string' && d.message.trim()) {
    segments.push(d.message.trim());
  }

  // { errors: { field: ["msg"], ... } } — Spring / many REST APIs
  if (d.errors && typeof d.errors === 'object' && !Array.isArray(d.errors)) {
    for (const [key, val] of Object.entries(d.errors as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        const joined = val.map(String).filter(Boolean).join(', ');
        if (joined) segments.push(`${key}: ${joined}`);
      } else if (typeof val === 'string' && val) {
        segments.push(`${key}: ${val}`);
      }
    }
  }

  // { errors: [{ field, message } | { field, defaultMessage }] }
  if (Array.isArray(d.errors)) {
    for (const item of d.errors) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const field = typeof o.field === 'string' ? o.field : typeof o.property === 'string' ? o.property : '';
      const msg =
        typeof o.message === 'string'
          ? o.message
          : typeof o.defaultMessage === 'string'
            ? o.defaultMessage
            : '';
      if (field && msg) segments.push(`${field}: ${msg}`);
      else if (msg) segments.push(msg);
      else if (typeof item === 'string') segments.push(item);
    }
  }

  if (Array.isArray(d.validationErrors)) {
    segments.push(...d.validationErrors.map(String).filter(Boolean));
  }

  // FastAPI 422: { detail: [{ loc, msg }, ...] }
  if (Array.isArray(d.detail)) {
    for (const item of d.detail) {
      if (!item || typeof item !== 'object') continue;
      const o = item as { loc?: unknown[]; msg?: string };
      const loc = Array.isArray(o.loc) ? o.loc.filter(Boolean).join('.') : '';
      const msg = typeof o.msg === 'string' ? o.msg : '';
      if (loc && msg) segments.push(`${loc}: ${msg}`);
      else if (msg) segments.push(msg);
    }
  }

  if (typeof d.error === 'string' && d.error.trim() && !segments.length) {
    segments.push(d.error.trim());
  }

  return segments.filter(Boolean).join(' — ');
}
