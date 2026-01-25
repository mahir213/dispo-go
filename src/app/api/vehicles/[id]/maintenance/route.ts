import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const records = await db.maintenanceRecord.findMany({
      where: {
        vehicleId: id,
        vehicle: {
          userId: session.user.id,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching maintenance records:", error);
    return NextResponse.json(
      { message: "Error fetching maintenance records" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { description, date } = body;

    if (!description || !date) {
      return NextResponse.json(
        { message: "Description and date are required" },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    const record = await db.maintenanceRecord.create({
      data: {
        description,
        date: new Date(date),
        vehicleId: id,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json(
      { message: "Error creating maintenance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json(
        { message: "Record ID is required" },
        { status: 400 }
      );
    }

    // Verify record belongs to user's vehicle
    const record = await db.maintenanceRecord.findFirst({
      where: {
        id: recordId,
        vehicleId: id,
        vehicle: {
          userId: session.user.id,
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { message: "Record not found" },
        { status: 404 }
      );
    }

    await db.maintenanceRecord.delete({
      where: {
        id: recordId,
      },
    });

    return NextResponse.json({ message: "Record deleted" });
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    return NextResponse.json(
      { message: "Error deleting maintenance record" },
      { status: 500 }
    );
  }
}
