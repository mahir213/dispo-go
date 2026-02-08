import { EventsCalendar } from "@/components/events-calendar";
import { CalendarDays, PlusIcon } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="flex flex-col h-full">
      <EventsHeader />
      <EventsCalendar />
    </div>
  );
}

function EventsHeader() {
  return (
    <div className="flex items-center justify-between max-w-7xl mx-auto px-8 py-6 border-b w-full">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Događaji</h1>
          <p className="text-sm text-muted-foreground">Kalendar svih bitnih datuma</p>
        </div>
      </div>
    </div>
  );
}
