"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
    "view_settings",
  ],
};

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailNotificationsEnabled: true,
      notificationDaysBefore: true,
    },
  });

  return user;
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }

  return rolePermissions[user.role].includes(permission);
}

export async function getUserPermissions(): Promise<Permission[]> {
  const user = await getCurrentUser();
  
  if (!user) {
    return [];
  }

  return rolePermissions[user.role];
}

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    DIREKTOR: "Direktor",
    DISPONENT: "Disponent",
    KNJIGOVODJA: "Knjigovođa",
    SERVISER: "Serviser",
  };
  return labels[role];
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    DIREKTOR: "Puni pristup svim funkcijama i upravljanje korisnicima",
    DISPONENT: "Puni pristup svim funkcijama osim upravljanja korisnicima",
    KNJIGOVODJA: "Pregled svih podataka i fakturisanje tura",
    SERVISER: "Pregled vozila i bilješki vozila",
  };
  return descriptions[role];
}
