import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const assignDriverSchema = z.object({
  driverId: z.string().nullable(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const validated = assignDriverSchema.parse(body);

    // Verify tour exists and belongs to organization
    const existingTour = await prisma.contractedTour.findFirst({
      where: {
        id,
        organizationId: authResult.user.organizationId,
      },
    });

    if (!existingTour) {
      return NextResponse.json({ message: "Tour not found" }, { status: 404 });
    }

    // If assigning a driver, verify driver exists and belongs to organization
    if (validated.driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: validated.driverId,
          organizationId: authResult.user.organizationId,
        },
      });

      if (!driver) {
        return NextResponse.json({ message: "Driver not found" }, { status: 404 });
      }

      // Check if driver is already assigned to another active tour
      const existingActiveTour = await prisma.contractedTour.findFirst({
        where: {
          driverId: validated.driverId,
          organizationId: authResult.user.organizationId,
          id: { not: id }, // Exclude current tour
        },
      });

      if (existingActiveTour) {
        return NextResponse.json(
          { message: `Vozač ${driver.name} je već dodijeljen drugoj aktivnoj turi` },
          { status: 400 }
        );
      }
    }

    const tour = await prisma.contractedTour.update({
      where: { id },
      data: {
        driverId: validated.driverId,
      },
      include: {
        unloadingStops: true,
        driver: true,
      },
    });

    return NextResponse.json(tour);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    console.error("Error assigning driver:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
