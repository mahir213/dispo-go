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

export async function GET(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "40");
    const search = searchParams.get("search") || "";
    const filterCompleted = searchParams.get("filterCompleted");
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      organizationId: authResult.user.organizationId,
    };

    // Filter by completion status if specified
    if (filterCompleted === "true") {
      whereClause.isCompleted = true;
    } else if (filterCompleted === "false") {
      whereClause.isCompleted = false;
    }

    if (search) {
      whereClause.OR = [
        { company: { contains: search, mode: "insensitive" } },
        { loadingLocation: { contains: search, mode: "insensitive" } },
        { exportCustoms: { contains: search, mode: "insensitive" } },
        { importCustoms: { contains: search, mode: "insensitive" } },
        { driver: { name: { contains: search, mode: "insensitive" } } },
        { truck: { registrationNumber: { contains: search, mode: "insensitive" } } },
        { truck: { name: { contains: search, mode: "insensitive" } } },
        { trailer: { registrationNumber: { contains: search, mode: "insensitive" } } },
        { trailer: { name: { contains: search, mode: "insensitive" } } },
        { 
          unloadingStops: { 
            some: { 
              location: { contains: search, mode: "insensitive" } 
            } 
          } 
        },
      ];
    }

    // Get total count for pagination
    const total = await prisma.contractedTour.count({
      where: whereClause,
    });

    const tours = await prisma.contractedTour.findMany({
      where: whereClause,
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
      skip,
      take: limit,
    });

    return NextResponse.json({
      tours,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
