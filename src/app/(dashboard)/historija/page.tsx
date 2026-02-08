import {
  TourHistory,
  TourHistoryHeader,
  TourHistoryContainer,
} from "@/components/tour-history";

export default function HistorijaPage() {
  return (
    <TourHistoryContainer>
      <TourHistoryHeader />
      <TourHistory />
    </TourHistoryContainer>
  );
}
