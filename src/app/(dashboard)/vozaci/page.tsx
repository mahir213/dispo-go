import {
  DriversList,
  DriversContainer,
  DriversLoading,
  DriversError,
  DriversHeader,
} from "@/components/drivers";
import { requireAuth } from "@/lib/auth-utils";
import { Suspense } from "react";

const Page = async () => {
  await requireAuth();

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
