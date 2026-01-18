import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { VehicleType } from "@prisma/client";

const vehicleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  registrationNumber: z.string().min(1).optional(),
  vehicleType: z.enum(["KAMION", "PRIKOLICA"]).optional(),
  sixMonthInspectionDate: z.string().optional().nullable(),
  registrationExpiryDate: z.string().optional().nullable(),
  ppAparatExpiryDate: z.string().optional().nullable(),
});

// GET pojedinačno vozilo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vozilo nije pronađeno" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju vozila" },
      { status: 500 }
    );
  }
}

// PATCH ažuriranje vozila
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = vehicleUpdateSchema.parse(body);

    // Provjeri da li vozilo postoji i pripada korisniku
    const existingVehicle = await prisma.vehicle.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { message: "Vozilo nije pronađeno" },
        { status: 404 }
      );
    }

    // Ažuriraj vozilo
    const vehicle = await prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.registrationNumber && {
          registrationNumber: validated.registrationNumber,
        }),
        ...(validated.vehicleType && {
          vehicleType: validated.vehicleType as VehicleType,
        }),
        ...(validated.sixMonthInspectionDate !== undefined && {
          sixMonthInspectionDate: validated.sixMonthInspectionDate
            ? new Date(validated.sixMonthInspectionDate)
            : null,
        }),
        ...(validated.registrationExpiryDate !== undefined && {
          registrationExpiryDate: validated.registrationExpiryDate
            ? new Date(validated.registrationExpiryDate)
            : null,
        }),
        ...(validated.ppAparatExpiryDate !== undefined && {
          ppAparatExpiryDate: validated.ppAparatExpiryDate
            ? new Date(validated.ppAparatExpiryDate)
            : null,
        }),
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

    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { message: "Greška pri ažuriranju vozila" },
      { status: 500 }
    );
  }
}

// DELETE brisanje vozila
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Provjeri da li vozilo postoji i pripada korisniku
    const existingVehicle = await prisma.vehicle.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingVehicle) {
      return NextResponse.json(
        { message: "Vozilo nije pronađeno" },
        { status: 404 }
      );
    }

    // Obriši vozilo
    await prisma.vehicle.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Vozilo uspješno obrisano" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { message: "Greška pri brisanju vozila" },
      { status: 500 }
    );
  }
}
