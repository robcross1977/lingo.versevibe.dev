import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Image from "next/image";

/**
 * User profile page that displays authenticated user information
 */
export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const user = session.user;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="flex items-center space-x-4 mb-6">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? "Profile Picture"}
                width={80}
                height={80}
                className="rounded-full border-4 border-primary/20"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user.name ?? "User"}
              </h1>
              {user.email && (
                <p className="text-muted-foreground text-lg">{user.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-foreground">
                    {user.name ?? "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-foreground">
                    {user.email ?? "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h2 className="text-xl font-semibold mb-2">Learning Progress</h2>
              <p className="text-muted-foreground">
                Your language learning journey will be tracked here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
