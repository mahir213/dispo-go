import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { NoteType } from "@prisma/client";
import { checkAuth, requirePermission } from "@/lib/api-auth";

const noteSchema = z.object({
  content: z.string().min(1),
  noteType: z.enum(["POSITIVE", "NEGATIVE"]),
});

// POST kreiranje nove bilješke
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_drivers");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const validated = noteSchema.parse(body);

    // Provjeri da li vozač postoji i pripada organizaciji
    const driver = await prisma.driver.findUnique({
      where: {
        id,
        organizationId: authResult.user.organizationId,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { message: "Vozač nije pronađen" },
        { status: 404 }
      );
    }

    // Kreiraj bilješku
    const note = await prisma.driverNote.create({
      data: {
        content: validated.content,
        noteType: validated.noteType as NoteType,
        driverId: id,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Nevažeći podaci", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating note:", error);
    return NextResponse.json(
      { message: "Greška pri kreiranju bilješke" },
      { status: 500 }
    );
  }

}

// DELETE bilješke
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_drivers");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const { noteId } = await request.json();

    // Provjeri da li bilješka postoji i pripada vozaču i organizaciji
    const note = await prisma.driverNote.findFirst({
      where: {
        id: noteId,
        driver: {
          id,
          organizationId: authResult.user.organizationId,
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { message: "Bilješka nije pronađena" },
        { status: 404 }
      );
    }

    await prisma.driverNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: "Bilješka uspješno obrisana" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { message: "Greška pri brisanju bilješke" },
      { status: 500 }
    );
  }
}
