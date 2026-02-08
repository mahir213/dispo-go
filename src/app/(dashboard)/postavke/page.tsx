import { requireAuth } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { SettingsForm } from "@/components/settings-form";
import { UserManagement } from "@/components/user-management";
import { cache } from "react";

// Cache the user settings fetch
const getUserSettings = cache(async (userId: string) => {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailNotificationsEnabled: true,
      notificationDaysBefore: true,
    },
  });
});

export default async function SettingsPage() {
  const session = await requireAuth();

  const user = await getUserSettings(session.user.id);

  if (!user) {
    redirect("/login");
  }

  const isDirektor = user.role === "DIREKTOR";

  return (
    <div className="flex-1 overflow-auto">
      <div className="container max-w-4xl py-10 ml-[300px]">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Postavke</h1>
            <p className="text-muted-foreground">
              Upravljajte postavkama svog računa i preferencijama
            </p>
          </div>

          <SettingsForm user={user} />

          {isDirektor && <UserManagement currentUserId={user.id} />}
        </div>
      </div>
    </div>
  );
}
