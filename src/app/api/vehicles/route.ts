import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { VehicleType } from "@prisma/client";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const vehicleSchema = z.object({
  name: z.string().min(1),
  registrationNumber: z.string().min(1),
  vehicleType: z.enum(["KAMION", "PRIKOLICA"]),
  sixMonthInspectionDate: z.string().optional(),
  registrationExpiryDate: z.string().optional(),
  ppAparatExpiryDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validated = vehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.create({
      data: {
        name: validated.name,
        registrationNumber: validated.registrationNumber,
        vehicleType: validated.vehicleType as VehicleType,
        sixMonthInspectionDate: validated.sixMonthInspectionDate
          ? new Date(validated.sixMonthInspectionDate)
          : null,
        registrationExpiryDate: validated.registrationExpiryDate
          ? new Date(validated.registrationExpiryDate)
          : null,
        ppAparatExpiryDate: validated.ppAparatExpiryDate
          ? new Date(validated.ppAparatExpiryDate)
          : null,
        organizationId: authResult.user.organizationId,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Nevažeći podaci", errors: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Vozilo sa tom registarskom oznakom već postoji" },
        { status: 409 }
      );
    }

    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { message: "Greška pri kreiranju vozila" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        organizationId: authResult.user.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju vozila" },
      { status: 500 }
    );
  }
}
