import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { DriverDetailClient } from "@/components/driver-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DriverDetailPage = async ({ params }: PageProps) => {
  const session = await requireAuth();
  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!driver) {
    notFound();
  }

  // Serijalizuj datume kao ISO stringove
  const serializedDriver = {
    ...driver,
    licenseExpiryDate: driver.licenseExpiryDate?.toISOString() || null,
    medicalExamExpiryDate: driver.medicalExamExpiryDate?.toISOString() || null,
    driverCardExpiryDate: driver.driverCardExpiryDate?.toISOString() || null,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
    notes: driver.notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
  };

  return <DriverDetailClient driver={serializedDriver} />;
};

export default DriverDetailPage;
