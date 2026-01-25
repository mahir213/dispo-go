import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { NoteType } from "@prisma/client";

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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = noteSchema.parse(body);

    // Provjeri da li vozač postoji i pripada korisniku
    const driver = await prisma.driver.findUnique({
      where: {
        id,
        userId: session.user.id,
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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { noteId } = await request.json();

    // Provjeri da li bilješka postoji i pripada vozaču i korisniku
    const note = await prisma.driverNote.findFirst({
      where: {
        id: noteId,
        driver: {
          id,
          userId: session.user.id,
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
