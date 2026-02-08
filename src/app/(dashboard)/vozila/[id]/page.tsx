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
    include: {
      truckTours: {
        where: {
          isCompleted: false,
        },
        select: {
          id: true,
        },
      },
      trailerTours: {
        where: {
          isCompleted: false,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  // Calculate availability
  const isAvailable = vehicle.truckTours.length === 0 && vehicle.trailerTours.length === 0;

  // Serijalizuj datume kao ISO stringove
  const serializedVehicle = {
    ...vehicle,
    sixMonthInspectionDate: vehicle.sixMonthInspectionDate?.toISOString() || null,
    registrationExpiryDate: vehicle.registrationExpiryDate?.toISOString() || null,
    ppAparatExpiryDate: vehicle.ppAparatExpiryDate?.toISOString() || null,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
    isAvailable,
    truckTours: undefined,
    trailerTours: undefined,
  };

  return <VehicleDetailClient vehicle={serializedVehicle} />;
};

export default VehicleDetailPage;
