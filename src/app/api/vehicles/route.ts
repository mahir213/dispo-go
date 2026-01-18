import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { VehicleType } from "@prisma/client";

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
        userId: session.user.id,
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: session.user.id,
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
