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

    // Check if tour has a driver (is active)
    if (!existingTour.driverId) {
      return NextResponse.json(
        { message: "Samo aktivne ture mogu biti završene" },
        { status: 400 }
      );
    }

    // Mark tour as completed
    const tour = await prisma.contractedTour.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
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
