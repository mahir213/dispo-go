import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const driverUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  licenseNumber: z.string().min(1).optional(),
  licenseExpiryDate: z.string().optional().nullable(),
  medicalExamExpiryDate: z.string().optional().nullable(),
  driverCardExpiryDate: z.string().optional().nullable(),
});

// GET pojedinačnog vozača
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

    const driver = await prisma.driver.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { message: "Vozač nije pronađen" },
        { status: 404 }
      );
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju vozača" },
      { status: 500 }
    );
  }
}

// PATCH ažuriranje vozača
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
    const validated = driverUpdateSchema.parse(body);

    // Provjeri da li vozač postoji i pripada korisniku
    const existingDriver = await prisma.driver.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { message: "Vozač nije pronađen" },
        { status: 404 }
      );
    }

    // Ažuriraj vozača
    const driver = await prisma.driver.update({
      where: {
        id,
      },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.phoneNumber && { phoneNumber: validated.phoneNumber }),
        ...(validated.email !== undefined && { 
          email: validated.email || null 
        }),
        ...(validated.licenseNumber && {
          licenseNumber: validated.licenseNumber,
        }),
        ...(validated.licenseExpiryDate !== undefined && {
          licenseExpiryDate: validated.licenseExpiryDate
            ? new Date(validated.licenseExpiryDate)
            : null,
        }),
        ...(validated.medicalExamExpiryDate !== undefined && {
          medicalExamExpiryDate: validated.medicalExamExpiryDate
            ? new Date(validated.medicalExamExpiryDate)
            : null,
        }),
        ...(validated.driverCardExpiryDate !== undefined && {
          driverCardExpiryDate: validated.driverCardExpiryDate
            ? new Date(validated.driverCardExpiryDate)
            : null,
        }),
      },
      include: {
        notes: true,
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Nevažeći podaci", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating driver:", error);
    return NextResponse.json(
      { message: "Greška pri ažuriranju vozača" },
      { status: 500 }
    );
  }
}

// DELETE brisanje vozača
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

    // Provjeri da li vozač postoji i pripada korisniku
    const existingDriver = await prisma.driver.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingDriver) {
      return NextResponse.json(
        { message: "Vozač nije pronađen" },
        { status: 404 }
      );
    }

    // Obriši vozača (bilješke će se automatski obrisati zbog cascade)
    await prisma.driver.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Vozač uspješno obrisan" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { message: "Greška pri brisanju vozača" },
      { status: 500 }
    );
  }
}
