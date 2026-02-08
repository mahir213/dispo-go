import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const records = await db.maintenanceRecord.findMany({
      where: {
        vehicleId: id,
        vehicle: {
          organizationId: authResult.user.organizationId,
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
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const { description, date } = body;

    if (!description || !date) {
      return NextResponse.json(
        { message: "Description and date are required" },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to organization
    const vehicle = await db.vehicle.findFirst({
      where: {
        id: id,
        organizationId: authResult.user.organizationId,
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
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "edit_vehicles");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json(
        { message: "Record ID is required" },
        { status: 400 }
      );
    }

    // Verify record belongs to organization's vehicle
    const record = await db.maintenanceRecord.findFirst({
      where: {
        id: recordId,
        vehicleId: id,
        vehicle: {
          organizationId: authResult.user.organizationId,
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
