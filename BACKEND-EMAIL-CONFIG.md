# Backend Email Verification URL Configuration

This document provides the correct frontend URLs that the backend should use when generating email verification links.

## Configuration (Both Environments)

The frontend uses the base path `/user-management-UI` in both development and production to maintain consistency.

## Local Development

When running the frontend locally (`npm run dev`), use:

```
http://localhost:5173/user-management-UI/verify-email
```

**Note:** The base path `/user-management-UI` is required even in local development.

## Production (GitHub Pages)

When deployed to GitHub Pages, use:

```
https://essleman-se.github.io/user-management-UI/verify-email
```

## Backend Configuration

The backend should be configured with the appropriate frontend URL based on the environment:

### Example Configuration

**For Local Development:**
```properties
frontend.base.url=http://localhost:5173
frontend.base.path=/user-management-UI
frontend.verification.path=/verify-email
```

**For Production:**
```properties
frontend.base.url=https://essleman-se.github.io
frontend.base.path=/user-management-UI
frontend.verification.path=/verify-email
```

### Email Link Generation

When generating email verification links, the backend should construct the URL as:

```
{frontend.base.url}{frontend.base.path}/verify-email?token={verificationToken}
```

**Examples:**
- Local: `http://localhost:5173/user-management-UI/verify-email?token=abc123`
- Production: `https://essleman-se.github.io/user-management-UI/verify-email?token=abc123`

## Current Status

✅ The backend is now correctly configured to include the base path `/user-management-UI` in email verification links for both development and production environments.

