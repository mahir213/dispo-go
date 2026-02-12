import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const driverSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  licenseNumber: z.string().min(1),
  licenseExpiryDate: z.string().optional(),
  medicalExamExpiryDate: z.string().optional(),
  driverCardExpiryDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_drivers");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const validated = driverSchema.parse(body);

    const driver = await prisma.driver.create({
      data: {
        name: validated.name,
        phoneNumber: validated.phoneNumber,
        email: validated.email || null,
        licenseNumber: validated.licenseNumber,
        licenseExpiryDate: validated.licenseExpiryDate
          ? new Date(validated.licenseExpiryDate)
          : null,
        medicalExamExpiryDate: validated.medicalExamExpiryDate
          ? new Date(validated.medicalExamExpiryDate)
          : null,
        driverCardExpiryDate: validated.driverCardExpiryDate
          ? new Date(validated.driverCardExpiryDate)
          : null,
        organizationId: authResult.user.organizationId,
      },
      include: {
        notes: true,
      },
    });

    return NextResponse.json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Nevažeći podaci", errors: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { message: "Vozač s tim brojem dozvole već postoji" },
        { status: 409 }
      );
    }

    console.error("Error creating driver:", error);
    return NextResponse.json(
      { message: "Greška pri kreiranju vozača" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_drivers");
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
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { licenseNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.driver.count({
      where: whereClause,
    });

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        notes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      drivers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju vozača" },
      { status: 500 }
    );
  }
}
