import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { VehicleType } from "@prisma/client";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const vehicleSchema = z.object({
  name: z.string().min(1),
  registrationNumber: z.string().min(1),
  vehicleType: z.enum(["KAMION", "PRIKOLICA"]),
  sixMonthInspectionDate: z.string().optional(),
  registrationExpiryDate: z.string().optional(),
  ppAparatExpiryDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validated = vehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.create({
      data: {
        name: validated.name,
        registrationNumber: validated.registrationNumber,
        vehicleType: validated.vehicleType as VehicleType,
        sixMonthInspectionDate: validated.sixMonthInspectionDate
          ? new Date(validated.sixMonthInspectionDate)
          : null,
        registrationExpiryDate: validated.registrationExpiryDate
          ? new Date(validated.registrationExpiryDate)
          : null,
        ppAparatExpiryDate: validated.ppAparatExpiryDate
          ? new Date(validated.ppAparatExpiryDate)
          : null,
        organizationId: authResult.user.organizationId,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Nevažeći podaci", errors: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Vozilo sa tom registarskom oznakom već postoji" },
        { status: 409 }
      );
    }

    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { message: "Greška pri kreiranju vozila" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      organizationId: authResult.user.organizationId,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { registrationNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.vehicle.count({
      where: whereClause,
    });

    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      include: {
        truckTours: {
          where: {
            isCompleted: false,
          },
          select: {
            id: true,
            tourType: true,
            unloadingStops: {
              orderBy: {
                unloadingDate: "desc",
              },
              take: 1,
            },
          },
        },
        trailerTours: {
          where: {
            isCompleted: false,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Add isAvailable flag and calculate availability date for import tours
    const vehiclesWithAvailability = vehicles.map((vehicle) => {
      // Kamion je slobodan samo ako nema nijednu turu (uvoz, izvoz, medjutura)
      const isAvailable = vehicle.truckTours.length === 0 && vehicle.trailerTours.length === 0;

      // Ako ima dodijeljenu samo UVOZ turu, prikazujemo "slobodan za..."
      let availableDate: string | null = null;
      let onlyUvoz = false;
      if (vehicle.vehicleType === "KAMION" && vehicle.truckTours.length > 0) {
        // Provjeri da li su sve ture UVOZ
        onlyUvoz = vehicle.truckTours.every(tour => tour.tourType === "UVOZ");
        if (onlyUvoz) {
          const lastUnloadingDates = vehicle.truckTours
            .map(tour => tour.unloadingStops[0]?.unloadingDate)
            .filter((date): date is Date => date !== null && date !== undefined);
          if (lastUnloadingDates.length > 0) {
            const latestDate = lastUnloadingDates.reduce((latest, current) =>
              current > latest ? current : latest
            );
            availableDate = latestDate.toISOString();
          }
        }
      }

      return {
        ...vehicle,
        isAvailable,
        availableDate: onlyUvoz ? availableDate : null,
        truckTours: undefined,
        trailerTours: undefined,
        tourType: onlyUvoz && vehicle.truckTours.length > 0 ? "UVOZ" : undefined,
      };
    });

    return NextResponse.json({
      vehicles: vehiclesWithAvailability,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju vozila" },
      { status: 500 }
    );
  }
}
