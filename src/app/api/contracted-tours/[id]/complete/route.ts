import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";

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

    // Check if this tour has children (parent tour group)
    const childTours = await prisma.contractedTour.findMany({
      where: {
        parentTourId: id,
        organizationId: authResult.user.organizationId,
      },
    });

    const isParentTour = childTours.length > 0;

    // Check if tour has a driver (is active) - except for parent tours in a group
    if (!isParentTour && !existingTour.driverId) {
      return NextResponse.json(
        { message: "Samo aktivne ture mogu biti završene" },
        { status: 400 }
      );
    }

    // Handle tour groups (parent-child relationships)
    if (existingTour.parentTourId) {
      // This is a child tour - just complete it
      await prisma.contractedTour.update({
        where: { id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          // Keep resources for history - validation checks isCompleted: false
        },
      });
    } else {
      // Check if this tour has children (is a parent tour)
      const childTours = await prisma.contractedTour.findMany({
        where: {
          parentTourId: id,
          organizationId: authResult.user.organizationId,
        },
      });

      if (childTours.length > 0) {
        // Complete parent and all child tours, keep resources for history
        await prisma.contractedTour.updateMany({
          where: {
            OR: [
              { id: id },
              { parentTourId: id },
            ],
            organizationId: authResult.user.organizationId,
          },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            // Keep driverId, truckId, trailerId for history
            // Validation in assign endpoints checks isCompleted: false
          },
        });
      } else {
        // Regular single tour - complete and keep resources for history
        await prisma.contractedTour.update({
          where: { id },
          data: {
            isCompleted: true,
            completedAt: new Date(),
            // Keep resources for history
          },
        });
      }
    }

    // Fetch and return the updated tour
    const tour = await prisma.contractedTour.findUnique({
      where: { id },
      include: {
        unloadingStops: true,
        driver: true,
        truck: true,
        trailer: true,
      },
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error("Error completing tour:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
