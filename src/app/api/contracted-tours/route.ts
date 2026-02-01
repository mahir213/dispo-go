import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { TourType } from "@prisma/client";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const unloadingStopSchema = z.object({
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

export async function POST(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validated = tourSchema.parse(body);

    const tour = await prisma.contractedTour.create({
      data: {
        tourType: validated.tourType as TourType,
        loadingLocation: validated.loadingLocation,
        loadingDate: validated.loadingDate ? new Date(validated.loadingDate) : null,
        exportCustoms: validated.exportCustoms || null,
        importCustoms: validated.importCustoms || null,
        price: validated.price,
        company: validated.company,
        isADR: validated.isADR,
        organizationId: authResult.user.organizationId,
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
    console.error("Error creating tour:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const tours = await prisma.contractedTour.findMany({
      where: {
        organizationId: authResult.user.organizationId,
      },
      include: {
        unloadingStops: {
          orderBy: {
            createdAt: "asc",
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        truck: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            vehicleType: true,
          },
        },
        trailer: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
            vehicleType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tours);
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
