import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { truckId, trailerId } = body;

    // Build update data based on what was provided
    const updateData: { truckId?: string | null; trailerId?: string | null } = {};
    
    if ("truckId" in body) {
      updateData.truckId = truckId || null;
    }
    if ("trailerId" in body) {
      updateData.trailerId = trailerId || null;
    }

    // Verify the tour belongs to the organization
    const existingTour = await prisma.contractedTour.findFirst({
      where: {
        id,
        organizationId: authResult.user.organizationId,
      },
    });

    if (!existingTour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    // Check if truck is already assigned to another active tour (tour with driver)
    if (truckId) {
      const truckInUse = await prisma.contractedTour.findFirst({
        where: {
          truckId: truckId,
          organizationId: authResult.user.organizationId,
          id: { not: id },
          driverId: { not: null }, // Only check active tours (with driver)
        },
        include: { truck: true },
      });

      if (truckInUse) {
        return NextResponse.json(
          { error: `Kamion ${truckInUse.truck?.registrationNumber} je već dodijeljen drugoj aktivnoj turi` },
          { status: 400 }
        );
      }
    }

    // Check if trailer is already assigned to another active tour (tour with driver)
    if (trailerId) {
      const trailerInUse = await prisma.contractedTour.findFirst({
        where: {
          trailerId: trailerId,
          organizationId: authResult.user.organizationId,
          id: { not: id },
          driverId: { not: null }, // Only check active tours (with driver)
        },
        include: { trailer: true },
      });

      if (trailerInUse) {
        return NextResponse.json(
          { error: `Prikolica ${trailerInUse.trailer?.registrationNumber} je već dodijeljena drugoj aktivnoj turi` },
          { status: 400 }
        );
      }
    }

    // Update the tour with vehicle assignment
    const updatedTour = await prisma.contractedTour.update({
      where: { id },
      data: updateData,
      include: {
        truck: true,
        trailer: true,
        driver: true,
        unloadingStops: true,
      },
    });

    return NextResponse.json(updatedTour);
  } catch (error) {
    console.error("Error assigning vehicle:", error);
    return NextResponse.json(
      { error: "Failed to assign vehicle" },
      { status: 500 }
    );
  }
}
