import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { TourType } from "@prisma/client";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const unloadingStopSchema = z.object({
  id: z.string().optional(),
  location: z.string().min(1, "Istovarno mjesto je obavezno"),
  unloadingDate: z.string().optional().nullable(),
});

const tourSchema = z.object({
  tourType: z.enum(["UVOZ", "IZVOZ", "MEDJUTURA"]),
  loadingLocation: z.string().min(1, "Utovarno mjesto je obavezno"),
  loadingDate: z.string().optional().nullable(),
  exportCustoms: z.string().optional(),
  importCustoms: z.string().optional(),
  unloadingStops: z.array(unloadingStopSchema).min(1, "Potrebno je barem jedno istovarno mjesto"),
  price: z.number().min(0, "Cijena mora biti pozitivna"),
  company: z.string().min(1, "Kompanija je obavezna"),
  isADR: z.boolean().default(false),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const tour = await prisma.contractedTour.findFirst({
      where: {
        id,
        organizationId: authResult.user.organizationId,
      },
      include: {
        unloadingStops: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!tour) {
      return NextResponse.json({ message: "Tour not found" }, { status: 404 });
    }

    return NextResponse.json(tour);
  } catch (error) {
    console.error("Error fetching tour:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const validated = tourSchema.parse(body);

    const existingTour = await prisma.contractedTour.findFirst({
      where: {
        id,
        organizationId: authResult.user.organizationId,
      },
    });

    if (!existingTour) {
      return NextResponse.json({ message: "Tour not found" }, { status: 404 });
    }

    // Delete existing unloading stops and create new ones
    await prisma.unloadingStop.deleteMany({
      where: { tourId: id },
    });

    const tour = await prisma.contractedTour.update({
      where: { id },
      data: {
        tourType: validated.tourType as TourType,
        loadingLocation: validated.loadingLocation,
        loadingDate: validated.loadingDate ? new Date(validated.loadingDate) : null,
        exportCustoms: validated.exportCustoms || null,
        importCustoms: validated.importCustoms || null,
        price: validated.price,
        company: validated.company,
        isADR: validated.isADR,
        unloadingStops: {
          create: validated.unloadingStops.map(stop => ({
            location: stop.location,
            unloadingDate: stop.unloadingDate ? new Date(stop.unloadingDate) : null,
          })),
        },
      },
      include: {
        unloadingStops: true,
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
    console.error("Error updating tour:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const existingTour = await prisma.contractedTour.findFirst({
      where: {
        id,
        organizationId: authResult.user.organizationId,
      },
    });

    if (!existingTour) {
      return NextResponse.json({ message: "Tour not found" }, { status: 404 });
    }

    await prisma.contractedTour.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tour deleted" });
  } catch (error) {
    console.error("Error deleting tour:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    
    const { parentTourId, driverId, truckId, trailerId } = body;

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

    // If adding to existing tour, verify parent tour exists and is active
    if (parentTourId) {
      const parentTour = await prisma.contractedTour.findFirst({
        where: {
          id: parentTourId,
          organizationId: authResult.user.organizationId,
          isCompleted: false,
        },
      });

      if (!parentTour) {
        return NextResponse.json(
          { message: "Parent tour not found or not active" },
          { status: 404 }
        );
      }
    }

    // Update tour with parent tour and resources
    const tour = await prisma.contractedTour.update({
      where: { id },
      data: {
        parentTourId: parentTourId || null,
        driverId: driverId || null,
        truckId: truckId || null,
        trailerId: trailerId || null,
      },
      include: {
        unloadingStops: true,
        driver: true,
        truck: true,
        trailer: true,
        parentTour: true,
      },
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error("Error updating tour:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
