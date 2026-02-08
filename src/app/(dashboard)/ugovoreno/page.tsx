import {
  ContractedToursList,
  ContractedToursContainer,
  ContractedToursLoading,
  ContractedToursHeader,
} from "@/components/contracted-tours";
import { Suspense } from "react";

const Page = () => {
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
