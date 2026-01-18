import {
  VehiclesList,
  VehiclesContainer,
  VehiclesLoading,
  VehiclesError,
  VehiclesHeader,
} from "@/components/vehicles";
import { requireAuth } from "@/lib/auth-utils";
import { Suspense } from "react";

const Page = async () => {
  await requireAuth();

  return (
    <VehiclesContainer>
      <VehiclesHeader />
      <Suspense fallback={<VehiclesLoading />}>
        <VehiclesList />
      </Suspense>
    </VehiclesContainer>
  );
};

export default Page;
