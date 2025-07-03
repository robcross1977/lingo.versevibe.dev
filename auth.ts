import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

/**
 * Gets providers based on available environment variables
 * Falls back to GitHub or development provider if Auth0 is not configured
 */
const getProviders = () => {
  const providers = [];

  // Add Auth0 if configured
  if (
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_DOMAIN
  ) {
    providers.push(
      Auth0({
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
        issuer: process.env.AUTH0_DOMAIN,
        wellKnown: `${process.env.AUTH0_DOMAIN}/.well-known/openid_configuration`,
      })
    );
  }

  // Add GitHub if configured
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    );
  }

  return providers;
};

export const config = {
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "fallback-secret-for-development",
  providers: getProviders(),
  callbacks: {
    session({ session, token }) {
      // Ensure the user ID is available in the session
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, account }) {
      // Persist the OAuth account info to the token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
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
