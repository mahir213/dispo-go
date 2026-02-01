import { auth } from "./auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "./db";

export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  // Dohvati organizationId iz baze
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true, role: true },
  });

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
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session) {
    redirect("/");
  }
};
