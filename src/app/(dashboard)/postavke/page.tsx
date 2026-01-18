import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { SettingsForm } from "@/components/settings-form";
import { TestEmailButton } from "@/components/test-email-button";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailNotificationsEnabled: true,
      notificationDaysBefore: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

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

          <TestEmailButton />
        </div>
      </div>
    </div>
  );
}
