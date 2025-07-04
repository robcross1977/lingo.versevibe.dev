"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

/**
 * Authentication component that displays login/logout controls and user profile
 */
export default function Auth() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <div className="lg:mr-5 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="lg:mr-5 items-center justify-center">
      {user ? (
        <div className="flex flex-row items-center justify-center gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/signout"
            data-testid="logout"
            className="lg:pr-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </a>
          {user.image && (
            <Link href="/profile">
              <Image
                src={user.image}
                alt={user.name ?? "Profile Picture"}
                width={30}
                height={30}
                className="rounded-full border-2 border-primary/20 hover:border-primary transition-colors"
              />
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/signin"
            data-testid="login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </a>
        </>
      )}
    </div>
  );
}
