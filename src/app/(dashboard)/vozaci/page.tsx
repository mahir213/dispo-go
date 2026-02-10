import {
  DriversList,
  DriversContainer,
  DriversLoading,
} from "@/components/drivers";
import { Suspense } from "react";

const Page = () => {
  return (
    <DriversContainer>
      <Suspense fallback={<DriversLoading />}>
        <DriversList />
      </Suspense>
    </DriversContainer>
  );
};

export default Page;
