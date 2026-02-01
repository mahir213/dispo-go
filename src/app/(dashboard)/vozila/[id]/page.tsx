import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { VehicleDetailClient } from "@/components/vehicle-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

const VehicleDetailPage = async ({ params }: PageProps) => {
  const session = await requireAuth();
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
  });

  if (!vehicle) {
    notFound();
  }

  // Serijalizuj datume kao ISO stringove
  const serializedVehicle = {
    ...vehicle,
    sixMonthInspectionDate: vehicle.sixMonthInspectionDate?.toISOString() || null,
    registrationExpiryDate: vehicle.registrationExpiryDate?.toISOString() || null,
    ppAparatExpiryDate: vehicle.ppAparatExpiryDate?.toISOString() || null,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };

  return <VehicleDetailClient vehicle={serializedVehicle} />;
};

export default VehicleDetailPage;
