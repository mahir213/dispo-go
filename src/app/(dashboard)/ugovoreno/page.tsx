import {
  ContractedToursList,
  ContractedToursContainer,
  ContractedToursLoading,
  ContractedToursHeader,
} from "@/components/contracted-tours";
import { requireAuth } from "@/lib/auth-utils";
import { Suspense } from "react";

const Page = async () => {
  await requireAuth();

  return (
    <ContractedToursContainer>
      <ContractedToursHeader />
      <Suspense fallback={<ContractedToursLoading />}>
        <ContractedToursList />
      </Suspense>
    </ContractedToursContainer>
  );
};

export default Page;
