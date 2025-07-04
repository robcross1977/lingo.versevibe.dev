import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";
import type { NextAuthConfig } from "next-auth";

/**
 * Gets Auth0 configuration with fallback for development
 * In production, all Auth0 environment variables are required
 */
const getAuthConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check if Auth0 is configured
  const hasAuth0Config =
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_DOMAIN;

  if (!hasAuth0Config && !isDevelopment) {
    throw new Error(
      "Missing required Auth0 environment variables: AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN. " +
        "Please check your .env.local file and ensure all Auth0 variables are set."
    );
  }

  // In development, provide fallback configuration if Auth0 is not set up
  if (!hasAuth0Config && isDevelopment) {
    console.warn(
      "⚠️  Auth0 not configured. Authentication will be disabled in development mode. " +
        "Set AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and AUTH0_DOMAIN to enable authentication."
    );
    return {
      providers: [],
      callbacks: {
        session({ session, token }: any) {
          if (token.sub) {
            session.user.id = token.sub;
          }
          return session;
        },
        jwt({ token, account }: any) {
          if (account) {
            token.accessToken = account.access_token;
          }
          return token;
        },
      },
    };
  }

  // Auth0 is configured
  return {
    providers: [
      Auth0({
        clientId: process.env.AUTH0_CLIENT_ID!,
        clientSecret: process.env.AUTH0_CLIENT_SECRET!,
        issuer: process.env.AUTH0_DOMAIN!,
      }),
    ],
    callbacks: {
      session({ session, token }: any) {
        // Ensure the user ID is available in the session
        if (token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
      jwt({ token, account }: any) {
        // Persist the OAuth account info to the token
        if (account) {
          token.accessToken = account.access_token;
        }
        return token;
      },
    },
  };
};

const authConfig = getAuthConfig();

export const config = {
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt" as const,
  },
  debug: process.env.NODE_ENV === "development",
  // Remove custom pages to use NextAuth.js defaults
  // pages: {
  //   signIn: "/auth/signin",
  //   error: "/auth/error",
  // },
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(config);
