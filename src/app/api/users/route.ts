import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";

// POST - Kreiraj novog korisnika (samo za direktore)
export async function POST(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "manage_users");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Sva polja su obavezna" },
        { status: 400 }
      );
    }

    // Provjeri da li email već postoji
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Korisnik s ovim emailom već postoji" },
        { status: 409 }
      );
    }

    // Kreiraj korisnika pomoću better-auth signUp
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!result || !result.user) {
      return NextResponse.json(
        { error: "Greška pri kreiranju korisnika" },
        { status: 500 }
      );
    }

    // Ažuriraj ulogu korisnika i dodijeli istu organizaciju
    const updatedUser = await db.user.update({
      where: { id: result.user.id },
      data: { 
        role,
        organizationId: authResult.user.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Greška pri kreiranju korisnika" },
      { status: 500 }
    );
  }
}

// GET - Dohvati sve korisnike iz iste organizacije
export async function GET() {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "manage_users");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const users = await db.user.findMany({
      where: {
        organizationId: authResult.user.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Greška pri dohvaćanju korisnika" },
      { status: 500 }
    );
  }
}
