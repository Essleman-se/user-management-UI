# Environment Configuration Guide

This project uses separate configuration files for local development and production environments.

## Configuration Files

- **`src/config/local.ts`** - Local development configuration
- **`src/config/production.ts`** - Production configuration
- **`src/config/index.ts`** - Configuration selector (automatically chooses based on environment)

## Local Development

When running `npm run dev`, the app uses `src/config/local.ts`:

- **API Base URL**: Empty (uses Vite proxy to `http://localhost:8080`)
- **OAuth2 Callback**: `http://localhost:5173/oauth2/callback`

### To modify local settings:

Edit `src/config/local.ts`:

```typescript
export const localConfig = {
  api: {
    baseUrl: '', // Use Vite proxy (recommended)
    // OR specify directly:
    // baseUrl: 'http://localhost:8080',
  },
  // ...
};
```

## Production

When running `npm run build`, the app uses `src/config/production.ts`:

- **API Base URL**: Set via `VITE_API_BASE_URL` environment variable or defaults to config
- **OAuth2 Callback**: `https://essleman-se.github.io/user-management-UI/oauth2/callback`

### To set production API URL:

**Option 1: Environment Variable (Recommended)**

Create a `.env.production` file (or set it before building):

```bash
# .env.production
VITE_API_BASE_URL=https://your-backend-api.com
```

Then build:
```bash
npm run build
```

**Option 2: Edit Config File**

Edit `src/config/production.ts`:

```typescript
export const productionConfig = {
  api: {
    baseUrl: 'https://your-backend-api.com',
  },
  // ...
};
```

**Option 3: Set at Build Time**

```bash
# Windows PowerShell
$env:VITE_API_BASE_URL="https://your-backend-api.com"; npm run build

# Linux/Mac
VITE_API_BASE_URL=https://your-backend-api.com npm run build
```

## Environment Variables

Vite only exposes variables prefixed with `VITE_` to the client.

### Available Variables:

- `VITE_API_BASE_URL` - Backend API base URL for production

### Example `.env.production`:

```env
VITE_API_BASE_URL=https://api.example.com
```

## Switching Between Environments

The configuration is automatically selected based on:
- **Development**: `import.meta.env.DEV === true` (when running `npm run dev`)
- **Production**: `import.meta.env.DEV === false` (when running `npm run build`)

No manual switching needed - it's automatic!

## Important Notes

1. **Local config** (`src/config/local.ts`) is for development only
2. **Production config** (`src/config/production.ts`) is used in built apps
3. Environment variables (`.env.production`) override config file values
4. Never commit sensitive data (API keys, secrets) to the repository

