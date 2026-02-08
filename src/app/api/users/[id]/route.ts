import { NextResponse } from "next/server";
import db from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";

// PATCH - Ažuriraj ulogu korisnika
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "manage_users");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    // Ne dopusti promjenu vlastite uloge
    if (id === authResult.user.id) {
      return NextResponse.json(
        { error: "Ne možete promijeniti vlastitu ulogu" },
        { status: 400 }
      );
    }

    // Provjeri da li korisnik pripada istoj organizaciji
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!targetUser || targetUser.organizationId !== authResult.user.organizationId) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: "Uloga je obavezna" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Greška pri ažuriranju korisnika" },
      { status: 500 }
    );
  }
}

// DELETE - Obriši korisnika
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "manage_users");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    // Ne dopusti brisanje sebe
    if (id === authResult.user.id) {
      return NextResponse.json(
        { error: "Ne možete obrisati vlastiti račun" },
        { status: 400 }
      );
    }

    // Provjeri da li korisnik pripada istoj organizaciji
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!targetUser || targetUser.organizationId !== authResult.user.organizationId) {
      return NextResponse.json(
        { error: "Korisnik nije pronađen" },
        { status: 404 }
      );
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Greška pri brisanju korisnika" },
      { status: 500 }
    );
  }
}
