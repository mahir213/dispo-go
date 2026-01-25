import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
        userId: session.user.id,
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const drivers = await prisma.driver.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        notes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { message: "Greška pri učitavanju vozača" },
      { status: 500 }
    );
  }
}
