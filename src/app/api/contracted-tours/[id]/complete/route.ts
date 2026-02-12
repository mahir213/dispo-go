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
        const sortedChildTours = [...childTours].sort((a, b) => {
          const aLoading = a.loadingDate ? a.loadingDate.getTime() : null;
          const bLoading = b.loadingDate ? b.loadingDate.getTime() : null;

          if (aLoading === null && bLoading === null) {
            return a.createdAt.getTime() - b.createdAt.getTime();
          }
          if (aLoading === null) return 1;
          if (bLoading === null) return -1;
          if (aLoading !== bLoading) return aLoading - bLoading;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

        const newParent = sortedChildTours[0];
        const newParentId = newParent.id;
        const remainingChildIds = sortedChildTours.slice(1).map((tour) => tour.id);

        await prisma.$transaction([
          prisma.contractedTour.update({
            where: { id },
            data: {
              isCompleted: true,
              completedAt: new Date(),
              // Keep resources for history
            },
          }),
          prisma.contractedTour.update({
            where: { id: newParentId },
            data: {
              parentTourId: null,
              isCompleted: false,
              completedAt: null,
            },
          }),
          ...(remainingChildIds.length > 0
            ? [
                prisma.contractedTour.updateMany({
                  where: {
                    id: { in: remainingChildIds },
                    organizationId: authResult.user.organizationId,
                  },
                  data: {
                    parentTourId: newParentId,
                    isCompleted: false,
                    completedAt: null,
                  },
                }),
              ]
            : []),
        ]);
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
