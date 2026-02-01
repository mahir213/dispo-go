import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const eventSchema = z.object({
  title: z.string().min(1, "Naziv je obavezan"),
  description: z.string().optional(),
  date: z.string(),
  color: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_calendar");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get custom events
    const customEvents = await prisma.calendarEvent.findMany({
      where: {
        organizationId: authResult.user.organizationId,
        ...(startDate && endDate
          ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      orderBy: { date: "asc" },
    });

    // Get vehicle expiry dates
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: authResult.user.organizationId },
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        registrationExpiryDate: true,
        sixMonthInspectionDate: true,
        ppAparatExpiryDate: true,
      },
    });

    // Get driver expiry dates
    const drivers = await prisma.driver.findMany({
      where: { organizationId: authResult.user.organizationId },
      select: {
        id: true,
        name: true,
        licenseExpiryDate: true,
        medicalExamExpiryDate: true,
        driverCardExpiryDate: true,
      },
    });

    // Get contracted tours (not completed)
    const contractedTours = await prisma.contractedTour.findMany({
      where: {
        organizationId: authResult.user.organizationId,
        isCompleted: false,
      },
      select: {
        id: true,
        company: true,
        loadingLocation: true,
        loadingDate: true,
        tourType: true,
        driverId: true,
        unloadingStops: {
          select: {
            id: true,
            location: true,
            unloadingDate: true,
          },
        },
      },
    });

    // Build events array
    const events: Array<{
      id: string;
      title: string;
      description?: string | null;
      date: Date;
      eventType: string;
      color?: string | null;
      isSystem: boolean;
      sourceType?: string;
      sourceId?: string;
    }> = [];

    // Add custom events
    customEvents.forEach((event) => {
      events.push({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        eventType: event.eventType,
        color: event.color || "#3b82f6",
        isSystem: false,
      });
    });

    // Add vehicle events
    vehicles.forEach((vehicle) => {
      if (vehicle.registrationExpiryDate) {
        events.push({
          id: `vehicle-reg-${vehicle.id}`,
          title: `Istek registracije: ${vehicle.name}`,
          description: `${vehicle.registrationNumber}`,
          date: vehicle.registrationExpiryDate,
          eventType: "VEHICLE_EXPIRY",
          color: "#ef4444",
          isSystem: true,
          sourceType: "vehicle",
          sourceId: vehicle.id,
        });
      }
      if (vehicle.sixMonthInspectionDate) {
        events.push({
          id: `vehicle-insp-${vehicle.id}`,
          title: `Istek tehničkog: ${vehicle.name}`,
          description: `${vehicle.registrationNumber}`,
          date: vehicle.sixMonthInspectionDate,
          eventType: "VEHICLE_EXPIRY",
          color: "#f97316",
          isSystem: true,
          sourceType: "vehicle",
          sourceId: vehicle.id,
        });
      }
      if (vehicle.ppAparatExpiryDate) {
        events.push({
          id: `vehicle-pp-${vehicle.id}`,
          title: `Istek PP aparata: ${vehicle.name}`,
          description: `${vehicle.registrationNumber}`,
          date: vehicle.ppAparatExpiryDate,
          eventType: "VEHICLE_EXPIRY",
          color: "#f97316",
          isSystem: true,
          sourceType: "vehicle",
          sourceId: vehicle.id,
        });
      }
    });

    // Add driver events
    drivers.forEach((driver) => {
      if (driver.licenseExpiryDate) {
        events.push({
          id: `driver-license-${driver.id}`,
          title: `Istek vozačke: ${driver.name}`,
          description: null,
          date: driver.licenseExpiryDate,
          eventType: "DRIVER_EXPIRY",
          color: "#ef4444",
          isSystem: true,
          sourceType: "driver",
          sourceId: driver.id,
        });
      }
      if (driver.medicalExamExpiryDate) {
        events.push({
          id: `driver-medical-${driver.id}`,
          title: `Istek ljekarskog: ${driver.name}`,
          description: null,
          date: driver.medicalExamExpiryDate,
          eventType: "DRIVER_EXPIRY",
          color: "#f97316",
          isSystem: true,
          sourceType: "driver",
          sourceId: driver.id,
        });
      }
      if (driver.driverCardExpiryDate) {
        events.push({
          id: `driver-card-${driver.id}`,
          title: `Istek kartice vozača: ${driver.name}`,
          description: null,
          date: driver.driverCardExpiryDate,
          eventType: "DRIVER_EXPIRY",
          color: "#f97316",
          isSystem: true,
          sourceType: "driver",
          sourceId: driver.id,
        });
      }
    });

    // Add tour events
    contractedTours.forEach((tour) => {
      const tourLabel = tour.driverId ? "Aktivna" : "Ugovorena";
      
      if (tour.loadingDate) {
        events.push({
          id: `tour-load-${tour.id}`,
          title: `Utovar: ${tour.company}`,
          description: `${tourLabel} tura - ${tour.loadingLocation}`,
          date: tour.loadingDate,
          eventType: "TOUR_LOADING",
          color: "#22c55e",
          isSystem: true,
          sourceType: "tour",
          sourceId: tour.id,
        });
      }

      tour.unloadingStops.forEach((stop, index) => {
        if (stop.unloadingDate) {
          events.push({
            id: `tour-unload-${stop.id}`,
            title: `Istovar: ${tour.company}`,
            description: `${tourLabel} tura - ${stop.location}`,
            date: stop.unloadingDate,
            eventType: "TOUR_UNLOADING",
            color: "#8b5cf6",
            isSystem: true,
            sourceType: "tour",
            sourceId: tour.id,
          });
        }
      });
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_calendar");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validated = eventSchema.parse(body);

    const event = await prisma.calendarEvent.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        date: new Date(validated.date),
        eventType: "CUSTOM",
        color: validated.color || "#3b82f6",
        organizationId: authResult.user.organizationId,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating event:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
