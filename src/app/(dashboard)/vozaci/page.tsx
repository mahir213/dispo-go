import {
  DriversList,
  DriversContainer,
  DriversLoading,
  DriversHeader,
} from "@/components/drivers";
import { Suspense } from "react";

const Page = () => {
  return (
    <DriversContainer>
      <DriversHeader />
      <Suspense fallback={<DriversLoading />}>
        <DriversList />
      </Suspense>
    </DriversContainer>
  );
};

export default Page;
