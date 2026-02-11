import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const invoiceSchema = z.object({
  isInvoiced: z.boolean(),
  invoiceNumber: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "invoice_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const validated = invoiceSchema.parse(body);

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

    // Check if tour is completed
    if (!existingTour.isCompleted) {
      return NextResponse.json(
        { message: "Samo završene ture mogu biti fakturisane" },
        { status: 400 }
      );
    }

    // Update invoice status
    const tour = await prisma.contractedTour.update({
      where: { id },
      data: {
        isInvoiced: validated.isInvoiced,
        invoiceNumber: validated.invoiceNumber || null,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating invoice status:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
