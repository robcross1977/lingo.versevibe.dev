# Authentication Setup

This application uses NextAuth.js v5 with Auth0 for authentication.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Auth0 Configuration (Required for authentication to work)
AUTH0_CLIENT_ID=your_auth0_client_id_here
AUTH0_CLIENT_SECRET=your_auth0_client_secret_here
AUTH0_DOMAIN=https://your-domain.auth0.com

# NextAuth.js Secret (Required for production)
NEXTAUTH_SECRET=your-nextauth-secret-here

# Database URL
DATABASE_URL="file:./dev.db"

# OpenAI API Key (for AI functionality)
OPENAI_API_KEY=your_openai_api_key_here
```

## Development Mode

**Important**: Currently there's a compatibility issue between NextAuth.js v5 beta and Turbopack.

- Use `npm run dev` for development (without Turbopack)
- Use `npm run dev:turbo` if you want to test with Turbopack (may have auth issues)

## Auth0 Setup

1. Create an Auth0 application at https://auth0.com
2. Set the application type to "Single Page Application" or "Regular Web Application"
3. **CRITICAL**: Configure these exact URLs in your Auth0 application settings:

### Required URLs in Auth0 Dashboard:

```
Allowed Callback URLs:
http://localhost:3000/api/auth/callback/auth0

Allowed Logout URLs:
http://localhost:3000

Allowed Web Origins:
http://localhost:3000

Allowed Origins (CORS):
http://localhost:3000
```

### For Production:

Replace `http://localhost:3000` with your production domain (e.g., `https://yourdomain.com`)

## Troubleshooting

If you see "Configuration" errors:

1. Double-check the callback URL in Auth0 matches exactly: `http://localhost:3000/api/auth/callback/auth0`
2. Ensure your Auth0 application type is set correctly
3. Verify all environment variables are set in `.env.local`
4. Make sure there are no trailing slashes in URLs

## Fallback Behavior

If Auth0 environment variables are not configured, the application will:

- Show a warning in development mode
- Disable authentication features
- Display "Loading..." in the auth component
- Continue to work for testing the chat functionality

## Production Deployment

For production deployment:

1. Set all required environment variables
2. Ensure `NEXTAUTH_SECRET` is set to a secure random string
3. Update Auth0 URLs to match your production domain
