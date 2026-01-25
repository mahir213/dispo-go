import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await db.vehicle.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        sixMonthInspectionDate: true,
        registrationExpiryDate: true,
        ppAparatExpiryDate: true,
      },
    });

    const notifications = vehicles.flatMap((vehicle) => {
      const alerts = [];
      const now = new Date();

      const checkExpiry = (date: Date | null, type: string) => {
        if (!date) return null;
        const expiryDate = new Date(date);
        const diffDays = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays < 0) {
          return {
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            registrationNumber: vehicle.registrationNumber,
            type,
            status: "expired" as const,
            daysUntil: diffDays,
            expiryDate: date,
          };
        } else if (diffDays <= 30) {
          return {
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            registrationNumber: vehicle.registrationNumber,
            type,
            status: "expiring" as const,
            daysUntil: diffDays,
            expiryDate: date,
          };
        }
        return null;
      };

      const sixMonthCheck = checkExpiry(
        vehicle.sixMonthInspectionDate,
        "Šestomjesečni pregled"
      );
      const registrationCheck = checkExpiry(
        vehicle.registrationExpiryDate,
        "Registracija"
      );
      const ppAparatCheck = checkExpiry(vehicle.ppAparatExpiryDate, "PP Aparat");

      if (sixMonthCheck) alerts.push(sixMonthCheck);
      if (registrationCheck) alerts.push(registrationCheck);
      if (ppAparatCheck) alerts.push(ppAparatCheck);

      return alerts;
    });

    // Sort: expired first, then by days until expiry
    notifications.sort((a, b) => {
      if (a.status === "expired" && b.status !== "expired") return -1;
      if (a.status !== "expired" && b.status === "expired") return 1;
      return a.daysUntil - b.daysUntil;
    });

    return NextResponse.json({
      notifications,
      count: notifications.length,
      hasExpired: notifications.some((n) => n.status === "expired"),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "Error fetching notifications" },
      { status: 500 }
    );
  }
}
