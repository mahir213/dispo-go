import {
  VehiclesList,
  VehiclesContainer,
  VehiclesLoading,
} from "@/components/vehicles";
import { Suspense } from "react";

const Page = () => {
  return (
    <VehiclesContainer>
      <Suspense fallback={<VehiclesLoading />}>
        <VehiclesList />
      </Suspense>
    </VehiclesContainer>
  );
};

export default Page;
