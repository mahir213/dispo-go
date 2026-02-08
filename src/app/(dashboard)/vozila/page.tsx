import {
  VehiclesList,
  VehiclesContainer,
  VehiclesLoading,
  VehiclesHeader,
} from "@/components/vehicles";
import { Suspense } from "react";

const Page = () => {
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
