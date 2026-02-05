import { auth } from "./auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "./db";
import { cache } from "react";

export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return session;
});

export const getUserData = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true, role: true },
  });
});

export const requireAuth = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getUserData(session.user.id);

  return {
    ...session,
    user: {
      ...session.user,
      organizationId: user?.organizationId || "",
      role: user?.role || "DISPONENT",
    },
  };
};

export const requireUnauth = async () => {
  const session = await getSession();

  if (session) {
    redirect("/");
  }
};
