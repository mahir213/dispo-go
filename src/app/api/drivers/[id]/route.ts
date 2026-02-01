import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { checkAuth, requirePermission } from "@/lib/api-auth";

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
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_drivers");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const driver = await prisma.driver.findUnique({
      where: {
        id,
        organizationId: authResult.user.organizationId,
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
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_drivers");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const validated = driverUpdateSchema.parse(body);

    // Provjeri da li vozač postoji i pripada organizaciji
    const existingDriver = await prisma.driver.findUnique({
      where: {
        id,
        organizationId: authResult.user.organizationId,
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
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_drivers");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    // Provjeri da li vozač postoji i pripada organizaciji
    const existingDriver = await prisma.driver.findUnique({
      where: {
        id,
        organizationId: authResult.user.organizationId,
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
