import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  TourHistory,
  TourHistoryHeader,
  TourHistoryContainer,
} from "@/components/tour-history";

export default async function HistorijaPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <TourHistoryContainer>
      <TourHistoryHeader />
      <TourHistory />
    </TourHistoryContainer>
  );
}
