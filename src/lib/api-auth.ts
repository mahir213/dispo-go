import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { UserRole } from "@prisma/client";

export type Permission = 
  | "view_vehicles"
  | "edit_vehicles"
  | "view_drivers"
  | "edit_drivers"
  | "view_tours"
  | "edit_tours"
  | "invoice_tours"
  | "view_calendar"
  | "edit_calendar"
  | "manage_users"
  | "view_settings"
  | "edit_settings";

// Definicija dozvola po ulozi
const rolePermissions: Record<UserRole, Permission[]> = {
  DIREKTOR: [
    "view_vehicles",
    "edit_vehicles",
    "view_drivers",
    "edit_drivers",
    "view_tours",
    "edit_tours",
    "invoice_tours",
    "view_calendar",
    "edit_calendar",
    "manage_users",
    "view_settings",
    "edit_settings",
  ],
  DISPONENT: [
    "view_vehicles",
    "edit_vehicles",
    "view_drivers",
    "edit_drivers",
    "view_tours",
    "edit_tours",
    "invoice_tours",
    "view_calendar",
    "edit_calendar",
    "view_settings",
    "edit_settings",
  ],
  KNJIGOVODJA: [
    "view_vehicles",
    "view_drivers",
    "view_tours",
    "invoice_tours",
    "view_calendar",
    "view_settings",
  ],
  SERVISER: [
    "view_vehicles",
    "edit_vehicles",
    "view_settings",
  ],
};

export interface AuthResult {
  user: {
    id: string;
    role: UserRole;
    organizationId: string;
  };
  hasPermission: (permission: Permission) => boolean;
}

export async function checkAuth(): Promise<AuthResult | NextResponse> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json(
      { error: "Niste prijavljeni" },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, organizationId: true },
  });

  if (!user || !user.organizationId) {
    return NextResponse.json(
      { error: "Korisnik nije pronađen ili nema organizaciju" },
      { status: 401 }
    );
  }

  return {
    user: {
      id: user.id,
      role: user.role,
      organizationId: user.organizationId,
    },
    hasPermission: (permission: Permission) => 
      rolePermissions[user.role].includes(permission),
  };
}

export function requirePermission(
  authResult: AuthResult | NextResponse,
  permission: Permission
): NextResponse | null {
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult.hasPermission(permission)) {
    return NextResponse.json(
      { error: "Nemate dozvolu za ovu akciju" },
      { status: 403 }
    );
  }

  return null;
}
