import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const vehicles = await db.vehicle.findMany({
      where: {
        organizationId: authResult.user.organizationId,
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
